# Twilio Backend Server

Simple Express server for handling Twilio Voice SDK endpoints.

## Quick Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```
   (On Mac/Linux: `cp .env.example .env`)

2. Edit `.env` and add your Twilio credentials:
   - `TWILIO_ACCOUNT_SID` - From your Twilio Console dashboard
   - `TWILIO_API_KEY` - Create at Account → API Keys & Tokens
   - `TWILIO_API_SECRET` - Shown when creating the API Key
   - `TWILIO_TWIML_APP_SID` - Create at Develop → TwiML → TwiML Apps
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number (format: +1234567890)

### 3. Start the Server

```bash
npm start
```

The server will run on `http://localhost:3001` by default.

### 4. Update Frontend to Use This Server

In your frontend, you can either:

**Option A: Use environment variable**
Create a `.env` file in the `crm` directory:
```
VITE_TWILIO_TOKEN_URL=http://localhost:3001/api/twilio/token
```

**Option B: Update the Call.jsx file directly**
Change the fetch URL to point to your server.

## Endpoints

- `POST /api/twilio/token` - Generates access tokens for the client
- `POST /api/twilio/voice` - Returns TwiML to handle calls
- `GET /health` - Health check endpoint

## Testing

1. Start the server: `npm start`
2. Test the health endpoint: `http://localhost:3001/health`
3. Test the token endpoint (using curl or Postman):
   ```bash
   curl -X POST http://localhost:3001/api/twilio/token
   ```

## Troubleshooting

- **"Missing Twilio credentials"**: Make sure your `.env` file exists and has all required variables
- **Port already in use**: Change the `PORT` in your `.env` file
- **CORS errors**: The server already includes CORS middleware, but make sure your frontend URL is allowed

