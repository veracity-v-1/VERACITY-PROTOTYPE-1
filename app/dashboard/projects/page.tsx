'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/Layout/DashboardLayout'
import { FaPlus, FaGithub, FaFolder, FaTrash, FaEdit, FaCode } from 'react-icons/fa'

// Mock projects data
const mockProjects = [
  {
    id: 1,
    name: 'E-commerce Platform',
    description: 'Main e-commerce application with payment integration',
    repository_url: 'https://github.com/user/ecommerce',
    repository_type: 'github',
    files_analyzed: 45,
    last_analyzed: '2024-01-15',
  },
  {
    id: 2,
    name: 'API Gateway',
    description: 'Microservices API gateway implementation',
    repository_url: 'https://github.com/user/api-gateway',
    repository_type: 'github',
    files_analyzed: 32,
    last_analyzed: '2024-01-14',
  },
  {
    id: 3,
    name: 'Data Analytics',
    description: 'Python data processing and analytics tools',
    repository_url: null,
    repository_type: null,
    files_analyzed: 18,
    last_analyzed: '2024-01-13',
  },
]

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState(mockProjects)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repository_url: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const repository_url = formData.repository_url.trim() || null
    const newProject = repository_url
      ? {
          id: projects.length + 1,
          name: formData.name,
          description: formData.description,
          repository_url: repository_url,
          repository_type: 'github' as const,
          files_analyzed: 0,
          last_analyzed: new Date().toISOString().split('T')[0],
        }
      : {
          id: projects.length + 1,
          name: formData.name,
          description: formData.description,
          repository_url: null,
          repository_type: null,
          files_analyzed: 0,
          last_analyzed: new Date().toISOString().split('T')[0],
        }
    setProjects([...projects, newProject])
    setFormData({ name: '', description: '', repository_url: '' })
    setShowModal(false)
  }

  const handleDelete = (id: number) => {
    setProjects(projects.filter((p) => p.id !== id))
  }

  const handleAnalyze = (projectId: number) => {
    // Navigate to analysis page
    router.push('/dashboard/analysis')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-gray-400 mt-1">Manage your code analysis projects</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FaPlus /> New Project
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-dark-800 rounded-lg p-6 border border-dark-700 hover:border-primary-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {project.repository_type === 'github' ? (
                    <FaGithub className="text-2xl text-white" />
                  ) : (
                    <FaFolder className="text-2xl text-gray-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                    {project.repository_url && (
                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-500 hover:text-primary-400"
                      >
                        View Repository
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-gray-400 hover:text-white p-2">
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-gray-400 hover:text-red-400 p-2"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4">{project.description}</p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <FaCode />
                  <span>{project.files_analyzed} files</span>
                </div>
                <span className="text-gray-500">Updated {project.last_analyzed}</span>
              </div>

              <button
                onClick={() => handleAnalyze(project.id)}
                className="w-full mt-4 bg-dark-700 hover:bg-dark-600 text-white py-2 rounded-lg transition-colors"
              >
                Analyze Code
              </button>
            </div>
          ))}
        </div>

        {/* Add Project Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md border border-dark-700">
              <h2 className="text-xl font-semibold text-white mb-4">Create New Project</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="My Project"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Project description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub Repository URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.repository_url}
                    onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="https://github.com/user/repo"
                  />
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
                    Create
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
