import { useState, useEffect } from 'react'
import './SubServiceModal.css'

export default function SubServiceModal({ subService, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    unit: 'per service',
    minPrice: 0,
    maxPrice: 0
  })

  useEffect(() => {
    if (subService) {
      setForm({
        name: subService.name || '',
        description: subService.description || '',
        unit: subService.unit || 'per service',
        minPrice: subService.minPrice || 0,
        maxPrice: subService.maxPrice || 0
      })
    }
  }, [subService])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  if (!subService) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Sub-Service</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Name *
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Enter sub-service name"
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Enter description"
                rows="3"
              />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Unit
                <select
                  value={form.unit}
                  onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                >
                  <option value="per service">Per Service</option>
                  <option value="per unit">Per Unit</option>
                  <option value="per hour">Per Hour</option>
                  <option value="per day">Per Day</option>
                </select>
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Min Price (₹) *
                <input
                  type="number"
                  value={form.minPrice}
                  onChange={(e) => setForm(f => ({ ...f, minPrice: Number(e.target.value) }))}
                  min="0"
                  required
                />
              </label>
            </div>

            <div className="form-group">
              <label>
                Max Price (₹) *
                <input
                  type="number"
                  value={form.maxPrice}
                  onChange={(e) => setForm(f => ({ ...f, maxPrice: Number(e.target.value) }))}
                  min={form.minPrice}
                  required
                />
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
