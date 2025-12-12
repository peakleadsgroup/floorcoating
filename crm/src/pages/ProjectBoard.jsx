import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import KanbanBoard from '../components/KanbanBoard'
import './ProjectBoard.css'

const PROJECT_STAGES = [
  { id: 'sold', title: 'Sold' },
  { id: 'scheduled', title: 'Scheduled' },
  { id: 'prep', title: 'Prep' },
  { id: 'install_day', title: 'Install Day' },
  { id: 'completed', title: 'Completed' },
  { id: 'warranty', title: 'Warranty' },
]

function ProjectBoard() {
  const [projects, setProjects] = useState([])
  const [unreadMessages, setUnreadMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadMessages()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  useEffect(() => {
    // Fetch unread messages when projects are loaded
    if (projects.length > 0) {
      fetchUnreadMessages()
    }
  }, [projects])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          leads (
            id,
            first_name,
            last_name,
            street_address,
            city,
            state,
            zip
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Get lead IDs to fetch unread message counts
      const leadIds = (data || [])
        .filter(p => p.leads?.id)
        .map(p => p.leads.id)

      let unreadCounts = {}
      if (leadIds.length > 0) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('lead_id')
          .in('lead_id', leadIds)
          .eq('is_read', false)
          .eq('is_outbound', false)

        if (!messagesError && messagesData) {
          messagesData.forEach(msg => {
            unreadCounts[msg.lead_id] = (unreadCounts[msg.lead_id] || 0) + 1
          })
        }
      }

      // Flatten the data structure for KanbanBoard
      const flattenedProjects = (data || []).map(project => ({
        ...project,
        name: project.leads 
          ? `${project.leads.first_name || ''} ${project.leads.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown',
        title: project.leads 
          ? `${project.leads.first_name || ''} ${project.leads.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown',
        street_address: project.leads?.street_address || '',
        city: project.leads?.city || '',
        state: project.leads?.state || '',
        zip: project.leads?.zip || '',
        stage: project.project_stage,
        unreadCount: project.leads?.id ? (unreadCounts[project.leads.id] || 0) : 0,
      }))
      
      setProjects(flattenedProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
      alert('Error loading projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadMessages = async () => {
    try {
      // Get all lead IDs from projects
      const projectLeadIds = projects
        .filter(p => p.leads?.id)
        .map(p => p.leads.id)

      if (projectLeadIds.length === 0) {
        setUnreadMessages([])
        return
      }

      // Fetch unread inbound messages for these leads
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          leads (
            id,
            first_name,
            last_name
          )
        `)
        .in('lead_id', projectLeadIds)
        .eq('is_read', false)
        .eq('is_outbound', false)
        .order('created_at', { ascending: false })

      if (messagesError) throw messagesError

      // Format messages
      const formattedMessages = (messagesData || []).map(msg => ({
        ...msg,
        leadName: `${msg.leads.first_name || ''} ${msg.leads.last_name || ''}`.trim() || 'Unknown',
        leadId: msg.leads.id,
      }))

      setUnreadMessages(formattedMessages)
    } catch (error) {
      console.error('Error fetching unread messages:', error)
    }
  }

  const handleMarkMessageAsRead = async (messageId, e) => {
    e.stopPropagation() // Prevent navigation when clicking the button
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', messageId)

      if (error) throw error
      
      // Remove the message from the list
      setUnreadMessages(unreadMessages.filter(msg => msg.id !== messageId))
      
      // Refresh projects to update unread counts
      await fetchProjects()
    } catch (error) {
      console.error('Error marking message as read:', error)
      alert('Error marking message as read')
    }
  }

  const handleItemMove = async (projectId, newStage) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ project_stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', projectId)

      if (error) throw error

      // Update local state
      setProjects(projects.map(project =>
        project.id === projectId ? { ...project, stage: newStage, project_stage: newStage } : project
      ))
      
      // Refresh unread messages
      await fetchUnreadMessages()
    } catch (error) {
      console.error('Error updating project stage:', error)
      alert('Error updating project stage')
      fetchProjects() // Refresh on error
    }
  }

  const handleItemClick = (project) => {
    navigate(`/projects/${project.id}`)
  }

  if (loading) {
    return <div className="loading">Loading projects...</div>
  }

  return (
    <div className="project-board">
      <div className="page-header">
        <h1>Project Pipeline</h1>
      </div>
      <KanbanBoard
        columns={PROJECT_STAGES}
        items={projects}
        onItemMove={handleItemMove}
        onItemClick={handleItemClick}
      />
      
      <div className="unread-messages-window">
        <h2>Unread Messages ({unreadMessages.length})</h2>
        {unreadMessages.length > 0 ? (
          <div className="unread-messages-list">
            {unreadMessages.map((message) => (
              <div 
                key={message.id} 
                className="unread-message-item"
              >
                <div 
                  className="unread-message-content-wrapper" 
                  onClick={() => {
                    // Find the project for this lead
                    const project = projects.find(p => p.leads?.id === message.leadId)
                    if (project) {
                      navigate(`/projects/${project.id}`)
                    }
                  }}
                >
                  <div className="unread-message-lead">{message.leadName}</div>
                  <div className="unread-message-content">
                    <span className="unread-message-type">{message.message_type}:</span> {message.content || '(No content)'}
                  </div>
                  <div className="unread-message-time">
                    {new Date(message.created_at).toLocaleString()}
                  </div>
                </div>
                <button 
                  className="mark-read-button"
                  onClick={(e) => handleMarkMessageAsRead(message.id, e)}
                  title="Mark as read"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-unread-messages">
            <p>No unread messages</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectBoard

