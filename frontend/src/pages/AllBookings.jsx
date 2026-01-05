import { useEffect, useState } from 'react'
import { getAllBookings, getBookingDetails } from '../api'
import BookingDetailModal from '../components/BookingDetailModal'
import './AllBookings.css'

export default function AllBookings() {
  const [bookings, setBookings] = useState([])
  const [filters, setFilters] = useState({})
  const [availableFilters, setAvailableFilters] = useState({})
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)

  async function loadBookings() {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * pageSize
      const params = { ...filters, limit: pageSize, offset }
      const data = await getAllBookings(params)
      setBookings(data.bookings || [])
      setTotal(data.total || 0)
      setAvailableFilters(data.filters || {})
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [filters, currentPage])

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const handleViewDetails = async (booking) => {
    try {
      const details = await getBookingDetails(booking.bookingId)
      setSelectedBooking(details)
      setShowModal(true)
    } catch (error) {
      console.error('Failed to load booking details:', error)
    }
  }

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
      case 'accepted':
        return 'info'
      case 'cancelled':
        return 'danger'
      case 'in-progress':
        return 'primary'
      default:
        return 'muted'
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="all-bookings-page">
      <div className="page-header">
        <h1>All Bookings</h1>
        <div className="header-info">
          <span className="total-count">{total} Total Bookings</span>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Booking ID</label>
            <input 
              type="text" 
              placeholder="Enter Booking ID"
              value={filters.bookingId || ''} 
              onChange={(e) => handleFilterChange('bookingId', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Service</label>
            <select 
              value={filters.service || ''} 
              onChange={(e) => handleFilterChange('service', e.target.value)}
            >
              <option value="">All Services</option>
              {availableFilters.services?.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>City</label>
            <select 
              value={filters.city || ''} 
              onChange={(e) => handleFilterChange('city', e.target.value)}
            >
              <option value="">All Cities</option>
              {availableFilters.cities?.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Pincode</label>
            <input 
              type="text" 
              placeholder="Enter pincode"
              value={filters.pincode || ''} 
              onChange={(e) => handleFilterChange('pincode', e.target.value)}
              maxLength={6}
            />
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select 
              value={filters.status || ''} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {availableFilters.statuses?.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input 
              type="date" 
              value={filters.startDate ? new Date(filters.startDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value).getTime() : '')}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input 
              type="date" 
              value={filters.endDate ? new Date(filters.endDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value).getTime() + 86400000 - 1 : '')}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn outline" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <h3>No bookings found</h3>
          <p>Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <>
          <div className="bookings-table-container">
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>City</th>
                  <th>Pincode</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.bookingId}>
                    <td className="booking-id-cell">
                      <div className="booking-id-wrapper">
                        <span className="booking-id-text" title={booking.bookingId}>
                          {booking.bookingId}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="customer-info">
                        <div className="name">{booking.userName || 'N/A'}</div>
                        <div className="mobile">{booking.userId || 'N/A'}</div>
                      </div>
                    </td>
                    <td>{booking.serviceName || 'N/A'}</td>
                    <td>
                      <div className="provider-info">
                        <div className="name">
                          {booking.providerInfo?.personalDetails?.name || booking.providerName || 'Not Assigned'}
                        </div>
                        {booking.providerInfo?.personalDetails?.mobileNo && (
                          <div className="mobile">{booking.providerInfo.personalDetails.mobileNo}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(booking.bookingStatus)}`}>
                        {booking.bookingStatus || 'Unknown'}
                      </span>
                    </td>
                    <td className="price">₹{booking.totalPrice || 0}</td>
                    <td>{booking.userCity || 'N/A'}</td>
                    <td>{booking.userPincode || 'N/A'}</td>
                    <td>{formatDate(booking.createdAt)}</td>
                    <td>
                      <button 
                        className="btn btn-sm"
                        onClick={() => handleViewDetails(booking)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn outline" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="btn outline" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showModal && selectedBooking && (
        <BookingDetailModal 
          booking={selectedBooking}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
