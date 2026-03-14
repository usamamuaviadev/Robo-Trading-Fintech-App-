/**
 * Alpaca Broker & Market Data API routes
 *
 * Broker Dashboard: https://broker-app.alpaca.markets/login
 * Sign up (master brokerage / data): https://app.alpaca.markets/signup
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  listAccounts,
  createAccount,
  getAccount,
  getPositions,
  getOrders,
  placeOrder,
  getPortfolioHistory,
  getAssets,
  getBars,
  getLatestQuote,
  getSnapshots,
  getStockQuoteForPrice,
  isBrokerConfigured,
  isDataConfigured
} = require('../services/alpacaService');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

const router = express.Router();

// ========== Minimal Alpaca APIs (Broker API Sandbox) ==========
// 1. Create user sub-account (Broker API, Basic Auth in backend)
// 2. Fetch US stock latest price (Data API; keys in .env)
// No trading, funding, or withdrawals.

/**
 * @route   POST /api/alpaca/accounts
 * @desc    Create a user sub-account via Alpaca Broker API (Sandbox). Uses Basic Auth (Client ID + Secret) in backend. No JWT.
 * @access  Public
 * @body    { contact, identity } or minimal fields – see buildMinimalAccountPayload (sandbox defaults if omitted)
 */
router.post('/accounts', async (req, res) => {
  try {
    if (!isBrokerConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Broker API not configured. Set ALPACA_BROKER_API_KEY and ALPACA_BROKER_API_SECRET in .env'
      });
    }
    const payload = buildMinimalAccountPayload(req, null);
    const account = await createAccount(payload);
    res.status(201).json({
      success: true,
      data: {
        accountId: account.id,
        account_number: account.account_number,
        status: account.status,
        currency: account.currency || 'USD'
      }
    });
  } catch (error) {
    console.error('Alpaca create account error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to create subaccount'
    });
  }
});

/**
 * @route   GET /api/alpaca/market/symbols
 * @desc    Get all US stock symbols (one call, not one-by-one). Uses Broker API assets (active us_equity).
 * @access  Public
 */
router.get('/market/symbols', async (req, res) => {
  try {
    if (!isBrokerConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Broker API not configured. Set ALPACA_BROKER_API_KEY and ALPACA_BROKER_API_SECRET in .env'
      });
    }
    const assets = await getAssets({ asset_class: 'us_equity' });
    const list = Array.isArray(assets) ? assets : (assets?.assets || assets || []);
    const symbols = list
      .filter((a) => (a.class || a.asset_class) === 'us_equity' && a.symbol)
      .map((a) => a.symbol);
    const full = req.query.full === '1' || req.query.full === 'true';
    res.json({
      success: true,
      data: full
        ? { symbols, assets: list, count: symbols.length }
        : { symbols, count: symbols.length }
    });
  } catch (error) {
    console.error('Alpaca market symbols error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to fetch symbols'
    });
  }
});

/**
 * @route   GET /api/alpaca/market/quote/:symbol
 * @desc    Fetch US stock market data – latest price. Keys in .env (ALPACA_API_KEY, ALPACA_API_SECRET).
 * @access  Public
 */
router.get('/market/quote/:symbol', async (req, res) => {
  try {
    if (!isDataConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Market data not configured. Set ALPACA_API_KEY and ALPACA_API_SECRET in .env'
      });
    }
    const symbol = req.params.symbol?.toUpperCase();
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Symbol is required' });
    }
    const quote = await getStockQuoteForPrice(symbol);
    if (!quote || quote.price == null) {
      return res.status(404).json({
        success: false,
        message: `No quote for ${symbol}`
      });
    }
    res.json({
      success: true,
      data: {
        symbol: quote.symbol || symbol,
        price: quote.price,
        timestamp: quote.timestamp || new Date()
      }
    });
  } catch (error) {
    console.error('Alpaca market quote error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to fetch quote'
    });
  }
});

/** Build minimal Broker API account payload for sandbox (Fully-Disclosed). No JWT – uses req.body only (or defaults). */
function buildMinimalAccountPayload(req, user) {
  const b = req.body || {};
  if (b.contact && b.identity) {
    return { ...b, disclosures: b.disclosures || defaultDisclosures(), agreements: b.agreements || defaultAgreements(req) };
  }
  return {
    contact: {
      email_address: b.email_address || b.email || user?.email || 'user@example.com',
      phone_number: (b.phone_number || b.phone || user?.phoneNumber || '').replace(/\D/g, '').slice(0, 10) || '5555551234',
      street_address: [b.street_address || '1 Market St'],
      city: b.city || 'San Francisco',
      state: b.state || 'CA',
      postal_code: b.postal_code || '94105'
    },
    identity: {
      given_name: b.given_name || (b.fullName || user?.fullName || 'User').split(' ')[0] || 'User',
      family_name: b.family_name || (b.fullName || user?.fullName || 'User').split(' ').slice(1).join(' ') || 'Test',
      date_of_birth: b.date_of_birth || '1990-01-01',
      tax_id_type: 'USA_SSN',
      tax_id: b.tax_id || '529-38-1047',
      country_of_citizenship: 'USA',
      country_of_birth: 'USA',
      country_of_tax_residence: 'USA',
      funding_source: ['employment_income'],
      annual_income_min: '50000',
      annual_income_max: '100000',
      total_net_worth_min: '50000',
      total_net_worth_max: '500000',
      liquid_net_worth_min: '10000',
      liquid_net_worth_max: '100000',
      liquidity_needs: 'does_not_matter',
      investment_experience_with_stocks: 'limited',
      investment_experience_with_options: 'none',
      risk_tolerance: 'conservative',
      investment_objective: 'growth',
      investment_time_horizon: 'more_than_10_years',
      marital_status: 'SINGLE',
      number_of_dependents: 0
    },
    disclosures: defaultDisclosures(),
    agreements: defaultAgreements(req)
  };
}

function defaultDisclosures() {
  return {
    is_control_person: false,
    is_affiliated_exchange_or_finra: false,
    is_affiliated_exchange_or_iiroc: false,
    is_politically_exposed: false,
    immediate_family_exposed: false
  };
}

function defaultAgreements(req) {
  return [
    { agreement: 'customer_agreement', signed_at: new Date().toISOString(), ip_address: req.ip || '127.0.0.1' }
  ];
}

// ---------- Status ----------

/**
 * @route   GET /api/alpaca/status
 * @desc    Check if Alpaca Broker (master account) and Data APIs are configured
 * @access  Public
 */
router.get('/status', (req, res) => {
  const broker = isBrokerConfigured();
  const data = isDataConfigured();
  const message = broker
    ? 'Master brokerage account is configured. You can manage subaccounts, execute trades, and sync portfolios.'
    : 'Set ALPACA_BROKER_API_KEY and ALPACA_BROKER_API_SECRET (from Broker Dashboard) to enable subaccounts and trades.';
  res.json({
    success: true,
    data: {
      broker,
      data,
      message,
      brokerDashboardUrl: 'https://broker-app.alpaca.markets/login',
      docs: 'See backend/docs/MASTER_BROKERAGE_ACCOUNT.md for setup.'
    }
  });
});

// ---------- Market Data (stocks) ----------

/**
 * @route   GET /api/alpaca/stocks/quote/:symbol
 * @desc    Get latest quote for a US stock
 * @access  Public (or Private if you prefer)
 */
router.get('/stocks/quote/:symbol', async (req, res) => {
  try {
    if (!isDataConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Alpaca Data API not configured. Set ALPACA_API_KEY and ALPACA_API_SECRET.'
      });
    }
    const quote = await getLatestQuote(req.params.symbol);
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: `No quote for ${req.params.symbol}`
      });
    }
    res.json({ success: true, data: quote });
  } catch (error) {
    console.error('Alpaca quote error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get quote'
    });
  }
});

/**
 * @route   GET /api/alpaca/stocks/bars/:symbol
 * @desc    Get historical bars (OHLCV) for a US stock
 * @access  Public
 */
router.get('/stocks/bars/:symbol', async (req, res) => {
  try {
    if (!isDataConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Alpaca Data API not configured.'
      });
    }
    const { start, end, timeframe, limit } = req.query;
    const bars = await getBars(req.params.symbol, {
      start,
      end,
      timeframe: timeframe || '1Day',
      limit: limit ? parseInt(limit, 10) : 100
    });
    res.json({ success: true, data: { bars } });
  } catch (error) {
    console.error('Alpaca bars error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get bars'
    });
  }
});

/**
 * @route   POST /api/alpaca/stocks/snapshots
 * @desc    Get snapshots (quote + trade) for multiple symbols
 * @access  Public
 */
router.post('/stocks/snapshots', async (req, res) => {
  try {
    if (!isDataConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Alpaca Data API not configured.'
      });
    }
    const { symbols } = req.body;
    const list = Array.isArray(symbols) ? symbols : (symbols ? [symbols] : []);
    if (list.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'symbols array is required'
      });
    }
    const data = await getSnapshots(list);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Alpaca snapshots error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get snapshots'
    });
  }
});

// ---------- Broker API (subaccounts, portfolio, orders) ----------

/**
 * @route   GET /api/alpaca/accounts
 * @desc    List all subaccounts (Broker API) - requires broker credentials
 * @access  Private
 */
router.get('/accounts', authenticate, async (req, res) => {
  try {
    if (!isBrokerConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Alpaca Broker API not configured. Set ALPACA_BROKER_API_KEY and ALPACA_BROKER_API_SECRET from Broker Dashboard.'
      });
    }
    const accounts = await listAccounts(req.query);
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Alpaca list accounts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to list accounts'
    });
  }
});

/**
 * @route   GET /api/alpaca/account/me
 * @desc    Get current user's linked Alpaca subaccount
 * @access  Private
 */
router.get('/account/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.alpacaAccountId) {
      return res.status(404).json({
        success: false,
        message: 'No Alpaca account linked. Create one via POST /api/alpaca/account/link'
      });
    }
    if (!isBrokerConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Alpaca Broker API not configured.'
      });
    }
    const account = await getAccount(user.alpacaAccountId);
    res.json({ success: true, data: account });
  } catch (error) {
    console.error('Alpaca get account error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get account'
    });
  }
});

/**
 * @route   POST /api/alpaca/account/link
 * @desc    Create a new Alpaca subaccount and link to current user (simplified payload for sandbox)
 * @access  Private
 */
router.post('/account/link', authenticate, async (req, res) => {
  try {
    if (!isBrokerConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Alpaca Broker API not configured.'
      });
    }
    const user = await User.findById(req.user._id);
    if (user?.alpacaAccountId) {
      return res.status(400).json({
        success: false,
        message: 'User already has an Alpaca account linked',
        alpacaAccountId: user.alpacaAccountId
      });
    }
    // Minimal payload for sandbox (Fully-Disclosed); production would require full KYC
    const payload = req.body.contact && req.body.identity
      ? req.body
      : {
          contact: {
            email_address: user.email || `user-${user._id}@example.com`,
            phone_number: (user.phoneNumber || '').replace(/\D/g, '').slice(0, 10) || '5555551234',
            street_address: [req.body.street_address || '1 Market St'],
            city: req.body.city || 'San Francisco',
            state: req.body.state || 'CA',
            postal_code: req.body.postal_code || '94105'
          },
          identity: {
            given_name: (user.fullName || 'User').split(' ')[0] || 'User',
            family_name: (user.fullName || 'User').split(' ').slice(1).join(' ') || 'Test',
            date_of_birth: req.body.date_of_birth || '1990-01-01',
            tax_id_type: 'USA_SSN',
            tax_id: req.body.tax_id || '529-38-1047',
            country_of_citizenship: 'USA',
            country_of_birth: 'USA',
            country_of_tax_residence: 'USA',
            funding_source: ['employment_income'],
            annual_income_min: '50000',
            annual_income_max: '100000',
            total_net_worth_min: '50000',
            total_net_worth_max: '500000',
            liquid_net_worth_min: '10000',
            liquid_net_worth_max: '100000',
            liquidity_needs: 'does_not_matter',
            investment_experience_with_stocks: 'limited',
            investment_experience_with_options: 'none',
            risk_tolerance: 'conservative',
            investment_objective: 'growth',
            investment_time_horizon: 'more_than_10_years',
            marital_status: 'SINGLE',
            number_of_dependents: 0
          },
          disclosures: {
            is_control_person: false,
            is_affiliated_exchange_or_finra: false,
            is_affiliated_exchange_or_iiroc: false,
            is_politically_exposed: false,
            immediate_family_exposed: false
          },
          agreements: [
            { agreement: 'customer_agreement', signed_at: new Date().toISOString(), ip_address: req.ip || '127.0.0.1' }
          ]
        };
    const account = await createAccount(payload);
    user.alpacaAccountId = account.id;
    await user.save();
    res.status(201).json({
      success: true,
      message: 'Alpaca subaccount created and linked',
      data: account
    });
  } catch (error) {
    console.error('Alpaca create account error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create/link account'
    });
  }
});

// ---------- Subaccount (create / status) ----------

/**
 * @route   GET /api/alpaca/subaccount
 * @desc    Check if current user has an Alpaca subaccount; return status and account summary
 * @access  Private
 */
router.get('/subaccount', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const hasSubaccount = !!(user && user.alpacaAccountId);
    if (!hasSubaccount) {
      return res.json({
        success: true,
        data: {
          hasSubaccount: false,
          message: 'No Alpaca trading account yet. Call POST /api/alpaca/subaccount to create one.'
        }
      });
    }
    if (!isBrokerConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Alpaca Broker API not configured.'
      });
    }
    const account = await getAccount(user.alpacaAccountId);
    res.json({
      success: true,
      data: {
        hasSubaccount: true,
        accountId: user.alpacaAccountId,
        account
      }
    });
  } catch (error) {
    console.error('Alpaca subaccount status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get subaccount status'
    });
  }
});

/**
 * @route   POST /api/alpaca/subaccount
 * @desc    Create an Alpaca subaccount for the current user and link it (US market trading)
 * @access  Private
 */
router.post('/subaccount', authenticate, async (req, res) => {
  try {
    if (!isBrokerConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Alpaca Broker API not configured. Set ALPACA_BROKER_API_KEY and ALPACA_BROKER_API_SECRET.'
      });
    }
    const user = await User.findById(req.user._id);
    if (user?.alpacaAccountId) {
      return res.status(400).json({
        success: false,
        message: 'You already have an Alpaca trading account.',
        data: { accountId: user.alpacaAccountId }
      });
    }
    // Build Alpaca account payload: use body if full KYC provided, else build from user profile (sandbox-friendly)
    const payload = req.body.contact && req.body.identity
      ? req.body
      : {
          contact: {
            email_address: user.email || `user-${user._id}@example.com`,
            phone_number: (user.phoneNumber || '').replace(/\D/g, '').slice(0, 10) || '5555551234',
            street_address: [req.body.street_address || '1 Market St'],
            city: req.body.city || 'San Francisco',
            state: req.body.state || 'CA',
            postal_code: req.body.postal_code || '94105'
          },
          identity: {
            given_name: (user.fullName || 'User').split(' ')[0] || 'User',
            family_name: (user.fullName || 'User').split(' ').slice(1).join(' ') || 'Test',
            date_of_birth: req.body.date_of_birth || '1990-01-01',
            tax_id_type: 'USA_SSN',
            tax_id: req.body.tax_id || '529-38-1047',
            country_of_citizenship: 'USA',
            country_of_birth: 'USA',
            country_of_tax_residence: 'USA',
            funding_source: ['employment_income'],
            annual_income_min: '50000',
            annual_income_max: '100000',
            total_net_worth_min: '50000',
            total_net_worth_max: '500000',
            liquid_net_worth_min: '10000',
            liquid_net_worth_max: '100000',
            liquidity_needs: 'does_not_matter',
            investment_experience_with_stocks: 'limited',
            investment_experience_with_options: 'none',
            risk_tolerance: 'conservative',
            investment_objective: 'growth',
            investment_time_horizon: 'more_than_10_years',
            marital_status: 'SINGLE',
            number_of_dependents: 0
          },
          disclosures: {
            is_control_person: false,
            is_affiliated_exchange_or_finra: false,
            is_affiliated_exchange_or_iiroc: false,
            is_politically_exposed: false,
            immediate_family_exposed: false
          },
          agreements: [
            { agreement: 'customer_agreement', signed_at: new Date().toISOString(), ip_address: req.ip || '127.0.0.1' }
          ]
        };
    const account = await createAccount(payload);
    user.alpacaAccountId = account.id;
    await user.save();
    res.status(201).json({
      success: true,
      message: 'Alpaca trading account created. You can now trade US stocks.',
      data: {
        accountId: account.id,
        account_number: account.account_number,
        status: account.status,
        currency: account.currency || 'USD',
        account
      }
    });
  } catch (error) {
    console.error('Alpaca create subaccount error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Alpaca subaccount'
    });
  }
});

/**
 * @route   GET /api/alpaca/portfolio
 * @desc    Get positions from Alpaca for current user's linked account
 * @access  Private
 */
router.get('/portfolio', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.alpacaAccountId) {
      return res.status(404).json({
        success: false,
        message: 'No Alpaca account linked'
      });
    }
    if (!isBrokerConfigured()) {
      return res.status(503).json({ success: false, message: 'Alpaca Broker API not configured.' });
    }
    const positions = await getPositions(user.alpacaAccountId);
    res.json({ success: true, data: positions });
  } catch (error) {
    console.error('Alpaca portfolio error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get portfolio'
    });
  }
});

/**
 * @route   GET /api/alpaca/portfolio/history
 * @desc    Get portfolio history (equity over time) for linked account
 * @access  Private
 */
router.get('/portfolio/history', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.alpacaAccountId) {
      return res.status(404).json({ success: false, message: 'No Alpaca account linked' });
    }
    if (!isBrokerConfigured()) {
      return res.status(503).json({ success: false, message: 'Alpaca Broker API not configured.' });
    }
    const { period } = req.query;
    const history = await getPortfolioHistory(user.alpacaAccountId, { period: period || '1M' });
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Alpaca portfolio history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get portfolio history'
    });
  }
});

/**
 * @route   POST /api/alpaca/portfolio/sync
 * @desc    Sync Alpaca positions into local Trade/holdings (creates/updates local state)
 * @access  Private
 */
router.post('/portfolio/sync', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.alpacaAccountId) {
      return res.status(404).json({ success: false, message: 'No Alpaca account linked' });
    }
    if (!isBrokerConfigured()) {
      return res.status(503).json({ success: false, message: 'Alpaca Broker API not configured.' });
    }
    const positions = await getPositions(user.alpacaAccountId);
    const wallet = await Wallet.findOne({ userId: req.user._id });
    const synced = [];
    for (const pos of positions || []) {
      const symbol = pos.symbol || pos.asset_symbol;
      const qty = parseFloat(pos.qty || pos.quantity || 0);
      if (!symbol || qty <= 0) continue;
      // Optionally create/update local Trade records for display; here we just return Alpaca positions
      synced.push({
        symbol,
        quantity: qty,
        side: pos.side,
        market_value: pos.market_value,
        cost_basis: pos.cost_basis,
        unrealized_pl: pos.unrealized_pl
      });
    }
    res.json({
      success: true,
      message: 'Portfolio synced from Alpaca',
      data: { positions: synced, walletId: wallet?._id }
    });
  } catch (error) {
    console.error('Alpaca sync portfolio error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync portfolio'
    });
  }
});

/**
 * @route   GET /api/alpaca/orders
 * @desc    Get orders for current user's linked Alpaca account
 * @access  Private
 */
router.get('/orders', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.alpacaAccountId) {
      return res.status(404).json({ success: false, message: 'No Alpaca account linked' });
    }
    if (!isBrokerConfigured()) {
      return res.status(503).json({ success: false, message: 'Alpaca Broker API not configured.' });
    }
    const orders = await getOrders(user.alpacaAccountId, req.query);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Alpaca orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get orders'
    });
  }
});

/**
 * @route   POST /api/alpaca/orders
 * @desc    Place an order on Alpaca for current user's linked account
 * @access  Private
 */
router.post('/orders', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.alpacaAccountId) {
      return res.status(404).json({ success: false, message: 'No Alpaca account linked' });
    }
    if (!isBrokerConfigured()) {
      return res.status(503).json({ success: false, message: 'Alpaca Broker API not configured.' });
    }
    const { symbol, qty, side, type, time_in_force, limit_price, stop_price } = req.body;
    if (!symbol || !side || !['buy', 'sell'].includes(side)) {
      return res.status(400).json({
        success: false,
        message: 'symbol and side (buy/sell) are required'
      });
    }
    const orderPayload = {
      symbol: String(symbol).toUpperCase(),
      qty: parseFloat(qty) || 0,
      side: side.toLowerCase(),
      type: type || 'market',
      time_in_force: time_in_force || 'day'
    };
    if (orderPayload.type === 'limit' && limit_price != null) {
      orderPayload.limit_price = parseFloat(limit_price);
    }
    if (orderPayload.type === 'stop' && stop_price != null) {
      orderPayload.stop_price = parseFloat(stop_price);
    }
    const order = await placeOrder(user.alpacaAccountId, orderPayload);
    res.status(201).json({
      success: true,
      message: 'Order submitted',
      data: order
    });
  } catch (error) {
    console.error('Alpaca place order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to place order'
    });
  }
});

/**
 * @route   GET /api/alpaca/assets
 * @desc    List tradable US equity assets (Broker API)
 * @access  Private
 */
router.get('/assets', authenticate, async (req, res) => {
  try {
    if (!isBrokerConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Alpaca Broker API not configured.'
      });
    }
    const assets = await getAssets(req.query);
    res.json({ success: true, data: assets });
  } catch (error) {
    console.error('Alpaca assets error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get assets'
    });
  }
});

module.exports = router;
