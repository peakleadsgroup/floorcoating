import { useState, useMemo, useEffect, useRef } from 'react'
import './Flow.css'

export default function Flow() {
  const [steps, setSteps] = useState([])
  const [editingStep, setEditingStep] = useState(null)
  const [showStepTypeDropdown, setShowStepTypeDropdown] = useState(false)
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
    // If editing, show editing step at top, then sorted rest
    const sorted = sortSteps(steps)
    const groups = {}
    const editingStepObj = editingStep ? steps.find(s => s.id === editingStep) : null
    
    // If editing, separate the editing step
    const stepsToGroup = editingStepObj 
      ? sorted.filter(s => s.id !== editingStep) 
      : sorted
    
    stepsToGroup.forEach(step => {
      const day = step.timeType === 'immediately' ? 0 : step.day
      if (!groups[day]) {
        groups[day] = []
      }
      groups[day].push(step)
    })
    
    return { groups, editingStep: editingStepObj }
  }, [steps, editingStep])

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

      {/* Show editing step at top if editing */}
      {groupedSteps.editingStep && (
        <div className="flow-steps editing-step-top">
          <div className="flow-step editing">
            <div className="step-header">
              <div className="step-type-badge">
                {groupedSteps.editingStep.type === 'email' ? '📧 Email' : '💬 Text'}
              </div>
              <div className="step-actions">
                <button 
                  className="btn-icon btn-danger" 
                  onClick={() => {
                    deleteStep(groupedSteps.editingStep.id)
                    setEditingStep(null)
                  }}
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="step-editor">
              {groupedSteps.editingStep.type === 'email' && (
                <div className="form-group">
                  <label>Email Subject</label>
                  <input
                    type="text"
                    value={groupedSteps.editingStep.subject || ''}
                    onChange={(e) => updateStep(groupedSteps.editingStep.id, { subject: e.target.value })}
                    placeholder="Subject line"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Message Content</label>
                <textarea
                  value={groupedSteps.editingStep.content}
                  onChange={(e) => updateStep(groupedSteps.editingStep.id, { content: e.target.value })}
                  placeholder={groupedSteps.editingStep.type === 'email' ? 'Email body...' : 'Text message...'}
                  rows={8}
                />
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
                        name={`timing-${groupedSteps.editingStep.id}`}
                        checked={groupedSteps.editingStep.timeType === 'immediately'}
                        onChange={() => updateStep(groupedSteps.editingStep.id, { timeType: 'immediately' })}
                      />
                      <span>Immediately</span>
                    </label>
                  </div>
                  <div className="timing-option">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name={`timing-${groupedSteps.editingStep.id}`}
                        checked={groupedSteps.editingStep.timeType === 'specific'}
                        onChange={() => updateStep(groupedSteps.editingStep.id, { timeType: 'specific' })}
                      />
                      <span>Day</span>
                    </label>
                    {groupedSteps.editingStep.timeType === 'specific' && (
                      <div className="specific-timing">
                        <span className="timing-text">Day</span>
                        <input
                          type="number"
                          value={groupedSteps.editingStep.day}
                          onChange={(e) => updateStep(groupedSteps.editingStep.id, { day: parseInt(e.target.value) || 0 })}
                          min="0"
                          className="day-input"
                        />
                        <span className="timing-text">at</span>
                        <input
                          type="text"
                          value={groupedSteps.editingStep.time}
                          onChange={(e) => updateStep(groupedSteps.editingStep.id, { time: e.target.value })}
                          placeholder="9:00 AM"
                          className="time-input"
                        />
                        <span className="timing-hint">after lead is created</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                className="btn-secondary" 
                onClick={() => setEditingStep(null)}
              >
                Done Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {steps.length === 0 && !groupedSteps.editingStep ? (
        <div className="empty-state">
          <p>No steps yet. Click "Add Step" above to add email or text steps to your flow.</p>
        </div>
      ) : steps.length > 0 || groupedSteps.editingStep ? (
        <div className="flow-steps">
          {Object.keys(groupedSteps.groups).sort((a, b) => parseInt(a) - parseInt(b)).map(day => {
            const daySteps = groupedSteps.groups[day]
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
      ) : null}

      {steps.length > 0 && (
        <div className="flow-summary">
          <h3>Flow Summary</h3>
          <p>Total Steps: {steps.length} ({steps.filter(s => s.enabled).length} enabled)</p>
          <p className="summary-note">
            Note: This flow is not yet saved. Database integration will be added next.
          </p>
        </div>
      )}
    </div>
  )
}

