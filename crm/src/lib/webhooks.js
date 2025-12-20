// Webhook utilities for sending notifications to Make.com

const EMAIL_WEBHOOK_URL = 'https://hook.us2.make.com/nb1oe4o6wv3pzt8k2ly568hc2a4d3rkq'
const TEXT_WEBHOOK_URL = 'https://hook.us2.make.com/pnayg1hdhd7mfw2tqvh4hc2a6xxx5b3w'

/**
 * Format phone number to (XXX) XXX-XXXX format
 * @param {string} phone - Phone number (any format)
 * @returns {string} - Formatted phone number
 */
function formatPhoneForWebhook(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

/**
 * Send email webhook to Make.com
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.body - Email body in HTML format
 * @returns {Promise<void>}
 */
export async function sendEmailWebhook({ email, subject, body }) {
  console.log('sendEmailWebhook called with:', { email, subject, body: body.substring(0, 50) + '...' })
  
  try {
    const payload = {
      email,
      subject,
      body,
    }
    
    console.log('Sending webhook to:', EMAIL_WEBHOOK_URL)
    console.log('Payload:', payload)

    const response = await fetch(EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('Webhook response status:', response.status)
    console.log('Webhook response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Webhook error response:', errorText)
      throw new Error(`Webhook failed: ${response.status} - ${errorText}`)
    }

    const responseData = await response.text()
    console.log('Email webhook sent successfully. Response:', responseData)
    return { success: true, response: responseData }
  } catch (error) {
    console.error('Error sending email webhook:', error)
    throw error // Re-throw so caller can handle it
  }
}

/**
 * Send text message webhook to Make.com
 * @param {Object} params - Text message parameters
 * @param {string} params.phone - Recipient phone number (will be formatted)
 * @param {string} params.message - Text message content
 * @returns {Promise<void>}
 */
export async function sendTextWebhook({ phone, message }) {
  console.log('sendTextWebhook called with:', { phone, message: message.substring(0, 50) + '...' })
  
  try {
    const formattedPhone = formatPhoneForWebhook(phone)
    const payload = {
      phone: formattedPhone,
      message,
    }
    
    console.log('Sending text webhook to:', TEXT_WEBHOOK_URL)
    console.log('Payload:', payload)

    const response = await fetch(TEXT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log('Text webhook response status:', response.status)
    console.log('Text webhook response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Text webhook error response:', errorText)
      throw new Error(`Text webhook failed: ${response.status} - ${errorText}`)
    }

    const responseData = await response.text()
    console.log('Text webhook sent successfully. Response:', responseData)
    return { success: true, response: responseData }
  } catch (error) {
    console.error('Error sending text webhook:', error)
    throw error // Re-throw so caller can handle it
  }
}

