import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ProjectDetail.css'
import './LeadDetail.css'

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
    project_stage: 'sold',
    installer_id: '',
    installer: '',
    inspection_date: '',
    inspection_time: '',
    inspection_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    install_date: '',
    install_time: '',
    install_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      fetchMessages().then(() => {
        // Mark all unread inbound messages as read when opening the project
        markAllUnreadAsRead()
      })
      fetchActivities()
    }
  }, [lead?.id])
  
  const markAllUnreadAsRead = async () => {
    if (!lead?.id) return
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('lead_id', lead.id)
        .eq('is_read', false)
        .eq('is_outbound', false)

      if (error) throw error
      await fetchMessages() // Refresh messages to show updated read status
    } catch (error) {
      console.error('Error marking all unread messages as read:', error)
    }
  }
  
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
        .order('name', { ascending: true })

      if (error) throw error
      // Filter to only include reps with 'Installer' role
      const installersData = (data || []).filter(rep => {
        const repRoles = rep.roles || (rep.role ? [rep.role] : [])
        const rolesArray = Array.isArray(repRoles) ? repRoles : [repRoles]
        return rolesArray.includes('Installer')
      })
      setInstallers(installersData)
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
        inspection_date: projectData.inspection_date || '',
        inspection_time: projectData.inspection_time || '',
        inspection_timezone: projectData.inspection_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        install_date: projectData.install_date || '',
        install_time: projectData.install_time || '',
        install_timezone: projectData.install_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    } catch (error) {
      console.error('Error fetching project:', error)
      alert('Error loading project')
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this project? It will be hidden from the project board.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          archived: true,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      // Add activity log for the associated lead
      if (lead?.id) {
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: lead.id,
            activity_type: 'project_archived',
            content: 'Project archived',
          })
      }

      alert('Project archived successfully')
      navigate('/projects') // Go back to project board
    } catch (error) {
      console.error('Error archiving project:', error)
      alert('Error archiving project')
    }
  }

  const handleUnarchive = async () => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          archived: false,
          archived_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      // Add activity log for the associated lead
      if (lead?.id) {
        await supabase
          .from('lead_activities')
          .insert({
            lead_id: lead.id,
            activity_type: 'project_unarchived',
            content: 'Project unarchived',
          })
      }

      await fetchProject()
      alert('Project unarchived successfully')
    } catch (error) {
      console.error('Error unarchiving project:', error)
      alert('Error unarchiving project')
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
      // Automatically set stage to "scheduled" if install_date is filled out
      let projectStage = formData.project_stage
      if (formData.install_date && formData.install_date.trim() !== '') {
        projectStage = 'scheduled'
      } else {
        // If no install_date, keep in sold
        if (projectStage === 'scheduled') {
          projectStage = 'sold'
        }
      }

      const updateData = {
        project_stage: projectStage,
        installer_id: formData.installer_id || null,
        inspection_date: formData.inspection_date || null,
        inspection_time: formData.inspection_time || null,
        inspection_timezone: formData.inspection_timezone || null,
        install_date: formData.install_date || null,
        install_time: formData.install_time || null,
        install_timezone: formData.install_timezone || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      await fetchProject()
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Error saving project')
    }
  }

  const saveTimeoutRef = useRef(null)

  const handleAutoSave = (updatedFormData) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for debounced save (1 second delay)
    saveTimeoutRef.current = setTimeout(async () => {
      const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format
      let projectStage = updatedFormData.project_stage

      // Automatically set stage based on dates
      // Priority: install_date > inspection_date > scheduled
      if (updatedFormData.install_date && updatedFormData.install_date !== '') {
        if (updatedFormData.install_date === today) {
          projectStage = 'install_day'
        } else {
          // If install_date is set but not today, move to scheduled
          if (projectStage === 'sold' || projectStage === 'inspection_day') {
            projectStage = 'scheduled'
          }
        }
      } else if (updatedFormData.inspection_date && updatedFormData.inspection_date !== '') {
        if (updatedFormData.inspection_date === today) {
          projectStage = 'inspection_day'
        } else {
          // If inspection_date is set but not today, move to scheduled
          if (projectStage === 'sold') {
            projectStage = 'scheduled'
          }
        }
      } else {
        // If no dates, keep in sold (unless already past sold)
        if (projectStage === 'scheduled' || projectStage === 'inspection_day') {
          projectStage = 'sold'
        }
      }

      const updateData = {
        project_stage: projectStage,
        installer_id: updatedFormData.installer_id || null,
        inspection_date: updatedFormData.inspection_date || null,
        inspection_time: updatedFormData.inspection_time || null,
        inspection_timezone: updatedFormData.inspection_timezone || null,
        install_date: updatedFormData.install_date || null,
        install_time: updatedFormData.install_time || null,
        install_timezone: updatedFormData.install_timezone || null,
        updated_at: new Date().toISOString(),
      }

      try {
        const { error } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', id)

        if (error) {
          console.error('Error auto-saving project:', error)
        } else {
          // Update local state to reflect the stage change if it happened
          if (projectStage !== updatedFormData.project_stage) {
            setFormData({ ...updatedFormData, project_stage: projectStage })
          }
        }
      } catch (error) {
        console.error('Error auto-saving project:', error)
      }
    }, 1000) // 1 second debounce
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
        {project && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {project.archived ? (
              <button className="btn-secondary" onClick={handleUnarchive}>
                Unarchive Project
              </button>
            ) : (
              <button className="btn-secondary" onClick={handleArchive}>
                Archive Project
              </button>
            )}
          </div>
        )}
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
                          {renderMessageContent(message.content)}
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
                onChange={(e) => {
                  const updated = { ...formData, project_stage: e.target.value }
                  setFormData(updated)
                  handleAutoSave(updated)
                }}
              >
                <option value="sold">Sold</option>
                <option value="scheduled">Scheduled</option>
                <option value="inspection_day">Inspection Day</option>
                <option value="install_day">Install Day</option>
                <option value="completed">Completed</option>
                <option value="warranty">Warranty</option>
              </select>
            </div>
            <div className="form-group">
              <label>Installer</label>
              <select
                value={formData.installer_id || ''}
                onChange={(e) => {
                  const updated = { 
                    ...formData, 
                    installer_id: e.target.value,
                    installer: installers.find(i => i.id === e.target.value)?.name || ''
                  }
                  setFormData(updated)
                  handleAutoSave(updated)
                }}
              >
                <option value="">Select an installer</option>
                {installers.map(installer => (
                  <option key={installer.id} value={installer.id}>
                    {installer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row-group">
              <div className="form-group">
                <label>Inspection Date</label>
                <input
                  type="date"
                  value={formData.inspection_date}
                  onChange={(e) => {
                    const updated = { ...formData, inspection_date: e.target.value }
                    setFormData(updated)
                    handleAutoSave(updated)
                  }}
                />
              </div>
              <div className="form-group">
                <label>Inspection Time</label>
                <input
                  type="time"
                  value={formData.inspection_time}
                  onChange={(e) => {
                    const updated = { ...formData, inspection_time: e.target.value }
                    setFormData(updated)
                    handleAutoSave(updated)
                  }}
                />
              </div>
              <div className="form-group">
                <label>Inspection Time Zone</label>
                <select
                  value={formData.inspection_timezone}
                  onChange={(e) => {
                    const updated = { ...formData, inspection_timezone: e.target.value }
                    setFormData(updated)
                    handleAutoSave(updated)
                  }}
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Phoenix">Arizona Time (MST)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                </select>
              </div>
            </div>
            <div className="form-row-group">
              <div className="form-group">
                <label>Install Date</label>
                <input
                  type="date"
                  value={formData.install_date}
                  onChange={(e) => {
                    const updated = { ...formData, install_date: e.target.value }
                    setFormData(updated)
                    handleAutoSave(updated)
                  }}
                />
              </div>
              <div className="form-group">
                <label>Install Time</label>
                <input
                  type="time"
                  value={formData.install_time}
                  onChange={(e) => {
                    const updated = { ...formData, install_time: e.target.value }
                    setFormData(updated)
                    handleAutoSave(updated)
                  }}
                />
              </div>
              <div className="form-group">
                <label>Install Time Zone</label>
                <select
                  value={formData.install_timezone}
                  onChange={(e) => {
                    const updated = { ...formData, install_timezone: e.target.value }
                    setFormData(updated)
                    handleAutoSave(updated)
                  }}
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Phoenix">Arizona Time (MST)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                </select>
              </div>
            </div>
          </div>
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

