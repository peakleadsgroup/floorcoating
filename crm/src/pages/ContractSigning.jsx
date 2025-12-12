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

  const handleSign = async () => {
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
      // Update contract with signature only
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          signed_name: formData.signed_name,
          signed_at: new Date().toISOString(),
          status: 'signed',
        })
        .eq('id', contract.id)

      if (contractError) throw contractError

      // Redirect to payment page
      navigate(`/payment/${token}`)
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
              onClick={handleSign}
              disabled={signing}
            >
              {signing ? 'Processing...' : `Sign Contract`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContractSigning

