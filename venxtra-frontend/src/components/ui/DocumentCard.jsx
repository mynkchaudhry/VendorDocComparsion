import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsAPI } from '../../utils/api'
import { showToast } from './Toast'
import Button from './Button'
import Card from './Card'
import DocumentPreview from './DocumentPreview'
import { 
  FileText, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  MoreVertical
} from 'lucide-react'

const DocumentCard = ({ document, showVendorInfo = false, compact = false }) => {
  const [showPreview, setShowPreview] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const queryClient = useQueryClient()

  const deleteDocumentMutation = useMutation({
    mutationFn: documentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['documents'])
      queryClient.invalidateQueries(['vendors'])
      showToast.success('Document deleted successfully!')
    },
    onError: (error) => {
      showToast.error(error.response?.data?.detail || 'Failed to delete document')
    }
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const truncateFilename = (filename, maxLength = 20) => {
    if (filename.length <= maxLength) return filename
    const extension = filename.split('.').pop()
    const name = filename.substring(0, filename.lastIndexOf('.'))
    const truncated = name.substring(0, maxLength - extension.length - 4) + '...'
    return `${truncated}.${extension}`
  }

  const handleQuickDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete "${document.filename}"?`)) {
      deleteDocumentMutation.mutate(document.id)
    }
  }

  if (compact) {
    return (
      <>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer group"
          onClick={() => setShowPreview(true)}
        >
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {truncateFilename(document.filename)}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              {getStatusIcon(document.processing_status)}
              <span className="text-xs text-gray-500 capitalize">
                {document.processing_status}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {formatDate(document.uploaded_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowPreview(true)
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Preview"
            >
              <Eye className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={handleQuickDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Delete"
              disabled={deleteDocumentMutation.isLoading}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <DocumentPreview
          document={document}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      </>
    )
  }

  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        className="cursor-pointer"
        onClick={() => setShowPreview(true)}
      >
        <Card className="group hover:shadow-lg transition-all duration-300 h-full">
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowActions(!showActions)
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowPreview(true)
                        setShowActions(false)
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickDelete(e)
                        setShowActions(false)
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      disabled={deleteDocumentMutation.isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                {document.filename}
              </h3>
              
              <div className="flex items-center space-x-2 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.processing_status)}`}>
                  {document.processing_status}
                </span>
                <span className="text-xs text-gray-500">{document.file_type.toUpperCase()}</span>
              </div>

              {document.structured_data && (
                <div className="text-sm text-gray-600 mb-3">
                  {document.structured_data.vendor_name && (
                    <p>Vendor: {document.structured_data.vendor_name}</p>
                  )}
                  {document.structured_data.document_type && (
                    <p>Type: {document.structured_data.document_type}</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{formatDate(document.uploaded_at)}</span>
              </div>
              <div className="flex items-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm mr-1">Preview</span>
                <Eye className="w-4 h-4" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <DocumentPreview
        document={document}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </>
  )
}

export default DocumentCard