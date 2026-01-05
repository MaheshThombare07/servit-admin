import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getUsers } from '../api'
import './Users.css'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, blocked, active
  const [searchTerm, setSearchTerm] = useState('')

  async function loadUsers() {
    setLoading(true)
    try {
      const blocked = filter === 'blocked' ? true : filter === 'active' ? false : undefined
      const data = await getUsers(blocked)
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [filter])

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber?.includes(searchTerm) ||
    user.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Users Management</h1>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Users
        </button>
        <button 
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active Users
        </button>
        <button 
          className={`filter-btn ${filter === 'blocked' ? 'active' : ''}`}
          onClick={() => setFilter('blocked')}
        >
          Blocked Users
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <h3>No users found</h3>
          <p>Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Address</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className={user.blocked ? 'blocked-row' : ''}>
                  <td className="user-name">
                    <div className="user-avatar">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span>{user.name || 'Unknown'}</span>
                  </td>
                  <td>{user.phoneNumber || 'N/A'}</td>
                  <td className="address-cell">
                    <div title={user.address}>
                      {user.address ? (user.address.length > 30 ? user.address.substring(0, 30) + '...' : user.address) : 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${user.blocked ? 'blocked' : 'active'}`}>
                      {user.blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td>{formatDate(user.lastLogin)}</td>
                  <td>
                    <Link to={`/users/${user.id}`} className="btn btn-sm">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
