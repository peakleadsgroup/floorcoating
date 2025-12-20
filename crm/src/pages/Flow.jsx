import { useState, useMemo, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './Flow.css'

export default function Flow() {
  const [steps, setSteps] = useState([])
  const [editingStep, setEditingStep] = useState(null)
  const [editingStepData, setEditingStepData] = useState(null) // Local state for editing
  const [showStepTypeDropdown, setShowStepTypeDropdown] = useState(false)
  const [viewingLogsForStep, setViewingLogsForStep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [messageLogs, setMessageLogs] = useState([])
  const dropdownRef = useRef(null)

  // Load flow steps from database
  useEffect(() => {
    fetchFlowSteps()
  }, [])

  // Load message logs when viewing logs
  useEffect(() => {
    if (viewingLogsForStep) {
      fetchMessageLogs(viewingLogsForStep)
    }
  }, [viewingLogsForStep])

  async function fetchFlowSteps() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('flow_steps')
        .select('*')
        .order('step_order', { ascending: true })

      if (error) throw error
      setSteps(data || [])
    } catch (err) {
      console.error('Error fetching flow steps:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessageLogs(stepId) {
    try {
      const { data, error } = await supabase
        .from('message_logs')
        .select(`
          *,
          leads:lead_id (
            id,
            first_name,
            last_name,
            phone,
            email
          )
        `)
        .eq('flow_step_id', stepId)
        .order('scheduled_for', { ascending: false })

      if (error) throw error
      setMessageLogs(data || [])
    } catch (err) {
      console.error('Error fetching message logs:', err)
      setMessageLogs([])
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStepTypeDropdown(false)
      }
    }

    if (showStepTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showStepTypeDropdown])

  async function addStep(type) {
    const newStep = {
      type: type, // 'email' or 'text'
      subject: type === 'email' ? '' : null,
      content: '',
      day: 0, // days after lead is created (0 = same day/immediately)
      time: '9:00 AM', // time of day
      time_type: 'immediately', // 'immediately' or 'specific'
      enabled: true,
      step_order: steps.length // Will be recalculated on save
    }
    
    // Calculate step_order based on day and time
    const tempSteps = [...steps, newStep]
    const sorted = sortStepsForOrder(tempSteps)
    newStep.step_order = sorted.findIndex(s => s === newStep)
    
    try {
      const { data, error } = await supabase
        .from('flow_steps')
        .insert([{
          type: newStep.type,
          subject: newStep.subject,
          content: newStep.content,
          day: newStep.day,
          time: newStep.time,
          time_type: newStep.time_type,
          enabled: newStep.enabled,
          step_order: newStep.step_order
        }])
        .select()
        .single()

      if (error) throw error
      
      // Refresh steps from database
      await fetchFlowSteps()
      // Set editing with local state copy
      setEditingStep(data.id)
      setEditingStepData({ ...data })
    } catch (err) {
      console.error('Error adding step:', err)
      alert('Failed to add step. Please try again.')
    }
    
    setShowStepTypeDropdown(false)
  }

  function sortStepsForOrder(stepsToSort) {
    return [...stepsToSort].sort((a, b) => {
      const dayA = a.time_type === 'immediately' ? 0 : a.day
      const dayB = b.time_type === 'immediately' ? 0 : b.day
      
      if (dayA !== dayB) {
        return dayA - dayB
      }
      
      if (a.time_type === 'immediately' && b.time_type === 'immediately') {
        return 0
      }
      if (a.time_type === 'immediately') return -1
      if (b.time_type === 'immediately') return 1
      
      const timeA = parseTime(a.time)
      const timeB = parseTime(b.time)
      return timeA - timeB
    })
  }

  function sortSteps(stepsToSort) {
    return [...stepsToSort].sort((a, b) => {
      // First sort by day (treat immediately as day 0)
      const dayA = a.time_type === 'immediately' ? 0 : a.day
      const dayB = b.time_type === 'immediately' ? 0 : b.day
      
      if (dayA !== dayB) {
        return dayA - dayB
      }
      
      // If same day, sort by time
      if (a.time_type === 'immediately' && b.time_type === 'immediately') {
        return 0
      }
      if (a.time_type === 'immediately') return -1
      if (b.time_type === 'immediately') return 1
      
      // Parse time for comparison
      const timeA = parseTime(a.time)
      const timeB = parseTime(b.time)
      return timeA - timeB
    })
  }

  function parseTime(timeStr) {
    const [time, period] = timeStr.split(' ')
    const [hours, minutes] = time.split(':').map(Number)
    let totalMinutes = hours * 60 + minutes
    if (period === 'PM' && hours !== 12) totalMinutes += 12 * 60
    if (period === 'AM' && hours === 12) totalMinutes -= 12 * 60
    return totalMinutes
  }

  const groupedSteps = useMemo(() => {
    const sorted = sortSteps(steps)
    const groups = {}
    
    sorted.forEach(step => {
      const day = step.time_type === 'immediately' ? 0 : step.day
      if (!groups[day]) {
        groups[day] = []
      }
      groups[day].push(step)
    })
    
    return groups
  }, [steps])

  // Use local editing state if available, otherwise fall back to steps array
  const editingStepObj = editingStepData || (editingStep ? steps.find(s => s.id === editingStep) : null)

  // Validate step before saving
  function isStepValid(step) {
    if (!step) return false
    
    // Content is always required
    if (!step.content || step.content.trim() === '') {
      return false
    }
    
    // Subject is required for emails
    if (step.type === 'email' && (!step.subject || step.subject.trim() === '')) {
      return false
    }
    
    // If specific timing, day and time must be set
    if (step.time_type === 'specific') {
      if (step.day === undefined || step.day === null || step.day < 0) {
        return false
      }
      if (!step.time || step.time.trim() === '') {
        return false
      }
    }
    
    return true
  }

  async function handleSave() {
    // Use local editing state
    if (editingStepData && isStepValid(editingStepData)) {
      try {
        // Map frontend field names to database field names
        const dbUpdates = {
          subject: editingStepData.subject,
          content: editingStepData.content,
          day: editingStepData.day,
          time: editingStepData.time,
          time_type: editingStepData.time_type,
          enabled: editingStepData.enabled
        }

        // Update the step in database
        const { error } = await supabase
          .from('flow_steps')
          .update(dbUpdates)
          .eq('id', editingStepData.id)

        if (error) throw error

        // Recalculate step_order based on updated timing
        const { data: allSteps, error: fetchError } = await supabase
          .from('flow_steps')
          .select('*')
          .order('step_order', { ascending: true })

        if (fetchError) throw fetchError

        const sorted = sortStepsForOrder(allSteps)
        
        // Update step_order for all steps if needed
        for (let i = 0; i < sorted.length; i++) {
          await supabase
            .from('flow_steps')
            .update({ step_order: i })
            .eq('id', sorted[i].id)
        }

        await fetchFlowSteps()
        setEditingStep(null)
        setEditingStepData(null)
      } catch (err) {
        console.error('Error saving step:', err)
        alert('Failed to save. Please try again.')
      }
    }
  }

  // Check if current step is valid for button state
  const isCurrentStepValid = editingStepObj ? isStepValid(editingStepObj) : false

  // Update local editing state (no database call)
  function updateEditingStep(updates) {
    if (!editingStepData) return
    
    setEditingStepData(prev => {
      const updated = { ...prev }
      
      // Map frontend field names to database field names
      if (updates.timeType !== undefined) updated.time_type = updates.timeType
      if (updates.subject !== undefined) updated.subject = updates.subject
      if (updates.content !== undefined) updated.content = updates.content
      if (updates.day !== undefined) updated.day = updates.day
      if (updates.time !== undefined) updated.time = updates.time
      if (updates.enabled !== undefined) updated.enabled = updates.enabled
      
      return updated
    })
  }


  async function deleteStep(stepId) {
    if (!confirm('Are you sure you want to delete this step? This cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('flow_steps')
        .delete()
        .eq('id', stepId)

      if (error) throw error

      if (editingStep === stepId) {
        setEditingStep(null)
      }
      if (viewingLogsForStep === stepId) {
        setViewingLogsForStep(null)
      }

      // Refresh steps from database
      await fetchFlowSteps()
    } catch (err) {
      console.error('Error deleting step:', err)
      alert('Failed to delete step. Please try again.')
    }
  }


  return (
    <div className="page-content">
      <div className="flow-header">
        <h1>Communication Flow Builder</h1>
        <p className="flow-description">
          Build automated text and email sequences that leads will receive. Steps execute in order with the specified delays.
        </p>
      </div>

      <div className="flow-actions">
        <div className="add-step-container" ref={dropdownRef}>
          <button 
            className="btn-primary" 
            onClick={() => setShowStepTypeDropdown(!showStepTypeDropdown)}
          >
            + Add Step
          </button>
          {showStepTypeDropdown && (
            <div className="step-type-dropdown">
              <button 
                className="dropdown-item"
                onClick={() => addStep('email')}
              >
                📧 Email
              </button>
              <button 
                className="dropdown-item"
                onClick={() => addStep('text')}
              >
                💬 Text
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for viewing step logs */}
      {viewingLogsForStep && (
        <div className="modal-overlay" onClick={() => setViewingLogsForStep(null)}>
          <div className="modal-content modal-log-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Message Logs</h2>
              <button 
                className="btn-icon btn-close" 
                onClick={() => setViewingLogsForStep(null)}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="log-info">
                <p className="log-step-info">
                  Viewing logs for: <strong>{steps.find(s => s.id === viewingLogsForStep)?.type === 'email' ? '📧 Email' : '💬 Text'}</strong>
                </p>
                {steps.find(s => s.id === viewingLogsForStep)?.type === 'email' && steps.find(s => s.id === viewingLogsForStep)?.subject && (
                  <p className="log-subject">Subject: {steps.find(s => s.id === viewingLogsForStep)?.subject}</p>
                )}
              </div>
              <div className="log-list">
                {messageLogs.length === 0 ? (
                  <div className="log-empty">
                    <p>No messages sent yet for this step.</p>
                  </div>
                ) : (
                  <table className="log-table">
                    <thead>
                      <tr>
                        <th>Lead Name</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Scheduled For</th>
                        <th>Sent At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messageLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            {log.leads ? `${log.leads.first_name} ${log.leads.last_name}` : 'Unknown'}
                          </td>
                          <td>
                            {log.message_type === 'email' 
                              ? (log.leads?.email || 'N/A')
                              : (log.leads?.phone ? formatPhone(log.leads.phone) : 'N/A')
                            }
                          </td>
                          <td>
                            <span className={`status-badge status-${log.status}`}>
                              {log.status}
                            </span>
                          </td>
                          <td>{formatDate(log.scheduled_for)}</td>
                          <td>{log.sent_at ? formatDate(log.sent_at) : 'Not sent'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={() => setViewingLogsForStep(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for editing/adding steps */}
      {editingStepObj && (
        <div className="modal-overlay" onClick={() => {
          setEditingStep(null)
          setEditingStepData(null)
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingStepObj.id ? 'Edit Step' : 'Add New Step'}</h2>
              <button 
                className="btn-icon btn-close" 
                onClick={() => {
                  setEditingStep(null)
                  setEditingStepData(null)
                }}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="step-editor">
                <div className="step-type-indicator">
                  <div className="step-type-badge">
                    {editingStepObj.type === 'email' ? '📧 Email' : '💬 Text'}
                  </div>
                </div>

                {editingStepObj.type === 'email' && (
                  <div className="form-group">
                    <label>Email Subject <span className="required">*</span></label>
                    <input
                      type="text"
                      value={editingStepObj.subject || ''}
                      onChange={(e) => updateEditingStep({ subject: e.target.value })}
                      placeholder="Subject line"
                      className={(!editingStepObj.subject || editingStepObj.subject.trim() === '') ? 'error' : ''}
                    />
                    {(!editingStepObj.subject || editingStepObj.subject.trim() === '') && (
                      <small className="error-text">Subject is required</small>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label>Message Content <span className="required">*</span></label>
                  <textarea
                    value={editingStepObj.content || ''}
                    onChange={(e) => updateEditingStep({ content: e.target.value })}
                    placeholder={editingStepObj.type === 'email' ? 'Email body...' : 'Text message...'}
                    rows={10}
                    className={(!editingStepObj.content || editingStepObj.content.trim() === '') ? 'error' : ''}
                  />
                  {(!editingStepObj.content || editingStepObj.content.trim() === '') && (
                    <small className="error-text">Message content is required</small>
                  )}
                  <small className="form-hint">
                    You can use variables: {'{FIRST NAME}'}, {'{LAST NAME}'}, {'{PHONE NUMBER}'}, {'{EMAIL}'}, {'{FLOOR TYPE}'}, {'{CALENDAR LINK}'}
                  </small>
                </div>

                <div className="form-group">
                  <label>Send Timing</label>
                  <div className="timing-controls">
                    <div className="timing-option">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name={`timing-${editingStepObj.id}`}
                          checked={editingStepObj.time_type === 'immediately'}
                          onChange={() => updateEditingStep({ timeType: 'immediately' })}
                        />
                        <span>Immediately</span>
                      </label>
                    </div>
                    <div className="timing-option">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name={`timing-${editingStepObj.id}`}
                          checked={editingStepObj.time_type === 'specific'}
                          onChange={() => updateEditingStep({ timeType: 'specific' })}
                        />
                        <span>Day</span>
                      </label>
                      {editingStepObj.time_type === 'specific' && (
                        <div className="specific-timing">
                          <span className="timing-text">Day</span>
                          <input
                            type="number"
                            value={editingStepObj.day}
                            onChange={(e) => updateEditingStep({ day: parseInt(e.target.value) || 0 })}
                            min="0"
                            className="day-input"
                          />
                          <span className="timing-text">at</span>
                          <input
                            type="text"
                            value={editingStepObj.time || ''}
                            onChange={(e) => updateEditingStep({ time: e.target.value })}
                            placeholder="9:00 AM"
                            className="time-input"
                          />
                          <span className="timing-hint">after lead is created</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {editingStepObj.id && (
                <button 
                  className="btn-danger btn-footer" 
                  onClick={() => {
                    deleteStep(editingStepObj.id)
                    setEditingStep(null)
                    setEditingStepData(null)
                  }}
                >
                  Delete Step
                </button>
              )}
              <div className="modal-footer-right">
                <button 
                  className="btn-secondary" 
                  onClick={() => {
                    setEditingStep(null)
                    setEditingStepData(null)
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSave}
                  disabled={!isCurrentStepValid}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <p>Loading flow steps...</p>
        </div>
      ) : steps.length === 0 ? (
        <div className="empty-state">
          <p>No steps yet. Click "Add Step" above to add email or text steps to your flow.</p>
        </div>
      ) : (
        <div className="flow-steps">
          {Object.keys(groupedSteps).sort((a, b) => parseInt(a) - parseInt(b)).map(day => {
            const daySteps = groupedSteps[day]
            const dayLabel = day === '0' ? 'Day 0 (Immediately/Same Day)' : `Day ${day}`
            
            return (
              <div key={day} className="day-group">
                <div className="day-header">
                  <h3>{dayLabel}</h3>
                  <span className="day-step-count">{daySteps.length} step{daySteps.length !== 1 ? 's' : ''}</span>
                </div>
                {daySteps.map((step) => {
                  return (
                    <div key={step.id} className="flow-step">
                      <div className="step-header">
                        <div className="step-type-badge">
                          {step.type === 'email' ? '📧 Email' : '💬 Text'}
                        </div>
                        <div className="step-actions">
                          <button 
                            className="btn-icon btn-log" 
                            onClick={() => setViewingLogsForStep(step.id)}
                            title="View Logs"
                          >
                            📋
                          </button>
                          <button 
                            className="btn-icon btn-edit" 
                            onClick={() => {
                              setEditingStep(step.id)
                              setEditingStepData({ ...step })
                            }}
                            title="Edit"
                          >
                            ✎
                          </button>
                        </div>
                      </div>

                      <div className="step-preview">
                        <div className="step-preview-content">
                          {step.type === 'email' && step.subject && (
                            <div className="preview-subject">Subject: {step.subject}</div>
                          )}
                          <div className="preview-text">
                            {step.content || 'No content yet...'}
                          </div>
                        </div>
                        <div className="step-preview-meta">
                          <span>
                            {step.time_type === 'immediately' 
                              ? 'Immediately' 
                              : `Day ${step.day} at ${step.time}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}

