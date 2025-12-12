import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import KanbanBoard from '../components/KanbanBoard'
import './SalesBoard.css'

const SALES_STAGES = [
  { id: 'new', title: 'New' },
  { id: 'follow_up', title: 'Follow Up' },
  { id: 'appointment_set', title: 'Appointment Set' },
  { id: 'quoted', title: 'Quoted' },
  { id: 'sold', title: 'Sold' },
  { id: 'lost', title: 'Lost' },
  { id: 'not_interested', title: 'Not Interested' },
]

function SalesBoard() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchLeads()
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

        // Add unread count to each lead and sort
        const leadsWithUnread = (leadsData || []).map(lead => ({
          ...lead,
          unreadCount: unreadCounts[lead.id] || 0,
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

  const handleItemMove = async (leadId, newStage) => {
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
          content: `Moved to ${SALES_STAGES.find(s => s.id === newStage)?.title || newStage}`,
        })

      // Update local state
      setLeads(leads.map(lead =>
        lead.id === leadId ? { ...lead, stage: newStage, sales_stage: newStage } : lead
      ))
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
        columns={SALES_STAGES}
        items={leadsWithStage}
        onItemMove={handleItemMove}
        onItemClick={handleItemClick}
      />
    </div>
  )
}

export default SalesBoard

