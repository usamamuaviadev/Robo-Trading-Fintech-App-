const Wallet = require('../models/Wallet');
const Escrow = require('../models/Escrow');
const Transaction = require('../models/Transaction');
const Trade = require('../models/Trade');

/**
 * Reconciliation Service
 * Handles balance reconciliation between wallets, sub-accounts, and master escrow
 * Ensures fund isolation and data integrity
 */

/**
 * Reconcile all wallets with their master escrow
 * @returns {Promise<object>} Reconciliation report
 */
async function reconcileAll() {
  try {
    const escrows = await Escrow.find({ status: 'active' });
    const reconciliationReport = {
      timestamp: new Date(),
      escrows: [],
      discrepancies: [],
      summary: {
        totalEscrows: 0,
        totalWallets: 0,
        totalDiscrepancies: 0,
        totalEscrowBalance: 0,
        totalWalletBalance: 0
      }
    };

    for (const escrow of escrows) {
      const wallets = await Wallet.find({ 
        masterEscrowId: escrow.masterEscrowId,
        status: 'active'
      });

      // Calculate sum of all wallet balances for this escrow
      const walletBalanceSum = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

      // Calculate expected escrow balance (sum of all sub-account balances)
      const expectedEscrowBalance = walletBalanceSum;

      // Check for discrepancies
      const discrepancy = escrow.totalBalance - expectedEscrowBalance;
      const hasDiscrepancy = Math.abs(discrepancy) > 0.01; // Allow 0.01 tolerance for floating point

      const escrowReport = {
        masterEscrowId: escrow.masterEscrowId,
        escrowBalance: escrow.totalBalance,
        expectedBalance: expectedEscrowBalance,
        discrepancy: discrepancy,
        hasDiscrepancy: hasDiscrepancy,
        walletCount: wallets.length,
        wallets: wallets.map(w => ({
          subAccountId: w.subAccountId,
          userId: w.userId,
          balance: w.balance,
          currency: w.currency,
          status: w.status
        }))
      };

      reconciliationReport.escrows.push(escrowReport);
      reconciliationReport.summary.totalEscrows++;
      reconciliationReport.summary.totalWallets += wallets.length;
      reconciliationReport.summary.totalEscrowBalance += escrow.totalBalance;
      reconciliationReport.summary.totalWalletBalance += walletBalanceSum;

      if (hasDiscrepancy) {
        reconciliationReport.discrepancies.push({
          masterEscrowId: escrow.masterEscrowId,
          discrepancy: discrepancy,
          escrowBalance: escrow.totalBalance,
          expectedBalance: expectedEscrowBalance,
          severity: Math.abs(discrepancy) > 1000 ? 'high' : 'medium'
        });
        reconciliationReport.summary.totalDiscrepancies++;
      }
    }

    return {
      success: true,
      report: reconciliationReport
    };
  } catch (error) {
    console.error('Reconciliation error:', error);
    throw error;
  }
}

/**
 * Reconcile a specific master escrow
 * @param {string} masterEscrowId - Master escrow ID
 * @returns {Promise<object>} Reconciliation report for specific escrow
 */
async function reconcileEscrow(masterEscrowId) {
  try {
    const escrow = await Escrow.findOne({ masterEscrowId });
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    const wallets = await Wallet.find({ 
      masterEscrowId: escrow.masterEscrowId,
      status: 'active'
    });

    const walletBalanceSum = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const discrepancy = escrow.totalBalance - walletBalanceSum;
    const hasDiscrepancy = Math.abs(discrepancy) > 0.01;

    return {
      success: true,
      report: {
        timestamp: new Date(),
        masterEscrowId: escrow.masterEscrowId,
        escrowBalance: escrow.totalBalance,
        expectedBalance: walletBalanceSum,
        discrepancy: discrepancy,
        hasDiscrepancy: hasDiscrepancy,
        walletCount: wallets.length,
        wallets: wallets.map(w => ({
          subAccountId: w.subAccountId,
          userId: w.userId,
          balance: w.balance,
          currency: w.currency,
          status: w.status
        }))
      }
    };
  } catch (error) {
    console.error('Escrow reconciliation error:', error);
    throw error;
  }
}

/**
 * Reconcile a specific user's wallet
 * @param {string} userId - User ID
 * @returns {Promise<object>} Reconciliation report for user wallet
 */
async function reconcileUserWallet(userId) {
  try {
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const escrow = await Escrow.findOne({ masterEscrowId: wallet.masterEscrowId });
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    // Get all transactions for this wallet
    const transactions = await Transaction.find({ walletId: wallet._id });
    
    // Calculate expected balance from transactions
    let expectedBalance = 0;
    for (const tx of transactions) {
      if (tx.status === 'completed' || tx.status === 'processing') {
        if (tx.type === 'deposit') {
          expectedBalance += tx.amount;
        } else if (tx.type === 'withdrawal') {
          expectedBalance -= tx.amount;
        }
      }
    }

    // Get trade settlements
    const trades = await Trade.find({ 
      walletId: wallet._id,
      status: { $in: ['executed', 'settled'] }
    });

    for (const trade of trades) {
      if (trade.type === 'buy') {
        expectedBalance -= (trade.totalAmount + (trade.fees || 0));
      } else if (trade.type === 'sell') {
        expectedBalance += (trade.totalAmount - (trade.fees || 0));
      }
    }

    const discrepancy = wallet.balance - expectedBalance;
    const hasDiscrepancy = Math.abs(discrepancy) > 0.01;

    return {
      success: true,
      report: {
        timestamp: new Date(),
        userId: userId,
        subAccountId: wallet.subAccountId,
        masterEscrowId: wallet.masterEscrowId,
        currentBalance: wallet.balance,
        expectedBalance: expectedBalance,
        discrepancy: discrepancy,
        hasDiscrepancy: hasDiscrepancy,
        transactionCount: transactions.length,
        tradeCount: trades.length
      }
    };
  } catch (error) {
    console.error('User wallet reconciliation error:', error);
    throw error;
  }
}

/**
 * Auto-fix minor discrepancies (within tolerance)
 * @param {string} masterEscrowId - Master escrow ID
 * @param {number} tolerance - Tolerance amount (default 0.01)
 * @returns {Promise<object>} Fix result
 */
async function autoFixDiscrepancy(masterEscrowId, tolerance = 0.01) {
  try {
    const escrow = await Escrow.findOne({ masterEscrowId });
    if (!escrow) {
      throw new Error('Escrow not found');
    }

    const wallets = await Wallet.find({ 
      masterEscrowId: escrow.masterEscrowId,
      status: 'active'
    });

    const walletBalanceSum = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const discrepancy = escrow.totalBalance - walletBalanceSum;

    if (Math.abs(discrepancy) <= tolerance) {
      // Auto-fix: adjust escrow balance to match sum of wallets
      escrow.totalBalance = walletBalanceSum;
      await escrow.save();

      return {
        success: true,
        message: 'Discrepancy auto-fixed',
        discrepancy: discrepancy,
        adjustedBalance: walletBalanceSum
      };
    } else {
      return {
        success: false,
        message: 'Discrepancy too large for auto-fix',
        discrepancy: discrepancy,
        tolerance: tolerance
      };
    }
  } catch (error) {
    console.error('Auto-fix error:', error);
    throw error;
  }
}

module.exports = {
  reconcileAll,
  reconcileEscrow,
  reconcileUserWallet,
  autoFixDiscrepancy
};
