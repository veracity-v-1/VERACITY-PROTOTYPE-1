'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import ChatbotPanel from '@/components/ChatbotPanel'
import { FaArrowLeft, FaComments } from 'react-icons/fa'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

// Mock prediction data - in real app, this would come from API
const mockPredictionData = {
  id: 1,
  defect_probability: 0.75,
  risk_level: 'high',
  file_path: 'payment_processor.py',
  code_snippet: `def process_payment(user_id, amount, currency):
    """Process payment for user"""
    # High complexity function with multiple branches
    if amount <= 0:
        raise ValueError("Amount must be positive")
    
    if currency not in ['USD', 'EUR', 'GBP']:
        raise ValueError("Unsupported currency")
    
    user = get_user(user_id)
    if not user:
        raise ValueError("User not found")
    
    balance = get_balance(user_id)
    if balance < amount:
        raise ValueError("Insufficient funds")
    
    # Complex nested logic
    for transaction in get_recent_transactions(user_id):
        if transaction.status == 'pending':
            if transaction.amount > amount:
                process_refund(transaction.id)
            else:
                update_transaction(transaction.id, 'completed')
    
    return create_transaction(user_id, amount, currency)`,
  top_risk_features: [
    { feature_name: 'v(g)', shap_value: 0.15, feature_value: 12, impact: 'positive', abs_shap_value: 0.15 },
    { feature_name: 'loc', shap_value: 0.12, feature_value: 450, impact: 'positive', abs_shap_value: 0.12 },
    { feature_name: 'branchCount', shap_value: 0.10, feature_value: 25, impact: 'positive', abs_shap_value: 0.10 },
    { feature_name: 'num_functions', shap_value: 0.08, feature_value: 15, impact: 'positive', abs_shap_value: 0.08 },
    { feature_name: 'maintainability_index', shap_value: -0.05, feature_value: 45, impact: 'negative', abs_shap_value: 0.05 },
    { feature_name: 'num_classes', shap_value: 0.04, feature_value: 3, impact: 'positive', abs_shap_value: 0.04 },
    { feature_name: 'num_imports', shap_value: 0.03, feature_value: 8, impact: 'positive', abs_shap_value: 0.03 },
  ],
  metrics: {
    loc: 450,
    'v(g)': 12,
    'ev(g)': 8.5,
    'iv(g)': 6.2,
    branchCount: 25,
    num_functions: 15,
    num_classes: 3,
    num_imports: 8,
    maintainability_index: 45,
    lOCode: 420,
    lOComment: 30,
    lOBlank: 20,
  },
  created_at: '2024-01-15T10:30:00Z',
}

export default function PredictionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [prediction, setPrediction] = useState(mockPredictionData)
  const [loading, setLoading] = useState(true)
  const [chatbotOpen, setChatbotOpen] = useState(false)

  useEffect(() => {
    // In real app, fetch prediction by ID
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }, [params.id])

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      default:
        return 'bg-green-500/20 text-green-400 border-green-500/50'
    }
  }


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-gray-400">Loading prediction details...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-400 hover:text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Analysis Results</h1>
              <p className="text-gray-400 mt-1">{prediction.file_path}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-lg border font-semibold ${getRiskColor(
                prediction.risk_level
              )}`}
            >
              {prediction.risk_level.toUpperCase()} RISK
            </span>
            <button
              onClick={() => setChatbotOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <FaComments />
              Chatbot Support
            </button>
          </div>
        </div>

        {/* Prediction Summary - Same as Analysis Page */}
        <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Analysis Results</h2>
            <span
              className={`px-4 py-2 rounded-lg border font-semibold ${getRiskColor(
                prediction.risk_level
              )}`}
            >
              {prediction.risk_level.toUpperCase()} RISK
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-700/50 rounded-lg p-4 border border-dark-600/50">
              <p className="text-sm text-gray-400 mb-1">Defect Probability</p>
              <p className="text-3xl font-bold text-white">
                {(prediction.defect_probability * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-4 border border-dark-600/50">
              <p className="text-sm text-gray-400 mb-1">Risk Level</p>
              <p className="text-3xl font-bold text-white capitalize">{prediction.risk_level}</p>
            </div>
            <div className="bg-dark-700/50 rounded-lg p-4 border border-dark-600/50">
              <p className="text-sm text-gray-400 mb-1">File</p>
              <p className="text-lg font-semibold text-white">{prediction.file_path || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* SHAP Features - Same as Analysis Page */}
        <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Top Risk-Driving Features (SHAP)</h2>
          <div className="space-y-3">
            {prediction.top_risk_features.map((feature: any, index: number) => (
              <div
                key={index}
                className="bg-dark-700/50 rounded-lg p-4 flex items-center justify-between border border-dark-600/50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                      feature.impact === 'positive'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{feature.feature_name}</p>
                    <p className="text-sm text-gray-400">Value: {feature.feature_value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      feature.shap_value > 0 ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {feature.shap_value > 0 ? '+' : ''}
                    {feature.shap_value.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400">SHAP Value</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Display - Same as Analysis Page */}
        <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Analyzed Code</h2>
          <div className="rounded-lg overflow-hidden">
            <SyntaxHighlighter
              language="python"
              style={vscDarkPlus}
              customStyle={{ margin: 0, borderRadius: '8px' }}
            >
              {prediction.code_snippet}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Chatbot Support */}
        <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Need Help?</h2>
              <p className="text-gray-400">Get mitigation strategies and advice from our AI chatbot</p>
            </div>
            <button
              onClick={() => setChatbotOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-semibold"
            >
              <FaComments />
              Open Chatbot
            </button>
          </div>
        </div>
      </div>

      {/* Chatbot Panel */}
      <ChatbotPanel
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        predictionId={prediction.id}
      />
    </DashboardLayout>
  )
}
