// Supabase Edge Function for Twilio browser-based calling
// Generates access tokens and handles TwiML for outbound calls

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_API_KEY_SID = Deno.env.get('TWILIO_API_KEY_SID')
const TWILIO_API_KEY_SECRET = Deno.env.get('TWILIO_API_KEY_SECRET')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')
const TWILIO_TWIML_APP_SID = Deno.env.get('TWILIO_TWIML_APP_SID') // TwiML App SID for outbound calls

// Helper function to generate Twilio access token using djwt library
async function generateAccessToken(): Promise<string> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
    throw new Error('Twilio API Key credentials not configured')
  }

  if (!TWILIO_TWIML_APP_SID) {
    throw new Error('TWILIO_TWIML_APP_SID not configured')
  }

  try {
    // Use djwt library for proper JWT generation
    const { create, getNumericDate } = await import('https://deno.land/x/djwt@v3.0.2/mod.ts')
    
    const now = getNumericDate(new Date())
    const exp = getNumericDate(new Date(Date.now() + 3600 * 1000)) // 1 hour
    
    const payload = {
      jti: `${TWILIO_API_KEY_SID}-${now}`,
      iss: TWILIO_API_KEY_SID,
      sub: TWILIO_ACCOUNT_SID,
      exp: exp,
      grants: {
        identity: 'browser-user',
        voice: {
          outgoing: {
            application_sid: TWILIO_TWIML_APP_SID,
          }
        }
      }
    }

    // Create the signing key
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(TWILIO_API_KEY_SECRET!),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Generate the JWT token
    const token = await create(
      { alg: 'HS256', typ: 'JWT' },
      payload,
      key
    )

    console.log('Generated token using djwt library')
    return token
  } catch (error) {
    console.error('Error generating token with djwt, falling back to manual method:', error)
    // Fallback to manual method if library fails
    throw new Error(`Failed to generate token: ${error.message}`)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const url = new URL(req.url)
  const pathname = url.pathname

  // Handle TwiML request (GET /twiml?To=...)
  if (req.method === 'GET' && pathname.includes('/twiml')) {
    const toNumber = url.searchParams.get('To')
    
    if (!toNumber) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Error: No number provided</Say></Response>',
        {
          headers: { 
            'Content-Type': 'text/xml',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    console.log('Generating TwiML to dial:', toNumber)

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${TWILIO_PHONE_NUMBER || '+19196290303'}">
    <Number>${toNumber}</Number>
  </Dial>
</Response>`

    return new Response(twiml, {
      headers: {
        'Content-Type': 'text/xml',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  // Handle token generation request (GET /token or POST with { action: 'token' })
  const isGetTokenRequest = req.method === 'GET' && (pathname.includes('/token') || url.searchParams.has('token'))
  
  if (isGetTokenRequest) {
    try {
      const token = await generateAccessToken()
      console.log('Generated access token for browser calling')
      return new Response(
        JSON.stringify({ token }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    } catch (error) {
      console.error('Error generating token:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to generate token' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  }

  // Handle POST requests
  if (req.method === 'POST') {
    try {
      let requestBody
      try {
        requestBody = await req.json()
      } catch (e) {
        console.error('Error parsing request body:', e)
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }
      
      const { phone_number, lead_id, action } = requestBody || {}
      
      console.log('POST request received:', { action, hasPhoneNumber: !!phone_number, hasLeadId: !!lead_id })
      
      // Handle token request via POST
      if (action === 'token') {
        try {
          const token = await generateAccessToken()
          console.log('Generated access token for browser calling (POST)')
          return new Response(
            JSON.stringify({ token }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          )
        } catch (error) {
          console.error('Error generating token:', error)
          return new Response(
            JSON.stringify({ error: error.message || 'Failed to generate token' }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          )
        }
      }
      
      // Handle call initiation request
      console.log('Received call request:', { phone_number, lead_id })

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

      // Format phone number to E.164 format
      const formatPhone = (phone: string) => {
        let formatted = phone.replace(/\D/g, '')
        if (formatted.length === 10) {
          formatted = `+1${formatted}`
        } else if (!formatted.startsWith('+')) {
          formatted = `+${formatted}`
        }
        return formatted
      }
      
      const formattedPhone = formatPhone(phone_number)
      console.log('Formatted phone:', { original: phone_number, formatted: formattedPhone })

      // Create TwiML URL for the outbound call
      const baseUrl = req.url.split('/functions/v1/twilio-call')[0]
      const twimlUrl = `${baseUrl}/functions/v1/twilio-call/twiml?To=${encodeURIComponent(formattedPhone)}`
      
      return new Response(
        JSON.stringify({ 
          success: true,
          twimlUrl: twimlUrl,
          phoneNumber: formattedPhone,
          callerId: TWILIO_PHONE_NUMBER
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
        JSON.stringify({ error: error.message || 'Internal server error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  }

  // Handle unknown methods
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
})
