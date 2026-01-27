'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { FaShieldAlt, FaSearch, FaEdit, FaTrash, FaPlus } from 'react-icons/fa'

const projects = [
  { id: 1, name: 'E-commerce Platform', owner: 'John Doe', files: 45, lastScan: '2024-01-15', status: 'active' },
  { id: 2, name: 'API Gateway', owner: 'Jane Smith', files: 32, lastScan: '2024-01-14', status: 'active' },
  { id: 3, name: 'Data Analytics', owner: 'Bob Johnson', files: 18, lastScan: '2024-01-13', status: 'paused' },
  { id: 4, name: 'Payment Service', owner: 'Alice Brown', files: 67, lastScan: '2024-01-12', status: 'active' },
  { id: 5, name: 'User Management', owner: 'Charlie Wilson', files: 28, lastScan: '2024-01-11', status: 'active' },
  { id: 6, name: 'Notification Service', owner: 'Diana Prince', files: 42, lastScan: '2024-01-10', status: 'active' },
  { id: 7, name: 'Authentication Module', owner: 'Eve Adams', files: 35, lastScan: '2024-01-09', status: 'paused' },
]

export default function ProjectRegistryPage() {
  const { user, isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [projectsList, setProjectsList] = useState(projects)

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

  const filteredProjects = projectsList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.owner.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: number) => {
    setProjectsList(projectsList.filter((p) => p.id !== id))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Project Registry</h1>
            <p className="text-gray-400 mt-1">List of codebases being analyzed</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
            <FaPlus />
            Add Project
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Files</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Last Scan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-white font-medium">{project.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{project.owner}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{project.files}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{project.lastScan}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          project.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-primary-400 hover:text-primary-300 p-2">
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
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
