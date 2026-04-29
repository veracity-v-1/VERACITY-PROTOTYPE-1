'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { FaShieldAlt, FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa'

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'standard_user', projects: ['E-commerce Platform'], access: 'read' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'project_manager', projects: ['API Gateway', 'Data Analytics'], access: 'write' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'standard_user', projects: ['Payment Service'], access: 'read' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'dba', projects: ['All Projects'], access: 'admin' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'standard_user', projects: ['User Management'], access: 'read' },
]

export default function UserAccessPage() {
  const { user, isAuthenticated } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [usersList, setUsersList] = useState(users)

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

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: number) => {
    setUsersList(usersList.filter((u) => u.id !== id))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Access</h1>
            <p className="text-gray-400 mt-1">Manage who can see which project results</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
            <FaPlus />
            Add User
          </button>
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl border border-dark-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Projects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Access Level</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-semibold capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(user.projects) ? (
                          user.projects.map((project, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-dark-700 rounded">
                              {project}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs">{user.projects}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.access === 'admin'
                            ? 'bg-purple-500/20 text-purple-400'
                            : user.access === 'write'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {user.access}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-primary-400 hover:text-primary-300 p-2">
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
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
