// Cloudflare Worker for generating Twilio Access Tokens
// Uses the EXACT same JWT generation code as the test page that works

export default {
  async fetch(request, env) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    try {
      // Get Twilio credentials from environment variables
      const accountSid = env.TWILIO_ACCOUNT_SID
      const apiKeySid = env.TWILIO_API_KEY_SID
      const apiKeySecret = env.TWILIO_API_KEY_SECRET
      const twimlAppSid = env.TWILIO_TWIML_APP_SID

      if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
        return new Response(
          JSON.stringify({ error: 'Missing Twilio credentials in environment variables' }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        )
      }

      // EXACT copy of base64urlEncode from test page
      const base64urlEncode = (str) => {
        const utf8Bytes = new TextEncoder().encode(str)
        let binary = ''
        for (let i = 0; i < utf8Bytes.length; i++) {
          binary += String.fromCharCode(utf8Bytes[i])
        }
        return btoa(binary)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')
      }

      // EXACT copy of base64urlEncodeBytes from test page
      const base64urlEncodeBytes = (bytes) => {
        const uint8Array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
        let binary = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i])
        }
        return btoa(binary)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')
      }

      // EXACT copy of generateJWT from test page
      const now = Math.floor(Date.now() / 1000)
      
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      }

      const payload = {
        jti: `${apiKeySid}-${now}`,
        iss: apiKeySid,
        sub: accountSid,
        iat: now,
        exp: now + 3600,
        grants: {
          identity: 'browser-user',
          voice: {
            outgoing: {
              application_sid: twimlAppSid
            }
          }
        }
      }

      const encodedHeader = base64urlEncode(JSON.stringify(header))
      const encodedPayload = base64urlEncode(JSON.stringify(payload))
      const message = `${encodedHeader}.${encodedPayload}`

      // Sign with HMAC-SHA256 - EXACT same as test page
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(apiKeySecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const messageBytes = new TextEncoder().encode(message)
      const signature = await crypto.subtle.sign('HMAC', key, messageBytes)
      const signatureArray = new Uint8Array(signature)
      const encodedSignature = base64urlEncodeBytes(signatureArray)

      const token = `${encodedHeader}.${encodedPayload}.${encodedSignature}`

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
  },
}
