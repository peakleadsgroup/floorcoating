# Backend Server Setup Guide

## Step 1: Install Dependencies

Open a terminal in the `server` directory and run:

```bash
npm install
```

## Step 2: Create Environment File

Create a file named `.env` in the `server` directory with the following content:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_API_KEY=your_api_key_sid_here
TWILIO_API_SECRET=your_api_secret_here
TWILIO_TWIML_APP_SID=your_twiml_app_sid_here
TWILIO_PHONE_NUMBER=+1234567890
PORT=3001
```

## Step 3: Get Your Twilio Credentials

1. **Account SID**: Found on your Twilio Console dashboard
2. **API Key & Secret**: 
   - Go to Account → API Keys & Tokens
   - Click "Create API Key"
   - Save the SID (API Key) and Secret (shown only once!)
3. **TwiML App SID**:
   - Go to Develop → TwiML → TwiML Apps
   - Create a new TwiML App
   - Set Voice URL to: `http://your-backend-url.com/api/twilio/voice`
   - Save and copy the App SID
4. **Phone Number**: Your Twilio phone number (format: +1234567890)

## Step 4: Start the Server

```bash
npm start
```

The server will run on `http://localhost:3001`

## Step 5: Update Frontend

Create a `.env` file in the `crm` directory:

```
VITE_TWILIO_TOKEN_URL=http://localhost:3001/api/twilio/token
```

Then restart your frontend dev server.

