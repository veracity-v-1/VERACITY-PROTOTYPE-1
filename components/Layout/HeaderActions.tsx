'use client'

import { useState } from 'react'
import { FaBell, FaQuestionCircle, FaCog } from 'react-icons/fa'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function HeaderActions() {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)

  // Mock notifications
  const notifications = [
    { id: 1, message: 'New analysis completed for payment_processor.py', time: '2 hours ago', read: false },
    { id: 2, message: 'High risk detected in api_gateway.py', time: '5 hours ago', read: false },
    { id: 3, message: 'Monthly report generated successfully', time: '1 day ago', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="flex items-center gap-3">
      {/* Support Button */}
      <div className="relative">
        <button
          onClick={() => setSupportOpen(!supportOpen)}
          className="p-2 hover:bg-dark-700 rounded-lg transition-colors relative"
        >
          <FaQuestionCircle className="text-xl text-gray-400 hover:text-primary-400" />
        </button>
        {supportOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-dark-800 rounded-lg border border-dark-700 shadow-xl z-50">
            <div className="p-4">
              <h3 className="text-white font-semibold mb-3">Support</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white py-2">Documentation</a>
                <a href="#" className="block text-gray-400 hover:text-white py-2">Contact Support</a>
                <a href="#" className="block text-gray-400 hover:text-white py-2">FAQ</a>
                <a href="#" className="block text-gray-400 hover:text-white py-2">Report Issue</a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications Button */}
      <div className="relative">
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          className="p-2 hover:bg-dark-700 rounded-lg transition-colors relative"
        >
          <FaBell className="text-xl text-gray-400 hover:text-primary-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
        {notificationsOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-dark-800 rounded-lg border border-dark-700 shadow-xl z-50">
            <div className="p-4 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-primary-400">{unreadCount} new</span>
                )}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">No notifications</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-dark-700 hover:bg-dark-700 cursor-pointer ${
                      !notif.read ? 'bg-dark-700/50' : ''
                    }`}
                  >
                    <p className="text-white text-sm">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-dark-700">
              <button className="w-full text-sm text-primary-400 hover:text-primary-300">
                View All Notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Link */}
      <Link
        href="/dashboard/settings"
        className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
      >
        <FaCog className="text-xl text-gray-400 hover:text-primary-400" />
      </Link>
    </div>
  )
}
