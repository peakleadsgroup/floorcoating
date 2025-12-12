import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import './Success.css'

function Success() {
  const confettiRef = useRef(null)

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-icon">🎉</div>
        <h1>Congratulations!</h1>
        <h2>You're one step closer to an awesome new floor!</h2>
        <p className="success-message">
          Your deposit has been received and your project has been scheduled.
          We'll be in touch shortly to confirm your installation date.
        </p>
        <div className="success-details">
          <p><strong>What's Next?</strong></p>
          <ul>
            <li>Our team will review your project details</li>
            <li>We'll contact you within 24 hours to schedule your installation</li>
            <li>You'll receive a confirmation email with all the details</li>
          </ul>
        </div>
        <div className="success-contact">
          <p>Questions? Contact us at <strong>(919) 363-4740</strong></p>
        </div>
      </div>
      <canvas ref={confettiRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }} />
    </div>
  )
}

export default Success

