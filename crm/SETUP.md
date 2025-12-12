# Quick Setup Guide

## 1. Supabase Database Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (takes ~2 minutes)
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `supabase-schema.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify tables were created by checking the **Table Editor** in the left sidebar

## 2. Get Your Supabase Credentials

1. Go to **Settings** → **API** in your Supabase project
2. Copy the **Project URL** (looks like: `https://xxxxx.supabase.co`)
3. Copy the **anon/public** key (long string starting with `eyJ...`)

## 3. Configure Environment Variables

1. In the `crm` folder, create a file named `.env`
2. Add these lines (replace with your actual values):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Install and Run

```bash
cd crm
npm install
npm run dev
```

The app will open at `http://localhost:5173`

## 5. Test the Flow

1. **Create a Lead**: Click "+ New Lead" on the Sales Board
2. **Fill in details**: Add name, phone, email, address
3. **Move to "Ready to Sign"**: Drag the lead card to that stage
4. **Generate Contract**: Click the lead, enter a price, click "Generate Contract Link"
5. **Copy the link**: Click "Copy Contract Link"
6. **Open in new tab**: Paste the link to see the public contract page
7. **Sign and Pay**: Fill in name, check box, click "Sign & Pay Deposit"
8. **Check Project Board**: Go to "Project Board" - you should see a new project!

## Troubleshooting

### "Error loading leads"
- Check that your `.env` file has the correct Supabase URL and key
- Verify the database tables were created (check Supabase Table Editor)
- Make sure you're using the **anon/public** key, not the service role key

### "Contract not found"
- Make sure you copied the full contract link
- Check that the contract exists in Supabase (Table Editor → contracts)

### Drag and drop not working
- Make sure you're clicking and dragging the card itself, not empty space
- Try refreshing the page

## Next Steps

- Deploy to `apps.peakfloorcoating.com` (Vercel/Netlify recommended)
- Set up Stripe for real payment processing
- Add authentication if needed
- Customize contract template as needed

