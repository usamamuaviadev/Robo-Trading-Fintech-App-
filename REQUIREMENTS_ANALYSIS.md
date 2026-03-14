# Requirements Analysis - Robo Advisor Application

## Executive Summary

This document provides a comprehensive analysis of the current implementation status against the specified requirements for the Robo Advisor application. The analysis covers 6 major feature areas with detailed status for each component.

---

## 1. User Onboarding

### 1.1 Sign up with Phone/Email Verification
**Status: ✅ PARTIALLY IMPLEMENTED**

**Current Implementation:**
- ✅ Phone number verification via OTP (SMS) - `backend/routes/auth.js`
- ✅ Email verification support exists in OTP service
- ✅ OTP generation and verification flow (`backend/services/otpService.js`)
- ✅ Demo mode for testing OTP functionality
- ✅ User registration endpoint (`POST /api/auth/register`)

**Missing:**
- ❌ Email verification flow not fully integrated in frontend
- ❌ Email/phone choice during signup not implemented
- ❌ Resend OTP functionality (partially exists but needs UI)

**Files:**
- `backend/routes/auth.js` (lines 14-109, 174-358)
- `backend/services/otpService.js`
- `backend/models/OTP.js`
- `src/screens/account/AccountStepScreen.tsx` (OTP handling)

---

### 1.2 Two-Factor Authentication (2FA)
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No 2FA implementation found
- ❌ No TOTP (Time-based OTP) support
- ❌ No authenticator app integration
- ❌ No backup codes system

**Required Implementation:**
- Implement TOTP-based 2FA (Google Authenticator, Authy)
- Add 2FA enable/disable in user settings
- Require 2FA code during login after password
- Store 2FA secret securely
- Generate backup codes

**Suggested Approach:**
- Use `speakeasy` or `otplib` for TOTP generation
- Add `twoFactorEnabled` and `twoFactorSecret` fields to User model
- Create `/api/auth/enable-2fa` and `/api/auth/verify-2fa` endpoints
- Update login flow to require 2FA code

---

### 1.3 Profile Setup with Risk Assessment Questionnaire
**Status: ✅ IMPLEMENTED**

**Current Implementation:**
- ✅ Multi-step questionnaire flow (steps 4-8 in `AccountFlowConfig.ts`)
- ✅ Questions cover:
  - Primary investment goal (step 4)
  - Withdrawal timeline (step 5)
  - Monthly deposit amount (step 6)
  - Investment objective (step 7)
  - Risk tolerance (step 8)
- ✅ Responses stored in `user.investmentProfile`
- ✅ Data persisted during registration

**Files:**
- `src/screens/account/AccountFlowConfig.ts` (steps 4-8)
- `src/screens/account/AccountStepScreen.tsx`
- `backend/models/User.js` (investmentProfile schema)

**Enhancement Needed:**
- ⚠️ Risk score calculation algorithm not visible (may be in frontend logic)
- ⚠️ Questionnaire results should generate numeric risk score (0-100)

---

## 2. Portfolio Recommendation Engine

### 2.1 Risk Profile Generation Based on Questionnaire
**Status: ⚠️ PARTIALLY IMPLEMENTED**

**Current Implementation:**
- ✅ Questionnaire responses collected
- ✅ Portfolio recommendation screen (step 9) shows "Balanced Portfolio"
- ✅ Asset allocation displayed (step 10)
- ⚠️ Risk score calculation logic not clearly visible in codebase

**Missing:**
- ❌ Explicit risk score calculation algorithm
- ❌ Risk profile categories (Conservative, Balanced, Advanced, Adventure)
- ❌ Risk score stored in user profile

**Required Implementation:**
```javascript
// Risk Score Calculation (Example)
function calculateRiskScore(answers) {
  let score = 0;
  // Primary goal weights
  if (answers.primaryGoal === 'retirement') score += 20;
  if (answers.primaryGoal === 'income') score += 15;
  // Withdrawal timeline weights
  if (answers.withdrawalTimeline === 'gt5') score += 30;
  if (answers.withdrawalTimeline === 'lt1') score += 5;
  // Risk tolerance weights
  if (answers.riskTolerance === 'longterm') score += 25;
  // Investment objective
  if (answers.investmentObjective === 'growth') score += 20;
  return Math.min(100, score);
}
```

---

### 2.2 Prebuilt Profile Selection
**Status: ⚠️ PARTIALLY IMPLEMENTED**

**Current Implementation:**
- ✅ Portfolio recommendation screen exists (step 9)
- ✅ Only "Balanced" profile shown
- ❌ No option to select from multiple prebuilt profiles

**Missing:**
- ❌ Conservative profile option
- ❌ Advanced profile option
- ❌ Adventure profile option
- ❌ UI to switch between profiles
- ❌ Profile comparison feature

**Required Implementation:**
- Add profile selection screen after risk assessment
- Define prebuilt profiles with asset allocations:
  - **Conservative**: 70% Bonds, 20% Stocks, 10% Gold
  - **Balanced**: 50% Bonds, 35% Stocks, 10% Gold, 5% REITs
  - **Advanced**: 30% Bonds, 50% Stocks, 15% Gold, 5% REITs
  - **Adventure**: 10% Bonds, 70% Stocks, 15% Gold, 5% REITs

---

### 2.3 Manual Portfolio Adjustment
**Status: ✅ IMPLEMENTED**

**Current Implementation:**
- ✅ Asset allocation adjustment screen (step 10)
- ✅ Users can modify percentages
- ✅ Visual representation with colors
- ✅ Allocation stored in `user.investmentProfile.assetAllocation`

**Files:**
- `src/screens/account/AccountStepScreen.tsx` (allocation editing)
- `src/screens/account/AccountFlowConfig.ts` (step 10)

**Enhancement:**
- ⚠️ Validation to ensure allocations sum to 100%
- ⚠️ Min/max constraints per asset type

---

### 2.4 Individual Product Selection
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No product selection screen
- ❌ No product catalog
- ❌ No individual asset/fund selection

**Required Implementation:**
- Product catalog with:
  - Stocks (individual companies)
  - Bonds (Sukuk, government bonds)
  - ETFs
  - Mutual funds
  - REITs
- Product details page (performance, fees, risk rating)
- Add/remove products from portfolio
- Portfolio composition view

---

### 2.5 Halal Asset Filtering via Zoya API
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No Zoya API integration
- ❌ No halal filtering logic
- ❌ No sharia compliance checking

**Required Implementation:**
- Integrate Zoya API for halal certification
- Filter products by halal status
- Display halal certification badge
- API endpoint: `GET /api/assets/halal-filtered`
- Cache halal status to reduce API calls

**Zoya API Integration Example:**
```javascript
// backend/services/zoyaService.js
const axios = require('axios');

async function checkHalalStatus(symbol) {
  const response = await axios.get(`https://api.zoya.com/v1/check`, {
    params: { symbol },
    headers: { 'Authorization': `Bearer ${process.env.ZOYA_API_KEY}` }
  });
  return response.data.isHalal;
}
```

---

## 3. Wallet & Escrow Management

### 3.1 Sub-Account Under Master Escrow
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No wallet model
- ❌ No escrow account structure
- ❌ No sub-account management

**Required Implementation:**
- Create Wallet model:
```javascript
// backend/models/Wallet.js
const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  masterEscrowId: { type: String, required: true },
  subAccountId: { type: String, unique: true, required: true },
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'SAR' },
  status: { type: String, enum: ['active', 'frozen', 'closed'], default: 'active' }
});
```

- Create Escrow model:
```javascript
// backend/models/Escrow.js
const escrowSchema = new mongoose.Schema({
  masterEscrowId: { type: String, unique: true, required: true },
  totalBalance: { type: Number, default: 0 },
  pendingTrades: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trade' }],
  settledTrades: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trade' }]
});
```

---

### 3.2 Deposit/Withdrawal Tracking
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No deposit functionality
- ❌ No withdrawal functionality
- ❌ No transaction history

**Required Implementation:**
- Transaction model:
```javascript
// backend/models/Transaction.js
const transactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  method: { type: String, enum: ['bank_transfer', 'card', 'wallet'] },
  reference: { type: String },
  createdAt: { type: Date, default: Date.now }
});
```

- API endpoints:
  - `POST /api/wallet/deposit`
  - `POST /api/wallet/withdraw`
  - `GET /api/wallet/transactions`
  - `GET /api/wallet/balance`

---

### 3.3 Trade Execution Tracking
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No trade model
- ❌ No order management
- ❌ No execution tracking

**Required Implementation:**
- Trade model:
```javascript
// backend/models/Trade.js
const tradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  assetId: { type: String, required: true },
  assetSymbol: { type: String, required: true },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'executed', 'settled', 'failed'], default: 'pending' },
  executedAt: { type: Date },
  settledAt: { type: Date }
});
```

- Real-time tracking via WebSocket or polling
- Trade execution API: `POST /api/trades/execute`
- Trade status API: `GET /api/trades/:tradeId`

---

### 3.4 Escrow Settlement
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No settlement logic
- ❌ No fund release mechanism

**Required Implementation:**
- Settlement service:
```javascript
// backend/services/settlementService.js
async function settleTrade(tradeId) {
  const trade = await Trade.findById(tradeId);
  if (trade.status !== 'executed') {
    throw new Error('Trade must be executed before settlement');
  }
  
  // Release funds from escrow
  const escrow = await Escrow.findOne({ masterEscrowId: trade.wallet.masterEscrowId });
  escrow.totalBalance -= trade.totalAmount;
  await escrow.save();
  
  // Update trade status
  trade.status = 'settled';
  trade.settledAt = new Date();
  await trade.save();
  
  // Update wallet balance
  const wallet = await Wallet.findById(trade.walletId);
  // Adjust based on buy/sell
  await wallet.save();
}
```

- Settlement API: `POST /api/trades/:tradeId/settle`
- Automatic settlement cron job (runs daily)

---

## 4. Kids' Investment Wallets

### 4.1 Dedicated Wallets for Minors
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No minor wallet model
- ❌ No parent-child relationship
- ❌ No age verification

**Required Implementation:**
- Minor wallet model:
```javascript
// backend/models/MinorWallet.js
const minorWalletSchema = new mongoose.Schema({
  minorName: { type: String, required: true },
  minorBirthDate: { type: Date, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  ageGroup: { type: String, enum: ['0-5', '6-12', '13-17'], required: true },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' }
});
```

- API endpoints:
  - `POST /api/minor-wallets/create`
  - `GET /api/minor-wallets` (list parent's kids' wallets)
  - `PUT /api/minor-wallets/:id`
  - `DELETE /api/minor-wallets/:id`

---

### 4.2 Parent Management & Supervision
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No parent dashboard for kids' wallets
- ❌ No supervision controls

**Required Implementation:**
- Parent dashboard showing:
  - All kids' wallets
  - Total balance per child
  - Recent transactions
  - Portfolio performance
- Supervision features:
  - Set spending limits
  - Approve/reject transactions
  - View transaction history
  - Set investment goals per child

---

### 4.3 Age-Based Predefined Profiles
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No age-based profiles

**Required Implementation:**
- Age group profiles:
  - **0-5 years**: 80% Bonds, 15% Stocks, 5% Gold (Ultra Conservative)
  - **6-12 years**: 60% Bonds, 30% Stocks, 10% Gold (Conservative)
  - **13-17 years**: 40% Bonds, 50% Stocks, 10% Gold (Moderate)
- Auto-assign profile based on age
- Allow parent to override

---

### 4.4 Unique Payment & Funding Method
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No special funding method for kids' wallets

**Required Implementation:**
- Funding methods:
  - Parent transfers from main wallet
  - Recurring allowance setup
  - Gift contributions from family
  - Educational savings plan
- API: `POST /api/minor-wallets/:id/fund`

---

## 5. Market Insights & Alerts

### 5.1 Real-Time Asset Monitoring
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No broker API integration
- ❌ No real-time price updates
- ❌ No market data service

**Required Implementation:**
- Market data service:
```javascript
// backend/services/marketDataService.js
const axios = require('axios');

async function getAssetPrice(symbol) {
  // Integrate with broker API (e.g., Al Rajhi Capital, Alinma)
  const response = await axios.get(`https://api.broker.com/v1/market/${symbol}`, {
    headers: { 'Authorization': `Bearer ${process.env.BROKER_API_KEY}` }
  });
  return response.data;
}
```

- Real-time updates via WebSocket or polling
- Cache prices to reduce API calls
- API endpoint: `GET /api/market/prices`

---

### 5.2 Market Change Notifications
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No notification system
- ❌ No alert rules

**Required Implementation:**
- Notification model:
```javascript
// backend/models/Notification.js
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['price_alert', 'diversification', 'rebalancing'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
```

- Push notification service (Firebase Cloud Messaging)
- In-app notification center
- Email notifications for critical alerts

---

### 5.3 Diversification Advice
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No diversification analysis
- ❌ No portfolio health checks

**Required Implementation:**
- Diversification analyzer:
```javascript
// backend/services/diversificationService.js
function analyzeDiversification(portfolio) {
  const analysis = {
    score: 0,
    issues: [],
    recommendations: []
  };
  
  // Check asset class distribution
  if (portfolio.stocks > 70) {
    analysis.issues.push('Over-concentration in stocks');
    analysis.recommendations.push('Consider adding bonds for stability');
  }
  
  // Check sector diversification
  // Check geographic diversification
  
  return analysis;
}
```

- API: `GET /api/portfolio/diversification-analysis`

---

### 5.4 Rebalancing Alerts
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No rebalancing logic
- ❌ No drift detection

**Required Implementation:**
- Rebalancing service:
```javascript
// backend/services/rebalancingService.js
function checkRebalancing(portfolio, targetAllocation) {
  const drift = {};
  const threshold = 5; // 5% drift threshold
  
  for (const asset in targetAllocation) {
    const current = portfolio[asset] || 0;
    const target = targetAllocation[asset];
    const difference = Math.abs(current - target);
    
    if (difference > threshold) {
      drift[asset] = {
        current,
        target,
        difference,
        action: current > target ? 'reduce' : 'increase'
      };
    }
  }
  
  return Object.keys(drift).length > 0 ? drift : null;
}
```

- Alert when portfolio drifts >5% from target
- API: `GET /api/portfolio/rebalancing-alert`

---

## 6. Support Chatbot (AI-based)

### 6.1 24/7 In-App Chatbot
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No chatbot component
- ❌ No AI integration
- ❌ No chat interface

**Required Implementation:**
- Chatbot component:
```typescript
// src/components/Chatbot.tsx
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}
```

- AI service integration (OpenAI, Anthropic, or local LLM):
```javascript
// backend/services/chatbotService.js
const OpenAI = require('openai');

async function getChatbotResponse(userMessage, context) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a non-advisory support chatbot for a robo-advisor app. You can help with FAQs and onboarding, but you cannot provide investment advice or execute trades.'
      },
      {
        role: 'user',
        content: userMessage
      }
    ]
  });
  
  return response.choices[0].message.content;
}
```

- API endpoint: `POST /api/chatbot/message`
- Chat history storage
- Context-aware responses (user's profile, portfolio)

---

### 6.2 FAQs & Onboarding Assistance
**Status: ❌ NOT IMPLEMENTED**

**Current Implementation:**
- ❌ No FAQ system
- ❌ No knowledge base

**Required Implementation:**
- FAQ knowledge base:
```javascript
// backend/models/FAQ.js
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, enum: ['onboarding', 'portfolio', 'wallet', 'general'] },
  tags: [String]
});
```

- Pre-populate with common questions
- Vector search for semantic matching
- API: `GET /api/faq/search?query=...`

---

### 6.3 Non-Advisory & Non-Trading Nature
**Status: ⚠️ REQUIRES IMPLEMENTATION**

**Required Implementation:**
- System prompt must explicitly state:
  - "You are a support assistant, not a financial advisor"
  - "You cannot provide investment recommendations"
  - "You cannot execute trades"
  - "You can only help with app usage and general information"
- Response filtering to prevent advisory content
- Compliance logging for audit purposes

---

## Implementation Priority Matrix

### High Priority (Core Features)
1. ✅ User Onboarding (mostly done, needs 2FA)
2. ⚠️ Portfolio Recommendation Engine (needs risk scoring, Zoya API)
3. ❌ Wallet & Escrow Management (critical for operations)
4. ❌ Market Insights & Alerts (user engagement)

### Medium Priority
5. ❌ Kids' Investment Wallets (niche feature)
6. ❌ Support Chatbot (can use human support initially)

---

## Technical Debt & Recommendations

### Database Schema Updates Needed
1. Add Wallet, Escrow, Transaction, Trade models
2. Add MinorWallet model
3. Add Notification model
4. Add FAQ model
5. Add risk score field to User model
6. Add 2FA fields to User model

### API Endpoints to Create
- `/api/wallet/*` - Wallet management
- `/api/trades/*` - Trade execution
- `/api/market/*` - Market data
- `/api/notifications/*` - Notifications
- `/api/minor-wallets/*` - Kids' wallets
- `/api/chatbot/*` - Chatbot
- `/api/assets/halal-filtered` - Zoya integration

### Third-Party Integrations Required
1. **Zoya API** - Halal asset filtering
2. **Broker API** - Real-time market data (Al Rajhi Capital, Alinma, etc.)
3. **Payment Gateway** - Deposits/withdrawals (Moyasar, Tap Payments)
4. **Push Notifications** - Firebase Cloud Messaging
5. **AI Service** - OpenAI/Anthropic for chatbot

### Security Considerations
1. Implement 2FA for enhanced security
2. Encrypt sensitive wallet data
3. Rate limiting on API endpoints
4. Audit logging for financial transactions
5. Compliance with Saudi CMA regulations

---

## Next Steps

1. **Phase 1: Core Financial Operations**
   - Implement Wallet & Escrow system
   - Add deposit/withdrawal functionality
   - Create trade execution system

2. **Phase 2: Enhanced Features**
   - Integrate Zoya API for halal filtering
   - Add market data integration
   - Implement notifications system

3. **Phase 3: Advanced Features**
   - Kids' wallets
   - AI chatbot
   - Advanced portfolio analytics

---

## Conclusion

The application has a solid foundation with user onboarding and basic portfolio recommendation features. However, critical financial operations (wallets, escrow, trades) are missing and need immediate attention. The integration with external services (Zoya API, broker APIs) is also required for a production-ready system.

**Overall Completion: ~30%**

- ✅ User Onboarding: 70% (missing 2FA)
- ⚠️ Portfolio Engine: 40% (missing Zoya, risk scoring)
- ❌ Wallet & Escrow: 0%
- ❌ Kids' Wallets: 0%
- ❌ Market Insights: 0%
- ❌ Chatbot: 0%
