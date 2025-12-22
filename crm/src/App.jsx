import { useState } from 'react'
import Leads from './pages/Leads'
import Flow from './pages/Flow'
import Call from './pages/Call'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('leads')

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
