# Browser-Based Calling Setup with Twilio Voice SDK

This setup allows you to make calls from your browser using your computer's microphone and speakers.

## Prerequisites

### 1. Create a Twilio API Key

1. Go to: https://console.twilio.com/us1/develop/api-keys
2. Click **"Create API Key"**
3. Give it a friendly name (e.g., "Browser Calling")
4. Copy the **Key SID** and **Secret** (you'll only see the secret once!)
5. Save these - you'll need them as secrets

### 2. Create a TwiML App (Required for Browser Calling)

**Important:** Deploy the function first (Step 3), then come back to create the TwiML App.

1. Go to: https://console.twilio.com/us1/develop/runtime/twiml-apps
2. Click **"Create new TwiML App"**
3. Give it a friendly name (e.g., "Browser Call App")
4. For **Voice Configuration**:
   - **Request URL**: `https://byquxteqnmzqpwjgnyfi.supabase.co/functions/v1/twilio-call/twiml`
     - **DO NOT** include `?To={{To}}` - Twilio will add parameters automatically
   - **Request Method**: Select **"HTTP GET"**
5. Leave **Optional Settings** as default
6. Click **"Create"**
7. Copy the **App SID** (starts with `AP...`) - you'll need this as a secret

## Setup Steps

### 1. Add Secrets to Supabase

Go to your Supabase Edge Functions secrets and add:

1. **TWILIO_ACCOUNT_SID** (you should already have this)
2. **TWILIO_AUTH_TOKEN** (you should already have this)  
3. **TWILIO_PHONE_NUMBER** (you should already have this)
4. **TWILIO_API_KEY_SID** ⭐ NEW - Your API Key SID from step 1
5. **TWILIO_API_KEY_SECRET** ⭐ NEW - Your API Key Secret from step 1
6. **TWILIO_TWIML_APP_SID** ⭐ NEW - Your TwiML App SID from step 2

### 3. Deploy the Function

```powershell
npx supabase functions deploy twilio-call --project-ref byquxteqnmzqpwjgnyfi
```

### 4. Create the TwiML App

**Now** create the TwiML App (see Step 2 above) with the URL:
- `https://byquxteqnmzqpwjgnyfi.supabase.co/functions/v1/twilio-call/twiml`
- Method: **HTTP GET**

### 5. Install Dependencies

The `@twilio/voice-sdk` package should already be installed. If not:

```bash
cd crm
npm install @twilio/voice-sdk
```

## How It Works

1. Click "Start Dialing" for a lead
2. Browser requests microphone permission (click "Allow")
3. Edge Function generates a Twilio access token
4. Twilio Voice SDK initializes in your browser
5. SDK connects via WebRTC to Twilio
6. Call is placed to the lead's phone
7. You talk using your computer's microphone/speakers

## Browser Permissions

When you first click "Start Dialing", your browser will ask for microphone permission:
- **Chrome/Edge**: Click "Allow" when prompted
- **Firefox**: Click "Allow" when prompted
- **Safari**: Click "Allow" when prompted

If you deny permission, you'll need to:
- Chrome: Click the lock icon in address bar → Site Settings → Microphone → Allow
- Firefox: Click the permissions icon → Allow microphone
- Safari: Safari → Preferences → Websites → Microphone → Allow

## Testing

1. Open your CRM
2. Go to "Follow Up" tab
3. Select a lead with a phone number
4. Click "Start Dialing"
5. Allow microphone access when prompted
6. Wait for the call to connect
7. Speak into your computer's microphone
8. Click "End Call" when done

## Troubleshooting

### "Failed to get access token"
- Verify `TWILIO_API_KEY_SID` and `TWILIO_API_KEY_SECRET` are set correctly
- Check that the API Key is active in Twilio Console

### "Device not initialized"
- Check browser console for errors
- Make sure Edge Function is deployed
- Verify all secrets are set

### "Call failed to connect"
- Check that `TWILIO_TWIML_APP_SID` is set correctly
- Verify the TwiML App URL points to your function
- Check Edge Function logs for errors

### Microphone not working
- Check browser permissions (see above)
- Make sure you clicked "Allow" when prompted
- Try refreshing the page and allowing again
- Check your computer's microphone settings

### Call connects but no audio
- Check your computer's microphone and speaker settings
- Make sure microphone is not muted
- Check browser console for audio errors
- Try using headphones to avoid feedback

## Notes

- Requires HTTPS (Supabase provides this automatically)
- Browser must support WebRTC (all modern browsers do)
- The caller ID will show your Twilio phone number
- Calls go through Twilio's infrastructure (reliable quality)
