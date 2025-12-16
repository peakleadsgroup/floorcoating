import { useState, useEffect } from 'react'
import { useNavigateWithRepId } from '../hooks/useNavigateWithRepId'
import { supabase } from '../lib/supabase'
import KanbanBoard from '../components/KanbanBoard'
import './SalesBoard.css'

const ACTIVE_STAGES = [
  { id: 'new', title: 'New' },
  { id: 'follow_up', title: 'Follow Up' },
  { id: 'appointment_set', title: 'Appointment Set' },
  { id: 'quoted', title: 'Quoted' },
  { id: 'not_interested', title: 'Not Interested' },
]

const COMPLETED_STAGES = [
  { id: 'sold', title: 'Sold' },
  { id: 'lost', title: 'Lost' },
]

const ALL_STAGES = [...ACTIVE_STAGES, ...COMPLETED_STAGES]

function SalesBoard() {
  const [leads, setLeads] = useState([])
  const [unreadMessages, setUnreadMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigateWithRepId()

  useEffect(() => {
    fetchLeads()
    fetchUnreadMessages()
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadMessages()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchLeads = async () => {
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError

      // Fetch unread message counts for each lead
      const leadIds = (leadsData || []).map(lead => lead.id)
      if (leadIds.length > 0) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('lead_id')
          .in('lead_id', leadIds)
          .eq('is_read', false)
          .eq('is_outbound', false)

        if (messagesError) throw messagesError

        // Count unread messages per lead
        const unreadCounts = {}
        messagesData?.forEach(msg => {
          unreadCounts[msg.lead_id] = (unreadCounts[msg.lead_id] || 0) + 1
        })

        // Add unread count to each lead and construct full name
        const leadsWithUnread = (leadsData || []).map(lead => ({
          ...lead,
          unreadCount: unreadCounts[lead.id] || 0,
          name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
        }))

        // Sort: leads with unread messages first, then by date created (newest first)
        leadsWithUnread.sort((a, b) => {
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1
          if (a.unreadCount === 0 && b.unreadCount > 0) return 1
          // Both have unread or both don't - sort by date created
          return new Date(b.created_at) - new Date(a.created_at)
        })

        setLeads(leadsWithUnread)
      } else {
        setLeads(leadsData || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      alert('Error loading leads')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadMessages = async () => {
    try {
      // Fetch all unread inbound messages with lead information
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          leads (
            id,
            first_name,
            last_name,
            sales_stage
          )
        `)
        .eq('is_read', false)
        .eq('is_outbound', false)
        .order('created_at', { ascending: false })

      if (messagesError) throw messagesError

      // Filter out messages from "sold" leads and format
      const filteredMessages = (messagesData || [])
        .filter(msg => msg.leads && msg.leads.sales_stage !== 'sold')
        .map(msg => ({
          ...msg,
          leadName: `${msg.leads.first_name || ''} ${msg.leads.last_name || ''}`.trim() || 'Unknown',
          leadId: msg.leads.id,
        }))

      setUnreadMessages(filteredMessages)
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
      
      // Refresh leads to update unread counts
      await fetchLeads()
    } catch (error) {
      console.error('Error marking message as read:', error)
      alert('Error marking message as read')
    }
  }

  const handleItemMove = async (leadId, newStage) => {
    // Show warning if moving to "Lost"
    if (newStage === 'lost') {
      const confirmed = window.confirm(
        'Important! Only move someone to Lost if they rejected a quote or if they have asked us to stop contacting them. Anyone else should go in Not Interested for a slow drip.\n\nDo you want to continue?'
      )
      if (!confirmed) {
        return // Cancel the move
      }
    }

    try {
      const { error } = await supabase
        .from('leads')
        .update({ sales_stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', leadId)

      if (error) throw error

      // Add activity log
      await supabase
        .from('lead_activities')
        .insert({
          lead_id: leadId,
          activity_type: 'stage_change',
          content: `Moved to ${ALL_STAGES.find(s => s.id === newStage)?.title || newStage}`,
        })

      // Update local state
      setLeads(leads.map(lead =>
        lead.id === leadId ? { ...lead, stage: newStage, sales_stage: newStage } : lead
      ))
      
      // Refresh unread messages in case stage changed
      await fetchUnreadMessages()
    } catch (error) {
      console.error('Error updating lead stage:', error)
      alert('Error updating lead stage')
      fetchLeads() // Refresh on error
    }
  }

  const handleItemClick = (lead) => {
    navigate(`/leads/${lead.id}`)
  }

  const handleCreateLead = () => {
    navigate('/leads/new')
  }

  if (loading) {
    return <div className="loading">Loading leads...</div>
  }

  const leadsWithStage = leads.map(lead => ({
    ...lead,
    stage: lead.sales_stage,
    title: lead.name,
    unreadCount: lead.unreadCount || 0, // Preserve unreadCount
  }))

  return (
    <div className="sales-board">
      <div className="page-header">
        <h1>Sales Pipeline</h1>
        <button className="btn-primary" onClick={handleCreateLead}>
          + New Lead
        </button>
      </div>
      <KanbanBoard
        columns={ALL_STAGES}
        items={leadsWithStage}
        onItemMove={handleItemMove}
        onItemClick={handleItemClick}
        separatorAfter={ACTIVE_STAGES.length}
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
                <div className="unread-message-content-wrapper" onClick={() => navigate(`/leads/${message.leadId}`)}>
                  <div className="unread-message-lead">{message.leadName}</div>
                  <div className="unread-message-content">
                    <span className="unread-message-type">{message.message_type}:</span> {renderMessageContent(message.content)}
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

export default SalesBoard

