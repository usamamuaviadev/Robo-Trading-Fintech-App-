const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const Wallet = require('../models/Wallet');
const Escrow = require('../models/Escrow');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Referral = require('../models/Referral');
const affiliateService = require('../services/affiliateService');

const router = express.Router();

/**
 * Helper function to ensure wallet exists for a user
 * Creates wallet if it doesn't exist
 */
async function ensureWalletExists(userId) {
  let wallet = await Wallet.findOne({ userId });
  
  if (!wallet) {
    // Create wallet if doesn't exist
    const masterEscrow = await Escrow.findOne({ status: 'active' }) || 
      await Escrow.create({
        masterEscrowId: `ESCROW-${Date.now()}`,
        totalBalance: 0,
        status: 'active'
      });

    wallet = await Wallet.create({
      userId,
      masterEscrowId: masterEscrow.masterEscrowId,
      subAccountId: `SUB-${userId}-${Date.now()}`,
      balance: 0,
      currency: 'SAR',
      status: 'active'
    });
    
    console.log(`✅ Created wallet for user ${userId}: ${wallet.subAccountId}`);
  }
  
  return wallet;
}

/**
 * @route   GET /api/wallet/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/balance', authenticate, async (req, res) => {
  try {
    const wallet = await ensureWalletExists(req.user._id);

    // Get master escrow info
    const masterEscrow = await Escrow.findOne({ masterEscrowId: wallet.masterEscrowId });

    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
        subAccountId: wallet.subAccountId,
        masterEscrowId: wallet.masterEscrowId,
        masterEscrowBalance: masterEscrow?.totalBalance || 0,
        status: wallet.status
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get balance'
    });
  }
});

/**
 * @route   POST /api/wallet/deposit
 * @desc    Create deposit transaction
 * @access  Private
 */
router.post('/deposit',
  authenticate,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('method')
      .isIn(['bank_transfer', 'card', 'iban'])
      .withMessage('Invalid payment method'),
    body('reference')
      .optional()
      .trim()
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

      const { amount, method, reference, description } = req.body;

      // Ensure wallet exists (create if doesn't exist)
      const wallet = await ensureWalletExists(req.user._id);

      // Create transaction
      const transaction = await Transaction.create({
        walletId: wallet._id,
        userId: req.user._id,
        type: 'deposit',
        amount,
        method,
        reference: reference || `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: description || 'Deposit',
        status: 'pending'
      });

      // In production, this would integrate with payment gateway
      // For now, auto-complete after 1 second (simulation)
      setTimeout(async () => {
        try {
          transaction.status = 'completed';
          transaction.processedAt = new Date();
          await transaction.save();

          // Update wallet balance
          wallet.balance += amount;
          await wallet.save();

          // Update escrow
          const escrow = await Escrow.findOne({ masterEscrowId: wallet.masterEscrowId });
          if (escrow) {
            escrow.totalBalance += amount;
            await escrow.save();
          }

          // Check if this is user's first deposit and activate referral
          const user = await User.findById(req.user._id);
          if (user && user.referredBy) {
            const referral = await Referral.findOne({ 
              referredId: req.user._id,
              status: 'pending'
            });
            
            if (referral && !referral.hasDeposited) {
              try {
                await affiliateService.activateReferral(referral._id, amount);
              } catch (error) {
                console.error('Error activating referral:', error);
              }
            }
          }
        } catch (error) {
          console.error('Deposit processing error:', error);
        }
      }, 1000);

      res.status(201).json({
        success: true,
        message: 'Deposit initiated',
        data: {
          transactionId: transaction._id,
          reference: transaction.reference,
          amount,
          status: transaction.status
        }
      });
    } catch (error) {
      console.error('Deposit error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process deposit'
      });
    }
  }
);

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Create withdrawal transaction
 * @access  Private
 */
router.post('/withdraw',
  authenticate,
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('method')
      .isIn(['bank_transfer', 'iban'])
      .withMessage('Invalid withdrawal method')
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

      const { amount, method, description } = req.body;

      // Ensure wallet exists (create if doesn't exist)
      const wallet = await ensureWalletExists(req.user._id);

      if (wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      // Create transaction
      const transaction = await Transaction.create({
        walletId: wallet._id,
        userId: req.user._id,
        type: 'withdrawal',
        amount,
        method,
        reference: `WTH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: description || 'Withdrawal',
        status: 'pending'
      });

      // Process withdrawal (in production, integrate with payment gateway)
      wallet.balance -= amount;
      await wallet.save();

      const escrow = await Escrow.findOne({ masterEscrowId: wallet.masterEscrowId });
      if (escrow) {
        escrow.totalBalance -= amount;
        await escrow.save();
      }

      transaction.status = 'processing';
      transaction.processedAt = new Date();
      await transaction.save();

      res.status(201).json({
        success: true,
        message: 'Withdrawal initiated',
        data: {
          transactionId: transaction._id,
          reference: transaction.reference,
          amount,
          status: transaction.status
        }
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process withdrawal'
      });
    }
  }
);

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get transaction history
 * @access  Private
 */
router.get('/transactions',
  authenticate,
  async (req, res) => {
    try {
      // Ensure wallet exists (create if doesn't exist)
      const wallet = await ensureWalletExists(req.user._id);

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const transactions = await Transaction.find({ walletId: wallet._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Transaction.countDocuments({ walletId: wallet._id });

      res.status(200).json({
        success: true,
        data: {
          transactions,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get transactions'
      });
    }
  }
);

module.exports = router;
