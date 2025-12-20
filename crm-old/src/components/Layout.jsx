import { Outlet, Link, useLocation, useSearchParams } from 'react-router-dom'
import { useRep } from '../contexts/RepContext'
import './Layout.css'

function Layout() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { repId, rep, loading } = useRep()
  
  // Helper function to preserve repId in navigation links
  const getLinkWithRepId = (path) => {
    if (repId) {
      const separator = path.includes('?') ? '&' : '?'
      return `${path}${separator}repId=${repId}`
    }
    return path
  }
  
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to={getLinkWithRepId('/')} className="logo">
            <img 
              src="https://github.com/peakleadsgroup/floorcoating/blob/main/images/PeakFloorCoating-1000x250-NoBack.png?raw=true" 
              alt="Peak Floor Coating CRM" 
              className="logo-image"
            />
          </Link>
          <div className="header-right">
            {repId && (
              <div className="rep-info">
                {loading ? (
                  <span className="rep-loading">Loading...</span>
                ) : rep ? (
                  <span className="rep-name">
                    {rep.name}
                    {rep.roles && Array.isArray(rep.roles) && rep.roles.length > 0 && (
                      <span className="rep-roles">
                        {' '}({rep.roles.join(', ')})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="rep-error">Rep not found</span>
                )}
              </div>
            )}
            <nav className="nav">
              <Link 
                to={getLinkWithRepId('/')}
                className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
              >
                Sales Board
              </Link>
              <Link 
                to={getLinkWithRepId('/projects')}
                className={location.pathname.startsWith('/projects') ? 'nav-link active' : 'nav-link'}
              >
                Project Board
              </Link>
              <Link 
                to={getLinkWithRepId('/reps')}
                className={location.pathname === '/reps' ? 'nav-link active' : 'nav-link'}
              >
                Reps
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

