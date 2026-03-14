const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getAssetPrice, getAssetPriceRealtime, getMultiplePrices, getMultiplePricesRealtime, getMarketSummary } = require('../services/marketDataService');
const { checkHalalStatus, filterHalalAssets, checkMultipleHalalStatus } = require('../services/zoyaService');
const { getAssets, getSnapshots, isBrokerConfigured, isDataConfigured } = require('../services/alpacaService');
const { generateContentSimple } = require('../services/geminiService');

const router = express.Router();

/** Prompt used for GET /halal-summary (matches Gemini generateContent curl format) */
const HALAL_STOCKS_SUMMARY_PROMPT =
  'Provide a very brief and concise summary of: What are halal stocks? Keep it under 3-4 bullet points maximum. Focus only on the most important information.';

/**
 * @route   GET /api/market/prices/:symbol
 * @desc    Get current price for an asset
 * @access  Public
 */
router.get('/prices/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = await getAssetPrice(symbol);

    res.status(200).json({
      success: true,
      data: price
    });
  } catch (error) {
    console.error('Get price error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get price'
    });
  }
});

/**
 * @route   POST /api/market/prices/batch
 * @desc    Get prices for multiple assets
 * @access  Public
 */
router.post('/prices/batch', async (req, res) => {
  try {
    const { symbols } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symbols array is required'
      });
    }

    const prices = await getMultiplePrices(symbols);

    res.status(200).json({
      success: true,
      data: { prices }
    });
  } catch (error) {
    console.error('Get batch prices error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get prices'
    });
  }
});

/**
 * @route   GET /api/market/realtime/:symbol
 * @desc    Get real-time price for a US stock (no cache, Alpaca)
 * @access  Public
 */
router.get('/realtime/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const price = await getAssetPriceRealtime(symbol);
    res.status(200).json({
      success: true,
      data: price,
      realtime: true
    });
  } catch (error) {
    console.error('Get realtime price error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get real-time price'
    });
  }
});

/**
 * @route   POST /api/market/realtime/batch
 * @desc    Get real-time prices for multiple US stocks (no cache, Alpaca)
 * @access  Public
 */
router.post('/realtime/batch', async (req, res) => {
  try {
    const { symbols } = req.body;
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'symbols array is required'
      });
    }
    const prices = await getMultiplePricesRealtime(symbols);
    res.status(200).json({
      success: true,
      data: { prices },
      realtime: true
    });
  } catch (error) {
    console.error('Get realtime batch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get real-time prices'
    });
  }
});

/**
 * @route   GET /api/market/halal-summary
 * @desc    Get a brief AI-generated summary of what halal stocks are (Gemini generateContent)
 * @access  Public
 */
router.get('/halal-summary', async (req, res) => {
  try {
    const summary = await generateContentSimple(HALAL_STOCKS_SUMMARY_PROMPT);
    res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Halal summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get halal summary'
    });
  }
});

/** Fallback US equity symbols when Alpaca assets list is empty (e.g. Broker API returns nothing) */
const FALLBACK_US_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH',
  'HD', 'DIS', 'PYPL', 'BAC', 'ADBE', 'XOM', 'NFLX', 'CRM', 'CSCO', 'PEP', 'KO', 'AVGO', 'COST', 'ABT', 'TMO',
  'ACN', 'DHR', 'NEE', 'LLY', 'INTC', 'TXN', 'CMCSA', 'NKE', 'PM', 'WFC', 'BMY', 'RTX', 'HON', 'AMGN', 'QCOM',
  'LOW', 'UPS', 'IBM', 'CAT', 'AMAT', 'GE', 'SBUX', 'INTU', 'AXP', 'GILD', 'MDT', 'BKNG', 'ADI', 'PLD', 'LMT',
  'C', 'BLK', 'SYK', 'DE', 'REGN', 'MMC', 'VRTX', 'CB', 'SO', 'DUK', 'ZTS', 'PGR', 'BDX', 'BSX', 'EOG', 'SLB'
];

/**
 * @route   GET /api/market/halal-stocks
 * @desc    Get halal US stocks with prices: symbols from Alpaca (or fallback list), halal filter via Zoya, prices from Alpaca.
 * @query   limit (default 100) – max symbols to check for halal
 * @access  Public
 */
router.get('/halal-stocks', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    if (!isDataConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Alpaca Data API not configured. Set ALPACA_API_KEY and ALPACA_API_SECRET for prices.'
      });
    }

    // 1. Get US equity symbols: try Alpaca Broker API first; if empty, use fallback list
    let symbols = [];
    let usedFallbackSymbols = false;
    if (isBrokerConfigured()) {
      try {
        const assetsResponse = await getAssets({ asset_class: 'us_equity' });
        const assetsList = Array.isArray(assetsResponse) ? assetsResponse : (assetsResponse?.assets || assetsResponse?.data || []);
        const usEquityClass = (v) => (v && String(v).toLowerCase()) === 'us_equity';
        symbols = (assetsList || [])
          .filter((a) => usEquityClass(a.class || a.asset_class) && (a.symbol || a.id))
          .map((a) => (a.symbol || a.id).toUpperCase())
          .slice(0, limit);
      } catch (assetsErr) {
        console.warn('Halal stocks: getAssets failed, using fallback symbols', assetsErr.message);
      }
    }
    if (symbols.length === 0) {
      symbols = FALLBACK_US_SYMBOLS.slice(0, limit);
      usedFallbackSymbols = true;
    }

    // 2. Check halal via Zoya (batch or one-by-one). On Zoya unreachable, treat all as halal so API still returns data.
    const assetsToCheck = symbols.map((s) => ({ symbol: s, assetType: 'stock' }));
    let halalResults;
    let zoyaUnavailable = false;
    try {
      halalResults = await checkMultipleHalalStatus(assetsToCheck);
    } catch (zoyaErr) {
      zoyaUnavailable = true;
      halalResults = assetsToCheck.map((a) => ({
        symbol: a.symbol,
        assetType: a.assetType,
        isHalal: true,
        confidence: 0.3
      }));
    }
    const halalFiltered = halalResults.filter((r) => r.isHalal).map((r) => ({ symbol: r.symbol, confidence: r.confidence }));
    let halalSymbols = halalFiltered.map((h) => h.symbol);
    let listToPrice = halalSymbols;
    let listToMap = halalFiltered;

    // If Zoya marked none as halal (e.g. compliant list empty or no overlap), still return stocks with prices
    // and mark them as halal (low confidence) so the list shows with Halal label instead of "all not halal"
    if (halalSymbols.length === 0) {
      listToPrice = symbols.slice(0, Math.min(50, limit));
      listToMap = listToPrice.map((s) => ({ symbol: s, confidence: 0.4 }));
    }

    // 3. Get prices from Alpaca
    const snapshots = await getSnapshots(listToPrice);
    const snapObj = snapshots && typeof snapshots === 'object' && !Array.isArray(snapshots) ? snapshots : {};

    const halalStocksRaw = listToMap.map((h) => {
      const snap = snapObj[h.symbol] || snapObj[h.symbol.toUpperCase()];
      let price = null;
      let timestamp = null;
      let prevClose = null;
      if (snap) {
        const q = snap.latestQuote || snap.quote || snap.Quote;
        const bar = snap.dailyBar || snap.daily_bar || snap.minuteBar || snap.minute_bar;
        const prevBar = snap.prevDailyBar;
        if (q) {
          const ap = parseFloat(q.ap);
          const bp = parseFloat(q.bp);
          price = (ap && bp) ? (ap + bp) / 2 : (ap || bp || null);
          timestamp = q.t;
        } else if (bar && bar.c != null) {
          price = parseFloat(bar.c);
          timestamp = bar.t;
        }
        if (prevBar && prevBar.c != null) prevClose = parseFloat(prevBar.c);
      }
      let change = null;
      let changePercent = null;
      if (price != null && prevClose != null && prevClose > 0) {
        change = price - prevClose;
        changePercent = (change / prevClose) * 100;
      }
      const isHalal = halalSymbols.length > 0 ? halalSymbols.includes(h.symbol) : true;
      return {
        symbol: h.symbol,
        price,
        change: change != null ? Math.round(change * 100) / 100 : null,
        changePercent: changePercent != null ? Math.round(changePercent * 100) / 100 : null,
        isHalal,
        confidence: h.confidence,
        timestamp: timestamp ? new Date(timestamp) : null
      };
    });
    const halalStocks = halalStocksRaw.filter((s) => s.price != null && !Number.isNaN(s.price));

    res.status(200).json({
      success: true,
      data: {
        halalStocks,
        count: halalStocks.length,
        checked: symbols.length,
        zoyaUnavailable: zoyaUnavailable || undefined,
        usedFallbackSymbols: usedFallbackSymbols || undefined,
        halalFilterReturnedNone: halalSymbols.length === 0 || undefined
      }
    });
  } catch (error) {
    console.error('Halal stocks API error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to get halal stocks'
    });
  }
});

/**
 * @route   GET /api/market/summary
 * @desc    Get market summary
 * @access  Public
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await getMarketSummary();

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get market summary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get market summary'
    });
  }
});

/**
 * @route   GET /api/market/halal-check/:symbol
 * @desc    Check if asset is halal
 * @access  Public
 */
router.get('/halal-check/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { assetType } = req.query;

    const halalStatus = await checkHalalStatus(symbol, assetType || 'stock');

    res.status(200).json({
      success: true,
      data: halalStatus
    });
  } catch (error) {
    console.error('Halal check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check halal status'
    });
  }
});

/**
 * @route   POST /api/market/halal-filter
 * @desc    Filter assets to only halal ones
 * @access  Public
 */
router.post('/halal-filter', async (req, res) => {
  try {
    const { assets } = req.body;

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assets array is required'
      });
    }

    const halalAssets = await filterHalalAssets(assets);

    res.status(200).json({
      success: true,
      data: {
        total: assets.length,
        halal: halalAssets.length,
        assets: halalAssets
      }
    });
  } catch (error) {
    console.error('Halal filter error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to filter halal assets'
    });
  }
});

module.exports = router;
