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
      // Fetch agreement (use maybeSingle since it might not exist)
      const { data: agreementData, error: agreementError } = await supabase
        .from('agreements')
        .select('*')
        .eq('id', agreementId)
        .maybeSingle()

      if (agreementError) {
        // Check if it's the "no rows" error
        if (agreementError.code === 'PGRST116') {
          setError('Agreement not found. It may have been deleted. Please return to the agreement page to sign again.')
        } else {
          throw agreementError
        }
        setLoading(false)
        return
      }

      if (!agreementData) {
        setError('Agreement not found. It may have been deleted. Please return to the agreement page to sign again.')
        setLoading(false)
        return
      }

      setAgreement(agreementData)

      // Fetch lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .maybeSingle()

      if (leadError) {
        if (leadError.code === 'PGRST116') {
          setError('Lead not found.')
        } else {
          throw leadError
        }
        setLoading(false)
        return
      }

      if (!leadData) {
        setError('Lead not found.')
        setLoading(false)
        return
      }

      setLead(leadData)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message || 'An error occurred while loading the deposit page.')
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
        <header className="deposit-header">
          <div className="header-container">
            <a href="/" className="logo-link">
              <img 
                src="https://github.com/peakleadsgroup/floorcoating/blob/main/images/PeakFloorCoating-1000x250-NoBack.png?raw=true" 
                alt="Peak Floor Coating" 
                className="logo"
              />
            </a>
          </div>
        </header>
        <div className="deposit-container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error || 'Agreement or lead not found'}</p>
            {leadId && !agreement && (
              <div style={{ marginTop: '1.5rem' }}>
                <a 
                  href={`/agreements?leadId=${leadId}`}
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    background: '#1a365d',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    marginTop: '1rem'
                  }}
                >
                  Return to Agreement Page
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const totalPrice = parseFloat(lead.total_price) || 0
  const depositAmount = totalPrice * 0.5 // 50% deposit

  return (
    <div className="deposit-page">
      <header className="deposit-header">
        <div className="header-container">
          <a href="/" className="logo-link">
            <img 
              src="https://github.com/peakleadsgroup/floorcoating/blob/main/images/PeakFloorCoating-1000x250-NoBack.png?raw=true" 
              alt="Peak Floor Coating" 
              className="logo"
            />
          </a>
        </div>
      </header>
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

