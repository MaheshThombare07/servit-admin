import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getUser, updateUserStatus } from '../api'
import './UserDetail.css'

export default function UserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockReason, setBlockReason] = useState('')

  async function loadUser() {
    setLoading(true)
    try {
      const data = await getUser(userId)
      setUser(data)
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [userId])

  const handleBlockUnblock = async () => {
    if (user.blocked && !window.confirm('Are you sure you want to unblock this user?')) {
      return
    }
    
    if (!user.blocked && !blockReason.trim()) {
      alert('Please provide a reason for blocking this user.')
      return
    }

    setUpdating(true)
    try {
      await updateUserStatus(userId, !user.blocked, blockReason.trim())
      await loadUser()
      setShowBlockModal(false)
      setBlockReason('')
    } catch (error) {
      console.error('Failed to update user status:', error)
      alert('Failed to update user status. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

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

  if (loading) {
    return (
      <div className="user-detail-page">
        <div className="loading-state">Loading user details...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="user-detail-page">
        <div className="error-state">User not found</div>
      </div>
    )
  }

  return (
    <div className="user-detail-page">
      <div className="page-header">
        <button className="btn back-btn" onClick={() => navigate('/users')}>
          ← Back to Users
        </button>
        <div className="header-actions">
          <span className={`status-badge ${user.blocked ? 'blocked' : 'active'}`}>
            {user.blocked ? 'Blocked' : 'Active'}
          </span>
          <button 
            className="btn"
            onClick={() => navigate(`/users/${userId}/bookings`)}
          >
            View Booking History
          </button>
          <button 
            className={`btn ${user.blocked ? 'btn-success' : 'btn-danger'}`}
            onClick={() => setShowBlockModal(true)}
            disabled={updating}
          >
            {user.blocked ? 'Unblock User' : 'Block User'}
          </button>
        </div>
      </div>

      <div className="user-detail-container">
        <div className="user-card">
          <div className="user-header">
            <div className="user-avatar large">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <h2>{user.name || 'Unknown User'}</h2>
              <p className="user-phone">{user.phoneNumber || 'No phone number'}</p>
            </div>
          </div>

          <div className="user-details">
            <div className="detail-section">
              <h3>Contact Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Phone Number</label>
                  <span>{user.phoneNumber || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Address</label>
                  <span>{user.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Location</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Latitude</label>
                  <span>{user.latitude || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Longitude</label>
                  <span>{user.longitude || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Account Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>User ID</label>
                  <span className="user-id">{user.id}</span>
                </div>
                <div className="detail-item">
                  <label>Created At</label>
                  <span>{formatDate(user.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <label>Last Login</label>
                  <span>{formatDate(user.lastLogin)}</span>
                </div>
                <div className="detail-item">
                  <label>Updated At</label>
                  <span>{formatDate(user.updatedAt)}</span>
                </div>
              </div>
            </div>

            {user.blocked && (
              <div className="detail-section blocked-info">
                <h3>Block Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Blocked At</label>
                    <span>{formatDate(user.blockedAt)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Block Reason</label>
                    <span className="block-reason">{user.blockReason || 'No reason provided'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBlockModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{user.blocked ? 'Unblock User' : 'Block User'}</h3>
              <button className="close-btn" onClick={() => setShowBlockModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {user.blocked ? (
                <p>Are you sure you want to unblock <strong>{user.name}</strong>?</p>
              ) : (
                <div>
                  <p>Are you sure you want to block <strong>{user.name}</strong>?</p>
                  <div className="form-group">
                    <label htmlFor="blockReason">Reason for blocking:</label>
                    <textarea
                      id="blockReason"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Enter reason for blocking this user..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn outline" 
                onClick={() => setShowBlockModal(false)}
                disabled={updating}
              >
                Cancel
              </button>
              <button 
                className={`btn ${user.blocked ? 'btn-success' : 'btn-danger'}`}
                onClick={handleBlockUnblock}
                disabled={updating}
              >
                {updating ? 'Processing...' : (user.blocked ? 'Unblock' : 'Block')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
