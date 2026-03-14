const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const Trade = require('../models/Trade');
const Wallet = require('../models/Wallet');
const Escrow = require('../models/Escrow');
const { checkHalalStatus } = require('../services/zoyaService');
const { getAssetPrice } = require('../services/marketDataService');
const { settleTrade } = require('../services/settlementService');

const router = express.Router();

/**
 * @route   POST /api/trades/execute
 * @desc    Execute a trade (buy/sell)
 * @access  Private
 */
router.post('/execute',
  authenticate,
  [
    body('assetId').notEmpty().withMessage('Asset ID is required'),
    body('assetSymbol').notEmpty().withMessage('Asset symbol is required'),
    body('type').isIn(['buy', 'sell']).withMessage('Type must be buy or sell'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { assetId, assetSymbol, assetName, type, quantity, price } = req.body;

      // Get wallet
      const wallet = await Wallet.findOne({ userId: req.user._id });
      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Wallet not found. Please create a wallet first.'
        });
      }

      // Get current price if not provided
      let currentPrice = price;
      if (!currentPrice) {
        try {
          const priceData = await getAssetPrice(assetSymbol);
          currentPrice = priceData.price;
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: `Failed to get price for ${assetSymbol}`
          });
        }
      }

      const totalAmount = quantity * currentPrice;
      const fees = totalAmount * 0.001; // 0.1% fee
      const totalWithFees = totalAmount + fees;

      // Check halal status via Zoya API
      const halalCheck = await checkHalalStatus(assetSymbol, 'stock');
      if (!halalCheck.isHalal) {
        return res.status(400).json({
          success: false,
          message: `Asset ${assetSymbol} is not halal certified`,
          halalStatus: halalCheck
        });
      }

      // For buy orders, check balance
      if (type === 'buy') {
        if (wallet.balance < totalWithFees) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient balance',
            required: totalWithFees,
            available: wallet.balance
          });
        }

        // Reserve funds in escrow
        wallet.balance -= totalWithFees;
        await wallet.save();

        const escrow = await Escrow.findOne({ masterEscrowId: wallet.masterEscrowId });
        if (escrow) {
          escrow.totalBalance += totalWithFees;
          escrow.pendingTrades.push(null); // Will be updated after trade creation
          await escrow.save();
        }
      }

      // Create trade
      const trade = await Trade.create({
        userId: req.user._id,
        walletId: wallet._id,
        assetId,
        assetSymbol: assetSymbol.toUpperCase(),
        assetName: assetName || assetSymbol,
        type,
        quantity,
        price: currentPrice,
        totalAmount,
        fees,
        status: 'pending',
        isHalal: halalCheck.isHalal,
        halalVerifiedAt: new Date()
      });

      // Update escrow pending trades
      if (type === 'buy') {
        const escrow = await Escrow.findOne({ masterEscrowId: wallet.masterEscrowId });
        if (escrow) {
          const index = escrow.pendingTrades.findIndex(t => t === null);
          if (index !== -1) {
            escrow.pendingTrades[index] = trade._id;
          } else {
            escrow.pendingTrades.push(trade._id);
          }
          await escrow.save();
        }
      }

      // Execute trade immediately (in production, this might go through broker API)
      trade.status = 'executed';
      trade.executedAt = new Date();
      await trade.save();

      res.status(201).json({
        success: true,
        message: 'Trade executed successfully',
        data: {
          tradeId: trade._id,
          assetSymbol: trade.assetSymbol,
          type: trade.type,
          quantity: trade.quantity,
          price: trade.price,
          totalAmount: trade.totalAmount,
          fees: trade.fees,
          status: trade.status,
          isHalal: trade.isHalal,
          executedAt: trade.executedAt
        }
      });
    } catch (error) {
      console.error('Execute trade error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to execute trade'
      });
    }
  }
);

/**
 * @route   GET /api/trades
 * @desc    Get user's trade history
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    const trades = await Trade.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Trade.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        trades,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get trades'
    });
  }
});

/**
 * @route   GET /api/trades/:tradeId
 * @desc    Get trade details
 * @access  Private
 */
router.get('/:tradeId', authenticate, async (req, res) => {
  try {
    const trade = await Trade.findOne({
      _id: req.params.tradeId,
      userId: req.user._id
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { trade }
    });
  } catch (error) {
    console.error('Get trade error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get trade'
    });
  }
});

/**
 * @route   POST /api/trades/:tradeId/settle
 * @desc    Settle a trade (release funds from escrow)
 * @access  Private
 */
router.post('/:tradeId/settle', authenticate, async (req, res) => {
  try {
    const trade = await Trade.findOne({
      _id: req.params.tradeId,
      userId: req.user._id
    });

    if (!trade) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found'
      });
    }

    const result = await settleTrade(trade._id);

    res.status(200).json({
      success: true,
      message: 'Trade settled successfully',
      data: result
    });
  } catch (error) {
    console.error('Settle trade error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to settle trade'
    });
  }
});

module.exports = router;
