# Quick Start: Backend Setup

Follow these steps to get your Twilio backend running:

## Step 1: Install Server Dependencies

```bash
cd server
npm install
```

## Step 2: Create .env File

Create a file named `.env` in the `server` folder with your Twilio credentials:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret_here
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
PORT=3001
```

**Where to get these values:**
- **Account SID**: Twilio Console → Dashboard (main page)
- **API Key & Secret**: Twilio Console → Account → API Keys & Tokens → Create API Key
- **TwiML App SID**: Twilio Console → Develop → TwiML → TwiML Apps → Create new app
  - When creating the app, set Voice URL to: `http://your-backend-url.com/api/twilio/voice`
- **Phone Number**: Your Twilio phone number (format: +1234567890)

## Step 3: Start the Backend Server

```bash
npm start
```

You should see:
```
🚀 Twilio Backend Server running on http://localhost:3001
```

## Step 4: Configure Frontend

Create a `.env` file in the `crm` folder:

```
VITE_TWILIO_TOKEN_URL=http://localhost:3001/api/twilio/token
```

Then restart your frontend dev server (if it's running).

## Step 5: Test It!

1. Open your app in the browser
2. Go to the "Call" tab
3. Click "Get Access Token"
4. Enter a phone number
5. Click "Make Call"

## Troubleshooting

- **"Missing Twilio credentials"**: Check your `.env` file in the `server` folder
- **Port 3001 already in use**: Change `PORT=3001` to a different port in your `.env` file
- **CORS errors**: The server already handles CORS, but make sure both servers are running

## Need Help?

See `server/README.md` for more detailed information.

