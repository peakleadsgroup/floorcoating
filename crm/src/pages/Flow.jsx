import { useState, useMemo, useEffect, useRef } from 'react'
import './Flow.css'

export default function Flow() {
  const [steps, setSteps] = useState([])
  const [editingStep, setEditingStep] = useState(null)
  const [showStepTypeDropdown, setShowStepTypeDropdown] = useState(false)
  const [viewingLogsForStep, setViewingLogsForStep] = useState(null)
  const dropdownRef = useRef(null)

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

  function addStep(type) {
    const newStep = {
      id: Date.now(),
      type: type, // 'email' or 'text'
      subject: type === 'email' ? '' : null,
      content: '',
      day: 0, // days after lead is created (0 = same day/immediately)
      time: '9:00 AM', // time of day
      timeType: 'immediately', // 'immediately' or 'specific'
      enabled: true
    }
    const updatedSteps = [...steps, newStep]
    setSteps(sortSteps(updatedSteps))
    setEditingStep(newStep.id)
    setShowStepTypeDropdown(false)
  }

  function sortSteps(stepsToSort) {
    return [...stepsToSort].sort((a, b) => {
      // First sort by day (treat immediately as day 0)
      const dayA = a.timeType === 'immediately' ? 0 : a.day
      const dayB = b.timeType === 'immediately' ? 0 : b.day
      
      if (dayA !== dayB) {
        return dayA - dayB
      }
      
      // If same day, sort by time
      if (a.timeType === 'immediately' && b.timeType === 'immediately') {
        return 0
      }
      if (a.timeType === 'immediately') return -1
      if (b.timeType === 'immediately') return 1
      
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
      const day = step.timeType === 'immediately' ? 0 : step.day
      if (!groups[day]) {
        groups[day] = []
      }
      groups[day].push(step)
    })
    
    return groups
  }, [steps])

  const editingStepObj = editingStep ? steps.find(s => s.id === editingStep) : null

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
    if (step.timeType === 'specific') {
      if (step.day === undefined || step.day === null || step.day < 0) {
        return false
      }
      if (!step.time || step.time.trim() === '') {
        return false
      }
    }
    
    return true
  }

  function handleSave() {
    // Get the latest step data from the steps array
    const currentStep = editingStep ? steps.find(s => s.id === editingStep) : null
    if (currentStep && isStepValid(currentStep)) {
      setEditingStep(null)
    }
  }

  // Check if current step is valid for button state
  const isCurrentStepValid = editingStepObj ? isStepValid(editingStepObj) : false

  function updateStep(stepId, updates) {
    const updatedSteps = steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    )
    setSteps(sortSteps(updatedSteps))
  }

  function deleteStep(stepId) {
    setSteps(steps.filter(step => step.id !== stepId))
    if (editingStep === stepId) {
      setEditingStep(null)
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
                <div className="log-empty">
                  <p>No logs yet. This will show which leads have received this message once database integration is complete.</p>
                  <p className="log-note">Logs will include: lead name, contact info, send status, and timestamp.</p>
                </div>
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
        <div className="modal-overlay" onClick={() => setEditingStep(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingStepObj.id ? 'Edit Step' : 'Add New Step'}</h2>
              <button 
                className="btn-icon btn-close" 
                onClick={() => setEditingStep(null)}
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
                      onChange={(e) => updateStep(editingStepObj.id, { subject: e.target.value })}
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
                    value={editingStepObj.content}
                    onChange={(e) => updateStep(editingStepObj.id, { content: e.target.value })}
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
                          checked={editingStepObj.timeType === 'immediately'}
                          onChange={() => updateStep(editingStepObj.id, { timeType: 'immediately' })}
                        />
                        <span>Immediately</span>
                      </label>
                    </div>
                    <div className="timing-option">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name={`timing-${editingStepObj.id}`}
                          checked={editingStepObj.timeType === 'specific'}
                          onChange={() => updateStep(editingStepObj.id, { timeType: 'specific' })}
                        />
                        <span>Day</span>
                      </label>
                      {editingStepObj.timeType === 'specific' && (
                        <div className="specific-timing">
                          <span className="timing-text">Day</span>
                          <input
                            type="number"
                            value={editingStepObj.day}
                            onChange={(e) => updateStep(editingStepObj.id, { day: parseInt(e.target.value) || 0 })}
                            min="0"
                            className="day-input"
                          />
                          <span className="timing-text">at</span>
                          <input
                            type="text"
                            value={editingStepObj.time}
                            onChange={(e) => updateStep(editingStepObj.id, { time: e.target.value })}
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
                  }}
                >
                  Delete Step
                </button>
              )}
              <div className="modal-footer-right">
                <button 
                  className="btn-secondary" 
                  onClick={() => setEditingStep(null)}
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

      {steps.length === 0 ? (
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
                            onClick={() => setEditingStep(step.id)}
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
                            {step.timeType === 'immediately' 
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

