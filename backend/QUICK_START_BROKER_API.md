# Quick Start: Get Free Broker API (Alpha Vantage)

## Step 1: Sign Up for Alpha Vantage (Free)

1. **Go to**: https://www.alphavantage.co/support/#api-key
2. **Fill the form**:
   - First Name
   - Last Name
   - Email
   - Organization (optional)
3. **Click "GET FREE API KEY"**
4. **Check your email** - API key will be sent instantly
5. **Copy your API key** (looks like: `ABC123XYZ456`)

## Step 2: Add to Your .env File

Open `backend/.env` and add:

```env
# Market Data Provider
BROKER_API_TYPE=alphavantage
ALPHAVANTAGE_API_KEY=your-api-key-here
```

Or use the same key for both:

```env
BROKER_API_TYPE=alphavantage
BROKER_API_KEY=your-api-key-here
```

## Step 3: Test It

Restart your backend server:
```bash
cd backend
npm run dev
```

Test the API:
```bash
curl http://localhost:5000/api/market/prices/ARAMCO
```

## Important Notes

### Alpha Vantage Limits:
- ✅ **Free Tier**: 5 API calls per minute
- ✅ **Free Tier**: 500 calls per day
- ⚠️ **Saudi Stocks**: Limited coverage (some symbols may not work)
- ⚠️ **Symbol Format**: Use `.SR` suffix (e.g., `2222.SR` for ARAMCO)

### Symbol Mapping:
The service automatically converts common Saudi symbols:
- `ARAMCO` → `2222.SR`
- `SABIC` → `2010.SR`
- `STC` → `7010.SR`

### If You Hit Rate Limits:
The service will automatically fall back to mock data if Alpha Vantage fails.

## Alternative: Use Demo Mode

If you don't want to use Alpha Vantage right now:

```env
BROKER_API_TYPE=demo
```

This uses mock data (already working).

## For Production:

When ready for production, consider:
1. **ICE Data Services** - Official Tadawul data (paid)
2. **Partner with a Broker** - Al Rajhi Capital, Alinma, etc.
3. **Upgrade Alpha Vantage** - Paid plans available

---

## Troubleshooting

### "Alpha Vantage API key not configured"
- Make sure you added `ALPHAVANTAGE_API_KEY` or `BROKER_API_KEY` to `.env`
- Restart the server after adding the key

### "No price data available"
- The symbol might not be available in Alpha Vantage
- Try using the Tadawul symbol format: `2222.SR` instead of `ARAMCO`
- Check Alpha Vantage coverage: https://www.alphavantage.co/documentation/

### Rate Limit Errors
- Free tier allows 5 calls/minute
- The service will automatically fall back to mock data
- Consider upgrading to paid plan for higher limits
