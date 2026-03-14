const axios = require('axios');

/**
 * Zoya API Service for Halal Asset Filtering
 * Uses Zoya GraphQL API: https://developer.zoya.finance/docs | Dashboard: https://developer.zoya.finance/dashboard
 * API key from dashboard; sandbox is free, live requires subscription.
 */

// GraphQL endpoint – get API key from https://developer.zoya.finance/dashboard
// Do not use api.zoya.com (does not resolve). Use developer.zoya.finance/graphql.
const _base = process.env.ZOYA_GRAPHQL_URL || process.env.ZOYA_API_BASE_URL || '';
const ZOYA_GRAPHQL_URL = (_base && !_base.includes('api.zoya.com')) ? _base : 'https://developer.zoya.finance/graphql';
const ZOYA_API_KEY = process.env.ZOYA_API_KEY;
const ZOYA_SANDBOX = process.env.ZOYA_SANDBOX !== 'false';

// Cache for halal status and compliant symbols (rate limit: 10 req/s)
const halalCache = new Map();
const compliantSymbolsCache = { set: null, ts: 0 };
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const COMPLIANT_CACHE_TTL = 60 * 60 * 1000; // 1 hour for full compliant list

function getGraphQLUrl() {
  const base = ZOYA_GRAPHQL_URL.trim();
  return base.endsWith('/graphql') ? base : `${base.replace(/\/$/, '')}/graphql`;
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (ZOYA_API_KEY) {
    headers['Authorization'] = `Bearer ${ZOYA_API_KEY}`;
  }
  return headers;
}

/**
 * Run a GraphQL query against Zoya API
 */
async function graphql(query, variables = {}) {
  const url = getGraphQLUrl();
  const { data } = await axios.post(
    url,
    { query, variables },
    { headers: getHeaders(), timeout: 15000 }
  );
  if (data.errors && data.errors.length) {
    throw new Error(data.errors.map((e) => e.message).join('; '));
  }
  return data.data;
}

/**
 * Get Shariah compliance report for a single US stock (basicCompliance.report)
 * Status: COMPLIANT | NON_COMPLIANT | QUESTIONABLE | NO_RATING
 */
async function checkHalalStatus(symbol, assetType = 'stock') {
  try {
    const cacheKey = `${symbol}_${assetType}`;
    const cached = halalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    if (!ZOYA_API_KEY) {
      return {
        isHalal: true,
        confidence: 0.5,
        details: { message: 'Zoya API key not set. Get one at https://developer.zoya.finance/dashboard' },
        cached: false
      };
    }

    const query = `
      query GetReport($symbol: String!) {
        basicCompliance {
          report(symbol: $symbol) {
            symbol
            name
            exchange
            status
            reportDate
          }
        }
      }
    `;
    const data = await graphql(query, { symbol: symbol.toUpperCase() });
    const report = data?.basicCompliance?.report ?? null;
    const status = report?.status || 'NO_RATING';
    const isHalal = status === 'COMPLIANT';
    const result = {
      isHalal,
      confidence: isHalal ? 0.9 : 0.7,
      details: report ? { status, name: report.name, exchange: report.exchange, reportDate: report.reportDate } : {},
      cached: false
    };

    halalCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error(`❌ Zoya API error for ${symbol}:`, error.message);
    return {
      isHalal: true,
      confidence: 0.3,
      details: { error: error.message },
      cached: false
    };
  }
}

/**
 * Fetch all COMPLIANT US stock symbols from Zoya (paginated), cached
 */
async function getCompliantSymbols() {
  if (compliantSymbolsCache.set && Date.now() - compliantSymbolsCache.ts < COMPLIANT_CACHE_TTL) {
    return compliantSymbolsCache.set;
  }
  if (!ZOYA_API_KEY) {
    return new Set();
  }

  const query = `
    query ListCompliant($input: BasicReportsInput) {
      basicCompliance {
        reports(input: $input) {
          items { symbol }
          nextToken
        }
      }
    }
  `;
  const symbols = new Set();
  let nextToken = null;
  do {
    const data = await graphql(query, {
      input: {
        filters: { status: 'COMPLIANT' },
        limit: 500,
        ...(nextToken && { nextToken })
      }
    });
    const page = data?.basicCompliance?.reports;
    if (!page?.items?.length) break;
    page.items.forEach((item) => item.symbol && symbols.add(item.symbol));
    nextToken = page.nextToken || null;
  } while (nextToken);

  compliantSymbolsCache.set = symbols;
  compliantSymbolsCache.ts = Date.now();
  return symbols;
}

/**
 * Batch check: use Zoya list of compliant symbols, then map assets to isHalal.
 * If Zoya returns an empty compliant list, treat as "screening unavailable" and mark all as halal (low confidence)
 * so the app still shows stocks with a Halal label instead of "all not halal".
 */
async function checkMultipleHalalStatus(assets) {
  try {
    if (!ZOYA_API_KEY) {
      return assets.map((a) => ({
        symbol: a.symbol,
        assetType: a.assetType,
        isHalal: true,
        confidence: 0.5
      }));
    }

    const compliantSet = await getCompliantSymbols();
    const compliantListEmpty = !compliantSet || compliantSet.size === 0;
    if (compliantListEmpty) {
      console.warn('Zoya compliant symbols list is empty; treating all as halal (screening unavailable).');
      return assets.map((a) => ({
        symbol: a.symbol,
        assetType: a.assetType,
        isHalal: true,
        confidence: 0.4,
        details: {}
      }));
    }

    return assets.map((a) => {
      const sym = (a.symbol || '').toUpperCase();
      const isHalal = compliantSet.has(sym);
      return {
        symbol: a.symbol,
        assetType: a.assetType,
        isHalal,
        confidence: isHalal ? 0.9 : 0.7,
        details: {}
      };
    });
  } catch (error) {
    console.error('❌ Zoya batch check error:', error.message);
    throw error;
  }
}

/**
 * Filter assets to only halal (compliant) ones
 */
async function filterHalalAssets(assets) {
  const results = await checkMultipleHalalStatus(assets);
  return results.filter((r) => r.isHalal).map((r) => ({
    symbol: r.symbol,
    assetType: r.assetType,
    confidence: r.confidence
  }));
}

/**
 * Get compliance report for a symbol (basic report from Zoya)
 */
async function getHalalCertification(symbol) {
  try {
    if (!ZOYA_API_KEY) {
      return {
        symbol,
        isHalal: true,
        certified: false,
        message: 'Zoya API key not set. Get one at https://developer.zoya.finance/dashboard'
      };
    }

    const query = `
      query GetReport($symbol: String!) {
        basicCompliance {
          report(symbol: $symbol) {
            symbol
            name
            exchange
            status
            reportDate
          }
        }
      }
    `;
    const data = await graphql(query, { symbol: symbol.toUpperCase() });
    const report = data?.basicCompliance?.report;
    const status = report?.status || 'NO_RATING';
    const isHalal = status === 'COMPLIANT';

    return {
      symbol,
      isHalal,
      certified: isHalal,
      status,
      name: report?.name,
      exchange: report?.exchange,
      reportDate: report?.reportDate,
      details: report || {}
    };
  } catch (error) {
    console.error(`❌ Zoya certification error for ${symbol}:`, error.message);
    return {
      symbol,
      isHalal: true,
      certified: false,
      error: error.message
    };
  }
}

function clearCache() {
  halalCache.clear();
  compliantSymbolsCache.set = null;
  compliantSymbolsCache.ts = 0;
  console.log('🗑️ Zoya cache cleared');
}

module.exports = {
  checkHalalStatus,
  checkMultipleHalalStatus,
  filterHalalAssets,
  getHalalCertification,
  getCompliantSymbols,
  clearCache
};
