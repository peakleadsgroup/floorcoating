import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Reps.css'

const ROLE_OPTIONS = ['Sales', 'Project Management', 'Installer']

function Reps() {
  const [reps, setReps] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRep, setEditingRep] = useState(null)
  const [roleFilter, setRoleFilter] = useState('') // Filter by role
  
  const [formData, setFormData] = useState({
    name: '',
    roles: ['Sales'], // Array of selected roles
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

    if (formData.roles.length === 0) {
      alert('Please select at least one role')
      return
    }

    try {
      if (editingRep) {
        const { error } = await supabase
          .from('reps')
          .update({
            name: formData.name,
            roles: formData.roles,
            email: formData.email || null,
            phone: formData.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRep.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('reps')
          .insert([{
            name: formData.name,
            roles: formData.roles,
            email: formData.email || null,
            phone: formData.phone || null,
          }])

        if (error) throw error
      }

      setFormData({ name: '', roles: ['Sales'], email: '', phone: '' })
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
    // Handle both old format (role) and new format (roles array)
    const roles = rep.roles || (rep.role ? [rep.role] : ['Sales'])
    setFormData({
      name: rep.name,
      roles: Array.isArray(roles) ? roles : [roles],
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
    setFormData({ name: '', roles: ['Sales'], email: '', phone: '' })
    setShowForm(false)
    setEditingRep(null)
  }

  const handleRoleToggle = (role) => {
    const currentRoles = formData.roles || []
    if (currentRoles.includes(role)) {
      // Remove role if already selected (but must have at least one)
      if (currentRoles.length > 1) {
        setFormData({ ...formData, roles: currentRoles.filter(r => r !== role) })
      }
    } else {
      // Add role
      setFormData({ ...formData, roles: [...currentRoles, role] })
    }
  }

  // Filter reps based on selected role filter
  const filteredReps = roleFilter
    ? reps.filter(rep => {
        const repRoles = rep.roles || (rep.role ? [rep.role] : [])
        return Array.isArray(repRoles) ? repRoles.includes(roleFilter) : repRoles === roleFilter
      })
    : reps

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
                <label>Roles *</label>
                <div className="role-checkboxes">
                  {ROLE_OPTIONS.map(role => (
                    <label key={role} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.roles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                      />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
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

      <div className="card">
        <div className="reps-filter">
          <label>Filter by Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {ROLE_OPTIONS.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        
        {filteredReps.length === 0 ? (
          <p className="no-reps">No reps found</p>
        ) : (
          <table className="reps-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roles</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReps.map(rep => {
                const repRoles = rep.roles || (rep.role ? [rep.role] : [])
                const displayRoles = Array.isArray(repRoles) ? repRoles : [repRoles]
                return (
                  <tr key={rep.id}>
                    <td><strong>{rep.name}</strong></td>
                    <td>
                      <div className="rep-roles-inline">
                        {displayRoles.map((role, idx) => (
                          <span key={idx} className="rep-role-badge">{role}</span>
                        ))}
                      </div>
                    </td>
                    <td>{rep.email || '-'}</td>
                    <td>{rep.phone || '-'}</td>
                    <td>
                      <div className="rep-actions-inline">
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Reps

