'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FaGithub, FaGoogle, FaMicrosoft } from 'react-icons/fa'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, oauthLogin } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = (provider: 'github' | 'google' | 'microsoft') => {
    oauthLogin(provider)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,160,133,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(26,187,161,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,160,133,0.05)_0%,transparent_50%,rgba(26,187,161,0.05)_100%)]"></div>
      </div>
      
      {/* Animated Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 mb-8">
              {/* The Shape Icon */}
              <img 
                src="/brand_icon.png" 
                alt="Icon" 
                className="h-16 w-16 object-contain" 
              />
              {/* The Font Logo */}
              <img 
                src="/brand_text.png" 
                alt="Veracity" 
                className="h-10 w-auto object-contain" 
              />
            </div>
          <h2 className="text-3xl font-semibold text-white mb-3">Welcome Back</h2>
          <p className="text-gray-400 text-lg">Sign in to your account to continue</p>
        </div>

        <div className="bg-dark-800/90 backdrop-blur-xl rounded-2xl p-10 shadow-2xl border border-primary-500/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transform hover:scale-[1.02]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-800 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                onClick={() => handleOAuth('github')}
                className="flex items-center justify-center px-4 py-3 bg-dark-700/50 hover:bg-dark-600/70 border border-dark-600/50 hover:border-primary-500/50 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
              >
                <FaGithub className="text-xl text-white" />
              </button>
              <button
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center px-4 py-3 bg-dark-700/50 hover:bg-dark-600/70 border border-dark-600/50 hover:border-primary-500/50 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
              >
                <FaGoogle className="text-xl text-white" />
              </button>
              <button
                onClick={() => handleOAuth('microsoft')}
                className="flex items-center justify-center px-4 py-3 bg-dark-700/50 hover:bg-dark-600/70 border border-dark-600/50 hover:border-primary-500/50 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
              >
                <FaMicrosoft className="text-xl text-white" />
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary-500 hover:text-primary-400 font-medium">
              Sign up
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
