'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa'

interface Message {
  id: number
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

// Mock chatbot responses
const getBotResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase()

  // Greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm here to help you understand defect predictions and provide mitigation strategies. What would you like to know?"
  }

  // Help
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return "I can help you understand defect predictions by explaining risk-driving features and providing mitigation strategies. Ask me about specific features, risk levels, or how to improve your code quality."
  }

  // Feature-specific questions
  if (lowerMessage.includes('complexity') || lowerMessage.includes('v(g)')) {
    return "High cyclomatic complexity (v(g)) indicates complex control flow. To mitigate:\n\n• Refactor complex functions by extracting smaller functions\n• Reduce nested conditionals and loops\n• Use early returns to simplify logic\n• Consider the strategy pattern for complex branching"
  }

  if (lowerMessage.includes('lines of code') || lowerMessage.includes('loc')) {
    return "High lines of code (LOC) can indicate maintainability issues. Recommendations:\n\n• Break down large files into smaller, manageable modules\n• Follow the Single Responsibility Principle\n• Split functionality across multiple files\n• Keep files focused on a single purpose"
  }

  if (lowerMessage.includes('functions') || lowerMessage.includes('num_functions')) {
    return "Too many functions in one file can reduce maintainability. Solutions:\n\n• Split into multiple modules or classes\n• Group related functions together\n• Use proper module organization\n• Consider using classes for related functionality"
  }

  if (lowerMessage.includes('branch') || lowerMessage.includes('branchcount')) {
    return "High branch count indicates complex control flow. To improve:\n\n• Simplify conditionals using early returns\n• Use strategy pattern for complex branching\n• Extract complex conditions into well-named functions\n• Reduce nesting levels"
  }

  if (lowerMessage.includes('maintainability')) {
    return "Low maintainability index suggests code quality issues. Improve by:\n\n• Adding clear comments and documentation\n• Reducing complexity\n• Improving code readability\n• Following consistent coding standards\n• Refactoring complex sections"
  }

  // Risk level questions
  if (lowerMessage.includes('risk') || lowerMessage.includes('defect')) {
    return "Based on code analysis, here are general recommendations:\n\n• High/Critical Risk: Conduct thorough code review, add comprehensive unit tests, and refactor complex sections\n• Medium Risk: Add unit tests and monitor code quality metrics\n• Low Risk: Continue following best practices and maintain current standards"
  }

  // Default response
  return "I can help you understand defect predictions and mitigation strategies. Try asking about:\n\n• Specific code metrics (complexity, LOC, functions, etc.)\n• Risk levels and what they mean\n• How to improve code quality\n• Mitigation strategies for specific issues\n\nOr type 'help' for more information."
}

function ChatbotContent() {
  const searchParams = useSearchParams()
  const predictionId = searchParams?.get('prediction_id') || null
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: predictionId 
        ? "Hello! I can help you understand the analysis results and provide mitigation strategies for this code. What would you like to know?"
        : "Hello! I'm your defect prediction assistant. I can help you understand risk factors and provide mitigation strategies. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: messages.length + 1,
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        type: 'bot',
        content: getBotResponse(input),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
      setLoading(false)
    }, 500)
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Defect Prediction Chatbot</h1>
        <p className="text-gray-400 mt-1">Get instant advice on code quality and mitigation strategies</p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-dark-800 rounded-lg border border-dark-700 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.type === 'bot' && (
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaRobot className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-lg p-4 ${
                  message.type === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-primary-100' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              {message.type === 'user' && (
                <div className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUser className="text-gray-400" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <FaRobot className="text-white" />
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t border-dark-700 p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about code metrics, risk levels, or mitigation strategies..."
              className="flex-1 px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaPaperPlane />
              Send
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Quick questions:</span>
            {['What is complexity?', 'How to reduce risk?', 'Help'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInput(q)}
                className="text-xs px-3 py-1 bg-dark-700 hover:bg-dark-600 text-gray-400 hover:text-white rounded-full transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ChatbotPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
        <ChatbotContent />
      </Suspense>
    </DashboardLayout>
  )
}
