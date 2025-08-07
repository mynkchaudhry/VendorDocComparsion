import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, FileText, Zap, CheckCircle, AlertCircle } from 'lucide-react'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  type = 'default',
  message = '',
  progress = null,
  status = 'loading'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  }

  const statusIcons = {
    loading: Loader2,
    processing: Zap,
    analyzing: FileText,
    success: CheckCircle,
    error: AlertCircle
  }

  const statusColors = {
    loading: 'blue',
    processing: 'purple',
    analyzing: 'orange',
    success: 'green',
    error: 'red'
  }

  const Icon = statusIcons[status] || Loader2
  const currentColor = statusColors[status] || color

  const spinnerVariants = {
    animate: {
      rotate: 360
    }
  }

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7]
    }
  }

  const dotsVariants = {
    animate: {
      y: [0, -10, 0]
    }
  }

  if (type === 'file-processing') {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="relative mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        {progress !== null && (
          <div className="w-48 mb-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Processing...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="bg-blue-600 h-2 rounded-full"
              />
            </div>
          </div>
        )}
        
        {message && (
          <p className="text-sm text-gray-600 text-center max-w-xs">
            {message}
          </p>
        )}
      </div>
    )
  }

  if (type === 'dots') {
    return (
      <div className="flex items-center space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            variants={dotsVariants}
            animate="animate"
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2
            }}
            className={`w-2 h-2 rounded-full bg-current ${colorClasses[currentColor]}`}
          />
        ))}
        {message && (
          <span className={`ml-2 text-sm ${colorClasses[currentColor]}`}>
            {message}
          </span>
        )}
      </div>
    )
  }

  if (type === 'pulse') {
    return (
      <div className="flex items-center space-x-2">
        <motion.div
          variants={pulseVariants}
          animate="animate"
          transition={{
            duration: 1.5,
            repeat: Infinity
          }}
        >
          <Icon className={`${sizeClasses[size]} ${colorClasses[currentColor]}`} />
        </motion.div>
        {message && (
          <span className={`text-sm ${colorClasses[currentColor]}`}>
            {message}
          </span>
        )}
      </div>
    )
  }

  // Default spinner
  return (
    <div className="flex items-center space-x-2">
      <motion.div
        variants={spinnerVariants}
        animate="animate"
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <Icon className={`${sizeClasses[size]} ${colorClasses[currentColor]}`} />
      </motion.div>
      {message && (
        <span className={`text-sm ${colorClasses[currentColor]}`}>
          {message}
        </span>
      )}
    </div>
  )
}

// Specialized loaders for common use cases
export const FileProcessingLoader = ({ progress, message = "Processing your document..." }) => (
  <LoadingSpinner 
    type="file-processing" 
    progress={progress} 
    message={message}
    status="processing"
  />
)

export const AIAnalysisLoader = ({ message = "AI is analyzing your document..." }) => (
  <LoadingSpinner 
    type="pulse" 
    size="lg" 
    message={message}
    status="analyzing"
  />
)

export const UploadLoader = ({ progress, message = "Uploading..." }) => (
  <div className="flex flex-col items-center space-y-3">
    <LoadingSpinner size="lg" status="loading" />
    {progress !== null && (
      <div className="w-48">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{message}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="bg-blue-600 h-2 rounded-full"
          />
        </div>
      </div>
    )}
  </div>
)

export default LoadingSpinner