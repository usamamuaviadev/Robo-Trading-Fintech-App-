const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { createAndSendOTP, verifyOTP } = require('../services/otpService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticate,
  [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 2 characters'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
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

      const { fullName, email, investmentProfile } = req.body;
      const user = req.user;

      if (fullName) user.fullName = fullName;
      if (email) user.email = email;
      if (investmentProfile) {
        user.investmentProfile = {
          ...user.investmentProfile,
          ...investmentProfile
        };
      }

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update profile'
      });
    }
  }
);

/**
 * @route   POST /api/user/verify-identity
 * @desc    Verify user identity with National ID
 * @access  Private
 */
router.post('/verify-identity',
  authenticate,
  [
    body('nationalId')
      .notEmpty()
      .withMessage('National ID is required')
      .trim()
      .isLength({ min: 10, max: 10 })
      .withMessage('National ID must be exactly 10 digits')
      .matches(/^\d+$/)
      .withMessage('National ID must contain only digits'),
    body('code')
      .notEmpty()
      .withMessage('OTP code is required')
      .trim()
      .isLength({ min: 5, max: 5 })
      .withMessage('OTP code must be exactly 5 digits')
      .matches(/^\d+$/)
      .withMessage('OTP code must contain only digits'),
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

      let { nationalId, code } = req.body;
      const user = req.user;

      // Normalize inputs (trim and ensure string format)
      nationalId = String(nationalId || '').trim();
      code = String(code || '').trim();

      // In demo mode, accept static code "12345" without strict verification
      const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.TWILIO_ACCOUNT_SID || !process.env.EMAIL_USER;
      
      // Normalize phone number for better matching
      const { normalizePhoneNumber } = require('../services/otpService');
      const normalizedUserPhone = normalizePhoneNumber(user.phoneNumber);
      
      console.log('🔍 Verify Identity:', {
        userId: user._id,
        userPhone: user.phoneNumber,
        normalizedUserPhone: normalizedUserPhone,
        nationalId: nationalId,
        code: code,
        demoMode: DEMO_MODE,
        purpose: 'identity-verification',
        userEmail: user.email
      });

      // Verify OTP - use normalized phone for better matching
      let verification;
      const phoneToUse = normalizedUserPhone || user.phoneNumber;
      
      if (DEMO_MODE && code === '12345') {
        console.log('🔧 DEMO MODE: Accepting static OTP code 12345 for identity verification');
        // In demo mode, be more lenient - try to verify but don't fail if OTP not found
        verification = await verifyOTP(phoneToUse, code, user.email, 'identity-verification');
        if (!verification.success) {
          console.log('⚠️ Demo OTP verification failed, but allowing in demo mode');
          // In demo mode, we'll still allow it if the code is 12345
          verification = { success: true, message: 'OTP verified successfully (demo mode)' };
        }
      } else {
        verification = await verifyOTP(phoneToUse, code, user.email, 'identity-verification');
      }

      if (!verification.success) {
        console.error('❌ OTP verification failed:', {
          userPhone: user.phoneNumber,
          code: code,
          message: verification.message
        });
        return res.status(400).json({
          success: false,
          message: verification.message || 'OTP verification failed'
        });
      }

      // Update user
      user.nationalId = nationalId;
      user.isIdentityVerified = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Identity verified successfully',
        data: { user }
      });
    } catch (error) {
      console.error('Verify identity error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify identity'
      });
    }
  }
);

/**
 * @route   POST /api/user/link-bank
 * @desc    Link bank account with IBAN
 * @access  Private
 */
router.post('/link-bank',
  authenticate,
  [
    body('iban')
      .notEmpty()
      .withMessage('IBAN is required')
      .isLength({ min: 22, max: 34 })
      .withMessage('IBAN must be between 22 and 34 characters'),
    body('wahiqNumber')
      .optional()
      .trim(),
    body('code')
      .notEmpty()
      .withMessage('OTP code is required')
      .isLength({ min: 5, max: 5 })
      .withMessage('OTP code must be 5 digits'),
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

      const { iban, wahiqNumber, code } = req.body;
      const user = req.user;

      // Only verify OTP if code is provided (optional for already verified users)
      if (code) {
        // In demo mode, accept static code "12345" without verification
        const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.TWILIO_ACCOUNT_SID || !process.env.EMAIL_USER;
        
        if (DEMO_MODE && code.toString().trim() === '12345') {
          console.log('🔧 DEMO MODE: Accepting static OTP code 12345 for bank linking');
          // Skip OTP verification in demo mode
        } else {
          const verification = await verifyOTP(user.phoneNumber, code, user.email, 'bank-verification');
          if (!verification.success) {
            return res.status(400).json({
              success: false,
              message: verification.message
            });
          }
        }
      } else {
        // If no OTP provided, check if phone is already verified
        if (!user.isPhoneVerified) {
          return res.status(400).json({
            success: false,
            message: 'Phone number must be verified before linking bank account. Please provide OTP code.'
          });
        }
        console.log('✅ Skipping OTP verification - phone already verified');
      }

      // Update user
      user.iban = iban;
      if (wahiqNumber) user.wahiqNumber = wahiqNumber;
      user.isBankLinked = true;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Bank account linked successfully',
        data: {
          user: {
            iban: user.iban,
            wahiqNumber: user.wahiqNumber,
            isBankLinked: user.isBankLinked
          }
        }
      });
    } catch (error) {
      console.error('Link bank error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to link bank account'
      });
    }
  }
);

/**
 * @route   PUT /api/user/funding-preferences
 * @desc    Update funding preferences
 * @access  Private
 */
router.put('/funding-preferences',
  authenticate,
  [
    body('frequency')
      .optional()
      .isIn(['monthly', 'quarterly', 'yearly'])
      .withMessage('Invalid frequency'),
    body('times')
      .optional()
      .isIn(['once-per-month', 'twice-per-month', 'weekly'])
      .withMessage('Invalid times'),
    body('amount')
      .optional()
      .isNumeric()
      .withMessage('Amount must be numeric')
      .isFloat({ min: 0 })
      .withMessage('Amount must be positive'),
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

      const { frequency, times, amount } = req.body;
      const user = req.user;

      if (frequency) user.fundingPreferences.frequency = frequency;
      if (times) user.fundingPreferences.times = times;
      if (amount !== undefined) user.fundingPreferences.amount = amount;

      await user.save();

      res.status(200).json({
        success: true,
        message: 'Funding preferences updated successfully',
        data: { fundingPreferences: user.fundingPreferences }
      });
    } catch (error) {
      console.error('Update funding preferences error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update funding preferences'
      });
    }
  }
);

module.exports = router;
