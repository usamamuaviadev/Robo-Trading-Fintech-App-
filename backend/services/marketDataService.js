const axios = require('axios');
const { getStockQuoteForPrice, getSnapshots, isDataConfigured } = require('./alpacaService');

/**
 * Market Data Service
 * Supports multiple data providers: ICE, Twelve Data, Custom Broker APIs, Alpaca (US stocks)
 */

const BROKER_API_TYPE = process.env.BROKER_API_TYPE || 'demo'; // 'ice', 'twelvedata', 'custom', 'alpaca', 'demo'
const BROKER_API_BASE_URL = process.env.BROKER_API_BASE_URL;
const BROKER_API_KEY = process.env.BROKER_API_KEY;
const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY || BROKER_API_KEY;

// Price cache to reduce API calls
const priceCache = new Map();
const PRICE_CACHE_TTL = 60 * 1000; // 1 minute for prices
const ALPACA_REALTIME_CACHE_TTL = 10 * 1000; // 10 seconds for Alpaca (real-time feel)

// Saudi stock symbol mapping (Tadawul symbols for Twelve Data)
// Twelve Data requires Saudi symbols in format: 2222:Tadawul (not 2222.SR)
const SAUDI_SYMBOL_MAP = {
  'ARAMCO': '2222',
  'SABIC': '2010',
  'STC': '7010',
  'ALRAJHI': '1120',
  'RIYAD': '1010'
};

/**
 * Convert symbol to Twelve Data format
 * Maps common Saudi stock names to Tadawul format (e.g., ARAMCO -> 2222:Tadawul)
 * Twelve Data uses format: symbol:exchange (e.g., 2222:Tadawul)
 */
function normalizeSymbolForTwelveData(symbol) {
  const upperSymbol = symbol.toUpperCase();
  
  // Check if it's in the Saudi symbol mapping
  if (SAUDI_SYMBOL_MAP[upperSymbol]) {
    return `${SAUDI_SYMBOL_MAP[upperSymbol]}:Tadawul`;
  }
  
  // If it already has :Tadawul suffix, use as-is
  if (upperSymbol.includes(':Tadawul')) {
    return upperSymbol;
  }
  
  // If it has .SR suffix, convert to :Tadawul format
  if (upperSymbol.endsWith('.SR')) {
    const numericPart = upperSymbol.replace('.SR', '');
    return `${numericPart}:Tadawul`;
  }
  
  // If it's a 4-digit number (likely Saudi stock code), add :Tadawul
  if (/^\d{4}$/.test(upperSymbol)) {
    return `${upperSymbol}:Tadawul`;
  }
  
  // Otherwise, use symbol as-is (for US stocks, etc.)
  return upperSymbol;
}

/**
 * Get current price for an asset
 * @param {string} symbol - Asset symbol
 * @returns {Promise<{symbol: string, price: number, change: number, changePercent: number, timestamp: Date}>}
 */
function getPriceCacheTtl() {
  return BROKER_API_TYPE === 'alpaca' ? ALPACA_REALTIME_CACHE_TTL : PRICE_CACHE_TTL;
}

async function getAssetPrice(symbol, options = {}) {
  const skipCache = options.realtime === true;
  try {
    // Check cache first (skip for realtime)
    if (!skipCache) {
      const cached = priceCache.get(symbol);
      const ttl = getPriceCacheTtl();
      if (cached && (Date.now() - cached.timestamp) < ttl) {
        return cached.data;
      }
    }

    let data;

    // Route to appropriate provider
    switch (BROKER_API_TYPE) {
      case 'alpaca':
        data = await getPriceFromAlpaca(symbol);
        break;
      case 'twelvedata':
        data = await getPriceFromTwelveData(symbol);
        break;
      case 'ice':
        data = await getPriceFromICE(symbol);
        break;
      case 'custom':
        data = await getPriceFromCustom(symbol);
        break;
      default:
        // Demo mode - return mock data
        data = getMockPrice(symbol);
    }

    // Cache the result
    priceCache.set(symbol, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    console.error(`❌ Market data error for ${symbol}:`, error.message);
    // Fallback to mock data on error
    return getMockPrice(symbol);
  }
}

/**
 * Helper function to parse quote data from Twelve Data
 */
function parseQuoteData(quote) {
  if (!quote || quote.status === 'error' || !quote.close) {
    return null;
  }
  
  const price = parseFloat(quote.close);
  const previousClose = parseFloat(quote.previous_close || quote.close);
  const change = price - previousClose;
  const changePercent = quote.percent_change ? parseFloat(quote.percent_change) : (change / previousClose) * 100;
  
  return {
    symbol: quote.symbol || quote.name || '',
    price,
    change,
    changePercent,
    volume: parseInt(quote.volume) || 0,
    high: parseFloat(quote.high) || price,
    low: parseFloat(quote.low) || price,
    open: parseFloat(quote.open) || price,
    timestamp: new Date(quote.datetime || Date.now())
  };
}

/**
 * Get price from Twelve Data (Supports Saudi symbols directly)
 */
async function getPriceFromTwelveData(symbol) {
  if (!TWELVEDATA_API_KEY) {
    throw new Error('Twelve Data API key not configured. Get free key at https://twelvedata.com/');
  }

  // Normalize symbol for Twelve Data (maps ARAMCO -> 2222.SR, etc.)
  const normalizedSymbol = normalizeSymbolForTwelveData(symbol);
  
  const apiUrl = 'https://api.twelvedata.com/quote';
  const params = {
    symbol: normalizedSymbol,
    apikey: TWELVEDATA_API_KEY
  };
  
  // Log the API URL being called
  const urlWithParams = `${apiUrl}?symbol=${params.symbol}&apikey=${params.apikey.substring(0, 8)}...`;
  console.log(`📡 Twelve Data API Call: ${urlWithParams}`);

  const response = await axios.get(apiUrl, {
    params: params,
    timeout: 10000
  });

  if (response.data.status === 'error') {
    throw new Error(response.data.message || 'Twelve Data API error');
  }

  const quoteData = parseQuoteData(response.data);
  if (!quoteData) {
    throw new Error('No price data available');
  }

  // Preserve the original symbol name (e.g., "ARAMCO") instead of normalized one (e.g., "2222.SR")
  quoteData.symbol = symbol.toUpperCase();
  return quoteData;
}

/**
 * Get price from Alpaca Market Data API (US stocks)
 */
async function getPriceFromAlpaca(symbol) {
  if (!isDataConfigured()) {
    throw new Error('Alpaca API credentials not configured. Set ALPACA_API_KEY and ALPACA_API_SECRET (from https://app.alpaca.markets/signup)');
  }
  const quoteData = await getStockQuoteForPrice(symbol);
  if (!quoteData) {
    throw new Error(`No price data for ${symbol} (Alpaca supports US equities)`);
  }
  return quoteData;
}

/**
 * Get price from ICE Data Services
 */
async function getPriceFromICE(symbol) {
  if (!BROKER_API_KEY || !BROKER_API_BASE_URL) {
    throw new Error('ICE API credentials not configured');
  }

  const response = await axios.get(`${BROKER_API_BASE_URL}/market/${symbol.toUpperCase()}`, {
    headers: {
      'Authorization': `Bearer ${BROKER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-ICE-API-Version': '1.0'
    },
    timeout: 5000
  });

  return {
    symbol: response.data.symbol,
    price: response.data.price,
    change: response.data.change || 0,
    changePercent: response.data.changePercent || 0,
    volume: response.data.volume || 0,
    high: response.data.high,
    low: response.data.low,
    open: response.data.open,
    timestamp: new Date(response.data.timestamp || Date.now())
  };
}

/**
 * Get price from custom broker API
 */
async function getPriceFromCustom(symbol) {
  if (!BROKER_API_KEY || !BROKER_API_BASE_URL) {
    throw new Error('Custom broker API credentials not configured');
  }

  const response = await axios.get(`${BROKER_API_BASE_URL}/market/${symbol.toUpperCase()}`, {
    headers: {
      'Authorization': `Bearer ${BROKER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 5000
  });

  return {
    symbol: response.data.symbol,
    price: response.data.price,
    change: response.data.change || 0,
    changePercent: response.data.changePercent || 0,
    volume: response.data.volume || 0,
    high: response.data.high,
    low: response.data.low,
    open: response.data.open,
    timestamp: new Date(response.data.timestamp || Date.now())
  };
}

/**
 * Get mock price (for demo/development)
 */
function getMockPrice(symbol) {
  console.log(`📊 Demo mode: Mock price for ${symbol}`);
  return {
    symbol: symbol.toUpperCase(),
    price: Math.random() * 100 + 50,
    change: (Math.random() - 0.5) * 5,
    changePercent: (Math.random() - 0.5) * 5,
    volume: Math.floor(Math.random() * 1000000),
    timestamp: new Date()
  };
}

/**
 * Get prices for multiple assets
 * @param {Array<string>} symbols
 * @returns {Promise<Array>}
 */
async function getMultiplePrices(symbols) {
  try {
    // Check API type first
    if (BROKER_API_TYPE === 'demo' || (!BROKER_API_KEY && BROKER_API_TYPE !== 'alpaca')) {
      // Demo mode (alpaca uses ALPACA_API_KEY, not BROKER_API_KEY)
      if (BROKER_API_TYPE !== 'alpaca') {
        return symbols.map(symbol => ({
          symbol: symbol.toUpperCase(),
          price: Math.random() * 100 + 50,
          change: (Math.random() - 0.5) * 5,
          changePercent: (Math.random() - 0.5) * 5,
          timestamp: new Date()
        }));
      }
    }

    // Handle Alpaca (US stocks)
    if (BROKER_API_TYPE === 'alpaca' && isDataConfigured()) {
      try {
        const snapshots = await getSnapshots(symbols);
        const prices = [];
        const symbolSet = new Set(symbols.map(s => s.toUpperCase()));
        // Response is object keyed by symbol: { "AAPL": { quote, trade, minuteBar, dailyBar }, ... }
        const snapObj = snapshots && typeof snapshots === 'object' && !Array.isArray(snapshots) ? snapshots : {};
        for (const sym of symbolSet) {
          const snap = snapObj[sym] || snapObj[sym.toLowerCase()];
          if (!snap) continue;
          const q = snap.latestQuote || snap.quote || snap.Quote;
          const minuteBar = snap.minuteBar || snap.minute_bar;
          const dailyBar = snap.dailyBar || snap.daily_bar;
          if (q) {
            const ap = parseFloat(q.ap);
            const bp = parseFloat(q.bp);
            const mid = (ap && bp) ? (ap + bp) / 2 : (ap || bp || 0);
            if (mid) {
              prices.push({
                symbol: sym,
                price: mid,
                change: 0,
                changePercent: 0,
                volume: parseInt(q.s, 10) || 0,
                timestamp: new Date(q.t || Date.now())
              });
            }
          }
          if (prices.some(p => p.symbol === sym)) continue;
          const bar = minuteBar || dailyBar || snap.prevDailyBar;
          if (bar) {
            const c = parseFloat(bar.c);
            if (c) {
              prices.push({
                symbol: sym,
                price: c,
                change: 0,
                changePercent: 0,
                volume: parseInt(bar.v, 10) || 0,
                timestamp: new Date(bar.t || Date.now())
              });
            }
          }
        }
        if (prices.length > 0) return prices;
        // Fallback: individual quote calls
        const results = [];
        for (const symbol of symbols.slice(0, 50)) {
          try {
            const q = await getStockQuoteForPrice(symbol);
            if (q && q.price) results.push(q);
          } catch (e) {
            // skip
          }
        }
        return results.length ? results : symbols.map(symbol => getMockPrice(symbol));
      } catch (error) {
        const status = error.response?.status;
        const body = error.response?.data;
        console.error('❌ Alpaca batch error:', error.message, status ? `(${status})` : '', body ? JSON.stringify(body).slice(0, 200) : '');
        return symbols.map(symbol => getMockPrice(symbol));
      }
    }

    // Handle Twelve Data
    if (BROKER_API_TYPE === 'twelvedata') {
      if (!TWELVEDATA_API_KEY) {
        console.log('⚠️ Twelve Data API key not set, using demo mode for batch');
        return symbols.map(symbol => ({
          symbol: symbol.toUpperCase(),
          price: Math.random() * 100 + 50,
          change: (Math.random() - 0.5) * 5,
          changePercent: (Math.random() - 0.5) * 5,
          timestamp: new Date()
        }));
      }

      try {
        // Check if symbols are cached first to avoid unnecessary API calls
        const uncachedSymbols = [];
        const cachedPrices = [];
        
        for (const symbol of symbols) {
          const cached = priceCache.get(symbol);
          if (cached && (Date.now() - cached.timestamp) < PRICE_CACHE_TTL) {
            cachedPrices.push(cached.data);
          } else {
            uncachedSymbols.push(symbol);
          }
        }

        // If all symbols are cached, return immediately
        if (uncachedSymbols.length === 0) {
          return cachedPrices;
        }

        // Twelve Data supports batch requests via comma-separated symbols
        // Limit to reasonable batch size (Twelve Data typically handles 100+ symbols)
        // Normalize all symbols for Twelve Data format and create mapping
        const symbolMapping = new Map(); // Maps normalized -> original
        const normalizedSymbols = uncachedSymbols.slice(0, 100).map(s => {
          const normalized = normalizeSymbolForTwelveData(s);
          symbolMapping.set(normalized, s.toUpperCase());
          return normalized;
        });
        const symbolsToFetch = normalizedSymbols.join(',');
        
        try {
          const bulkApiUrl = 'https://api.twelvedata.com/quote';
          const bulkParams = {
            symbol: symbolsToFetch,
            apikey: TWELVEDATA_API_KEY
          };
          
          // Log the bulk API URL being called
          const bulkUrlWithParams = `${bulkApiUrl}?symbol=${bulkParams.symbol}&apikey=${bulkParams.apikey.substring(0, 8)}...`;
          console.log(`📡 Twelve Data Bulk API Call: ${bulkUrlWithParams}`);
          
          const bulkResponse = await axios.get(bulkApiUrl, {
            params: bulkParams,
            timeout: 15000
          });

          // Twelve Data batch response handling
          // Could be array, object with symbol keys, or single quote object
          let bulkPrices = [];
          
          if (Array.isArray(bulkResponse.data)) {
            // Array format - map back to original symbols
            bulkPrices = bulkResponse.data.map(quote => {
              if (quote.status === 'error') {
                return null;
              }
              const parsed = parseQuoteData(quote);
              // Map normalized symbol back to original
              if (parsed && parsed.symbol && symbolMapping.has(parsed.symbol)) {
                parsed.symbol = symbolMapping.get(parsed.symbol);
              }
              return parsed;
            }).filter(price => price !== null);
          } else if (bulkResponse.data && typeof bulkResponse.data === 'object') {
            if (bulkResponse.data.status === 'error') {
              // Single error response
              throw new Error(bulkResponse.data.message || 'Batch request failed');
            }
            
            // Check if it's an object with symbol keys or single quote
            const dataKeys = Object.keys(bulkResponse.data);
            if (dataKeys.length > 0 && dataKeys[0].match(/^[A-Z0-9.:]+$/)) {
              // Object with symbol keys (e.g., { "2222:Tadawul": {...}, "2010:Tadawul": {...} })
              bulkPrices = Object.entries(bulkResponse.data).map(([normalizedSymbol, quote]) => {
                if (quote.status === 'error') {
                  return null;
                }
                const parsed = parseQuoteData(quote);
                // Map normalized symbol back to original (e.g., 2222:Tadawul -> ARAMCO)
                if (parsed && symbolMapping.has(normalizedSymbol)) {
                  parsed.symbol = symbolMapping.get(normalizedSymbol);
                } else {
                  parsed.symbol = normalizedSymbol;
                }
                return parsed;
              }).filter(price => price !== null);
            } else {
              // Single quote object
              const parsed = parseQuoteData(bulkResponse.data);
              if (parsed) {
                // Map back to original symbol if possible
                if (parsed.symbol && symbolMapping.has(parsed.symbol)) {
                  parsed.symbol = symbolMapping.get(parsed.symbol);
                }
                bulkPrices = [parsed];
              }
            }
          }

          if (bulkPrices.length > 0) {
            // Combine cached and bulk prices
            return [...cachedPrices, ...bulkPrices];
          }
        } catch (bulkError) {
          // Batch endpoint failed, fall back to individual calls
          console.log(`📊 Twelve Data batch request failed (${bulkError.message}), using individual quote calls`);
        }

        // Fallback: Make individual calls (Twelve Data has generous rate limits)
        // Twelve Data free tier: 800 requests/day, 8 requests/min
        const prices = [...cachedPrices];
        let lastApiCallTime = 0;
        const MIN_API_CALL_INTERVAL = 7500; // ~8 seconds between API calls (8 calls/min)

        for (const symbol of uncachedSymbols) {
          try {
            // Check cache again right before calling (might have been cached by another request)
            const cached = priceCache.get(symbol);
            if (cached && (Date.now() - cached.timestamp) < PRICE_CACHE_TTL) {
              prices.push(cached.data);
              continue; // Skip API call, no rate limiting needed
            }

            // Not cached - need to make API call, so respect rate limits
            const now = Date.now();
            const timeSinceLastCall = now - lastApiCallTime;
            if (timeSinceLastCall < MIN_API_CALL_INTERVAL) {
              const waitTime = MIN_API_CALL_INTERVAL - timeSinceLastCall;
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            const priceData = await getAssetPrice(symbol);
            prices.push(priceData);
            
            // Track API call time (we know this was an actual API call since cache check failed)
            lastApiCallTime = Date.now();
          } catch (error) {
            console.error(`❌ Failed to get price for ${symbol}:`, error.message);
            // Fallback to mock data for this symbol
            prices.push({
              symbol: symbol.toUpperCase(),
              price: Math.random() * 100 + 50,
              change: (Math.random() - 0.5) * 5,
              changePercent: (Math.random() - 0.5) * 5,
              timestamp: new Date()
            });
          }
        }
        return prices;
      } catch (error) {
        console.error('❌ Twelve Data batch error:', error.message);
        // Fall back to demo mode
        return symbols.map(symbol => ({
          symbol: symbol.toUpperCase(),
          price: Math.random() * 100 + 50,
          change: (Math.random() - 0.5) * 5,
          changePercent: (Math.random() - 0.5) * 5,
          timestamp: new Date()
        }));
      }
    }

    // Handle custom broker API (batch endpoint)
    if (BROKER_API_TYPE === 'custom') {
      if (!BROKER_API_BASE_URL) {
        throw new Error('BROKER_API_BASE_URL is required for custom broker API');
      }

      const response = await axios.post(`${BROKER_API_BASE_URL}/market/batch`, {
        symbols: symbols.map(s => s.toUpperCase())
      }, {
        headers: {
          'Authorization': `Bearer ${BROKER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return response.data.prices.map(price => ({
        symbol: price.symbol,
        price: price.price,
        change: price.change || 0,
        changePercent: price.changePercent || 0,
        volume: price.volume || 0,
        timestamp: new Date(price.timestamp || Date.now())
      }));
    }

    // Default: demo mode
    return symbols.map(symbol => ({
      symbol: symbol.toUpperCase(),
      price: Math.random() * 100 + 50,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 5,
      timestamp: new Date()
    }));
  } catch (error) {
    console.error('❌ Batch market data error:', error.message);
    // Fall back to demo mode on error
    console.log('📊 Falling back to demo mode due to error');
    return symbols.map(symbol => ({
      symbol: symbol.toUpperCase(),
      price: Math.random() * 100 + 50,
      change: (Math.random() - 0.5) * 5,
      changePercent: (Math.random() - 0.5) * 5,
      timestamp: new Date()
    }));
  }
}

/**
 * Get real-time price for an asset (bypasses cache - use for US stocks with Alpaca)
 * @param {string} symbol - Asset symbol (e.g. AAPL, GOOGL)
 * @returns {Promise<{symbol: string, price: number, change: number, changePercent: number, timestamp: Date}>}
 */
async function getAssetPriceRealtime(symbol) {
  return getAssetPrice(symbol, { realtime: true });
}

/**
 * Get real-time prices for multiple assets (bypasses cache - US stocks with Alpaca)
 * @param {Array<string>} symbols
 * @returns {Promise<Array>}
 */
async function getMultiplePricesRealtime(symbols) {
  if (BROKER_API_TYPE === 'alpaca' && isDataConfigured()) {
    try {
      const snapshots = await getSnapshots(symbols);
      const prices = [];
      const symbolSet = new Set(symbols.map(s => s.toUpperCase()));
      const snapObj = snapshots && typeof snapshots === 'object' && !Array.isArray(snapshots) ? snapshots : {};
      for (const sym of symbolSet) {
        const snap = snapObj[sym] || snapObj[sym.toLowerCase()];
        if (!snap) continue;
        const q = snap.latestQuote || snap.quote || snap.Quote;
        const minuteBar = snap.minuteBar || snap.minute_bar;
        const dailyBar = snap.dailyBar || snap.daily_bar;
        if (q) {
          const ap = parseFloat(q.ap);
          const bp = parseFloat(q.bp);
          const mid = (ap && bp) ? (ap + bp) / 2 : (ap || bp || 0);
          if (mid) {
            prices.push({
              symbol: sym,
              price: mid,
              change: 0,
              changePercent: 0,
              volume: parseInt(q.s, 10) || 0,
              high: mid,
              low: mid,
              open: mid,
              timestamp: new Date(q.t || Date.now())
            });
          }
        }
        if (prices.some(p => p.symbol === sym)) continue;
        const bar = minuteBar || dailyBar || snap.prevDailyBar;
        if (bar) {
          const c = parseFloat(bar.c);
          if (c) {
            prices.push({
              symbol: sym,
              price: c,
              change: 0,
              changePercent: 0,
              volume: parseInt(bar.v, 10) || 0,
              timestamp: new Date(bar.t || Date.now())
            });
          }
        }
      }
      if (prices.length > 0) return prices;
      const results = [];
      for (const symbol of symbols.slice(0, 50)) {
        try {
          const q = await getStockQuoteForPrice(symbol);
          if (q && q.price) results.push(q);
        } catch (e) { /* skip */ }
      }
      return results.length ? results : symbols.map(symbol => getMockPrice(symbol));
    } catch (error) {
      console.error('❌ Alpaca real-time batch error:', error.message);
      return symbols.map(symbol => getMockPrice(symbol));
    }
  }
  return getMultiplePrices(symbols);
}

/**
 * Get market summary
 * @returns {Promise<object>}
 */
async function getMarketSummary() {
  try {
    // Handle Alpaca (US market - use SPY as proxy for market)
    if (BROKER_API_TYPE === 'alpaca' && isDataConfigured()) {
      try {
        const spy = await getStockQuoteForPrice('SPY');
        const ndx = await getStockQuoteForPrice('QQQ');
        const marketStatus = spy ? 'open' : 'closed'; // simplistic
        const indices = [];
        if (spy) indices.push({ name: 'SPY (S&P 500 proxy)', value: spy.price, change: spy.change || 0, changePercent: spy.changePercent || 0 });
        if (ndx) indices.push({ name: 'QQQ (Nasdaq proxy)', value: ndx.price, change: ndx.change || 0, changePercent: ndx.changePercent || 0 });
        return {
          marketStatus,
          indices: indices.length ? indices : [{ name: 'US Equities', value: 0, change: 0, changePercent: 0 }],
          timestamp: new Date()
        };
      } catch (e) {
        console.error('❌ Alpaca market summary error:', e.message);
      }
      return {
        marketStatus: 'open',
        indices: [{ name: 'US Equities', value: 0, change: 0, changePercent: 0 }],
        timestamp: new Date()
      };
    }

    // Handle Twelve Data
    if (BROKER_API_TYPE === 'twelvedata') {
      if (!TWELVEDATA_API_KEY) {
        // Return demo data if no API key
        return {
          marketStatus: 'open',
          indices: [
            { name: 'TASI', value: 12000, change: 50, changePercent: 0.42 },
            { name: 'Tadawul All Share', value: 8500, change: -30, changePercent: -0.35 }
          ],
          timestamp: new Date()
        };
      }

      try {
        // Fetch TASI (Tadawul All Share Index) - Saudi Arabia's main index
        // Twelve Data symbol for TASI might be different, trying common formats
        const tasiSymbols = ['TASI:Tadawul', 'TASI', 'TASI.INDX'];
        let tasiData = null;

        for (const symbol of tasiSymbols) {
          try {
            const response = await axios.get('https://api.twelvedata.com/quote', {
              params: {
                symbol: symbol,
                apikey: TWELVEDATA_API_KEY
              },
              timeout: 10000
            });

            if (response.data && response.data.status !== 'error' && response.data.close) {
              tasiData = response.data;
              break;
            }
          } catch (err) {
            // Try next symbol format
            continue;
          }
        }

        // If we got TASI data, use it; otherwise return demo data
        if (tasiData) {
          const price = parseFloat(tasiData.close);
          const previousClose = parseFloat(tasiData.previous_close || tasiData.close);
          const change = price - previousClose;
          const changePercent = tasiData.percent_change ? parseFloat(tasiData.percent_change) : (change / previousClose) * 100;

          return {
            marketStatus: tasiData.is_market_open !== undefined ? (tasiData.is_market_open ? 'open' : 'closed') : 'open',
            indices: [
              {
                name: 'TASI',
                value: price,
                change: change,
                changePercent: changePercent
              }
            ],
            timestamp: new Date(tasiData.datetime || Date.now())
          };
        } else {
          // Fallback to demo data if TASI not found
          console.log('⚠️ TASI index not found in Twelve Data, using demo data');
          return {
            marketStatus: 'open',
            indices: [
              { name: 'TASI', value: 12000, change: 50, changePercent: 0.42 },
              { name: 'Tadawul All Share', value: 8500, change: -30, changePercent: -0.35 }
            ],
            timestamp: new Date()
          };
        }
      } catch (error) {
        console.error('❌ Twelve Data market summary error:', error.message);
        // Return demo data on error
        return {
          marketStatus: 'open',
          indices: [
            { name: 'TASI', value: 12000, change: 50, changePercent: 0.42 },
            { name: 'Tadawul All Share', value: 8500, change: -30, changePercent: -0.35 }
          ],
          timestamp: new Date()
        };
      }
    }

    // Handle custom broker API
    if (BROKER_API_TYPE === 'custom' && BROKER_API_BASE_URL && BROKER_API_KEY) {
      try {
        const response = await axios.get(`${BROKER_API_BASE_URL}/market/summary`, {
          headers: {
            'Authorization': `Bearer ${BROKER_API_KEY}`
          },
          timeout: 10000
        });

        return response.data;
      } catch (error) {
        console.error('❌ Custom broker market summary error:', error.message);
        throw new Error('Failed to fetch market summary from custom broker');
      }
    }

    // Default: return demo data
    return {
      marketStatus: 'open',
      indices: [
        { name: 'TASI', value: 12000, change: 50, changePercent: 0.42 },
        { name: 'Tadawul All Share', value: 8500, change: -30, changePercent: -0.35 }
      ],
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ Market summary error:', error.message);
    // Return demo data instead of throwing error
    return {
      marketStatus: 'open',
      indices: [
        { name: 'TASI', value: 12000, change: 50, changePercent: 0.42 },
        { name: 'Tadawul All Share', value: 8500, change: -30, changePercent: -0.35 }
      ],
      timestamp: new Date()
    };
  }
}

/**
 * Clear price cache
 */
function clearCache() {
  priceCache.clear();
  console.log('🗑️ Market data cache cleared');
}

module.exports = {
  getAssetPrice,
  getAssetPriceRealtime,
  getMultiplePrices,
  getMultiplePricesRealtime,
  getMarketSummary,
  clearCache
};
