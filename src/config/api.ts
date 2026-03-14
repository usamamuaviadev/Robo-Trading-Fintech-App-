// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://robo-backend-production.up.railway.app', // Production
  // For local development, uncomment below and comment the production URL above
  // BASE_URL: __DEV__ ? 'http://localhost:5000' : 'https://robo-backend-production.up.railway.app',
  TIMEOUT: 30000,
};

// For physical device testing, replace localhost with your computer's IP
// Example: 'http://192.168.1.100:5000'
// Find your IP: Mac/Linux: `ifconfig | grep "inet "` | Windows: `ipconfig`

export const API_ENDPOINTS = {
  // Auth
  SEND_OTP: '/api/auth/send-otp',
  VERIFY_OTP: '/api/auth/verify-otp',
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  VERIFY_PHONE: '/api/auth/verify-phone',
  GET_ME: '/api/auth/me',
  
  // User
  UPDATE_PROFILE: '/api/user/profile',
  VERIFY_IDENTITY: '/api/user/verify-identity',
  LINK_BANK: '/api/user/link-bank',
  FUNDING_PREFERENCES: '/api/user/funding-preferences',
  
  // Wallet
  WALLET_BALANCE: '/api/wallet/balance',
  WALLET_DEPOSIT: '/api/wallet/deposit',
  WALLET_WITHDRAW: '/api/wallet/withdraw',
  WALLET_TRANSACTIONS: '/api/wallet/transactions',
  
  // Reconciliation
  RECONCILIATION_ALL: '/api/reconciliation/all',
  RECONCILIATION_ESCROW: '/api/reconciliation/escrow',
  RECONCILIATION_WALLET: '/api/reconciliation/wallet',
  RECONCILIATION_AUTO_FIX: '/api/reconciliation/auto-fix',
  
  // Portfolio
  PORTFOLIO_CALCULATE_RISK: '/api/portfolio/calculate-risk',
  PORTFOLIO_PROFILES: '/api/portfolio/profiles',
  PORTFOLIO_PROFILE: '/api/portfolio/profiles',
  PORTFOLIO_COMPOSITION: '/api/portfolio/composition',
  PORTFOLIO_DIVERSIFICATION: '/api/portfolio/diversification',
  PORTFOLIO_REBALANCING: '/api/portfolio/rebalancing',
  PORTFOLIO_REASSESSMENT: '/api/portfolio/reassessment',
  PORTFOLIO_CONSTRUCT: '/api/portfolio/construct',
  PORTFOLIO_OPTIMIZE: '/api/portfolio/optimize',
  PORTFOLIO_DIVERSIFICATION_RULES: '/api/portfolio/diversification-rules',
  PORTFOLIO_SIMULATE_REBALANCING: '/api/portfolio/simulate-rebalancing',
  PORTFOLIO_DYNAMIC_QUESTIONNAIRE: '/api/portfolio/dynamic-questionnaire',
  
  // Calculator
  CALCULATOR_LUMP_SUM: '/api/calculator/lump-sum',
  CALCULATOR_RECURRING: '/api/calculator/recurring',
  CALCULATOR_COMPREHENSIVE: '/api/calculator/comprehensive',
  CALCULATOR_TIME_HORIZONS: '/api/calculator/time-horizons',
  CALCULATOR_MONTE_CARLO: '/api/calculator/monte-carlo',
  
  // Affiliate
  AFFILIATE_STATS: '/api/affiliate/stats',
  AFFILIATE_REFERRALS: '/api/affiliate/referrals',
  AFFILIATE_COMMISSIONS: '/api/affiliate/commissions',
  AFFILIATE_INITIALIZE: '/api/affiliate/initialize',
  AFFILIATE_TRACK_SIGNUP: '/api/affiliate/track-signup',
  
  // Chatbot
  CHATBOT_MESSAGE: '/api/chatbot/message',
  CHATBOT_SESSIONS: '/api/chatbot/sessions',
  CHATBOT_HISTORY: '/api/chatbot/history',
  CHATBOT_ARCHIVE_SESSION: '/api/chatbot/sessions',
  CHATBOT_FAQ_SEARCH: '/api/chatbot/faq/search',
  
  // Health
  HEALTH: '/health',

  // Market / Stocks (Alpaca + halal)
  MARKET_HALAL_STOCKS: '/api/market/halal-stocks',
  MARKET_QUOTE: '/api/alpaca/market/quote',
};
