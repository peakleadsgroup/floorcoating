import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading && leads.length === 0) {
    return (
      <div className="app">
        <div className="container">
          <h1>Peak Floor Coating - Leads</h1>
          <p>Loading leads...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="container">
          <h1>Peak Floor Coating - Leads</h1>
          <div className="error">
            <p>Error loading leads: {error}</p>
            <button onClick={fetchLeads}>Retry</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="container">
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
                <tr key={lead.id}>
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
      </div>
    </div>
  )
}

export default App
