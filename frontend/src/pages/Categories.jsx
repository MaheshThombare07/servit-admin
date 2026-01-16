import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { createCategory, getCategories, toggleCategory } from '../api'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import './Categories.css'

export default function Categories() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [cache, setCache] = useState(new Map())
  const [lastLoadTime, setLastLoadTime] = useState(0)

  // Cache data for 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000

  const load = useCallback(async (forceRefresh = false) => {
    const now = Date.now()
    const cacheKey = 'categories'
    const cached = cache.get(cacheKey)

    // Return cached data if fresh and not forcing refresh
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setItems(cached.data)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await getCategories()
      const ordered = data.sort((a,b)=> a.id.localeCompare(b.id))
      setItems(ordered)
      
      // Update cache
      setCache(prev => new Map(prev.set(cacheKey, {
        data: ordered,
        timestamp: now
      })))
      setLastLoadTime(now)
    } finally { 
      setLoading(false) 
    }
  }, [cache])

  useEffect(()=>{ load() }, [load])

  async function onCreate(cat) {
    setCreating(true)
    try {
      const newCategory = await createCategory(cat)
      // Add to state immediately instead of reloading
      setItems(prev => [...prev, newCategory].sort((a,b)=> a.id.localeCompare(b.id)))
      
      // Clear cache to force refresh next time
      setCache(prev => {
        const newCache = new Map(prev)
        newCache.delete('categories')
        return newCache
      })
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
      
      // Clear cache to force refresh next time
      setCache(prev => {
        const newCache = new Map(prev)
        newCache.delete('categories')
        return newCache
      })
    } catch (error) {
      console.error('Failed to toggle category status:', error)
    }
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Categories</h1>
        </div>
        <div className="header-actions">
          <button className="btn outline" onClick={() => load(true)} disabled={loading}>
            {loading ? <LoadingSpinner size="small" /> : 'Refresh'}
          </button>
          <button className="btn" disabled={creating} onClick={()=> onCreate('men')}>
            {creating ? <LoadingSpinner size="small" /> : 'Create Men'}
          </button>
          <button className="btn" disabled={creating} onClick={()=> onCreate('women')}>
            Create Women
          </button>
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
