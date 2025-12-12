import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './LeadDetail.css'

function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [contract, setContract] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [isNew, setIsNew] = useState(id === 'new')
  
  useEffect(() => {
    if (isNew) {
      setLoading(false)
    }
  }, [isNew])
  
  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    street_address: '',
    city: '',
    state: '',
    zip: '',
    source: '',
    estimated_sqft: '',
    sales_stage: 'new',
    archived: false,
  })
  
  // Contract form state
  const [contractForm, setContractForm] = useState({
    total_price: '',
    contract_content: `FLOOR COATING AGREEMENT

This agreement is entered into between Peak Floor Coating and the customer listed below.

CUSTOMER INFORMATION:
Name: [Customer Name]
Address: [Customer Address]
Phone: [Customer Phone]
Email: [Customer Email]

SCOPE OF WORK:
Peak Floor Coating will provide professional floor coating services including:
- Surface preparation (diamond grinding, crack repair, cleaning)
- Application of premium polyaspartic floor coating system
- Cleanup and final inspection

PROJECT DETAILS:
- Estimated Square Footage: [Square Footage]
- Coating Type: Premium Polyaspartic System
- Color/Finish: [To be determined]

PRICING:
Total Project Price: $[Total Price]
Deposit Required (50%): $[Deposit Amount]
Balance Due: $[Balance Amount]

TERMS:
1. A 50% deposit is required to secure your installation date.
2. Remaining balance is due upon completion of work.
3. Installation will be scheduled within 60 days of deposit receipt.
4. Lifetime warranty applies to materials and workmanship.
5. Customer is responsible for clearing the work area before installation.

WARRANTY:
Peak Floor Coating provides a lifetime warranty covering delamination, peeling, cracking, yellowing, and fading for as long as you own your property.

By signing below, you agree to the terms and conditions of this agreement.

_________________________
Customer Signature

Date: _______________`,
  })
  const [newNote, setNewNote] = useState('')
  const [newMessage, setNewMessage] = useState({
    message_type: 'Text',
    content: '',
  })

  const markAllUnreadAsRead = async () => {
    if (!id || id === 'new') return
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('lead_id', id)
        .eq('is_read', false)
        .eq('is_outbound', false)

      if (error) throw error
      await fetchMessages() // Refresh messages to show updated read status
    } catch (error) {
      console.error('Error marking all unread messages as read:', error)
    }
  }

  useEffect(() => {
    if (!isNew) {
      fetchLead()
      fetchActivities()
      fetchContract()
      fetchMessages().then(() => {
        // Mark all unread inbound messages as read when opening the lead
        markAllUnreadAsRead()
      })
    }
  }, [id])

  // Poll for new messages every 30 seconds
  useEffect(() => {
    if (!isNew) {
      const interval = setInterval(() => {
        fetchMessages()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [id, isNew])

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setLead(data)
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        phone: data.phone || '',
        email: data.email || '',
        street_address: data.street_address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        source: data.source || '',
        estimated_sqft: data.estimated_sqft || '',
        sales_stage: data.sales_stage || 'new',
        archived: data.archived || false,
      })
    } catch (error) {
      console.error('Error fetching lead:', error)
      alert('Error loading lead')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: true }) // Oldest first, newest at bottom

      if (error) throw error
      setMessages(data || [])
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-list-container')
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const markMessageAsRead = async (messageId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', messageId)

      if (error) throw error
      await fetchMessages() // Refresh messages
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = messages.filter(m => !m.is_read).map(m => m.id)
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .in('id', unreadIds)

      if (error) throw error
      await fetchMessages()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.content.trim()) {
      alert('Please enter a message')
      return
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          lead_id: id,
          message_type: newMessage.message_type,
          content: newMessage.content.trim(),
          is_read: true, // Outbound messages are automatically read
          is_outbound: true, // Mark as outbound message
        }])

      if (error) throw error

      setNewMessage({ message_type: 'Text', content: '' })
      await fetchMessages()
      
      // Scroll to bottom after sending
      setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-list-container')
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    }
  }

  const fetchContract = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setContract(data)
      if (data) {
        setContractForm({
          total_price: data.total_price?.toString() || '',
          contract_content: data.contract_content || contractForm.contract_content,
        })
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
    }
  }

  const handleSave = async () => {
    // Show warning if setting stage to "Lost"
    if (formData.sales_stage === 'lost' && (!lead || lead.sales_stage !== 'lost')) {
      const confirmed = window.confirm(
        'Important! Only move someone to Lost if they rejected a quote or if they have asked us to stop contacting them. Anyone else should go in Not Interested for a slow drip.\n\nDo you want to continue?'
      )
      if (!confirmed) {
        return // Cancel the save
      }
    }

    // Validate first name and last name are required
    if (!formData.first_name || !formData.first_name.trim()) {
      alert('First name is required')
      return
    }
    if (!formData.last_name || !formData.last_name.trim()) {
      alert('Last name is required')
      return
    }

    // Validate phone number - must be 10 digits (only numbers)
    const phoneDigits = formData.phone.replace(/\D/g, '') // Remove non-digits
    if (phoneDigits.length !== 10) {
      alert('Phone number must be exactly 10 digits')
      return
    }

    // Validate email - must be a valid email format (contains @ and .something)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRegex.test(formData.email)) {
      alert('Please enter a valid email address (must contain @ and end with .something)')
      return
    }

    // Format phone with digits only for storage
    const formattedData = {
      ...formData,
      phone: phoneDigits,
    }

    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('leads')
          .insert([formattedData])
          .select()
          .single()

        if (error) throw error
        navigate('/') // Go back to sales board
      } else {
        const { error } = await supabase
          .from('leads')
          .update(formattedData)
          .eq('id', id)

        if (error) throw error
        await fetchLead()
        alert('Lead updated successfully')
      }
    } catch (error) {
      console.error('Error saving lead:', error)
      alert('Error saving lead')
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      const { error } = await supabase
        .from('lead_activities')
        .insert({
          lead_id: id,
          activity_type: 'note',
          content: newNote,
        })

      if (error) throw error
      setNewNote('')
      await fetchActivities()
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Error adding note')
    }
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this lead? It will be hidden from the sales board.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          archived: true,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      // Add activity log
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: id,
          activity_type: 'archived',
          content: 'Lead archived',
        })

      alert('Lead archived successfully')
      navigate('/') // Go back to sales board
    } catch (error) {
      console.error('Error archiving lead:', error)
      alert('Error archiving lead')
    }
  }

  const handleUnarchive = async () => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          archived: false,
          archived_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      // Add activity log
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: id,
          activity_type: 'unarchived',
          content: 'Lead unarchived',
        })

      await fetchLead()
      alert('Lead unarchived successfully')
    } catch (error) {
      console.error('Error unarchiving lead:', error)
      alert('Error unarchiving lead')
    }
  }

  const generateContractLink = async () => {
    if (!contractForm.total_price) {
      alert('Please enter a total price')
      return
    }

    const totalPrice = parseFloat(contractForm.total_price)
    const depositAmount = totalPrice * 0.5

    // Build full name and address
    const fullName = `${formData.first_name} ${formData.last_name}`.trim()
    const fullAddress = [
      formData.street_address,
      formData.city,
      formData.state,
      formData.zip
    ].filter(Boolean).join(', ')

    // Replace placeholders in contract content
    let contractContent = contractForm.contract_content
      .replace('[Customer Name]', fullName)
      .replace('[Customer Address]', fullAddress)
      .replace('[Customer Phone]', formData.phone)
      .replace('[Customer Email]', formData.email)
      .replace('[Square Footage]', formData.estimated_sqft || 'TBD')
      .replace('[Total Price]', totalPrice.toFixed(2))
      .replace('[Deposit Amount]', depositAmount.toFixed(2))
      .replace('[Balance Amount]', depositAmount.toFixed(2))

    try {
      // Generate unique token
      const token = crypto.randomUUID()

      const { data, error } = await supabase
        .from('contracts')
        .insert({
          lead_id: id,
          public_token: token,
          contract_content: contractContent,
          total_price: totalPrice,
          deposit_amount: depositAmount,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error

      // Add activity
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: id,
          activity_type: 'contract_generated',
          content: `Contract generated - Total: $${totalPrice.toFixed(2)}, Deposit: $${depositAmount.toFixed(2)}`,
        })

      setContract(data)
      alert('Contract created! Use the link below to share with customer.')
    } catch (error) {
      console.error('Error creating contract:', error)
      alert('Error creating contract')
    }
  }

  const copyContractLink = () => {
    const url = `${window.location.origin}/contract/${contract.public_token}`
    navigator.clipboard.writeText(url)
    alert('Contract link copied to clipboard!')
  }

  const sendContract = async () => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'sent' })
        .eq('id', contract.id)

      if (error) throw error
      await fetchContract()
      alert('Contract marked as sent')
    } catch (error) {
      console.error('Error updating contract:', error)
      alert('Error updating contract')
    }
  }

  if (loading && !isNew) {
    return <div className="loading">Loading lead...</div>
  }

  const depositAmount = contractForm.total_price 
    ? (parseFloat(contractForm.total_price) * 0.5).toFixed(2)
    : '0.00'

  return (
    <div className="lead-detail">
      <div className="page-header">
        <button className="btn-secondary" onClick={() => navigate('/')}>
          ← Back to Sales Board
        </button>
        <h1>{isNew ? 'New Lead' : (lead?.first_name && lead?.last_name ? `${lead.first_name} ${lead.last_name}` : lead?.first_name || lead?.last_name || 'Lead Details')}</h1>
        {!isNew && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {lead?.archived ? (
              <button className="btn-secondary" onClick={handleUnarchive}>
                Unarchive Lead
              </button>
            ) : (
              <button className="btn-secondary" onClick={handleArchive}>
                Archive Lead
              </button>
            )}
          </div>
        )}
      </div>

      <div className="lead-detail-content">
        <div className="lead-detail-main">
          {!isNew && (
            <div className="card messages-card">
              <div className="messages-header">
                <h2>Messages</h2>
                {messages.filter(m => !m.is_read && !m.is_outbound).length > 0 && (
                  <div className="messages-actions">
                    <span className="unread-badge">
                      {messages.filter(m => !m.is_read && !m.is_outbound).length} unread
                    </span>
                    <button className="btn-secondary" onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>

              {/* Messages List */}
              <div className="messages-list-container">
                {messages.length === 0 ? (
                  <p className="no-messages">No messages yet</p>
                ) : (
                  <div className="messages-list">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message-bubble ${message.is_outbound ? 'outbound' : 'inbound'} ${!message.is_read && !message.is_outbound ? 'unread' : ''}`}
                        onClick={() => !message.is_read && !message.is_outbound && markMessageAsRead(message.id)}
                      >
                        <div className="message-bubble-header">
                          <span className="message-type-badge">{message.message_type}</span>
                          <span className="message-time">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                          {!message.is_read && !message.is_outbound && <span className="unread-dot"></span>}
                        </div>
                        <div className="message-bubble-content">
                          {message.content || '(No content)'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Message Form */}
              <form onSubmit={handleSendMessage} className="new-message-form">
                <div className="message-form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <select
                      value={newMessage.message_type}
                      onChange={(e) => setNewMessage({ ...newMessage, message_type: e.target.value })}
                      className="message-type-select"
                    >
                      <option value="Text">Text</option>
                      <option value="Email">Email</option>
                      <option value="Call">Call</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 3 }}>
                    <textarea
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                      placeholder="Type your message..."
                      rows="2"
                      className="message-content-input"
                    />
                  </div>
                  <button type="submit" className="btn-primary send-message-btn">
                    Send
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="card">
            <h2>Contact Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="1234567890"
                  maxLength={10}
                />
                <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Enter 10 digits only
                </small>
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@domain.com"
                />
              </div>
              <div className="form-group">
                <label>Street Address</label>
                <input
                  type="text"
                  value={formData.street_address}
                  onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  maxLength={2}
                  placeholder="CA"
                />
              </div>
              <div className="form-group">
                <label>Zip</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  maxLength={10}
                  placeholder="12345"
                />
              </div>
              <div className="form-group">
                <label>Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                >
                  <option value="">Select a source</option>
                  <option value="Meta">Meta</option>
                  <option value="Google">Google</option>
                  <option value="Referral">Referral</option>
                  <option value="Organic Socials">Organic Socials</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Estimated Sq Ft</label>
                <input
                  type="number"
                  value={formData.estimated_sqft}
                  onChange={(e) => setFormData({ ...formData, estimated_sqft: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Sales Stage</label>
                <select
                  value={formData.sales_stage}
                  onChange={(e) => setFormData({ ...formData, sales_stage: e.target.value })}
                >
                  <option value="new">New</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="appointment_set">Appointment Set</option>
                  <option value="quoted">Quoted</option>
                  <option value="sold">Sold</option>
                  <option value="lost">Lost</option>
                  <option value="not_interested">Not Interested</option>
                </select>
              </div>
            </div>
            <button className="btn-primary" onClick={handleSave}>
              {isNew ? 'Create Lead' : 'Save Changes'}
            </button>
          </div>

          {!isNew && (
            <div className="card">
              <h2>Contract</h2>
              {contract ? (
                <div className="contract-section">
                  <div className="contract-info">
                    <p><strong>Status:</strong> {contract.status}</p>
                    <p><strong>Total Price:</strong> ${contract.total_price?.toFixed(2)}</p>
                    <p><strong>Deposit (50%):</strong> ${contract.deposit_amount?.toFixed(2)}</p>
                    {contract.signed_name && (
                      <p><strong>Signed by:</strong> {contract.signed_name} on {new Date(contract.signed_at).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="contract-actions">
                    <button className="btn-primary" onClick={copyContractLink}>
                      Copy Contract Link
                    </button>
                    {contract.status === 'draft' && (
                      <button className="btn-secondary" onClick={sendContract}>
                        Mark as Sent
                      </button>
                    )}
                  </div>
                  <div className="contract-link">
                    <label>Public Contract URL:</label>
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/contract/${contract.public_token}`}
                    />
                  </div>
                </div>
              ) : (
                <div className="contract-form">
                  <div className="form-group">
                    <label>Total Job Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={contractForm.total_price}
                      onChange={(e) => setContractForm({ ...contractForm, total_price: e.target.value })}
                      placeholder="5000.00"
                    />
                  </div>
                  <div className="deposit-preview">
                    <strong>50% Deposit: ${depositAmount}</strong>
                  </div>
                  <div className="form-group">
                    <label>Contract Content</label>
                    <textarea
                      rows="20"
                      value={contractForm.contract_content}
                      onChange={(e) => setContractForm({ ...contractForm, contract_content: e.target.value })}
                    />
                  </div>
                  <button className="btn-primary" onClick={generateContractLink}>
                    Generate Contract Link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {!isNew && (
          <div className="lead-detail-sidebar">
            <div className="card">
              <h2>Activity History</h2>
              <div className="activity-list">
                {activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-header">
                      <span className="activity-type">
                        {activity.activity_type
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </span>
                      <span className="activity-date">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="activity-content">{activity.content}</div>
                  </div>
                ))}
              </div>
              <div className="add-note">
                <textarea
                  rows="3"
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <button className="btn-primary" onClick={handleAddNote}>
                  Add Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeadDetail

