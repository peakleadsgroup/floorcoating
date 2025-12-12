import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ProjectDetail.css'

function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [lead, setLead] = useState(null)
  const [installers, setInstallers] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    project_stage: 'scheduled',
    installer_id: '',
    installer: '',
    install_date: '',
    internal_notes: '',
  })

  useEffect(() => {
    fetchProject()
    fetchInstallers()
  }, [id])

  const fetchInstallers = async () => {
    try {
      const { data, error } = await supabase
        .from('reps')
        .select('*')
        .eq('role', 'Installer')
        .order('name', { ascending: true })

      if (error) throw error
      setInstallers(data || [])
    } catch (error) {
      console.error('Error fetching installers:', error)
    }
  }

  const fetchProject = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          leads (*)
        `)
        .eq('id', id)
        .single()

      if (projectError) throw projectError

      setProject(projectData)
      setLead(projectData.leads)
      setFormData({
        project_stage: projectData.project_stage || 'sold',
        installer_id: projectData.installer_id || '',
        installer: projectData.installer || '',
        install_date: projectData.install_date || '',
        internal_notes: projectData.internal_notes || '',
      })
    } catch (error) {
      console.error('Error fetching project:', error)
      alert('Error loading project')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const updateData = {
        project_stage: formData.project_stage,
        installer_id: formData.installer_id || null,
        install_date: formData.install_date || null,
        internal_notes: formData.internal_notes || '',
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      alert('Project updated successfully')
      await fetchProject()
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Error saving project')
    }
  }

  if (loading) {
    return <div className="loading">Loading project...</div>
  }

  if (!project) {
    return <div className="loading">Project not found</div>
  }

  return (
    <div className="project-detail">
      <div className="page-header">
        <button className="btn-secondary" onClick={() => navigate('/projects')}>
          ← Back to Project Board
        </button>
        <h1>Project: {lead?.name || 'Unknown'}</h1>
      </div>

      <div className="project-detail-content">
        <div className="card">
          <h2>Customer Information</h2>
          {lead && (
            <div className="customer-info">
              <p><strong>Name:</strong> {lead.name}</p>
              <p><strong>Phone:</strong> {lead.phone || 'N/A'}</p>
              <p><strong>Email:</strong> {lead.email || 'N/A'}</p>
              <p><strong>Address:</strong> {lead.address || 'N/A'}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Project Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Project Stage</label>
              <select
                value={formData.project_stage}
                onChange={(e) => setFormData({ ...formData, project_stage: e.target.value })}
              >
                <option value="sold">Sold</option>
                <option value="scheduled">Scheduled</option>
                <option value="prep">Prep</option>
                <option value="install_day">Install Day</option>
                <option value="completed">Completed</option>
                <option value="warranty">Warranty</option>
              </select>
            </div>
            <div className="form-group">
              <label>Installer</label>
              <select
                value={formData.installer_id || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  installer_id: e.target.value,
                  installer: installers.find(i => i.id === e.target.value)?.name || ''
                })}
              >
                <option value="">Select an installer</option>
                {installers.map(installer => (
                  <option key={installer.id} value={installer.id}>
                    {installer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Install Date</label>
              <input
                type="date"
                value={formData.install_date}
                onChange={(e) => setFormData({ ...formData, install_date: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Internal Notes</label>
            <textarea
              rows="8"
              value={formData.internal_notes}
              onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
              placeholder="Add internal notes about this project..."
            />
          </div>
          <button className="btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail

