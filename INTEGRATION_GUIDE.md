# Frontend-Backend Integration Guide

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/robo-advisor
JWT_SECRET=your-secret-key-here
DEMO_MODE=true
```

Start backend:
```bash
npm run dev
```

### 2. Frontend Configuration

Update API base URL in `src/config/api.ts`:

**For iOS Simulator/Android Emulator:**
```typescript
BASE_URL: 'http://localhost:5000'
```

**For Physical Device:**
```typescript
BASE_URL: 'http://YOUR_COMPUTER_IP:5000'
// Example: 'http://192.168.1.100:5000'
```

To find your IP:
- Mac/Linux: `ifconfig | grep "inet "`
- Windows: `ipconfig`

### 3. Testing the Integration

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   npm start
   # Then run on device/simulator
   npm run ios
   # or
   npm run android
   ```

3. **Test Flow:**
   - App opens to account creation screen (account-1)
   - Fill in the steps
   - When you reach phone number step (account-12):
     - Enter phone number
     - Click Continue
     - Accept terms
     - OTP will be sent (in demo mode, code appears in alert)
   - Enter OTP code
   - Complete registration

## Demo Mode Features

When `DEMO_MODE=true` in backend `.env`:

1. **OTP Codes are logged to console:**
   ```
   📱 DEMO MODE: SMS OTP
   📱 Phone: +966501234567
   📱 OTP Code: 12345
   ```

2. **OTP Codes returned in API response:**
   ```json
   {
     "success": true,
     "data": {
       "demo": true,
       "code": "12345"
     }
   }
   ```

3. **Frontend shows OTP in alert and on screen:**
   - Alert popup with OTP code
   - Demo banner on OTP screen showing the code

## API Integration Points

### Account Creation Flow

1. **Step 1-11:** Store selections in local storage
2. **Step 12 (Phone):** 
   - Send OTP API call
   - Store phone number
3. **Step 13 (Password):** 
   - Store password locally
4. **Step 14 (OTP Verification):**
   - Verify OTP
   - Register user with all collected data
5. **Step 17 (Identity):**
   - Send OTP for identity verification
6. **Step 18 (Identity OTP):**
   - Verify OTP and identity
7. **Step 21 (Bank):**
   - Send OTP for bank verification
8. **Step 22 (Bank OTP):**
   - Verify OTP and link bank

## Error Handling

- Network errors are caught and displayed
- Validation errors from backend are shown
- Loading states prevent duplicate requests
- Error messages are displayed in red banners

## Storage

- **Auth Token:** Stored securely using MMKV
- **User Data:** Cached locally
- **Account Data:** Temporarily stored during registration flow

## Troubleshooting

### "Network request failed"
- Check backend is running on correct port
- Verify API base URL matches your setup
- For physical device, ensure IP address is correct
- Check firewall settings

### "CORS error"
- Backend CORS is configured for `http://localhost:3000`
- Update `FRONTEND_URL` in backend `.env` if needed

### "OTP not received"
- Check backend console for demo OTP code
- Verify phone number format (should include country code)
- Check demo mode is enabled

### "Invalid token"
- Token might have expired
- Try logging out and registering again
- Check JWT_SECRET in backend `.env`

## Next Steps

1. **Configure Real SMS/Email:**
   - Set up Twilio credentials
   - Set up Gmail SMTP
   - Set `DEMO_MODE=false`

2. **Add Error Recovery:**
   - Retry failed requests
   - Offline mode support
   - Better error messages

3. **Add Loading Indicators:**
   - Global loading state
   - Progress indicators
   - Skeleton screens
