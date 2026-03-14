const Trade = require('../models/Trade');
const Wallet = require('../models/Wallet');
const Escrow = require('../models/Escrow');
const Transaction = require('../models/Transaction');

/**
 * Settlement Service
 * Handles trade settlement and fund release from escrow
 */

/**
 * Settle a trade (release funds from escrow)
 * @param {string} tradeId - Trade ID
 * @returns {Promise<object>}
 */
async function settleTrade(tradeId) {
  try {
    const trade = await Trade.findById(tradeId).populate('walletId');
    
    if (!trade) {
      throw new Error('Trade not found');
    }

    if (trade.status !== 'executed') {
      throw new Error('Trade must be executed before settlement');
    }

    const wallet = await Wallet.findById(trade.walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const escrow = await Escrow.findOne({ masterEscrowId: wallet.masterEscrowId });
    if (!escrow) {
      throw new Error('Escrow account not found');
    }

    // Remove from pending trades
    escrow.pendingTrades = escrow.pendingTrades.filter(
      id => id.toString() !== tradeId
    );

    // Add to settled trades
    escrow.settledTrades.push(tradeId);

    // Update escrow balance
    if (trade.type === 'buy') {
      // For buy orders, funds were already deducted, just confirm settlement
      escrow.totalBalance -= trade.totalAmount + (trade.fees || 0);
    } else {
      // For sell orders, add proceeds to escrow (will be released to wallet)
      escrow.totalBalance += trade.totalAmount - (trade.fees || 0);
    }

    await escrow.save();

    // Update wallet balance
    let settlementAmount = 0;
    if (trade.type === 'buy') {
      // Buy: balance already reduced, just update holdings
      // (Holdings would be tracked in a separate Portfolio model)
      settlementAmount = -(trade.totalAmount + (trade.fees || 0));
    } else {
      // Sell: add proceeds to wallet
      settlementAmount = trade.totalAmount - (trade.fees || 0);
      wallet.balance += settlementAmount;
    }

    await wallet.save();

    // Create settlement transaction record
    await Transaction.create({
      walletId: wallet._id,
      userId: trade.userId,
      type: trade.type === 'buy' ? 'trade_buy' : 'trade_sell',
      amount: Math.abs(settlementAmount),
      method: 'settlement',
      reference: generateSettlementReference(),
      description: `Trade settlement: ${trade.type.toUpperCase()} ${trade.quantity} ${trade.assetSymbol}`,
      status: 'completed',
      processedAt: new Date(),
      metadata: {
        tradeId: trade._id,
        assetSymbol: trade.assetSymbol,
        quantity: trade.quantity,
        price: trade.price,
        fees: trade.fees
      }
    });

    // Update trade status
    trade.status = 'settled';
    trade.settledAt = new Date();
    trade.settlementReference = generateSettlementReference();
    await trade.save();

    return {
      success: true,
      tradeId: trade._id,
      settlementReference: trade.settlementReference,
      settledAt: trade.settledAt
    };
  } catch (error) {
    console.error('❌ Settlement error:', error);
    throw error;
  }
}

/**
 * Settle multiple trades (batch settlement)
 * @param {Array<string>} tradeIds
 * @returns {Promise<Array>}
 */
async function settleMultipleTrades(tradeIds) {
  const results = [];
  for (const tradeId of tradeIds) {
    try {
      const result = await settleTrade(tradeId);
      results.push({ tradeId, success: true, ...result });
    } catch (error) {
      results.push({ tradeId, success: false, error: error.message });
    }
  }
  return results;
}

/**
 * Auto-settle executed trades (for cron job)
 * @param {number} hoursOld - Settle trades older than X hours
 * @returns {Promise<number>} Number of trades settled
 */
async function autoSettleTrades(hoursOld = 24) {
  try {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    
    const trades = await Trade.find({
      status: 'executed',
      executedAt: { $lte: cutoffTime }
    });

    let settledCount = 0;
    for (const trade of trades) {
      try {
        await settleTrade(trade._id);
        settledCount++;
      } catch (error) {
        console.error(`Failed to settle trade ${trade._id}:`, error.message);
      }
    }

    console.log(`✅ Auto-settled ${settledCount} trades`);
    return settledCount;
  } catch (error) {
    console.error('❌ Auto-settlement error:', error);
    throw error;
  }
}

/**
 * Generate settlement reference
 * @returns {string}
 */
function generateSettlementReference() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `STL-${timestamp}-${random}`;
}

module.exports = {
  settleTrade,
  settleMultipleTrades,
  autoSettleTrades
};
