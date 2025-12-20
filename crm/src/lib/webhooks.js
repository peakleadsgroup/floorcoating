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

    // Use no-cors mode to bypass CORS restrictions
    // Note: We won't be able to see the response, but the request will be sent
    const response = await fetch(EMAIL_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    // With no-cors mode, response.status will always be 0 and response.ok will be false
    // But the request is still sent successfully to Make.com
    console.log('Email webhook request sent (no-cors mode - response not accessible)')
    return { success: true, response: 'Sent via no-cors mode' }
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

    // Use no-cors mode to bypass CORS restrictions
    // Note: We won't be able to see the response, but the request will be sent
    const response = await fetch(TEXT_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    // With no-cors mode, response.status will always be 0 and response.ok will be false
    // But the request is still sent successfully to Make.com
    console.log('Text webhook request sent (no-cors mode - response not accessible)')
    return { success: true, response: 'Sent via no-cors mode' }
  } catch (error) {
    console.error('Error sending text webhook:', error)
    throw error // Re-throw so caller can handle it
  }
}

