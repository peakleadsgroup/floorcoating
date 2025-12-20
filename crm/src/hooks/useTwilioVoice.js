import { useState, useEffect, useRef } from 'react'
import { Device } from '@twilio/voice-sdk'
import { supabase } from '../lib/supabase'

export function useTwilioVoice() {
  const [device, setDevice] = useState(null)
  const [call, setCall] = useState(null)
  const [isCalling, setIsCalling] = useState(false)
  const [error, setError] = useState(null)
  const deviceRef = useRef(null)
  const callRef = useRef(null)

  // Initialize Twilio Device
  useEffect(() => {
    let isMounted = true

    const initDevice = async () => {
      try {
        // Get access token from Edge Function
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        const tokenResponse = await fetch(
          `${supabaseUrl}/functions/v1/twilio-call?token=true`,
          {
            headers: {
              'apikey': supabaseAnonKey,
            }
          }
        )
        
        const tokenData = await tokenResponse.json()
        
        if (!tokenData.token) {
          throw new Error(tokenData.error || 'Failed to get token')
        }

        // Initialize Twilio Device
        const newDevice = new Device(tokenData.token, {
          logLevel: 1,
        })

        // Set up event listeners
        newDevice.on('registered', () => {
          console.log('Twilio device registered')
          if (isMounted) {
            setDevice(newDevice)
            setError(null)
          }
        })

        newDevice.on('error', (error) => {
          console.error('Twilio device error:', error)
          if (isMounted) {
            setError(error.message)
          }
        })

        // Register the device
        newDevice.register()
        deviceRef.current = newDevice

        return () => {
          isMounted = false
          if (deviceRef.current) {
            deviceRef.current.destroy()
          }
        }
      } catch (err) {
        console.error('Error initializing Twilio device:', err)
        if (isMounted) {
          setError(err.message)
        }
      }
    }

    initDevice()

    return () => {
      isMounted = false
      if (deviceRef.current) {
        deviceRef.current.destroy()
      }
      if (callRef.current) {
        callRef.current.disconnect()
      }
    }
  }, [])

  const makeCall = async (phoneNumber) => {
    try {
      if (!deviceRef.current) {
        throw new Error('Device not initialized. Please wait a moment and try again.')
      }

      setIsCalling(true)
      setError(null)

      // Get TwiML URL from Edge Function
      const { data, error: apiError } = await supabase.functions.invoke('twilio-call', {
        body: {
          phone_number: phoneNumber,
        },
      })

      if (apiError || !data?.twimlUrl) {
        throw new Error(apiError?.message || 'Failed to get TwiML URL')
      }

      // Format phone number for the call
      const formatPhone = (phone) => {
        let formatted = phone.replace(/\D/g, '')
        if (formatted.length === 10) {
          formatted = `+1${formatted}`
        } else if (!formatted.startsWith('+')) {
          formatted = `+${formatted}`
        }
        return formatted
      }

      const formattedPhone = formatPhone(phoneNumber)

      // Make the call using Device.connect()
      // The SDK will use the TwiML URL for outbound calls
      const outgoingCall = await deviceRef.current.connect({
        params: {
          To: formattedPhone,
        }
      })

      outgoingCall.on('accept', () => {
        console.log('Call accepted')
        if (callRef.current) {
          setIsCalling(false)
          setCall(outgoingCall)
        }
      })

      outgoingCall.on('disconnect', () => {
        console.log('Call disconnected')
        setIsCalling(false)
        setCall(null)
        callRef.current = null
      })

      outgoingCall.on('cancel', () => {
        console.log('Call cancelled')
        setIsCalling(false)
        setCall(null)
        callRef.current = null
      })

      outgoingCall.on('error', (error) => {
        console.error('Call error:', error)
        setError(error.message)
        setIsCalling(false)
        setCall(null)
        callRef.current = null
      })

      callRef.current = outgoingCall
      setCall(outgoingCall)
    } catch (err) {
      console.error('Error making call:', err)
      setError(err.message)
      setIsCalling(false)
    }
  }

  const disconnectCall = () => {
    if (callRef.current) {
      callRef.current.disconnect()
      callRef.current = null
      setCall(null)
      setIsCalling(false)
    }
  }

  return {
    device,
    call,
    isCalling,
    error,
    makeCall,
    disconnectCall,
  }
}
