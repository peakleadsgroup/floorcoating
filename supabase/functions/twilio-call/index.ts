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
    
    console.log('Received request:', { phone_number, lead_id })

    if (!phone_number) {
      console.error('Missing phone_number in request')
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

    // Check credentials
    const missingCredentials = []
    if (!TWILIO_ACCOUNT_SID) missingCredentials.push('TWILIO_ACCOUNT_SID')
    if (!TWILIO_AUTH_TOKEN) missingCredentials.push('TWILIO_AUTH_TOKEN')
    if (!TWILIO_PHONE_NUMBER) missingCredentials.push('TWILIO_PHONE_NUMBER')
    
    if (missingCredentials.length > 0) {
      console.error('Missing Twilio credentials:', missingCredentials)
      return new Response(
        JSON.stringify({ 
          error: 'Twilio credentials not configured',
          missing: missingCredentials
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

    // Format phone number to E.164 format (remove all non-digits, add +1 if needed)
    let formattedPhone = phone_number.replace(/\D/g, '')
    if (formattedPhone.length === 10) {
      formattedPhone = `+1${formattedPhone}`
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`
    }
    
    console.log('Formatted phone:', { original: phone_number, formatted: formattedPhone })

    // Make Twilio API call to initiate the call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`
    
    // Make a direct outbound call from your Twilio number to the lead
    // When the call connects, it will say a message and then hang up
    // You can customize the TwiML to route to your phone, add voicemail, etc.
    const twiml = `<Response>
      <Say voice="alice">You have a call from Peak Floor Coating. Please hold while we connect you.</Say>
    </Response>`
    
    const formData = new URLSearchParams()
    formData.append('To', formattedPhone) // Call the lead's number
    formData.append('From', TWILIO_PHONE_NUMBER) // From your Twilio number
    formData.append('Twiml', twiml) // Inline TwiML for call handling

    console.log('Making Twilio API call:', {
      url: twilioUrl,
      to: formattedPhone,
      from: TWILIO_PHONE_NUMBER,
      accountSid: TWILIO_ACCOUNT_SID?.substring(0, 10) + '...' // Log partial for security
    })

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const responseText = await response.text()
    
    if (!response.ok) {
      console.error('Twilio API error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseText,
        to: formattedPhone,
        from: TWILIO_PHONE_NUMBER
      })
      
      // Try to parse error message from Twilio
      let errorMessage = `Twilio API failed: ${response.status}`
      let errorCode = null
      try {
        const errorJson = JSON.parse(responseText)
        errorMessage = errorJson.message || errorMessage
        errorCode = errorJson.code || errorJson.error_code
        console.error('Twilio error details:', errorJson)
        
        // Special handling for concurrency errors
        if (errorCode === 10004 || errorMessage.includes('concurrency')) {
          errorMessage = 'Call concurrency limit exceeded. Please wait a few seconds before trying again.'
        }
      } catch (e) {
        // Not JSON, use raw text
        errorMessage = responseText || errorMessage
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          status: response.status,
          details: responseText
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const callData = JSON.parse(responseText)
    console.log('Twilio call initiated successfully:', {
      callSid: callData.sid,
      status: callData.status,
      to: callData.to,
      from: callData.from
    })

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

