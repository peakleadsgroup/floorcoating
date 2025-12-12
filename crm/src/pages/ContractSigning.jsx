import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ContractSigning.css'

function ContractSigning() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [contract, setContract] = useState(null)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)
  
  const [formData, setFormData] = useState({
    signed_name: '',
    agreed: false,
  })

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

      if (contractData.status === 'signed') {
        alert('This contract has already been signed.')
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

  const handleSignAndPay = async () => {
    if (!formData.signed_name.trim()) {
      alert('Please enter your full name to sign')
      return
    }

    if (!formData.agreed) {
      alert('Please check the agreement checkbox')
      return
    }

    setSigning(true)

    try {
      // Update contract with signature
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          signed_name: formData.signed_name,
          signed_at: new Date().toISOString(),
          status: 'signed',
        })
        .eq('id', contract.id)

      if (contractError) throw contractError

      // Create payment record
      // Note: In production, you'd integrate with Stripe here
      // For MVP, we'll create a payment record and mark it as completed
      // This would normally happen after Stripe payment confirmation
      
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          contract_id: contract.id,
          amount: contract.deposit_amount,
          status: 'completed',
          payment_reference_id: `manual_${Date.now()}`,
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
          // Don't throw - contract is signed and payment is done, so continue
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
      console.error('Error processing signature:', error)
      alert('Error processing signature. Please try again.')
      setSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="contract-signing-page">
        <div className="loading">Loading contract...</div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="contract-signing-page">
        <div className="error">Contract not found</div>
      </div>
    )
  }

  return (
    <div className="contract-signing-page">
      <div className="contract-container">
        <div className="contract-header">
          <h1>Peak Floor Coating</h1>
          <h2>Floor Coating Agreement</h2>
        </div>

        <div className="contract-content">
          <div 
            className="contract-text"
            dangerouslySetInnerHTML={{ __html: contract.contract_content.replace(/\n/g, '<br />') }}
          />
        </div>

        <div className="contract-summary">
          <div className="summary-item">
            <span>Total Project Price:</span>
            <strong>${contract.total_price?.toFixed(2)}</strong>
          </div>
          <div className="summary-item">
            <span>Deposit Required (50%):</span>
            <strong>${contract.deposit_amount?.toFixed(2)}</strong>
          </div>
          <div className="summary-item total">
            <span>Amount Due Today:</span>
            <strong>${contract.deposit_amount?.toFixed(2)}</strong>
          </div>
        </div>

        <div className="signing-section">
          <h3>Sign & Pay Deposit</h3>
          <div className="signing-form">
            <div className="form-group">
              <label>Full Name (Signature) *</label>
              <input
                type="text"
                value={formData.signed_name}
                onChange={(e) => setFormData({ ...formData, signed_name: e.target.value })}
                placeholder="Type your full name to sign"
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.agreed}
                  onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                />
                <span>I agree to the terms and conditions of this contract</span>
              </label>
            </div>
            <button 
              className="btn-sign-pay" 
              onClick={handleSignAndPay}
              disabled={signing}
            >
              {signing ? 'Processing...' : `Sign & Pay $${contract.deposit_amount?.toFixed(2)} Deposit`}
            </button>
            <p className="payment-note">
              Note: For MVP, payment is processed automatically. In production, this would integrate with Stripe for secure payment processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractSigning

