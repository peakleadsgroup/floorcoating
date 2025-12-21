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
      // Trim all values to remove any accidental whitespace/newlines
      const accountSid = (env.TWILIO_ACCOUNT_SID || '').trim()
      const apiKeySid = (env.TWILIO_API_KEY_SID || '').trim()
      const apiKeySecret = (env.TWILIO_API_KEY_SECRET || '').trim()
      const twimlAppSid = (env.TWILIO_TWIML_APP_SID || '').trim()

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

      // Verify secret format (for debugging - check if it looks correct)
      if (apiKeySecret.length < 20) {
        console.warn('API Key Secret seems too short:', apiKeySecret.length)
      }
      
      // Log first/last few chars of secret for debugging (without exposing full secret)
      console.log('Secret info:', {
        length: apiKeySecret.length,
        firstChar: apiKeySecret.charAt(0),
        lastChar: apiKeySecret.charAt(apiKeySecret.length - 1),
        hasWhitespace: /\s/.test(apiKeySecret)
      })

      // Generate JWT token
      const now = Math.floor(Date.now() / 1000)
      
      const header = {
        alg: 'HS256',
        typ: 'JWT'
      }

      // Build payload - ensure JSON is compact (no spaces) for consistent encoding
      const payload = {
        jti: `${apiKeySid}-${now}`,
        iss: apiKeySid,
        sub: accountSid,
        iat: now, // Issued at time (required by Twilio)
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
      
      // Use JSON.stringify with no spaces to ensure consistent encoding
      const payloadJson = JSON.stringify(payload)

      // Base64URL encode function (proper implementation)
      // This ensures proper UTF-8 to base64url conversion
      const base64urlEncode = (str) => {
        // Use TextEncoder to get UTF-8 bytes
        const utf8Bytes = new TextEncoder().encode(str)
        
        // Convert Uint8Array to base64 using btoa with proper binary string conversion
        let binaryString = ''
        for (let i = 0; i < utf8Bytes.length; i++) {
          binaryString += String.fromCharCode(utf8Bytes[i])
        }
        
        // Convert to base64
        const base64 = btoa(binaryString)
        
        // Convert to base64url: replace + with -, / with _, and remove padding =
        return base64
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')
      }

      // Base64URL encode for ArrayBuffer/Uint8Array (signature)
      const base64urlEncodeBytes = (bytes) => {
        const uint8Array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
        
        // Convert to binary string
        let binaryString = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i])
        }
        
        // Convert to base64
        const base64 = btoa(binaryString)
        
        // Convert to base64url: replace + with -, / with _, and remove padding =
        return base64
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '')
      }

      // Encode header and payload
      // Use compact JSON (no spaces) for consistent encoding
      const headerJson = JSON.stringify(header)
      const encodedHeader = base64urlEncode(headerJson)
      const encodedPayload = base64urlEncode(payloadJson)
      const message = `${encodedHeader}.${encodedPayload}`

      // Sign with HMAC-SHA256
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(apiKeySecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      // Sign the message
      const messageBytes = new TextEncoder().encode(message)
      const signature = await crypto.subtle.sign('HMAC', key, messageBytes)
      const signatureArray = new Uint8Array(signature)
      const encodedSignature = base64urlEncodeBytes(signatureArray)

      // Construct final JWT token
      const token = `${encodedHeader}.${encodedPayload}.${encodedSignature}`

      // Debug logging (remove in production)
      console.log('Generated JWT token:', {
        headerLength: encodedHeader.length,
        payloadLength: encodedPayload.length,
        signatureLength: encodedSignature.length,
        tokenLength: token.length,
        accountSidPrefix: accountSid.substring(0, 2),
        apiKeySidPrefix: apiKeySid.substring(0, 2),
        twimlAppSidPrefix: twimlAppSid.substring(0, 2),
        apiKeySecretLength: apiKeySecret.length
      })

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
