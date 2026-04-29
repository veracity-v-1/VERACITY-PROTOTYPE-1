'use client'

import { ReactNode, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  FaHome,
  FaProjectDiagram,
  FaChartLine,
  FaFileAlt,
  FaCog,
  FaUsers,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaComments,
  FaShieldAlt,
} from 'react-icons/fa'
import HeaderActions from './HeaderActions'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const navigation = user?.role === 'dba'
    ? [
        { name: 'Analysis Dashboard', href: '/dashboard/admin/dashboard', icon: FaChartLine },
        { name: 'Project Registry', href: '/dashboard/admin/projects', icon: FaProjectDiagram },
        { name: 'Metric Configurator', href: '/dashboard/admin/metrics', icon: FaCog },
        { name: 'Scan Logs', href: '/dashboard/admin/logs', icon: FaFileAlt },
        { name: 'User Access', href: '/dashboard/admin/users', icon: FaUsers },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard', icon: FaHome },
        { name: 'Projects', href: '/dashboard/projects', icon: FaProjectDiagram },
        { name: 'Analysis', href: '/dashboard/analysis', icon: FaChartLine },
        { name: 'Reports', href: '/dashboard/reports', icon: FaFileAlt },
        { name: 'Chatbot', href: '/dashboard/chatbot', icon: FaComments },
        ...(user?.role === 'project_manager'
          ? [{ name: 'Admin', href: '/dashboard/admin', icon: FaShieldAlt }]
          : []),
      ]

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return pathname.startsWith('/dashboard/admin')
    }
    return pathname === href
  }

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } relative bg-dark-800/95 backdrop-blur-xl border-r border-dark-700/50 transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Gradient Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-800 via-dark-800/95 to-dark-900">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-500/10 via-primary-400/5 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-primary-500/5 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,160,133,0.08),transparent_60%)]"></div>
        </div>

        {/* Logo */}
        {/* Logo Area */}
<div className="relative z-10 flex items-center justify-between p-4 border-b border-dark-700/50">
  <div className="flex items-center gap-3">
    {/* The Shape Icon (Always shows) */}
    <img 
      src="/brand_icon.png" 
      alt="Icon" 
      className="w-10 h-10 object-contain flex-shrink-0" 
    />
    
    {/* The Font Logo (Only shows when sidebar is open) */}
    {sidebarOpen && (
      <img 
        src="/brand_text.png" 
        alt="Veracity" 
        className="h-6 w-auto object-contain animate-in fade-in duration-300" 
      />
    )}
  </div>
  <button onClick={() => setSidebarOpen(!sidebarOpen)} className="...">
    {sidebarOpen ? <FaTimes /> : <FaBars />}
  </button>
</div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-primary-500 to-primary-400 text-white shadow-lg shadow-primary-500/30'
                    : 'text-gray-400 hover:bg-dark-700/50 hover:text-white'
                }`}
              >
                <Icon className={`text-lg flex-shrink-0 ${active ? 'text-white' : 'group-hover:text-primary-400'}`} />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </a>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="relative z-10 p-4 border-t border-dark-700/50">
          <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-dark-700/30 backdrop-blur-sm border border-dark-600/30">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-sm font-semibold text-dark-900">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.username}</p>
                <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-dark-700/50 rounded-xl transition-all duration-200 group"
          >
            <FaSignOutAlt className="flex-shrink-0 group-hover:text-red-400" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-dark-800 border-b border-dark-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {navigation.find((item) => isActive(item.href))?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
              {user?.is_pro && (
                <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-xs font-semibold rounded-full">
                  PRO
                </span>
              )}
              <HeaderActions />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-dark-900 p-6">{children}</main>
      </div>
    </div>
  )
}
