'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    } else {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-900">
      <div className="animate-pulse">
        <div className="text-primary-500 text-2xl font-bold">Project Veracity</div>
      </div>
    </div>
  )
}
