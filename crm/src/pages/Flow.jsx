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

  function moveStep(stepId, direction) {
    const sorted = sortSteps(steps)
    const index = sorted.findIndex(s => s.id === stepId)
    if (index === -1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sorted.length) return
    
    // Get the step we're moving
    const step = sorted[index]
    const targetStep = sorted[newIndex]
    
    // Swap day/time to maintain chronological order
    if (direction === 'up') {
      // Move earlier - swap with previous step's timing
      const tempDay = step.day
      const tempTime = step.time
      const tempTimeType = step.timeType
      updateStep(stepId, { day: targetStep.day, time: targetStep.time, timeType: targetStep.timeType })
      updateStep(targetStep.id, { day: tempDay, time: tempTime, timeType: tempTimeType })
    } else {
      // Move later - swap with next step's timing
      const tempDay = step.day
      const tempTime = step.time
      const tempTimeType = step.timeType
      updateStep(stepId, { day: targetStep.day, time: targetStep.time, timeType: targetStep.timeType })
      updateStep(targetStep.id, { day: tempDay, time: tempTime, timeType: tempTimeType })
    }
  }

  function toggleStepEnabled(stepId) {
    updateStep(stepId, { enabled: !steps.find(s => s.id === stepId).enabled })
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
                {daySteps.map((step, stepIndex) => {
                  const globalIndex = steps.findIndex(s => s.id === step.id)
                  return (
                    <div key={step.id} className={`flow-step ${!step.enabled ? 'disabled' : ''}`}>
                      <div className="step-header">
                        <div className="step-type-badge">
                          {step.type === 'email' ? '📧 Email' : '💬 Text'}
                        </div>
                        <div className="step-actions">
                          <button 
                            className="btn-icon" 
                            onClick={() => moveStep(step.id, 'up')}
                            disabled={globalIndex === 0}
                            title="Move earlier"
                          >
                            ↑
                          </button>
                          <button 
                            className="btn-icon" 
                            onClick={() => moveStep(step.id, 'down')}
                            disabled={globalIndex === steps.length - 1}
                            title="Move later"
                          >
                            ↓
                          </button>
                          <button 
                            className="btn-icon" 
                            onClick={() => toggleStepEnabled(step.id)}
                            title={step.enabled ? 'Disable' : 'Enable'}
                          >
                            {step.enabled ? '✓' : '○'}
                          </button>
                          <button 
                            className="btn-icon btn-danger" 
                            onClick={() => deleteStep(step.id)}
                            title="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </div>

              {editingStep === step.id ? (
                <div className="step-editor">
                  {step.type === 'email' && (
                    <div className="form-group">
                      <label>Email Subject</label>
                      <input
                        type="text"
                        value={step.subject || ''}
                        onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                        placeholder="Subject line"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Message Content</label>
                    <textarea
                      value={step.content}
                      onChange={(e) => updateStep(step.id, { content: e.target.value })}
                      placeholder={step.type === 'email' ? 'Email body...' : 'Text message...'}
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
                            name={`timing-${step.id}`}
                            checked={step.timeType === 'immediately'}
                            onChange={() => updateStep(step.id, { timeType: 'immediately' })}
                          />
                          <span>Immediately</span>
                        </label>
                      </div>
                      <div className="timing-option">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name={`timing-${step.id}`}
                            checked={step.timeType === 'specific'}
                            onChange={() => updateStep(step.id, { timeType: 'specific' })}
                          />
                          <span>Day</span>
                        </label>
                        {step.timeType === 'specific' && (
                          <div className="specific-timing">
                            <span className="timing-text">Day</span>
                            <input
                              type="number"
                              value={step.day}
                              onChange={(e) => updateStep(step.id, { day: parseInt(e.target.value) || 0 })}
                              min="0"
                              className="day-input"
                            />
                            <span className="timing-text">at</span>
                            <input
                              type="text"
                              value={step.time}
                              onChange={(e) => updateStep(step.id, { time: e.target.value })}
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
              ) : (
                <div className="step-preview" onClick={() => setEditingStep(step.id)}>
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
                    {!step.enabled && <span className="disabled-badge">Disabled</span>}
                  </div>
                </div>
              )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

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

