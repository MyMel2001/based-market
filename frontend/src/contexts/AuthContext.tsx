import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthResponse } from 'shared'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          const userData = await authApi.getMe()
          setUser(userData)
        } catch (error) {
          localStorage.removeItem('auth_token')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.login({ email, password })
      localStorage.setItem('auth_token', response.token)
      setUser(response.user)
      toast.success('Login successful!')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Login failed')
      throw error
    }
  }

  const register = async (data: any) => {
    try {
      const response: AuthResponse = await authApi.register(data)
      localStorage.setItem('auth_token', response.token)
      setUser(response.user)
      toast.success('Registration successful!')
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Registration failed')
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 