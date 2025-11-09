# Flutterwave Webhook Setup Guide

## ✅ What's Been Configured

Your Flutterwave integration is now set up with enhanced security:

### 1. **API Keys** (Already Configured)
- ✅ `FLW_PUBLIC_KEY` - Your public key for frontend integration
- ✅ `FLW_SECRET_KEY` - Your secret key for backend API calls
- ✅ `FLW_SECRET_HASH` - Your webhook secret hash for signature verification

### 2. **Webhook Endpoint** (Already Implemented)
- **URL**: `https://your-replit-app.replit.app/api/payments/webhook`
- **Location**: `server/routes.ts` (line 341)
- **Security**: Supports both modern HMAC-SHA256 and legacy verification methods

### 3. **Enhanced Security Features**
- ✅ HMAC-SHA256 signature verification
- ✅ Timing-safe comparison to prevent timing attacks
- ✅ Backward compatibility with legacy verification
- ✅ Transaction re-verification with Flutterwave API
- ✅ Duplicate payment prevention
- ✅ Amount and currency validation

---

## 🔧 Setup Steps in Flutterwave Dashboard

### Step 1: Log in to Flutterwave Dashboard
1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com/)
2. Log in with your credentials

### Step 2: Configure Test Environment Webhook
1. Navigate to **Settings** → **Webhooks**
2. Under **Test** environment:
   - **Webhook URL**: Enter your app's webhook URL:
     ```
     https://your-replit-app.replit.app/api/payments/webhook
     ```
     ⚠️ Replace `your-replit-app` with your actual Replit domain
   
   - **Secret Hash**: Enter the same value you used for `FLW_SECRET_HASH`
     - This should be a strong, random string (like a password)
     - If you don't remember it, you can generate a new one and update your environment variable
   
3. Click **Save**

### Step 3: Configure Live Environment Webhook (When Ready for Production)
1. In the same **Settings** → **Webhooks** page
2. Under **Live** environment:
   - **Webhook URL**: Same as test environment
   - **Secret Hash**: Same secret hash value
3. Click **Save**

---

## 🧪 Testing Your Webhook

### Option 1: Test Payment Flow
1. Create a test registration in your app
2. Complete the payment using Flutterwave test cards:
   ```
   Card Number: 5531886652142950
   CVV: 564
   Expiry: 09/32
   PIN: 3310
   OTP: 12345
   ```
3. Monitor your server logs to see the webhook being received and processed

### Option 2: Local Testing with ngrok
If you need to test locally during development:

```bash
# Install ngrok (if not already installed)
# https://ngrok.com/download

# Start ngrok tunnel
ngrok http 5000

# Use the HTTPS URL provided by ngrok as your webhook URL
# Example: https://abc123.ngrok.io/api/payments/webhook
```

Add this ngrok URL to your Flutterwave **Test** environment webhook settings.

---

## 🔐 Security Best Practices

### ✅ What We're Already Doing
1. **HMAC-SHA256 Verification**: Modern cryptographic signature verification
2. **Timing-Safe Comparison**: Prevents timing attack vulnerabilities
3. **Double Verification**: Re-verifying transactions with Flutterwave API
4. **Idempotency**: Preventing duplicate payment processing
5. **Amount Validation**: Ensuring payment amount matches expected value
6. **Currency Validation**: Confirming correct currency (XAF)

### ⚠️ Important Notes
- **HTTPS Required**: Flutterwave requires webhook URLs to use HTTPS
- **Quick Response**: Webhook responds within 60 seconds to avoid retries
- **Secret Hash Security**: Keep your `FLW_SECRET_HASH` secret and never commit it to version control
- **Environment Separation**: Use different webhook configurations for Test and Live environments

---

## 📊 Webhook Event Flow

```
1. User completes payment on Flutterwave
   ↓
2. Flutterwave sends webhook to your endpoint
   ↓
3. Your server verifies HMAC signature
   ↓
4. Re-verify transaction with Flutterwave API
   ↓
5. Validate tx_ref, amount, currency
   ↓
6. Update registration payment status
   ↓
7. Update referral status (if applicable)
   ↓
8. Return 200 OK to Flutterwave
```

---

## 🐛 Troubleshooting

### Webhook Not Being Received
- ✅ Verify your webhook URL is accessible (HTTPS)
- ✅ Check that the URL is correctly configured in Flutterwave dashboard
- ✅ Ensure your app is running and not sleeping
- ✅ Check server logs for incoming requests

### Signature Verification Failing
- ✅ Verify `FLW_SECRET_HASH` matches the value in Flutterwave dashboard
- ✅ Check that the secret hash is the same for both Test and Live environments
- ✅ Ensure no extra spaces or characters in the secret hash

### Duplicate Payment Processing
- ✅ The webhook automatically checks for duplicate processing
- ✅ Check logs for "already_processed" status

### Monitoring Webhook Activity
Check your server logs for these messages:
```
✅ "Payment webhook processed successfully for registration: {id}"
⚠️ "Payment already completed for registration: {id}"
❌ "Invalid webhook signature"
❌ "Transaction verification failed: {id}"
```

---

## 📝 Webhook Payload Example

When a payment is successful, Flutterwave sends:

```json
{
  "event": "charge.completed",
  "data": {
    "id": 12345,
    "tx_ref": "REG-abc123-1699999999",
    "status": "successful",
    "amount": 2500,
    "charged_amount": 2500,
    "currency": "XAF",
    "customer": {
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

---

## 🎯 Next Steps

1. ✅ Verify your webhook URL in Flutterwave dashboard (Test environment)
2. ✅ Perform a test payment to ensure webhooks are received
3. ✅ Monitor logs to confirm successful processing
4. ✅ When ready for production, configure the Live environment webhook
5. ✅ Keep your secret hash secure and backed up

---

## 📞 Support

- **Flutterwave Documentation**: https://developer.flutterwave.com/docs/webhooks
- **Flutterwave Support**: https://flutterwave.com/support
- **Test Cards**: https://developer.flutterwave.com/docs/test-cards

---

## 🔍 Code Reference

The webhook implementation can be found in:
- **File**: `server/routes.ts`
- **Endpoint**: `POST /api/payments/webhook` (line 341)
- **Verification**: Lines 357-392 (HMAC-SHA256 + legacy support)
- **Processing**: Lines 395-455 (payment verification and update)
