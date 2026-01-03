import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Deposit.css'

export default function Deposit() {
  const [searchParams] = useSearchParams()
  const agreementId = searchParams.get('agreementId')
  const leadId = searchParams.get('leadId')
  
  const [agreement, setAgreement] = useState(null)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!agreementId || !leadId) {
      setError('Missing agreement or lead ID')
      setLoading(false)
      return
    }
    fetchData()
  }, [agreementId, leadId])

  async function fetchData() {
    try {
      // Fetch agreement
      const { data: agreementData, error: agreementError } = await supabase
        .from('agreements')
        .select('*')
        .eq('id', agreementId)
        .single()

      if (agreementError) throw agreementError
      if (!agreementData) throw new Error('Agreement not found')

      setAgreement(agreementData)

      // Fetch lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (leadError) throw leadError
      if (!leadData) throw new Error('Lead not found')

      setLead(leadData)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleStripeCheckout() {
    if (!agreement || !lead) return

    setProcessing(true)

    try {
      // Calculate deposit amount (typically 50% of total, but you can adjust)
      const totalPrice = parseFloat(lead.total_price) || 0
      const depositAmount = Math.round(totalPrice * 0.5 * 100) // Convert to cents

      // Create deposit record
      const { data: deposit, error: depositError } = await supabase
        .from('deposits')
        .insert({
          agreement_id: agreementId,
          lead_id: leadId,
          amount: depositAmount / 100, // Store in dollars
          status: 'pending'
        })
        .select()
        .single()

      if (depositError) throw depositError

      // In a real implementation, you would:
      // 1. Create a Stripe Checkout Session via your backend
      // 2. Redirect to Stripe Checkout
      // 3. Handle the webhook callback to update deposit status
      
      // For now, we'll show a placeholder message
      // You'll need to implement the actual Stripe integration
      
      alert(`Stripe integration needed. Deposit amount: $${(depositAmount / 100).toFixed(2)}`)
      
      // TODO: Replace with actual Stripe Checkout redirect
      // Example:
      // const response = await fetch('/api/create-checkout-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     depositId: deposit.id,
      //     amount: depositAmount,
      //     customerEmail: lead.email,
      //     customerName: `${lead.first_name} ${lead.last_name}`
      //   })
      // })
      // const { sessionId } = await response.json()
      // window.location.href = sessionId

    } catch (err) {
      console.error('Error processing deposit:', err)
      alert('Error processing deposit. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="deposit-page">
        <div className="deposit-container">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !agreement || !lead) {
    return (
      <div className="deposit-page">
        <div className="deposit-container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error || 'Agreement or lead not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  const totalPrice = parseFloat(lead.total_price) || 0
  const depositAmount = totalPrice * 0.5 // 50% deposit

  return (
    <div className="deposit-page">
      <div className="deposit-container">
        <div className="success-badge">
          <span className="checkmark-icon">✓</span>
          <h1>Agreement Signed Successfully!</h1>
        </div>

        <div className="deposit-info-section">
          <h2>Payment Information</h2>
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Customer:</span>
              <span className="info-value">{lead.first_name} {lead.last_name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total Project Cost:</span>
              <span className="info-value">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Deposit Amount (50%):</span>
              <span className="info-value highlight">${depositAmount.toFixed(2)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Remaining Balance:</span>
              <span className="info-value">${(totalPrice - depositAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="payment-section">
          <h2>Secure Payment</h2>
          <p className="payment-description">
            Please complete your deposit payment to secure your project. We use Stripe for secure payment processing.
          </p>
          
          <div className="stripe-placeholder">
            <p><strong>Stripe Integration Required</strong></p>
            <p>To complete the Stripe integration, you'll need to:</p>
            <ol>
              <li>Set up a Stripe account and get your API keys</li>
              <li>Create a backend endpoint to create Stripe Checkout Sessions</li>
              <li>Set up webhook handlers to process payment confirmations</li>
              <li>Update the deposit status in the database when payment is confirmed</li>
            </ol>
            <p>For now, clicking the button below will show a placeholder message.</p>
          </div>

          <button
            className="btn-stripe-checkout"
            onClick={handleStripeCheckout}
            disabled={processing}
          >
            {processing ? 'Processing...' : `Pay Deposit: $${depositAmount.toFixed(2)}`}
          </button>
        </div>

        <div className="agreement-summary">
          <h3>Agreement Summary</h3>
          <div className="summary-content">
            <p><strong>Signed by:</strong> {agreement.signed_name}</p>
            <p><strong>Signed on:</strong> {new Date(agreement.signed_at).toLocaleString()}</p>
            <p><strong>Color Choice:</strong> {lead.color_choice || 'Not selected'}</p>
            <p><strong>Square Footage:</strong> {lead.square_footage || lead.estimated_sqft || 'N/A'} sq ft</p>
          </div>
        </div>
      </div>
    </div>
  )
}

