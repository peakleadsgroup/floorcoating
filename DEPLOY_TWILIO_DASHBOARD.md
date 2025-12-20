# Deploy Twilio Function Using Supabase Dashboard

Since the CLI installation failed, we'll use the Supabase Dashboard instead. This is actually easier!

## Step 1: Set Environment Variables (Secrets) in Dashboard

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/byquxteqnmzqpwjgnyfi
2. Click on **"Edge Functions"** in the left sidebar
3. Click on **"Secrets"** tab (or go to Settings → Edge Functions → Secrets)
4. Add these three secrets:

   **Secret 1:**
   - Name: `TWILIO_ACCOUNT_SID`
   - Value: `[YOUR_TWILIO_ACCOUNT_SID]` (e.g., ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
   - Click "Add Secret"

   **Secret 2:**
   - Name: `TWILIO_AUTH_TOKEN`
   - Value: `[YOUR_TWILIO_AUTH_TOKEN]` (your auth token from Twilio console)
   - Click "Add Secret"

   **Secret 3:**
   - Name: `TWILIO_PHONE_NUMBER`
   - Value: `[YOUR_TWILIO_PHONE_NUMBER]` (e.g., +19196290303)
   - Click "Add Secret"

## Step 2: Deploy the Function Using npx (No Installation Needed)

Open PowerShell in your project folder and run:

```powershell
npx supabase functions deploy twilio-call --project-ref byquxteqnmzqpwjgnyfi
```

This will:
- Prompt you to login (opens browser)
- Deploy the function without installing anything globally

## Alternative: Deploy via Dashboard

1. Go to **Edge Functions** in your Supabase dashboard
2. Click **"Create a new function"**
3. Name it: `twilio-call`
4. Copy and paste the contents of `supabase/functions/twilio-call/index.ts` into the editor
5. Click **"Deploy"**

## Step 3: Test

1. Go to your CRM at `crm.peakfloorcoating.com`
2. Click on the "Follow Up" tab
3. Click "Auto Dialer" button
4. Click "Start Dialing" in the modal
5. The call should be initiated!

## Troubleshooting

If you get authentication errors:
- Make sure you're logged into Supabase in your browser
- The npx command will prompt you to login if needed

If the function doesn't work:
- Check the Edge Functions logs in the Supabase dashboard
- Verify all three secrets are set correctly

