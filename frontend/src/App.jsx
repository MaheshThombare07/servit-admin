import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Categories from './pages/Categories.jsx'
import Services from './pages/Services.jsx'
import ServiceEdit from './pages/ServiceEdit.jsx'
import Partners from './pages/Partners.jsx'
import Users from './pages/Users.jsx'
import UserDetail from './pages/UserDetail.jsx'
import BookingHistory from './pages/BookingHistory.jsx'
import AllBookings from './pages/AllBookings.jsx'

export default function App() {
  const navigate = useNavigate()
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
          <NavLink to="/" end className={({isActive})=> isActive? 'active' : ''}>Categories</NavLink>
          <NavLink to="/partners" className={({isActive})=> isActive? 'active' : ''}>Partners</NavLink>
          <NavLink to="/users" className={({isActive})=> isActive? 'active' : ''}>Users</NavLink>
          <NavLink to="/bookings" className={({isActive})=> isActive? 'active' : ''}>All Bookings</NavLink>
        </nav>
      </aside>
      <main className="content">
        <div className="topbar">
          <button className="icon-btn" aria-label="Open sidebar" onClick={() => setSidebarOpen(s => !s)}>☰</button>
          <div className="spacer" />
          <button className="btn outline" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
        <Routes>
          <Route path="/" element={<Categories />} />
          <Route path="/categories/:categoryId" element={<Services />} />
          <Route path="/categories/:categoryId/services/:serviceId" element={<ServiceEdit />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:userId" element={<UserDetail />} />
          <Route path="/users/:userId/bookings" element={<BookingHistory />} />
          <Route path="/bookings" element={<AllBookings />} />
        </Routes>
      </main>
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}
