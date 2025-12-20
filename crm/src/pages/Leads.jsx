import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { sendEmailWebhook } from '../lib/webhooks'
import './Leads.css'

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
              onClick={(e) => e.stopPropagation()}
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

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLead, setSelectedLead] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState({
    message_type: 'text',
    subject: '',
    content: '',
  })
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    fetchLeads()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          fetchLeads()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchLeads() {
    try {
      setLoading(true)
      console.log('Fetching leads from Supabase...')
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Supabase response:', { data, error })
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Leads fetched:', data?.length || 0, 'leads')
      setLeads(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching leads:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  function formatPhone(phone) {
    if (!phone) return 'N/A'
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    return phone
  }

  // Fetch messages for selected lead
  async function fetchMessages(leadId) {
    try {
      const { data, error } = await supabase
        .from('message_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true }) // Oldest first, newest at bottom

      if (error) throw error
      setMessages(data || [])
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      }, 100)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setMessages([])
    }
  }

  // Handle lead click
  function handleLeadClick(lead) {
    setSelectedLead(lead)
    fetchMessages(lead.id)
  }

  // Handle send message
  async function handleSendMessage(e) {
    e.preventDefault()
    
    if (!newMessage.content.trim()) {
      alert('Please enter a message')
      return
    }

    if (newMessage.message_type === 'email' && !newMessage.subject.trim()) {
      alert('Please enter an email subject')
      return
    }

    try {
      const messageData = {
        lead_id: selectedLead.id,
        flow_step_id: null, // Manual message, not from flow
        message_type: newMessage.message_type,
        subject: newMessage.message_type === 'email' ? newMessage.subject : null,
        content: newMessage.content.trim(),
        status: 'pending', // Will be sent by the sending system
        scheduled_for: new Date().toISOString(), // Send immediately
      }

      const { data: insertedData, error } = await supabase
        .from('message_logs')
        .insert([messageData])
        .select()
        .single()

      if (error) throw error

      // If it's an email, send webhook to Make.com
      if (newMessage.message_type === 'email' && selectedLead.email) {
        // Convert content to HTML format (preserve line breaks)
        const htmlBody = newMessage.content.trim().replace(/\n/g, '<br />')
        
        await sendEmailWebhook({
          email: selectedLead.email,
          subject: newMessage.subject.trim(),
          body: htmlBody,
        })

        // Update message status to 'sent' after webhook is sent
        if (insertedData) {
          await supabase
            .from('message_logs')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', insertedData.id)
        }
      }

      setNewMessage({ message_type: 'text', subject: '', content: '' })
      await fetchMessages(selectedLead.id)
      
      // Scroll to bottom after sending
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      }, 100)
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Error sending message')
    }
  }

  function getMessageClass(message) {
    // All messages in message_logs are outbound (sent by us)
    // Inbound messages would come from a different source (future feature)
    // For now, all messages are outbound
    const baseClass = 'outbound'
    
    // Add status classes for styling
    if (message.status === 'pending') {
      return `${baseClass} pending`
    }
    if (message.status === 'failed') {
      return `${baseClass} failed`
    }
    
    return baseClass
  }

  if (loading && leads.length === 0) {
    return (
      <div className="page-content">
        <h1>Peak Floor Coating - Leads</h1>
        <p>Loading leads...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-content">
        <h1>Peak Floor Coating - Leads</h1>
        <div className="error">
          <p>Error loading leads: {error}</p>
          <button onClick={fetchLeads}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <h1>Peak Floor Coating - Leads</h1>
      <p className="lead-count">Total Leads: {leads.length}</p>
      
      {leads.length === 0 ? (
        <p>No leads yet. Submit a form on the landing page to see leads here.</p>
      ) : (
        <table className="leads-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Source</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} onClick={() => handleLeadClick(lead)}>
                <td>{lead.first_name} {lead.last_name}</td>
                <td>{formatPhone(lead.phone)}</td>
                <td>{lead.email || 'N/A'}</td>
                <td>
                  {lead.street_address ? (
                    <>
                      {lead.street_address}<br />
                      {lead.city}, {lead.state} {lead.zip}
                    </>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{lead.source || 'landing_page'}</td>
                <td>{formatDate(lead.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Message Modal */}
      {selectedLead && (
        <div className="message-modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="message-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="message-modal-header">
              <h2>Messages - {selectedLead.first_name} {selectedLead.last_name}</h2>
              <button 
                className="btn-close-modal" 
                onClick={() => setSelectedLead(null)}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="message-modal-body">
              <div className="lead-info-header">
                <p><strong>Name:</strong> {selectedLead.first_name} {selectedLead.last_name}</p>
                <p><strong>Phone:</strong> {formatPhone(selectedLead.phone)}</p>
                <p><strong>Email:</strong> {selectedLead.email || 'N/A'}</p>
                {selectedLead.street_address && (
                  <p><strong>Address:</strong> {selectedLead.street_address}, {selectedLead.city}, {selectedLead.state} {selectedLead.zip}</p>
                )}
                <p><strong>Source:</strong> {selectedLead.source || 'N/A'}</p>
                <p><strong>Created:</strong> {formatDate(selectedLead.created_at)}</p>
                {selectedLead.homeowner && (
                  <p><strong>Homeowner:</strong> {selectedLead.homeowner}</p>
                )}
                {selectedLead.floor_location && (
                  <p><strong>Floor Location:</strong> {selectedLead.floor_location}</p>
                )}
                {selectedLead.project_timeline && (
                  <p><strong>Project Timeline:</strong> {selectedLead.project_timeline}</p>
                )}
                {selectedLead.main_goal && (
                  <p><strong>Main Goal:</strong> {selectedLead.main_goal}</p>
                )}
              </div>

              {/* Messages List */}
              <div className="messages-list-container" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                  <p className="no-messages">No messages yet</p>
                ) : (
                  <div className="messages-list">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message-bubble ${getMessageClass(message)}`}
                      >
                        <div className="message-bubble-header">
                          <span className="message-type-badge">
                            {message.message_type === 'email' ? '📧 Email' : '💬 Text'}
                          </span>
                          <span className="message-time">
                            {message.sent_at 
                              ? formatDate(message.sent_at)
                              : message.scheduled_for 
                                ? `Scheduled: ${formatDate(message.scheduled_for)}`
                                : formatDate(message.created_at)}
                            {message.status === 'pending' && ' (Pending)'}
                            {message.status === 'failed' && ' (Failed)'}
                          </span>
                        </div>
                        {message.subject && (
                          <div className="message-subject">Subject: {message.subject}</div>
                        )}
                        <div className="message-bubble-content">
                          {renderMessageContent(message.content)}
                        </div>
                        {message.error_message && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#dc2626' }}>
                            Error: {message.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Message Form */}
              <form onSubmit={handleSendMessage} className="new-message-form">
                {newMessage.message_type === 'email' && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                      placeholder="Email subject..."
                      className="message-subject-input"
                      required
                    />
                  </div>
                )}
                <div className="message-form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <textarea
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                      placeholder="Type your message..."
                      rows="2"
                      className="message-content-input"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <select
                      value={newMessage.message_type}
                      onChange={(e) => setNewMessage({ ...newMessage, message_type: e.target.value, subject: e.target.value === 'email' ? newMessage.subject : '' })}
                      className="message-type-select"
                      style={{ width: '100%' }}
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                    </select>
                    <button type="submit" className="btn-primary send-message-btn">
                      Send
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

