/**
 * Alpaca Integration Service
 *
 * Integrates with:
 * 1. Alpaca Broker API (broker-api.alpaca.markets) - manage subaccounts, execute trades, sync portfolios
 *    Sign up: https://broker-app.alpaca.markets/ (Broker Dashboard)
 * 2. Alpaca Market Data API (data.alpaca.markets) - US stocks quotes, bars, history
 *    Sign up: https://app.alpaca.markets/signup (Trading account - free tier includes market data)
 *
 * Broker API auth: HTTP Basic (API_KEY:API_SECRET base64)
 * Data API auth: APCA-API-KEY-ID and APCA-API-SECRET-KEY headers
 */

const axios = require('axios');

// Broker API: from Broker Dashboard (broker-app.alpaca.markets)
const BROKER_API_KEY = process.env.ALPACA_BROKER_API_KEY || process.env.ALPACA_API_KEY;
const BROKER_API_SECRET = process.env.ALPACA_BROKER_API_SECRET || process.env.ALPACA_API_SECRET;
const BROKER_SANDBOX = process.env.ALPACA_BROKER_SANDBOX !== 'false'; // default true for safety

// Market Data API: from app.alpaca.markets (same or separate keys)
const DATA_API_KEY = process.env.ALPACA_API_KEY || BROKER_API_KEY;
const DATA_API_SECRET = process.env.ALPACA_API_SECRET || BROKER_API_SECRET;
const DATA_SANDBOX = process.env.ALPACA_DATA_SANDBOX !== 'false';

const BROKER_BASE = BROKER_SANDBOX
  ? 'https://broker-api.sandbox.alpaca.markets'
  : 'https://broker-api.alpaca.markets';
const DATA_BASE = DATA_SANDBOX
  ? 'https://data.sandbox.alpaca.markets'
  : 'https://data.alpaca.markets';

function getBrokerAuthHeader() {
  if (!BROKER_API_KEY || !BROKER_API_SECRET) {
    throw new Error('Alpaca Broker API credentials not configured. Set ALPACA_BROKER_API_KEY and ALPACA_BROKER_API_SECRET (or ALPACA_API_KEY/SECRET).');
  }
  const encoded = Buffer.from(`${BROKER_API_KEY}:${BROKER_API_SECRET}`).toString('base64');
  return `Basic ${encoded}`;
}

function getDataAuthHeaders() {
  if (!DATA_API_KEY || !DATA_API_SECRET) {
    throw new Error('Alpaca Data API credentials not configured. Set ALPACA_API_KEY and ALPACA_API_SECRET.');
  }
  return {
    'APCA-API-KEY-ID': DATA_API_KEY,
    'APCA-API-SECRET-KEY': DATA_API_SECRET
  };
}

// ---------- Broker API (subaccounts, orders, positions, portfolio) ----------

/**
 * List all accounts (subaccounts) under the correspondent
 */
async function listAccounts(params = {}) {
  const auth = getBrokerAuthHeader();
  const { data } = await axios.get(`${BROKER_BASE}/v1/accounts`, {
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    params: { ...params },
    timeout: 10000
  });
  return data;
}

/**
 * Create a new subaccount (Fully-Disclosed setup - minimal required fields for sandbox)
 */
async function createAccount(accountPayload) {
  const auth = getBrokerAuthHeader();
  const { data } = await axios.post(`${BROKER_BASE}/v1/accounts`, accountPayload, {
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    timeout: 15000
  });
  return data;
}

/**
 * Get a single account by ID
 */
async function getAccount(accountId) {
  const auth = getBrokerAuthHeader();
  const { data } = await axios.get(`${BROKER_BASE}/v1/accounts/${accountId}`, {
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    timeout: 10000
  });
  return data;
}

/**
 * Get positions for an account
 */
async function getPositions(accountId) {
  const auth = getBrokerAuthHeader();
  const { data } = await axios.get(`${BROKER_BASE}/v1/trading/accounts/${accountId}/positions`, {
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    timeout: 10000
  });
  return data;
}

/**
 * Get orders for an account
 */
async function getOrders(accountId, params = {}) {
  const auth = getBrokerAuthHeader();
  const { data } = await axios.get(`${BROKER_BASE}/v1/trading/accounts/${accountId}/orders`, {
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    params: { status: 'all', ...params },
    timeout: 10000
  });
  return data;
}

/**
 * Place an order for an account
 */
async function placeOrder(accountId, order) {
  const auth = getBrokerAuthHeader();
  const { data } = await axios.post(
    `${BROKER_BASE}/v1/trading/accounts/${accountId}/orders`,
    order,
    {
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      timeout: 10000
    }
  );
  return data;
}

/**
 * Get portfolio history for an account
 */
async function getPortfolioHistory(accountId, params = {}) {
  const auth = getBrokerAuthHeader();
  const { data } = await axios.get(
    `${BROKER_BASE}/v1/trading/accounts/${accountId}/portfolio/history`,
    {
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      params: { period: '1M', ...params },
      timeout: 10000
    }
  );
  return data;
}

/**
 * Get account activities (e.g. trades, dividends)
 */
async function getAccountActivities(accountId, params = {}) {
  const auth = getBrokerAuthHeader();
  const { data } = await axios.get(
    `${BROKER_BASE}/v1/accounts/activities`,
    {
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      params: { account_id: accountId, ...params },
      timeout: 10000
    }
  );
  return data;
}

/**
 * Get list of tradable assets (US equities)
 */
async function getAssets(params = {}) {
  const auth = getBrokerAuthHeader();
  const { data } = await axios.get(`${BROKER_BASE}/v1/assets`, {
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    params: { status: 'active', ...params },
    timeout: 15000
  });
  return data;
}

// ---------- Market Data API (stocks quotes, bars) ----------

/**
 * Get latest quote for a US stock symbol
 */
async function getLatestQuote(symbol) {
  const headers = getDataAuthHeaders();
  const sym = (symbol || '').toUpperCase();
  const { data } = await axios.get(
    `${DATA_BASE}/v2/stocks/${sym}/quotes/latest`,
    { headers, timeout: 10000 }
  );
  return data?.quote || null;
}

/**
 * Get latest trade for a US stock symbol
 */
async function getLatestTrade(symbol) {
  const headers = getDataAuthHeaders();
  const sym = (symbol || '').toUpperCase();
  const { data } = await axios.get(
    `${DATA_BASE}/v2/stocks/${sym}/trades/latest`,
    { headers, timeout: 10000 }
  );
  return data?.trade || null;
}

/**
 * Get historical bars (OHLCV) for a symbol
 */
async function getBars(symbol, options = {}) {
  const headers = getDataAuthHeaders();
  const {
    start,
    end,
    timeframe = '1Day',
    limit = 100
  } = options;
  const params = {
    start: start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: end || new Date().toISOString().split('T')[0],
    timeframe,
    limit
  };
  const { data } = await axios.get(
    `${DATA_BASE}/v2/stocks/${(symbol || '').toUpperCase()}/bars`,
    { headers, params, timeout: 10000 }
  );
  return data?.bars || [];
}

/** Max symbols per Alpaca snapshots request (avoids 400 when too many) */
const SNAPSHOTS_CHUNK_SIZE = 100;

/**
 * Get snapshot (quote + trade) for one or more symbols.
 * Chunks requests to avoid 400 from Alpaca when symbol list is large.
 */
async function getSnapshots(symbols) {
  const headers = getDataAuthHeaders();
  let syms = Array.isArray(symbols) ? symbols : [symbols];
  syms = syms
    .map(s => String(s).trim().toUpperCase())
    .filter(Boolean);
  if (syms.length === 0) return {};

  // Optional feed: set ALPACA_DATA_FEED=iex for free tier; omit if it causes 400
  const feed = process.env.ALPACA_DATA_FEED; // 'iex' or 'sip' or leave unset
  const params = {};
  if (feed) params.feed = feed;
  params.symbols = syms.join(',');

  if (syms.length <= SNAPSHOTS_CHUNK_SIZE) {
    try {
      const { data } = await axios.get(
        `${DATA_BASE}/v2/stocks/snapshots`,
        { headers, params, timeout: 15000 }
      );
      return data || {};
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      console.error('Alpaca snapshots error (single):', err.response?.status, err.response?.data, msg);
      throw err;
    }
  }

  const merged = {};
  for (let i = 0; i < syms.length; i += SNAPSHOTS_CHUNK_SIZE) {
    const chunk = syms.slice(i, i + SNAPSHOTS_CHUNK_SIZE);
    const chunkParams = { symbols: chunk.join(',') };
    if (feed) chunkParams.feed = feed;
    try {
      const { data } = await axios.get(
        `${DATA_BASE}/v2/stocks/snapshots`,
        { headers, params: chunkParams, timeout: 15000 }
      );
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        Object.assign(merged, data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      console.error('Alpaca snapshots error (chunk):', err.response?.status, msg);
      throw err;
    }
  }
  return merged;
}

/**
 * Get current price and change for a US stock (for marketDataService compatibility)
 */
async function getStockQuoteForPrice(symbol) {
  const quote = await getLatestQuote(symbol);
  if (!quote) {
    const trade = await getLatestTrade(symbol);
    if (!trade) return null;
    return {
      symbol: (symbol || '').toUpperCase(),
      price: parseFloat(trade.p),
      change: 0,
      changePercent: 0,
      volume: 0,
      high: parseFloat(trade.p),
      low: parseFloat(trade.p),
      open: parseFloat(trade.p),
      timestamp: new Date(trade.t)
    };
  }
  const ap = parseFloat(quote.ap);
  const bp = parseFloat(quote.bp);
  const mid = ap && bp ? (ap + bp) / 2 : ap || bp || parseFloat(quote.p);
  return {
    symbol: (quote.S || symbol || '').toUpperCase(),
    price: mid,
    change: 0,
    changePercent: 0,
    volume: 0,
    high: mid,
    low: mid,
    open: mid,
    timestamp: new Date(quote.t)
  };
}

/**
 * Build minimal Broker API account payload from a user document (for signup integration).
 * @param {object} user - User doc with email, phoneNumber, fullName, etc.
 * @param {object} options - { ip } for agreement ip_address
 * @returns {object} Payload for POST /v1/accounts
 */
function buildMinimalAccountPayloadFromUser(user, options = {}) {
  const ip = options.ip || '127.0.0.1';
  const email = user?.email || `user-${user?._id}@example.com`;
  const phone = (user?.phoneNumber || '').replace(/\D/g, '').slice(0, 10) || '5555551234';
  const nameParts = (user?.fullName || 'User').trim().split(/\s+/);
  const givenName = nameParts[0] || 'User';
  const familyName = nameParts.slice(1).join(' ') || 'Test';
  return {
    contact: {
      email_address: email,
      phone_number: phone,
      street_address: ['1 Market St'],
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94105'
    },
    identity: {
      given_name: givenName,
      family_name: familyName,
      date_of_birth: '1990-01-01',
      tax_id_type: 'USA_SSN',
      tax_id: '529-38-1047',
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
      { agreement: 'customer_agreement', signed_at: new Date().toISOString(), ip_address: ip }
    ]
  };
}

/**
 * Check if Broker API is configured
 */
function isBrokerConfigured() {
  return !!(BROKER_API_KEY && BROKER_API_SECRET);
}

/**
 * Check if Data API is configured
 */
function isDataConfigured() {
  return !!(DATA_API_KEY && DATA_API_SECRET);
}

module.exports = {
  listAccounts,
  createAccount,
  getAccount,
  getPositions,
  getOrders,
  placeOrder,
  getPortfolioHistory,
  getAccountActivities,
  getAssets,
  buildMinimalAccountPayloadFromUser,
  getLatestQuote,
  getLatestTrade,
  getBars,
  getSnapshots,
  getStockQuoteForPrice,
  isBrokerConfigured,
  isDataConfigured,
  BROKER_BASE,
  DATA_BASE
};
