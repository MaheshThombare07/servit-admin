import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createService, deleteService, getServices } from '../api'
import './Services.css'

export default function Services() {
  const { categoryId } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '', icon: '', isActive: true })
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await getServices(categoryId)
      setItems(data)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [categoryId])

  async function onCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      await createService(categoryId, { ...form, subServices: [] })
      setForm({ name: '', description: '', icon: '', isActive: true })
      await load()
    } finally { setSubmitting(false) }
  }

  return (
    <div className="services-page">
      <div className="page-header">
        <h1>Services - {categoryId}</h1>
        <Link to="/" className="btn outline">Back</Link>
      </div>

      <div className="service-form-card">
        <div className="card-title">Add Service</div>
        <form className="form" onSubmit={onCreate}>
          <div className="form-grid">
            <label>
              Name
              <input 
                value={form.name} 
                onChange={e=> setForm(f=> ({...f, name: e.target.value}))} 
                placeholder="AC Repair"
                required
              />
            </label>
            <label>
              Icon
              <input 
                value={form.icon} 
                onChange={e=> setForm(f=> ({...f, icon: e.target.value}))} 
                placeholder="ic_ac"
              />
            </label>
            <label>
              Description
              <textarea 
                value={form.description} 
                onChange={e=> setForm(f=> ({...f, description: e.target.value}))} 
                placeholder="Short description"
              />
            </label>
            <label className="checkbox">
              <input 
                type="checkbox" 
                checked={form.isActive} 
                onChange={e=> setForm(f=> ({...f, isActive: e.target.checked}))}
              />
              Active
            </label>
          </div>
          <div className="right">
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="loading-state">Loading services...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No Services Yet</h3>
          <p>Add your first service using the form above</p>
        </div>
      ) : (
        <div className="services-grid">
          {items.map(s => (
            <div className="service-card" key={s.id}>
              <div className="card-header">
                <div className="card-title">{s.name}</div>
                <div className={`badge ${s.isActive? 'success':'danger'}`}>
                  {s.isActive? 'Active':'Inactive'}
                </div>
              </div>
              <div className="card-description">
                {s.description || 'No description provided'}
              </div>
              <div className="card-meta">
                {s.icon && <span className="card-icon">Icon: {s.icon}</span>}
              </div>
              <div className="card-actions">
                <Link className="btn" to={`/categories/${categoryId}/services/${encodeURIComponent(s.id)}`}>
                  Manage
                </Link>
                <button 
                  className="btn danger outline" 
                  onClick={async ()=>{ 
                    if (confirm(`Delete "${s.name}" service?`)) { 
                      await deleteService(categoryId, s.id); 
                      await load(); 
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
