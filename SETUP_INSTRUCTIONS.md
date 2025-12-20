# Setup Instructions

## 1. Set Up the Database (if not already done)

Since you already have a Supabase project, you just need to add the `leads` table:

1. In your Supabase project, go to the **SQL Editor**
2. Open the file `supabase-schema.sql` from this project
3. Copy and paste the entire SQL into the SQL Editor
4. Click "Run" to execute the SQL
5. You should see "Success. No rows returned"

**Note:** If you already have a `leads` table, you may need to modify the SQL or skip this step.

## 2. Configure the CRM App (Uses Your Existing Credentials)

The new CRM uses the same environment variable names as your old CRM, so you can:

**Option A: Copy your existing .env file**
```bash
cp crm-old/.env crm/.env
```

**Option B: Create a new .env file in the crm folder**
1. Copy your Supabase credentials from `crm-old/.env` (or get them from Supabase dashboard)
2. Create `crm/.env` with:
   ```
   VITE_SUPABASE_URL=your-existing-url
   VITE_SUPABASE_ANON_KEY=your-existing-key
   ```

3. Install dependencies (if not already done):
   ```bash
   cd crm
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The CRM should now be running at `http://localhost:5173` (or the port Vite assigns)

## 3. Configure the Landing Page

1. Open `supabase-config.js` in the root directory
2. Update with your Supabase credentials (same ones from your `.env` file):
   ```javascript
   const SUPABASE_CONFIG = {
     url: 'https://your-project.supabase.co',
     anonKey: 'your-anon-key-here'
   };
   ```

The landing page will automatically load these values from `supabase-config.js`.

## 4. Test It Out

1. Open your `landingpage.html` in a browser (make sure `supabase-config.js` is in the same directory)
2. Fill out the form and submit
3. Check your CRM app - you should see the new lead appear in the list!

## 5. Deploy the CRM (Optional)

For `crm.peakfloorcoating.com`, you'll need to:
1. Build the app: `npm run build` (in the `crm` folder)
2. Deploy the `dist` folder to your hosting service
3. Make sure to set the environment variables in your hosting platform

## Troubleshooting

### Leads not showing up?
- Check browser console for errors
- Verify your Supabase credentials are correct
- Check Supabase dashboard → Table Editor → `leads` table to see if data is being saved

### "Missing Supabase environment variables" error?
- Make sure you created the `.env` file in the `crm` folder (or copied from `crm-old`)
- Make sure the file is named exactly `.env` (not `.env.txt`)
- Restart your dev server after creating/editing `.env`
- Verify the values match your existing Supabase project

### RLS (Row Level Security) errors?
- The SQL schema includes policies for anonymous inserts (for development)
- For production, you should use Edge Functions instead of direct inserts from the landing page

### Landing page not saving to Supabase?
- Make sure `supabase-config.js` is in the same directory as `landingpage.html`
- Verify the values in `supabase-config.js` match your Supabase project
- Check browser console for any errors

