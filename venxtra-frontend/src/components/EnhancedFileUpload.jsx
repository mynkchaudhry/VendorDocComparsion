import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, X, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const FileUpload = ({ 
  onFileSelect, 
  selectedFiles, 
  onRemoveFile, 
  uploading = false, 
  uploadProgress = {},
  onUpload,
  maxFiles = 5 
}) => {
  const [dragCounter, setDragCounter] = useState(0)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      // Handle rejected files (show error message)
      console.warn('Some files were rejected:', rejectedFiles)
    }
    onFileSelect(acceptedFiles)
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true,
    maxFiles: maxFiles,
    maxSize: 100 * 1024 * 1024, // 100MB
    onDragEnter: () => setDragCounter(prev => prev + 1),
    onDragLeave: () => setDragCounter(prev => prev - 1),
    onDropAccepted: () => setDragCounter(0),
    onDropRejected: () => setDragCounter(0)
  })

  const getFileIcon = (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    switch (ext) {
      case 'pdf':
        return <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
          <span className="text-xs font-bold text-red-600 dark:text-red-400">PDF</span>
        </div>
      case 'docx':
      case 'doc':
        return <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">DOC</span>
        </div>
      case 'xlsx':
      case 'xls':
        return <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
          <span className="text-xs font-bold text-green-600 dark:text-green-400">XLS</span>
        </div>
      default:
        return <File className="h-8 w-8 text-gray-400 dark:text-dark-muted" />
    }
  }

  const getFileStatus = (file, index) => {
    const progress = uploadProgress[index]
    if (!progress) return { icon: null, color: 'text-gray-400', bg: '' }

    switch (progress.status) {
      case 'uploading':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20'
        }
      case 'processing':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20'
        }
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/20'
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/20'
        }
      default:
        return { icon: null, color: 'text-gray-400', bg: '' }
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <motion.div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive || dragCounter > 0
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
            : 'border-gray-300 dark:border-dark-primary hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-dark-accent'
        } ${uploading ? 'pointer-events-none opacity-75' : ''}`}
        whileHover={{ scale: uploading ? 1 : 1.01 }}
        whileTap={{ scale: uploading ? 1 : 0.99 }}
      >
        <input {...getInputProps()} />
        
        {/* Upload Icon */}
        <motion.div
          animate={{ 
            y: isDragActive ? -10 : 0,
            scale: isDragActive ? 1.1 : 1
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Upload className={`mx-auto h-12 w-12 ${
            isDragActive ? 'text-primary-500' : 'text-gray-400 dark:text-dark-muted'
          }`} />
        </motion.div>

        {/* Main Text */}
        <motion.p 
          className={`mt-4 text-lg font-medium ${
            isDragActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-dark-secondary'
          }`}
          animate={{ scale: isDragActive ? 1.05 : 1 }}
        >
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag and drop files here, or click to select'}
        </motion.p>

        {/* Subtitle */}
        <p className="mt-2 text-sm text-gray-500 dark:text-dark-muted">
          PDF, DOCX, DOC, XLSX, XLS files supported
        </p>
        <p className="text-xs text-gray-400 dark:text-dark-muted">
          Maximum {maxFiles} files, up to 100MB each
        </p>

        {/* Active drag overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary-500/10 dark:bg-primary-400/10 rounded-xl border-2 border-primary-500 flex items-center justify-center"
            >
              <div className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                Release to upload files
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Selected Files List */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-primary">
                Selected Files ({selectedFiles.length}/{maxFiles})
              </h4>
              {selectedFiles.length > 0 && !uploading && (
                <button
                  onClick={onUpload}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload All
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedFiles.map((file, index) => {
                const progress = uploadProgress[index]
                const status = getFileStatus(file, index)
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative flex items-center justify-between p-3 rounded-lg border transition-all ${
                      status.bg || 'bg-gray-50 dark:bg-dark-accent border-gray-200 dark:border-dark-primary'
                    }`}
                  >
                    {/* File Info */}
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-primary truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-dark-muted">
                          <span>{formatFileSize(file.size)}</span>
                          {progress?.message && (
                            <>
                              <span>•</span>
                              <span className={status.color}>{progress.message}</span>  
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Progress and Actions */}
                    <div className="flex items-center space-x-2">
                      {/* Status Icon */}
                      {status.icon && (
                        <div className={status.color}>
                          {status.icon}
                        </div>
                      )}

                      {/* Progress Bar */}
                      {progress?.percentage !== undefined && (
                        <div className="w-20 h-1.5 bg-gray-200 dark:bg-dark-primary rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percentage}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}

                      {/* Remove Button */}
                      {!uploading && (
                        <button
                          onClick={() => onRemoveFile(index)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileUpload