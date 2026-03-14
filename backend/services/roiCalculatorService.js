const riskScoreService = require('./riskScoreService');
const getPrebuiltProfile = riskScoreService.getPrebuiltProfile;

/**
 * ROI Calculator Service
 * Provides comprehensive ROI calculation algorithms for investment planning
 */

/**
 * Expected returns by risk profile (annual)
 */
const EXPECTED_RETURNS = {
  conservative: 6.5,
  balanced: 9.5,
  advanced: 12.5,
  aggressive: 14.0,
  adventure: 16.0
};

/**
 * Risk-adjusted returns (with volatility)
 */
const RISK_ADJUSTED_RETURNS = {
  conservative: { mean: 6.5, stdDev: 3.0 },
  balanced: { mean: 9.5, stdDev: 8.0 },
  advanced: { mean: 12.5, stdDev: 12.0 },
  aggressive: { mean: 14.0, stdDev: 15.0 },
  adventure: { mean: 16.0, stdDev: 18.0 }
};

/**
 * Calculate lump sum investment ROI
 * @param {number} principal - Initial investment amount
 * @param {number} annualReturn - Annual return rate (as decimal, e.g., 0.095 for 9.5%)
 * @param {number} years - Investment time horizon in years
 * @param {number} inflationRate - Annual inflation rate (default 2.5%)
 * @returns {object} ROI calculation results
 */
function calculateLumpSumROI(principal, annualReturn, years, inflationRate = 0.025) {
  // Future value with compound interest
  const futureValue = principal * Math.pow(1 + annualReturn, years);
  
  // Total return
  const totalReturn = futureValue - principal;
  
  // ROI percentage
  const roiPercent = (totalReturn / principal) * 100;
  
  // Real value (adjusted for inflation)
  const realFutureValue = futureValue / Math.pow(1 + inflationRate, years);
  const realReturn = realFutureValue - principal;
  const realROIPercent = (realReturn / principal) * 100;
  
  // Year-by-year breakdown
  const yearlyBreakdown = [];
  for (let year = 1; year <= years; year++) {
    const yearValue = principal * Math.pow(1 + annualReturn, year);
    const yearReturn = yearValue - principal;
    yearlyBreakdown.push({
      year,
      value: yearValue,
      return: yearReturn,
      returnPercent: (yearReturn / principal) * 100
    });
  }

  return {
    principal,
    futureValue,
    totalReturn,
    roiPercent,
    realFutureValue,
    realReturn,
    realROIPercent,
    annualReturn: annualReturn * 100,
    years,
    inflationRate: inflationRate * 100,
    yearlyBreakdown
  };
}

/**
 * Calculate recurring investment ROI (DCA - Dollar Cost Averaging)
 * @param {number} monthlyAmount - Monthly investment amount
 * @param {number} annualReturn - Annual return rate
 * @param {number} years - Investment time horizon
 * @param {number} inflationRate - Annual inflation rate
 * @returns {object} ROI calculation results
 */
function calculateRecurringROI(monthlyAmount, annualReturn, years, inflationRate = 0.025) {
  const monthlyReturn = annualReturn / 12;
  const totalMonths = years * 12;
  const totalInvested = monthlyAmount * totalMonths;
  
  // Future value of annuity (monthly contributions)
  // FV = PMT * (((1 + r)^n - 1) / r)
  const futureValue = monthlyAmount * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
  
  const totalReturn = futureValue - totalInvested;
  const roiPercent = (totalReturn / totalInvested) * 100;
  
  // Real value (adjusted for inflation)
  const realFutureValue = futureValue / Math.pow(1 + inflationRate, years);
  const realReturn = realFutureValue - totalInvested;
  const realROIPercent = (realReturn / totalInvested) * 100;
  
  // Year-by-year breakdown
  const yearlyBreakdown = [];
  let cumulativeValue = 0;
  for (let year = 1; year <= years; year++) {
    const yearMonths = year * 12;
    const yearInvested = monthlyAmount * 12;
    cumulativeValue = monthlyAmount * ((Math.pow(1 + monthlyReturn, yearMonths) - 1) / monthlyReturn);
    const yearReturn = cumulativeValue - (monthlyAmount * yearMonths);
    yearlyBreakdown.push({
      year,
      invested: monthlyAmount * yearMonths,
      value: cumulativeValue,
      return: yearReturn,
      returnPercent: (yearReturn / (monthlyAmount * yearMonths)) * 100
    });
  }

  return {
    monthlyAmount,
    totalInvested,
    futureValue,
    totalReturn,
    roiPercent,
    realFutureValue,
    realReturn,
    realROIPercent,
    annualReturn: annualReturn * 100,
    years,
    inflationRate: inflationRate * 100,
    yearlyBreakdown
  };
}

/**
 * Calculate ROI with variable time horizons
 * @param {object} params - Calculation parameters
 * @param {string} investmentType - 'lump_sum' or 'recurring'
 * @param {string} riskProfile - Risk profile name
 * @returns {object} ROI results for multiple time horizons
 */
function calculateVariableTimeHorizons(params, investmentType, riskProfile) {
  const profile = getPrebuiltProfile(riskProfile);
  const annualReturn = (profile.expectedReturn || EXPECTED_RETURNS[riskProfile] || 9.5) / 100;
  
  const timeHorizons = [1, 3, 5, 10, 15, 20, 25, 30];
  const results = [];

  timeHorizons.forEach(years => {
    let calculation;
    if (investmentType === 'lump_sum') {
      calculation = calculateLumpSumROI(
        params.principal || params.monthlyAmount * 12,
        annualReturn,
        years
      );
    } else {
      calculation = calculateRecurringROI(
        params.monthlyAmount || params.principal / 12,
        annualReturn,
        years
      );
    }
    
    results.push({
      years,
      futureValue: calculation.futureValue,
      totalReturn: calculation.totalReturn,
      roiPercent: calculation.roiPercent
    });
  });

  return {
    riskProfile,
    annualReturn: annualReturn * 100,
    results
  };
}

/**
 * Risk-based performance modeling
 * @param {object} params - Investment parameters
 * @param {string} riskProfile - Risk profile
 * @param {number} years - Time horizon
 * @returns {object} Risk-adjusted performance projections
 */
function riskBasedPerformanceModeling(params, riskProfile, years) {
  const profile = getPrebuiltProfile(riskProfile);
  const riskData = RISK_ADJUSTED_RETURNS[riskProfile] || RISK_ADJUSTED_RETURNS.balanced;
  
  // Base calculation
  const baseReturn = riskData.mean / 100;
  const baseCalculation = params.investmentType === 'lump_sum'
    ? calculateLumpSumROI(params.principal || params.monthlyAmount * 12, baseReturn, years)
    : calculateRecurringROI(params.monthlyAmount || params.principal / 12, baseReturn, years);

  // Optimistic scenario (+1 standard deviation)
  const optimisticReturn = (riskData.mean + riskData.stdDev) / 100;
  const optimisticCalculation = params.investmentType === 'lump_sum'
    ? calculateLumpSumROI(params.principal || params.monthlyAmount * 12, optimisticReturn, years)
    : calculateRecurringROI(params.monthlyAmount || params.principal / 12, optimisticReturn, years);

  // Pessimistic scenario (-1 standard deviation)
  const pessimisticReturn = Math.max(0, (riskData.mean - riskData.stdDev) / 100);
  const pessimisticCalculation = params.investmentType === 'lump_sum'
    ? calculateLumpSumROI(params.principal || params.monthlyAmount * 12, pessimisticReturn, years)
    : calculateRecurringROI(params.monthlyAmount || params.principal / 12, pessimisticReturn, years);

  return {
    riskProfile,
    riskLevel: profile.riskLevel || 5,
    scenarios: {
      base: {
        annualReturn: riskData.mean,
        futureValue: baseCalculation.futureValue,
        totalReturn: baseCalculation.totalReturn,
        roiPercent: baseCalculation.roiPercent
      },
      optimistic: {
        annualReturn: riskData.mean + riskData.stdDev,
        futureValue: optimisticCalculation.futureValue,
        totalReturn: optimisticCalculation.totalReturn,
        roiPercent: optimisticCalculation.roiPercent,
        probability: 16 // ~16% chance (1 std dev above mean)
      },
      pessimistic: {
        annualReturn: Math.max(0, riskData.mean - riskData.stdDev),
        futureValue: pessimisticCalculation.futureValue,
        totalReturn: pessimisticCalculation.totalReturn,
        roiPercent: pessimisticCalculation.roiPercent,
        probability: 16 // ~16% chance (1 std dev below mean)
      }
    },
    volatility: riskData.stdDev
  };
}

/**
 * Historical simulation engine
 * @param {object} params - Investment parameters
 * @param {string} riskProfile - Risk profile
 * @param {number} years - Time horizon
 * @param {array} historicalReturns - Historical annual returns (optional)
 * @returns {object} Historical simulation results
 */
function historicalSimulation(params, riskProfile, years, historicalReturns = null) {
  const profile = getPrebuiltProfile(riskProfile);
  const baseReturn = (profile.expectedReturn || EXPECTED_RETURNS[riskProfile] || 9.5) / 100;
  
  // If historical returns provided, use them; otherwise generate based on risk profile
  let returns = historicalReturns;
  if (!returns || returns.length === 0) {
    // Generate synthetic historical returns based on risk profile volatility
    const riskData = RISK_ADJUSTED_RETURNS[riskProfile] || RISK_ADJUSTED_RETURNS.balanced;
    returns = [];
    for (let i = 0; i < Math.min(years, 20); i++) {
      // Simulate returns with some randomness
      const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
      const simulatedReturn = riskData.mean + (riskData.stdDev * randomFactor);
      returns.push(Math.max(0, simulatedReturn) / 100);
    }
  }

  // Simulate investment growth year by year
  const simulation = [];
  let currentValue = params.investmentType === 'lump_sum' 
    ? (params.principal || params.monthlyAmount * 12)
    : 0;
  let totalInvested = params.investmentType === 'lump_sum'
    ? (params.principal || params.monthlyAmount * 12)
    : 0;

  for (let year = 1; year <= years; year++) {
    if (params.investmentType === 'recurring') {
      // Add monthly contributions
      totalInvested += (params.monthlyAmount || params.principal / 12) * 12;
      currentValue += (params.monthlyAmount || params.principal / 12) * 12;
    }
    
    // Apply return for this year (use historical if available, otherwise base return)
    const yearReturn = returns[year - 1] || baseReturn;
    currentValue = currentValue * (1 + yearReturn);
    
    const yearReturnAmount = currentValue - totalInvested;
    const yearROIPercent = totalInvested > 0 ? (yearReturnAmount / totalInvested) * 100 : 0;
    
    simulation.push({
      year,
      return: yearReturn * 100,
      value: currentValue,
      invested: totalInvested,
      profit: yearReturnAmount,
      roiPercent: yearROIPercent
    });
  }

  return {
    riskProfile,
    years,
    finalValue: currentValue,
    totalInvested,
    totalReturn: currentValue - totalInvested,
    roiPercent: totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
    simulation,
    averageAnnualReturn: returns.reduce((a, b) => a + b, 0) / returns.length * 100
  };
}

/**
 * Forward-looking projection engine
 * @param {object} params - Investment parameters
 * @param {string} riskProfile - Risk profile
 * @param {number} years - Time horizon
 * @param {object} marketAssumptions - Market assumptions (optional)
 * @returns {object} Forward-looking projections
 */
function forwardLookingProjection(params, riskProfile, years, marketAssumptions = {}) {
  const profile = getPrebuiltProfile(riskProfile);
  const baseReturn = (profile.expectedReturn || EXPECTED_RETURNS[riskProfile] || 9.5) / 100;
  
  // Adjust for market assumptions if provided
  let adjustedReturn = baseReturn;
  if (marketAssumptions.economicCycle) {
    // Adjust based on economic cycle
    const cycleAdjustments = {
      expansion: 1.1, // 10% higher returns
      peak: 1.0,
      contraction: 0.8, // 20% lower returns
      trough: 0.7 // 30% lower returns
    };
    adjustedReturn *= (cycleAdjustments[marketAssumptions.economicCycle] || 1.0);
  }

  if (marketAssumptions.marketTrend) {
    // Adjust for market trend
    const trendAdjustments = {
      bullish: 1.15,
      neutral: 1.0,
      bearish: 0.85
    };
    adjustedReturn *= (trendAdjustments[marketAssumptions.marketTrend] || 1.0);
  }

  // Calculate base projection
  const baseProjection = params.investmentType === 'lump_sum'
    ? calculateLumpSumROI(params.principal || params.monthlyAmount * 12, adjustedReturn, years)
    : calculateRecurringROI(params.monthlyAmount || params.principal / 12, adjustedReturn, years);

  // Generate year-by-year projections with some variability
  const projections = [];
  for (let year = 1; year <= years; year++) {
    const yearProjection = params.investmentType === 'lump_sum'
      ? calculateLumpSumROI(params.principal || params.monthlyAmount * 12, adjustedReturn, year)
      : calculateRecurringROI(params.monthlyAmount || params.principal / 12, adjustedReturn, year);
    
    projections.push({
      year,
      projectedValue: yearProjection.futureValue,
      projectedReturn: yearProjection.totalReturn,
      projectedROI: yearProjection.roiPercent
    });
  }

  return {
    riskProfile,
    years,
    adjustedAnnualReturn: adjustedReturn * 100,
    baseAnnualReturn: baseReturn * 100,
    marketAssumptions,
    finalProjectedValue: baseProjection.futureValue,
    totalProjectedReturn: baseProjection.totalReturn,
    projectedROI: baseProjection.roiPercent,
    projections
  };
}

/**
 * Monte Carlo simulation (advanced mode)
 * @param {object} params - Investment parameters
 * @param {string} riskProfile - Risk profile
 * @param {number} years - Time horizon
 * @param {number} simulations - Number of simulations (default 1000)
 * @returns {object} Monte Carlo simulation results
 */
function monteCarloSimulation(params, riskProfile, years, simulations = 1000) {
  const riskData = RISK_ADJUSTED_RETURNS[riskProfile] || RISK_ADJUSTED_RETURNS.balanced;
  const mean = riskData.mean / 100;
  const stdDev = riskData.stdDev / 100;
  
  const results = [];
  const principal = params.investmentType === 'lump_sum'
    ? (params.principal || params.monthlyAmount * 12)
    : 0;
  const monthlyAmount = params.investmentType === 'recurring'
    ? (params.monthlyAmount || params.principal / 12)
    : 0;

  // Run simulations
  for (let sim = 0; sim < simulations; sim++) {
    let value = principal;
    let totalInvested = principal;
    
    for (let year = 1; year <= years; year++) {
      // Generate random annual return (normal distribution)
      const randomReturn = generateNormalRandom(mean, stdDev);
      
      if (params.investmentType === 'recurring') {
        totalInvested += monthlyAmount * 12;
        value += monthlyAmount * 12;
      }
      
      value = value * (1 + randomReturn);
    }
    
    const roi = totalInvested > 0 ? ((value - totalInvested) / totalInvested) * 100 : 0;
    results.push({
      finalValue: value,
      totalInvested,
      roi
    });
  }

  // Sort results
  results.sort((a, b) => a.finalValue - b.finalValue);

  // Calculate percentiles
  const percentile = (arr, p) => {
    const index = Math.floor(arr.length * p);
    return arr[Math.min(index, arr.length - 1)];
  };

  return {
    riskProfile,
    years,
    simulations,
    statistics: {
      mean: results.reduce((sum, r) => sum + r.finalValue, 0) / results.length,
      median: percentile(results.map(r => r.finalValue), 0.5),
      p10: percentile(results.map(r => r.finalValue), 0.1), // 10th percentile (worst 10%)
      p25: percentile(results.map(r => r.finalValue), 0.25),
      p75: percentile(results.map(r => r.finalValue), 0.75),
      p90: percentile(results.map(r => r.finalValue), 0.9), // 90th percentile (best 10%)
      stdDev: calculateStdDev(results.map(r => r.finalValue))
    },
    roiStatistics: {
      mean: results.reduce((sum, r) => sum + r.roi, 0) / results.length,
      median: percentile(results.map(r => r.roi), 0.5),
      p10: percentile(results.map(r => r.roi), 0.1),
      p90: percentile(results.map(r => r.roi), 0.9)
    },
    probabilityOfLoss: results.filter(r => r.finalValue < totalInvested).length / results.length * 100
  };
}

/**
 * Generate random number from normal distribution (Box-Muller transform)
 * @param {number} mean - Mean
 * @param {number} stdDev - Standard deviation
 * @returns {number} Random value
 */
function generateNormalRandom(mean, stdDev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, mean + z0 * stdDev); // Ensure non-negative
}

/**
 * Calculate standard deviation
 * @param {array} values - Array of values
 * @returns {number} Standard deviation
 */
function calculateStdDev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Comprehensive ROI calculation (all methods)
 * @param {object} params - Investment parameters
 * @param {string} riskProfile - Risk profile
 * @returns {object} Complete ROI analysis
 */
function calculateComprehensiveROI(params, riskProfile) {
  const years = params.years || 10;
  const investmentType = params.investmentType || 'lump_sum';
  
  // Base calculations
  const baseCalculation = investmentType === 'lump_sum'
    ? calculateLumpSumROI(params.principal, params.annualReturn / 100, years)
    : calculateRecurringROI(params.monthlyAmount, params.annualReturn / 100, years);

  // Risk-based modeling
  const riskModeling = riskBasedPerformanceModeling(params, riskProfile, years);

  // Variable time horizons
  const timeHorizons = calculateVariableTimeHorizons(params, investmentType, riskProfile);

  // Historical simulation
  const historical = historicalSimulation(params, riskProfile, years);

  // Forward-looking projection
  const forwardProjection = forwardLookingProjection(params, riskProfile, years, params.marketAssumptions || {});

  // Monte Carlo (if requested)
  let monteCarlo = null;
  if (params.includeMonteCarlo) {
    monteCarlo = monteCarloSimulation(params, riskProfile, years, params.simulations || 1000);
  }

  return {
    investmentType,
    riskProfile,
    years,
    baseCalculation,
    riskModeling,
    timeHorizons,
    historical,
    forwardProjection,
    monteCarlo,
    summary: {
      bestCase: riskModeling.scenarios.optimistic.futureValue,
      baseCase: baseCalculation.futureValue,
      worstCase: riskModeling.scenarios.pessimistic.futureValue,
      expectedROI: baseCalculation.roiPercent
    }
  };
}

module.exports = {
  calculateLumpSumROI,
  calculateRecurringROI,
  calculateVariableTimeHorizons,
  riskBasedPerformanceModeling,
  historicalSimulation,
  forwardLookingProjection,
  monteCarloSimulation,
  calculateComprehensiveROI
};
