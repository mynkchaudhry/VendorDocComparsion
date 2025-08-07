import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { projectsAPI, vendorsAPI } from '../utils/api'
import { Plus, Building2, ChevronRight, BarChart3, Search, ArrowLeft, Trash2 } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { showToast } from '../components/ui/Toast'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const ProjectDetails = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [showAddVendor, setShowAddVendor] = useState(false)
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset } = useForm()
  
  const { 
    actions: { setVendors, addVendor, addRecentActivity, addNotification }
  } = useAppStore()

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsAPI.getOne(projectId)
      return response.data
    }
  })

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors', projectId],
    queryFn: async () => {
      const response = await vendorsAPI.getByProject(projectId)
      return response.data
    }
  })

  // Update store when vendors are fetched
  useEffect(() => {
    if (vendors.length > 0) {
      setVendors(vendors)
    }
  }, [vendors, setVendors])

  const createVendorMutation = useMutation({
    mutationFn: vendorsAPI.create,
    onSuccess: (newVendor) => {
      // Invalidate both project-specific and global vendor queries
      queryClient.invalidateQueries(['vendors', projectId])
      queryClient.invalidateQueries(['vendors'])
      
      // Update the global store
      addVendor(newVendor.data)
      
      // Add activity and notification
      addRecentActivity({
        type: 'vendor',
        description: `Added vendor: ${newVendor.data.name}`,
        metadata: { vendorId: newVendor.data.id, projectId }
      })
      
      addNotification({
        type: 'success',
        title: 'Vendor Added',
        message: `"${newVendor.data.name}" has been added to the project.`
      })
      
      showToast.success(`Vendor "${newVendor.data.name}" added successfully!`)
      setShowAddVendor(false)
      reset()
    },
    onError: (error) => {
      showToast.error(error.response?.data?.detail || 'Failed to add vendor')
    }
  })


  const onSubmit = (data) => {
    createVendorMutation.mutate({
      ...data,
      project_id: projectId
    })
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-dark-primary text-sm font-medium rounded-md text-gray-700 dark:text-dark-secondary bg-white dark:bg-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white dark:bg-dark-secondary shadow px-4 py-5 sm:rounded-lg sm:px-6 border border-transparent dark:border-dark-primary">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-primary">{project?.name}</h1>
            {project?.description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">{project.description}</p>
            )}
          </div>
          {vendors.length >= 2 && (
            <div className="flex space-x-3">
              <Link
                to={`/projects/${projectId}/compare`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-dark-primary text-sm font-medium rounded-md text-gray-700 dark:text-dark-secondary bg-white dark:bg-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-accent"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Quick Compare
              </Link>
              <Link
                to={`/projects/${projectId}/results`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600"
              >
                <Search className="h-4 w-4 mr-2" />
                Advanced Compare
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-secondary shadow sm:rounded-lg border border-transparent dark:border-dark-primary">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-dark-primary">Vendors</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
                Add vendors to compare their proposals and pricing
              </p>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-4">
              <button
                onClick={() => setShowAddVendor(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </button>
            </div>
          </div>

          {vendors.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-muted" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-dark-primary">No vendors</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
                Get started by adding vendors to this project.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* First row - 3 cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.slice(0, 3).map((vendor, index) => {
                  const colors = ['blue', 'green', 'purple', 'orange', 'indigo', 'red']
                  const color = colors[index % colors.length]
                  const colorClasses = {
                    blue: 'from-blue-500 to-blue-600',
                    green: 'from-green-500 to-green-600',
                    purple: 'from-purple-500 to-purple-600',
                    orange: 'from-orange-500 to-orange-600',
                    red: 'from-red-500 to-red-600',
                    indigo: 'from-indigo-500 to-indigo-600'
                  }

                  return (
                    <div key={vendor.id} className="relative overflow-hidden h-full bg-white dark:bg-dark-secondary border border-gray-200 dark:border-dark-primary rounded-xl p-6 hover:shadow-lg dark:hover:shadow-primary-500/10 transition-all duration-300 group min-h-[160px]">
                      <Link
                        to={`/vendors/${vendor.id}`}
                        className="block h-full"
                      >
                        <div className="flex items-center justify-between h-full">
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-dark-muted mb-2">Vendor</p>
                              <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                                {vendor.name}
                              </h3>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-500 dark:text-dark-muted">
                                Click to view details
                              </p>
                            </div>
                          </div>
                          
                          <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300`}>
                            <Building2 className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>
              
              {/* Second row - 2 cards */}
              {vendors.length > 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {vendors.slice(3).map((vendor, index) => {
                    const colors = ['blue', 'green', 'purple', 'orange', 'indigo', 'red']
                    const color = colors[(index + 3) % colors.length] // Start from 4th color
                    const colorClasses = {
                      blue: 'from-blue-500 to-blue-600',
                      green: 'from-green-500 to-green-600',
                      purple: 'from-purple-500 to-purple-600',
                      orange: 'from-orange-500 to-orange-600',
                      red: 'from-red-500 to-red-600',
                      indigo: 'from-indigo-500 to-indigo-600'
                    }

                    return (
                      <div key={vendor.id} className="relative overflow-hidden h-full bg-white dark:bg-dark-secondary border border-gray-200 dark:border-dark-primary rounded-xl p-6 hover:shadow-lg dark:hover:shadow-primary-500/10 transition-all duration-300 group min-h-[160px]">
                        <Link
                          to={`/vendors/${vendor.id}`}
                          className="block h-full"
                        >
                          <div className="flex items-center justify-between h-full">
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-dark-muted mb-2">Vendor</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-primary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
                                  {vendor.name}
                                </h3>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm text-gray-500 dark:text-dark-muted">
                                  Click to view details
                                </p>
                              </div>
                            </div>
                            
                            <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center flex-shrink-0 ml-4 group-hover:scale-110 transition-transform duration-300`}>
                              <Building2 className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddVendor && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-black bg-opacity-75 dark:bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-secondary rounded-lg p-6 max-w-lg w-full border border-transparent dark:border-dark-primary">
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-primary mb-6">Add New Vendor</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-3">
                  Vendor Name
                </label>
                <input
                  {...register('name', { required: true })}
                  type="text"
                  className="w-full rounded-lg border border-gray-300 dark:border-dark-primary shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-3 text-sm bg-white dark:bg-dark-accent text-gray-900 dark:text-dark-primary placeholder-gray-500 dark:placeholder-dark-muted transition-colors duration-200"
                  placeholder="Enter vendor name"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVendor(false)
                    reset()
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-dark-secondary bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-primary rounded-lg hover:bg-gray-50 dark:hover:bg-dark-accent transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVendorMutation.isLoading}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 dark:bg-primary-500 border border-transparent rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 transition-colors duration-200"
                >
                  {createVendorMutation.isLoading ? 'Adding...' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default ProjectDetails