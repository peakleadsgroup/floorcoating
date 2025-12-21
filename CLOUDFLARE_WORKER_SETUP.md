# Cloudflare Worker Setup for Twilio Token Generation

This guide explains how to set up a Cloudflare Worker to generate Twilio access tokens, which is simpler and more reliable than Supabase Edge Functions for JWT generation.

## Why Cloudflare Workers?

- ✅ Better JWT/crypto support
- ✅ Simpler deployment
- ✅ Global edge network (faster)
- ✅ Free tier: 100,000 requests/day
- ✅ Easy secret management

## Setup Steps

### 1. Install Wrangler CLI (Cloudflare's CLI)

```powershell
npm install -g wrangler
```

Or use npx (no global install needed):
```powershell
npx wrangler --version
```

### 2. Login to Cloudflare

```powershell
npx wrangler login
```

This will open your browser to authenticate with Cloudflare.

### 3. Deploy the Worker

Navigate to the cloudflare-worker directory:

```powershell
cd cloudflare-worker
npx wrangler deploy
```

You'll be prompted to create a Cloudflare account if you don't have one (free).

### 4. Set Environment Variables (Secrets)

Set your Twilio credentials as secrets in Cloudflare. You can do this via CLI or Dashboard:

**Via CLI:**
```powershell
npx wrangler secret put TWILIO_ACCOUNT_SID
# Paste your Account SID when prompted and press Enter

npx wrangler secret put TWILIO_API_KEY_SID
# Paste your API Key SID when prompted

npx wrangler secret put TWILIO_API_KEY_SECRET
# Paste your API Key Secret when prompted

npx wrangler secret put TWILIO_TWIML_APP_SID
# Paste your TwiML App SID when prompted
```

**Via Cloudflare Dashboard:**
1. Go to: https://dash.cloudflare.com/
2. Navigate to **Workers & Pages**
3. Click on your **twilio-token** worker
4. Go to **Settings** → **Variables and Secrets**
5. Under "Environment Variables", add each as a **Secret**:
   - `TWILIO_ACCOUNT_SID` = your Account SID
   - `TWILIO_API_KEY_SID` = your API Key SID
   - `TWILIO_API_KEY_SECRET` = your API Key Secret
   - `TWILIO_TWIML_APP_SID` = your TwiML App SID

### 5. Get Your Worker URL

After deployment, Wrangler will show you the Worker URL, something like:
```
https://twilio-token.your-subdomain.workers.dev
```

Or find it in Cloudflare Dashboard:
- Workers & Pages → twilio-token → Settings → Triggers → Routes

### 6. Update Frontend to Use Cloudflare Worker

Edit `crm/src/hooks/useTwilioVoice.js` and replace the token fetching code:

Find this section (around line 18-50):
```javascript
// Option 2: Use Supabase Edge Function
const { data: tokenData, error: tokenError } = await supabase.functions.invoke('twilio-call', {
  body: {
    action: 'token'
  }
})
```

Replace with:
```javascript
// Use Cloudflare Worker for token generation
const cloudflareWorkerUrl = 'https://YOUR-WORKER-URL.workers.dev'
const tokenResponse = await fetch(cloudflareWorkerUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})

if (!tokenResponse.ok) {
  const errorText = await tokenResponse.text()
  throw new Error(`Failed to get token: ${tokenResponse.status} - ${errorText}`)
}

const tokenData = await tokenResponse.json()

if (tokenData.error) {
  throw new Error(tokenData.error)
}

if (!tokenData.token) {
  throw new Error('Token not found in response')
}
```

**Important:** Replace `YOUR-WORKER-URL` with your actual Cloudflare Worker URL from step 5.

### 7. Test

1. Deploy the worker
2. Set all secrets
3. Update the frontend with your worker URL
4. Refresh your CRM page
5. Try clicking "Start Dialing"

## Testing the Worker Directly

You can test the worker endpoint directly:

```powershell
curl https://YOUR-WORKER-URL.workers.dev
```

Should return: `{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}`

## Troubleshooting

### "Missing credentials" error
- Verify all 4 secrets are set: `npx wrangler secret list`
- Or check in Cloudflare Dashboard → Variables

### CORS errors
- The worker already handles CORS in the code
- Make sure you're using the correct Worker URL

### Still getting JWT invalid errors
- Verify your API Key Secret is correct (create a new one if unsure)
- Make sure API Key SID matches the Account SID
- Check TwiML App SID format (should start with `AP...`)

### Worker deployment fails
- Make sure you're logged in: `npx wrangler whoami`
- Check you're in the `cloudflare-worker` directory

## Keeping Both Options

You can keep both Supabase and Cloudflare options in the code and switch between them by commenting/uncommenting the relevant sections in `useTwilioVoice.js`.
