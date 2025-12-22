import { useState, useEffect, useRef } from 'react'
import { Device } from '@twilio/voice-sdk'
import './Call.css'

export default function Call() {
  const [device, setDevice] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [callStatus, setCallStatus] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [error, setError] = useState('')
  const activeCallRef = useRef(null)

  // Initialize Twilio Device when access token is provided
  useEffect(() => {
    if (!accessToken) return

    const initializeDevice = async () => {
      try {
        setError('')
        setCallStatus('Initializing device...')

        const newDevice = new Device(accessToken, {
          logLevel: 1, // 0 = silent, 1 = error, 2 = warn, 3 = info, 4 = debug
        })

        // Set up event listeners
        newDevice.on('registered', () => {
          console.log('Device registered successfully')
          setIsRegistered(true)
          setCallStatus('Ready to make calls')
        })

        newDevice.on('error', (error) => {
          console.error('Device error:', error)
          setError(`Device error: ${error.message}`)
          setCallStatus('')
          setIsRegistered(false)
        })

        newDevice.on('incoming', (call) => {
          console.log('Incoming call:', call)
          setCallStatus('Incoming call...')
          // Auto-answer for simplicity (you can add UI to accept/reject)
          call.accept()
          activeCallRef.current = call
          setIsCalling(true)
        })

        // Register the device
        await newDevice.register()
        setDevice(newDevice)
      } catch (err) {
        console.error('Error initializing device:', err)
        setError(`Failed to initialize device: ${err.message}`)
        setCallStatus('')
      }
    }

    initializeDevice()

    // Cleanup on unmount
    return () => {
      if (device) {
        device.destroy()
      }
    }
  }, [accessToken])

  // Fetch access token from backend
  const fetchAccessToken = async () => {
    try {
      setError('')
      setCallStatus('Fetching access token...')

      // Use environment variable or default to relative path
      const tokenUrl = import.meta.env.VITE_TWILIO_TOKEN_URL || '/api/twilio/token'
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.token) {
        setAccessToken(data.token)
      } else {
        throw new Error('No token in response')
      }
    } catch (err) {
      console.error('Error fetching access token:', err)
      setError(`Failed to get access token: ${err.message}. Please check your backend endpoint.`)
      setCallStatus('')
    }
  }

  // Make a call
  const makeCall = async () => {
    if (!device || !isRegistered) {
      setError('Device not ready. Please get access token first.')
      return
    }

    if (!phoneNumber.trim()) {
      setError('Please enter a phone number')
      return
    }

    try {
      setError('')
      setCallStatus('Connecting...')
      setIsCalling(true)

      // Format phone number (ensure it starts with +)
      let formattedNumber = phoneNumber.trim()
      if (!formattedNumber.startsWith('+')) {
        // If no country code, assume US (+1)
        formattedNumber = formattedNumber.replace(/\D/g, '')
        if (formattedNumber.length === 10) {
          formattedNumber = `+1${formattedNumber}`
        } else {
          formattedNumber = `+${formattedNumber}`
        }
      }

      // Make the call
      const call = await device.connect({
        params: {
          To: formattedNumber,
        },
      })

      activeCallRef.current = call

      // Set up call event listeners
      call.on('accept', () => {
        console.log('Call accepted')
        setCallStatus('Call connected')
      })

      call.on('disconnect', () => {
        console.log('Call disconnected')
        setCallStatus('Call ended')
        setIsCalling(false)
        activeCallRef.current = null
      })

      call.on('cancel', () => {
        console.log('Call cancelled')
        setCallStatus('Call cancelled')
        setIsCalling(false)
        activeCallRef.current = null
      })

      call.on('error', (error) => {
        console.error('Call error:', error)
        setError(`Call error: ${error.message}`)
        setCallStatus('Call failed')
        setIsCalling(false)
        activeCallRef.current = null
      })
    } catch (err) {
      console.error('Error making call:', err)
      setError(`Failed to make call: ${err.message}`)
      setCallStatus('')
      setIsCalling(false)
    }
  }

  // Hang up call
  const hangUp = () => {
    if (activeCallRef.current) {
      activeCallRef.current.disconnect()
      activeCallRef.current = null
      setIsCalling(false)
      setCallStatus('Call ended')
    }
  }

  return (
    <div className="page-content">
      <h1>Twilio Voice Call</h1>
      
      <div className="call-container">
        {/* Access Token Section */}
        <div className="call-section">
          <h2>Step 1: Get Access Token</h2>
          <p className="section-description">
            You need a Twilio access token to make calls. Click the button below to fetch one from your backend.
          </p>
          <button 
            className="btn-primary" 
            onClick={fetchAccessToken}
            disabled={!!accessToken && isRegistered}
          >
            {accessToken && isRegistered ? '✓ Token Loaded' : 'Get Access Token'}
          </button>
          {accessToken && (
            <p className="status-text">
              Status: {isRegistered ? '✓ Registered and Ready' : 'Registering...'}
            </p>
          )}
        </div>

        {/* Call Section */}
        <div className="call-section">
          <h2>Step 2: Make a Call</h2>
          <div className="call-input-group">
            <label htmlFor="phone-number">Phone Number:</label>
            <input
              id="phone-number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890 or 1234567890"
              disabled={!isRegistered || isCalling}
              className="phone-input"
            />
            <div className="call-buttons">
              <button
                className="btn-primary btn-call"
                onClick={makeCall}
                disabled={!isRegistered || isCalling || !phoneNumber.trim()}
              >
                {isCalling ? 'Calling...' : '📞 Make Call'}
              </button>
              {isCalling && (
                <button
                  className="btn-danger btn-hangup"
                  onClick={hangUp}
                >
                  🚫 Hang Up
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Section */}
        {(callStatus || error) && (
          <div className="call-section">
            <h2>Status</h2>
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}
            {callStatus && !error && (
              <div className="status-message">
                {callStatus}
              </div>
            )}
          </div>
        )}

        {/* Instructions Section */}
        <div className="call-section instructions">
          <h2>Setup Instructions</h2>
          <div className="instructions-content">
            <p><strong>To use this app, you need to:</strong></p>
            <ol>
              <li>Set up a backend endpoint at <code>/api/twilio/token</code> that generates Twilio access tokens</li>
              <li>Configure your TwiML App in the Twilio Console</li>
              <li>Set the Voice URL in your TwiML App to point to your backend endpoint that returns TwiML</li>
            </ol>
            <p><strong>Backend Endpoint Example (Node.js/Express):</strong></p>
            <pre className="code-block">
{`app.post('/api/twilio/token', (req, res) => {
  const AccessToken = require('twilio').jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { identity: 'user' }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID
  });

  token.addGrant(voiceGrant);
  res.json({ token: token.toJwt() });
});`}
            </pre>
            <p><strong>TwiML Endpoint Example:</strong></p>
            <pre className="code-block">
{`app.post('/api/twilio/voice', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const dial = twiml.dial({ callerId: process.env.TWILIO_PHONE_NUMBER });
  dial.number(req.body.To);
  res.type('text/xml');
  res.send(twiml.toString());
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

