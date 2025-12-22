# Twilio Voice SDK Setup Guide

This guide will help you set up the backend endpoints needed for the Twilio Voice Call app.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com)
2. A Twilio phone number
3. A TwiML App configured in your Twilio Console

## Step 1: Get Your Twilio Credentials

1. Go to the [Twilio Console](https://console.twilio.com)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Create an **API Key** and **API Secret**:
   - Go to Account → API Keys & Tokens
   - Click "Create API Key"
   - Save the **SID** (this is your API Key) and **Secret** (this is your API Secret)

## Step 2: Create a TwiML App

1. Go to [TwiML Apps](https://console.twilio.com/develop/phone-numbers/manage/twiml-apps) in the Twilio Console
2. Click "Create new TwiML App"
3. Give it a name (e.g., "Voice Call App")
4. Set the **Voice Configuration**:
   - **Voice URL**: `https://your-backend-url.com/api/twilio/voice`
   - **HTTP Method**: POST
5. Save and note the **TwiML App SID**

## Step 3: Set Up Backend Endpoints

You need two backend endpoints:

### 3.1 Token Endpoint (`/api/twilio/token`)

This endpoint generates access tokens for the client.

**Node.js/Express Example:**

```javascript
const express = require('express');
const twilio = require('twilio');
const app = express();

app.use(express.json());

app.post('/api/twilio/token', (req, res) => {
  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  // Get credentials from environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  // Create access token
  const token = new AccessToken(
    accountSid,
    apiKey,
    apiSecret,
    { identity: 'user' } // You can customize this
  );

  // Add voice grant
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid
  });

  token.addGrant(voiceGrant);

  // Return token
  res.json({ token: token.toJwt() });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Environment Variables (.env):**
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_API_KEY=your_api_key_sid
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=your_twiml_app_sid
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 3.2 Voice Endpoint (`/api/twilio/voice`)

This endpoint returns TwiML to handle the call.

**Node.js/Express Example:**

```javascript
app.post('/api/twilio/voice', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const dial = twiml.dial({
    callerId: process.env.TWILIO_PHONE_NUMBER
  });
  
  // Get the phone number to call from the request
  const toNumber = req.body.To || req.query.To;
  
  if (toNumber) {
    dial.number(toNumber);
  } else {
    twiml.say('No number provided');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});
```

## Step 4: Install Twilio SDK

For Node.js:
```bash
npm install twilio
```

## Step 5: Update Frontend Endpoint URL

In `crm/src/pages/Call.jsx`, update the fetch URL to point to your backend:

```javascript
const response = await fetch('https://your-backend-url.com/api/twilio/token', {
  // ... rest of the code
});
```

Or use an environment variable:

```javascript
const tokenUrl = import.meta.env.VITE_TWILIO_TOKEN_URL || '/api/twilio/token';
const response = await fetch(tokenUrl, {
  // ... rest of the code
});
```

## Step 6: Test the Setup

1. Start your backend server
2. Open the Call page in your app
3. Click "Get Access Token"
4. Enter a phone number (format: +1234567890)
5. Click "Make Call"

## Troubleshooting

- **"Device not ready"**: Check that your token endpoint is working and returning a valid token
- **"Call failed"**: Verify your TwiML App is configured correctly and the Voice URL is accessible
- **"No token in response"**: Check your backend logs and ensure the endpoint returns `{ token: "..." }`
- **CORS errors**: Make sure your backend allows CORS requests from your frontend domain

## Security Notes

- Never expose your Twilio credentials in client-side code
- Always generate tokens on the server
- Use environment variables for all sensitive credentials
- Consider adding authentication to your token endpoint

