'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { FaShieldAlt } from 'react-icons/fa'

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect to Analysis Dashboard by default
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'dba') {
      router.push('/dashboard/admin/dashboard')
    }
  }, [router, isAuthenticated, user])

  // Wait for auth to load
  if (!isAuthenticated || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  // Only DBA can access
  if (user.role !== 'dba') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <FaShieldAlt className="text-6xl text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-gray-400">Only system administrators can access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Redirecting...</div>
      </div>
    </DashboardLayout>
  )
}
