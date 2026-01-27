'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { FaShieldAlt, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'

const scanLogs = [
  { id: 1, project: 'E-commerce Platform', file: 'payment_processor.py', timestamp: '2024-01-15 10:30:00', status: 'success', message: 'Analysis completed' },
  { id: 2, project: 'API Gateway', file: 'auth_service.py', timestamp: '2024-01-15 10:25:00', status: 'failed', message: 'Syntax error detected' },
  { id: 3, project: 'Data Analytics', file: 'data_processor.py', timestamp: '2024-01-15 10:20:00', status: 'success', message: 'Analysis completed' },
  { id: 4, project: 'Payment Service', file: 'transaction.py', timestamp: '2024-01-15 10:15:00', status: 'success', message: 'Analysis completed' },
  { id: 5, project: 'User Management', file: 'user_controller.py', timestamp: '2024-01-15 10:10:00', status: 'failed', message: 'File too large' },
  { id: 6, project: 'Notification Service', file: 'email_service.py', timestamp: '2024-01-15 10:05:00', status: 'success', message: 'Analysis completed' },
  { id: 7, project: 'Authentication Module', file: 'oauth_handler.py', timestamp: '2024-01-15 10:00:00', status: 'failed', message: 'Import error' },
]

export default function ScanLogsPage() {
  const { user, isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all')

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

  const filteredLogs = scanLogs.filter((log) => {
    const matchesSearch =
      log.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.file.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || log.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Scan Logs</h1>
          <p className="text-gray-400 mt-1">View file analysis results and failures</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-800 border border-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('success')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-dark-800 border border-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'failed'
                  ? 'bg-red-500 text-white'
                  : 'bg-dark-800 border border-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{log.project}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{log.file}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{log.timestamp}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.status === 'success' ? (
                        <span className="flex items-center gap-2 text-green-400">
                          <FaCheckCircle />
                          Success
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-red-400">
                          <FaTimesCircle />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
