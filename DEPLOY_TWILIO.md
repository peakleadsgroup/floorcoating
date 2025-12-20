# Deploy Twilio Calling Function - Step by Step

## Your Twilio Credentials
- Account SID: [YOUR_TWILIO_ACCOUNT_SID]
- Auth Token: [YOUR_TWILIO_AUTH_TOKEN]
- Phone Number: [YOUR_TWILIO_PHONE_NUMBER] (formatted for E.164, e.g., +19196290303)

## Step-by-Step Deployment

### 1. Open Terminal/Command Prompt
Navigate to your project root directory:
```bash
cd "C:\Users\dr3wh\OneDrive\Desktop\PeakLeadsGroup\Peak Floor Coating\Git\floorcoating"
```

### 2. Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
```

### 3. Login to Supabase
```bash
supabase login
```
This will open a browser window for you to authenticate.

### 4. Link to Your Project
```bash
supabase link --project-ref byquxteqnmzqpwjgnyfi
```

### 5. Set Environment Variables (Secrets)
Run these three commands to set your Twilio credentials:

```bash
supabase secrets set TWILIO_ACCOUNT_SID=[YOUR_TWILIO_ACCOUNT_SID]
```

```bash
supabase secrets set TWILIO_AUTH_TOKEN=[YOUR_TWILIO_AUTH_TOKEN]
```

```bash
supabase secrets set TWILIO_PHONE_NUMBER=[YOUR_TWILIO_PHONE_NUMBER]
```

### 6. Deploy the Function
```bash
supabase functions deploy twilio-call
```

### 7. Verify Deployment
After deployment, you should see a success message. The function will be available at:
`https://byquxteqnmzqpwjgnyfi.supabase.co/functions/v1/twilio-call`

## Testing

1. Go to your CRM at `crm.peakfloorcoating.com`
2. Click on the "Follow Up" tab
3. Click "Auto Dialer" button
4. Click "Start Dialing" in the modal
5. Check your Twilio console to see the call being initiated

## How It Works

When "Start Dialing" is clicked:
1. The frontend calls the Supabase Edge Function
2. The Edge Function formats the phone number
3. Twilio API is called to initiate the call
4. The call connects your Twilio number to the lead's number

## Troubleshooting

If you get errors:
- **"Function not found"**: Make sure you deployed the function
- **"Unauthorized"**: Check that your secrets are set correctly
- **"Invalid phone number"**: The function automatically formats numbers to E.164 format

## Next Steps (Optional)

You can customize the TwiML in `supabase/functions/twilio-call/index.ts` to:
- Add a greeting message
- Set up voicemail
- Record calls
- Add call routing logic

