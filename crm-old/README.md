# Peak Floor Coating CRM / Job Management MVP

A lightweight internal system for tracking leads, collecting contract signatures and deposits, and managing projects through completion.

## Features

- **Sales Pipeline**: Kanban board to track leads through sales stages
- **Contract Generation**: Create and share public contract links
- **Payment Collection**: Collect 50% deposits via contract signing
- **Project Pipeline**: Automatically created projects after deposit payment
- **Activity Tracking**: Notes and history for each lead
- **No Authentication**: Simple internal use (can be added later)

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Supabase (database only)
- **Styling**: CSS (no framework dependencies)
- **Drag & Drop**: @dnd-kit
- **Payments**: Basic structure (Stripe integration ready)

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Copy your project URL and anon key from Settings > API

### 2. Environment Variables

Create a `.env` file in the `crm` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key (optional for MVP)
```

### 3. Install Dependencies

```bash
cd crm
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to deploy to `apps.peakfloorcoating.com`

## Usage

### Sales Pipeline

1. Navigate to the Sales Board
2. Click "+ New Lead" to create a new lead
3. Fill in customer information
4. Drag leads between stages as they progress
5. Click on a lead card to view/edit details

### Contract Generation

1. Open a lead in "Ready to Sign" stage
2. Enter the total job price
3. Click "Generate Contract Link"
4. Copy the public link and send to customer
5. Mark contract as "Sent" when shared

### Contract Signing (Public)

1. Customer visits the contract link
2. Reviews contract terms
3. Types name to sign
4. Checks agreement checkbox
5. Clicks "Sign & Pay Deposit"
6. Automatically redirected to success page

### Project Pipeline

1. After deposit payment, project is automatically created
2. Navigate to Project Board
3. Drag projects through stages: Scheduled → Prep → Install Day → Completed → Warranty
4. Click project to add installer, install date, and notes

## Database Schema

- **leads**: Customer information and sales stage
- **lead_activities**: Notes and activity history
- **contracts**: Contract details and public access tokens
- **payments**: Payment records (triggers project creation)
- **projects**: Post-sale project tracking

## Payment Integration

The MVP includes a basic payment flow that creates a payment record. For production, integrate with Stripe:

1. Set up Stripe account
2. Install Stripe.js
3. Create payment intent on backend
4. Process payment in ContractSigning component
5. Update payment status after confirmation

## Deployment

### Recommended: Vercel or Netlify

1. Connect your Git repository
2. Set environment variables
3. Deploy to `apps.peakfloorcoating.com`

### Manual Deployment

1. Run `npm run build`
2. Upload `dist` folder contents to your web server
3. Configure server to serve index.html for all routes (SPA routing)

## Future Enhancements (Out of Scope for MVP)

- User authentication/permissions
- Crew scheduling
- Material tracking
- SMS/Email notifications
- Full accounting integration
- Change orders
- Reporting dashboards

## Support

For issues or questions, contact the development team.
