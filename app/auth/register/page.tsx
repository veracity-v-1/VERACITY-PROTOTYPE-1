'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FaGithub, FaGoogle, FaMicrosoft, FaShieldAlt, FaChartLine, FaRobot } from 'react-icons/fa'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, oauthLogin } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await register(formData.email, formData.username, formData.password, formData.full_name)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = (provider: 'github' | 'google' | 'microsoft') => {
    oauthLogin(provider)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,160,133,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(26,187,161,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,160,133,0.05)_0%,transparent_50%,rgba(26,187,161,0.05)_100%)]"></div>
      </div>
      
      {/* Animated Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Left Side - Informative Panel */}
      <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-center px-12 text-white">
        <div className="max-w-lg">
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
          
          <h2 className="text-4xl font-bold mb-4">Start Your Journey with Project Veracity</h2>
          <p className="text-xl text-gray-300 mb-8">Predict software defects with AI-powered analysis and get actionable insights</p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FaShieldAlt className="text-2xl text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Defect Prediction</h3>
                <p className="text-gray-400">Leverage machine learning to identify potential defects before they impact your codebase</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FaChartLine className="text-2xl text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">SHAP Explainability</h3>
                <p className="text-gray-400">Understand why defects occur with detailed feature importance analysis</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <FaRobot className="text-2xl text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Intelligent Chatbot</h3>
                <p className="text-gray-400">Get instant mitigation strategies and code quality advice from our AI assistant</p>
              </div>
            </div>
          </div>

          <div className="mt-10 p-6 bg-dark-800/50 backdrop-blur-sm rounded-xl border border-primary-500/20">
            <p className="text-sm text-gray-400 mb-4">Trusted by developers worldwide</p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-white">10K+</p>
                <p className="text-xs text-gray-400">Active Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">500K+</p>
                <p className="text-xs text-gray-400">Code Analyses</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">95%</p>
                <p className="text-xs text-gray-400">Accuracy Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 relative z-10 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 lg:hidden">
            <div className="inline-flex items-center gap-4 mb-8">
              <div className="w-16 h-16 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <path d="M20 20 L50 80 L80 20" stroke="url(#vGradient)" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="vGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#14a085" />
                      <stop offset="100%" stopColor="#1abba1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1 className="text-5xl font-bold text-white tracking-wide">VERACITY</h1>
            </div>
            <h2 className="text-3xl font-semibold text-white mb-3">Create Account</h2>
            <p className="text-gray-400 text-lg">Sign up to get started</p>
          </div>

          <div className="lg:block hidden mb-10">
            <h2 className="text-3xl font-semibold text-white mb-3">Create Your Account</h2>
            <p className="text-gray-400 text-lg">Join thousands of developers using Project Veracity</p>
          </div>

          <div className="bg-dark-800/90 backdrop-blur-xl rounded-2xl p-10 shadow-2xl border border-primary-500/20">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-800 text-gray-400">Or sign up with</span>
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
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-500 hover:text-primary-400 font-medium">
              Sign in
            </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}
