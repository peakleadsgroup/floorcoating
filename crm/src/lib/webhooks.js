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
  try {
    const response = await fetch(EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        subject,
        body,
      }),
    })

    if (!response.ok) {
      console.error('Webhook error:', response.status, response.statusText)
      throw new Error(`Webhook failed: ${response.status}`)
    }

    console.log('Email webhook sent successfully')
  } catch (error) {
    console.error('Error sending email webhook:', error)
    // Don't throw - we don't want webhook failures to break the message sending
  }
}

