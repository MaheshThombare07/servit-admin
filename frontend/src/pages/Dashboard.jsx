import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { FiUsers, FiUserCheck, FiAlertTriangle, FiCalendar, FiSearch, FiBell, FiTrendingUp, FiTrendingDown, FiCheck, FiX, FiActivity, FiSettings, FiFileText } from 'react-icons/fi'
import { getDashboardStats, getRecentBookings, getPendingValidations, getBookingTrends } from '../api'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'

const Dashboard = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // State for dashboard data
  const [stats, setStats] = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [pendingValidations, setPendingValidations] = useState([])
  const [bookingTrends, setBookingTrends] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all dashboard data in parallel
      const [statsData, bookingsData, validationsData, trendsData] = await Promise.all([
        getDashboardStats(),
        getRecentBookings(),
        getPendingValidations(),
        getBookingTrends()
      ])

      setStats(statsData)
      setRecentBookings(bookingsData.bookings || [])
      setPendingValidations(validationsData.partners || [])
      setBookingTrends(trendsData.trends || [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Format time for display
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const isToday = date.toDateString() === today.toDateString()
    const isTomorrow = date.toDateString() === tomorrow.toDateString()

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

    if (isToday) return `Today ${timeStr}`
    if (isTomorrow) return `Tomorrow ${timeStr}`
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`
  }

  // Get service icon emoji
  const getServiceIcon = (serviceName) => {
    const iconMap = {
      'AC Repair': '❄️',
      'Plumbing': '🔧',
      'Electrical': '⚡',
      'Cleaning': '🧹',
      'Painting': '🎨',
      'Carpentry': '🔨',
      'Gardening': '🌱',
      'Hair Styling': '💇',
      'Makeup': '💄',
      'Spa': '💆'
    }
    return iconMap[serviceName] || '🛠️'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
        <button className="btn primary" onClick={fetchDashboardData}>
          Retry
        </button>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total?.toLocaleString() || '0',
      change: stats?.users?.change ? `${stats.users.change > 0 ? '+' : ''}${stats.users.change}%` : '0%',
      changeType: stats?.users?.change > 0 ? 'positive' : stats?.users?.change < 0 ? 'negative' : 'neutral',
      icon: FiUsers,
      color: '#3b82f6'
    },
    {
      title: 'Total Providers',
      value: stats?.partners?.total?.toLocaleString() || '0',
      change: stats?.partners?.change ? `${stats.partners.change > 0 ? '+' : ''}${stats.partners.change}%` : '0%',
      changeType: stats?.partners?.change > 0 ? 'positive' : stats?.partners?.change < 0 ? 'negative' : 'neutral',
      icon: FiUserCheck,
      color: '#8b5cf6'
    },
    {
      title: 'Pending Validations',
      value: stats?.partners?.pending?.toLocaleString() || '0',
      change: 'Needs Attention',
      changeType: stats?.partners?.pending > 0 ? 'warning' : 'neutral',
      icon: FiAlertTriangle,
      color: '#f59e0b',
      highlighted: stats?.partners?.pending > 0
    },
    {
      title: 'Monthly Bookings',
      value: stats?.bookings?.monthly?.toLocaleString() || '0',
      change: stats?.bookings?.change ? `${stats.bookings.change > 0 ? '+' : ''}${stats.bookings.change}%` : '0%',
      changeType: stats?.bookings?.change > 0 ? 'positive' : stats?.bookings?.change < 0 ? 'negative' : 'neutral',
      icon: FiCalendar,
      color: '#10b981'
    }
  ]

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <div className="header-actions">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="notification-btn">
            <FiBell />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className={`stat-card ${card.highlighted ? 'highlighted' : ''}`}>
            <div className="stat-card-header">
              <div className="stat-icon" style={{ color: card.color }}>
                <card.icon />
              </div>
              <div className={`stat-change ${card.changeType}`}>
                {card.changeType === 'positive' && <FiTrendingUp />}
                {card.changeType === 'negative' && <FiTrendingDown />}
                {card.change}
              </div>
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-title">{card.title}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Booking Trends Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h2>Booking Trends</h2>
              <p className="chart-subtitle">Last 4 Weeks Activity</p>
            </div>
            <div className="growth-badge">
              <FiTrendingUp />
              {stats?.bookings?.change > 0 ? `+${stats.bookings.change}%` : `${stats?.bookings?.change || 0}%`}
            </div>
          </div>
          <div className="chart-container">
            {bookingTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={bookingTrends}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="week" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorBookings)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: '#94a3b8' }}>
                No booking data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="upcoming-bookings">
          <h2>Recent Bookings</h2>
          <div className="bookings-list">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking, index) => (
                <div key={index} className="booking-item" onClick={() => navigate('/bookings')}>
                  <div className="booking-icon">{getServiceIcon(booking.serviceName)}</div>
                  <div className="booking-content">
                    <div className="booking-time">{formatDateTime(booking.createdAt)}</div>
                    <div className="booking-service">{booking.serviceName}</div>
                    <div className="booking-provider">{booking.providerName}</div>
                  </div>
                  <div className="booking-dot"></div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                No recent bookings
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Validations Table */}
      <div className="validations-section">
        <div className="validations-header">
          <h2>Pending Provider Validations</h2>
          {pendingValidations.length > 0 && (
            <button className="view-all-link" onClick={() => navigate('/partners')}>
              View All
            </button>
          )}
        </div>
        <div className="table-container">
          {pendingValidations.length > 0 ? (
            <table className="validations-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Service Type</th>
                  <th>Date Applied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingValidations.slice(0, 5).map((validation) => (
                  <tr key={validation.id}>
                    <td>
                      <div className="provider-info">
                        <div className="provider-avatar-img">
                          {validation.name?.substring(0, 2).toUpperCase() || 'NA'}
                        </div>
                        <span className="provider-name">{validation.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="service-type">{validation.services?.join(', ') || 'N/A'}</td>
                    <td className="date-applied">{formatDate(validation.createdAt)}</td>
                    <td>
                      <span className="status-badge-review">Review Needed</span>
                    </td>
                    <td>
                      <div className="action-icons">
                        <button
                          className="action-icon approve-icon"
                          onClick={() => navigate('/partners')}
                          title="Approve"
                        >
                          <FiCheck />
                        </button>
                        <button
                          className="action-icon reject-icon"
                          onClick={() => navigate('/partners')}
                          title="Reject"
                        >
                          <FiX />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              No pending validations
            </div>
          )}
        </div>
      </div>

      {/* System Status Card */}
      <div className="system-status">
        <div className="status-content">
          <div className="status-header">
            <FiActivity className="status-icon" />
            <div>
              <h3>All Systems Operational</h3>
              <p>Dashboard updated successfully. Total bookings: {stats?.bookings?.total || 0}</p>
            </div>
          </div>
          <div className="status-actions">
            <button className="status-btn outline" onClick={() => navigate('/bookings')}>
              <FiFileText />
              View All Bookings
            </button>
            <button className="status-btn" onClick={() => navigate('/admin-management')}>
              <FiSettings />
              Admin Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
