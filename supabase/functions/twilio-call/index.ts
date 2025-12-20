// Supabase Edge Function to make Twilio calls
// This avoids exposing Twilio credentials in the frontend

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER') // Your Twilio number in E.164 format (e.g., +15551234567)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { phone_number, lead_id } = await req.json()

    if (!phone_number) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: phone_number' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Format phone number to E.164 format (remove all non-digits, add +1 if needed)
    let formattedPhone = phone_number.replace(/\D/g, '')
    if (formattedPhone.length === 10) {
      formattedPhone = `+1${formattedPhone}`
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`
    }

    // Make Twilio API call to initiate the call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`
    
    // Use inline TwiML to connect the call
    // This will call the lead's number and connect it to your Twilio number
    // You can customize the TwiML to add greetings, voicemail, etc.
    const twiml = `<Response>
      <Say>Connecting your call now.</Say>
      <Dial callerId="${TWILIO_PHONE_NUMBER}">
        <Number>${formattedPhone}</Number>
      </Dial>
    </Response>`
    
    const formData = new URLSearchParams()
    formData.append('To', TWILIO_PHONE_NUMBER) // Call your Twilio number first
    formData.append('From', TWILIO_PHONE_NUMBER)
    formData.append('Twiml', twiml) // Use inline TwiML

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Twilio API error:', errorText)
      throw new Error(`Twilio API failed: ${response.status} - ${errorText}`)
    }

    const callData = await response.json()
    console.log('Twilio call initiated:', callData)

    // Optionally: Log the call to your database
    // You could create a calls table or add to message_logs

    return new Response(
      JSON.stringify({ 
        success: true, 
        call_sid: callData.sid,
        status: callData.status,
        message: 'Call initiated successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error in twilio-call function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

