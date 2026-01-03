import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Agreement.css'

// Color options from landingpage.html
const COLOR_OPTIONS = [
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Basil.jpg.jpg?raw=true', name: 'Basil' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Blue-jay.jpg.jpg?raw=true', name: 'Blue Jay' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Cabin-Fever.jpg.jpg?raw=true', name: 'Cabin Fever' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Cardinal.jpg.jpg?raw=true', name: 'Cardinal' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Cinnamon.jpg.jpg?raw=true', name: 'Cinnamon' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Coffee-Bean.jpg.jpg?raw=true', name: 'Coffee Bean' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Cyberspace.jpg.jpg?raw=true', name: 'Cyberspace' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Domino.jpg.jpg?raw=true', name: 'Domino' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Driftwood.jpg.jpg?raw=true', name: 'Driftwood' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Fortress.jpg.jpg?raw=true', name: 'Fortress' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Fog.jpg.jpg?raw=true', name: 'Fog' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Hog.jpg.jpg?raw=true', name: 'Hog' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Latte.jpg.jpg?raw=true', name: 'Latte' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Madras.jpg.jpg?raw=true', name: 'Madras' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Nutmeg.jpg.jpg?raw=true', name: 'Nutmeg' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Olive-Grove.jpg.jpg?raw=true', name: 'Olive Grove' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Pebble-Beach.jpg.jpg?raw=true', name: 'Pebble Beach' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Pecan.jpg.jpg?raw=true', name: 'Pecan' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/River-Rock.jpg.jpg?raw=true', name: 'River Rock' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Sandstone.jpg.jpg?raw=true', name: 'Sandstone' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Sea-Serpants.jpg.jpg?raw=true', name: 'Sea Serpents' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Slatestone.jpg.jpg?raw=true', name: 'Slatestone' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Smoke.jpg.jpg?raw=true', name: 'Smoke' },
  { url: 'https://github.com/peakleadsgroup/floorcoating/blob/main/images/Twilight.jpg-1.webp?raw=true', name: 'Twilight' }
]

export default function Agreement() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const leadId = searchParams.get('leadId')
  
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedColor, setSelectedColor] = useState('')
  const [signature, setSignature] = useState('')
  const [signatureName, setSignatureName] = useState('')
  const [isSigning, setIsSigning] = useState(false)
  const [canvasRef, setCanvasRef] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [savingStatus, setSavingStatus] = useState('')

  useEffect(() => {
    if (!leadId) {
      setError('No lead ID provided')
      setLoading(false)
      return
    }
    fetchLead()
  }, [leadId])

  useEffect(() => {
    if (canvasRef) {
      const ctx = canvasRef.getContext('2d')
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      
      // Load saved signature from localStorage if available
      if (leadId) {
        const savedSignature = localStorage.getItem(`signature_${leadId}`)
        if (savedSignature) {
          const img = new Image()
          img.onload = () => {
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height)
            ctx.drawImage(img, 0, 0)
            setSignature(savedSignature)
          }
          img.src = savedSignature
        }
      }
    }
  }, [canvasRef, leadId])

  async function fetchLead() {
    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (fetchError) throw fetchError
      if (!data) throw new Error('Lead not found')

      setLead(data)
      setSelectedColor(data.color_choice || '')
      setLoading(false)
    } catch (err) {
      console.error('Error fetching lead:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleColorSelect(colorName) {
    setSelectedColor(colorName)
    // Auto-save color choice
    if (leadId) {
      try {
        const { error } = await supabase
          .from('leads')
          .update({ color_choice: colorName })
          .eq('id', leadId)
        
        if (error) throw error
        setSavingStatus('Color choice saved')
        setTimeout(() => setSavingStatus(''), 2000)
      } catch (err) {
        console.error('Error saving color choice:', err)
      }
    }
  }

  function handleCanvasMouseDown(e) {
    if (!canvasRef) return
    setIsDrawing(true)
    const rect = canvasRef.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setLastX(x)
    setLastY(y)
    
    const ctx = canvasRef.getContext('2d')
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function handleCanvasMouseMove(e) {
    if (!isDrawing || !canvasRef) return
    const rect = canvasRef.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const ctx = canvasRef.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    
    setLastX(x)
    setLastY(y)
    
    // Auto-save signature while drawing (debounced)
    if (canvasRef) {
      const signatureData = canvasRef.toDataURL('image/png')
      setSignature(signatureData)
      // Save to localStorage every stroke
      if (leadId) {
        try {
          localStorage.setItem(`signature_${leadId}`, signatureData)
        } catch (err) {
          console.error('Error saving signature:', err)
        }
      }
    }
  }

  function handleCanvasMouseUp() {
    if (isDrawing && canvasRef) {
      // Auto-save signature on mouse up
      captureSignature()
    }
    setIsDrawing(false)
  }

  function handleCanvasTouchStart(e) {
    e.preventDefault()
    if (!canvasRef) return
    const touch = e.touches[0]
    const rect = canvasRef.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    setLastX(x)
    setLastY(y)
    setIsDrawing(true)
    
    const ctx = canvasRef.getContext('2d')
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function handleCanvasTouchMove(e) {
    e.preventDefault()
    if (!isDrawing || !canvasRef) return
    const touch = e.touches[0]
    const rect = canvasRef.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    const ctx = canvasRef.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    
    setLastX(x)
    setLastY(y)
    
    // Auto-save signature while drawing (for touch)
    if (canvasRef) {
      const signatureData = canvasRef.toDataURL('image/png')
      setSignature(signatureData)
      // Save to localStorage every stroke
      if (leadId) {
        try {
          localStorage.setItem(`signature_${leadId}`, signatureData)
        } catch (err) {
          console.error('Error saving signature:', err)
        }
      }
    }
  }

  function handleCanvasTouchEnd(e) {
    e.preventDefault()
    if (isDrawing && canvasRef) {
      // Auto-save signature on touch end
      captureSignature()
    }
    setIsDrawing(false)
  }

  function clearSignature() {
    if (!canvasRef) return
    const ctx = canvasRef.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height)
    setSignature('')
  }

  async function captureSignature() {
    if (!canvasRef) return
    const signatureData = canvasRef.toDataURL('image/png')
    setSignature(signatureData)
    
    // Auto-save signature to local storage as backup
    if (leadId) {
      try {
        localStorage.setItem(`signature_${leadId}`, signatureData)
        setSavingStatus('Signature saved')
        setTimeout(() => setSavingStatus(''), 2000)
      } catch (err) {
        console.error('Error saving signature to localStorage:', err)
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!signatureName.trim()) {
      alert('Please enter your name')
      return
    }

    if (!signature) {
      alert('Please provide your signature')
      return
    }

    if (!selectedColor) {
      alert('Please select a color')
      return
    }

    setIsSigning(true)

    try {
      // Get user's IP address and user agent for compliance
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipResponse.json()
      const ipAddress = ipData.ip
      const userAgent = navigator.userAgent

      // Get geolocation if available (with user permission)
      let location = null
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          location = `${position.coords.latitude},${position.coords.longitude}`
        } catch (geoError) {
          console.log('Geolocation not available:', geoError)
        }
      }

      // Placeholder contract content
      const contractContent = `
        AGREEMENT FOR FLOOR COATING SERVICES
        
        This Agreement is entered into on ${new Date().toLocaleDateString()} between Peak Floor Coating and ${lead.first_name} ${lead.last_name}.
        
        Project Details:
        - Customer: ${lead.first_name} ${lead.last_name}
        - Address: ${lead.street_address || 'N/A'}, ${lead.city || 'N/A'}, ${lead.state || 'N/A'} ${lead.zip || 'N/A'}
        - Square Footage: ${lead.square_footage || lead.estimated_sqft || 'N/A'} sq ft
        - Total Price: $${lead.total_price || '0.00'}
        - Color Choice: ${selectedColor}
        
        Terms and conditions will be provided in the final contract.
        
        This is a placeholder contract. The actual contract will be provided by Peak Floor Coating.
      `.trim()

      // Create agreement record
      const { data: agreement, error: agreementError } = await supabase
        .from('agreements')
        .insert({
          lead_id: leadId,
          contract_content: contractContent,
          signature_data: signature,
          signed_name: signatureName.trim(),
          signed_at: new Date().toISOString(),
          signed_ip_address: ipAddress,
          signed_user_agent: userAgent,
          signed_location: location,
          status: 'signed'
        })
        .select()
        .single()

      if (agreementError) throw agreementError

      // Update lead with color choice
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          color_choice: selectedColor,
          square_footage: lead.square_footage || lead.estimated_sqft,
          total_price: lead.total_price
        })
        .eq('id', leadId)

      if (updateError) throw updateError

      // Navigate to deposit page
      navigate(`/agreements/deposit?agreementId=${agreement.id}&leadId=${leadId}`)
    } catch (err) {
      console.error('Error submitting agreement:', err)
      alert('Error submitting agreement. Please try again.')
      setIsSigning(false)
    }
  }

  if (loading) {
    return (
      <div className="agreement-page">
        <div className="agreement-container">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="agreement-page">
        <div className="agreement-container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error || 'Lead not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="agreement-page">
      <header className="agreement-header">
        <div className="header-container">
          <a href="/" className="logo-link">
            <img 
              src="https://github.com/peakleadsgroup/floorcoating/blob/main/images/PeakFloorCoating-1000x250-NoBack.png?raw=true" 
              alt="Peak Floor Coating" 
              className="logo"
            />
          </a>
        </div>
      </header>
      <div className="agreement-container">
        {savingStatus && (
          <div className="save-status">{savingStatus}</div>
        )}
        <h1>Service Agreement</h1>
        
        {/* Project Information Section */}
        <div className="project-info-section">
          <h2>Project Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Customer Name:</label>
              <span>{lead.first_name} {lead.last_name}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{lead.email || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Phone:</label>
              <span>{lead.phone || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Address:</label>
              <span>
                {lead.street_address || 'N/A'}
                {lead.city && `, ${lead.city}`}
                {lead.state && `, ${lead.state}`}
                {lead.zip && ` ${lead.zip}`}
              </span>
            </div>
            <div className="info-item">
              <label>Square Footage:</label>
              <span>{lead.square_footage || lead.estimated_sqft || 'N/A'} sq ft</span>
            </div>
            <div className="info-item">
              <label>Total Price:</label>
              <span>${lead.total_price ? parseFloat(lead.total_price).toFixed(2) : '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Color Selection Section */}
        <div className="color-selection-section">
          <h2>Select Your Color Choice</h2>
          <p className="color-instructions">Click on a color to select it</p>
          <div className="color-grid">
            {COLOR_OPTIONS.map((color) => (
              <div
                key={color.name}
                className={`color-option ${selectedColor === color.name ? 'selected' : ''}`}
                onClick={() => handleColorSelect(color.name)}
              >
                <img src={color.url} alt={color.name} />
                <div className="color-checkbox">
                  {selectedColor === color.name && <span className="checkmark">✓</span>}
                </div>
                <p className="color-name">{color.name}</p>
              </div>
            ))}
          </div>
          {selectedColor && (
            <p className="selected-color-text">Selected: <strong>{selectedColor}</strong></p>
          )}
        </div>

        {/* Contract Section */}
        <div className="contract-section">
          <h2>Contract Terms</h2>
          <div className="contract-content">
            <p>
              This is a placeholder contract. The actual contract terms will be provided by Peak Floor Coating.
              By signing below, you agree to the terms and conditions that will be detailed in the final contract.
            </p>
          </div>
        </div>

        {/* Signature Section */}
        <div className="signature-section">
          <h2>Sign Agreement</h2>
          <form onSubmit={handleSubmit}>
            <div className="signature-name-input">
              <label htmlFor="signatureName">Full Name (as it appears on your ID):</label>
              <input
                type="text"
                id="signatureName"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="signature-canvas-container">
              <label>Signature:</label>
              <div className="canvas-wrapper">
                <canvas
                  ref={setCanvasRef}
                  width={600}
                  height={200}
                  className="signature-canvas"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={handleCanvasTouchStart}
                  onTouchMove={handleCanvasTouchMove}
                  onTouchEnd={handleCanvasTouchEnd}
                />
                <button
                  type="button"
                  className="btn-clear-signature"
                  onClick={clearSignature}
                >
                  Clear
                </button>
              </div>
              <p className="signature-instructions">Please sign above using your mouse or touch screen</p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-capture-signature"
                onClick={captureSignature}
                disabled={!signatureName.trim()}
              >
                Capture Signature
              </button>
              <button
                type="submit"
                className="btn-submit-agreement"
                disabled={!signature || !signatureName.trim() || !selectedColor || isSigning}
              >
                {isSigning ? 'Submitting...' : 'Sign and Continue to Deposit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

