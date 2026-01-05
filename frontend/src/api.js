import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api'

export const api = axios.create({ baseURL })

export async function getCategories() {
  const { data } = await api.get('/categories')
  return data
}

export async function createCategory(category) {
  const { data } = await api.post('/categories', { category })
  return data
}

export async function toggleCategory(categoryId, isActive) {
  const { data } = await api.patch(`/categories/${categoryId}`, { isActive })
  return data
}

export async function getServices(categoryId) {
  const { data } = await api.get(`/categories/${categoryId}/services`)
  return data
}

export async function createService(categoryId, payload) {
  const { data } = await api.post(`/categories/${categoryId}/services`, payload)
  return data
}

export async function deleteService(categoryId, serviceId) {
  const { data } = await api.delete(`/categories/${categoryId}/services/${serviceId}`)
  return data
}

export async function getService(categoryId, serviceId) {
  const { data } = await api.get(`/categories/${categoryId}/services/${serviceId}`)
  return data
}

export async function updateService(categoryId, serviceId, payload) {
  const { data } = await api.patch(`/categories/${categoryId}/services/${serviceId}`, payload)
  return data
}

export async function addSubService(categoryId, serviceId, payload) {
  const { data } = await api.post(`/categories/${categoryId}/services/${serviceId}/subservices`, payload)
  return data
}

export async function updateSubService(categoryId, serviceId, subId, payload) {
  const { data } = await api.patch(`/categories/${categoryId}/services/${serviceId}/subservices/${subId}`, payload)
  return data
}

export async function deleteSubService(categoryId, serviceId, subId) {
  const { data } = await api.delete(`/categories/${categoryId}/services/${serviceId}/subservices/${subId}`)
  return data
}

// Partners API
export async function getPartners(status) {
  const params = status ? { status } : {}
  const { data } = await api.get('/partners', { params })
  return data
}

export async function getPartner(partnerId) {
  const { data } = await api.get(`/partners/${partnerId}`)
  return data
}

export async function verifyPartner(partnerId, remark = '') {
  const { data } = await api.post(`/partners/${partnerId}/verify`, { remark })
  return data
}

export async function rejectPartner(partnerId, rejectionReason, remark = '') {
  const { data } = await api.post(`/partners/${partnerId}/reject`, { rejectionReason, remark })
  return data
}

// Users API
export async function getUsers(blocked, limit = 50, offset = 0) {
  const params = { limit, offset }
  if (blocked !== undefined) params.blocked = blocked
  const { data } = await api.get('/users', { params })
  return data
}

export async function getUser(userId) {
  const { data } = await api.get(`/users/${userId}`)
  return data
}

export async function updateUserStatus(userId, blocked, blockReason = '') {
  const { data } = await api.patch(`/users/${userId}/status`, { blocked, blockReason })
  return data
}

export async function deleteUser(userId) {
  const { data } = await api.delete(`/users/${userId}`)
  return data
}

export async function getUserBookingHistory(userId) {
  const { data } = await api.get(`/users/${userId}/bookings`)
  return data
}

// Bookings API
export async function getAllBookings(filters = {}) {
  const params = new URLSearchParams()
  
  // Add all filter parameters
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== '') {
      params.append(key, filters[key])
    }
  })
  
  const { data } = await api.get(`/bookings?${params.toString()}`)
  return data
}

export async function getBookingDetails(bookingId) {
  const { data } = await api.get(`/bookings/${bookingId}`)
  return data
}
