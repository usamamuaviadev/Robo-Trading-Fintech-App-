const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const MinorWallet = require('../models/MinorWallet');
const Wallet = require('../models/Wallet');
const Escrow = require('../models/Escrow');

const router = express.Router();

/**
 * @route   POST /api/minor-wallets/create
 * @desc    Create a wallet for a minor
 * @access  Private
 */
router.post('/create',
  authenticate,
  [
    body('minorName').notEmpty().withMessage('Minor name is required'),
    body('minorBirthDate').isISO8601().withMessage('Valid birth date is required')
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

      const { minorName, minorBirthDate, spendingLimit, monthlyAllowance } = req.body;

      // Create master escrow if doesn't exist
      let masterEscrow = await Escrow.findOne({ status: 'active' });
      if (!masterEscrow) {
        masterEscrow = await Escrow.create({
          masterEscrowId: `ESCROW-${Date.now()}`,
          totalBalance: 0,
          status: 'active'
        });
      }

      // Create wallet for minor
      const wallet = await Wallet.create({
        userId: req.user._id, // Parent's ID
        masterEscrowId: masterEscrow.masterEscrowId,
        subAccountId: `MINOR-${req.user._id}-${Date.now()}`,
        balance: 0,
        currency: 'SAR',
        status: 'active'
      });

      // Create minor wallet record
      const minorWallet = await MinorWallet.create({
        minorName,
        minorBirthDate: new Date(minorBirthDate),
        parentId: req.user._id,
        walletId: wallet._id,
        spendingLimit: spendingLimit || 0,
        monthlyAllowance: monthlyAllowance || 0,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: 'Minor wallet created successfully',
        data: {
          minorWallet,
          wallet: {
            id: wallet._id,
            subAccountId: wallet.subAccountId,
            balance: wallet.balance
          }
        }
      });
    } catch (error) {
      console.error('Create minor wallet error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create minor wallet'
      });
    }
  }
);

/**
 * @route   GET /api/minor-wallets
 * @desc    Get all minor wallets for parent
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const minorWallets = await MinorWallet.find({ parentId: req.user._id })
      .populate('walletId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { minorWallets }
    });
  } catch (error) {
    console.error('Get minor wallets error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get minor wallets'
    });
  }
});

/**
 * @route   GET /api/minor-wallets/:id
 * @desc    Get minor wallet details
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const minorWallet = await MinorWallet.findOne({
      _id: req.params.id,
      parentId: req.user._id
    }).populate('walletId');

    if (!minorWallet) {
      return res.status(404).json({
        success: false,
        message: 'Minor wallet not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { minorWallet }
    });
  } catch (error) {
    console.error('Get minor wallet error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get minor wallet'
    });
  }
});

/**
 * @route   PUT /api/minor-wallets/:id
 * @desc    Update minor wallet
 * @access  Private
 */
router.put('/:id',
  authenticate,
  [
    body('spendingLimit').optional().isFloat({ min: 0 }),
    body('monthlyAllowance').optional().isFloat({ min: 0 })
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

      const minorWallet = await MinorWallet.findOne({
        _id: req.params.id,
        parentId: req.user._id
      });

      if (!minorWallet) {
        return res.status(404).json({
          success: false,
          message: 'Minor wallet not found'
        });
      }

      const { spendingLimit, monthlyAllowance } = req.body;
      if (spendingLimit !== undefined) minorWallet.spendingLimit = spendingLimit;
      if (monthlyAllowance !== undefined) minorWallet.monthlyAllowance = monthlyAllowance;

      await minorWallet.save();

      res.status(200).json({
        success: true,
        message: 'Minor wallet updated successfully',
        data: { minorWallet }
      });
    } catch (error) {
      console.error('Update minor wallet error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update minor wallet'
      });
    }
  }
);

/**
 * @route   POST /api/minor-wallets/:id/fund
 * @desc    Fund a minor's wallet
 * @access  Private
 */
router.post('/:id/fund',
  authenticate,
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')
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

      const minorWallet = await MinorWallet.findOne({
        _id: req.params.id,
        parentId: req.user._id
      }).populate('walletId');

      if (!minorWallet) {
        return res.status(404).json({
          success: false,
          message: 'Minor wallet not found'
        });
      }

      const { amount } = req.body;

      // Get parent's wallet
      const parentWallet = await Wallet.findOne({ userId: req.user._id });
      if (!parentWallet || parentWallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance in parent wallet'
        });
      }

      // Transfer funds
      parentWallet.balance -= amount;
      minorWallet.walletId.balance += amount;
      await parentWallet.save();
      await minorWallet.walletId.save();

      res.status(200).json({
        success: true,
        message: 'Minor wallet funded successfully',
        data: {
          amount,
          newBalance: minorWallet.walletId.balance
        }
      });
    } catch (error) {
      console.error('Fund minor wallet error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fund minor wallet'
      });
    }
  }
);

module.exports = router;
