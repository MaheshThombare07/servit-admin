import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api'

console.log('API Base URL:', baseURL) // Debug line to verify correct URL

const authTokenKey = 'servite_admin_token'

export const api = axios.create({ 
  baseURL,
  timeout: 30000, // 30 second timeout for Render
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(authTokenKey)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global variable to store the clearAuth function
let clearAuthFunction = null
let isBootstrapping = false

export const setClearAuthFunction = (fn) => {
  clearAuthFunction = fn
}

export const setBootstrapping = (value) => {
  isBootstrapping = value
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // Clear token from localStorage
      localStorage.removeItem(authTokenKey)
      
      // Clear AuthContext state if function is available
      if (clearAuthFunction) {
        clearAuthFunction()
      }
      
      // Only redirect if we're not bootstrapping and not on login/register pages
      if (!isBootstrapping && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        console.log('Redirecting to login due to 401 error')
        window.location.href = '/login'
      } else {
        console.log('Not redirecting during bootstrap or already on auth page')
      }
    }
    return Promise.reject(error)
  }
)

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(authTokenKey, token)
  } else {
    localStorage.removeItem(authTokenKey)
  }
}

export const authKeys = { tokenKey: authTokenKey }

export async function registerAdmin(payload) {
  const { data } = await api.post('/auth/register', payload)
  if (data?.token) setAuthToken(data.token)
  return data
}

export async function createAdminUser(payload) {
  const { data } = await api.post('/admin/register', payload)
  return data
}

export async function getAllAdmins() {
  const { data } = await api.get('/admins')
  return data
}

export async function toggleAdminStatus(adminId, isActive) {
  const { data } = await api.put(`/admin/${adminId}/status`, { isActive })
  return data
}

export async function loginAdmin(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  if (data?.token) setAuthToken(data.token)
  return data
}

export async function getCurrentAdmin() {
  const { data } = await api.get('/auth/me')
  return data
}

export async function logoutAdmin() {
  try {
    await api.post('/auth/logout')
  } catch (e) {
    // ignore logout errors
  }
  setAuthToken(null)
}

export async function refreshToken() {
  const { data } = await api.post('/auth/refresh')
  if (data?.token) setAuthToken(data.token)
  return data
}

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

// Dashboard API
export async function getDashboardStats() {
  const { data } = await api.get('/dashboard/stats')
  return data
}

export async function getRecentBookings() {
  const { data } = await api.get('/dashboard/recent-bookings')
  return data
}

export async function getPendingValidations() {
  const { data } = await api.get('/dashboard/pending-validations')
  return data
}

export async function getBookingTrends() {
  const { data } = await api.get('/dashboard/booking-trends')
  return data
}

