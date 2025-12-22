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
  const [isEditingLead, setIsEditingLead] = useState(false)
  const [editedLeadData, setEditedLeadData] = useState(null)
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [pipelineStage, setPipelineStage] = useState('')
  const [isSavingStage, setIsSavingStage] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
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
    setEditedLeadData({ ...lead })
    setNotes(lead.notes || '')
    setPipelineStage(lead.pipeline_stage || 'follow_up')
    setIsEditingLead(false)
    fetchMessages(lead.id)
  }

  // Get current pipeline stage for comparison
  const currentPipelineStage = selectedLead?.pipeline_stage || 'follow_up'

  // Handle save pipeline stage
  async function handleSavePipelineStage() {
    if (!selectedLead) return

    setIsSavingStage(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ pipeline_stage: pipelineStage })
        .eq('id', selectedLead.id)

      if (error) throw error

      // Update the selected lead with new stage
      setSelectedLead({ ...selectedLead, pipeline_stage: pipelineStage })
      
      // Refresh the leads list
      await fetchLeads()
      
      console.log('Pipeline stage saved successfully')
    } catch (err) {
      console.error('Error saving pipeline stage:', err)
      alert('Error saving pipeline stage. Please try again.')
    } finally {
      setIsSavingStage(false)
    }
  }

  // Handle save notes
  async function handleSaveNotes() {
    if (!selectedLead) return

    setIsSavingNotes(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ notes: notes.trim() })
        .eq('id', selectedLead.id)

      if (error) throw error

      // Update the selected lead with new notes
      setSelectedLead({ ...selectedLead, notes: notes.trim() })
      
      // Refresh the leads list
      await fetchLeads()
      
      console.log('Notes saved successfully')
    } catch (err) {
      console.error('Error saving notes:', err)
      alert('Error saving notes. Please try again.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  // Handle save lead changes
  async function handleSaveLeadChanges() {
    if (!selectedLead || !editedLeadData) return

    try {
      const { error } = await supabase
        .from('leads')
        .update(editedLeadData)
        .eq('id', selectedLead.id)

      if (error) throw error

      // Update the selected lead with new data
      setSelectedLead({ ...selectedLead, ...editedLeadData })
      setIsEditingLead(false)
      
      // Refresh the leads list
      await fetchLeads()
      
      alert('Lead updated successfully')
    } catch (err) {
      console.error('Error updating lead:', err)
      alert('Error updating lead. Please try again.')
    }
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

      // Send webhook based on message type
      if (newMessage.message_type === 'email') {
        if (!selectedLead.email) {
          console.error('Cannot send email: Lead has no email address')
          alert('Cannot send email: Lead has no email address')
          return
        }

        console.log('Sending email webhook for:', selectedLead.email)
        
        // Convert content to HTML format (preserve line breaks)
        const htmlBody = newMessage.content.trim().replace(/\n/g, '<br />')
        
        try {
          await sendEmailWebhook({
            email: selectedLead.email,
            subject: newMessage.subject.trim(),
            body: htmlBody,
          })

          console.log('Email webhook sent successfully, updating message status')

          // Update message status to 'sent' after webhook is sent
          if (insertedData) {
            const { error: updateError } = await supabase
              .from('message_logs')
              .update({ 
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', insertedData.id)

            if (updateError) {
              console.error('Error updating message status:', updateError)
            }
          }
        } catch (webhookError) {
          console.error('Email webhook failed:', webhookError)
          // Don't throw - message is already saved, just log the error
          alert('Message saved but webhook failed. Check console for details.')
        }
      } else if (newMessage.message_type === 'text') {
        // Text messages are saved to database with status 'pending'
        // Your messaging program will pull from Supabase and send the messages
        console.log('Text message saved to database. Status: pending')
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

  // Filter leads based on active tab
  const filteredLeads = activeFilter === 'all' 
    ? leads 
    : leads.filter(lead => (lead.pipeline_stage || 'follow_up') === activeFilter)

  const pipelineStages = [
    { value: 'all', label: 'All Leads' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'pending_response', label: 'Pending Response' },
    { value: 'estimate_scheduled', label: 'Estimate Scheduled' },
    { value: 'estimate_completed', label: 'Estimate Completed' },
    { value: 'close_won', label: 'Close Won' },
    { value: 'close_lost', label: 'Close Lost' },
    { value: 'not_interested', label: 'Not Interested' },
  ]

  // Count leads per stage
  const getStageCount = (stage) => {
    if (stage === 'all') return leads.length
    return leads.filter(lead => (lead.pipeline_stage || 'follow_up') === stage).length
  }

  return (
    <div className="page-content">
      <h1>Peak Floor Coating - Leads</h1>
      
      {/* Pipeline Stage Tabs */}
      <div className="pipeline-tabs">
        {pipelineStages.map((stage) => (
          <button
            key={stage.value}
            className={`pipeline-tab ${activeFilter === stage.value ? 'active' : ''}`}
            onClick={() => setActiveFilter(stage.value)}
          >
            {stage.label}
            <span className="tab-count">({getStageCount(stage.value)})</span>
          </button>
        ))}
        {activeFilter === 'follow_up' && filteredLeads.length > 0 && (
          <button
            className="btn-primary auto-dialer-btn"
            onClick={() => {
              const firstLead = filteredLeads[0]
              handleLeadClick(firstLead)
            }}
            style={{ marginLeft: 'auto' }}
          >
            Auto Dialer
          </button>
        )}
      </div>

      <p className="lead-count">Showing: {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} | Total: {leads.length}</p>
      
      {filteredLeads.length === 0 ? (
        <p>No leads in this category. Submit a form on the landing page to see leads here.</p>
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
            {filteredLeads.map((lead) => (
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
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  className="btn-icon btn-close-modal" 
                  onClick={() => setSelectedLead(null)}
                  title="Close"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="message-modal-body">
              {/* Pipeline Stage Dropdown */}
              <div className="pipeline-stage-section">
                <label htmlFor="pipeline-stage" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#1a365d' }}>
                  Pipeline Stage
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    id="pipeline-stage"
                    value={pipelineStage}
                    onChange={(e) => setPipelineStage(e.target.value)}
                    className="pipeline-stage-select"
                    disabled={isSavingStage}
                  >
                    <option value="follow_up">Follow Up</option>
                    <option value="pending_response">Pending Response</option>
                    <option value="estimate_scheduled">Estimate Scheduled</option>
                    <option value="estimate_completed">Estimate Completed</option>
                    <option value="close_won">Close Won</option>
                    <option value="close_lost">Close Lost</option>
                    <option value="not_interested">Not Interested</option>
                  </select>
                  {pipelineStage !== currentPipelineStage && (
                    <button 
                      className="btn-primary" 
                      onClick={handleSavePipelineStage}
                      disabled={isSavingStage}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {isSavingStage ? 'Saving...' : 'Save'}
                    </button>
                  )}
                </div>
              </div>

              <div className="lead-info-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gridColumn: '1 / -1' }}>
                  <h3 style={{ margin: 0 }}>Lead Information</h3>
                  {!isEditingLead ? (
                    <button 
                      className="btn-icon btn-edit-lead" 
                      onClick={() => setIsEditingLead(true)}
                      title="Edit Lead"
                    >
                      ✎
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => {
                          setIsEditingLead(false)
                          setEditedLeadData({ ...selectedLead })
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={handleSaveLeadChanges}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
                
                {isEditingLead ? (
                  <>
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={editedLeadData?.first_name || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={editedLeadData?.last_name || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, last_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        value={editedLeadData?.phone || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={editedLeadData?.email || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Street Address</label>
                      <input
                        type="text"
                        value={editedLeadData?.street_address || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, street_address: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={editedLeadData?.city || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, city: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={editedLeadData?.state || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, state: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Zip</label>
                      <input
                        type="text"
                        value={editedLeadData?.zip || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, zip: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Source</label>
                      <input
                        type="text"
                        value={editedLeadData?.source || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, source: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Homeowner</label>
                      <select
                        value={editedLeadData?.homeowner || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, homeowner: e.target.value })}
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Floor Location</label>
                      <input
                        type="text"
                        value={editedLeadData?.floor_location || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, floor_location: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Project Timeline</label>
                      <input
                        type="text"
                        value={editedLeadData?.project_timeline || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, project_timeline: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Main Goal</label>
                      <input
                        type="text"
                        value={editedLeadData?.main_goal || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, main_goal: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Notes</label>
                      <textarea
                        value={editedLeadData?.notes || ''}
                        onChange={(e) => setEditedLeadData({ ...editedLeadData, notes: e.target.value })}
                        rows={4}
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Notes Section */}
              <div className="notes-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>Notes</h3>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={4}
                  className="notes-textarea"
                />
                <button 
                  className="btn-primary" 
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  style={{ marginTop: '0.5rem' }}
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
              <div className="notes-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>Notes</h3>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={4}
                  className="notes-textarea"
                />
                <button 
                  className="btn-primary" 
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  style={{ marginTop: '0.5rem' }}
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </button>
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
                                ? formatDate(message.scheduled_for)
                                : formatDate(message.created_at)}
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

