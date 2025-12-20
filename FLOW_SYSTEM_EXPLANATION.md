# Flow System - Database Integration

## Overview

The flow system automatically sends messages to leads based on configured steps. Each message has a unique ID and we track which leads have received which messages to prevent duplicates.

## Key Features

1. **Unique Message IDs** - Each message log has a unique UUID
2. **Duplicate Prevention** - Database constraint prevents sending the same step to the same lead twice
3. **No Backtracking** - Leads only receive messages scheduled for their current position in time
4. **Automatic Scheduling** - When a new lead is created, all enabled flow steps are automatically scheduled

## Database Tables

### `flow_steps`
Stores the flow configuration:
- `id` - Unique UUID for each step
- `step_order` - Order within the flow (auto-calculated based on day/time)
- `type` - 'email' or 'text'
- `subject` - Email subject (for email type)
- `content` - Message content
- `day` - Days after lead creation (0 = immediately)
- `time` - Time of day (e.g., "9:00 AM")
- `time_type` - 'immediately' or 'specific'
- `enabled` - Whether step is active

### `message_logs`
Tracks which messages were sent:
- `id` - Unique UUID for each message log
- `lead_id` - Reference to the lead
- `flow_step_id` - Reference to the flow step
- `message_type` - 'email' or 'text'
- `subject` - Email subject
- `content` - Message content (snapshot at time of scheduling)
- `status` - 'pending', 'sent', or 'failed'
- `scheduled_for` - When message should be sent
- `sent_at` - When it was actually sent
- `error_message` - Error details if failed

## How It Works

### 1. Lead Creation
When a new lead is created:
- Database trigger `auto_schedule_messages()` fires
- Function `schedule_messages_for_lead()` runs
- All enabled flow steps are scheduled for that lead
- Each message gets a `scheduled_for` timestamp based on:
  - Lead creation time + day offset + time of day
  - Or immediately if `time_type = 'immediately'`

### 2. Preventing Duplicates
- Unique constraint on `(lead_id, flow_step_id)` prevents duplicate messages
- If a step is added later, existing leads won't receive it (they've already passed that point in time)

### 3. No Backtracking
- When scheduling, if `scheduled_for` is in the past, it's set to NOW()
- This ensures leads only get messages going forward
- If you add a step for "Day 1" but a lead was created 3 days ago, they won't get it

### 4. Automatic Sending
You'll need to create an Edge Function or scheduled job that:
- Queries `message_logs` for `status = 'pending'` and `scheduled_for <= NOW()`
- Sends the message via Twilio (text) or email service
- Updates `message_logs` with `status = 'sent'` and `sent_at` timestamp
- Handles errors by updating `status = 'failed'` and `error_message`

## Next Steps

1. **Run the SQL schema** - Execute `flow-database-schema.sql` in Supabase
2. **Test the flow builder** - Create steps in the CRM Flow tab
3. **Create Edge Function** - For actually sending messages (we'll build this next)
4. **Set up scheduled job** - To check for pending messages and send them

## Example Flow

- **Step 1**: Day 0, Immediately - Welcome Email
- **Step 2**: Day 1, 9:00 AM - Follow-up Text
- **Step 3**: Day 2, 2:00 PM - Reminder Email

When a lead is created on Monday at 3:00 PM:
- Step 1 scheduled for: Monday 3:00 PM (immediately)
- Step 2 scheduled for: Tuesday 9:00 AM
- Step 3 scheduled for: Wednesday 2:00 PM

