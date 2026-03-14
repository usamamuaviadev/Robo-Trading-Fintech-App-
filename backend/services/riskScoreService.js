/**
 * Risk Score Calculation Service
 * Calculates investor risk profile based on questionnaire responses
 * Supports dynamic questionnaire processing and profile reassessment
 */

const User = require('../models/User');

/**
 * Calculate risk score from questionnaire answers
 * @param {object} answers - Questionnaire responses
 * @returns {number} Risk score from 0-100
 */
function calculateRiskScore(answers) {
  let score = 0;

  // Primary Goal (0-20 points)
  const goalScores = {
    'retirement': 25,
    'income': 20,
    'property': 15,
    'progress': 18,
    'children': 12,
    'other': 15
  };
  score += goalScores[answers.primaryGoal] || 15;

  // Withdrawal Timeline (0-30 points)
  const timelineScores = {
    'lt1': 5,      // Less than 1 year - very conservative
    '1to3': 15,    // 1-3 years - conservative
    '3to5': 25,    // 3-5 years - moderate
    'gt5': 30      // More than 5 years - aggressive
  };
  score += timelineScores[answers.withdrawalTimeline] || 20;

  // Monthly Deposit Amount (0-15 points)
  const depositScores = {
    'high': 5,     // High amount - more conservative
    'medium': 12,  // Medium - moderate
    'low': 15      // Low amount - can take more risk
  };
  score += depositScores[answers.monthlyDepositDescription] || 10;

  // Investment Objective (0-20 points)
  const objectiveScores = {
    'growth': 20,      // Growth - aggressive
    'preserve': 5      // Capital preservation - conservative
  };
  score += objectiveScores[answers.investmentObjective] || 12;

  // Risk Tolerance (0-25 points)
  const toleranceScores = {
    'immediate': 5,     // Will withdraw immediately - very conservative
    'longterm': 25     // Long-term growth - aggressive
  };
  score += toleranceScores[answers.riskTolerance] || 15;

  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get risk profile category from score
 * @param {number} score - Risk score (0-100)
 * @returns {object} Risk profile details
 */
function getRiskProfile(score) {
  if (score <= 25) {
    return {
      category: 'conservative',
      label: 'Conservative',
      description: 'Low risk, capital preservation focused',
      color: '#10B981',
      assetAllocation: {
        bonds: 70,
        stocks: 20,
        gold: 10,
        reits: 0
      }
    };
  } else if (score <= 50) {
    return {
      category: 'balanced',
      label: 'Balanced',
      description: 'Moderate risk, balanced growth',
      color: '#3B82F6',
      assetAllocation: {
        bonds: 50,
        stocks: 35,
        gold: 10,
        reits: 5
      }
    };
  } else if (score <= 75) {
    return {
      category: 'advanced',
      label: 'Advanced',
      description: 'Higher risk, growth focused',
      color: '#F59E0B',
      assetAllocation: {
        bonds: 30,
        stocks: 50,
        gold: 15,
        reits: 5
      }
    };
  } else if (score <= 85) {
    return {
      category: 'aggressive',
      label: 'Aggressive',
      description: 'High risk, maximum growth potential',
      color: '#F59E0B',
      assetAllocation: {
        bonds: 15,
        stocks: 65,
        gold: 15,
        reits: 5
      }
    };
  } else {
    return {
      category: 'adventure',
      label: 'Adventure',
      description: 'Very high risk, maximum growth potential',
      color: '#EF4444',
      assetAllocation: {
        bonds: 5,
        stocks: 75,
        gold: 15,
        reits: 5
      }
    };
  }
}

/**
 * Get prebuilt profile by name
 * @param {string} profileName - Profile name (conservative, balanced, advanced, adventure)
 * @returns {object} Profile details
 */
function getPrebuiltProfile(profileName) {
  const profiles = {
    'conservative': {
      category: 'conservative',
      label: 'Conservative',
      description: 'Low risk, capital preservation focused',
      color: '#10B981',
      assetAllocation: {
        bonds: 70,
        stocks: 20,
        gold: 10,
        reits: 0
      },
      expectedReturn: 6.5,
      riskLevel: 2
    },
    'balanced': {
      category: 'balanced',
      label: 'Balanced',
      description: 'Moderate risk, balanced growth',
      color: '#3B82F6',
      assetAllocation: {
        bonds: 50,
        stocks: 35,
        gold: 10,
        reits: 5
      },
      expectedReturn: 9.5,
      riskLevel: 5
    },
    'advanced': {
      category: 'advanced',
      label: 'Advanced',
      description: 'Higher risk, growth focused',
      color: '#F59E0B',
      assetAllocation: {
        bonds: 30,
        stocks: 50,
        gold: 15,
        reits: 5
      },
      expectedReturn: 12.5,
      riskLevel: 7
    },
    'aggressive': {
      category: 'aggressive',
      label: 'Aggressive',
      description: 'High risk, maximum growth potential',
      color: '#F59E0B',
      assetAllocation: {
        bonds: 15,
        stocks: 65,
        gold: 15,
        reits: 5
      },
      expectedReturn: 14.0,
      riskLevel: 8
    },
    'adventure': {
      category: 'adventure',
      label: 'Adventure',
      description: 'Very high risk, maximum growth potential',
      color: '#EF4444',
      assetAllocation: {
        bonds: 5,
        stocks: 75,
        gold: 15,
        reits: 5
      },
      expectedReturn: 16.0,
      riskLevel: 10
    }
  };

  return profiles[profileName.toLowerCase()] || profiles['balanced'];
}

/**
 * Calculate recommended portfolio from questionnaire
 * @param {object} answers - Questionnaire responses
 * @returns {object} Complete portfolio recommendation
 */
function calculatePortfolioRecommendation(answers) {
  const riskScore = calculateRiskScore(answers);
  const riskProfile = getRiskProfile(riskScore);

  return {
    riskScore,
    riskProfile,
    recommendedAllocation: riskProfile.assetAllocation,
    expectedReturn: riskProfile.expectedReturn || 9.5,
    riskLevel: riskProfile.riskLevel || 5,
    reasoning: generateReasoning(answers, riskScore)
  };
}

/**
 * Generate reasoning text for recommendation
 * @param {object} answers
 * @param {number} score
 * @returns {string}
 */
function generateReasoning(answers, score) {
  const reasons = [];
  
  if (answers.withdrawalTimeline === 'gt5') {
    reasons.push('Your long-term investment horizon allows for higher risk tolerance');
  }
  
  if (answers.riskTolerance === 'longterm') {
    reasons.push('Your comfort with long-term growth indicates higher risk capacity');
  }
  
  if (answers.investmentObjective === 'growth') {
    reasons.push('Your growth objective aligns with a more aggressive portfolio');
  }
  
  return reasons.join('. ') || 'Based on your responses, this portfolio matches your risk profile.';
}

/**
 * Check if user profile needs reassessment
 * @param {string} userId - User ID
 * @returns {Promise<object>} Reassessment recommendation
 */
async function checkReassessmentTriggers(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.investmentProfile) {
      return {
        needsReassessment: false,
        triggers: [],
        lastAssessment: null
      };
    }

    const profile = user.investmentProfile;
    const triggers = [];
    const now = new Date();
    const lastAssessment = profile.lastRiskAssessment || profile.updatedAt || user.createdAt;
    const daysSinceAssessment = Math.floor((now - new Date(lastAssessment)) / (1000 * 60 * 60 * 24));

    // Time-based trigger: Reassess every 12 months
    if (daysSinceAssessment >= 365) {
      triggers.push({
        type: 'time_based',
        reason: 'Annual reassessment recommended',
        priority: 'medium',
        daysSince: daysSinceAssessment
      });
    }

    // Life event triggers (if tracked)
    if (profile.lifeEvents && profile.lifeEvents.length > 0) {
      const recentEvents = profile.lifeEvents.filter(event => {
        const eventDate = new Date(event.date);
        return (now - eventDate) / (1000 * 60 * 60 * 24) <= 90; // Last 90 days
      });

      if (recentEvents.length > 0) {
        triggers.push({
          type: 'life_event',
          reason: 'Recent life events may affect risk tolerance',
          priority: 'high',
          events: recentEvents
        });
      }
    }

    // Market condition triggers (if portfolio value changed significantly)
    if (profile.lastPortfolioValue) {
      // This would need to be calculated from actual portfolio
      // For now, just check if it exists
    }

    // Age-based trigger: Approaching retirement
    if (user.dateOfBirth) {
      const age = Math.floor((now - new Date(user.dateOfBirth)) / (1000 * 60 * 60 * 24 * 365));
      if (age >= 55 && age <= 65) {
        triggers.push({
          type: 'age_based',
          reason: 'Approaching retirement age - consider more conservative allocation',
          priority: 'high',
          age: age
        });
      }
    }

    return {
      needsReassessment: triggers.length > 0,
      triggers,
      lastAssessment: lastAssessment,
      daysSinceAssessment
    };
  } catch (error) {
    console.error('Reassessment check error:', error);
    throw error;
  }
}

/**
 * Process dynamic questionnaire with weighted scoring
 * @param {object} answers - Questionnaire responses
 * @param {object} weights - Optional custom weights for questions
 * @returns {object} Enhanced risk assessment
 */
function processDynamicQuestionnaire(answers, weights = {}) {
  const defaultWeights = {
    primaryGoal: 0.20,
    withdrawalTimeline: 0.30,
    monthlyDepositDescription: 0.15,
    investmentObjective: 0.20,
    riskTolerance: 0.25
  };

  const finalWeights = { ...defaultWeights, ...weights };
  let weightedScore = 0;
  let totalWeight = 0;

  // Primary Goal
  const goalScores = {
    'retirement': 25,
    'income': 20,
    'property': 15,
    'progress': 18,
    'children': 12,
    'other': 15
  };
  if (answers.primaryGoal) {
    weightedScore += (goalScores[answers.primaryGoal] || 15) * finalWeights.primaryGoal;
    totalWeight += finalWeights.primaryGoal;
  }

  // Withdrawal Timeline
  const timelineScores = {
    'lt1': 5,
    '1to3': 15,
    '3to5': 25,
    'gt5': 30
  };
  if (answers.withdrawalTimeline) {
    weightedScore += (timelineScores[answers.withdrawalTimeline] || 20) * finalWeights.withdrawalTimeline;
    totalWeight += finalWeights.withdrawalTimeline;
  }

  // Monthly Deposit
  const depositScores = {
    'high': 5,
    'medium': 12,
    'low': 15
  };
  if (answers.monthlyDepositDescription) {
    weightedScore += (depositScores[answers.monthlyDepositDescription] || 10) * finalWeights.monthlyDepositDescription;
    totalWeight += finalWeights.monthlyDepositDescription;
  }

  // Investment Objective
  const objectiveScores = {
    'growth': 20,
    'preserve': 5
  };
  if (answers.investmentObjective) {
    weightedScore += (objectiveScores[answers.investmentObjective] || 12) * finalWeights.investmentObjective;
    totalWeight += finalWeights.investmentObjective;
  }

  // Risk Tolerance
  const toleranceScores = {
    'immediate': 5,
    'longterm': 25
  };
  if (answers.riskTolerance) {
    weightedScore += (toleranceScores[answers.riskTolerance] || 15) * finalWeights.riskTolerance;
    totalWeight += finalWeights.riskTolerance;
  }

  // Normalize score
  const normalizedScore = totalWeight > 0 ? (weightedScore / totalWeight) : 50;
  const finalScore = Math.max(0, Math.min(100, normalizedScore));

  return {
    score: finalScore,
    weightedScore,
    totalWeight,
    weights: finalWeights,
    confidence: totalWeight >= 0.8 ? 'high' : totalWeight >= 0.5 ? 'medium' : 'low'
  };
}

module.exports = {
  calculateRiskScore,
  getRiskProfile,
  getPrebuiltProfile,
  calculatePortfolioRecommendation,
  checkReassessmentTriggers,
  processDynamicQuestionnaire
};
