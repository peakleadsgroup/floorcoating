// Cloudflare Worker for generating Twilio Access Tokens
// This generates JWT tokens for Twilio Voice SDK

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

      // Generate JWT token
      const now = Math.floor(Date.now() / 1000)
      
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      }

      const payload = {
        jti: `${apiKeySid}-${now}`,
        iss: apiKeySid,
        sub: accountSid,
        exp: now + 3600, // 1 hour expiration
        grants: {
          identity: 'browser-user',
          voice: {
            outgoing: {
              application_sid: twimlAppSid
            }
          }
        }
      }

      // Base64URL encode for strings
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

      // Base64URL encode for ArrayBuffer/Uint8Array
      const base64urlEncodeBytes = (bytes) => {
        let binary = ''
        const len = bytes.byteLength || bytes.length
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')
      }

      const encodedHeader = base64urlEncode(JSON.stringify(header))
      const encodedPayload = base64urlEncode(JSON.stringify(payload))
      const message = `${encodedHeader}.${encodedPayload}`

      // Sign with HMAC-SHA256
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(apiKeySecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
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

