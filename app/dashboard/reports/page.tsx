'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { FaFileAlt, FaDownload, FaFilePdf, FaFileCode, FaFile } from 'react-icons/fa'
import { useAuth } from '@/contexts/AuthContext'
import type { Report } from '@/types/prediction'
import jsPDF from 'jspdf'

// Mock reports data
const mockReports: Report[] = [
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
    const newReport: Report = {
      id: reports.length + 1,
      title: formData.title,
      report_type: formData.report_type as 'daily' | 'monthly' | 'custom',
      report_format: formData.report_format as 'json' | 'xml' | 'pdf',
      created_at: new Date().toISOString(),
    }
    setReports([newReport, ...reports])
    setShowModal(false)
    setFormData({ title: '', report_type: 'daily', report_format: 'json' })
  }

  // Generate mock report data based on report type
  const generateReportData = (report: Report) => {
    const baseData = {
      report_id: report.id,
      title: report.title,
      report_type: report.report_type,
      generated_at: report.created_at,
      summary: {
        total_predictions: 1234,
        high_risk: 89,
        critical_issues: 23,
        resolved: 456,
      },
      metrics: {
        defect_probability_avg: 0.65,
        risk_distribution: {
          low: 45,
          medium: 30,
          high: 15,
          critical: 10,
        },
      },
      top_risk_features: [
        { feature_name: 'v(g)', avg_value: 12, impact: 'high' },
        { feature_name: 'loc', avg_value: 450, impact: 'high' },
        { feature_name: 'branchCount', avg_value: 25, impact: 'medium' },
      ],
    }

    return baseData
  }

  const handleDownload = (report: Report) => {
    const reportData = generateReportData(report)
    const fileName = `${report.title.replace(/\s+/g, '_')}_${new Date(report.created_at).toISOString().split('T')[0]}`

    switch (report.report_format) {
      case 'json':
        downloadJSON(reportData, fileName)
        break
      case 'xml':
        downloadXML(reportData, fileName)
        break
      case 'pdf':
        downloadPDF(reportData, report, fileName)
        break
    }
  }

  const downloadJSON = (data: any, fileName: string) => {
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadXML = (data: any, fileName: string) => {
    const xmlString = generateXML(data)
    const blob = new Blob([xmlString], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateXML = (data: any): string => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<report>\n'
    
    xml += `  <report_id>${data.report_id}</report_id>\n`
    xml += `  <title>${escapeXML(data.title)}</title>\n`
    xml += `  <report_type>${data.report_type}</report_type>\n`
    xml += `  <generated_at>${data.generated_at}</generated_at>\n`
    
    xml += '  <summary>\n'
    xml += `    <total_predictions>${data.summary.total_predictions}</total_predictions>\n`
    xml += `    <high_risk>${data.summary.high_risk}</high_risk>\n`
    xml += `    <critical_issues>${data.summary.critical_issues}</critical_issues>\n`
    xml += `    <resolved>${data.summary.resolved}</resolved>\n`
    xml += '  </summary>\n'
    
    xml += '  <metrics>\n'
    xml += `    <defect_probability_avg>${data.metrics.defect_probability_avg}</defect_probability_avg>\n`
    xml += '    <risk_distribution>\n'
    xml += `      <low>${data.metrics.risk_distribution.low}</low>\n`
    xml += `      <medium>${data.metrics.risk_distribution.medium}</medium>\n`
    xml += `      <high>${data.metrics.risk_distribution.high}</high>\n`
    xml += `      <critical>${data.metrics.risk_distribution.critical}</critical>\n`
    xml += '    </risk_distribution>\n'
    xml += '  </metrics>\n'
    
    xml += '  <top_risk_features>\n'
    data.top_risk_features.forEach((feature: any) => {
      xml += '    <feature>\n'
      xml += `      <name>${escapeXML(feature.feature_name)}</name>\n`
      xml += `      <avg_value>${feature.avg_value}</avg_value>\n`
      xml += `      <impact>${feature.impact}</impact>\n`
      xml += '    </feature>\n'
    })
    xml += '  </top_risk_features>\n'
    
    xml += '</report>'
    return xml
  }

  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const downloadPDF = (data: any, report: Report, fileName: string) => {
    const doc = new jsPDF()
    
    // Set font
    doc.setFontSize(18)
    doc.text(report.title, 14, 20)
    
    doc.setFontSize(12)
    let yPos = 35
    
    // Report Info
    doc.setFontSize(10)
    doc.text(`Report ID: ${report.id}`, 14, yPos)
    yPos += 7
    doc.text(`Type: ${report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}`, 14, yPos)
    yPos += 7
    doc.text(`Generated: ${formatDate(report.created_at)}`, 14, yPos)
    yPos += 12
    
    // Summary Section
    doc.setFontSize(14)
    doc.text('Summary', 14, yPos)
    yPos += 8
    doc.setFontSize(10)
    doc.text(`Total Predictions: ${data.summary.total_predictions}`, 14, yPos)
    yPos += 7
    doc.text(`High Risk: ${data.summary.high_risk}`, 14, yPos)
    yPos += 7
    doc.text(`Critical Issues: ${data.summary.critical_issues}`, 14, yPos)
    yPos += 7
    doc.text(`Resolved: ${data.summary.resolved}`, 14, yPos)
    yPos += 12
    
    // Metrics Section
    doc.setFontSize(14)
    doc.text('Metrics', 14, yPos)
    yPos += 8
    doc.setFontSize(10)
    doc.text(`Average Defect Probability: ${(data.metrics.defect_probability_avg * 100).toFixed(1)}%`, 14, yPos)
    yPos += 12
    
    // Risk Distribution
    doc.setFontSize(12)
    doc.text('Risk Distribution', 14, yPos)
    yPos += 8
    doc.setFontSize(10)
    doc.text(`Low: ${data.metrics.risk_distribution.low}%`, 14, yPos)
    yPos += 7
    doc.text(`Medium: ${data.metrics.risk_distribution.medium}%`, 14, yPos)
    yPos += 7
    doc.text(`High: ${data.metrics.risk_distribution.high}%`, 14, yPos)
    yPos += 7
    doc.text(`Critical: ${data.metrics.risk_distribution.critical}%`, 14, yPos)
    yPos += 12
    
    // Top Risk Features
    doc.setFontSize(14)
    doc.text('Top Risk Features', 14, yPos)
    yPos += 8
    doc.setFontSize(10)
    data.top_risk_features.forEach((feature: any) => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 20
      }
      doc.text(`${feature.feature_name}: ${feature.avg_value} (${feature.impact} impact)`, 14, yPos)
      yPos += 7
    })
    
    // Save the PDF
    doc.save(`${fileName}.pdf`)
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
