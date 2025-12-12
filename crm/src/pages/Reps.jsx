import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Reps.css'

const ROLE_OPTIONS = ['Sales', 'Project Management', 'Installer']

function Reps() {
  const [reps, setReps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRep, setEditingRep] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Sales',
    email: '',
    phone: '',
  })

  useEffect(() => {
    fetchReps()
  }, [])

  const fetchReps = async () => {
    try {
      const { data, error } = await supabase
        .from('reps')
        .select('*')
        .order('role', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setReps(data || [])
    } catch (error) {
      console.error('Error fetching reps:', error)
      alert('Error loading reps')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter a name')
      return
    }

    try {
      if (editingRep) {
        const { error } = await supabase
          .from('reps')
          .update({
            name: formData.name,
            role: formData.role,
            email: formData.email || null,
            phone: formData.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRep.id)

        if (error) throw error
        alert('Rep updated successfully')
      } else {
        const { error } = await supabase
          .from('reps')
          .insert([{
            name: formData.name,
            role: formData.role,
            email: formData.email || null,
            phone: formData.phone || null,
          }])

        if (error) throw error
        alert('Rep created successfully')
      }

      setFormData({ name: '', role: 'Sales', email: '', phone: '' })
      setShowForm(false)
      setEditingRep(null)
      await fetchReps()
    } catch (error) {
      console.error('Error saving rep:', error)
      alert('Error saving rep')
    }
  }

  const handleEdit = (rep) => {
    setEditingRep(rep)
    setFormData({
      name: rep.name,
      role: rep.role,
      email: rep.email || '',
      phone: rep.phone || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (rep) => {
    if (!confirm(`Are you sure you want to delete ${rep.name}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('reps')
        .delete()
        .eq('id', rep.id)

      if (error) throw error
      alert('Rep deleted successfully')
      await fetchReps()
    } catch (error) {
      console.error('Error deleting rep:', error)
      alert('Error deleting rep')
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', role: 'Sales', email: '', phone: '' })
    setShowForm(false)
    setEditingRep(null)
  }

  const repsByRole = ROLE_OPTIONS.map(role => ({
    role,
    reps: reps.filter(rep => rep.role === role),
  }))

  if (loading) {
    return <div className="loading">Loading reps...</div>
  }

  return (
    <div className="reps-page">
      <div className="page-header">
        <h1>Reps</h1>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Rep'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>{editingRep ? 'Edit Rep' : 'Add New Rep'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Rep name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="1234567890"
                  maxLength={10}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-primary">
                {editingRep ? 'Update Rep' : 'Create Rep'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="reps-by-role">
        {repsByRole.map(({ role, reps: roleReps }) => (
          <div key={role} className="role-section">
            <h2>{role} ({roleReps.length})</h2>
            {roleReps.length === 0 ? (
              <p className="no-reps">No reps in this role</p>
            ) : (
              <div className="reps-list">
                {roleReps.map(rep => (
                  <div key={rep.id} className="rep-card">
                    <div className="rep-info">
                      <h3>{rep.name}</h3>
                      <span className="rep-role">{rep.role}</span>
                      {rep.email && (
                        <div className="rep-contact">
                          <strong>Email:</strong> {rep.email}
                        </div>
                      )}
                      {rep.phone && (
                        <div className="rep-contact">
                          <strong>Phone:</strong> {rep.phone}
                        </div>
                      )}
                    </div>
                    <div className="rep-actions">
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleEdit(rep)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-danger" 
                        onClick={() => handleDelete(rep)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reps

