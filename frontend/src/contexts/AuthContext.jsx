import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentAdmin, loginAdmin, logoutAdmin, registerAdmin, authKeys, setAuthToken, setClearAuthFunction, setBootstrapping } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  // Function to clear auth state
  const clearAuthState = () => {
    setAdmin(null)
    localStorage.removeItem(authKeys.tokenKey)
  }

  useEffect(() => {
    // Register clearAuth function with API interceptor
    setClearAuthFunction(clearAuthState)
    
    async function bootstrap() {
      // Set bootstrapping flag to prevent redirects
      setBootstrapping(true)
      
      try {
        const token = localStorage.getItem(authKeys.tokenKey)
        console.log('Bootstrap: Token exists:', !!token)
        console.log('Bootstrap: Token value:', token ? token.substring(0, 20) + '...' : 'none')
        
        if (token) {
          try {
            console.log('Bootstrap: Validating existing token...')
            const { admin } = await getCurrentAdmin()
            console.log('Bootstrap: API response:', { admin: admin ? 'found' : 'null' })
            
            if (admin) {
              setAdmin(admin)
              console.log('Bootstrap: Auth successful for:', admin.email)
            } else {
              console.log('Bootstrap: No admin data received, clearing auth')
              clearAuthState()
            }
          } catch (error) {
            // Token is invalid or expired, clear it
            console.warn('Bootstrap: Invalid token, clearing auth state:', error?.response?.status, error?.response?.data?.error || error.message)
            clearAuthState()
          }
        } else {
          console.log('Bootstrap: No token found in localStorage')
          setAdmin(null)
        }
      } catch (error) {
        console.error('Bootstrap: Auth bootstrap error:', error)
        setAdmin(null)
      } finally {
        setLoading(false)
        // Clear bootstrapping flag after validation is complete
        setBootstrapping(false)
        console.log('Bootstrap: Complete, loading:', false)
      }
    }

    bootstrap()
    
    // Cleanup function
    return () => {
      setClearAuthFunction(null)
      setBootstrapping(false)
    }
  }, [])

  const value = useMemo(() => ({
    admin,
    loading,
    async login(email, password) {
      const { admin, token } = await loginAdmin(email, password)
      if (token) setAuthToken(token)
      setAdmin(admin)
      return admin
    },
    async register(payload) {
      const { admin, token } = await registerAdmin(payload)
      if (token) setAuthToken(token)
      setAdmin(admin)
      return admin
    },
    async logout() {
      try {
        await logoutAdmin()
      } catch (error) {
        console.warn('Logout API error:', error)
      } finally {
        clearAuthState()
      }
    },
    // Add a manual clear method for API interceptor
    clearAuth: clearAuthState
  }), [admin, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return {
    ...context,
    hasAccess: (requiredAccess) => {
      if (!context.admin) return false
      if (context.admin.role === 'super_admin') return true
      return context.admin.access?.includes(requiredAccess) || false
    }
  }
}

