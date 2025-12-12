import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Layout.css'

function Layout() {
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for unread messages every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('is_outbound', false)

      if (error) throw error
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }
  
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <img 
              src="https://github.com/peakleadsgroup/floorcoating/blob/main/images/PeakFloorCoating-1000x250-NoBack.png?raw=true" 
              alt="Peak Floor Coating CRM" 
              className="logo-image"
            />
          </Link>
          <div className="header-right">
            <nav className="nav">
              <Link 
                to="/" 
                className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
              >
                Sales Board
              </Link>
              <Link 
                to="/projects" 
                className={location.pathname.startsWith('/projects') ? 'nav-link active' : 'nav-link'}
              >
                Project Board
              </Link>
              <Link 
                to="/reps" 
                className={location.pathname === '/reps' ? 'nav-link active' : 'nav-link'}
              >
                Reps
              </Link>
            </nav>
          </div>
          {unreadCount > 0 && (
            <div className="unread-notification-badge">
              {unreadCount}
            </div>
          )}
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

