import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { projectsAPI, vendorsAPI, documentsAPI } from '../utils/api'
import { showToast } from '../components/ui/Toast'
import { useAuth } from '../contexts/AuthContext'
import useAppStore from '../store/useAppStore'
import { useTranslation } from '../contexts/TranslationContext'
import useRealTimeUpdates from '../hooks/useRealTimeUpdates'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import PageLoader from '../components/ui/PageLoader'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import ProfilePhoto from '../components/ui/ProfilePhoto'
import RealTimeStats from '../components/ui/RealTimeStats'
import { 
  Plus, FolderOpen, Trash2, Calendar, 
  ArrowRight, RefreshCw
} from 'lucide-react'


const Dashboard = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, projectId: null, projectName: '' })
  const [previousStats, setPreviousStats] = useState({})
  const queryClient = useQueryClient()

  // Real-time updates hook - optimized settings
  const {
    isLiveUpdating,
    processingLogs,
    lastUpdateTime,
    updateCount,
    forceUpdate
  } = useRealTimeUpdates({
    enablePolling: true,
    pollingInterval: 8000, // Reduced frequency
    enableProcessingLogs: false
  })

  const store = useAppStore()
  const { projects, analytics, vendors, documents } = store.data
  const { profile } = store.user
  const { 
    setProjects, 
    setVendors,
    setDocuments,
    addProject, 
    removeProject, 
    updateAnalytics,
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

  // Fetch all vendors with conservative refetch
  const { data: fetchedVendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await vendorsAPI.getAll()
      return response.data
    },
    refetchInterval: 60000, // Reduced to 60 seconds
    refetchIntervalInBackground: false
  })

  // Fetch all documents with conservative refetch
  const { data: fetchedDocuments = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await documentsAPI.getAll()
      return response.data
    },
    refetchInterval: 60000, // Reduced to 60 seconds
    refetchIntervalInBackground: false,
    staleTime: 30000 // Consider data fresh for 30 seconds
  })

  // Update store when data is fetched
  useEffect(() => {
    if (fetchedProjects.length > 0) {
      setProjects(fetchedProjects)
    }
  }, [fetchedProjects, setProjects])

  useEffect(() => {
    if (fetchedVendors.length > 0) {
      setVendors(fetchedVendors)
    }
  }, [fetchedVendors, setVendors])

  useEffect(() => {
    if (fetchedDocuments.length > 0) {
      setDocuments(fetchedDocuments)
    }
  }, [fetchedDocuments, setDocuments])

  // Update analytics when any data changes
  useEffect(() => {
    updateAnalytics({
      totalProjects: fetchedProjects.length,
      totalVendors: fetchedVendors.length,
      totalDocuments: fetchedDocuments.length,
    })
  }, [fetchedProjects.length, fetchedVendors.length, fetchedDocuments.length, updateAnalytics])

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
        actions: [
          {
            label: 'View Project',
            handler: () => window.location.href = `/projects/${newProject.data.id}`
          }
        ]
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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    
    // Check for duplicate project names
    const duplicateProject = projects.find(p => 
      p.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
    )
    
    if (duplicateProject) {
      showToast.error(`A project named "${formData.name}" already exists. Please choose a different name.`)
      return
    }
    
    createProjectMutation.mutate(formData)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleProjectClick = (project) => {
    addRecentActivity({
      type: 'navigation',
      description: `Opened project: ${project.name}`,
      metadata: { projectId: project.id }
    })
  }

  const handleConfirmDelete = () => {
    if (deleteDialog.projectId) {
      deleteProjectMutation.mutate(deleteDialog.projectId)
      setDeleteDialog({ isOpen: false, projectId: null, projectName: '' })
    }
  }

  const handleRefresh = async () => {
    try {
      // Store current stats for comparison
      const currentStats = {
        totalProjects: projects.length,
        totalVendors: vendors.length,
        totalDocuments: documents.length
      }
      setPreviousStats(currentStats)
      
      // Use the real-time update system
      const result = await forceUpdate()
      
      addRecentActivity({
        type: 'system',
        description: 'Dashboard manually refreshed',
        metadata: { 
          action: 'manual_refresh',
          timestamp: new Date().toISOString(),
          updateCount,
          counts: {
            projects: result.projects.length,
            vendors: result.vendors.length,
            documents: result.documents.length
          }
        }
      })
      
      showToast.success(`Dashboard refreshed! ${result.projects.length} projects, ${result.vendors.length} vendors, ${result.documents.length} documents`)
    } catch (error) {
      console.error('Refresh error:', error)
      showToast.error('Failed to refresh dashboard: ' + (error.message || 'Unknown error'))
    }
  }

  if (isLoading && projects.length === 0) {
    return <PageLoader message="Loading your dashboard..." fullScreen={false} />
  }

  // Optimized analytics calculations
  const processedDocs = documents.filter(doc => doc.processed || doc.status === 'completed' || doc.processing_status === 'completed')
  const processingDocs = documents.filter(doc => doc.processing_status === 'processing' || doc.processing_status === 'pending')
  const successRate = documents.length > 0 ? (processedDocs.length / documents.length) * 100 : 0


  return (
    <div className="space-y-8">
      {/* Header with Profile */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center space-x-4"
        >
          <ProfilePhoto size="xl" showUpload={false} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-primary">
              {t('dashboard.welcome')}, {(profile?.name || user?.name || user?.username || 'User').split(' ')[0]}!
            </h1>
            <p className="mt-2 text-gray-600 dark:text-dark-muted">
              {t('dashboard.overview')}
            </p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 lg:mt-0 flex items-center space-x-4"
        >
          <Button
            onClick={handleRefresh}
            variant="secondary"
            size="lg"
            className="relative overflow-hidden group"
            disabled={isLiveUpdating}
          >
            <motion.div
              animate={isLiveUpdating ? { 
                rotate: 360
              } : { rotate: 0 }}
              transition={isLiveUpdating ? { 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              } : { duration: 0.2 }}
              className="flex items-center"
            >
              <RefreshCw className={`w-5 h-5 ${isLiveUpdating ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-600'}`} />
            </motion.div>
            {/* Subtle pulse background */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={isLiveUpdating ? { 
                scale: [1, 1.1, 1], 
                opacity: [0, 0.1, 0]
              } : { scale: 0, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-blue-500 rounded-lg"
            />
          </Button>
          
          <Button
            onClick={() => {
              addRecentActivity({
                type: 'project',
                description: 'Started creating new project from dashboard header',
                metadata: { source: 'header' }
              })
              setShowCreateModal(true)
            }}
            variant="primary"
            size="lg"
            icon={Plus}
            iconPosition="left"
          >
            New Project
          </Button>
        </motion.div>
      </div>

      {/* Real-Time Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <RealTimeStats
          stats={{
            totalProjects: projects.length,
            totalVendors: vendors.length,
            totalDocuments: documents.length,
            processingDocuments: processingDocs.length,
            completedDocuments: processedDocs.length,
            successRate: successRate
          }}
          previousStats={previousStats}
          isLiveUpdating={isLiveUpdating}
          updateCount={updateCount}
          lastUpdateTime={lastUpdateTime}
        />
      </motion.div>



      <div className="space-y-8">
        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-primary">Recent Projects</h2>
            <Link 
              to="/projects" 
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 font-medium"
            >
              View all →
            </Link>
          </div>

          {projects.length === 0 ? (
            <Card className="text-center py-16" padding="lg">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-8"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full">
                  <FolderOpen className="w-12 h-12 text-blue-600" />
                </div>
              </motion.div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-primary mb-4">Ready to get started?</h3>
              <p className="text-gray-600 dark:text-dark-muted mb-8 max-w-lg mx-auto text-lg">
                Create your first project to start organizing vendors and making data-driven comparisons.
              </p>
              
              <Button
                onClick={() => {
                  addRecentActivity({
                    type: 'project',
                    description: 'Started creating first project from empty state',
                    metadata: { source: 'empty_state' }
                  })
                  setShowCreateModal(true)
                }}
                variant="primary"
                size="lg"
                icon={Plus}
                iconPosition="left"
              >
                Create Your First Project
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                >
                  <Link to={`/projects/${project.id}`} onClick={() => handleProjectClick(project)}>
                    <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <FolderOpen className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setDeleteDialog({
                                  isOpen: true,
                                  projectId: project.id,
                                  projectName: project.name
                                })
                              }}
                              className="p-2 rounded-lg bg-red-500 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700 text-white transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary group-hover:text-blue-600 dark:group-hover:text-primary-400 transition-colors mb-2 line-clamp-2">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-dark-secondary mb-4 line-clamp-2 h-10">
                            {project.description || 'No description provided'}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center text-xs text-gray-500 dark:text-dark-muted">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm mr-1">Open</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

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
              className="bg-white dark:bg-dark-secondary rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-dark-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4">
                  <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                    className="w-full rounded-lg border border-gray-300 dark:border-dark-primary px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:border-blue-500 bg-white dark:bg-dark-accent text-gray-900 dark:text-dark-primary placeholder-gray-500 dark:placeholder-dark-muted"
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

      {/* Delete Project Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, projectId: null, projectName: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteDialog.projectName}"? This action cannot be undone and will remove all associated vendors and documents.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        type="danger"
        loading={deleteProjectMutation.isLoading}
      />
    </div>
  )
}

export default Dashboard