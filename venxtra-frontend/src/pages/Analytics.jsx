import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  FileText, 
  FolderOpen,
  Clock,
  Target,
  Zap,
  Activity,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import PageLoader from '../components/ui/PageLoader'
import useAppStore from '../store/useAppStore'

const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = 'blue', description }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600'
  }

  return (
    <Card className="relative overflow-hidden h-full">
      <div className="flex items-center justify-between h-full min-h-[140px]">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-dark-muted">{title}</p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-gray-900 dark:text-dark-primary mt-2"
            >
              {value}
            </motion.p>
          </div>
          <div className="mt-2">
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-dark-muted line-clamp-2">{subtitle}</p>
            )}
          </div>
        </div>
        <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </Card>
  )
}

const ChartCard = ({ title, subtitle, children, actions }) => (
  <Card className="h-full">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 dark:text-dark-secondary mt-1">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
    {children}
  </Card>
)

const SimpleChart = ({ data, type = 'bar', height = 200 }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="space-y-4" style={{ height }}>
      {data.map((item, index) => (
        <div key={item.label || index} className="flex items-center space-x-4">
          <div className="w-20 text-sm text-gray-600 dark:text-dark-secondary truncate">{item.label}</div>
          <div className="flex-1 bg-gray-200 dark:bg-dark-accent rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 1, delay: index * 0.1 }}
              className={`h-2 rounded-full bg-gradient-to-r ${
                item.color || 'from-blue-500 to-blue-600'
              }`}
            />
          </div>
          <div className="w-12 text-sm font-medium text-gray-900 dark:text-dark-primary">{item.value}</div>
        </div>
      ))}
    </div>
  )
}

const MetricsList = ({ metrics }) => (
  <div className="space-y-4">
    {metrics.map((metric, index) => (
      <motion.div
        key={metric.name}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-accent rounded-lg"
      >
        <div className="flex items-center space-x-3">
          {metric.icon && <metric.icon className="w-5 h-5 text-gray-600 dark:text-dark-secondary" />}
          <div>
            <p className="font-medium text-gray-900 dark:text-dark-primary">{metric.name}</p>
            {metric.description && (
              <p className="text-sm text-gray-600 dark:text-dark-secondary">{metric.description}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900 dark:text-dark-primary">{metric.value}</p>
          {metric.change && (
            <p className={`text-sm ${metric.change.positive ? 'text-green-600' : 'text-red-600'}`}>
              {metric.change.positive ? '+' : ''}{metric.change.value}%
            </p>
          )}
        </div>
      </motion.div>
    ))}
  </div>
)

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')
  
  const {
    data: { projects, vendors, documents, analytics },
    user: { recentActivity },
    actions: { updateAnalytics, addRecentActivity }
  } = useAppStore()

  // Calculate real analytics from actual data
  const calculateAnalytics = () => {
    const totalProjects = projects.length
    const totalVendors = vendors.length
    const totalDocuments = documents.length
    
    // Calculate processing metrics from real data
    const processedDocs = documents.filter(doc => doc.processed || doc.status === 'completed')
    const processingSuccess = totalDocuments > 0 ? (processedDocs.length / totalDocuments) * 100 : 0
    
    // Calculate average processing time from documents
    const avgProcessingTime = documents.length > 0 
      ? documents.reduce((sum, doc) => sum + (doc.processingTime || 2000), 0) / documents.length / 1000
      : 0
    
    
    // Group vendors by category
    const vendorsByCategory = vendors.reduce((acc, vendor) => {
      const category = vendor.category || 'Other'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})
    
    // Calculate projects created over time (last 6 months)
    const projectsOverTime = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString('en', { month: 'short' })
      const monthProjects = projects.filter(project => {
        const projectDate = new Date(project.created_at)
        return projectDate.getMonth() === monthDate.getMonth() && 
               projectDate.getFullYear() === monthDate.getFullYear()
      }).length
      projectsOverTime.push({ label: monthName, value: monthProjects })
    }
    
    return {
      overview: {
        totalProjects,
        totalVendors,
        totalDocuments,
        processingSuccess: Math.round(processingSuccess * 10) / 10,
        avgComparisonTime: avgProcessingTime > 0 ? `${avgProcessingTime.toFixed(1)}s` : '0s'
      },
      projectsOverTime,
      vendorsByCategory: Object.entries(vendorsByCategory).map(([category, count], index) => {
        const colors = [
          'from-blue-500 to-blue-600',
          'from-green-500 to-green-600', 
          'from-purple-500 to-purple-600',
          'from-orange-500 to-orange-600',
          'from-red-500 to-red-600',
          'from-indigo-500 to-indigo-600'
        ]
        return {
          label: category,
          value: count,
          color: colors[index % colors.length]
        }
      }),
      processingMetrics: [
        {
          name: 'Document Processing Rate',
          description: 'Successfully processed documents',
          value: totalDocuments > 0 ? `${Math.round(processingSuccess * 10) / 10}%` : '0%',
          icon: FileText,
          change: processingSuccess > 90 ? { positive: true, value: Math.round(processingSuccess - 90)} : null
        },
        {
          name: 'Average Analysis Time',
          description: 'Time to process each document',
          value: avgProcessingTime > 0 ? `${avgProcessingTime.toFixed(1)}s` : '0s',
          icon: Clock,
          change: avgProcessingTime < 3 ? { positive: true, value: Math.round((3 - avgProcessingTime) * 10)} : null
        },
        {
          name: 'Active Projects',
          description: 'Total projects with vendors',
          value: totalProjects.toString(),
          icon: Target,
          change: totalProjects > 0 ? { positive: true, value: totalProjects } : null
        }
      ]
    }
  }
  
  const realAnalytics = calculateAnalytics()

  useEffect(() => {
    addRecentActivity({
      type: 'navigation',
      description: 'Viewed Analytics dashboard',
      metadata: { page: 'analytics' }
    })
  }, [addRecentActivity])

  const stats = [
    {
      icon: FolderOpen,
      title: 'Active Projects',
      value: realAnalytics.overview.totalProjects,
      subtitle: realAnalytics.overview.totalProjects > 0 ? 'Projects created' : 'No projects yet',
      color: 'blue'
    },
    {
      icon: Users,
      title: 'Vendors Added',
      value: realAnalytics.overview.totalVendors,
      subtitle: realAnalytics.overview.totalVendors > 0 ? `Across ${realAnalytics.overview.totalProjects} projects` : 'No vendors yet',
      color: 'green'
    },
    {
      icon: FileText,
      title: 'Documents Processed',
      value: realAnalytics.overview.totalDocuments,
      subtitle: realAnalytics.overview.totalDocuments > 0 ? `${Math.round(realAnalytics.overview.processingSuccess)}% success rate` : 'No documents processed',
      color: 'purple'
    },
    {
      icon: Zap,
      title: 'AI Processing',
      value: `${Math.round(realAnalytics.overview.processingSuccess)}%`,
      subtitle: realAnalytics.overview.totalDocuments > 0 ? 'Success rate' : 'No processing yet',
      color: 'indigo'
    },
    {
      icon: Clock,
      title: 'Avg Analysis Time',
      value: realAnalytics.overview.avgComparisonTime,
      subtitle: realAnalytics.overview.totalDocuments > 0 ? 'Per document' : 'No analysis yet',
      color: 'red'
    }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: FolderOpen }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-primary">Analytics</h1>
          <p className="mt-2 text-gray-600 dark:text-dark-muted">
            Insights and performance metrics for your vendor comparisons
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 lg:mt-0 flex items-center space-x-4"
        >
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-dark-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button
            variant="secondary"
            icon={Download}
            iconPosition="left"
            onClick={() => {
              addRecentActivity({
                type: 'analytics',
                description: 'Exported analytics report',
                metadata: { timeRange }
              })
            }}
          >
            Export Report
          </Button>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="border-b border-gray-200 dark:border-dark-primary">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 dark:border-primary-400 text-blue-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-secondary hover:border-gray-300 dark:hover:border-dark-primary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Stats Grid - 3+2 Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-6"
      >
        {/* First row - 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.slice(0, 3).map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>
        
        {/* Second row - 2 cards full width */}
        {stats.length > 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.slice(3).map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
              >
                <StatCard {...stat} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <ChartCard
              title="Projects Over Time"
              subtitle={realAnalytics.projectsOverTime.length > 0 ? "Project creation trends" : "No project history yet"}
              actions={
                <Button variant="ghost" size="sm" icon={Filter}>
                  Filter
                </Button>
              }
            >
              {realAnalytics.projectsOverTime.some(item => item.value > 0) ? (
                <SimpleChart data={realAnalytics.projectsOverTime} />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-dark-muted">
                  <div className="text-center">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-dark-muted" />
                    <p className="text-sm">No projects created yet</p>
                    <p className="text-xs text-gray-400 dark:text-dark-muted mt-1">Start creating projects to see trends</p>
                  </div>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Vendors by Category"
              subtitle={realAnalytics.vendorsByCategory.length > 0 ? "Distribution of vendor types" : "No vendor categories yet"}
            >
              {realAnalytics.vendorsByCategory.length > 0 ? (
                <SimpleChart data={realAnalytics.vendorsByCategory} />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500 dark:text-dark-muted">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-dark-muted" />
                    <p className="text-sm">No vendors categorized yet</p>
                    <p className="text-xs text-gray-400 dark:text-dark-muted mt-1">Add vendors to projects to see distribution</p>
                  </div>
                </div>
              )}
            </ChartCard>
          </div>
        )}

        {activeTab === 'projects' && (
          <ChartCard
            title="Project Performance Metrics"
            subtitle={projects.length > 0 ? "Key indicators for your projects" : "No projects to analyze yet"}
          >
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-dark-primary mb-6">Your Projects</h4>
                  <div className="space-y-4">
                    {projects.map((project, index) => {
                      // Count vendors and documents that belong to this project
                      const projectVendors = vendors.filter(v => 
                        v.project_id === project.id || 
                        v.projectId === project.id ||
                        (v.project && v.project === project.id)
                      )
                      const projectDocuments = documents.filter(d => 
                        d.project_id === project.id || 
                        d.projectId === project.id ||
                        (d.project && d.project === project.id)
                      )
                      
                      return (
                        <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-accent rounded-lg border border-gray-200 dark:border-dark-primary hover:bg-gray-100 dark:hover:bg-dark-primary/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-primary-500 dark:to-purple-500 rounded-lg flex items-center justify-center">
                              <FolderOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-dark-primary">{project.name}</p>
                              <p className="text-sm text-gray-600 dark:text-dark-secondary">
                                Created {new Date(project.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-600 dark:text-primary-400">
                              {projectVendors.length} vendor{projectVendors.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-muted">
                              {projectDocuments.length} document{projectDocuments.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-dark-primary mb-6">System Overview</h4>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-primary-900/20 rounded-lg border border-blue-200 dark:border-primary-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-4 h-4 text-blue-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <span className="font-medium text-blue-900 dark:text-primary-200 block">Total Projects</span>
                            <span className="text-xs text-blue-700 dark:text-primary-300">Active projects</span>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-blue-600 dark:text-primary-400">{projects.length}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <span className="font-medium text-green-900 dark:text-green-200 block">Total Vendors</span>
                            <span className="text-xs text-green-700 dark:text-green-300">Across all projects</span>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{vendors.length}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <span className="font-medium text-purple-900 dark:text-purple-200 block">Documents</span>
                            <span className="text-xs text-purple-700 dark:text-purple-300">
                              {documents.length > 0 ? `${Math.round((documents.filter(d => d.processed || d.status === 'completed').length / documents.length) * 100)}% processed` : 'None uploaded'}
                            </span>
                          </div>
                        </div>
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{documents.length}</span>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-dark-muted">
                <div className="text-center">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-dark-muted" />
                  <p className="text-sm">No projects created yet</p>
                  <p className="text-xs text-gray-400 dark:text-dark-muted mt-1">Create your first project to see analytics</p>
                </div>
              </div>
            )}
          </ChartCard>
        )}

      </motion.div>

    </div>
  )
}

export default Analytics