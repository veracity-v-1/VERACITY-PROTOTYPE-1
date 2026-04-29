'use client'

import DashboardLayout from '@/components/Layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { FaShieldAlt } from 'react-icons/fa'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// Mock data
const analysisDashboard = {
  avgRisk: 0.65,
  totalScans: 12450,
  successfulScans: 11800,
  failedScans: 650,
  riskDistribution: [
    { name: 'Low', value: 45, color: '#14a085' },
    { name: 'Medium', value: 30, color: '#1abba1' },
    { name: 'High', value: 20, color: '#ff9500' },
    { name: 'Critical', value: 5, color: '#ff4444' },
  ],
  scanTrends: [
    { date: 'Jan', scans: 1200, avgRisk: 0.62 },
    { date: 'Feb', scans: 1350, avgRisk: 0.64 },
    { date: 'Mar', scans: 1500, avgRisk: 0.63 },
    { date: 'Apr', scans: 1680, avgRisk: 0.65 },
    { date: 'May', scans: 1800, avgRisk: 0.66 },
    { date: 'Jun', scans: 1920, avgRisk: 0.65 },
  ],
}

export default function AnalysisDashboardPage() {
  const { user, isAuthenticated } = useAuth()

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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analysis Dashboard</h1>
          <p className="text-gray-400 mt-1">Big picture overview of system-wide analysis metrics</p>
        </div>

        {/* Big Picture Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <p className="text-sm text-gray-400 mb-2">Average Risk</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              {(analysisDashboard.avgRisk * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Across all projects</p>
          </div>
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <p className="text-sm text-gray-400 mb-2">Total Scans</p>
            <p className="text-4xl font-bold text-white">
              {analysisDashboard.totalScans.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </div>
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <p className="text-sm text-gray-400 mb-2">Successful</p>
            <p className="text-4xl font-bold text-green-400">
              {analysisDashboard.successfulScans.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {((analysisDashboard.successfulScans / analysisDashboard.totalScans) * 100).toFixed(1)}% success rate
            </p>
          </div>
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <p className="text-sm text-gray-400 mb-2">Failed</p>
            <p className="text-4xl font-bold text-red-400">
              {analysisDashboard.failedScans.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {((analysisDashboard.failedScans / analysisDashboard.totalScans) * 100).toFixed(1)}% failure rate
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analysisDashboard.riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analysisDashboard.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Scan Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analysisDashboard.scanTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" opacity={0.3} />
                <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis yAxisId="left" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#888" tick={{ fill: '#888' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ color: '#fff' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="scans"
                  stroke="#14a085"
                  strokeWidth={3}
                  name="Total Scans"
                  dot={{ fill: '#14a085', r: 5, strokeWidth: 2, stroke: '#0a5a4b' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgRisk"
                  stroke="#ff9500"
                  strokeWidth={3}
                  name="Avg Risk"
                  dot={{ fill: '#ff9500', r: 5, strokeWidth: 2, stroke: '#cc7700' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
