// Supabase Edge Function for Twilio browser-based calling
// Generates access tokens and handles TwiML for outbound calls

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_API_KEY_SID = Deno.env.get('TWILIO_API_KEY_SID')
const TWILIO_API_KEY_SECRET = Deno.env.get('TWILIO_API_KEY_SECRET')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')
const TWILIO_TWIML_APP_SID = Deno.env.get('TWILIO_TWIML_APP_SID') // TwiML App SID for outbound calls

// Helper function to generate Twilio access token
async function generateAccessToken(): Promise<string> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
    throw new Error('Twilio API Key credentials not configured')
  }

  if (!TWILIO_TWIML_APP_SID) {
    throw new Error('TWILIO_TWIML_APP_SID not configured')
  }

  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  
  const payload = {
    jti: `${TWILIO_API_KEY_SID}-${now}`,
    iss: TWILIO_API_KEY_SID,
    sub: TWILIO_ACCOUNT_SID,
    exp: now + 3600,
    grants: {
      identity: 'browser-user',
      voice: {
        outgoing: {
          application_sid: TWILIO_TWIML_APP_SID,
        }
      }
    }
  }

  // Base64URL encoding helper
  const base64urlEncode = (input: string | Uint8Array): string => {
    let base64: string
    if (input instanceof Uint8Array) {
      // Convert Uint8Array to base64
      const binary = Array.from(input, byte => String.fromCharCode(byte)).join('')
      base64 = btoa(binary)
    } else {
      // For strings, encode to base64 directly
      base64 = btoa(input)
    }
    // Convert to base64url (URL-safe base64)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  const headerJson = JSON.stringify(header)
  const payloadJson = JSON.stringify(payload)
  const encodedHeader = base64urlEncode(headerJson)
  const encodedPayload = base64urlEncode(payloadJson)

  // Create the message to sign: base64url(header).base64url(payload)
  const messageToSign = `${encodedHeader}.${encodedPayload}`

  // HMAC-SHA256 signature using the API Key Secret
  // The secret must be UTF-8 encoded
  const keyBytes = new TextEncoder().encode(TWILIO_API_KEY_SECRET!)
  const messageBytes = new TextEncoder().encode(messageToSign)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes)
  const signatureArray = new Uint8Array(signature)
  const encodedSignature = base64urlEncode(signatureArray)
  
  console.log('JWT construction:', {
    headerJson,
    payloadJson: JSON.stringify(payload), // Log the payload structure
    messageToSignLength: messageToSign.length,
    signatureLength: signatureArray.length,
  })

  const token = `${encodedHeader}.${encodedPayload}.${encodedSignature}`
  
  // Log token info for debugging (without exposing the full token)
  console.log('Generated token info:', {
    headerLength: encodedHeader.length,
    payloadLength: encodedPayload.length,
    signatureLength: encodedSignature.length,
    hasAccountSid: !!TWILIO_ACCOUNT_SID,
    hasApiKeySid: !!TWILIO_API_KEY_SID,
    hasTwimlAppSid: !!TWILIO_TWIML_APP_SID,
    payloadStructure: {
      hasJti: !!payload.jti,
      hasIss: !!payload.iss,
      hasSub: !!payload.sub,
      hasExp: !!payload.exp,
      hasGrants: !!payload.grants,
      hasVoiceGrant: !!payload.grants.voice,
    }
  })

  return token
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
