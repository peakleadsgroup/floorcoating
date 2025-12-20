# Troubleshooting Twilio Call Failures

## Quick Diagnosis Steps

### 1. Check Twilio Call Logs (Most Important) ⭐

**This is the best way to see exactly why calls are failing.**

In the Twilio Console, click on the **failed call's Call SID** to see detailed error information:

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Find the failed call in the list
3. Click on the **Call SID** (e.g., `CAa9588a01b1c0f674d37ee970dbf703a8`)
4. Look at the **Status** and **Error Code** fields

**Common Twilio Error Codes (for paid accounts):**
- `10004` - **Call concurrency limit exceeded** ⚠️ (You're making too many calls at once)
- `21211` - Invalid 'To' Phone Number (most common - check phone number format)
- `21212` - Invalid 'From' Phone Number (check TWILIO_PHONE_NUMBER secret)
- `21217` - Invalid URL format (TwiML syntax issue)
- `30003` - Unreachable destination (number doesn't exist or carrier issue)
- `30004` - Message blocked (carrier blocking)
- `30005` - Unknown destination
- `30006` - Landline or unreachable carrier (can't complete call)
- `30007` - Unknown error
- `30008` - Unroutable destination

**Error 10004 - Call Concurrency Limit Exceeded:**
This happens when you try to make more calls than your account allows simultaneously. Solutions:
1. Wait for existing calls to complete before making new ones
2. Check your account's concurrent call limit in Twilio console
3. Add rate limiting to prevent multiple rapid calls
4. Upgrade your Twilio account for higher concurrency limits

**Most Common for Paid Accounts:**
- `10004` - Too many calls at once (wait between calls)
- `21211` - Usually means the phone number format is wrong or invalid
- `30003` - The number might be disconnected or unreachable

### 2. Check Supabase Edge Function Logs

1. Go to: https://supabase.com/dashboard/project/byquxteqnmzqpwjgnyfi/functions
2. Click on **twilio-call** function
3. Go to **Logs** tab
4. Look for error messages and console.log output

The improved logging will show:
- Request details (phone numbers, lead_id)
- Formatted phone number
- Twilio API response
- Specific error messages

### 3. Verify Phone Number Format

Phone numbers must be in **E.164 format** (e.g., `+19196290303`)

The function automatically formats numbers, but verify:
- US numbers should be: `+1XXXXXXXXXX` (11 digits including +1)
- International numbers: `+[country code][number]`
- No spaces, dashes, or parentheses

### 4. Check Twilio Account Status

**For Trial Accounts:**
- You can only call **verified numbers**
- Verify numbers at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Or upgrade to a paid account to call any number

**Check Account Status:**
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/overview
2. Check if your account is in **Trial** or **Active** status
3. Verify you have sufficient credits/funds

### 5. Common Issues and Solutions

#### Issue: Calls Fail with "Unverified Number" Error
**Solution:** 
- If on trial account, verify the number first
- Or upgrade to paid account

#### Issue: Invalid Phone Number Format
**Solution:**
- Check the phone number in your database
- Ensure it's stored correctly (no extra characters)
- The function formats automatically, but bad input can still cause issues

#### Issue: "Account Suspended" or "Insufficient Funds"
**Solution:**
- Check account balance in Twilio dashboard
- Add funds if needed
- Contact Twilio support if suspended

#### Issue: Function Returns Success but Call Still Fails
**Possible Causes:**
- TwiML syntax error
- Phone number doesn't accept calls
- Carrier blocking
- Network issues

**Solution:**
- Check the Call SID details in Twilio
- Review TwiML syntax in the function
- Try calling a verified/test number first

### 6. Test with a Verified Number

To test if your function works correctly:

1. Verify a test phone number in Twilio
2. Use that number as the lead's phone
3. Try the "Start Dialing" function
4. Check both Supabase logs and Twilio logs

### 7. Review Function Code

Check the Edge Function code in:
- `supabase/functions/twilio-call/index.ts`

Key things to verify:
- TwiML syntax is correct (valid XML)
- Phone number formatting logic
- Error handling

### 8. Check Browser Console

If calls fail from the frontend:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages when clicking "Start Dialing"
4. Check Network tab for the function request/response

## Handling Error 10004: Call Concurrency Limit Exceeded

**What it means:**
Your Twilio account has a limit on how many calls can be active at the same time. When you exceed this limit, new calls fail with error 10004.

**Solutions:**

1. **Wait between calls:** Don't click "Start Dialing" multiple times quickly
2. **Check your account limits:**
   - Go to: https://console.twilio.com/us1/account/settings/limits
   - See your concurrent call limit (new accounts often start with 1-2 concurrent calls)
3. **Wait for calls to complete:** Check your active calls in Twilio console before making new ones
4. **Request a limit increase:** Contact Twilio support to increase your concurrency limit
5. **Add rate limiting in code:** Prevent users from making multiple rapid calls (future enhancement)

**How to check active calls:**
- Go to: https://console.twilio.com/us1/monitor/logs/calls
- Filter by Status: "In Progress" or "Ringing"
- Wait until these complete before starting new calls

## Next Steps After Diagnosis

Once you identify the error:

1. **If it's error 10004 (concurrency):** Wait a few seconds between calls, check active calls, or request limit increase
2. **If it's a phone number issue:** Fix the number format or verify it
3. **If it's an account issue:** Upgrade account or add funds
4. **If it's a code issue:** Fix the function code and redeploy
5. **If it's a TwiML issue:** Review and fix the TwiML syntax

## Need More Help?

- Twilio Support: https://support.twilio.com/
- Twilio API Docs: https://www.twilio.com/docs/voice/api/call-resource
- Supabase Edge Functions Docs: https://supabase.com/docs/guides/functions

