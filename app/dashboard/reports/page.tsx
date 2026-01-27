'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { FaFileAlt, FaDownload, FaFilePdf, FaFileCode, FaFile } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'

// Mock reports data
const mockReports = [
  {
    id: 1,
    title: 'Daily Risk Report - January 15',
    report_type: 'daily',
    report_format: 'json',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    title: 'Monthly Analytics Report - December 2023',
    report_type: 'monthly',
    report_format: 'xml',
    created_at: '2024-01-01T09:00:00Z',
  },
  {
    id: 3,
    title: 'System Performance Report - January',
    report_type: 'monthly',
    report_format: 'pdf',
    created_at: '2024-01-10T14:30:00Z',
  },
]

export default function ReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState(mockReports)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    report_type: 'daily',
    report_format: 'json',
  })

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    const newReport = {
      id: reports.length + 1,
      ...formData,
      created_at: new Date().toISOString(),
    }
    setReports([newReport, ...reports])
    setShowModal(false)
    setFormData({ title: '', report_type: 'daily', report_format: 'json' })
  }

  const handleDownload = (report: any) => {
    // Mock download - in real app, this would download the actual file
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FaFilePdf className="text-red-400" />
      case 'xml':
        return <FaFileCode className="text-blue-400" />
      default:
        return <FaFile className="text-green-400" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="text-gray-400 mt-1">Generate and manage analytical reports</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaFileAlt /> Generate Report
          </button>
        </div>

        {/* Reports List */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {getFormatIcon(report.report_format)}
                        <span className="text-white font-medium">{report.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full capitalize">
                        {report.report_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-400 uppercase">{report.report_format}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDownload(report)}
                        className="text-primary-500 hover:text-primary-400 p-2"
                      >
                        <FaDownload />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Report Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md border border-dark-700">
              <h2 className="text-xl font-semibold text-white mb-4">Generate Report</h2>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Report Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Report Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Report Type</label>
                  <select
                    value={formData.report_type}
                    onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Report Format</label>
                  <select
                    value={formData.report_format}
                    onChange={(e) => setFormData({ ...formData, report_format: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                    <option value="pdf" disabled={!user?.is_pro}>
                      PDF {!user?.is_pro && '(Pro Feature)'}
                    </option>
                  </select>
                  {formData.report_format === 'pdf' && !user?.is_pro && (
                    <p className="mt-2 text-sm text-yellow-400">
                      PDF reports are available for Pro users only. Upgrade to Pro to unlock this feature.
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-dark-700 hover:bg-dark-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
