# Click-to-Call Setup Guide

This guide explains the new click-to-call functionality that rings YOUR phone and connects you to leads.

## How It Works

1. **You click "Start Dialing"** in the CRM for a lead
2. **Twilio calls YOUR phone** (the number you set as USER_PHONE_NUMBER)
3. **You answer your phone**
4. **Twilio says** "Connecting you to your lead now"
5. **Twilio dials the lead's number** and connects you both

This is much better than direct outbound calls because:
- ✅ Only one call at a time (no concurrency issues)
- ✅ You control when to talk to leads
- ✅ Works with any phone (cell phone, landline, etc.)
- ✅ No need for SIP clients or special software
- ✅ Simple and reliable

## Setup Steps

### 1. Set Environment Variables (Secrets) in Supabase Dashboard

Go to your Supabase project dashboard and add these **four secrets**:

1. **TWILIO_ACCOUNT_SID**
   - Your Twilio Account SID (e.g., `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

2. **TWILIO_AUTH_TOKEN**
   - Your Twilio Auth Token (from Twilio console)

3. **TWILIO_PHONE_NUMBER**
   - Your Twilio phone number (e.g., `+19196290303`)
   - This is the number that shows as the caller ID

4. **USER_PHONE_NUMBER** ⭐ NEW
   - **YOUR phone number** where you want to receive calls (e.g., `+15551234567`)
   - This can be your cell phone, office phone, or any number you want to answer
   - Must be in E.164 format (e.g., `+15551234567`)

### 2. Deploy the Function

Deploy the updated function:

```powershell
npx supabase functions deploy twilio-call --project-ref byquxteqnmzqpwjgnyfi
```

Or deploy via the Supabase Dashboard by copying the code from `supabase/functions/twilio-call/index.ts`

### 3. Test It

1. Go to your CRM
2. Click on the "Follow Up" tab
3. Select a lead with a phone number
4. Click "Start Dialing"
5. **Your phone should ring!**
6. Answer it and you'll be connected to the lead

## Technical Details

### Call Flow

```
CRM Button Click
    ↓
Edge Function receives request
    ↓
Twilio API: Call USER_PHONE_NUMBER
    ↓
Your Phone Rings
    ↓
You Answer
    ↓
Twilio fetches TwiML from function's /twiml endpoint
    ↓
TwiML says "Connecting you to your lead now"
    ↓
TwiML dials the lead's number
    ↓
You and Lead are connected!
```

### TwiML Endpoint

The function now handles two types of requests:

1. **POST /twilio-call** - Initiate the call (called from CRM)
2. **GET /twilio-call/twiml?To=+1234567890** - Return TwiML to dial the lead (called by Twilio when you answer)

### Phone Number Format

All phone numbers must be in **E.164 format**:
- US: `+15551234567` (includes country code +1)
- International: `+[country code][number]`
- No spaces, dashes, or parentheses

## Troubleshooting

### "User phone number not provided" error
- Make sure you set the `USER_PHONE_NUMBER` secret in Supabase
- Or pass `user_phone` in the request body (for testing)

### Calls not connecting
- Check that your phone number is correct and in E.164 format
- Verify all four secrets are set correctly
- Check Supabase Edge Function logs for errors
- Check Twilio call logs to see what's happening

### Still getting concurrency errors
- This new approach should eliminate concurrency issues
- If you still see errors, check that you're not clicking the button multiple times rapidly
- The button has a 5-second cooldown to prevent rapid clicks

## Advanced: Multiple Users

If you want different users to have different phone numbers, you can:
1. Store user phone numbers in your database
2. Pass `user_phone` in the request body from the frontend
3. The function will use the provided number instead of the secret

Example request:
```json
{
  "phone_number": "+15551234567",
  "lead_id": "123",
  "user_phone": "+15559876543"  // Optional: overrides USER_PHONE_NUMBER secret
}
```

