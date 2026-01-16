import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { getPartners, getPartner, verifyPartner, rejectPartner } from '../api'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import './Partners.css'

export default function Partners() {
  const navigate = useNavigate()
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending_verification') // pending_verification, verified, rejected
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectForm, setRejectForm] = useState({ rejectionReason: '', remark: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [zoomedImage, setZoomedImage] = useState(null)
  const [lastLoadTime, setLastLoadTime] = useState(0)
  const [cache, setCache] = useState(new Map()) // Simple in-memory cache
  const [searchQuery, setSearchQuery] = useState('') // Search filter

  // Cache data for 5 minutes to prevent unnecessary reloads
  const CACHE_DURATION = 5 * 60 * 1000

  const load = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    const cacheKey = `partners_${filter}`
    const cached = cache.get(cacheKey)

    // Return cached data if fresh and not forcing refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setPartners(cached.data)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await getPartners(filter === 'all' ? null : filter)
      setPartners(data)

      // Update cache
      setCache(prev => new Map(prev.set(cacheKey, {
        data,
        timestamp: now
      })))
      setLastLoadTime(now)
    } finally {
      setLoading(false)
    }
  }, [filter, cache])

  useEffect(() => {
    load()
  }, [load])

  // Debug: Log partner data when selected
  useEffect(() => {
    if (selectedPartner) {
      console.log('Selected Partner Data:', selectedPartner)
      console.log('AADHAAR_FRONT:', selectedPartner.AADHAAR_FRONT)
      console.log('AADHAAR_BACK:', selectedPartner.AADHAAR_BACK)
      console.log('All keys:', Object.keys(selectedPartner))
    }
  }, [selectedPartner])

  async function handleVerify(partnerId, remark = '') {
    if (!confirm('Are you sure you want to verify this partner?')) return

    setActionLoading(true)
    try {
      await verifyPartner(partnerId, remark)

      // Optimistic update - remove from list immediately
      setPartners(prev => prev.filter(p => p.id !== partnerId))

      // Clear cache to force refresh next time
      setCache(prev => {
        const newCache = new Map(prev)
        newCache.delete(`partners_${filter}`)
        return newCache
      })

      if (selectedPartner?.id === partnerId) {
        setSelectedPartner(null)
      }
    } catch (error) {
      alert('Error verifying partner: ' + (error.response?.data?.error || error.message))
      // Reload on error to revert optimistic update
      await load(true)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject(partnerId) {
    if (!rejectForm.rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setActionLoading(true)
    try {
      await rejectPartner(partnerId, rejectForm.rejectionReason, rejectForm.remark)
      setShowRejectModal(false)
      setRejectForm({ rejectionReason: '', remark: '' })

      // Optimistic update - remove from list immediately
      setPartners(prev => prev.filter(p => p.id !== partnerId))

      // Clear cache to force refresh next time
      setCache(prev => {
        const newCache = new Map(prev)
        newCache.delete(`partners_${filter}`)
        return newCache
      })

      if (selectedPartner?.id === partnerId) {
        setSelectedPartner(null)
      }
    } catch (error) {
      alert('Error rejecting partner: ' + (error.response?.data?.error || error.message))
      // Reload on error to revert optimistic update
      await load(true)
    } finally {
      setActionLoading(false)
    }
  }

  function openRejectModal(partner) {
    setSelectedPartner(partner)
    setRejectForm({ rejectionReason: '', remark: '' })
    setShowRejectModal(true)
  }

  function formatDate(timestamp) {
    if (!timestamp) return 'N/A'

    // Handle Firestore timestamp object
    if (timestamp && typeof timestamp === 'object' && timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleString()
    }

    // Handle Unix timestamp (number)
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleString()
    }

    // Handle string date
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString()
    }

    return 'N/A'
  }

  return (
    <div className="partners-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Partner Verification</h1>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'pending_verification' ? 'active' : ''}`}
              onClick={() => setFilter('pending_verification')}
            >
              Pending
            </button>
            <button
              className={`filter-tab ${filter === 'verified' ? 'active' : ''}`}
              onClick={() => setFilter('verified')}
            >
              Verified
            </button>
            <button
              className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </button>
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
          </div>
        </div>
        <div className="header-actions">
          <div className="search-bar-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              className="search-bar"
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="btn outline"
            onClick={() => load(true)}
            disabled={loading}
          >
            {loading ? <LoadingSpinner size="small" /> : 'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <LoadingSpinner size="large" />
          <p>Loading partners...</p>
        </div>
      ) : partners.length === 0 ? (
        <div className="empty-state">
          <h3>No Partners Found</h3>
          <p>No partners match the selected filter</p>
        </div>
      ) : (
        <div className="partners-container">
          <div className="partners-grid">
            {partners
              .filter(p => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                const name = (p.personalDetails?.fullName || p.fullName || '').toLowerCase();
                const email = (p.email || '').toLowerCase();
                return name.includes(query) || email.includes(query);
              })
              .map(partner => (
                <div
                  key={partner.id}
                  className={`partner-card ${selectedPartner?.id === partner.id ? 'selected' : ''}`}
                  onClick={() => navigate(`/partners/${partner.id}`)}
                >
                  <div className="partner-card-header">
                    <div className="partner-avatar">
                      {partner?.profilePhotoUrl && (
                        <img
                          src={partner.profilePhotoUrl}
                          alt={partner.personalDetails?.fullName || 'Partner'}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      )}
                      <div
                        className="avatar-placeholder"
                        style={{ display: partner?.profilePhotoUrl ? 'none' : 'flex' }}
                      >
                        {(partner.personalDetails?.fullName || partner.fullName || 'P')[0]?.toUpperCase() || 'P'}
                      </div>
                    </div>
                    <div className="partner-info">
                      <div className="partner-name">{partner.personalDetails?.fullName || partner.fullName || 'N/A'}</div>
                      <div className="partner-email">{partner.email || 'N/A'}</div>
                      <div className="partner-phone">{partner.personalDetails?.mobileNo || partner.personalDetails?.phoneNumber || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="partner-card-footer">
                    <div className={`status-badge ${partner.status || 'pending'}`}>
                      {partner.status || 'pending_verification'}
                    </div>
                    {partner.services && (
                      <div className="partner-services">
                        {partner.services.slice(0, 3).map(s => (
                          <span key={s} className="service-tag">{s}</span>
                        ))}
                        {partner.services.length > 3 && <span className="service-tag">+{partner.services.length - 3}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {selectedPartner && (
            <div className="partner-details">
              <div className="details-header">
                <h2>Partner Details</h2>
                <button className="icon-btn" onClick={() => setSelectedPartner(null)}>✕</button>
              </div>

              {/* Large Profile Header - Like mockup */}
              <div className="profile-header">
                <div className="profile-header-left">
                  <div className="profile-avatar-large">
                    {selectedPartner?.profilePhotoUrl ? (
                      <img
                        src={selectedPartner.profilePhotoUrl}
                        alt={selectedPartner.personalDetails?.fullName || 'Partner'}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const placeholder = e.target.nextElementSibling;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="avatar-placeholder-large"
                      style={{ display: selectedPartner?.profilePhotoUrl ? 'none' : 'flex' }}
                    >
                      {(selectedPartner.personalDetails?.fullName || selectedPartner.fullName || 'P')[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="online-indicator"></div>
                  </div>
                  <div className="profile-header-info">
                    <h1 className="profile-name">{selectedPartner.personalDetails?.fullName || selectedPartner.fullName || 'N/A'}</h1>
                    <div className="profile-meta">
                      {selectedPartner.services && selectedPartner.services.length > 0 && (
                        <>
                          <span className="profile-service">⚡ {selectedPartner.services[0]}</span>
                          <span className="profile-divider">•</span>
                        </>
                      )}
                      <span className="profile-id">ID: {selectedPartner.id?.substring(0, 8).toUpperCase() || 'N/A'}</span>
                    </div>
                    <div className={`profile-status-badge ${selectedPartner.status || 'pending_verification'}`}>
                      {selectedPartner.status === 'pending_verification' ? '● Pending Review' :
                        selectedPartner.status === 'verified' ? '● Verified' :
                          selectedPartner.status === 'rejected' ? '● Rejected' : '● Pending Review'}
                    </div>
                  </div>
                </div>
                <div className="profile-header-actions">
                  <button className="btn-header outline">
                    <span>✉</span> Message
                  </button>
                  <button className="btn-header outline">
                    <span>🕐</span> History
                  </button>
                </div>
              </div>

              <div className="details-content">
                {/* Debug: Show raw data structure */}
                {process.env.NODE_ENV === 'development' && (
                  <details style={{ marginBottom: '16px', padding: '8px', background: 'var(--panel)', borderRadius: '4px' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--muted)' }}>Debug: View Raw Data</summary>
                    <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '200px', marginTop: '8px' }}>
                      {JSON.stringify(selectedPartner, null, 2)}
                    </pre>
                  </details>
                )}
                {/* Personal Details */}
                <div className="details-section">
                  <h3>Personal Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Full Name</label>
                      <div>{selectedPartner.personalDetails?.fullName || selectedPartner.fullName || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Email</label>
                      <div>{selectedPartner.email || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Phone Number</label>
                      <div>{selectedPartner.personalDetails?.mobileNo || selectedPartner.personalDetails?.phoneNumber || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Gender</label>
                      <div>{selectedPartner.personalDetails?.gender || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Pincode</label>
                      <div>{selectedPartner?.pincode || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Registered At</label>
                      <div>{formatDate(selectedPartner.createdAt)}</div>
                    </div>
                  </div>
                  {selectedPartner.profilePhotoUrl && (
                    <div className="detail-item full-width">
                      <label>Profile Image</label>
                      <div className="image-container">
                        <img
                          src={selectedPartner.profilePhotoUrl}
                          alt="Profile"
                          className="detail-image profile-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="image-error" style={{ display: 'none' }}>
                          Failed to load image
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Details */}
                <div className="details-section">
                  <h3>Location Information</h3>
                  <div className="details-grid">
                    <div className="detail-item full-width">
                      <label>Address</label>
                      <div>{selectedPartner.address || selectedPartner.locationDetails?.address || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <label>City</label>
                      <div>{selectedPartner.city || selectedPartner.locationDetails?.city || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <label>State</label>
                      <div>{selectedPartner.state || selectedPartner.locationDetails?.state || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Pincode</label>
                      <div>{selectedPartner?.pincode || selectedPartner?.pincode || 'N/A'}</div>
                    </div>
                    <div className="detail-item">
                      <label>Service Radius</label>
                      <div>{selectedPartner.serviceRadius || 'N/A'} km</div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="details-section">
                  <h3>Documents</h3>
                  {(() => {
                    // Try multiple possible field names/locations
                    // Check for both null/undefined and empty strings
                    const getField = (obj, ...paths) => {
                      for (const path of paths) {
                        const value = path.split('.').reduce((o, p) => o?.[p], obj);
                        if (value && typeof value === 'string' && value.trim() !== '') {
                          return value;
                        }
                      }
                      return null;
                    };

                    const aadhaarFront = getField(
                      selectedPartner,
                      'aadhaarFrontUrl',
                      'aadhaarFront',
                      'aadhaar_front',
                      'documents.aadhaarFrontUrl',
                      'documents.aadhaarFront'
                    );

                    const aadhaarBack = getField(
                      selectedPartner,
                      'aadhaarBackUrl',
                      'aadhaarBack',
                      'aadhaar_back',
                      'documents.aadhaarBackUrl',
                      'documents.aadhaarBack'
                    );

                    if (!aadhaarFront && !aadhaarBack) {
                      return (
                        <div className="empty-text">
                          No documents uploaded
                          {process.env.NODE_ENV === 'development' && (
                            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted)' }}>
                              Debug: aadhaarFrontUrl = {String(selectedPartner.aadhaarFrontUrl)},
                              aadhaarBackUrl = {String(selectedPartner.aadhaarBackUrl)}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="documents-grid">
                        {aadhaarFront && (
                          <div className="document-item">
                            <label>Aadhaar Front</label>
                            <div
                              className="document-image-wrapper"
                              onClick={() => setZoomedImage(aadhaarFront)}
                              style={{ cursor: 'pointer' }}
                            >
                              <img
                                src={aadhaarFront}
                                alt="Aadhaar Front"
                                className="document-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const errorDiv = e.target.nextElementSibling;
                                  if (errorDiv) errorDiv.style.display = 'flex';
                                }}
                              />
                              <div className="image-error" style={{ display: 'none' }}>
                                Failed to load image
                              </div>
                              <div className="zoom-hint">Click to zoom</div>
                            </div>
                            <a href={aadhaarFront} target="_blank" rel="noopener noreferrer" className="view-link">
                              View Full Size
                            </a>
                          </div>
                        )}
                        {aadhaarBack && (
                          <div className="document-item">
                            <label>Aadhaar Back</label>
                            <div
                              className="document-image-wrapper"
                              onClick={() => setZoomedImage(aadhaarBack)}
                              style={{ cursor: 'pointer' }}
                            >
                              <img
                                src={aadhaarBack}
                                alt="Aadhaar Back"
                                className="document-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const errorDiv = e.target.nextElementSibling;
                                  if (errorDiv) errorDiv.style.display = 'flex';
                                }}
                              />
                              <div className="image-error" style={{ display: 'none' }}>
                                Failed to load image
                              </div>
                              <div className="zoom-hint">Click to zoom</div>
                            </div>
                            <a href={aadhaarBack} target="_blank" rel="noopener noreferrer" className="view-link">
                              View Full Size
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Services & Sub-Services */}
                <div className="details-section">
                  <h3>Services & Pricing</h3>
                  {selectedPartner.services && selectedPartner.services.length > 0 ? (
                    <div className="services-list">
                      {selectedPartner.services.map(service => (
                        <div key={service} className="service-item">
                          <div className="service-name">{service}</div>
                          {selectedPartner.subServices?.[service] && (
                            <div className="subservices-list">
                              {selectedPartner.subServices[service].map(subService => {
                                const pricing = selectedPartner.subServicePrices?.[service]?.[subService]
                                return (
                                  <div key={subService} className="subservice-item">
                                    <span className="subservice-name">{subService}</span>
                                    {pricing && (
                                      <span className="subservice-price">
                                        ₹{pricing.minPrice} - ₹{pricing.maxPrice}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-text">No services added</div>
                  )}
                </div>

                {/* Verification Details */}
                <div className="details-section">
                  <h3>Verification Status</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>Status</label>
                      <div className={`status-badge ${selectedPartner.status || 'pending_verification'}`}>
                        {selectedPartner.status || 'pending_verification'}
                      </div>
                    </div>
                    {selectedPartner.verificationDetails?.verified && (
                      <>
                        <div className="detail-item">
                          <label>Verified At</label>
                          <div>{formatDate(selectedPartner.verificationDetails?.verifiedAt)}</div>
                        </div>
                        <div className="detail-item">
                          <label>Verified By</label>
                          <div>{selectedPartner.verificationDetails?.verifiedBy || 'N/A'}</div>
                        </div>
                      </>
                    )}
                    {selectedPartner.verificationDetails?.rejected && (
                      <>
                        <div className="detail-item full-width">
                          <label>Rejection Reason</label>
                          <div>{selectedPartner.verificationDetails?.rejectionReason || 'N/A'}</div>
                        </div>
                      </>
                    )}
                    {selectedPartner.verificationDetails?.remark && (
                      <div className="detail-item full-width">
                        <label>Remark</label>
                        <div>{selectedPartner.verificationDetails.remark}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {selectedPartner.status === 'pending_verification' && (
                  <div className="details-actions">
                    <button
                      className="btn success"
                      onClick={() => handleVerify(selectedPartner.id)}
                      disabled={actionLoading}
                    >
                      ✓ Verify Partner
                    </button>
                    <button
                      className="btn danger outline"
                      onClick={() => openRejectModal(selectedPartner)}
                      disabled={actionLoading}
                    >
                      ✕ Reject Partner
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="modal-overlay" onClick={() => setZoomedImage(null)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setZoomedImage(null)}>✕</button>
            <img src={zoomedImage} alt="Zoomed document" className="zoomed-image" />
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPartner && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reject Partner</h2>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <form className="modal-form" onSubmit={(e) => { e.preventDefault(); handleReject(selectedPartner.id); }}>
              <div className="form-group">
                <label>
                  Rejection Reason *
                  <input
                    type="text"
                    value={rejectForm.rejectionReason}
                    onChange={(e) => setRejectForm(f => ({ ...f, rejectionReason: e.target.value }))}
                    placeholder="Enter rejection reason"
                    required
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  Additional Remark
                  <textarea
                    value={rejectForm.remark}
                    onChange={(e) => setRejectForm(f => ({ ...f, remark: e.target.value }))}
                    placeholder="Optional additional notes"
                    rows="3"
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn outline" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn danger" disabled={actionLoading}>
                  Reject Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

