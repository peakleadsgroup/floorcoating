const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow CORS from your frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Twilio backend server is running' });
});

// Token endpoint - generates access tokens for the client
app.post('/api/twilio/token', (req, res) => {
  try {
    // Get credentials from environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    // Validate required environment variables
    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      console.error('Missing Twilio credentials in environment variables');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Missing Twilio credentials. Please check your .env file.'
      });
    }

    // Create access token
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Create token with identity (you can customize this)
    const identity = req.body.identity || 'user';
    const token = new AccessToken(
      accountSid,
      apiKey,
      apiSecret,
      { identity: identity }
    );

    // Add voice grant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid
    });

    token.addGrant(voiceGrant);

    console.log(`Token generated for identity: ${identity}`);

    // Return token
    res.json({ token: token.toJwt() });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      error: 'Failed to generate token',
      message: error.message
    });
  }
});

// Voice endpoint - returns TwiML to handle the call
app.post('/api/twilio/voice', (req, res) => {
  try {
    const twiml = new twilio.twiml.VoiceResponse();
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // Get the phone number to call from the request
    // Twilio sends this in the request body or query params
    const toNumber = req.body.To || req.query.To;

    console.log('Incoming voice request:', { toNumber, body: req.body, query: req.query });

    if (!toNumber) {
      twiml.say('No phone number provided');
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // Create dial with caller ID
    const dial = twiml.dial({
      callerId: twilioPhoneNumber || undefined
    });

    dial.number(toNumber);

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error generating TwiML:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('An error occurred processing your call');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Twilio Backend Server running on http://localhost:${PORT}`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   - Health: http://localhost:${PORT}/health`);
  console.log(`   - Token:  http://localhost:${PORT}/api/twilio/token`);
  console.log(`   - Voice:  http://localhost:${PORT}/api/twilio/voice`);
  console.log(`\n⚠️  Make sure your .env file is configured with your Twilio credentials!\n`);
});

