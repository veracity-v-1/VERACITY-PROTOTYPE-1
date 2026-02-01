'use client'

import { useState, useRef } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import ChatbotPanel from '@/components/ChatbotPanel'
import { FaUpload, FaGithub, FaCode, FaExclamationTriangle, FaCheckCircle, FaFile, FaComments } from 'react-icons/fa'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Prediction } from '@/types/prediction'

// Mock prediction data
const mockPrediction: Prediction = {
  id: 1,
  defect_probability: 0.75,
  risk_level: 'high',
  top_risk_features: [
    { feature_name: 'v(g)', shap_value: 0.15, feature_value: 12, impact: 'positive' },
    { feature_name: 'loc', shap_value: 0.12, feature_value: 450, impact: 'positive' },
    { feature_name: 'branchCount', shap_value: 0.10, feature_value: 25, impact: 'positive' },
    { feature_name: 'num_functions', shap_value: 0.08, feature_value: 15, impact: 'positive' },
    { feature_name: 'maintainability_index', shap_value: -0.05, feature_value: 45, impact: 'negative' },
  ],
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
  file_path: 'payment_processor.py',
}

export default function AnalysisPage() {
  const [code, setCode] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input')
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [chatbotOpen, setChatbotOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type === 'text/x-python' || file.name.endsWith('.py'))) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setCode(content)
      }
      reader.readAsText(file)
    } else {
      // Invalid file type
    }
  }

  const handleAnalyze = async () => {
    if (!code.trim()) return

    setAnalyzing(true)
    setAnalysisProgress(0)
    setCurrentStep('Initializing analysis...')

    // Simulate real-time analysis progress
    const steps = [
      { progress: 20, step: 'Parsing code structure...' },
      { progress: 40, step: 'Extracting code metrics...' },
      { progress: 60, step: 'Calculating complexity...' },
      { progress: 80, step: 'Running ML model...' },
      { progress: 90, step: 'Generating SHAP explanations...' },
      { progress: 100, step: 'Analysis complete!' },
    ]

    for (const { progress, step } of steps) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setAnalysisProgress(progress)
      setCurrentStep(step)
    }

    // Final result
    setTimeout(() => {
      setPrediction({
        ...mockPrediction,
        code_snippet: code,
      })
      setAnalyzing(false)
      setAnalysisProgress(0)
      setCurrentStep('')
      setActiveTab('results')
    }, 500)
  }

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Code Analysis</h1>
          <p className="text-gray-400 mt-1">Analyze Python code for potential defects</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-dark-700">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'input'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Code Input
          </button>
          {prediction && (
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'results'
                  ? 'text-primary-500 border-b-2 border-primary-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Analysis Results
            </button>
          )}
        </div>

        {activeTab === 'input' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Code Input */}
            <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Python Code</h2>
                <div className="flex gap-2">
                  <button className="p-2 bg-dark-700/50 hover:bg-dark-600 border border-dark-600/50 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <FaGithub />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-dark-700/50 hover:bg-dark-600 border border-dark-600/50 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <FaUpload />
                  </button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,text/x-python"
                onChange={handleFileUpload}
                className="hidden"
              />
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your Python code here or upload a file..."
                className="w-full h-96 px-4 py-3 bg-dark-900 border border-dark-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {code && (
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-2">
                  <FaFile className="text-primary-500" />
                  <span>{code.split('\n').length} lines of code</span>
                </div>
              )}
              
              {/* Real-time Analysis Progress */}
              {analyzing && (
                <div className="mt-4 p-4 bg-dark-700/50 rounded-lg border border-primary-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{currentStep}</span>
                    <span className="text-sm text-primary-400 font-semibold">{analysisProgress}%</span>
                  </div>
                  <div className="w-full bg-dark-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-400 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${analysisProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!code.trim() || analyzing}
                className="w-full mt-4 bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 hover:shadow-xl"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Code'
                )}
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
              <h2 className="text-lg font-semibold text-white mb-4">How to Use</h2>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-400 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Paste Code</h3>
                    <p className="text-sm">Copy and paste your Python code into the editor</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-400 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Upload File</h3>
                    <p className="text-sm">Click the upload button to select a Python (.py) file</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-400 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Connect GitHub</h3>
                    <p className="text-sm">Connect your GitHub repository for automatic analysis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-400 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">Analyze</h3>
                    <p className="text-sm">Click Analyze Code to get real-time defect predictions and SHAP insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          prediction && (
            <div className="space-y-6">
              {/* Prediction Summary */}
              <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Analysis Results</h2>
                  <span
                    className={`px-4 py-2 rounded-lg border font-semibold ${getRiskColor(
                      prediction.risk_level
                    )}`}
                  >
                    {prediction.risk_level.toUpperCase()} RISK
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-dark-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Defect Probability</p>
                    <p className="text-3xl font-bold text-white">
                      {(prediction.defect_probability * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Risk Level</p>
                    <p className="text-3xl font-bold text-white capitalize">{prediction.risk_level}</p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">File</p>
                    <p className="text-lg font-semibold text-white">{prediction.file_path || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* SHAP Features */}
              <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                <h2 className="text-lg font-semibold text-white mb-4">Top Risk-Driving Features (SHAP)</h2>
                <div className="space-y-3">
                  {prediction.top_risk_features.map((feature, index: number) => (
                    <div
                      key={index}
                      className="bg-dark-700 rounded-lg p-4 flex items-center justify-between"
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

              {/* Code Display */}
              <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
                <h2 className="text-lg font-semibold text-white mb-4">Analyzed Code</h2>
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
          )
        )}
      </div>

      {/* Chatbot Panel */}
      <ChatbotPanel
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        predictionId={prediction?.id}
      />
    </DashboardLayout>
  )
}
