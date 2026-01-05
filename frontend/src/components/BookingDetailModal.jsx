import './BookingDetailModal.css'

export default function BookingDetailModal({ booking, onClose }) {
  if (!booking) return null

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
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

  const renderSubServices = (subServices) => {
    if (!subServices || typeof subServices !== 'object') return []
    
    return Object.entries(subServices).map(([name, details]) => (
      <div key={name} className="sub-service-item">
        <div className="sub-service-header">
          <h4>{name}</h4>
          <span className="price">₹{details.price} {details.unit || ''}</span>
        </div>
        {details.description && (
          <p className="description">{details.description}</p>
        )}
      </div>
    ))
  }

  const bookingData = booking.booking
  const providerData = booking.providerInfo
  const userData = booking.userInfo

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal booking-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Booking Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Booking Overview */}
          <div className="section">
            <h3>Booking Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Booking ID</label>
                <span className="booking-id">{bookingData.bookingId}</span>
              </div>
              <div className="info-item">
                <label>Status</label>
                <span className={`status-badge ${getStatusColor(bookingData.bookingStatus)}`}>
                  {bookingData.bookingStatus}
                </span>
              </div>
              <div className="info-item">
                <label>Service</label>
                <span>{bookingData.serviceName}</span>
              </div>
              <div className="info-item">
                <label>Total Price</label>
                <span className="price">₹{bookingData.totalPrice}</span>
              </div>
              <div className="info-item">
                <label>Created At</label>
                <span>{formatDate(bookingData.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="section">
            <h3>Customer Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <span>{bookingData.userName || userData?.userName || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Mobile</label>
                <span>{bookingData.userId || userData?.mobileNo || 'N/A'}</span>
              </div>
              <div className="info-item full-width">
                <label>Address</label>
                <span>{bookingData.userAddress || userData?.address || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>City</label>
                <span>{bookingData.userCity || 'N/A'}</span>
              </div>
              <div className="info-item">
                <label>Pincode</label>
                <span>{bookingData.userPincode || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Provider Information */}
          {providerData ? (
            <div className="section">
              <h3>Provider Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name</label>
                  <span>{providerData.personalDetails?.name || bookingData.providerName || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Mobile</label>
                  <span>{providerData.personalDetails?.mobileNo || bookingData.providerMobileNo || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <span>{providerData.email || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Verification Status</label>
                  <span className={`status-badge ${providerData.verificationDetails?.verified ? 'success' : 'warning'}`}>
                    {providerData.verificationDetails?.verified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="info-item">
                  <label>Service Radius</label>
                  <span>{providerData.serviceRadius || 'N/A'} km</span>
                </div>
                <div className="info-item">
                  <label>Main Service</label>
                  <span>{providerData.selectedMainService || 'N/A'}</span>
                </div>
                <div className="info-item full-width">
                  <label>Address</label>
                  <span>{providerData.address || providerData.locationDetails?.address || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>City</label>
                  <span>{providerData.city || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Pincode</label>
                  <span>{providerData.personalDetails?.pincode || 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="section">
              <h3>Provider Information</h3>
              <div className="provider-not-assigned">
                <div className="not-assigned-icon">👤</div>
                <div className="not-assigned-text">Provider not assigned</div>
                <div className="not-assigned-description">
                  This booking has not been assigned to any service provider yet.
                </div>
              </div>
            </div>
          )}

          {/* Services Selected */}
          {bookingData.subServicesSelected && Object.keys(bookingData.subServicesSelected).length > 0 && (
            <div className="section">
              <h3>Services Selected</h3>
              <div className="sub-services-list">
                {renderSubServices(bookingData.subServicesSelected)}
              </div>
            </div>
          )}

          {/* Timeline */}
          {(bookingData.acceptedAt || bookingData.serviceStartedAt || bookingData.arrivedAt || bookingData.completedAt) && (
            <div className="section">
              <h3>Booking Timeline</h3>
              <div className="timeline">
                {bookingData.acceptedAt && (
                  <div className="timeline-item">
                    <div className="timeline-dot accepted"></div>
                    <div className="timeline-content">
                      <div className="timeline-label">Accepted</div>
                      <div className="timeline-time">{formatDate(bookingData.acceptedAt)}</div>
                      {bookingData.acceptedByProviderId && (
                        <div className="timeline-detail">Provider ID: {bookingData.acceptedByProviderId}</div>
                      )}
                    </div>
                  </div>
                )}
                {bookingData.serviceStartedAt && (
                  <div className="timeline-item">
                    <div className="timeline-dot started"></div>
                    <div className="timeline-content">
                      <div className="timeline-label">Service Started</div>
                      <div className="timeline-time">{formatDate(bookingData.serviceStartedAt)}</div>
                    </div>
                  </div>
                )}
                {bookingData.arrivedAt && (
                  <div className="timeline-item">
                    <div className="timeline-dot arrived"></div>
                    <div className="timeline-content">
                      <div className="timeline-label">Arrived</div>
                      <div className="timeline-time">{formatDate(bookingData.arrivedAt)}</div>
                    </div>
                  </div>
                )}
                {bookingData.completedAt && (
                  <div className="timeline-item">
                    <div className="timeline-dot completed"></div>
                    <div className="timeline-content">
                      <div className="timeline-label">Completed</div>
                      <div className="timeline-time">{formatDate(bookingData.completedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Job Location */}
          {bookingData.jobCoordinates && (
            <div className="section">
              <h3>Job Location</h3>
              <div className="location-content">
                <div className="coordinates">
                  <div className="coordinate-item">
                    <label>Latitude</label>
                    <span>{bookingData.jobCoordinates.latitude}</span>
                  </div>
                  <div className="coordinate-item">
                    <label>Longitude</label>
                    <span>{bookingData.jobCoordinates.longitude}</span>
                  </div>
                </div>
                <div className="map-container">
                  <div className="map-wrapper">
                    <iframe
                      title="Job Location Map"
                      width="100%"
                      height="300"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bookingData.jobCoordinates.longitude - 0.01},${bookingData.jobCoordinates.latitude - 0.01},${bookingData.jobCoordinates.longitude + 0.01},${bookingData.jobCoordinates.latitude + 0.01}&layer=mapnik&marker=${bookingData.jobCoordinates.latitude},${bookingData.jobCoordinates.longitude}`}
                    />
                    <div className="map-link">
                      <a
                        href={`https://www.google.com/maps?q=${bookingData.jobCoordinates.latitude},${bookingData.jobCoordinates.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
