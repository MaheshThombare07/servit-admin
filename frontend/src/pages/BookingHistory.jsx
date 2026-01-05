import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUser, getUserBookingHistory } from '../api'
import './BookingHistory.css'

export default function BookingHistory() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [bookingData, setBookingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, completed, cancelled

  async function loadData() {
    setLoading(true)
    try {
      const [userData, bookingHistory] = await Promise.all([
        getUser(userId),
        getUserBookingHistory(userId)
      ])
      setUser(userData)
      setBookingData(bookingHistory)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [userId])

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'danger'
      case 'in-progress':
        return 'info'
      default:
        return 'muted'
    }
  }

  const filteredBookings = bookingData?.bookings?.filter(booking => {
    if (filter === 'all') return true
    return booking.bookingStatus?.toLowerCase() === filter.toLowerCase()
  }) || []

  const renderSubServices = (subServices) => {
    if (!subServices || typeof subServices !== 'object') return []
    
    return Object.entries(subServices).map(([name, details]) => (
      <div key={name} className="sub-service-item">
        <div className="sub-service-name">{name}</div>
        <div className="sub-service-details">
          {details.description && <span className="description">{details.description}</span>}
          <span className="price">₹{details.price} {details.unit || ''}</span>
        </div>
      </div>
    ))
  }

  if (loading) {
    return (
      <div className="booking-history-page">
        <div className="loading-state">Loading booking history...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="booking-history-page">
        <div className="error-state">User not found</div>
      </div>
    )
  }

  return (
    <div className="booking-history-page">
      <div className="page-header">
        <button className="btn back-btn" onClick={() => navigate(`/users/${userId}`)}>
          ← Back to User Details
        </button>
        <div className="header-info">
          <h1>Booking History</h1>
          <span className="user-name">{user.name}</span>
        </div>
      </div>

      {bookingData?.address && (
        <div className="user-address">
          <strong>Service Address:</strong> {bookingData.address}
        </div>
      )}

      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Bookings
        </button>
        <button 
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button 
          className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <h3>No bookings found</h3>
          <p>
            {filter === 'all' 
              ? 'This user has no booking history yet.' 
              : `No ${filter} bookings found.`}
          </p>
        </div>
      ) : (
        <div className="bookings-grid">
          {filteredBookings.map((booking, index) => (
            <div key={booking.bookingId || index} className="booking-card">
              <div className="booking-header">
                <div className="booking-info">
                  <h3>{booking.serviceName || 'Unknown Service'}</h3>
                  <span className={`status-badge ${getStatusColor(booking.bookingStatus)}`}>
                    {booking.bookingStatus || 'Unknown'}
                  </span>
                </div>
                <div className="booking-meta">
                  <div className="booking-id">ID: {booking.bookingId}</div>
                  <div className="booking-date">{formatDate(booking.createdAt)}</div>
                </div>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <label>Customer Name:</label>
                  <span>{booking.userName || 'N/A'}</span>
                </div>
                
                <div className="detail-row">
                  <label>Total Price:</label>
                  <span className="price">₹{booking.totalPrice || 0}</span>
                </div>

                {booking.providerName && (
                  <div className="detail-row">
                    <label>Provider:</label>
                    <span>{booking.providerName}</span>
                  </div>
                )}

                {booking.providerMobileNo && (
                  <div className="detail-row">
                    <label>Provider Mobile:</label>
                    <span>{booking.providerMobileNo || 'N/A'}</span>
                  </div>
                )}
              </div>

              {booking.subServicesSelected && Object.keys(booking.subServicesSelected).length > 0 && (
                <div className="sub-services-section">
                  <h4>Services Selected</h4>
                  <div className="sub-services-list">
                    {renderSubServices(booking.subServicesSelected)}
                  </div>
                </div>
              )}

              {(booking.acceptedAt || booking.serviceStartedAt || booking.arrivedAt || booking.completedAt) && (
                <div className="timeline-section">
                  <h4>Booking Timeline</h4>
                  <div className="timeline">
                    {booking.acceptedAt && (
                      <div className="timeline-item">
                        <span className="timeline-label">Accepted:</span>
                        <span className="timeline-time">{formatDate(booking.acceptedAt)}</span>
                      </div>
                    )}
                    {booking.serviceStartedAt && (
                      <div className="timeline-item">
                        <span className="timeline-label">Started:</span>
                        <span className="timeline-time">{formatDate(booking.serviceStartedAt)}</span>
                      </div>
                    )}
                    {booking.arrivedAt && (
                      <div className="timeline-item">
                        <span className="timeline-label">Arrived:</span>
                        <span className="timeline-time">{formatDate(booking.arrivedAt)}</span>
                      </div>
                    )}
                    {booking.completedAt && (
                      <div className="timeline-item">
                        <span className="timeline-label">Completed:</span>
                        <span className="timeline-time">{formatDate(booking.completedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {booking.jobCoordinates && (
                <div className="coordinates-section">
                  <h4>Job Location</h4>
                  <div className="coordinates">
                    <span>Lat: {booking.jobCoordinates.latitude}</span>
                    <span>Lng: {booking.jobCoordinates.longitude}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
