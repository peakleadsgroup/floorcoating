import { createContext, useContext, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const RepContext = createContext(null)

export function RepProvider({ children }) {
  const [searchParams] = useSearchParams()
  const [repId, setRepId] = useState(null)
  const [rep, setRep] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get rep ID from URL parameter
    const repIdParam = searchParams.get('repId')
    
    if (repIdParam) {
      setRepId(repIdParam)
      fetchRep(repIdParam)
    } else {
      setRepId(null)
      setRep(null)
      setLoading(false)
    }
  }, [searchParams])

  const fetchRep = async (id) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('reps')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setRep(data)
      } else {
        setError('Rep not found')
        setRep(null)
      }
    } catch (err) {
      console.error('Error fetching rep:', err)
      setError('Error loading rep information')
      setRep(null)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    repId,
    rep,
    loading,
    error,
    hasRole: (role) => {
      if (!rep || !rep.roles) return false
      const roles = Array.isArray(rep.roles) ? rep.roles : []
      return roles.includes(role)
    },
    hasAnyRole: (roles) => {
      if (!rep || !rep.roles) return false
      const repRoles = Array.isArray(rep.roles) ? rep.roles : []
      return roles.some(role => repRoles.includes(role))
    }
  }

  return (
    <RepContext.Provider value={value}>
      {children}
    </RepContext.Provider>
  )
}

export function useRep() {
  const context = useContext(RepContext)
  if (context === null) {
    throw new Error('useRep must be used within RepProvider')
  }
  return context
}

