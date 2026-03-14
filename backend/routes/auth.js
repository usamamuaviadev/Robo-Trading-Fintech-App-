const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { createAndSendOTP, verifyOTP } = require('../services/otpService');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to phone number or email
 * @access  Public
 */
router.post('/send-otp',
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('purpose')
      .optional()
      .isIn(['registration', 'login', 'phone-verification', 'email-verification', 'identity-verification', 'bank-verification'])
      .withMessage('Invalid purpose'),
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

      const { phoneNumber, email, purpose = 'registration', type = 'phone' } = req.body;

      // Check if user exists for registration purpose (use normalized phone for consistency)
      if (purpose === 'registration') {
        const { normalizePhoneNumber } = require('../services/otpService');
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        const trimmedPhone = phoneNumber.trim();
        
        const existingUser = await User.findOne({ 
          $or: [
            { phoneNumber: normalizedPhone },
            { phoneNumber: trimmedPhone },
            { phoneNumber: phoneNumber } // Also check original format
          ]
        });
        
        if (existingUser) {
          console.log('⚠️ Send OTP: User already exists:', {
            foundPhone: existingUser.phoneNumber,
            requestedPhone: phoneNumber,
            normalizedPhone: normalizedPhone
          });
          return res.status(400).json({
            success: false,
            message: 'User with this phone number already exists. Please login instead.',
            error: 'USER_ALREADY_EXISTS'
          });
        }
      }

      // Create and send OTP
      const result = await createAndSendOTP(phoneNumber, email, purpose, type);

      // Debug logging
      console.log('📤 Send OTP Result:', JSON.stringify({
        hasDemo: !!result.demo,
        hasCode: !!result.code,
        code: result.code,
        demo: result.demo,
        otpId: result.otpId
      }, null, 2));

      const response = {
        success: true,
        message: 'OTP sent successfully',
        data: {
          otpId: result.otpId,
          expiresAt: result.expiresAt,
          sentVia: type === 'phone' ? 'SMS' : type === 'email' ? 'Email' : 'Both'
        }
      };

      // In demo mode, include the OTP code in response
      // ALWAYS include code if demo flag is set OR if code exists (fallback)
      // This ensures demo code is always returned when available
      const demoCode = result.code || result.sms?.code || result.email?.code;
      
      if (result.demo || demoCode) {
        response.data.demo = true;
        response.data.code = demoCode || result.code;
        response.message = 'OTP sent successfully (DEMO MODE - check console for code)';
        console.log('✅ Demo mode: Adding code to response:', response.data.code);
      } else {
        console.log('⚠️ Demo mode check failed - no code found:', {
          'result.demo': result.demo,
          'result.code': result.code,
          'result.sms': result.sms,
          'result.email': result.email,
          'result keys': Object.keys(result),
          'full result': JSON.stringify(result, null, 2)
        });
        // Last resort: if we're in production but want to show code anyway, check environment
        // For now, we'll just log the issue
      }

      console.log('📤 Final Response:', JSON.stringify(response, null, 2));
      res.status(200).json(response);
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send OTP'
      });
    }
  }
);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP code
 * @access  Public
 */
router.post('/verify-otp',
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required'),
    body('code')
      .notEmpty()
      .withMessage('OTP code is required')
      .isLength({ min: 5, max: 5 })
      .withMessage('OTP code must be 5 digits')
      .isNumeric()
      .withMessage('OTP code must be numeric'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('purpose')
      .optional()
      .isIn(['registration', 'login', 'phone-verification', 'email-verification', 'identity-verification', 'bank-verification'])
      .withMessage('Invalid purpose'),
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

      const { phoneNumber, code, email, purpose = 'registration' } = req.body;

      // Verify OTP
      const verification = await verifyOTP(phoneNumber, code, email, purpose);

      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: verification.message
        });
      }

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully'
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify OTP'
      });
    }
  }
);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register',
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('code')
      .notEmpty()
      .withMessage('OTP code is required')
      .isLength({ min: 5, max: 5 })
      .withMessage('OTP code must be 5 digits'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Full name must not be empty if provided'),
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

      const { phoneNumber, password, code, email, fullName, investmentProfile } = req.body;

      // Log received data for debugging
      console.log('📝 Registration request received:', {
        phoneNumber,
        hasEmail: !!email,
        hasFullName: !!fullName,
        fullName: fullName,
        hasInvestmentProfile: !!investmentProfile
      });

      // In demo mode, always accept static code "12345"
      const DEMO_MODE = process.env.DEMO_MODE === 'true' || !process.env.TWILIO_ACCOUNT_SID || !process.env.EMAIL_USER;
      
      let otp = null;
      
      if (DEMO_MODE && code.toString().trim() === '12345') {
        console.log('🔧 DEMO MODE: Accepting static OTP code 12345 for registration');
        // Skip OTP validation in demo mode for static code
        // Create a dummy OTP record for consistency
        const { normalizePhoneNumber } = require('../services/otpService');
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        const OTP = require('../models/OTP');
        
        // Try to find existing OTP record
        otp = await OTP.findOne({
          phoneNumber: normalizedPhone,
          code: '12345',
          purpose: 'registration',
        });
        
        // If not found, create one
        if (!otp) {
          otp = new OTP({
            phoneNumber: normalizedPhone,
            email: email || undefined,
            code: '12345',
            type: email && phoneNumber ? 'both' : (email ? 'email' : 'phone'),
            purpose: 'registration',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            isUsed: false,
          });
          await otp.save();
          console.log('✅ Created demo OTP record for static code 12345');
        }
      } else {
        // Verify OTP first - but allow it even if already verified (since verify-otp was called first)
        // This allows the flow: verify OTP -> then register
        const { verifyOTP, normalizePhoneNumber } = require('../services/otpService');
        const normalizedPhone = normalizePhoneNumber(phoneNumber);
        const OTPModel = require('../models/OTP');
        
        // Try to find OTP - check multiple phone formats for flexibility
        // First try with normalized phone
        otp = await OTPModel.findOne({
          phoneNumber: normalizedPhone,
          code: code.toString().trim(),
          purpose: 'registration',
          isUsed: false, // First try unused
        });
        
        // If not found, try with used OTPs (in case verify-otp was called first)
        if (!otp) {
          otp = await OTPModel.findOne({
            phoneNumber: normalizedPhone,
            code: code.toString().trim(),
            purpose: 'registration',
            isUsed: true, // Allow used OTPs for registration
          });
        }
        
        // Also try with original phone format (trimmed)
        if (!otp) {
          otp = await OTPModel.findOne({
            phoneNumber: phoneNumber.trim(),
            code: code.toString().trim(),
            purpose: 'registration',
          });
        }
        
        // Try with phone without spaces
        if (!otp) {
          otp = await OTPModel.findOne({
            phoneNumber: phoneNumber.replace(/\s+/g, ''),
            code: code.toString().trim(),
            purpose: 'registration',
          });
        }
        
        // Try with phone without leading +
        if (!otp && phoneNumber.startsWith('+')) {
          otp = await OTPModel.findOne({
            phoneNumber: phoneNumber.replace(/^\+/, ''),
            code: code.toString().trim(),
            purpose: 'registration',
          });
        }
        
        if (!otp) {
          console.log('❌ OTP not found for registration:', { phoneNumber, normalizedPhone, code });
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired OTP code'
          });
        }
        
        // Check if OTP is expired or exceeded attempts (even if used)
        if (otp.expiresAt <= new Date() || otp.attempts >= 5) {
          return res.status(400).json({
            success: false,
            message: 'OTP has expired or exceeded maximum attempts'
          });
        }
        
        // OTP is valid - we'll mark it as used after successful registration
        console.log('✅ OTP validated for registration:', { phoneNumber: otp.phoneNumber, isUsed: otp.isUsed });
      }

      // Use the phone number from the OTP record for consistency (this is the one used when OTP was sent)
      // This ensures we use the exact same normalized phone number that was stored in the OTP
      const phoneNumberToUse = otp ? otp.phoneNumber : phoneNumber;
      const { normalizePhoneNumber } = require('../services/otpService');
      const normalizedPhone = normalizePhoneNumber(phoneNumberToUse);
      const trimmedPhone = phoneNumberToUse.trim();

      console.log('🔍 Checking for existing user:', {
        originalPhoneFromRequest: phoneNumber,
        phoneFromOTP: otp?.phoneNumber,
        phoneNumberToUse: phoneNumberToUse,
        normalizedPhone: normalizedPhone,
        trimmedPhone: trimmedPhone
      });

      // Check if user already exists (check all possible formats)
      const phoneVariations = [
        normalizedPhone,
        trimmedPhone,
        phoneNumberToUse,
        phoneNumber,
        phoneNumber.replace(/\s+/g, ''),
        phoneNumber.replace(/^\+/, ''),
        phoneNumber.replace(/[^\d+]/g, ''), // Remove all non-digit except +
        phoneNumber.replace(/[^\d]/g, ''), // Remove all non-digits
      ].filter((p, i, arr) => p && arr.indexOf(p) === i); // Remove duplicates and empty values

      // Try to find user with exact matches first
      let existingUser = await User.findOne({ 
        phoneNumber: { $in: phoneVariations }
      });

      // If not found, try regex search for phone numbers that might have slight variations
      // Only use regex if we have a clean numeric phone number
      if (!existingUser) {
        const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
        if (cleanPhone.length >= 9) {
          // Extract the last 9 digits (Saudi local format) for matching
          const last9Digits = cleanPhone.slice(-9);
          try {
            existingUser = await User.findOne({ 
              phoneNumber: { $regex: last9Digits + '$' }
            });
          } catch (regexError) {
            console.log('⚠️ Regex search failed, continuing with exact match only:', regexError.message);
          }
        }
      }

      if (existingUser) {
        console.log('⚠️ User already exists:', {
          foundPhone: existingUser.phoneNumber,
          requestedPhone: phoneNumber,
          phoneFromOTP: otp?.phoneNumber,
          phoneNumberToUse: phoneNumberToUse,
          normalizedPhone: normalizedPhone,
          userId: existingUser._id,
          accountStatus: existingUser.accountStatus,
          hasPassword: !!existingUser.password
        });
        
        // If user exists, suggest login instead
        return res.status(400).json({
          success: false,
          message: 'User with this phone number already exists. Please login instead.',
          error: 'USER_ALREADY_EXISTS',
          suggestion: 'Try logging in with your phone number and password'
        });
      }

      console.log('✅ No existing user found, proceeding with registration');

      // Double-check one more time right before creating (race condition protection)
      const phoneVariationsFinal = [
        normalizedPhone,
        trimmedPhone,
        phoneNumberToUse,
        phoneNumber,
        phoneNumber.replace(/\s+/g, ''),
        phoneNumber.replace(/^\+/, ''),
        phoneNumber.replace(/[^\d+]/g, ''),
        phoneNumber.replace(/[^\d]/g, ''),
      ].filter((p, i, arr) => p && arr.indexOf(p) === i);

      const finalCheck = await User.findOne({ 
        phoneNumber: { $in: phoneVariationsFinal }
      });

      if (finalCheck) {
        console.log('⚠️ User found in final check (race condition detected):', {
          foundPhone: finalCheck.phoneNumber,
          requestedPhone: phoneNumber,
          normalizedPhone: normalizedPhone
        });
        return res.status(400).json({
          success: false,
          message: 'User with this phone number already exists. Please login instead.',
          error: 'USER_ALREADY_EXISTS',
          suggestion: 'Try logging in with your phone number and password'
        });
      }

      // Create new user with normalized phone number from OTP (ensures consistency)
      const userData = {
        phoneNumber: normalizedPhone, // Use normalized phone from OTP record
        email: email ? email.trim().toLowerCase() : undefined,
        password,
        isPhoneVerified: true,
        isEmailVerified: !!email,
        investmentProfile: investmentProfile || {},
        accountStatus: 'pending'
      };

      // Add fullName only if it's provided and not empty
      if (fullName && fullName.trim().length > 0) {
        userData.fullName = fullName.trim();
      }

      console.log('👤 Creating user with data:', {
        phoneNumber: userData.phoneNumber,
        hasEmail: !!userData.email,
        hasFullName: !!userData.fullName,
        fullName: userData.fullName,
        isPhoneVerified: userData.isPhoneVerified
      });

      const user = new User(userData);

      try {
        await user.save();
        console.log('✅ User saved successfully:', {
          userId: user._id,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber
        });
      } catch (saveError) {
        // Handle duplicate key error more gracefully
        if (saveError.code === 11000) {
          console.error('❌ Duplicate key error (E11000):', {
            code: saveError.code,
            keyPattern: saveError.keyPattern,
            keyValue: saveError.keyValue,
            message: saveError.message
          });
          
          // Check which field caused the duplicate
          const duplicateField = Object.keys(saveError.keyPattern || {})[0];
          const duplicateValue = saveError.keyValue?.[duplicateField];
          
          // Try to find the existing user to provide better error message
          let existingUser = null;
          if (duplicateField === 'phoneNumber') {
            // Try multiple phone formats to find the user
            existingUser = await User.findOne({ 
              $or: [
                { phoneNumber: duplicateValue },
                { phoneNumber: normalizedPhone },
                { phoneNumber: trimmedPhone },
                { phoneNumber: phoneNumber },
                { phoneNumber: phoneNumber.replace(/\s+/g, '') },
                { phoneNumber: phoneNumber.replace(/^\+/, '') }
              ]
            });
          } else if (duplicateField === 'email' && email) {
            existingUser = await User.findOne({ email: email.trim().toLowerCase() });
          }
          
          if (existingUser) {
            console.log('⚠️ Found existing user after duplicate error:', {
              userId: existingUser._id,
              phoneNumber: existingUser.phoneNumber,
              email: existingUser.email,
              accountStatus: existingUser.accountStatus
            });
            
            if (duplicateField === 'phoneNumber') {
              return res.status(400).json({
                success: false,
                message: 'User with this phone number already exists. Please login instead.',
                error: 'USER_ALREADY_EXISTS',
                suggestion: 'Try logging in with your phone number and password'
              });
            } else {
              return res.status(400).json({
                success: false,
                message: `User with this ${duplicateField} already exists. Please login instead.`,
                error: 'USER_ALREADY_EXISTS'
              });
            }
          }
          
          // If we can't find the user but got duplicate error, something is wrong
          return res.status(400).json({
            success: false,
            message: `Duplicate ${duplicateField}: This value already exists. Please try logging in.`,
            error: 'DUPLICATE_VALUE'
          });
        }
        throw saveError; // Re-throw if it's a different error
      }

      // Mark OTP as used now that registration is successful (if not in demo mode with static code)
      if (!DEMO_MODE || code.toString().trim() !== '12345') {
        if (otp) {
          otp.isUsed = true;
          await otp.save();
        }
      }

      // Create wallet for new user
      try {
        const Wallet = require('../models/Wallet');
        const Escrow = require('../models/Escrow');
        
        // Check if wallet already exists (shouldn't, but just in case)
        let wallet = await Wallet.findOne({ userId: user._id });
        
        if (!wallet) {
          // Find or create master escrow
          let masterEscrow = await Escrow.findOne({ status: 'active' });
          if (!masterEscrow) {
            masterEscrow = await Escrow.create({
              masterEscrowId: `ESCROW-${Date.now()}`,
              totalBalance: 0,
              status: 'active'
            });
          }
          
          // Create wallet
          wallet = await Wallet.create({
            userId: user._id,
            masterEscrowId: masterEscrow.masterEscrowId,
            subAccountId: `SUB-${user._id}-${Date.now()}`,
            balance: 0,
            currency: 'SAR',
            status: 'active'
          });
          
          console.log(`✅ Created wallet for new user ${user._id}: ${wallet.subAccountId}`);
        }
      } catch (walletError) {
        console.error('⚠️ Error creating wallet during registration (non-fatal):', walletError);
        // Don't fail registration if wallet creation fails - it will be created on first wallet API call
      }

      // Create Alpaca subaccount on first-time signup and save in database
      try {
        const { createAccount, buildMinimalAccountPayloadFromUser, isBrokerConfigured } = require('../services/alpacaService');
        if (isBrokerConfigured() && !user.alpacaAccountId) {
          const payload = buildMinimalAccountPayloadFromUser(user, { ip: req.ip });
          const account = await createAccount(payload);
          user.alpacaAccountId = account.id;
          await user.save();
          console.log('✅ Alpaca subaccount created for new user:', { userId: user._id, alpacaAccountId: account.id });
        }
      } catch (alpacaError) {
        console.error('⚠️ Alpaca subaccount creation failed (non-fatal):', alpacaError?.response?.data || alpacaError?.message || alpacaError);
        // Don't fail registration; user can create/link Alpaca account later
      }

      // Generate JWT token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            phoneNumber: user.phoneNumber,
            email: user.email,
            fullName: user.fullName,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified,
            accountStatus: user.accountStatus,
            alpacaAccountId: user.alpacaAccountId || null
          },
          token
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to register user'
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with phone and password
 * @access  Public
 */
router.post('/login',
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
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

      const { phoneNumber, password } = req.body;

      // Find user
      const user = await User.findOne({ phoneNumber });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid phone number or password'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid phone number or password'
        });
      }

      // Generate JWT token
      const token = generateToken(user._id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            phoneNumber: user.phoneNumber,
            email: user.email,
            fullName: user.fullName,
            isPhoneVerified: user.isPhoneVerified,
            isEmailVerified: user.isEmailVerified,
            isIdentityVerified: user.isIdentityVerified,
            isBankLinked: user.isBankLinked,
            accountStatus: user.accountStatus
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to login'
      });
    }
  }
);

/**
 * @route   POST /api/auth/verify-phone
 * @desc    Verify phone number with OTP (for existing users)
 * @access  Private
 */
router.post('/verify-phone',
  authenticate,
  [
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

      const { code } = req.body;
      const phoneNumber = req.user.phoneNumber;

      // Verify OTP
      const verification = await verifyOTP(phoneNumber, code, null, 'phone-verification');
      if (!verification.success) {
        return res.status(400).json({
          success: false,
          message: verification.message
        });
      }

      // Update user
      req.user.isPhoneVerified = true;
      await req.user.save();

      res.status(200).json({
        success: true,
        message: 'Phone number verified successfully'
      });
    } catch (error) {
      console.error('Verify phone error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to verify phone number'
      });
    }
  }
);

/**
 * @route   POST /api/auth/check-phone
 * @desc    Check if phone number is already registered (for debugging)
 * @access  Public
 */
router.post('/check-phone',
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required'),
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

      const { phoneNumber } = req.body;
      const { normalizePhoneNumber } = require('../services/otpService');
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const trimmedPhone = phoneNumber.trim();

      const existingUser = await User.findOne({ 
        $or: [
          { phoneNumber: normalizedPhone },
          { phoneNumber: trimmedPhone },
          { phoneNumber: phoneNumber },
          { phoneNumber: phoneNumber.replace(/\s+/g, '') },
          { phoneNumber: phoneNumber.replace(/^\+/, '') }
        ]
      });

      if (existingUser) {
        return res.status(200).json({
          success: true,
          exists: true,
          message: 'User with this phone number already exists',
          data: {
            userId: existingUser._id,
            phoneNumber: existingUser.phoneNumber,
            accountStatus: existingUser.accountStatus,
            isPhoneVerified: existingUser.isPhoneVerified,
            createdAt: existingUser.createdAt
          }
        });
      }

      return res.status(200).json({
        success: true,
        exists: false,
        message: 'Phone number is available for registration',
        data: {
          normalizedPhone: normalizedPhone,
          checkedFormats: [normalizedPhone, trimmedPhone, phoneNumber]
        }
      });
    } catch (error) {
      console.error('Check phone error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check phone number'
      });
    }
  }
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          phoneNumber: req.user.phoneNumber,
          email: req.user.email,
          fullName: req.user.fullName,
          nationalId: req.user.nationalId,
          isPhoneVerified: req.user.isPhoneVerified,
          isEmailVerified: req.user.isEmailVerified,
          isIdentityVerified: req.user.isIdentityVerified,
          isBankLinked: req.user.isBankLinked,
          investmentProfile: req.user.investmentProfile,
          fundingPreferences: req.user.fundingPreferences,
          accountStatus: req.user.accountStatus,
          createdAt: req.user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get user data'
    });
  }
});

module.exports = router;
