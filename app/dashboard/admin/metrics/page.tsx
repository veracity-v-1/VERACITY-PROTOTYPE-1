'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { FaShieldAlt } from 'react-icons/fa'

export default function MetricConfiguratorPage() {
  const { user, isAuthenticated } = useAuth()
  const [metricConfig, setMetricConfig] = useState({
    shapThreshold: 0.1,
    complexityThreshold: 10,
    riskThreshold: 0.7,
  })
  const [saved, setSaved] = useState(false)

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

  const handleSave = () => {
    // In real app, this would save to backend
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Metric Configurator</h1>
          <p className="text-gray-400 mt-1">Set thresholds for SHAP and Complexity analysis</p>
        </div>

        <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <h2 className="text-xl font-semibold text-white mb-6">Configure Analysis Thresholds</h2>
          <div className="space-y-8 max-w-3xl">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  SHAP Threshold
                </label>
                <span className="text-lg font-bold text-primary-400">{metricConfig.shapThreshold}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={metricConfig.shapThreshold}
                onChange={(e) => setMetricConfig({ ...metricConfig, shapThreshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Features with SHAP values above this threshold will be flagged as high-risk drivers
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Complexity Threshold
                </label>
                <span className="text-lg font-bold text-primary-400">{metricConfig.complexityThreshold}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={metricConfig.complexityThreshold}
                onChange={(e) => setMetricConfig({ ...metricConfig, complexityThreshold: parseInt(e.target.value) })}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Code with cyclomatic complexity above this value will be marked as high risk
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Risk Threshold
                </label>
                <span className="text-lg font-bold text-primary-400">{(metricConfig.riskThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={metricConfig.riskThreshold}
                onChange={(e) => setMetricConfig({ ...metricConfig, riskThreshold: parseFloat(e.target.value) })}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <p className="text-xs text-gray-400 mt-2">
                Overall defect probability above this threshold will trigger critical alerts
              </p>
            </div>

            <div className="pt-4 border-t border-dark-700 flex items-center gap-4">
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
              >
                Save Configuration
              </button>
              {saved && (
                <span className="text-green-400 text-sm font-medium">Configuration saved successfully!</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
