const Trade = require('../models/Trade');
const Wallet = require('../models/Wallet');
const { getMultiplePrices } = require('./marketDataService');

/**
 * Portfolio Service
 * Handles portfolio analysis, diversification, and rebalancing
 */

/**
 * Get user's portfolio composition
 * @param {string} userId
 * @returns {Promise<object>}
 */
async function getPortfolioComposition(userId) {
  try {
    const trades = await Trade.find({
      userId,
      status: { $in: ['executed', 'settled'] }
    });

    // Group by asset
    const holdings = {};
    trades.forEach(trade => {
      if (!holdings[trade.assetId]) {
        holdings[trade.assetId] = {
          symbol: trade.assetSymbol,
          name: trade.assetName,
          quantity: 0,
          totalCost: 0,
          trades: []
        };
      }

      if (trade.type === 'buy') {
        holdings[trade.assetId].quantity += trade.quantity;
        holdings[trade.assetId].totalCost += trade.totalAmount;
      } else {
        holdings[trade.assetId].quantity -= trade.quantity;
        holdings[trade.assetId].totalCost -= trade.totalAmount;
      }

      holdings[trade.assetId].trades.push(trade._id);
    });

    // Remove assets with zero quantity
    Object.keys(holdings).forEach(assetId => {
      if (holdings[assetId].quantity <= 0) {
        delete holdings[assetId];
      }
    });

    // Get current prices
    const symbols = Object.values(holdings).map(h => h.symbol);
    const prices = await getMultiplePrices(symbols);
    const priceMap = {};
    prices.forEach(p => {
      priceMap[p.symbol] = p.price;
    });

    // Calculate current values
    let totalValue = 0;
    Object.values(holdings).forEach(holding => {
      const currentPrice = priceMap[holding.symbol] || 0;
      holding.currentPrice = currentPrice;
      holding.currentValue = holding.quantity * currentPrice;
      holding.averageCost = holding.quantity > 0 ? holding.totalCost / holding.quantity : 0;
      holding.profitLoss = holding.currentValue - holding.totalCost;
      holding.profitLossPercent = holding.totalCost > 0 
        ? ((holding.profitLoss / holding.totalCost) * 100) 
        : 0;
      totalValue += holding.currentValue;
    });

    // Calculate percentages
    Object.values(holdings).forEach(holding => {
      holding.percentage = totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0;
    });

    return {
      holdings: Object.values(holdings),
      totalValue,
      totalCost: Object.values(holdings).reduce((sum, h) => sum + h.totalCost, 0),
      totalProfitLoss: Object.values(holdings).reduce((sum, h) => sum + h.profitLoss, 0),
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('❌ Portfolio composition error:', error);
    throw error;
  }
}

/**
 * Analyze portfolio diversification
 * @param {object} portfolio - Portfolio composition
 * @param {object} targetAllocation - Target asset allocation
 * @returns {object} Diversification analysis
 */
function analyzeDiversification(portfolio, targetAllocation) {
  const analysis = {
    score: 100,
    issues: [],
    recommendations: [],
    assetClassDistribution: {},
    sectorDistribution: {},
    geographicDistribution: {}
  };

  // Check asset class distribution
  const currentAllocation = calculateAssetClassAllocation(portfolio);
  const drift = {};

  Object.keys(targetAllocation).forEach(assetClass => {
    const current = currentAllocation[assetClass] || 0;
    const target = targetAllocation[assetClass];
    const difference = Math.abs(current - target);

    drift[assetClass] = {
      current,
      target,
      difference,
      withinThreshold: difference <= 5
    };

    if (difference > 5) {
      analysis.score -= 10;
      analysis.issues.push(`${assetClass} allocation is ${difference.toFixed(1)}% off target`);
      
      if (current > target) {
        analysis.recommendations.push(`Consider reducing ${assetClass} allocation by ${difference.toFixed(1)}%`);
      } else {
        analysis.recommendations.push(`Consider increasing ${assetClass} allocation by ${difference.toFixed(1)}%`);
      }
    }
  });

  analysis.assetClassDistribution = drift;
  analysis.score = Math.max(0, analysis.score);

  // Check concentration risk
  if (portfolio.holdings && portfolio.holdings.length > 0) {
    const topHolding = portfolio.holdings[0];
    if (topHolding.percentage > 30) {
      analysis.score -= 15;
      analysis.issues.push(`Portfolio is heavily concentrated in ${topHolding.symbol} (${topHolding.percentage.toFixed(1)}%)`);
      analysis.recommendations.push('Consider diversifying across more assets');
    }
  }

  return analysis;
}

/**
 * Calculate current asset class allocation
 * @param {object} portfolio
 * @returns {object}
 */
function calculateAssetClassAllocation(portfolio) {
  // This would need asset class mapping from asset symbols
  // For now, return mock data
  return {
    bonds: 0,
    stocks: 0,
    gold: 0,
    reits: 0
  };
}

/**
 * Check if portfolio needs rebalancing
 * @param {object} portfolio - Current portfolio
 * @param {object} targetAllocation - Target allocation
 * @param {number} threshold - Drift threshold (default 5%)
 * @returns {object} Rebalancing alert
 */
function checkRebalancing(portfolio, targetAllocation, threshold = 5) {
  const currentAllocation = calculateAssetClassAllocation(portfolio);
  const drift = {};

  Object.keys(targetAllocation).forEach(assetClass => {
    const current = currentAllocation[assetClass] || 0;
    const target = targetAllocation[assetClass];
    const difference = Math.abs(current - target);

    if (difference > threshold) {
      drift[assetClass] = {
        current,
        target,
        difference,
        action: current > target ? 'reduce' : 'increase',
        amount: Math.abs(current - target)
      };
    }
  });

  const needsRebalancing = Object.keys(drift).length > 0;

  return {
    needsRebalancing,
    drift,
    recommendations: needsRebalancing 
      ? Object.keys(drift).map(assetClass => {
          const d = drift[assetClass];
          return `${d.action} ${assetClass} by ${d.amount.toFixed(1)}%`;
        })
      : []
  };
}

/**
 * Construct optimal portfolio based on risk profile and constraints
 * @param {object} riskProfile - User's risk profile
 * @param {number} totalAmount - Total investment amount
 * @param {object} constraints - Investment constraints
 * @returns {object} Optimal portfolio construction
 */
function constructOptimalPortfolio(riskProfile, totalAmount, constraints = {}) {
  const targetAllocation = riskProfile.assetAllocation || {
    bonds: 50,
    stocks: 35,
    gold: 10,
    reits: 5
  };

  const portfolio = {
    totalAmount,
    allocations: {},
    assetClasses: []
  };

  // Calculate allocation amounts
  Object.keys(targetAllocation).forEach(assetClass => {
    const percentage = targetAllocation[assetClass];
    const amount = (totalAmount * percentage) / 100;
    
    portfolio.allocations[assetClass] = {
      percentage,
      amount,
      minAmount: constraints.minInvestment || 0,
      maxAmount: constraints.maxInvestment || totalAmount
    };

    portfolio.assetClasses.push({
      class: assetClass,
      percentage,
      amount
    });
  });

  // Apply constraints
  if (constraints.minInvestment) {
    Object.keys(portfolio.allocations).forEach(assetClass => {
      if (portfolio.allocations[assetClass].amount < constraints.minInvestment) {
        portfolio.allocations[assetClass].amount = 0;
        portfolio.allocations[assetClass].percentage = 0;
      }
    });
  }

  // Rebalance percentages if some allocations were zeroed out
  const totalAllocated = Object.values(portfolio.allocations)
    .reduce((sum, alloc) => sum + alloc.amount, 0);
  
  if (totalAllocated < totalAmount) {
    const remaining = totalAmount - totalAllocated;
    // Redistribute to largest allocation
    const largestAllocation = Object.entries(portfolio.allocations)
      .sort((a, b) => b[1].amount - a[1].amount)[0];
    
    if (largestAllocation) {
      portfolio.allocations[largestAllocation[0]].amount += remaining;
      portfolio.allocations[largestAllocation[0]].percentage = 
        (portfolio.allocations[largestAllocation[0]].amount / totalAmount) * 100;
    }
  }

  return portfolio;
}

/**
 * Optimize asset allocation using Modern Portfolio Theory principles
 * @param {object} targetAllocation - Target allocation
 * @param {object} currentPortfolio - Current portfolio state
 * @param {object} marketData - Current market data
 * @returns {object} Optimized allocation
 */
function optimizeAllocation(targetAllocation, currentPortfolio, marketData = {}) {
  const optimization = {
    original: { ...targetAllocation },
    optimized: {},
    adjustments: {},
    expectedReturn: 0,
    expectedRisk: 0,
    sharpeRatio: 0
  };

  // Calculate expected returns (simplified - would use historical data)
  const expectedReturns = {
    bonds: 4.5,
    stocks: 10.0,
    gold: 6.0,
    reits: 8.0
  };

  // Calculate expected risk (volatility)
  const expectedRisk = {
    bonds: 3.0,
    stocks: 15.0,
    gold: 12.0,
    reits: 10.0
  };

  // Optimize allocation (simplified optimization)
  let totalExpectedReturn = 0;
  let totalExpectedRisk = 0;

  Object.keys(targetAllocation).forEach(assetClass => {
    const percentage = targetAllocation[assetClass];
    const current = currentPortfolio.allocations?.[assetClass]?.percentage || 0;
    
    // Slight optimization: adjust based on expected returns
    let optimized = percentage;
    
    // If asset class has high expected return and low current allocation, slightly increase
    if (expectedReturns[assetClass] > 8 && current < percentage * 0.9) {
      optimized = Math.min(percentage * 1.1, percentage + 2);
    }
    
    optimization.optimized[assetClass] = optimized;
    optimization.adjustments[assetClass] = optimized - percentage;
    
    totalExpectedReturn += (optimized / 100) * expectedReturns[assetClass];
    totalExpectedRisk += (optimized / 100) * expectedRisk[assetClass];
  });

  optimization.expectedReturn = totalExpectedReturn;
  optimization.expectedRisk = totalExpectedRisk;
  optimization.sharpeRatio = totalExpectedRisk > 0 ? totalExpectedReturn / totalExpectedRisk : 0;

  return optimization;
}

/**
 * Enforce diversification rules
 * @param {object} portfolio - Current portfolio
 * @param {object} targetAllocation - Target allocation
 * @param {object} rules - Diversification rules
 * @returns {object} Diversification enforcement result
 */
function enforceDiversificationRules(portfolio, targetAllocation, rules = {}) {
  const defaultRules = {
    maxSingleAssetConcentration: 30, // Max 30% in single asset
    minAssetClassDiversification: 3, // At least 3 asset classes
    maxAssetClassDeviation: 10, // Max 10% deviation from target
    minHoldingCount: 5, // Minimum number of holdings
    ...rules
  };

  const enforcement = {
    compliant: true,
    violations: [],
    recommendations: [],
    requiredActions: []
  };

  // Check single asset concentration
  if (portfolio.holdings && portfolio.holdings.length > 0) {
    portfolio.holdings.forEach(holding => {
      if (holding.percentage > defaultRules.maxSingleAssetConcentration) {
        enforcement.compliant = false;
        enforcement.violations.push({
          type: 'concentration',
          asset: holding.symbol,
          percentage: holding.percentage,
          maxAllowed: defaultRules.maxSingleAssetConcentration
        });
        enforcement.recommendations.push(
          `Reduce ${holding.symbol} allocation from ${holding.percentage.toFixed(1)}% to ${defaultRules.maxSingleAssetConcentration}%`
        );
        enforcement.requiredActions.push({
          action: 'sell',
          asset: holding.symbol,
          amount: (holding.currentValue * (holding.percentage - defaultRules.maxSingleAssetConcentration)) / 100
        });
      }
    });
  }

  // Check asset class diversification
  const currentAllocation = calculateAssetClassAllocation(portfolio);
  const activeAssetClasses = Object.keys(currentAllocation).filter(
    key => (currentAllocation[key] || 0) > 0
  );

  if (activeAssetClasses.length < defaultRules.minAssetClassDiversification) {
    enforcement.compliant = false;
    enforcement.violations.push({
      type: 'diversification',
      current: activeAssetClasses.length,
      required: defaultRules.minAssetClassDiversification
    });
    enforcement.recommendations.push(
      `Portfolio has only ${activeAssetClasses.length} asset classes. Add more diversification.`
    );
  }

  // Check deviation from target
  Object.keys(targetAllocation).forEach(assetClass => {
    const current = currentAllocation[assetClass] || 0;
    const target = targetAllocation[assetClass];
    const deviation = Math.abs(current - target);

    if (deviation > defaultRules.maxAssetClassDeviation) {
      enforcement.compliant = false;
      enforcement.violations.push({
        type: 'deviation',
        assetClass,
        current,
        target,
        deviation
      });
      enforcement.recommendations.push(
        `${assetClass} is ${deviation.toFixed(1)}% off target (current: ${current.toFixed(1)}%, target: ${target.toFixed(1)}%)`
      );
    }
  });

  // Check minimum holdings
  if (portfolio.holdings && portfolio.holdings.length < defaultRules.minHoldingCount) {
    enforcement.compliant = false;
    enforcement.violations.push({
      type: 'holding_count',
      current: portfolio.holdings.length,
      required: defaultRules.minHoldingCount
    });
    enforcement.recommendations.push(
      `Portfolio has only ${portfolio.holdings.length} holdings. Consider adding more positions.`
    );
  }

  return enforcement;
}

/**
 * Simulate rebalancing scenarios
 * @param {object} currentPortfolio - Current portfolio
 * @param {object} targetAllocation - Target allocation
 * @param {object} options - Simulation options
 * @returns {object} Rebalancing simulation results
 */
function simulateRebalancing(currentPortfolio, targetAllocation, options = {}) {
  const {
    threshold = 5,
    includeTaxImpact = false,
    includeTransactionCosts = true,
    transactionCostPercent = 0.1
  } = options;

  const simulation = {
    currentState: {
      allocation: calculateAssetClassAllocation(currentPortfolio),
      totalValue: currentPortfolio.totalValue || 0
    },
    targetState: {
      allocation: targetAllocation
    },
    rebalancing: {
      needed: false,
      trades: [],
      totalCost: 0,
      taxImpact: 0,
      estimatedTime: '1-2 business days'
    },
    projectedState: {
      allocation: {},
      totalValue: currentPortfolio.totalValue || 0
    }
  };

  const currentAllocation = simulation.currentState.allocation;
  const totalValue = simulation.currentState.totalValue;
  const trades = [];

  // Calculate required trades
  Object.keys(targetAllocation).forEach(assetClass => {
    const current = currentAllocation[assetClass] || 0;
    const target = targetAllocation[assetClass];
    const currentValue = (totalValue * current) / 100;
    const targetValue = (totalValue * target) / 100;
    const difference = targetValue - currentValue;
    const differencePercent = Math.abs(current - target);

    if (differencePercent > threshold) {
      simulation.rebalancing.needed = true;
      
      const trade = {
        assetClass,
        action: difference > 0 ? 'buy' : 'sell',
        currentValue,
        targetValue,
        amount: Math.abs(difference),
        percentage: differencePercent,
        currentAllocation: current,
        targetAllocation: target
      };

      // Calculate transaction costs
      if (includeTransactionCosts) {
        trade.transactionCost = (Math.abs(difference) * transactionCostPercent) / 100;
        simulation.rebalancing.totalCost += trade.transactionCost;
      }

      // Estimate tax impact (simplified)
      if (includeTaxImpact && difference < 0) {
        // Selling - potential capital gains tax
        const estimatedGain = Math.abs(difference) * 0.15; // Assume 15% average gain
        trade.taxImpact = estimatedGain * 0.15; // 15% capital gains tax
        simulation.rebalancing.taxImpact += trade.taxImpact;
      }

      trades.push(trade);
    }

    // Projected allocation after rebalancing
    simulation.projectedState.allocation[assetClass] = target;
  });

  simulation.rebalancing.trades = trades;
  simulation.projectedState.totalValue = totalValue - simulation.rebalancing.totalCost - simulation.rebalancing.taxImpact;

  // Calculate rebalancing priority
  trades.sort((a, b) => b.percentage - a.percentage);
  simulation.rebalancing.priority = trades.length > 0 ? 'high' : 'low';

  return simulation;
}

module.exports = {
  getPortfolioComposition,
  analyzeDiversification,
  checkRebalancing,
  constructOptimalPortfolio,
  optimizeAllocation,
  enforceDiversificationRules,
  simulateRebalancing
};
