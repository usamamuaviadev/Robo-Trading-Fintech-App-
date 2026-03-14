const twilio = require('twilio');
const nodemailer = require('nodemailer');
const OTP = require('../models/OTP');

// Demo mode - set DEMO_MODE=true in .env to enable
// Force demo mode if explicitly set, OR if Twilio/Email not configured
const DEMO_MODE = process.env.DEMO_MODE === 'true' || 
                  process.env.DEMO_MODE === '1' || 
                  !process.env.TWILIO_ACCOUNT_SID || 
                  !process.env.TWILIO_AUTH_TOKEN ||
                  !process.env.EMAIL_USER || 
                  !process.env.EMAIL_PASS;

// Twilio client (only if credentials are provided)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.warn('⚠️  Twilio not configured, using demo mode');
  }
}

// Nodemailer transporter (only if credentials are provided)
let emailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } catch (error) {
    console.warn('⚠️  Email not configured, using demo mode');
  }
}

if (DEMO_MODE) {
  console.log('🔧 DEMO MODE ENABLED - OTP codes will be logged to console instead of being sent');
  console.log('🔧 DEMO MODE check:', {
    'DEMO_MODE env': process.env.DEMO_MODE,
    'TWILIO_ACCOUNT_SID exists': !!process.env.TWILIO_ACCOUNT_SID,
    'TWILIO_AUTH_TOKEN exists': !!process.env.TWILIO_AUTH_TOKEN,
    'EMAIL_USER exists': !!process.env.EMAIL_USER,
    'EMAIL_PASS exists': !!process.env.EMAIL_PASS
  });
} else {
  console.log('⚠️ DEMO MODE DISABLED - OTP codes will be sent via Twilio/Email');
  console.log('⚠️ To enable demo mode, set DEMO_MODE=true in .env or remove Twilio/Email credentials');
}

/**
 * Generate a random 5-digit OTP
 * In demo mode, always returns static code "12345"
 */
const generateOTP = () => {
  if (DEMO_MODE) {
    console.log('🔧 DEMO MODE: Using static OTP code 12345');
    return '12345';
  }
  return Math.floor(10000 + Math.random() * 90000).toString();
};

/**
 * Send OTP via SMS using Twilio
 */
const sendSMSOTP = async (phoneNumber, code) => {
  if (DEMO_MODE || !twilioClient) {
    console.log('\n📱 ============================================');
    console.log('📱 DEMO MODE: SMS OTP');
    console.log('📱 ============================================');
    console.log(`📱 Phone: ${phoneNumber}`);
    console.log(`📱 OTP Code: ${code}`);
    console.log('📱 ============================================\n');
    return { success: true, messageId: 'demo-sms', demo: true };
  }

  try {
    const message = await twilioClient.messages.create({
      body: `Your Robo Advisor verification code is: ${code}. This code will expire in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`✅ SMS sent to ${phoneNumber}: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error(`❌ Error sending SMS to ${phoneNumber}:`, error.message);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send OTP via Email using Nodemailer
 */
const sendEmailOTP = async (email, code) => {
  if (DEMO_MODE || !emailTransporter) {
    console.log('\n📧 ============================================');
    console.log('📧 DEMO MODE: Email OTP');
    console.log('📧 ============================================');
    console.log(`📧 Email: ${email}`);
    console.log(`📧 OTP Code: ${code}`);
    console.log('📧 ============================================\n');
    return { success: true, messageId: 'demo-email', demo: true };
  }

  try {
    const mailOptions = {
      from: `"Robo Advisor" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Robo Advisor Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6D28D9;">Robo Advisor Verification</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #6D28D9; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #6B7280; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${email}:`, error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Normalize phone number to consistent format
 */
const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return phoneNumber;
  // Remove all non-digit characters except +
  let normalized = phoneNumber.toString().replace(/[^\d+]/g, '').trim();
  
  // If doesn't start with +, ensure it's properly formatted
  if (!normalized.startsWith('+')) {
    // If starts with 0, replace with country code (assuming Saudi Arabia +966)
    if (normalized.startsWith('0')) {
      normalized = '+966' + normalized.substring(1);
    } else if (normalized.startsWith('966')) {
      normalized = '+' + normalized;
    } else {
      // For numbers without country code, assume Saudi Arabia +966
      // But only if it's 9 digits (Saudi local format)
      if (normalized.length === 9) {
        normalized = '+966' + normalized;
      } else {
        // Keep as is if it doesn't match expected format
        normalized = '+' + normalized;
      }
    }
  }
  return normalized;
};

/**
 * Create and send OTP
 */
const createAndSendOTP = async (phoneNumber, email = null, purpose = 'registration', type = 'phone') => {
  try {
    // Normalize phone number for consistent storage
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log(`📞 Original phone: ${phoneNumber}, Normalized: ${normalizedPhone}`);
    
    // Generate OTP code
    const code = generateOTP();

    // Invalidate previous OTPs for this phone/email
    await OTP.updateMany(
      {
        $or: [
          { phoneNumber: normalizedPhone, isUsed: false },
          ...(email ? [{ email, isUsed: false }] : [])
        ]
      },
      { isUsed: true }
    );

    // Create new OTP record
    const otp = new OTP({
      phoneNumber: normalizedPhone,
      email: email || undefined,
      code,
      type: email && phoneNumber ? 'both' : type,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await otp.save();

    // Send OTP based on type
    const results = {};
    
    if (type === 'phone' || type === 'both') {
      try {
        results.sms = await sendSMSOTP(normalizedPhone, code);
      } catch (error) {
        console.error('SMS sending failed:', error.message);
        results.sms = { success: false, error: error.message };
      }
    }

    if ((type === 'email' || type === 'both') && email) {
      try {
        results.email = await sendEmailOTP(email, code);
      } catch (error) {
        console.error('Email sending failed:', error.message);
        results.email = { success: false, error: error.message };
      }
    }

    // In demo mode, return the OTP code for testing
    const response = {
      success: true,
      otpId: otp._id,
      expiresAt: otp.expiresAt,
      ...results
    };

    // ALWAYS include demo code if in demo mode (force it)
    if (DEMO_MODE) {
      response.demo = true;
      response.code = code; // Return code in demo mode for testing
      console.log(`\n🔑 OTP Code for testing: ${code}\n`);
      console.log('🔧 createAndSendOTP returning:', JSON.stringify({
        demo: response.demo,
        code: response.code,
        otpId: response.otpId
      }, null, 2));
    } else {
      // Even if not in demo mode, if Twilio/Email failed, still return code
      const smsFailed = results.sms && !results.sms.success;
      const emailFailed = results.email && !results.email.success;
      
      if (smsFailed || emailFailed) {
        console.log('⚠️ SMS/Email failed, returning code anyway for testing');
        response.demo = true;
        response.code = code;
      } else {
        console.log('⚠️ DEMO_MODE is false. DEMO_MODE value:', DEMO_MODE);
        console.log('⚠️ Environment check:', {
          'DEMO_MODE env': process.env.DEMO_MODE,
          'TWILIO_ACCOUNT_SID exists': !!process.env.TWILIO_ACCOUNT_SID,
          'TWILIO_AUTH_TOKEN exists': !!process.env.TWILIO_AUTH_TOKEN,
          'EMAIL_USER exists': !!process.env.EMAIL_USER,
          'EMAIL_PASS exists': !!process.env.EMAIL_PASS
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Error creating OTP:', error);
    throw error;
  }
};

/**
 * Verify OTP
 */
const verifyOTP = async (phoneNumber, code, email = null, purpose = 'registration') => {
  try {
    // In demo mode, always accept static code "12345"
    if (DEMO_MODE && code.toString().trim() === '12345') {
      console.log('🔧 DEMO MODE: Accepting static OTP code 12345');
      
      // Normalize phone number for consistent lookup
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      
      // Try multiple phone number formats to find the OTP
      const phoneVariations = [
        normalizedPhone,
        phoneNumber.trim(),
        phoneNumber.replace(/[^\d]/g, ''),
        phoneNumber.replace(/[^\d]/g, '').replace(/^0/, '+966'),
        phoneNumber.replace(/[^\d]/g, '').replace(/^966/, '+966'),
        phoneNumber.replace(/[^\d]/g, '').length >= 9 
          ? '+966' + phoneNumber.replace(/[^\d]/g, '').replace(/^(0|966)/, '')
          : null
      ].filter(p => p && p.length > 0);
      
      const uniquePhones = [...new Set(phoneVariations)];
      console.log(`🔍 Demo mode: Trying phone variations:`, uniquePhones);
      
      // Find OTP record - try all phone variations, and allow used OTPs in demo mode
      let otp = null;
      for (const phoneVar of uniquePhones) {
        // First try unused OTPs
        otp = await OTP.findOne({
          phoneNumber: phoneVar,
          code: '12345',
          purpose,
          isUsed: false,
        });
        
        if (otp) {
          console.log(`✅ Found unused demo OTP with phone format: ${phoneVar}`);
          break;
        }
        
        // If not found, try used OTPs (in demo mode, we're more lenient)
        otp = await OTP.findOne({
          phoneNumber: phoneVar,
          code: '12345',
          purpose,
          isUsed: true,
        });
        
        if (otp) {
          console.log(`✅ Found used demo OTP with phone format: ${phoneVar} (allowing in demo mode)`);
          break;
        }
      }
      
      // If still not found, create a demo OTP record
      if (!otp) {
        console.log(`📝 Creating new demo OTP record for phone: ${normalizedPhone}, purpose: ${purpose}`);
        otp = new OTP({
          phoneNumber: normalizedPhone,
          email: email || undefined,
          code: '12345',
          type: email && phoneNumber ? 'both' : (email ? 'email' : 'phone'),
          purpose,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          isUsed: false,
        });
        await otp.save();
        console.log('✅ Created demo OTP record for static code 12345');
      }
      
      // Check if OTP is expired or exceeded attempts
      if (otp.expiresAt <= new Date() || otp.attempts >= 5) {
        console.log(`⚠️ Demo OTP expired or exceeded attempts:`, {
          expiresAt: otp.expiresAt,
          now: new Date(),
          attempts: otp.attempts
        });
        return { success: false, message: 'OTP has expired or exceeded maximum attempts' };
      }
      
      // Mark OTP as used
      otp.isUsed = true;
      await otp.save();
      
      console.log('✅ Demo OTP 12345 verified successfully', {
        phoneNumber: otp.phoneNumber,
        purpose: otp.purpose,
        wasUsed: otp.isUsed
      });
      return { success: true, message: 'OTP verified successfully' };
    }
    
    // Normalize phone number for consistent lookup
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    console.log(`🔍 Verifying OTP - Phone: ${phoneNumber} (normalized: ${normalizedPhone}), Code: ${code}, Purpose: ${purpose}`);
    
    const query = {
      phoneNumber: normalizedPhone,
      code: code.toString().trim(),
      purpose,
      isUsed: false,
    };

    if (email) {
      query.email = email.toLowerCase().trim();
    }

    // Try multiple phone number formats to find the OTP
    const phoneVariations = [
      normalizedPhone,
      phoneNumber.trim(),
      phoneNumber.replace(/[^\d]/g, ''),
      phoneNumber.replace(/[^\d]/g, '').replace(/^0/, '+966'),
      phoneNumber.replace(/[^\d]/g, '').replace(/^966/, '+966'),
      // Also try with just the digits if it's 9-10 digits
      phoneNumber.replace(/[^\d]/g, '').length >= 9 
        ? '+966' + phoneNumber.replace(/[^\d]/g, '').replace(/^(0|966)/, '')
        : null
    ].filter(p => p && p.length > 0);
    
    // Remove duplicates
    const uniquePhones = [...new Set(phoneVariations)];
    
    console.log(`🔍 Trying phone variations:`, uniquePhones);
    
    let otp = null;
    // First try to find unused OTPs
    for (const phoneVar of uniquePhones) {
      const testQuery = {
        phoneNumber: phoneVar,
        code: code.toString().trim(),
        purpose,
        isUsed: false,
      };
      if (email) {
        testQuery.email = email.toLowerCase().trim();
      }
      otp = await OTP.findOne(testQuery);
      if (otp) {
        console.log(`✅ Found unused OTP with phone format: ${phoneVar}`);
        break;
      }
    }
    
    // If not found and purpose is identity-verification or bank-verification, 
    // also try used OTPs (might have been verified via verify-otp endpoint first)
    if (!otp && (purpose === 'identity-verification' || purpose === 'bank-verification')) {
      console.log(`🔍 OTP not found unused, trying used OTPs for ${purpose}...`);
      for (const phoneVar of uniquePhones) {
        const testQuery = {
          phoneNumber: phoneVar,
          code: code.toString().trim(),
          purpose,
          isUsed: true, // Allow used OTPs for these purposes
        };
        if (email) {
          testQuery.email = email.toLowerCase().trim();
        }
        otp = await OTP.findOne(testQuery);
        if (otp) {
          console.log(`✅ Found used OTP with phone format: ${phoneVar} (allowing for ${purpose})`);
          break;
        }
      }
    }

    if (!otp) {
      console.log(`❌ OTP not found in database`);
      // Log all recent OTPs for debugging - try multiple phone formats
      const phoneVariations = [
        normalizedPhone,
        phoneNumber.trim(),
        phoneNumber.replace(/[^\d]/g, ''),
        phoneNumber.replace(/[^\d]/g, '').replace(/^0/, '+966'),
        phoneNumber.replace(/[^\d]/g, '').replace(/^966/, '+966'),
      ].filter((p, i, arr) => p && arr.indexOf(p) === i); // Remove duplicates
      
      console.log(`🔍 Searching for OTPs with phone variations:`, phoneVariations);
      
      // Search for both used and unused OTPs for debugging
      const recentOtps = await OTP.find({
        phoneNumber: { $in: phoneVariations },
        purpose
      }).sort({ createdAt: -1 }).limit(10);
      
      console.log(`📋 Recent OTPs found (${recentOtps.length}):`, recentOtps.map(o => ({
        phoneNumber: o.phoneNumber,
        code: o.code,
        isUsed: o.isUsed,
        expiresAt: o.expiresAt,
        attempts: o.attempts,
        createdAt: o.createdAt,
        isValid: o.isValid()
      })));
      
      // Also try to find by code only (for debugging) - include both used and unused
      const codeOnlyOtps = await OTP.find({
        code: code.toString().trim(),
        purpose
      }).sort({ createdAt: -1 }).limit(5);
      
      if (codeOnlyOtps.length > 0) {
        console.log(`🔍 Found OTPs with matching code but different phone:`, codeOnlyOtps.map(o => ({
          phoneNumber: o.phoneNumber,
          code: o.code,
          normalizedPhone: normalizedPhone
        })));
      }
      
      // Increment attempts for failed verification
      await OTP.updateMany(
        {
          phoneNumber: normalizedPhone,
          ...(email ? { email: email.toLowerCase().trim() } : {}),
          purpose,
          isUsed: false
        },
        { $inc: { attempts: 1 } }
      );
      return { success: false, message: 'Invalid or expired OTP code' };
    }

    // Check if OTP is still valid (skip validation if already used for identity/bank verification)
    if (!otp.isValid() && !(otp.isUsed && (purpose === 'identity-verification' || purpose === 'bank-verification'))) {
      console.log(`❌ OTP is invalid:`, {
        isUsed: otp.isUsed,
        expiresAt: otp.expiresAt,
        now: new Date(),
        expired: otp.expiresAt <= new Date(),
        attempts: otp.attempts,
        maxAttempts: 5,
        purpose: purpose
      });
      return { success: false, message: 'OTP has expired or exceeded maximum attempts' };
    }

    // Mark OTP as used (only if not already used)
    if (!otp.isUsed) {
      otp.isUsed = true;
      await otp.save();
      console.log(`✅ Marked OTP as used`);
    } else {
      console.log(`ℹ️ OTP was already used, skipping mark as used step`);
    }

    console.log(`✅ OTP verified successfully!`, {
      phoneNumber: otp.phoneNumber,
      code: otp.code,
      purpose: otp.purpose
    });

    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  sendSMSOTP,
  sendEmailOTP,
  createAndSendOTP,
  verifyOTP,
  normalizePhoneNumber
};
