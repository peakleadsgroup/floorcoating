import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Testing.css'

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

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    if (selectedLead) {
      fetchRecentMessages()
    }
  }, [selectedLead])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, phone, email, sales_stage')
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
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    } finally {
      setSending(false)
    }
  }

  const handleSelectLead = (lead) => {
    setSelectedLead(lead)
    setMessageContent('')
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
                    {message.content || '(No content)'}
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

