import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { projectsAPI } from '../utils/api'
import { showToast } from '../components/ui/Toast'
import useAppStore from '../store/useAppStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import PageLoader from '../components/ui/PageLoader'
import { 
  Plus, FolderOpen, Trash2, Calendar, Search, Filter,
  MoreVertical, Star, Eye, Settings, Grid, List,
  SortAsc, SortDesc, Users, FileText, ArrowRight,
  Edit3, Copy, Archive, Download
} from 'lucide-react'

const ProjectCard = ({ project, onDelete, viewMode = 'grid' }) => {
  const [showMenu, setShowMenu] = useState(false)
  
  const handleProjectClick = () => {
    useAppStore.getState().actions.addRecentActivity({
      type: 'navigation',
      description: `Opened project: ${project.name}`,
      metadata: { projectId: project.id }
    })
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-dark-primary rounded-lg hover:shadow-md dark:hover:shadow-primary-500/10 transition-all duration-200"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-primary-500 dark:to-purple-500 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/projects/${project.id}`}
                    onClick={handleProjectClick}
                    className="text-lg font-semibold text-gray-900 dark:text-dark-primary hover:text-blue-600 dark:hover:text-primary-400 transition-colors truncate"
                  >
                    {project.name}
                  </Link>
                </div>
                <p className="text-sm text-gray-600 dark:text-dark-secondary truncate">
                  {project.description || 'No description'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-dark-muted">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-accent transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400 dark:text-dark-muted" />
                  </button>
                  
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-secondary rounded-lg shadow-lg dark:shadow-primary-500/20 border border-gray-200 dark:border-dark-primary py-1 z-20"
                      >
                        <Link
                          to={`/projects/${project.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-accent"
                        >
                          <Eye className="w-4 h-4 mr-3" />
                          View Project
                        </Link>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin + `/projects/${project.id}`)
                            showToast.success('Project link copied!')
                            setShowMenu(false)
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-accent"
                        >
                          <Copy className="w-4 h-4 mr-3" />
                          Copy Link
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this project?')) {
                              onDelete(project.id)
                            }
                            setShowMenu(false)
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          Delete Project
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden h-full">
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1">
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 bg-white/90 dark:bg-dark-secondary/90 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-dark-secondary transition-colors shadow-sm"
              >
                <MoreVertical className="w-4 h-4 text-gray-400 dark:text-dark-muted" />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-secondary rounded-lg shadow-lg dark:shadow-primary-500/20 border border-gray-200 dark:border-dark-primary py-1 z-20"
                  >
                    <Link
                      to={`/projects/${project.id}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-accent"
                    >
                      <Eye className="w-4 h-4 mr-3" />
                      View Project
                    </Link>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + `/projects/${project.id}`)
                        showToast.success('Project link copied!')
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-accent"
                    >
                      <Copy className="w-4 h-4 mr-3" />
                      Copy Link
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this project?')) {
                          onDelete(project.id)
                        }
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-3" />
                      Delete Project
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <Link to={`/projects/${project.id}`} onClick={handleProjectClick} className="block">
          <div className="mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-primary-500 dark:to-purple-500 rounded-xl flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary group-hover:text-blue-600 dark:group-hover:text-primary-400 transition-colors truncate">
                {project.name}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-dark-secondary line-clamp-2 mb-4 h-10">
              {project.description || 'No description provided'}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-dark-muted">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center text-blue-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="mr-1">Open</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  )
}

const Projects = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filterBy, setFilterBy] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const queryClient = useQueryClient()

  const store = useAppStore()
  const { projects } = store.data
  const { 
    setProjects, 
    addProject, 
    removeProject, 
    addRecentActivity,
    addNotification
  } = store.actions

  const { data: fetchedProjects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsAPI.getAll()
      return response.data
    }
  })

  useEffect(() => {
    if (fetchedProjects.length > 0) {
      setProjects(fetchedProjects)
    }
  }, [fetchedProjects, setProjects])

  const createProjectMutation = useMutation({
    mutationFn: projectsAPI.create,
    onSuccess: (newProject) => {
      queryClient.invalidateQueries(['projects'])
      addProject(newProject.data)
      setShowCreateModal(false)
      setFormData({ name: '', description: '' })
      
      addRecentActivity({
        type: 'project',
        description: `Created new project: ${newProject.data.name}`,
        metadata: { projectId: newProject.data.id }
      })
      
      addNotification({
        type: 'success',
        title: 'Project Created',
        message: `"${newProject.data.name}" has been created successfully.`,
      })
      
      showToast.success('Project created successfully!')
    },
    onError: (error) => {
      showToast.error(error.response?.data?.detail || 'Failed to create project')
    }
  })

  const deleteProjectMutation = useMutation({
    mutationFn: projectsAPI.delete,
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries(['projects'])
      const deletedProject = projects.find(p => p.id === projectId)
      removeProject(projectId)
      
      addRecentActivity({
        type: 'project',
        description: `Deleted project: ${deletedProject?.name || 'Unknown'}`,
        metadata: { projectId }
      })
      
      showToast.success('Project deleted successfully!')
    },
    onError: (error) => {
      showToast.error(error.response?.data?.detail || 'Failed to delete project')
    }
  })

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply category filter
    switch (filterBy) {
      case 'recent':
        filtered = filtered.filter(project => {
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return new Date(project.created_at) > weekAgo
        })
        break
      default:
        break
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [projects, searchQuery, filterBy, sortBy, sortOrder])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    createProjectMutation.mutate(formData)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }


  if (isLoading && projects.length === 0) {
    return <PageLoader message="Loading your projects..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-primary">Projects</h1>
          <p className="mt-2 text-gray-600 dark:text-dark-muted">
            Manage all your vendor comparison projects in one place
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 lg:mt-0"
        >
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="lg"
            icon={Plus}
            iconPosition="left"
          >
            New Project
          </Button>
        </motion.div>
      </div>

      {/* Filters and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                icon={Search}
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filters and View Controls */}
            <div className="flex items-center space-x-4">
              {/* Filter Dropdown */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-dark-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary"
              >
                <option value="all">All Projects</option>
                <option value="recent">Recent</option>
              </select>

              {/* Sort Controls */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                className="px-3 py-2 border border-gray-300 dark:border-dark-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-dark-accent rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-dark-secondary shadow-sm text-gray-900 dark:text-dark-primary' 
                      : 'text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-secondary'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-dark-secondary shadow-sm text-gray-900 dark:text-dark-primary' 
                      : 'text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-secondary'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Projects Grid/List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {filteredAndSortedProjects.length === 0 ? (
          <Card className="text-center py-16" padding="lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-primary-900/30 rounded-full">
                <FolderOpen className="w-10 h-10 text-blue-600 dark:text-primary-400" />
              </div>
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-primary mb-4">
              {searchQuery || filterBy !== 'all' ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-600 dark:text-dark-muted mb-8 max-w-md mx-auto">
              {searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first project to start organizing vendors and making data-driven comparisons.'
              }
            </p>
            
            {(!searchQuery && filterBy === 'all') && (
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                size="lg"
                icon={Plus}
                iconPosition="left"
              >
                Create Your First Project
              </Button>
            )}
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredAndSortedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <ProjectCard
                  project={project}
                  onDelete={deleteProjectMutation.mutate}
                  viewMode={viewMode}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Results Summary */}
      {filteredAndSortedProjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-sm text-gray-500 dark:text-dark-muted"
        >
          Showing {filteredAndSortedProjects.length} of {projects.length} projects
        </motion.div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white dark:bg-dark-secondary rounded-2xl p-6 max-w-md w-full shadow-2xl dark:shadow-primary-500/10 border border-transparent dark:border-dark-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-primary-900/30 rounded-xl mb-4">
                  <Plus className="w-6 h-6 text-blue-600 dark:text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-primary mb-2">Create New Project</h3>
                <p className="text-gray-600 dark:text-dark-muted">Set up a new vendor comparison project</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Project Name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-dark-primary px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 bg-white dark:bg-dark-accent text-gray-900 dark:text-dark-primary"
                    placeholder="Describe your project (optional)"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({ name: '', description: '' })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    loading={createProjectMutation.isLoading}
                    icon={Plus}
                    iconPosition="right"
                  >
                    Create Project
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Projects