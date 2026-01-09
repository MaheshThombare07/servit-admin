import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAllAdmins, toggleAdminStatus } from '../api'
import AdminSkeleton from './AdminSkeleton.jsx'

// Simple cache to avoid unnecessary API calls
let adminCache = null
let cacheTimestamp = 0
const CACHE_DURATION = 30000 // 30 seconds

export default function AdminList({ refreshTrigger }) {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchAdmins = useCallback(async () => {
    const now = Date.now()
    
    // Use cache if fresh
    if (adminCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setAdmins(adminCache)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { admins } = await getAllAdmins()
      adminCache = admins
      cacheTimestamp = now
      setAdmins(admins)
      setError('')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to fetch admins')
    } finally {
      setLoading(false)
    }
  }, [])

  // Optimized status toggle with immediate UI update
  const handleStatusToggle = useCallback(async (adminId, currentStatus) => {
    // Optimistic update
    setAdmins(prev => prev.map(admin => 
      admin.id === adminId 
        ? { ...admin, isActive: !currentStatus }
        : admin
    ))
    
    try {
      await toggleAdminStatus(adminId, !currentStatus)
      // Update cache
      if (adminCache) {
        adminCache = adminCache.map(admin => 
          admin.id === adminId 
            ? { ...admin, isActive: !currentStatus }
            : admin
        )
      }
    } catch (err) {
      // Revert on error
      setAdmins(prev => prev.map(admin => 
        admin.id === adminId 
          ? { ...admin, isActive: currentStatus }
          : admin
      ))
      setError(err?.response?.data?.error || 'Failed to update admin status')
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [refreshTrigger, fetchAdmins])

  // Memoize admin cards to prevent unnecessary re-renders
  const adminCards = useMemo(() => {
    return admins.map(admin => (
      <div key={admin.id} className="admin-card">
        <div className="admin-header">
          <div className="admin-info">
            <h4>{admin.name}</h4>
            <p className="admin-email">{admin.email}</p>
            <p className="admin-mobile">{admin.mobile}</p>
          </div>
          <div className="admin-badge">
            <span className={`role-badge ${admin.role}`}>
              {admin.role === 'super_admin' ? 'Super Admin' : 'Sub Admin'}
            </span>
            <span className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}>
              {admin.isActive ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>
        
        <div className="admin-access">
          <h5>Access Permissions:</h5>
          {admin.access && admin.access.length > 0 ? (
            <div className="access-tags">
              {admin.access.map(access => (
                <span key={access} className="access-tag">
                  {access.replace('_', ' ').toUpperCase()}
                </span>
              ))}
            </div>
          ) : (
            <p className="no-access">No specific access (Super Admin)</p>
          )}
        </div>

        <div className="admin-actions">
          <button
            className={`btn ${admin.isActive ? 'danger' : 'success'}`}
            onClick={() => handleStatusToggle(admin.id, admin.isActive)}
            disabled={admin.role === 'super_admin'} // Prevent disabling super admins
          >
            {admin.isActive ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    ))
  }, [admins, handleStatusToggle])

  if (loading && admins.length === 0) {
    return <AdminSkeleton />
  }

  if (error) {
    return <div className="error-banner">{error}</div>
  }

  if (admins.length === 0 && !loading) {
    return <div className="empty-state">No admins found</div>
  }

  return (
    <div className="admin-list">
      <h3>Existing Admins</h3>
      <div className="admin-grid">
        {adminCards}
      </div>
    </div>
  )
}
