# Agreements and Deposits Setup

This document describes the agreements and deposits flow that has been implemented.

## Overview

The agreements flow allows customers to:
1. View their project information
2. Select a color choice
3. Sign the agreement (with compliance tracking)
4. Proceed to deposit payment via Stripe

## Database Setup

Run the SQL migration file to set up the necessary database tables:

**File:** `crm/migrations/001_add_agreements_schema.sql`

Run this in your Supabase SQL editor. This will:
- Add fields to the `leads` table (square_footage, total_price, color_choice, pipeline_stage)
- Create the `agreements` table for storing signed agreements
- Create the `deposits` table for tracking payments
- Add necessary indexes and triggers

## Routes

- `/agreements?leadId=<UUID>` - Agreement page
- `/agreements/deposit?agreementId=<UUID>&leadId=<UUID>` - Deposit page

## Features

### Agreement Page
- Displays project information (customer info, square footage, total price)
- Color selection with images from landingpage.html
- Signature capture with canvas
- Compliance tracking:
  - Date and time of signature
  - IP address
  - User agent
  - Geolocation (if permitted)

### Deposit Page
- Shows agreement confirmation
- Displays payment information
- Placeholder for Stripe integration

## Stripe Integration (TODO)

The deposit page currently has a placeholder for Stripe integration. To complete the integration:

1. Set up a Stripe account and get your API keys
2. Create a backend endpoint to create Stripe Checkout Sessions
3. Set up webhook handlers to process payment confirmations
4. Update the deposit status in the database when payment is confirmed

Example backend endpoint structure:
```javascript
POST /api/create-checkout-session
{
  depositId: UUID,
  amount: number (in cents),
  customerEmail: string,
  customerName: string
}
```

## Usage

To send a customer to the agreement page, provide them with a URL like:
```
https://yourdomain.com/agreements?leadId=<lead-uuid>
```

After signing, they will automatically be redirected to the deposit page.

## Compliance

The agreement signature captures the following for legal compliance:
- Signature image (base64 encoded)
- Signer's name
- Timestamp
- IP address
- User agent
- Geolocation (if available and permitted)

All this data is stored in the `agreements` table.

