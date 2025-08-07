import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, userAPI } from '../utils/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (token) => {
    try {
      const response = await userAPI.getProfile()
      const profileData = response.data
      setUser(prevUser => ({
        ...prevUser,
        name: profileData.name,
        email: profileData.email,
        ...profileData
      }))
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      // Don't fail completely if profile fetch fails
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Basic token validation - check if it's not expired
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000
        
        if (payload.exp && payload.exp < currentTime) {
          // Token is expired
          localStorage.removeItem('token')
          setUser(null)
        } else {
          // Token is valid, fetch user profile
          setUser({ token, username: payload.sub })
          fetchUserProfile(token)
        }
      } catch (error) {
        // Invalid token format
        localStorage.removeItem('token')
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    
    const response = await authAPI.login(formData)
    const { access_token } = response.data
    
    localStorage.setItem('token', access_token)
    setUser({ token: access_token, username })
    
    // Fetch user profile after successful login
    await fetchUserProfile(access_token)
    
    return response.data
  }

  const register = async (userData) => {
    const response = await authAPI.register(userData)
    const { access_token } = response.data
    
    localStorage.setItem('token', access_token)
    setUser({ token: access_token, username: userData.username })
    
    // Fetch user profile after successful registration
    await fetchUserProfile(access_token)
    
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}