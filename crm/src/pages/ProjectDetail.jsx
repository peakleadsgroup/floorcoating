import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ProjectDetail.css'

function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    project_stage: 'scheduled',
    installer: '',
    install_date: '',
    internal_notes: '',
  })

  useEffect(() => {
    fetchProject()
  }, [id])

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
        project_stage: projectData.project_stage || 'scheduled',
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
      const { error } = await supabase
        .from('projects')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
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
                <option value="scheduled">Scheduled</option>
                <option value="prep">Prep</option>
                <option value="install_day">Install Day</option>
                <option value="completed">Completed</option>
                <option value="warranty">Warranty</option>
              </select>
            </div>
            <div className="form-group">
              <label>Installer</label>
              <input
                type="text"
                value={formData.installer}
                onChange={(e) => setFormData({ ...formData, installer: e.target.value })}
                placeholder="Installer name"
              />
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

