const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const affiliateService = require('../services/affiliateService');
const Referral = require('../models/Referral');
const Commission = require('../models/Commission');
const CommissionRule = require('../models/CommissionRule');

const router = express.Router();

/**
 * @route   GET /api/affiliate/stats
 * @desc    Get user referral statistics
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await affiliateService.getUserReferralStats(req.user._id);
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get referral statistics'
    });
  }
});

/**
 * @route   GET /api/affiliate/referrals
 * @desc    Get referral history
 * @access  Private
 */
router.get('/referrals',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'active', 'completed', 'cancelled']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 })
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

      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 50
      };

      const referrals = await affiliateService.getReferralHistory(req.user._id, filters);
      res.status(200).json({
        success: true,
        data: referrals
      });
    } catch (error) {
      console.error('Error getting referral history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get referral history'
      });
    }
  }
);

/**
 * @route   GET /api/affiliate/commissions
 * @desc    Get commission history
 * @access  Private
 */
router.get('/commissions',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'approved', 'paid', 'cancelled', 'rejected']),
    query('commissionType').optional().isIn(['signup', 'deposit', 'investment', 'tier']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 })
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

      const filters = {
        status: req.query.status,
        commissionType: req.query.commissionType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 50
      };

      const commissions = await affiliateService.getCommissionHistory(req.user._id, filters);
      res.status(200).json({
        success: true,
        data: commissions
      });
    } catch (error) {
      console.error('Error getting commission history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get commission history'
      });
    }
  }
);

/**
 * @route   POST /api/affiliate/track-signup
 * @desc    Track referral signup (called during registration)
 * @access  Public (but should be called server-side)
 */
router.post('/track-signup',
  [
    body('referralCode').notEmpty().withMessage('Referral code is required'),
    body('referredUserId').notEmpty().withMessage('Referred user ID is required')
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

      const { referralCode, referredUserId, ...trackingData } = req.body;
      const referral = await affiliateService.trackReferralSignup(
        referralCode,
        referredUserId,
        trackingData
      );

      res.status(201).json({
        success: true,
        data: referral
      });
    } catch (error) {
      console.error('Error tracking referral signup:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to track referral signup'
      });
    }
  }
);

/**
 * @route   POST /api/affiliate/initialize
 * @desc    Initialize referral system for user
 * @access  Private
 */
router.post('/initialize', authenticate, async (req, res) => {
  try {
    const result = await affiliateService.initializeUserReferral(req.user._id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error initializing referral:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initialize referral system'
    });
  }
});

// ========== ADMIN ROUTES ==========

/**
 * @route   GET /api/affiliate/admin/rules
 * @desc    Get all commission rules (admin)
 * @access  Private (Admin only)
 */
router.get('/admin/rules', authenticate, async (req, res) => {
  try {
    // TODO: Add admin check middleware
    const rules = await CommissionRule.find().sort({ priority: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error getting commission rules:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get commission rules'
    });
  }
});

/**
 * @route   POST /api/affiliate/admin/rules
 * @desc    Create commission rule (admin)
 * @access  Private (Admin only)
 */
router.post('/admin/rules',
  authenticate,
  [
    body('name').notEmpty().withMessage('Rule name is required'),
    body('ruleType').isIn(['signup', 'deposit', 'investment', 'tier']).withMessage('Invalid rule type'),
    body('commissionType').isIn(['fixed', 'percentage', 'tiered']).withMessage('Invalid commission type')
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

      // TODO: Add admin check middleware
      const ruleData = {
        ...req.body,
        createdBy: req.user._id
      };

      const rule = new CommissionRule(ruleData);
      await rule.save();

      res.status(201).json({
        success: true,
        data: rule
      });
    } catch (error) {
      console.error('Error creating commission rule:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create commission rule'
      });
    }
  }
);

/**
 * @route   PUT /api/affiliate/admin/rules/:id
 * @desc    Update commission rule (admin)
 * @access  Private (Admin only)
 */
router.put('/admin/rules/:id', authenticate, async (req, res) => {
  try {
    // TODO: Add admin check middleware
    const rule = await CommissionRule.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Commission rule not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error updating commission rule:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update commission rule'
    });
  }
});

/**
 * @route   POST /api/affiliate/admin/commissions/:id/approve
 * @desc    Approve commission (admin)
 * @access  Private (Admin only)
 */
router.post('/admin/commissions/:id/approve', authenticate, async (req, res) => {
  try {
    // TODO: Add admin check middleware
    const commission = await affiliateService.approveCommission(req.params.id, req.user._id);
    res.status(200).json({
      success: true,
      data: commission
    });
  } catch (error) {
    console.error('Error approving commission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve commission'
    });
  }
});

/**
 * @route   POST /api/affiliate/admin/commissions/:id/payout
 * @desc    Process commission payout (admin)
 * @access  Private (Admin only)
 */
router.post('/admin/commissions/:id/payout',
  authenticate,
  [
    body('payoutMethod').isIn(['wallet', 'bank_transfer', 'manual']).withMessage('Invalid payout method'),
    body('payoutReference').optional().isString()
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

      // TODO: Add admin check middleware
      const { payoutMethod, payoutReference } = req.body;
      const commission = await affiliateService.processCommissionPayout(
        req.params.id,
        payoutMethod,
        payoutReference
      );

      res.status(200).json({
        success: true,
        data: commission
      });
    } catch (error) {
      console.error('Error processing commission payout:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process commission payout'
      });
    }
  }
);

module.exports = router;
