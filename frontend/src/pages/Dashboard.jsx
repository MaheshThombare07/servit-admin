import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { FiUsers, FiUserCheck, FiAlertTriangle, FiCalendar, FiSearch, FiBell, FiTrendingUp, FiTrendingDown, FiCheck, FiX, FiActivity, FiSettings, FiFileText } from 'react-icons/fi'

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('')

  // Sample data for the chart
  const bookingData = [
    { week: 'Week 1', bookings: 320 },
    { week: 'Week 2', bookings: 380 },
    { week: 'Week 3', bookings: 420 },
    { week: 'Week 4', bookings: 432 }
  ]

  // Sample data for upcoming bookings
  const upcomingBookings = [
    { time: 'Today 10:00 AM', service: 'House Cleaning', provider: 'CleanCo Ltd', icon: '🏠' },
    { time: 'Today 2:30 PM', service: 'Plumbing Repair', provider: 'Mario Bros', icon: '🔧' },
    { time: 'Tomorrow 9:00 AM', service: 'Electrical Inspection', provider: 'Volts & Amps', icon: '⚡' },
    { time: 'Tomorrow 11:30 AM', service: 'Gardening Service', provider: 'Green Thumb', icon: '🌱' }
  ]

  // Sample data for pending validations
  const pendingValidations = [
    { id: 1, name: 'John Smith', avatar: 'JS', service: 'Plumbing', date: 'Oct 24, 2023', status: 'Review Needed' },
    { id: 2, name: 'Sarah Connor', avatar: 'SC', service: 'Electrician', date: 'Oct 23, 2023', status: 'Review Needed' },
    { id: 3, name: 'Michael Doe', avatar: 'MD', service: 'Cleaning', date: 'Oct 22, 2023', status: 'Review Needed' }
  ]

  const statCards = [
    {
      title: 'Total Users',
      value: '12,304',
      change: '+12%',
      changeType: 'positive',
      icon: FiUsers,
      color: '#3b82f6'
    },
    {
      title: 'Total Providers',
      value: '845',
      change: '+5%',
      changeType: 'positive',
      icon: FiUserCheck,
      color: '#8b5cf6'
    },
    {
      title: 'Pending Validations',
      value: '12',
      change: 'Needs Attention',
      changeType: 'warning',
      icon: FiAlertTriangle,
      color: '#f59e0b',
      highlighted: true
    },
    {
      title: 'Monthly Bookings',
      value: '432',
      change: '-3%',
      changeType: 'negative',
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
              <p className="chart-subtitle">Last 30 Days Activity</p>
            </div>
            <div className="growth-badge">
              <FiTrendingUp />
              +8.5%
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={bookingData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
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
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="upcoming-bookings">
          <h2>Upcoming Bookings</h2>
          <div className="bookings-list">
            {upcomingBookings.map((booking, index) => (
              <div key={index} className="booking-item">
                <div className="booking-icon">{booking.icon}</div>
                <div className="booking-content">
                  <div className="booking-time">{booking.time}</div>
                  <div className="booking-service">{booking.service}</div>
                  <div className="booking-provider">{booking.provider}</div>
                </div>
                <div className="booking-dot"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Validations Table */}
      <div className="validations-section">
        <h2>Pending Provider Validations</h2>
        <div className="table-container">
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
              {pendingValidations.map((validation) => (
                <tr key={validation.id}>
                  <td>
                    <div className="provider-info">
                      <div className="provider-avatar">{validation.avatar}</div>
                      <span>{validation.name}</span>
                    </div>
                  </td>
                  <td>{validation.service}</td>
                  <td>{validation.date}</td>
                  <td>
                    <span className="status-badge review">{validation.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn approve">
                        <FiCheck />
                      </button>
                      <button className="action-btn reject">
                        <FiX />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Status Card */}
      <div className="system-status">
        <div className="status-content">
          <div className="status-header">
            <FiActivity className="status-icon" />
            <div>
              <h3>All Systems Operational</h3>
              <p>Server load is normal. Last backup completed successfully at 04:00 AM.</p>
            </div>
          </div>
          <div className="status-actions">
            <button className="status-btn outline">
              <FiFileText />
              View Logs
            </button>
            <button className="status-btn">
              <FiSettings />
              Server Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
