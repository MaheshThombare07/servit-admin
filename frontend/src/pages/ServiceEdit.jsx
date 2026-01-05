import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addSubService, deleteSubService, getService, updateService, updateSubService } from '../api'
import SubServiceModal from '../components/SubServiceModal'
import "./ServiceEdit.css"

export default function ServiceEdit() {
  const { categoryId, serviceId } = useParams()
  const [svc, setSvc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', icon: '', isActive: true })
  const [newSub, setNewSub] = useState({ name: '', description: '', unit: 'per service', minPrice: 0, maxPrice: 0 })
  const [editingSubService, setEditingSubService] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const data = await getService(categoryId, serviceId)
      setSvc(data)
      setForm({ name: data.name, description: data.description || '', icon: data.icon || '', isActive: !!data.isActive })
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [categoryId, serviceId])

  async function onSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateService(categoryId, serviceId, form)
      await load()
    } finally { setSaving(false) }
  }

  async function onAddSub(e) {
    e.preventDefault()
    if (!newSub.name.trim()) return
    await addSubService(categoryId, serviceId, newSub)
    setNewSub({ name: '', description: '', unit: 'per service', minPrice: 0, maxPrice: 0 })
    await load()
  }

  async function handleEditSubService(updatedData) {
    if (!editingSubService) return
    const ident = editingSubService.id ?? editingSubService.name
    await updateSubService(categoryId, serviceId, ident, updatedData)
    setEditingSubService(null)
    await load()
  }

  if (loading) return (
    <div className="service-edit-page">
      <div className="loading-state">Loading service...</div>
    </div>
  )
  
  if (!svc) return (
    <div className="service-edit-page">
      <div className="empty-state">
        <h3>Service Not Found</h3>
        <Link to={`/categories/${categoryId}`} className="btn">Back to Services</Link>
      </div>
    </div>
  )

  const subList = Array.isArray(svc.subServices)
    ? svc.subServices
    : (svc.subServices && typeof svc.subServices === 'object')
      ? Object.entries(svc.subServices).map(([name, rest]) => ({ name, ...(rest||{}) }))
      : []

  return (
    <div className="service-edit-page">
      <div className="page-header">
        <h1>{svc.name}</h1>
        <Link to={`/categories/${categoryId}`} className="btn outline">Back</Link>
      </div>

      <div className="service-details-card">
        <div className="card-title">Service Details</div>
        <form className="form" onSubmit={onSave}>
          <div className="form-grid">
            <label>
              Name
              <input 
                value={form.name} 
                onChange={e=> setForm(f=> ({...f, name: e.target.value}))}
                required
              />
            </label>
            <label>
              Icon
              <input 
                value={form.icon} 
                onChange={e=> setForm(f=> ({...f, icon: e.target.value}))}
                placeholder="ic_service"
              />
            </label>
            <label>
              Description
              <textarea 
                value={form.description} 
                onChange={e=> setForm(f=> ({...f, description: e.target.value}))}
                placeholder="Service description"
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
            <button className="btn" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="subservices-card">
        <div className="card-title">Sub-Services</div>
        <form className="form inline" onSubmit={onAddSub}>
          <input 
            placeholder="Name" 
            value={newSub.name} 
            onChange={e=> setNewSub(s=> ({...s, name: e.target.value}))}
            required
          />
          <input 
            placeholder="Description" 
            value={newSub.description} 
            onChange={e=> setNewSub(s=> ({...s, description: e.target.value}))}
          />
          <select 
            value={newSub.unit} 
            onChange={e=> setNewSub(s=> ({...s, unit: e.target.value}))}
          >
            <option>per service</option>
            <option>per unit</option>
            <option>per hour</option>
            <option>per day</option>
          </select>
          <input 
            type="number" 
            placeholder="Min Price" 
            value={newSub.minPrice} 
            onChange={e=> setNewSub(s=> ({...s, minPrice: Number(e.target.value)}))}
            min="0"
          />
          <input 
            type="number" 
            placeholder="Max Price" 
            value={newSub.maxPrice} 
            onChange={e=> setNewSub(s=> ({...s, maxPrice: Number(e.target.value)}))}
            min="0"
          />
          <button className="btn" type="submit">Add Sub-Service</button>
        </form>
        
        {subList.length === 0 ? (
          <div className="empty-subservices">
            <p>No sub-services yet. Add one using the form above.</p>
          </div>
        ) : (
          <div className="subservices-list">
            {subList.map(ss => (
              <div className="subservice-item" key={ss.id ?? ss.name}>
                <div className="item-content">
                  <div className="item-title">{ss.name}</div>
                  <div className="item-meta">
                    <span>{ss.description || 'No description'}</span>
                    <span>•</span>
                    <span>{ss.unit}</span>
                    <span>•</span>
                    <span>₹{ss.minPrice} - ₹{ss.maxPrice}</span>
                  </div>
                </div>
                <div className="item-actions">
                  <button 
                    className="btn outline" 
                    onClick={() => setEditingSubService(ss)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn danger outline" 
                    onClick={async ()=>{ 
                      if (confirm(`Delete "${ss.name}" sub-service?`)) { 
                        const ident = ss.id ?? ss.name
                        await deleteSubService(categoryId, serviceId, ident)
                        await load()
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

      {/* Edit Sub-Service Modal */}
      {editingSubService && (
        <SubServiceModal
          subService={editingSubService}
          onSave={handleEditSubService}
          onClose={() => setEditingSubService(null)}
        />
      )}
    </div>
  )
}
