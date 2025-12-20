# Twilio Calling Setup Guide

This guide explains how to set up Twilio calling functionality in your CRM.

## Prerequisites

1. Twilio account with a phone number
2. Twilio Account SID
3. Twilio Auth Token
4. Your Twilio phone number (in E.164 format, e.g., +15551234567)

## Step 1: Get Your Twilio Credentials

1. Log in to your [Twilio Console](https://console.twilio.com/)
2. Go to **Account** → **API Keys & Tokens**
3. Copy your:
   - **Account SID**
   - **Auth Token**
4. Go to **Phone Numbers** → **Manage** → **Active Numbers**
5. Copy your Twilio phone number (format it as +1XXXXXXXXXX)

## Step 2: Deploy the Supabase Edge Function

1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Set environment variables for the Edge Function:
   ```bash
   supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid
   supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token
   supabase secrets set TWILIO_PHONE_NUMBER=+15551234567
   ```

5. Deploy the function:
   ```bash
   supabase functions deploy twilio-call
   ```

## Step 3: Set Up TwiML Webhook (Optional but Recommended)

You have two options for handling the call:

### Option A: Use a TwiML URL (Recommended)
1. Create a TwiML webhook URL in Twilio
2. Update the Edge Function to use your TwiML URL
3. The TwiML can handle call routing, voicemail, etc.

### Option B: Use Inline TwiML
1. Update the Edge Function to use inline TwiML
2. Example: `<Response><Say>Connecting your call.</Say><Dial>+15551234567</Dial></Response>`

## Step 4: Update the Frontend

The "Start Dialing" button in `crm/src/pages/Leads.jsx` will call the Edge Function. The function is already set up to:
- Format phone numbers to E.164 format
- Make the Twilio API call
- Return the call status

## Step 5: Test

1. Click "Auto Dialer" in the Follow Up tab
2. Click "Start Dialing" in the modal
3. Check your Twilio console to see the call being initiated

## Troubleshooting

- **401 Unauthorized**: Check that your Twilio credentials are correct
- **Invalid phone number**: Ensure phone numbers are in E.164 format (+1XXXXXXXXXX)
- **Function not found**: Make sure you've deployed the Edge Function
- **CORS errors**: The Edge Function handles CORS automatically

## Security Notes

- Never expose Twilio credentials in frontend code
- Always use Edge Functions or server-side code for Twilio API calls
- Keep your Auth Token secret and rotate it regularly

