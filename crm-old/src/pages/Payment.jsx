import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Payment.css'

function Payment() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [contract, setContract] = useState(null)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchContract()
  }, [token])

  const fetchContract = async () => {
    try {
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          leads (*)
        `)
        .eq('public_token', token)
        .single()

      if (contractError) throw contractError

      // Check if contract is signed
      if (contractData.status !== 'signed') {
        alert('Contract must be signed before payment.')
        navigate(`/contract/${token}`)
        return
      }

      // Check if payment already exists
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('contract_id', contractData.id)
        .eq('status', 'completed')

      if (existingPayments && existingPayments.length > 0) {
        // Payment already completed, redirect to success
        navigate('/success')
        return
      }

      setContract(contractData)
      setLead(contractData.leads)
    } catch (error) {
      console.error('Error fetching contract:', error)
      alert('Contract not found or invalid token')
    } finally {
      setLoading(false)
    }
  }

  const handleMockPayment = async () => {
    setProcessing(true)

    try {
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          contract_id: contract.id,
          amount: contract.deposit_amount,
          status: 'completed',
          payment_reference_id: `mock_${Date.now()}`,
        })

      if (paymentError) throw paymentError

      // Move lead to "Sold" stage
      if (lead?.id) {
        const { error: leadUpdateError } = await supabase
          .from('leads')
          .update({ 
            sales_stage: 'sold',
            updated_at: new Date().toISOString()
          })
          .eq('id', lead.id)

        if (leadUpdateError) {
          console.error('Error updating lead stage:', leadUpdateError)
        } else {
          // Add activity log for stage change
          await supabase
            .from('lead_activities')
            .insert({
              lead_id: lead.id,
              activity_type: 'stage_change',
              content: 'Moved to Sold (contract signed and deposit paid)',
            })
        }
      }

      // Redirect to success page
      navigate('/success')
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Error processing payment. Please try again.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="payment-page">
        <div className="loading">Loading payment information...</div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="payment-page">
        <div className="error">Contract not found</div>
      </div>
    )
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1>Peak Floor Coating</h1>
          <h2>Complete Your Deposit Payment</h2>
        </div>

        <div className="payment-summary">
          <div className="summary-item">
            <span>Total Project Price:</span>
            <strong>${contract.total_price?.toFixed(2)}</strong>
          </div>
          <div className="summary-item">
            <span>Deposit Amount:</span>
            <strong>${contract.deposit_amount?.toFixed(2)}</strong>
          </div>
          <div className="summary-item total">
            <span>Amount Due Today:</span>
            <strong>${contract.deposit_amount?.toFixed(2)}</strong>
          </div>
        </div>

        <div className="payment-section">
          <div className="mock-payment-note">
            <p><strong>Testing Mode</strong></p>
            <p>This is a mock payment page for testing purposes. Click the button below to simulate payment processing.</p>
            <p>In production, this would integrate with Stripe for secure payment processing.</p>
          </div>

          <button 
            className="btn-mock-payment" 
            onClick={handleMockPayment}
            disabled={processing}
          >
            {processing ? 'Processing Payment...' : 'Click This Button to Pretend Pay!'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Payment

