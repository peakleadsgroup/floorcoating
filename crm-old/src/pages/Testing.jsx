import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Testing.css'

// Function to convert URLs to clickable links and render HTML for emails
const renderMessageContent = (content) => {
  if (!content) return '(No content)'
  
  // Check if content contains HTML (like email messages with hyperlinks)
  if (content.includes('<a href=')) {
    // For HTML content (emails), render as HTML
    return <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
  }
  
  // For plain text, convert URLs to clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = content.split(urlRegex)
  
  return (
    <>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <a 
              key={index}
              href={part} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              {part}
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

function Testing() {
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [messageType, setMessageType] = useState('Text')
  const [messageContent, setMessageContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [recentMessages, setRecentMessages] = useState([])
  const [contract, setContract] = useState(null)
  const [processingContract, setProcessingContract] = useState(false)
  const [hasPayment, setHasPayment] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    if (selectedLead) {
      fetchRecentMessages()
      fetchContract()
    }
  }, [selectedLead])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, phone, email, sales_stage')
        .eq('archived', false)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      const leadsData = data || []
      setLeads(leadsData)
      setFilteredLeads(leadsData)
    } catch (error) {
      console.error('Error fetching leads:', error)
      alert('Error loading leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLeads(leads)
      return
    }

    const search = searchTerm.toLowerCase()
    const filtered = leads.filter(lead => {
      const name = `${lead.first_name || ''} ${lead.last_name || ''}`.toLowerCase()
      const phone = (lead.phone || '').toLowerCase()
      const email = (lead.email || '').toLowerCase()
      return name.includes(search) || phone.includes(search) || email.includes(search)
    })
    setFilteredLeads(filtered)
  }, [searchTerm, leads])

  const fetchRecentMessages = async () => {
    if (!selectedLead) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!selectedLead) {
      alert('Please select a lead first')
      return
    }

    if (!messageContent.trim()) {
      alert('Please enter a message')
      return
    }

    setSending(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          lead_id: selectedLead.id,
          message_type: messageType,
          content: messageContent.trim(),
          is_read: false, // Inbound messages start as unread
          is_outbound: false, // This is an inbound message from the lead
        }])

      if (error) throw error

      alert(`Message sent as ${selectedLead.first_name} ${selectedLead.last_name}!`)
      setMessageContent('')
      await fetchRecentMessages()
      // Refresh leads to update stage
      await fetchLeads()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    } finally {
      setSending(false)
    }
  }

  const fetchContract = async () => {
    if (!selectedLead) return

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setContract(data || null)

      // Check if payment exists
      if (data) {
        const { data: payments } = await supabase
          .from('payments')
          .select('*')
          .eq('contract_id', data.id)
          .eq('status', 'completed')
        
        setHasPayment(payments && payments.length > 0)
      } else {
        setHasPayment(false)
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
    }
  }

  const checkAndMoveToSold = async () => {
    // Check if both contract is signed and payment exists
    const { data: updatedContract } = await supabase
      .from('contracts')
      .select('status')
      .eq('id', contract.id)
      .single()

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('contract_id', contract.id)
      .eq('status', 'completed')

    const contractSigned = updatedContract?.status === 'signed'
    const paymentExists = payments && payments.length > 0

    // Move to "Sold" if both conditions are met
    if (contractSigned && paymentExists) {
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({ 
          sales_stage: 'sold',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLead.id)

      if (!leadUpdateError) {
        // Add activity log for stage change
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: selectedLead.id,
            activity_type: 'stage_change',
            content: 'Moved to Sold (contract signed and deposit paid - testing)',
          })
      }
    }
  }

  const handleMarkSigned = async () => {
    if (!selectedLead || !contract) {
      alert('Please select a lead with a contract')
      return
    }

    if (contract.status === 'signed') {
      alert('Contract is already signed')
      return
    }

    const name = `${selectedLead.first_name || ''} ${selectedLead.last_name || ''}`.trim() || 'Unknown'
    if (!confirm(`Mark contract as signed for ${name}?`)) {
      return
    }

    setProcessingContract(true)

    try {
      // Update contract with signature
      const { error: contractError } = await supabase
        .from('contracts')
        .update({
          signed_name: `${selectedLead.first_name} ${selectedLead.last_name}`.trim(),
          signed_at: new Date().toISOString(),
          status: 'signed',
        })
        .eq('id', contract.id)

      if (contractError) throw contractError

      // Refresh contract data
      await fetchContract()
      
      // Check if we should move to Sold (if payment also exists)
      await checkAndMoveToSold()
      await fetchLeads()
      
      alert('Contract marked as signed!')
    } catch (error) {
      console.error('Error marking contract as signed:', error)
      alert('Error marking contract as signed')
    } finally {
      setProcessingContract(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!selectedLead || !contract) {
      alert('Please select a lead with a contract')
      return
    }

    // Check if payment already exists
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('contract_id', contract.id)
      .eq('status', 'completed')

    if (existingPayments && existingPayments.length > 0) {
      alert('Deposit is already marked as paid')
      return
    }

    const name = `${selectedLead.first_name || ''} ${selectedLead.last_name || ''}`.trim() || 'Unknown'
    if (!confirm(`Mark deposit as paid for ${name}?`)) {
      return
    }

    setProcessingContract(true)

    try {
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          contract_id: contract.id,
          amount: contract.deposit_amount,
          status: 'completed',
          payment_reference_id: `test_${Date.now()}`,
        })

      if (paymentError) throw paymentError

      // Refresh contract data
      await fetchContract()
      
      // Check if we should move to Sold (if contract also signed)
      await checkAndMoveToSold()
      await fetchLeads()
      
      alert('Deposit marked as paid!')
    } catch (error) {
      console.error('Error marking deposit as paid:', error)
      alert('Error marking deposit as paid')
    } finally {
      setProcessingContract(false)
    }
  }

  const handleSelectLead = (lead) => {
    setSelectedLead(lead)
    setMessageContent('')
    setContract(null)
  }

  if (loading) {
    return <div className="loading">Loading leads...</div>
  }

  const leadName = selectedLead 
    ? `${selectedLead.first_name || ''} ${selectedLead.last_name || ''}`.trim() || 'Unknown'
    : 'None'

  return (
    <div className="testing-page">
      <div className="page-header">
        <h1>Testing - Send Messages as Lead</h1>
        <div className="testing-warning">
          ⚠️ Testing Mode - Messages will appear as if sent by the selected lead
        </div>
      </div>

      <div className="testing-content">
        <div className="card">
          <h2>Select Lead</h2>
          <div className="leads-selector">
            <input
              type="text"
              placeholder="Search leads by name, phone, or email..."
              className="lead-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="leads-list">
              {filteredLeads.length === 0 ? (
                <div className="no-leads-found">No leads found matching your search</div>
              ) : (
                filteredLeads.map(lead => {
                const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
                const isSelected = selectedLead?.id === lead.id
                return (
                  <div
                    key={lead.id}
                    className={`lead-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectLead(lead)}
                  >
                    <div className="lead-item-name">{fullName}</div>
                    <div className="lead-item-details">
                      {lead.phone && <span>📞 {lead.phone}</span>}
                      {lead.email && <span>✉️ {lead.email}</span>}
                      <span className="lead-item-stage">{lead.sales_stage}</span>
                    </div>
                  </div>
                )
              }))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Send Message</h2>
          {selectedLead ? (
            <>
              <div className="selected-lead-info">
                <strong>Currently sending as:</strong> {leadName}
                <div className="selected-lead-details">
                  {selectedLead.phone && <span>Phone: {selectedLead.phone}</span>}
                  {selectedLead.email && <span>Email: {selectedLead.email}</span>}
                  <span>Stage: {selectedLead.sales_stage}</span>
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="testing-message-form">
                <div className="form-group">
                  <label>Message Type</label>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                  >
                    <option value="Text">Text</option>
                    <option value="Email">Email</option>
                    <option value="Call">Call</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Message Content</label>
                  <textarea
                    rows="4"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Enter the message content..."
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={sending}
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </>
          ) : (
            <p className="no-lead-selected">Please select a lead from the list above</p>
          )}
        </div>

        {selectedLead && contract && (
          <div className="card">
            <h2>Contract Status</h2>
            <div className="contract-testing-info">
              <div className="contract-details">
                <p><strong>Status:</strong> {contract.status}</p>
                <p><strong>Total Price:</strong> ${contract.total_price?.toFixed(2)}</p>
                <p><strong>Deposit:</strong> ${contract.deposit_amount?.toFixed(2)}</p>
                {contract.signed_name && (
                  <p><strong>Signed by:</strong> {contract.signed_name}</p>
                )}
                <p><strong>Deposit Paid:</strong> {hasPayment ? 'Yes' : 'No'}</p>
              </div>
              <div className="contract-testing-buttons">
                {contract.status !== 'signed' && (
                  <button 
                    className="btn-primary"
                    onClick={handleMarkSigned}
                    disabled={processingContract}
                  >
                    {processingContract ? 'Processing...' : 'Mark Service Agreement Signed'}
                  </button>
                )}
                {!hasPayment && (
                  <button 
                    className="btn-primary"
                    onClick={handleMarkPaid}
                    disabled={processingContract}
                  >
                    {processingContract ? 'Processing...' : 'Mark Deposit Paid'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedLead && recentMessages.length > 0 && (
          <div className="card">
            <h2>Recent Messages for {leadName}</h2>
            <div className="recent-messages-list">
              {recentMessages.map((message) => (
                <div key={message.id} className="recent-message-item">
                  <div className="recent-message-header">
                    <span className="recent-message-type">{message.message_type}</span>
                    <span className="recent-message-time">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                    {message.is_outbound ? (
                      <span className="recent-message-direction">Outbound</span>
                    ) : (
                      <span className="recent-message-direction">Inbound</span>
                    )}
                    {!message.is_read && !message.is_outbound && (
                      <span className="recent-message-unread">Unread</span>
                    )}
                  </div>
                  <div className="recent-message-content">
                    {renderMessageContent(message.content)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Testing

