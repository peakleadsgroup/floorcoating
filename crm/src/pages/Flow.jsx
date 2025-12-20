import { useState } from 'react'
import './Flow.css'

export default function Flow() {
  const [steps, setSteps] = useState([])
  const [editingStep, setEditingStep] = useState(null)

  function addStep(type) {
    const newStep = {
      id: Date.now(),
      type: type, // 'email' or 'text'
      name: '',
      subject: type === 'email' ? '' : null,
      content: '',
      delay: 0, // hours after previous step
      delayUnit: 'hours', // 'hours', 'days', 'minutes'
      enabled: true
    }
    setSteps([...steps, newStep])
    setEditingStep(newStep.id)
  }

  function updateStep(stepId, updates) {
    setSteps(steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ))
  }

  function deleteStep(stepId) {
    setSteps(steps.filter(step => step.id !== stepId))
    if (editingStep === stepId) {
      setEditingStep(null)
    }
  }

  function moveStep(stepId, direction) {
    const index = steps.findIndex(s => s.id === stepId)
    if (index === -1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= steps.length) return
    
    const newSteps = [...steps]
    const [removed] = newSteps.splice(index, 1)
    newSteps.splice(newIndex, 0, removed)
    setSteps(newSteps)
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
        <button className="btn-primary" onClick={() => addStep('email')}>
          + Add Email Step
        </button>
        <button className="btn-primary" onClick={() => addStep('text')}>
          + Add Text Step
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="empty-state">
          <p>No steps yet. Click the buttons above to add email or text steps to your flow.</p>
        </div>
      ) : (
        <div className="flow-steps">
          {steps.map((step, index) => (
            <div key={step.id} className={`flow-step ${!step.enabled ? 'disabled' : ''}`}>
              <div className="step-header">
                <div className="step-number">Step {index + 1}</div>
                <div className="step-type-badge">{step.type === 'email' ? '📧 Email' : '💬 Text'}</div>
                <div className="step-actions">
                  <button 
                    className="btn-icon" 
                    onClick={() => moveStep(step.id, 'up')}
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button 
                    className="btn-icon" 
                    onClick={() => moveStep(step.id, 'down')}
                    disabled={index === steps.length - 1}
                    title="Move down"
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
                  <div className="form-group">
                    <label>Step Name</label>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => updateStep(step.id, { name: e.target.value })}
                      placeholder="e.g., Welcome Email"
                    />
                  </div>

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
                      rows={6}
                    />
                    <small className="form-hint">
                      {step.type === 'email' 
                        ? 'You can use {firstName}, {lastName}, {phone}, {email} as variables'
                        : 'You can use {firstName}, {lastName}, {phone}, {email} as variables'}
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Send Delay</label>
                    <div className="delay-inputs">
                      <input
                        type="number"
                        value={step.delay}
                        onChange={(e) => updateStep(step.id, { delay: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                      <select
                        value={step.delayUnit}
                        onChange={(e) => updateStep(step.id, { delayUnit: e.target.value })}
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                      <span className="delay-hint">after {index === 0 ? 'lead is created' : 'previous step'}</span>
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
                  <div className="step-preview-name">
                    {step.name || `Untitled ${step.type === 'email' ? 'Email' : 'Text'}`}
                  </div>
                  <div className="step-preview-content">
                    {step.type === 'email' && step.subject && (
                      <div className="preview-subject">Subject: {step.subject}</div>
                    )}
                    <div className="preview-text">
                      {step.content || 'No content yet...'}
                    </div>
                  </div>
                  <div className="step-preview-meta">
                    <span>Delay: {step.delay} {step.delayUnit}</span>
                    {!step.enabled && <span className="disabled-badge">Disabled</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
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

