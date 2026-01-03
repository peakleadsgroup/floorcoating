import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Leads from './pages/Leads'
import Flow from './pages/Flow'
import Call from './pages/Call'
import Agreement from './pages/Agreement'
import Deposit from './pages/Deposit'
import './App.css'

function App() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('leads')

  // Check if we're on an agreements route
  const isAgreementsRoute = location.pathname.startsWith('/agreements')

  // If on agreements route, show only the route content
  if (isAgreementsRoute) {
    return (
      <Routes>
        <Route path="/agreements" element={<Agreement />} />
        <Route path="/agreements/deposit" element={<Deposit />} />
      </Routes>
    )
  }

  // Otherwise, show the CRM interface
  return (
    <div className="app">
      <div className="container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            Leads
          </button>
          <button 
            className={`tab ${activeTab === 'flow' ? 'active' : ''}`}
            onClick={() => setActiveTab('flow')}
          >
            Flow
          </button>
          <button 
            className={`tab ${activeTab === 'call' ? 'active' : ''}`}
            onClick={() => setActiveTab('call')}
          >
            Call
          </button>
        </div>

        <div className="page-content-wrapper">
          {activeTab === 'leads' && <Leads />}
          {activeTab === 'flow' && <Flow />}
          {activeTab === 'call' && <Call />}
        </div>
      </div>
    </div>
  )
}

export default App
