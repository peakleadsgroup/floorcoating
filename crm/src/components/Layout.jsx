import { Outlet, Link, useLocation } from 'react-router-dom'
import './Layout.css'

function Layout() {
  const location = useLocation()
  
  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>Peak Floor Coating CRM</h1>
          </Link>
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
          </nav>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

