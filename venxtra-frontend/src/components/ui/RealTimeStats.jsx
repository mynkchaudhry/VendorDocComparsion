import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Users,
  FileText,
  Target
} from 'lucide-react'

const RealTimeStatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  previousValue, 
  subtitle, 
  color = 'blue',
  isLive = false,
  trend = null,
  animated = true 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600'
  }

  // Calculate trend if we have previous value
  const calculateTrend = () => {
    if (previousValue === null || previousValue === undefined || value === previousValue) {
      return null
    }
    
    const change = value - previousValue
    const percentChange = previousValue > 0 ? (change / previousValue) * 100 : 0
    
    return {
      change,
      percentChange: Math.abs(percentChange),
      isPositive: change > 0,
      isNegative: change < 0
    }
  }

  const calculatedTrend = trend || calculateTrend()

  return (
    <motion.div
      className="relative overflow-hidden h-full bg-white dark:bg-dark-secondary border border-gray-200 dark:border-dark-primary rounded-xl p-6 hover:shadow-lg dark:hover:shadow-primary-500/10 transition-all duration-300"
      whileHover={{ y: -2, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">LIVE</span>
        </div>
      )}

      <div className="flex items-center justify-between h-full">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-dark-muted mb-2">{title}</p>
            <div className="flex items-baseline space-x-2">
              <motion.p 
                key={value} // Key change triggers animation
                initial={animated ? { opacity: 0, scale: 0.8 } : false}
                animate={{ opacity: 1, scale: 1 }}
                className="text-3xl font-bold text-gray-900 dark:text-dark-primary"
              >
                {value}
              </motion.p>
              
              {/* Trend indicator */}
              <AnimatePresence>
                {calculatedTrend && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className={`flex items-center space-x-1 text-xs font-medium ${
                      calculatedTrend.isPositive 
                        ? 'text-green-600 dark:text-green-400' 
                        : calculatedTrend.isNegative 
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-dark-muted'
                    }`}
                  >
                    {calculatedTrend.isPositive && <TrendingUp className="w-3 h-3" />}
                    {calculatedTrend.isNegative && <TrendingDown className="w-3 h-3" />}
                    <span>
                      {calculatedTrend.change > 0 ? '+' : ''}{calculatedTrend.change}
                    </span>
                    {calculatedTrend.percentChange > 0 && (
                      <span className="text-xs opacity-75">
                        ({calculatedTrend.percentChange.toFixed(1)}%)
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-dark-muted mt-2 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center flex-shrink-0 ml-4`}>
          <motion.div
            animate={isLive ? { 
              scale: [1, 1.05, 1]
            } : {}}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Icon className="w-8 h-8 text-white" />
          </motion.div>
        </div>
      </div>

      {/* Pulse animation overlay for live updates */}
      <AnimatePresence>
        {isLive && (
          <motion.div
            className="absolute inset-0 border-2 border-green-400 rounded-xl"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ 
              opacity: [0, 0.2, 0], 
              scale: [1, 1.01, 1] 
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const RealTimeStats = ({ 
  stats = {}, 
  previousStats = {},
  isLiveUpdating = false,
  updateCount = 0,
  lastUpdateTime = null 
}) => {
  const statsConfig = [
    {
      key: 'totalProjects',
      icon: BarChart3,
      title: 'Active Projects',
      color: 'blue',
      subtitle: stats.totalProjects > 0 
        ? `${stats.totalProjects} project${stats.totalProjects > 1 ? 's' : ''} active` 
        : 'No projects created yet'
    },
    {
      key: 'totalVendors',
      icon: Users,
      title: 'Vendors',
      color: 'green',
      subtitle: stats.totalProjects > 0 
        ? `Across ${stats.totalProjects} project${stats.totalProjects !== 1 ? 's' : ''}` 
        : 'No vendors added yet'
    },
    {
      key: 'totalDocuments',
      icon: FileText,
      title: 'Documents',
      color: 'purple',
      subtitle: stats.totalDocuments > 0 
        ? `${stats.completedDocuments || 0} completed, ${stats.processingDocuments || 0} processing` 
        : 'No documents uploaded yet'
    },
    {
      key: 'successRate',
      icon: Target,
      title: 'Success Rate',
      color: 'orange',
      value: stats.successRate ? `${Math.round(stats.successRate)}%` : '0%',
      subtitle: stats.totalDocuments > 0 
        ? `${stats.completedDocuments || 0} of ${stats.totalDocuments} documents processed` 
        : 'No processing activity yet'
    },
    {
      key: 'processingDocuments',
      icon: Activity,
      title: 'Processing Now',
      color: 'indigo',
      subtitle: (stats.processingDocuments || 0) > 0 
        ? `${stats.processingDocuments} document${stats.processingDocuments > 1 ? 's' : ''} in progress`
        : 'No active processing'
    }
  ]

  return (
    <div className="space-y-6">

      {/* Stats Grid - 3+2 Layout */}
      <div className="space-y-6">
        {/* First row - 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsConfig.slice(0, 3).map((config, index) => (
            <motion.div
              key={config.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <RealTimeStatCard
                icon={config.icon}
                title={config.title}
                value={config.value || stats[config.key] || 0}
                previousValue={previousStats[config.key]}
                subtitle={config.subtitle}
                color={config.color}
                isLive={isLiveUpdating && (config.key === 'processingDocuments' || config.key === 'totalDocuments')}
                animated={true}
              />
            </motion.div>
          ))}
        </div>
        
        {/* Second row - 2 cards */}
        {statsConfig.length > 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {statsConfig.slice(3).map((config, index) => (
              <motion.div
                key={config.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: (index + 3) * 0.1 }}
              >
                <RealTimeStatCard
                  icon={config.icon}
                  title={config.title}
                  value={config.value || stats[config.key] || 0}
                  previousValue={previousStats[config.key]}
                  subtitle={config.subtitle}
                  color={config.color}
                  isLive={isLiveUpdating && (config.key === 'processingDocuments' || config.key === 'totalDocuments')}
                  animated={true}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RealTimeStats