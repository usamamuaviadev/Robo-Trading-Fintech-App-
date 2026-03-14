const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const roiCalculatorService = require('../services/roiCalculatorService');
const User = require('../models/User');

const router = express.Router();

/**
 * @route   POST /api/calculator/lump-sum
 * @desc    Calculate lump sum investment ROI
 * @access  Private
 */
router.post('/lump-sum',
  authenticate,
  [
    body('principal').isFloat({ min: 0.01 }).withMessage('Principal must be greater than 0'),
    body('annualReturn').optional().isFloat({ min: 0, max: 1 }).withMessage('Annual return must be between 0 and 1'),
    body('years').isInt({ min: 1, max: 100 }).withMessage('Years must be between 1 and 100'),
    body('inflationRate').optional().isFloat({ min: 0, max: 0.5 }).withMessage('Inflation rate must be between 0 and 0.5')
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

      const { principal, annualReturn, years, inflationRate } = req.body;
      
      // Get user's risk profile for default return if not provided
      let returnRate = annualReturn;
      if (!returnRate) {
        const user = await User.findById(req.user._id);
        const riskProfile = user?.investmentProfile?.riskProfile || 'balanced';
        const profile = require('../services/riskScoreService').getPrebuiltProfile(riskProfile);
        returnRate = (profile.expectedReturn || 9.5) / 100;
      }

      const result = roiCalculatorService.calculateLumpSumROI(
        principal,
        returnRate,
        years,
        inflationRate || 0.025
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Lump sum calculation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate lump sum ROI'
      });
    }
  }
);

/**
 * @route   POST /api/calculator/recurring
 * @desc    Calculate recurring investment ROI
 * @access  Private
 */
router.post('/recurring',
  authenticate,
  [
    body('monthlyAmount').isFloat({ min: 0.01 }).withMessage('Monthly amount must be greater than 0'),
    body('annualReturn').optional().isFloat({ min: 0, max: 1 }).withMessage('Annual return must be between 0 and 1'),
    body('years').isInt({ min: 1, max: 100 }).withMessage('Years must be between 1 and 100'),
    body('inflationRate').optional().isFloat({ min: 0, max: 0.5 }).withMessage('Inflation rate must be between 0 and 0.5')
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

      const { monthlyAmount, annualReturn, years, inflationRate } = req.body;
      
      // Get user's risk profile for default return if not provided
      let returnRate = annualReturn;
      if (!returnRate) {
        const user = await User.findById(req.user._id);
        const riskProfile = user?.investmentProfile?.riskProfile || 'balanced';
        const profile = require('../services/riskScoreService').getPrebuiltProfile(riskProfile);
        returnRate = (profile.expectedReturn || 9.5) / 100;
      }

      const result = roiCalculatorService.calculateRecurringROI(
        monthlyAmount,
        returnRate,
        years,
        inflationRate || 0.025
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Recurring calculation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate recurring ROI'
      });
    }
  }
);

/**
 * @route   POST /api/calculator/comprehensive
 * @desc    Comprehensive ROI calculation with all methods
 * @access  Private
 */
router.post('/comprehensive',
  authenticate,
  [
    body('investmentType').isIn(['lump_sum', 'recurring']).withMessage('Invalid investment type'),
    body('principal').optional().isFloat({ min: 0.01 }),
    body('monthlyAmount').optional().isFloat({ min: 0.01 }),
    body('years').isInt({ min: 1, max: 100 }).withMessage('Years must be between 1 and 100'),
    body('riskProfile').optional().isIn(['conservative', 'balanced', 'advanced', 'aggressive', 'adventure'])
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

      const { investmentType, principal, monthlyAmount, years, riskProfile, includeMonteCarlo, simulations, marketAssumptions } = req.body;

      // Get user's risk profile if not provided
      let userRiskProfile = riskProfile;
      if (!userRiskProfile) {
        const user = await User.findById(req.user._id);
        userRiskProfile = user?.investmentProfile?.riskProfile || 'balanced';
      }

      // Validate investment parameters
      if (investmentType === 'lump_sum' && !principal) {
        return res.status(400).json({
          success: false,
          message: 'Principal is required for lump sum investment'
        });
      }

      if (investmentType === 'recurring' && !monthlyAmount) {
        return res.status(400).json({
          success: false,
          message: 'Monthly amount is required for recurring investment'
        });
      }

      const params = {
        investmentType,
        principal: principal || monthlyAmount * 12,
        monthlyAmount: monthlyAmount || principal / 12,
        years,
        includeMonteCarlo: includeMonteCarlo || false,
        simulations: simulations || 1000,
        marketAssumptions: marketAssumptions || {}
      };

      const result = roiCalculatorService.calculateComprehensiveROI(params, userRiskProfile);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Comprehensive calculation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate comprehensive ROI'
      });
    }
  }
);

/**
 * @route   POST /api/calculator/time-horizons
 * @desc    Calculate ROI for variable time horizons
 * @access  Private
 */
router.post('/time-horizons',
  authenticate,
  [
    body('investmentType').isIn(['lump_sum', 'recurring']).withMessage('Invalid investment type'),
    body('principal').optional().isFloat({ min: 0.01 }),
    body('monthlyAmount').optional().isFloat({ min: 0.01 }),
    body('riskProfile').optional().isIn(['conservative', 'balanced', 'advanced', 'aggressive', 'adventure'])
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

      const { investmentType, principal, monthlyAmount, riskProfile } = req.body;

      // Get user's risk profile if not provided
      let userRiskProfile = riskProfile;
      if (!userRiskProfile) {
        const user = await User.findById(req.user._id);
        userRiskProfile = user?.investmentProfile?.riskProfile || 'balanced';
      }

      const params = {
        principal: principal || monthlyAmount * 12,
        monthlyAmount: monthlyAmount || principal / 12
      };

      const result = roiCalculatorService.calculateVariableTimeHorizons(
        params,
        investmentType,
        userRiskProfile
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Time horizons calculation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to calculate time horizons'
      });
    }
  }
);

/**
 * @route   POST /api/calculator/monte-carlo
 * @desc    Run Monte Carlo simulation
 * @access  Private
 */
router.post('/monte-carlo',
  authenticate,
  [
    body('investmentType').isIn(['lump_sum', 'recurring']).withMessage('Invalid investment type'),
    body('principal').optional().isFloat({ min: 0.01 }),
    body('monthlyAmount').optional().isFloat({ min: 0.01 }),
    body('years').isInt({ min: 1, max: 100 }).withMessage('Years must be between 1 and 100'),
    body('simulations').optional().isInt({ min: 100, max: 10000 }).withMessage('Simulations must be between 100 and 10000'),
    body('riskProfile').optional().isIn(['conservative', 'balanced', 'advanced', 'aggressive', 'adventure'])
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

      const { investmentType, principal, monthlyAmount, years, simulations, riskProfile } = req.body;

      // Get user's risk profile if not provided
      let userRiskProfile = riskProfile;
      if (!userRiskProfile) {
        const user = await User.findById(req.user._id);
        userRiskProfile = user?.investmentProfile?.riskProfile || 'balanced';
      }

      const params = {
        investmentType,
        principal: principal || monthlyAmount * 12,
        monthlyAmount: monthlyAmount || principal / 12
      };

      const result = roiCalculatorService.monteCarloSimulation(
        params,
        userRiskProfile,
        years,
        simulations || 1000
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Monte Carlo simulation error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to run Monte Carlo simulation'
      });
    }
  }
);

module.exports = router;
