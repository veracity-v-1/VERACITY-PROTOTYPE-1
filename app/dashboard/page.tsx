'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import Link from 'next/link'
import { FaChartLine, FaExclamationTriangle, FaCheckCircle, FaClock, FaBug, FaShieldAlt, FaChartBar, FaTasks } from 'react-icons/fa'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// Mock data
const riskTrends = [
  { date: 'Jan', low: 45, medium: 30, high: 15, critical: 10 },
  { date: 'Feb', low: 50, medium: 25, high: 15, critical: 10 },
  { date: 'Mar', low: 48, medium: 28, high: 14, critical: 10 },
  { date: 'Apr', low: 52, medium: 26, high: 12, critical: 10 },
  { date: 'May', low: 55, medium: 24, high: 11, critical: 10 },
  { date: 'Jun', low: 58, medium: 22, high: 10, critical: 10 },
]

const defectStats = [
  { 
    name: 'Total Predictions', 
    value: '1,234', 
    change: '+12%', 
    positive: true,
    icon: FaChartBar,
    color: 'from-primary-500 to-primary-400',
    bgColor: 'bg-primary-500/10',
    iconColor: 'text-primary-400'
  },
  { 
    name: 'High Risk', 
    value: '89', 
    change: '-5%', 
    positive: true,
    icon: FaExclamationTriangle,
    color: 'from-orange-500 to-orange-400',
    bgColor: 'bg-orange-500/10',
    iconColor: 'text-orange-400'
  },
  { 
    name: 'Critical Issues', 
    value: '23', 
    change: '+3%', 
    positive: false,
    icon: FaBug,
    color: 'from-red-500 to-red-400',
    bgColor: 'bg-red-500/10',
    iconColor: 'text-red-400'
  },
  { 
    name: 'Resolved', 
    value: '456', 
    change: '+18%', 
    positive: true,
    icon: FaCheckCircle,
    color: 'from-green-500 to-green-400',
    bgColor: 'bg-green-500/10',
    iconColor: 'text-green-400'
  },
]

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }
    // Redirect admin users to admin dashboard
    if (user?.role === 'dba') {
      router.push('/dashboard/admin/dashboard')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated) return null

  // Don't show user dashboard for admin
  if (user?.role === 'dba') {
    return null
  }


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-500/10 via-primary-400/5 to-transparent rounded-xl p-6 border border-primary-500/20">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.full_name || user?.username || 'User'}
          </h1>
          <p className="text-gray-400">Monitor and analyze software defects with AI-powered predictions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {defectStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.name}
                className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 group relative overflow-hidden"
              >
                {/* Gradient Accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`text-xl ${stat.iconColor}`} />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                        stat.positive 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      <span>{stat.change}</span>
                      {stat.positive ? <FaCheckCircle className="text-xs" /> : <FaExclamationTriangle className="text-xs" />}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2 font-medium">{stat.name}</p>
                  <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Trends Chart */}
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Risk Trends</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FaChartLine className="text-primary-500" />
                <span>Last 6 months</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={riskTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.3} />
                <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #2a2a2a', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                  }}
                />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Line 
                  type="monotone" 
                  dataKey="low" 
                  stroke="#14a085" 
                  strokeWidth={3} 
                  dot={{ fill: '#14a085', r: 5, strokeWidth: 2, stroke: '#0a5a4b' }} 
                  activeDot={{ r: 7 }}
                  name="Low Risk" 
                />
                <Line 
                  type="monotone" 
                  dataKey="medium" 
                  stroke="#1abba1" 
                  strokeWidth={3} 
                  dot={{ fill: '#1abba1', r: 5, strokeWidth: 2, stroke: '#0f7d68' }} 
                  activeDot={{ r: 7 }}
                  name="Medium Risk" 
                />
                <Line 
                  type="monotone" 
                  dataKey="high" 
                  stroke="#ff9500" 
                  strokeWidth={3} 
                  dot={{ fill: '#ff9500', r: 5, strokeWidth: 2, stroke: '#cc7700' }} 
                  activeDot={{ r: 7 }}
                  name="High Risk" 
                />
                <Line 
                  type="monotone" 
                  dataKey="critical" 
                  stroke="#ff4444" 
                  strokeWidth={3} 
                  dot={{ fill: '#ff4444', r: 5, strokeWidth: 2, stroke: '#cc0000' }} 
                  activeDot={{ r: 7 }}
                  name="Critical" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Defect Distribution */}
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 hover:border-primary-500/30 transition-all shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Defect Distribution</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FaChartBar className="text-primary-500" />
                <span>By severity</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={riskTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.3} />
                <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #2a2a2a', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                  }}
                />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Bar 
                  dataKey="low" 
                  stackId="a" 
                  fill="url(#lowGradient)" 
                  name="Low Risk" 
                  radius={[6, 6, 0, 0]}
                />
                <Bar 
                  dataKey="medium" 
                  stackId="a" 
                  fill="url(#mediumGradient)" 
                  name="Medium Risk" 
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="high" 
                  stackId="a" 
                  fill="url(#highGradient)" 
                  name="High Risk" 
                  radius={[0, 0, 0, 0]}
                />
                <Bar 
                  dataKey="critical" 
                  stackId="a" 
                  fill="url(#criticalGradient)" 
                  name="Critical" 
                  radius={[0, 0, 6, 6]}
                />
                <defs>
                  <linearGradient id="lowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14a085" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0f7d68" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="mediumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1abba1" stopOpacity={1} />
                    <stop offset="100%" stopColor="#14a085" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="highGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff9500" stopOpacity={1} />
                    <stop offset="100%" stopColor="#cc7700" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff4444" stopOpacity={1} />
                    <stop offset="100%" stopColor="#cc0000" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Predictions</h3>
            <button className="text-sm text-primary-400 hover:text-primary-300 font-medium">
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {[
              { id: 1, name: 'payment_processor.py', risk: 'High', prob: 75, time: '2 hours ago', color: 'orange' },
              { id: 2, name: 'api_gateway.py', risk: 'Medium', prob: 45, time: '5 hours ago', color: 'yellow' },
              { id: 3, name: 'data_analytics.py', risk: 'Critical', prob: 92, time: '1 day ago', color: 'red' },
              { id: 4, name: 'auth_service.py', risk: 'Low', prob: 25, time: '2 days ago', color: 'green' },
              { id: 5, name: 'user_controller.py', risk: 'High', prob: 68, time: '3 days ago', color: 'orange' },
            ].map((item) => {
              const riskColors: Record<string, { bg: string; text: string; border: string }> = {
                low: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
                medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
                high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
                critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
              }
              const colors = riskColors[item.risk.toLowerCase()] || riskColors.medium
              
              return (
                <Link
                  key={item.id}
                  href={`/dashboard/predictions/${item.id}`}
                  className="flex items-center justify-between p-4 bg-dark-700/50 rounded-xl hover:bg-dark-700 border border-dark-600/50 hover:border-primary-500/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${colors.bg} ${colors.border} border rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <FaChartLine className={`${colors.text}`} />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-400">{item.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1.5 ${colors.bg} ${colors.text} text-xs font-semibold rounded-full border ${colors.border}`}>
                      {item.risk} Risk
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{item.prob}%</p>
                      <p className="text-xs text-gray-500">probability</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
