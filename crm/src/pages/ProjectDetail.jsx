import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ProjectDetail.css'
import './LeadDetail.css'

function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [lead, setLead] = useState(null)
  const [installers, setInstallers] = useState([])
  const [messages, setMessages] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    project_stage: 'scheduled',
    installer_id: '',
    installer: '',
    install_date: '',
    internal_notes: '',
  })
  
  const [newMessage, setNewMessage] = useState({
    message_type: 'Text',
    content: '',
  })
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    fetchProject()
    fetchInstallers()
  }, [id])
  
  useEffect(() => {
    if (lead?.id) {
      fetchMessages()
      fetchActivities()
    }
  }, [lead?.id])
  
  // Poll for new messages every 30 seconds
  useEffect(() => {
    if (lead?.id) {
      const interval = setInterval(() => {
        fetchMessages()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [lead?.id])

  const fetchInstallers = async () => {
    try {
      const { data, error } = await supabase
        .from('reps')
        .select('*')
        .eq('role', 'Installer')
        .order('name', { ascending: true })

      if (error) throw error
      setInstallers(data || [])
    } catch (error) {
      console.error('Error fetching installers:', error)
    }
  }

  const fetchProject = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          leads (*)
        `)
        .eq('id', id)
        .single()

      if (projectError) throw projectError

      setProject(projectData)
      setLead(projectData.leads)
      setFormData({
        project_stage: projectData.project_stage || 'sold',
        installer_id: projectData.installer_id || '',
        installer: projectData.installer || '',
        install_date: projectData.install_date || '',
        internal_notes: projectData.internal_notes || '',
      })
    } catch (error) {
      console.error('Error fetching project:', error)
      alert('Error loading project')
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!lead?.id) return
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', lead.id)
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

  const fetchActivities = async () => {
    if (!lead?.id) return
    
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
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
      const unreadIds = messages.filter(m => !m.is_read && !m.is_outbound).map(m => m.id)
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
    
    if (!newMessage.content.trim() || !lead?.id) {
      alert('Please enter a message')
      return
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          lead_id: lead.id,
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

  const handleAddNote = async () => {
    if (!newNote.trim() || !lead?.id) return

    try {
      const { error } = await supabase
        .from('lead_activities')
        .insert({
          lead_id: lead.id,
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

  const handleSave = async () => {
    try {
      const updateData = {
        project_stage: formData.project_stage,
        installer_id: formData.installer_id || null,
        install_date: formData.install_date || null,
        internal_notes: formData.internal_notes || '',
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      alert('Project updated successfully')
      await fetchProject()
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Error saving project')
    }
  }

  if (loading) {
    return <div className="loading">Loading project...</div>
  }

  if (!project) {
    return <div className="loading">Project not found</div>
  }

  return (
    <div className="project-detail">
      <div className="page-header">
        <button className="btn-secondary" onClick={() => navigate('/projects')}>
          ← Back to Project Board
        </button>
        <h1>Project: {lead 
          ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown'}</h1>
      </div>

      <div className="project-detail-content" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {lead && (
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
            <h2>Customer Information</h2>
            {lead && (
              <div className="customer-info">
                <p><strong>Name:</strong> {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'N/A'}</p>
                <p><strong>Phone:</strong> {lead.phone || 'N/A'}</p>
                <p><strong>Email:</strong> {lead.email || 'N/A'}</p>
                <p><strong>Address:</strong> {
                  [lead.street_address, lead.city, lead.state, lead.zip]
                    .filter(Boolean)
                    .join(', ') || lead.address || 'N/A'
                }</p>
              </div>
            )}
          </div>

          <div className="card">
          <h2>Project Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Project Stage</label>
              <select
                value={formData.project_stage}
                onChange={(e) => setFormData({ ...formData, project_stage: e.target.value })}
              >
                <option value="sold">Sold</option>
                <option value="scheduled">Scheduled</option>
                <option value="prep">Prep</option>
                <option value="install_day">Install Day</option>
                <option value="completed">Completed</option>
                <option value="warranty">Warranty</option>
              </select>
            </div>
            <div className="form-group">
              <label>Installer</label>
              <select
                value={formData.installer_id || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  installer_id: e.target.value,
                  installer: installers.find(i => i.id === e.target.value)?.name || ''
                })}
              >
                <option value="">Select an installer</option>
                {installers.map(installer => (
                  <option key={installer.id} value={installer.id}>
                    {installer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Install Date</label>
              <input
                type="date"
                value={formData.install_date}
                onChange={(e) => setFormData({ ...formData, install_date: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Internal Notes</label>
            <textarea
              rows="8"
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              placeholder="Add internal notes about this project..."
            />
          </div>
          <button className="btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
        </div>

        {lead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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

export default ProjectDetail

