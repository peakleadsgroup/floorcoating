import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import KanbanBoard from '../components/KanbanBoard'
import './ProjectBoard.css'

const PROJECT_STAGES = [
  { id: 'sold', title: 'Sold' },
  { id: 'scheduled', title: 'Scheduled' },
  { id: 'prep', title: 'Prep' },
  { id: 'install_day', title: 'Install Day' },
  { id: 'completed', title: 'Completed' },
  { id: 'warranty', title: 'Warranty' },
]

function ProjectBoard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          leads (
            id,
            first_name,
            last_name,
            street_address,
            city,
            state,
            zip,
            address
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Flatten the data structure for KanbanBoard
      const flattenedProjects = (data || []).map(project => ({
        ...project,
        name: project.leads 
          ? `${project.leads.first_name || ''} ${project.leads.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown',
        title: project.leads 
          ? `${project.leads.first_name || ''} ${project.leads.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown',
        street_address: project.leads?.street_address || '',
        city: project.leads?.city || '',
        state: project.leads?.state || '',
        zip: project.leads?.zip || '',
        address: project.leads?.address || '', // Keep for backward compatibility
        stage: project.project_stage,
      }))
      
      setProjects(flattenedProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
      alert('Error loading projects')
    } finally {
      setLoading(false)
    }
  }

  const handleItemMove = async (projectId, newStage) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ project_stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', projectId)

      if (error) throw error

      // Update local state
      setProjects(projects.map(project =>
        project.id === projectId ? { ...project, stage: newStage, project_stage: newStage } : project
      ))
    } catch (error) {
      console.error('Error updating project stage:', error)
      alert('Error updating project stage')
      fetchProjects() // Refresh on error
    }
  }

  const handleItemClick = (project) => {
    navigate(`/projects/${project.id}`)
  }

  if (loading) {
    return <div className="loading">Loading projects...</div>
  }

  return (
    <div className="project-board">
      <div className="page-header">
        <h1>Project Pipeline</h1>
      </div>
      <KanbanBoard
        columns={PROJECT_STAGES}
        items={projects}
        onItemMove={handleItemMove}
        onItemClick={handleItemClick}
      />
    </div>
  )
}

export default ProjectBoard

