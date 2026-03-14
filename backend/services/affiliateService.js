const crypto = require('crypto');
const Referral = require('../models/Referral');
const Commission = require('../models/Commission');
const CommissionRule = require('../models/CommissionRule');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Trade = require('../models/Trade');

/**
 * Affiliate Service
 * Handles referral tracking, commission calculation, fraud detection, and payouts
 */

/**
 * Generate unique referral code for user
 * @param {string} userId - User ID
 * @returns {string} Unique referral code
 */
function generateReferralCode(userId) {
  // Use user ID + timestamp + random string for uniqueness
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  const userHash = userId.toString().slice(-6);
  return `REF${userHash.toUpperCase()}${timestamp}${random.toUpperCase()}`.substring(0, 16);
}

/**
 * Generate unique referral link
 * @param {string} referralCode - Referral code
 * @param {string} baseUrl - Base URL of the application
 * @returns {string} Referral link
 */
function generateReferralLink(referralCode, baseUrl = process.env.FRONTEND_URL || 'https://app.example.com') {
  return `${baseUrl}/signup?ref=${referralCode}`;
}

/**
 * Initialize referral system for user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Referral code and link
 */
async function initializeUserReferral(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate referral code if not exists
    if (!user.referralCode) {
      let referralCode = generateReferralCode(userId);
      // Ensure uniqueness
      while (await User.findOne({ referralCode })) {
        referralCode = generateReferralCode(userId);
      }
      
      user.referralCode = referralCode;
      user.referralLink = generateReferralLink(referralCode);
      await user.save();
    }

    return {
      referralCode: user.referralCode,
      referralLink: user.referralLink
    };
  } catch (error) {
    console.error('Error initializing user referral:', error);
    throw error;
  }
}

/**
 * Track referral signup
 * @param {string} referralCode - Referral code used
 * @param {string} referredUserId - New user ID
 * @param {object} trackingData - IP, user agent, etc.
 * @returns {Promise<object>} Created referral record
 */
async function trackReferralSignup(referralCode, referredUserId, trackingData = {}) {
  try {
    // Find referrer by code
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      throw new Error('Invalid referral code');
    }

    // Check if user already referred
    const existingReferral = await Referral.findOne({ referredId: referredUserId });
    if (existingReferral) {
      throw new Error('User already has a referral');
    }

    // Prevent self-referral
    if (referrer._id.toString() === referredUserId.toString()) {
      throw new Error('Cannot refer yourself');
    }

    // Run fraud detection
    const fraudCheck = await detectFraud(referrer._id, referredUserId, trackingData);

    // Create referral record
    const referral = new Referral({
      referrerId: referrer._id,
      referredId: referredUserId,
      referralCode,
      referralLink: generateReferralLink(referralCode),
      status: fraudCheck.isFraud ? 'cancelled' : 'pending',
      ipAddress: trackingData.ipAddress,
      userAgent: trackingData.userAgent,
      source: trackingData.source || 'link',
      fraudFlags: fraudCheck.flags,
      isFraud: fraudCheck.isFraud,
      fraudCheckedAt: new Date(),
      metadata: trackingData.metadata || {}
    });

    await referral.save();

    // Update referrer stats
    await User.findByIdAndUpdate(referrer._id, {
      $inc: { totalReferrals: 1 }
    });

    // Update referred user
    await User.findByIdAndUpdate(referredUserId, {
      referredBy: referrer._id
    });

    return referral;
  } catch (error) {
    console.error('Error tracking referral signup:', error);
    throw error;
  }
}

/**
 * Fraud detection system
 * @param {string} referrerId - Referrer user ID
 * @param {string} referredUserId - Referred user ID
 * @param {object} trackingData - Tracking information
 * @returns {Promise<object>} Fraud detection results
 */
async function detectFraud(referrerId, referredUserId, trackingData) {
  const flags = [];
  let isFraud = false;

  try {
    // Check for same IP address
    if (trackingData.ipAddress) {
      const referrerReferrals = await Referral.find({ referrerId, ipAddress: trackingData.ipAddress });
      if (referrerReferrals.length > 0) {
        flags.push('same_ip');
        isFraud = true;
      }
    }

    // Check for same device/user agent
    if (trackingData.userAgent) {
      const referrerReferrals = await Referral.find({ referrerId, userAgent: trackingData.userAgent });
      if (referrerReferrals.length > 2) {
        flags.push('same_device');
        isFraud = true;
      }
    }

    // Check for rapid signups (multiple signups in short time)
    const recentReferrals = await Referral.countDocuments({
      referrerId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });
    if (recentReferrals > 5) {
      flags.push('rapid_signup');
      isFraud = true;
    }

    // Check for duplicate information
    const referrer = await User.findById(referrerId);
    const referred = await User.findById(referredUserId);
    
    if (referrer && referred) {
      // Check for same phone number pattern (last 4 digits)
      if (referrer.phoneNumber && referred.phoneNumber) {
        const referrerLast4 = referrer.phoneNumber.slice(-4);
        const referredLast4 = referred.phoneNumber.slice(-4);
        if (referrerLast4 === referredLast4) {
          flags.push('duplicate_info');
          isFraud = true;
        }
      }
    }

    return { flags, isFraud };
  } catch (error) {
    console.error('Error in fraud detection:', error);
    return { flags: ['suspicious_activity'], isFraud: true };
  }
}

/**
 * Activate referral (when referred user makes first deposit)
 * @param {string} referralId - Referral ID
 * @param {number} depositAmount - Deposit amount
 * @returns {Promise<object>} Updated referral
 */
async function activateReferral(referralId, depositAmount) {
  try {
    const referral = await Referral.findById(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.status === 'cancelled' || referral.isFraud) {
      throw new Error('Cannot activate cancelled or fraudulent referral');
    }

    referral.status = 'active';
    referral.hasDeposited = true;
    referral.firstDepositAmount = depositAmount;
    referral.firstDepositDate = new Date();
    referral.activatedAt = new Date();
    await referral.save();

    // Calculate and create commission
    await calculateCommission(referralId, 'deposit', depositAmount);

    return referral;
  } catch (error) {
    console.error('Error activating referral:', error);
    throw error;
  }
}

/**
 * Calculate commission based on active rules
 * @param {string} referralId - Referral ID
 * @param {string} commissionType - Type: 'signup', 'deposit', 'investment', 'tier'
 * @param {number} baseAmount - Base amount for calculation
 * @returns {Promise<object>} Created commission record
 */
async function calculateCommission(referralId, commissionType, baseAmount) {
  try {
    const referral = await Referral.findById(referralId).populate('referrerId');
    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.isFraud || referral.status === 'cancelled') {
      throw new Error('Cannot calculate commission for fraudulent or cancelled referral');
    }

    // Get active commission rules for this type
    const rules = await CommissionRule.find({
      ruleType: commissionType,
      isActive: true,
      validFrom: { $lte: new Date() },
      $or: [
        { validTo: null },
        { validTo: { $gte: new Date() } }
      ]
    }).sort({ priority: -1 });

    if (rules.length === 0) {
      // Default commission if no rules
      const defaultRate = commissionType === 'signup' ? 5 : commissionType === 'deposit' ? 2 : 1;
      return await createCommission(referral, commissionType, baseAmount, defaultRate, null);
    }

    // Use the highest priority rule
    const rule = rules[0];
    let commissionAmount = 0;
    let commissionRate = 0;

    // Calculate based on rule type
    if (rule.commissionType === 'fixed') {
      commissionAmount = rule.fixedAmount || 0;
      commissionRate = 0;
    } else if (rule.commissionType === 'percentage') {
      commissionRate = rule.percentage || 0;
      commissionAmount = (baseAmount * commissionRate) / 100;
    } else if (rule.commissionType === 'tiered') {
      // Find appropriate tier
      const tier = rule.tiers.find(t => 
        baseAmount >= t.minAmount && (!t.maxAmount || baseAmount <= t.maxAmount)
      );
      if (tier) {
        if (tier.fixedAmount) {
          commissionAmount = tier.fixedAmount;
        } else {
          commissionRate = tier.percentage || 0;
          commissionAmount = (baseAmount * commissionRate) / 100;
        }
      }
    }

    // Apply max commission limit if set
    if (rule.maxCommissionAmount && commissionAmount > rule.maxCommissionAmount) {
      commissionAmount = rule.maxCommissionAmount;
    }

    // Check minimum amounts
    if (commissionType === 'deposit' && baseAmount < (rule.minDepositAmount || 0)) {
      return null; // No commission if below minimum
    }

    if (commissionType === 'investment' && baseAmount < (rule.minInvestmentAmount || 0)) {
      return null; // No commission if below minimum
    }

    return await createCommission(referral, commissionType, baseAmount, commissionRate, rule._id);
  } catch (error) {
    console.error('Error calculating commission:', error);
    throw error;
  }
}

/**
 * Create commission record
 * @param {object} referral - Referral document
 * @param {string} commissionType - Commission type
 * @param {number} baseAmount - Base amount
 * @param {number} commissionRate - Commission rate (percentage)
 * @param {string} ruleId - Commission rule ID
 * @returns {Promise<object>} Created commission
 */
async function createCommission(referral, commissionType, baseAmount, commissionRate, ruleId) {
  try {
    const commission = new Commission({
      referrerId: referral.referrerId._id || referral.referrerId,
      referralId: referral._id,
      referredUserId: referral.referredId,
      commissionType,
      baseAmount,
      commissionRate,
      commissionAmount: commissionRate > 0 ? (baseAmount * commissionRate) / 100 : baseAmount,
      status: 'pending',
      tier: referral.tier || 1,
      metadata: { ruleId }
    });

    await commission.save();

    // Update user commission stats
    await User.findByIdAndUpdate(referral.referrerId._id || referral.referrerId, {
      $inc: { pendingCommissions: commission.commissionAmount }
    });

    return commission;
  } catch (error) {
    console.error('Error creating commission:', error);
    throw error;
  }
}

/**
 * Process multi-tier referral commissions
 * @param {string} referralId - Original referral ID
 * @param {string} commissionType - Commission type
 * @param {number} baseAmount - Base amount
 * @returns {Promise<array>} Created commissions for all tiers
 */
async function processMultiTierCommissions(referralId, commissionType, baseAmount) {
  try {
    const commissions = [];
    let currentReferral = await Referral.findById(referralId).populate('referrerId');

    if (!currentReferral) {
      return commissions;
    }

    // Get multi-tier rules
    const rules = await CommissionRule.find({
      ruleType: commissionType,
      isActive: true,
      'multiTierRates.0': { $exists: true }
    }).sort({ priority: -1 });

    if (rules.length === 0) {
      return commissions;
    }

    const rule = rules[0];
    let tier = 1;
    const maxTiers = rule.multiTierRates.length;

    // Process up to max tiers
    while (currentReferral && tier <= maxTiers) {
      const tierRate = rule.multiTierRates.find(r => r.tier === tier);
      if (!tierRate) {
        break;
      }

      // Calculate commission for this tier
      const commissionAmount = tierRate.fixedAmount || 
        (baseAmount * (tierRate.percentage || 0)) / 100;

      if (commissionAmount > 0) {
        const commission = await createCommission(
          currentReferral,
          'tier',
          baseAmount,
          tierRate.percentage || 0,
          rule._id
        );
        commissions.push(commission);
      }

      // Move to parent referral (if exists)
      if (currentReferral.parentReferralId) {
        currentReferral = await Referral.findById(currentReferral.parentReferralId)
          .populate('referrerId');
      } else {
        break;
      }

      tier++;
    }

    return commissions;
  } catch (error) {
    console.error('Error processing multi-tier commissions:', error);
    throw error;
  }
}

/**
 * Get user referral statistics
 * @param {string} userId - User ID
 * @returns {Promise<object>} Referral statistics
 */
async function getUserReferralStats(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Initialize referral if not exists
    if (!user.referralCode) {
      await initializeUserReferral(userId);
      await user.save();
    }

    const referrals = await Referral.find({ referrerId: userId });
    const activeReferrals = referrals.filter(r => r.status === 'active').length;
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length;

    const commissions = await Commission.find({ referrerId: userId });
    const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidCommissions = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingCommissions = commissions
      .filter(c => c.status === 'pending' || c.status === 'approved')
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    return {
      referralCode: user.referralCode,
      referralLink: user.referralLink,
      totalReferrals: referrals.length,
      activeReferrals,
      pendingReferrals,
      totalCommissions,
      paidCommissions,
      pendingCommissions,
      totalCommissionsCount: commissions.length
    };
  } catch (error) {
    console.error('Error getting user referral stats:', error);
    throw error;
  }
}

/**
 * Get referral history
 * @param {string} userId - User ID
 * @param {object} filters - Filters (status, date range, etc.)
 * @returns {Promise<array>} Referral history
 */
async function getReferralHistory(userId, filters = {}) {
  try {
    const query = { referrerId: userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    const referrals = await Referral.find(query)
      .populate('referredId', 'fullName phoneNumber email createdAt')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50);

    return referrals;
  } catch (error) {
    console.error('Error getting referral history:', error);
    throw error;
  }
}

/**
 * Get commission history
 * @param {string} userId - User ID
 * @param {object} filters - Filters
 * @returns {Promise<array>} Commission history
 */
async function getCommissionHistory(userId, filters = {}) {
  try {
    const query = { referrerId: userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.commissionType) {
      query.commissionType = filters.commissionType;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    const commissions = await Commission.find(query)
      .populate('referredUserId', 'fullName phoneNumber')
      .populate('referralId')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50);

    return commissions;
  } catch (error) {
    console.error('Error getting commission history:', error);
    throw error;
  }
}

/**
 * Approve commission (admin function)
 * @param {string} commissionId - Commission ID
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<object>} Updated commission
 */
async function approveCommission(commissionId, adminUserId) {
  try {
    const commission = await Commission.findById(commissionId);
    if (!commission) {
      throw new Error('Commission not found');
    }

    commission.status = 'approved';
    commission.approvedBy = adminUserId;
    commission.approvedAt = new Date();
    await commission.save();

    return commission;
  } catch (error) {
    console.error('Error approving commission:', error);
    throw error;
  }
}

/**
 * Process commission payout
 * @param {string} commissionId - Commission ID
 * @param {string} payoutMethod - Payout method
 * @param {string} payoutReference - Payout reference
 * @returns {Promise<object>} Updated commission
 */
async function processCommissionPayout(commissionId, payoutMethod, payoutReference) {
  try {
    const commission = await Commission.findById(commissionId);
    if (!commission) {
      throw new Error('Commission not found');
    }

    if (commission.status !== 'approved') {
      throw new Error('Commission must be approved before payout');
    }

    commission.payoutStatus = 'processing';
    commission.payoutMethod = payoutMethod;
    commission.payoutReference = payoutReference;
    commission.payoutDate = new Date();
    await commission.save();

    // Update user stats
    const user = await User.findById(commission.referrerId);
    if (user) {
      user.pendingCommissions -= commission.commissionAmount;
      user.paidCommissions += commission.commissionAmount;
      await user.save();
    }

    // Mark as completed after processing
    commission.status = 'paid';
    commission.payoutStatus = 'completed';
    await commission.save();

    return commission;
  } catch (error) {
    console.error('Error processing commission payout:', error);
    throw error;
  }
}

module.exports = {
  generateReferralCode,
  generateReferralLink,
  initializeUserReferral,
  trackReferralSignup,
  detectFraud,
  activateReferral,
  calculateCommission,
  processMultiTierCommissions,
  getUserReferralStats,
  getReferralHistory,
  getCommissionHistory,
  approveCommission,
  processCommissionPayout
};
