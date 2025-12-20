// Webhook utilities for sending notifications to Make.com

const EMAIL_WEBHOOK_URL = 'https://hook.us2.make.com/nb1oe4o6wv3pzt8k2ly568hc2a4d3rkq'

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

