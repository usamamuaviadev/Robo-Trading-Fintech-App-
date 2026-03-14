const express = require('express');
const { authenticate } = require('../middleware/auth');
const { 
  calculatePortfolioRecommendation, 
  getPrebuiltProfile,
  getRiskProfile,
  checkReassessmentTriggers,
  processDynamicQuestionnaire
} = require('../services/riskScoreService');
const { 
  getPortfolioComposition, 
  analyzeDiversification, 
  checkRebalancing,
  constructOptimalPortfolio,
  optimizeAllocation,
  enforceDiversificationRules,
  simulateRebalancing
} = require('../services/portfolioService');
const User = require('../models/User');

const router = express.Router();

/**
 * @route   POST /api/portfolio/calculate-risk
 * @desc    Calculate risk score from questionnaire
 * @access  Private
 */
router.post('/calculate-risk', authenticate, async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers) {
      return res.status(400).json({
        success: false,
        message: 'Questionnaire answers are required'
      });
    }

    const recommendation = calculatePortfolioRecommendation(answers);

    // Update user's risk score
    const user = await User.findById(req.user._id);
    if (user) {
      // Preserve existing assetAllocation or use recommended one
      const existingAllocation = user.investmentProfile?.assetAllocation;
      const recommendedAllocation = recommendation.recommendedAllocation;
      
      // Build investmentProfile object, ensuring assetAllocation is always a valid object
      const investmentProfileUpdate = {
        ...(user.investmentProfile || {}),
        riskScore: recommendation.riskScore,
        riskProfile: recommendation.riskProfile.category
      };
      
      // Explicitly set assetAllocation - ensure it's always an object
      if (existingAllocation && typeof existingAllocation === 'object' && !Array.isArray(existingAllocation)) {
        investmentProfileUpdate.assetAllocation = existingAllocation;
      } else if (recommendedAllocation && typeof recommendedAllocation === 'object' && !Array.isArray(recommendedAllocation)) {
        investmentProfileUpdate.assetAllocation = recommendedAllocation;
      } else {
        investmentProfileUpdate.assetAllocation = {
          bonds: 0,
          stocks: 0,
          gold: 0,
          reits: 0
        };
      }
      
      user.investmentProfile = investmentProfileUpdate;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    console.error('Calculate risk error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate risk score'
    });
  }
});

/**
 * @route   GET /api/portfolio/profiles
 * @desc    Get all prebuilt profiles
 * @access  Public
 */
router.get('/profiles', async (req, res) => {
  try {
    const profiles = [
      getPrebuiltProfile('conservative'),
      getPrebuiltProfile('balanced'),
      getPrebuiltProfile('advanced'),
      getPrebuiltProfile('aggressive'),
      getPrebuiltProfile('adventure')
    ];

    res.status(200).json({
      success: true,
      data: { profiles }
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profiles'
    });
  }
});

/**
 * @route   GET /api/portfolio/profiles/:profileName
 * @desc    Get specific prebuilt profile
 * @access  Public
 */
router.get('/profiles/:profileName', async (req, res) => {
  try {
    const { profileName } = req.params;
    const profile = getPrebuiltProfile(profileName);

    res.status(200).json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get profile'
    });
  }
});

/**
 * @route   GET /api/portfolio/composition
 * @desc    Get user's portfolio composition
 * @access  Private
 */
router.get('/composition', authenticate, async (req, res) => {
  try {
    const composition = await getPortfolioComposition(req.user._id);

    res.status(200).json({
      success: true,
      data: composition
    });
  } catch (error) {
    console.error('Get composition error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get portfolio composition'
    });
  }
});

/**
 * @route   GET /api/portfolio/diversification
 * @desc    Analyze portfolio diversification
 * @access  Private
 */
router.get('/diversification', authenticate, async (req, res) => {
  try {
    const composition = await getPortfolioComposition(req.user._id);
    const user = await User.findById(req.user._id);
    const targetAllocation = user.investmentProfile?.assetAllocation || {
      bonds: 50,
      stocks: 35,
      gold: 10,
      reits: 5
    };

    const analysis = analyzeDiversification(composition, targetAllocation);

    res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Diversification analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze diversification'
    });
  }
});

/**
 * @route   GET /api/portfolio/rebalancing
 * @desc    Check if portfolio needs rebalancing
 * @access  Private
 */
router.get('/rebalancing', authenticate, async (req, res) => {
  try {
    const composition = await getPortfolioComposition(req.user._id);
    const user = await User.findById(req.user._id);
    const targetAllocation = user.investmentProfile?.assetAllocation || {
      bonds: 50,
      stocks: 35,
      gold: 10,
      reits: 5
    };

    const threshold = parseFloat(req.query.threshold) || 5;
    const rebalancing = checkRebalancing(composition, targetAllocation, threshold);

    res.status(200).json({
      success: true,
      data: rebalancing
    });
  } catch (error) {
    console.error('Rebalancing check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check rebalancing'
    });
  }
});

/**
 * @route   GET /api/portfolio/reassessment
 * @desc    Check if user profile needs reassessment
 * @access  Private
 */
router.get('/reassessment', authenticate, async (req, res) => {
  try {
    const result = await checkReassessmentTriggers(req.user._id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Reassessment check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check reassessment triggers'
    });
  }
});

/**
 * @route   POST /api/portfolio/construct
 * @desc    Construct optimal portfolio
 * @access  Private
 */
router.post('/construct', authenticate, async (req, res) => {
  try {
    const { totalAmount, constraints } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user || !user.investmentProfile) {
      return res.status(400).json({
        success: false,
        message: 'User risk profile not found'
      });
    }

    const riskProfile = {
      category: user.investmentProfile.riskProfile || 'balanced',
      assetAllocation: user.investmentProfile.assetAllocation || {
        bonds: 50,
        stocks: 35,
        gold: 10,
        reits: 5
      }
    };

    const portfolio = constructOptimalPortfolio(
      riskProfile,
      totalAmount || 10000,
      constraints || {}
    );

    res.status(200).json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Portfolio construction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to construct portfolio'
    });
  }
});

/**
 * @route   POST /api/portfolio/optimize
 * @desc    Optimize asset allocation
 * @access  Private
 */
router.post('/optimize', authenticate, async (req, res) => {
  try {
    const composition = await getPortfolioComposition(req.user._id);
    const user = await User.findById(req.user._id);
    const targetAllocation = user.investmentProfile?.assetAllocation || {
      bonds: 50,
      stocks: 35,
      gold: 10,
      reits: 5
    };

    const { marketData } = req.body;
    const optimization = optimizeAllocation(targetAllocation, composition, marketData);

    res.status(200).json({
      success: true,
      data: optimization
    });
  } catch (error) {
    console.error('Allocation optimization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to optimize allocation'
    });
  }
});

/**
 * @route   GET /api/portfolio/diversification-rules
 * @desc    Check diversification rule compliance
 * @access  Private
 */
router.get('/diversification-rules', authenticate, async (req, res) => {
  try {
    const composition = await getPortfolioComposition(req.user._id);
    const user = await User.findById(req.user._id);
    const targetAllocation = user.investmentProfile?.assetAllocation || {
      bonds: 50,
      stocks: 35,
      gold: 10,
      reits: 5
    };

    const { rules } = req.query;
    const customRules = rules ? JSON.parse(rules) : {};
    
    const enforcement = enforceDiversificationRules(composition, targetAllocation, customRules);

    res.status(200).json({
      success: true,
      data: enforcement
    });
  } catch (error) {
    console.error('Diversification enforcement error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check diversification rules'
    });
  }
});

/**
 * @route   POST /api/portfolio/simulate-rebalancing
 * @desc    Simulate rebalancing scenarios
 * @access  Private
 */
router.post('/simulate-rebalancing', authenticate, async (req, res) => {
  try {
    const composition = await getPortfolioComposition(req.user._id);
    const user = await User.findById(req.user._id);
    const targetAllocation = user.investmentProfile?.assetAllocation || {
      bonds: 50,
      stocks: 35,
      gold: 10,
      reits: 5
    };

    const { options } = req.body;
    const simulation = simulateRebalancing(composition, targetAllocation, options);

    res.status(200).json({
      success: true,
      data: simulation
    });
  } catch (error) {
    console.error('Rebalancing simulation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to simulate rebalancing'
    });
  }
});

/**
 * @route   POST /api/portfolio/dynamic-questionnaire
 * @desc    Process dynamic questionnaire with custom weights
 * @access  Private
 */
router.post('/dynamic-questionnaire', authenticate, async (req, res) => {
  try {
    const { answers, weights } = req.body;

    if (!answers) {
      return res.status(400).json({
        success: false,
        message: 'Questionnaire answers are required'
      });
    }

    const assessment = processDynamicQuestionnaire(answers, weights);
    const riskProfile = getRiskProfile(assessment.score);

    res.status(200).json({
      success: true,
      data: {
        assessment,
        riskProfile,
        recommendation: calculatePortfolioRecommendation(answers)
      }
    });
  } catch (error) {
    console.error('Dynamic questionnaire error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process questionnaire'
    });
  }
});

module.exports = router;
