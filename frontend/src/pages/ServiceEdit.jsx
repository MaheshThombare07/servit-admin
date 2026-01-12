import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addSubService, deleteSubService, getService, updateService, updateSubService } from '../api'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import SubServiceModal from '../components/SubServiceModal'
import Toast from '../components/Toast.jsx'
import "./ServiceEdit.css"

export default function ServiceEdit() {
  const { categoryId, serviceId } = useParams()
  const [svc, setSvc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', icon: '', isActive: true })
  const [newSub, setNewSub] = useState({ name: '', description: '', unit: 'per service', minPrice: 0, maxPrice: 0 })
  const [editingSubService, setEditingSubService] = useState(null)
  const [addingSub, setAddingSub] = useState(false)
  const [toast, setToast] = useState(null)

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
      // Update state immediately instead of reloading
      setSvc(prev => ({ ...prev, ...form }))
    } finally { 
      setSaving(false) 
    }
  }

  async function onAddSub(e) {
    e.preventDefault()
    if (!newSub.name.trim()) return
    
    // Check for duplicates in current state first
    const normalizedName = newSub.name.trim().toLowerCase()
    const existingSub = (svc.subServices || []).find(s => 
      (s.name || '').toLowerCase() === normalizedName
    )
    
    if (existingSub) {
      setToast({ message: `Sub-service "${newSub.name.trim()}" already exists!`, type: 'error' })
      return
    }
    
    setAddingSub(true)
    try {
      // Generate temporary ID for optimistic update
      const tempSub = { 
        ...newSub, 
        id: `temp_${Date.now()}`,
        name: newSub.name.trim() 
      }
      
      // Optimistic update - add to UI immediately
      setSvc(prev => ({
        ...prev,
        subServices: [...(prev.subServices || []), tempSub]
      }))
      
      // Reset form
      setNewSub({ name: '', description: '', unit: 'per service', minPrice: 0, maxPrice: 0 })
      
      // API call
      const result = await addSubService(categoryId, serviceId, newSub)
      
      // Replace temporary item with real data
      setSvc(prev => ({
        ...prev,
        subServices: prev.subServices.map(sub => 
          sub.id === tempSub.id ? result : sub
        )
      }))
    } catch (error) {
      console.error('Failed to add sub-service:', error)
      
      // Show user-friendly error message
      if (error.response?.status === 409) {
        setToast({ message: 'A sub-service with this name already exists!', type: 'error' })
      } else {
        setToast({ message: 'Failed to add sub-service. Please try again.', type: 'error' })
      }
      
      // Remove optimistic update without full page reload
      setSvc(prev => ({
        ...prev,
        subServices: prev.subServices.filter(sub => 
          !sub.id.startsWith('temp_')
        )
      }))
    } finally {
      setAddingSub(false)
    }
  }

  async function handleEditSubService(updatedData) {
    if (!editingSubService) return
    
    try {
      const ident = editingSubService.id ?? editingSubService.name
      
      // Optimistic update - update UI immediately
      setSvc(prev => ({
        ...prev,
        subServices: prev.subServices.map(sub => 
          (sub.id ?? sub.name) === ident ? { ...sub, ...updatedData } : sub
        )
      }))
      
      // API call
      await updateSubService(categoryId, serviceId, ident, updatedData)
      setEditingSubService(null)
    } catch (error) {
      console.error('Failed to update sub-service:', error)
      setToast({ message: 'Failed to update sub-service. Please try again.', type: 'error' })
      // Reload on error to revert optimistic update
      await load()
    }
  }

  async function onDeleteSub(subService) {
    const ident = subService.id ?? subService.name
    if (confirm(`Delete "${subService.name}" sub-service?`)) {
      try {
        // Optimistic update - remove from UI immediately
        setSvc(prev => ({
          ...prev,
          subServices: prev.subServices.filter(sub => 
            (sub.id ?? sub.name) !== ident
          )
        }))
        
        // API call
        await deleteSubService(categoryId, serviceId, ident)
      } catch (error) {
        console.error('Failed to delete sub-service:', error)
        setToast({ message: 'Failed to delete sub-service. Please try again.', type: 'error' })
        // Reload on error to revert optimistic update
        await load()
      }
    }
  }

  if (loading) return (
    <div className="service-edit-page">
      <div className="loading-state">
        <LoadingSpinner size="large" />
        <p>Loading service...</p>
      </div>
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
              {saving ? <LoadingSpinner size="small" /> : 'Save Changes'}
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
          <button className="btn" type="submit" disabled={addingSub}>
            {addingSub ? <LoadingSpinner size="small" /> : 'Add Sub-Service'}
          </button>
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
                    onClick={() => onDeleteSub(ss)}
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
