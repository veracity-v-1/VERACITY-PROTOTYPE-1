'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { FaUser, FaCreditCard, FaBell, FaShieldAlt, FaCheck } from 'react-icons/fa'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'notifications' | 'security'>('profile')
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    email: user?.email || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    // In real app, this would save to backend
  }

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'month',
      features: [
        'Basic code analysis',
        'Limited predictions per month',
        'JSON/XML reports',
        'Community support',
      ],
      current: !user?.is_pro,
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'month',
      features: [
        'Unlimited code analysis',
        'Unlimited predictions',
        'PDF report generation',
        'Priority support',
        'Advanced analytics',
        'SHAP explainability',
        'Chatbot support',
      ],
      current: user?.is_pro,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Everything in Pro',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantees',
        'On-premise deployment',
        'Custom training',
      ],
      current: false,
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-dark-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaUser />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'subscription'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaCreditCard />
            Subscription
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaBell />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'security'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FaShieldAlt />
            Security
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
              <h2 className="text-xl font-semibold text-white mb-2">Current Plan</h2>
              <p className="text-gray-400 mb-6">
                {user?.is_pro ? 'You are currently on the Pro plan' : 'You are currently on the Free plan'}
              </p>
              {user?.is_pro && (
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                  <p className="text-primary-400 font-semibold">Pro Plan Active</p>
                  <p className="text-sm text-gray-400 mt-1">Your subscription renews on January 30, 2024</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Available Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border ${
                      plan.popular
                        ? 'border-primary-500/50 ring-2 ring-primary-500/20'
                        : 'border-dark-700/50'
                    } relative`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          POPULAR
                        </span>
                      </div>
                    )}
                    {plan.current && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                          <FaCheck className="text-xs" />
                          Current
                        </span>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-white">{plan.price}</span>
                        {plan.period && <span className="text-gray-400 ml-2">/{plan.period}</span>}
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <FaCheck className="text-primary-400 mt-1 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                        plan.current
                          ? 'bg-dark-700 text-gray-400 cursor-not-allowed'
                          : plan.popular
                          ? 'bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 text-white'
                          : 'bg-dark-700 hover:bg-dark-600 text-white'
                      }`}
                      disabled={plan.current}
                    >
                      {plan.current ? 'Current Plan' : plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
            <div className="space-y-4">
              {[
                { label: 'Email notifications', description: 'Receive email updates about your analyses' },
                { label: 'High risk alerts', description: 'Get notified when high-risk defects are detected' },
                { label: 'Weekly reports', description: 'Receive weekly summary reports' },
                { label: 'System updates', description: 'Notifications about new features and updates' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl p-6 border border-dark-700/50">
            <h2 className="text-xl font-semibold text-white mb-6">Security Settings</h2>
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold transition-colors">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="border-t border-dark-700 pt-6">
                <h3 className="text-lg font-medium text-white mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between p-4 bg-dark-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Enable 2FA</p>
                    <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
