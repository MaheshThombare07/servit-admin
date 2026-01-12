import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createCategory, getCategories, toggleCategory } from '../api'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import './Categories.css'

export default function Categories() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await getCategories()
      const ordered = data.sort((a,b)=> a.id.localeCompare(b.id))
      setItems(ordered)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  async function onCreate(cat) {
    setCreating(true)
    try {
      const newCategory = await createCategory(cat)
      // Add to state immediately instead of reloading
      setItems(prev => [...prev, newCategory].sort((a,b)=> a.id.localeCompare(b.id)))
    } finally { 
      setCreating(false) 
    }
  }

  async function onToggleStatus(categoryId, currentStatus) {
    try {
      await toggleCategory(categoryId, !currentStatus)
      // Update state immediately instead of reloading
      setItems(prev => prev.map(item => 
        item.id === categoryId ? { ...item, isActive: !currentStatus } : item
      ))
    } catch (error) {
      console.error('Failed to toggle category status:', error)
    }
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <h1>Categories</h1>
        <div className="actions">
          <button className="btn" disabled={creating} onClick={()=> onCreate('men')}>Create Men</button>
          <button className="btn" disabled={creating} onClick={()=> onCreate('women')}>Create Women</button>
        </div>
      </div>
      {loading ? (
        <div className="loading-state">
          <LoadingSpinner size="large" />
          <p>Loading categories...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No Categories Yet</h3>
          <p>Create your first category to get started</p>
        </div>
      ) : (
        <div className="categories-grid">
          {items.map(it => (
            <div className="category-card" key={it.id}>
              <div className="card-header">
                <div>
                  <div className="card-title">{it.category}</div>
                  <div className="card-subtitle">{it.id}</div>
                </div>
                <div className={`badge ${it.isActive? 'success':'danger'}`}>
                  {it.isActive? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="card-actions">
                <Link className="btn" to={`/categories/${it.id}`}>Open Services</Link>
                <button 
                  className="btn outline" 
                  onClick={() => onToggleStatus(it.id, it.isActive)}
                >
                  {it.isActive? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
