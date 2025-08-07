import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react'

const FileUploadProgress = ({ 
  uploadProgress = {}, 
  selectedFiles = [],
  isUploading = false,
  className = "" 
}) => {
  // Don't show anything if no files or no upload progress
  if (!isUploading || Object.keys(uploadProgress).length === 0) {
    return null
  }

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase()
    switch (ext) {
      case 'pdf':
        return { icon: FileText, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' }
      case 'docx':
      case 'doc':
        return { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' }
      case 'xlsx':
      case 'xls':
        return { icon: FileText, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' }
      default:
        return { icon: FileText, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-900/30' }
    }
  }

  const getStatusIcon = (progress) => {
    switch (progress?.status) {
      case 'uploading':
        return { icon: Loader2, color: 'text-blue-500', spin: true }
      case 'processing':
        return { icon: Clock, color: 'text-yellow-500', spin: false }
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', spin: false }
      case 'error':
        return { icon: XCircle, color: 'text-red-500', spin: false }
      default:
        return { icon: Upload, color: 'text-gray-500', spin: false }
    }
  }

  const activeUploads = Object.entries(uploadProgress).filter(([_, progress]) => 
    progress && (progress.status === 'uploading' || progress.status === 'processing')
  )

  const completedUploads = Object.entries(uploadProgress).filter(([_, progress]) => 
    progress && progress.status === 'completed'
  )

  const errorUploads = Object.entries(uploadProgress).filter(([_, progress]) => 
    progress && progress.status === 'error'
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white dark:bg-dark-secondary border border-gray-200 dark:border-dark-primary rounded-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-primary bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                File Upload Progress
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {activeUploads.length} uploading, {completedUploads.length} completed
                {errorUploads.length > 0 && `, ${errorUploads.length} failed`}
              </p>
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="text-right">
            <div className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
              {Math.round((completedUploads.length / Object.keys(uploadProgress).length) * 100)}%
            </div>
            <div className="w-16 h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${(completedUploads.length / Object.keys(uploadProgress).length) * 100}%` 
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="max-h-64 overflow-y-auto">
        <AnimatePresence>
          {Object.entries(uploadProgress).map(([index, progress]) => {
            const file = selectedFiles[parseInt(index)]
            if (!file || !progress) return null

            const fileIconConfig = getFileIcon(file.name)
            const statusIconConfig = getStatusIcon(progress)
            const StatusIcon = statusIconConfig.icon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: parseInt(index) * 0.1 }}
                className="px-4 py-3 border-b border-gray-100 dark:border-dark-accent last:border-b-0 hover:bg-gray-50 dark:hover:bg-dark-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* File Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${fileIconConfig.bgColor}`}>
                    <fileIconConfig.icon className={`w-4 h-4 ${fileIconConfig.color}`} />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-dark-primary truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <StatusIcon 
                          className={`w-4 h-4 ${statusIconConfig.color} ${
                            statusIconConfig.spin ? 'animate-spin' : ''
                          }`} 
                        />
                        <span className={`text-xs font-medium ${statusIconConfig.color}`}>
                          {progress.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            progress.status === 'completed' ? 'bg-green-500' :
                            progress.status === 'error' ? 'bg-red-500' :
                            progress.status === 'processing' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percentage || 0}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-dark-muted font-mono">
                        {progress.percentage || 0}%
                      </span>
                    </div>

                    {/* Status Message */}
                    {progress.message && (
                      <p className="text-xs text-gray-500 dark:text-dark-muted mt-1">
                        {progress.message}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Footer Summary */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-dark-accent border-t border-gray-200 dark:border-dark-primary">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-dark-muted">
            {Object.keys(uploadProgress).length} file{Object.keys(uploadProgress).length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-4">
            {completedUploads.length > 0 && (
              <span className="text-green-600 dark:text-green-400">
                ✓ {completedUploads.length} completed
              </span>
            )}
            {errorUploads.length > 0 && (
              <span className="text-red-600 dark:text-red-400">
                ✗ {errorUploads.length} failed
              </span>
            )}
            {activeUploads.length > 0 && (
              <span className="text-blue-600 dark:text-blue-400">
                ↑ {activeUploads.length} uploading
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default FileUploadProgress