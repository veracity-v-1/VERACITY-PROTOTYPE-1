'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'

export type UserRole = 'dba' | 'project_manager' | 'standard_user'

export interface User {
  id: number
  email: string
  username: string
  full_name: string | null
  role: UserRole
  is_pro: boolean
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, full_name?: string) => Promise<void>
  logout: () => void
  oauthLogin: (provider: 'github' | 'google' | 'microsoft') => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data for prototype
const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@veracity.com',
    username: 'admin',
    full_name: 'System Admin',
    role: 'dba',
    is_pro: true,
    is_active: true,
  },
  {
    id: 2,
    email: 'pm@veracity.com',
    username: 'pm',
    full_name: 'Project Manager',
    role: 'project_manager',
    is_pro: true,
    is_active: true,
  },
  {
    id: 3,
    email: 'user@veracity.com',
    username: 'user',
    full_name: 'Standard User',
    role: 'standard_user',
    is_pro: false,
    is_active: true,
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = Cookies.get('auth_token')
    const storedUser = Cookies.get('auth_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (email: string, password: string) => {
    // Mock login - in real app, this would call the API
    const foundUser = mockUsers.find(u => u.email === email)
    if (foundUser && password === 'password') {
      const mockToken = `mock_token_${Date.now()}`
      setUser(foundUser)
      setToken(mockToken)
      Cookies.set('auth_token', mockToken, { expires: 7 })
      Cookies.set('auth_user', JSON.stringify(foundUser), { expires: 7 })
    } else {
      throw new Error('Invalid credentials')
    }
  }

  const register = async (email: string, username: string, password: string, full_name?: string) => {
    // Mock registration
    const newUser: User = {
      id: mockUsers.length + 1,
      email,
      username,
      full_name: full_name || null,
      role: 'standard_user',
      is_pro: false,
      is_active: true,
    }
    mockUsers.push(newUser)
    const mockToken = `mock_token_${Date.now()}`
    setUser(newUser)
    setToken(mockToken)
    Cookies.set('auth_token', mockToken, { expires: 7 })
    Cookies.set('auth_user', JSON.stringify(newUser), { expires: 7 })
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    Cookies.remove('auth_token')
    Cookies.remove('auth_user')
  }

  const oauthLogin = (provider: 'github' | 'google' | 'microsoft') => {
    // Mock OAuth - in real app, this would redirect to OAuth provider
    const mockUser: User = {
      id: Date.now(),
      email: `${provider}@example.com`,
      username: provider,
      full_name: `${provider} User`,
      role: 'standard_user',
      is_pro: false,
      is_active: true,
    }
    const mockToken = `mock_token_${Date.now()}`
    setUser(mockUser)
    setToken(mockToken)
    Cookies.set('auth_token', mockToken, { expires: 7 })
    Cookies.set('auth_user', JSON.stringify(mockUser), { expires: 7 })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        oauthLogin,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
