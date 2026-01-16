import { Routes, Route, NavLink, useNavigate, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Categories from './pages/Categories.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Services from './pages/Services.jsx'
import ServiceEdit from './pages/ServiceEdit.jsx'
import Partners from './pages/Partners.jsx'
import PartnerDetail from './pages/PartnerDetail.jsx'
import Users from './pages/Users.jsx'
import UserDetail from './pages/UserDetail.jsx'
import BookingHistory from './pages/BookingHistory.jsx'
import AllBookings from './pages/AllBookings.jsx'
import Login from './pages/Login.jsx'
import AdminRegister from './pages/AdminRegister.jsx'
import AdminManagement from './pages/AdminManagement.jsx'
import { useAuth } from './contexts/AuthContext.jsx'

function DashboardLayout() {
  const navigate = useNavigate()
  const { logout, hasAccess } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 900)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth < 900) setSidebarOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className={`app ${sidebarOpen ? '' : 'collapsed'}`}>
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="brand-row">
          <div className="brand" onClick={() => navigate('/')}>Servite Admin</div>
          <button className="icon-btn" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
          {hasAccess('categories') && (
            <NavLink to="/categories" className={({ isActive }) => isActive ? 'active' : ''}>Categories</NavLink>
          )}
          {hasAccess('partners') && (
            <NavLink to="/partners" className={({ isActive }) => isActive ? 'active' : ''}>Partners</NavLink>
          )}
          {hasAccess('users') && (
            <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>Users</NavLink>
          )}
          {hasAccess('bookings') && (
            <NavLink to="/bookings" className={({ isActive }) => isActive ? 'active' : ''}>All Bookings</NavLink>
          )}
          {hasAccess('settings') && (
            <NavLink to="/admin-management" className={({ isActive }) => isActive ? 'active' : ''}>Admin Management</NavLink>
          )}
        </nav>
      </aside>
      <main className="content">
        <div className="topbar">
          <button className="icon-btn" aria-label="Open sidebar" onClick={() => setSidebarOpen(s => !s)}>☰</button>
          <div className="spacer" />
          <button className="btn outline" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button className="btn danger outline" style={{ marginLeft: '12px' }} onClick={logout}>
            Logout
          </button>
        </div>
        <Outlet />
      </main>
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}

function RequireAuth() {
  const { admin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="loading-state" style={{ padding: '24px' }}>Checking access...</div>
  }

  if (!admin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default function App() {
  const { admin, loading } = useAuth()

  if (loading) {
    return <div className="loading-state" style={{ padding: '24px' }}>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/" replace /> : <Login />} />
      {/* <Route path="/register" element={<AdminRegister />} /> */}

      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:categoryId" element={<Services />} />
          <Route path="/categories/:categoryId/services/:serviceId" element={<ServiceEdit />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/partners/:partnerId" element={<PartnerDetail />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserDetail />} />
          <Route path="/users/:userId/bookings" element={<BookingHistory />} />
          <Route path="/bookings" element={<AllBookings />} />
          <Route path="/admin-management" element={<AdminManagement />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={admin ? '/' : '/login'} replace />} />
    </Routes>
  )
}
