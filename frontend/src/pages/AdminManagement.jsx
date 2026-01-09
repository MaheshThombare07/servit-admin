import { useEffect, useState } from 'react'
import { createAdminUser } from '../api'
import AdminList from './AdminList.jsx'
import './AdminManagement.css'

const ACCESS_OPTIONS = [
  { id: 'categories', label: 'Categories Management', description: 'Manage service categories' },
  { id: 'partners', label: 'Partners Management', description: 'Manage service partners' },
  { id: 'users', label: 'Users Management', description: 'Manage customers' },
  { id: 'bookings', label: 'Bookings Management', description: 'Manage all bookings' },
  { id: 'reviews', label: 'Reviews Management', description: 'Manage reviews and ratings' },
  { id: 'reports', label: 'Reports & Analytics', description: 'View reports and analytics' },
  { id: 'settings', label: 'Settings', description: 'Manage system settings' }
]

export default function AdminManagement() {
  const [showPassword, setShowPassword] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    role: 'sub_admin',
    access: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function handleAccessToggle(accessId) {
    setFormData(prev => ({
      ...prev,
      access: prev.access.includes(accessId)
        ? prev.access.filter(id => id !== accessId)
        : [...prev.access, accessId]
    }))
  }

  function handleRoleChange(role) {
    setFormData(prev => ({
      ...prev,
      role,
      access: role === 'super_admin' ? ACCESS_OPTIONS.map(opt => opt.id) : []
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await createAdminUser(formData)
      setSuccess('Admin created successfully!')
      setFormData({
        name: '',
        email: '',
        password: '',
        mobile: '',
        role: 'sub_admin',
        access: []
      })
      // Trigger refresh of admin list
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-management-page">
      <div className="page-header">
        <h1>Admin Management</h1>
        <p>Create and manage admin accounts with specific access permissions</p>
      </div>

      <div className="admin-form-container">
        <form onSubmit={handleSubmit} className="admin-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile Number</label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loading}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Role Selection</h3>
            <div className="role-selection">
              <label className="radio-option">
                <input
                  type="radio"
                  name="role"
                  value="super_admin"
                  checked={formData.role === 'super_admin'}
                  onChange={() => handleRoleChange('super_admin')}
                  disabled={loading}
                />
                <div className="radio-content">
                  <span className="role-title">Super Admin</span>
                  <span className="role-description">Full access to all features and settings</span>
                </div>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="role"
                  value="sub_admin"
                  checked={formData.role === 'sub_admin'}
                  onChange={() => handleRoleChange('sub_admin')}
                  disabled={loading}
                />
                <div className="radio-content">
                  <span className="role-title">Sub Admin</span>
                  <span className="role-description">Limited access to specific features</span>
                </div>
              </label>
            </div>
          </div>

          {formData.role === 'sub_admin' && (
            <div className="form-section">
              <h3>Access Permissions</h3>
              <div className="access-options">
                {ACCESS_OPTIONS.map(option => (
                  <label key={option.id} className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.access.includes(option.id)}
                      onChange={() => handleAccessToggle(option.id)}
                      disabled={loading}
                    />
                    <div className="checkbox-content">
                      <span className="access-title">{option.label}</span>
                      <span className="access-description">{option.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Creating Admin...' : 'Create Admin Account'}
            </button>
          </div>
        </form>
      </div>

      <AdminList refreshTrigger={refreshTrigger} />
    </div>
  )
}
