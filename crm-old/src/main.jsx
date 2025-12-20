import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Error boundary for better debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found!')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
