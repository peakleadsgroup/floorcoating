import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import SalesBoard from './pages/SalesBoard'
import LeadDetail from './pages/LeadDetail'
import ProjectBoard from './pages/ProjectBoard'
import ProjectDetail from './pages/ProjectDetail'
import Reps from './pages/Reps'
import ContractSigning from './pages/ContractSigning'
import Success from './pages/Success'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (no layout) */}
        <Route path="/contract/:token" element={<ContractSigning />} />
        <Route path="/success" element={<Success />} />
        
        {/* Internal routes (with layout) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<SalesBoard />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="projects" element={<ProjectBoard />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="reps" element={<Reps />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
