import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsAPI } from '../../utils/api'
import { showToast } from './Toast'
import Button from './Button'
import Card from './Card'
import ConfirmDialog from './ConfirmDialog'
import LoadingSpinner from './LoadingSpinner'
import { 
  FileText, 
  Trash2, 
  Eye, 
  Download, 
  Calendar, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  Maximize2,
  Copy,
  Search,
  AlertTriangle
} from 'lucide-react'

const DocumentPreview = ({ document, documentId, isOpen, onClose, showActions = true }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [fullDocument, setFullDocument] = useState(null)
  const [duplicates, setDuplicates] = useState(null)
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [pollingInterval, setPollingInterval] = useState(null)
  const queryClient = useQueryClient()

  const deleteDocumentMutation = useMutation({
    mutationFn: documentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['documents'])
      queryClient.invalidateQueries(['vendors'])
      showToast.success('Document deleted successfully!')
      onClose()
    },
    onError: (error) => {
      showToast.error(error.response?.data?.detail || 'Failed to delete document')
    }
  })

  // Fetch full document content and duplicates when modal opens
  useEffect(() => {
    if (isOpen && (documentId || document?.id)) {
      fetchFullDocument()
      fetchDuplicates()
      startPolling()
    } else {
      stopPolling()
    }
    
    return () => {
      stopPolling()
    }
  }, [isOpen, documentId, document?.id])

  // Start polling for status updates if document is still processing
  const startPolling = () => {
    const currentDoc = fullDocument || document
    if (currentDoc && (currentDoc.processing_status === 'pending' || currentDoc.processing_status === 'processing')) {
      const interval = setInterval(() => {
        fetchFullDocument()
      }, 2000) // Poll every 2 seconds
      setPollingInterval(interval)
    }
  }

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      setPollingInterval(null)
    }
  }

  // Stop polling when processing is complete
  useEffect(() => {
    const currentDoc = fullDocument || document
    if (currentDoc && currentDoc.processing_status === 'completed' || currentDoc?.processing_status === 'failed') {
      stopPolling()
    }
  }, [fullDocument?.processing_status, document?.processing_status])

  const fetchFullDocument = async () => {
    setLoading(true)
    try {
      const id = documentId || document?.id
      const response = await documentsAPI.preview(id)
      setFullDocument(response.data)
    } catch (error) {
      console.error('Failed to fetch document preview:', error)
      showToast.error('Failed to load document preview')
    } finally {
      setLoading(false)
    }
  }

  const fetchDuplicates = async () => {
    try {
      const id = documentId || document?.id
      const response = await documentsAPI.checkDuplicates(id)
      setDuplicates(response.data)
    } catch (error) {
      console.error('Failed to check duplicates:', error)
    }
  }

  const handleDelete = () => {
    const id = documentId || document?.id
    deleteDocumentMutation.mutate(id)
    setShowDeleteDialog(false)
  }

  const handleCopyText = () => {
    if (fullDocument?.raw_text || displayDocument?.raw_text) {
      const textToCopy = fullDocument?.raw_text || displayDocument?.raw_text
      navigator.clipboard.writeText(textToCopy)
      showToast.success('Document text copied to clipboard')
    }
  }

  const handleDownloadOriginal = async () => {
    try {
      const id = documentId || document?.id
      const response = await documentsAPI.download(id)
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.download = displayDocument.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast.success('Document downloaded successfully')
    } catch (error) {
      console.error('Failed to download document:', error)
      showToast.error('Failed to download document')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const highlightSearchTerm = (text, term) => {
    if (!term) return text
    const regex = new RegExp(`(${term})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
  }

  const getFilteredText = () => {
    const text = fullDocument?.raw_text || displayDocument?.raw_text || ''
    if (!searchTerm) return text
    
    const lines = text.split('\n')
    const filteredLines = lines.filter(line => 
      line.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return filteredLines.join('\n')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'processing':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid date'
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  const truncateText = (text, maxLength = 500) => {
    if (!text) return 'No content available'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Use fullDocument data if available, otherwise fall back to passed document
  const displayDocument = fullDocument || document
  
  if (!isOpen) return null
  if (!displayDocument) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={`bg-white rounded-2xl shadow-2xl ${
            isExpanded ? 'w-full h-full max-w-none max-h-none' : 'max-w-4xl max-h-[90vh]'
          } overflow-hidden transition-all duration-300`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{displayDocument.filename}</h3>
                <div className="flex items-center space-x-4 mt-1">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(displayDocument.processing_status)}`}>
                    {getStatusIcon(displayDocument.processing_status)}
                    <span className="capitalize">{displayDocument.processing_status}</span>
                  </div>
                  <span className="text-sm text-gray-500">{displayDocument.file_type?.toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {duplicates?.has_duplicates && (
                <button
                  onClick={() => setShowDuplicates(!showDuplicates)}
                  className="flex items-center space-x-1 px-3 py-1 text-sm rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{duplicates.duplicate_count} Duplicates</span>
                </button>
              )}
              <button
                onClick={handleDownloadOriginal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Download original document"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleCopyText}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Copy text"
                disabled={!displayDocument?.raw_text}
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={isExpanded ? "Minimize" : "Expand"}
              >
                <Maximize2 className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search within document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Duplicates Section */}
          {showDuplicates && duplicates?.has_duplicates && (
            <div className="p-4 bg-orange-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-orange-800 mb-2">
                This document also exists in:
              </h4>
              <div className="space-y-1">
                {duplicates.duplicates.map((dup) => (
                  <div key={dup.document_id} className="text-sm text-orange-700">
                    • {dup.vendor_name} ({dup.filename})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <LoadingSpinner />
            </div>
          ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Document Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Document Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Uploaded:</span>
                    <span className="text-gray-900">{formatDate(displayDocument.uploaded_at)}</span>
                  </div>
                  {displayDocument.processed_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Processed:</span>
                      <span className="text-gray-900">{formatDate(displayDocument.processed_at)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">File Type:</span>
                    <span className="text-gray-900">{displayDocument.file_type?.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(displayDocument.processing_status)}`}>
                      {displayDocument.processing_status}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Structured Data */}
              {displayDocument.structured_data && (
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Extracted Information</h4>
                  <div className="space-y-2 text-sm">
                    {displayDocument.structured_data.vendor_name && (
                      <div>
                        <span className="text-gray-600">Vendor:</span>
                        <span className="ml-2 text-gray-900">{displayDocument.structured_data.vendor_name}</span>
                      </div>
                    )}
                    {displayDocument.structured_data.document_type && (
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 text-gray-900">{displayDocument.structured_data.document_type}</span>
                      </div>
                    )}
                    {displayDocument.structured_data.pricing && displayDocument.structured_data.pricing.length > 0 && (
                      <div>
                        <span className="text-gray-600">Pricing Items:</span>
                        <span className="ml-2 text-gray-900">{displayDocument.structured_data.pricing.length} found</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Raw Text Preview */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Document Content</h4>
                <div className="flex items-center space-x-2">
                  {searchTerm && (
                    <span className="text-sm text-gray-500">
                      {getFilteredText().split('\n').length} matching lines
                    </span>
                  )}
                  {displayDocument.raw_text && displayDocument.raw_text.length > 500 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre 
                  className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: highlightSearchTerm(
                      isExpanded ? getFilteredText() || 'No content available' : truncateText(getFilteredText()),
                      searchTerm
                    )
                  }}
                />
              </div>
            </Card>

            {/* Error Message */}
            {displayDocument.error_message && (
              <Card className="p-4 border-red-200 bg-red-50">
                <h4 className="font-semibold text-red-900 mb-2">Processing Error</h4>
                <p className="text-sm text-red-700">{displayDocument.error_message}</p>
              </Card>
            )}

            {/* Actions */}
            {showActions && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="secondary"
                    icon={Eye}
                    iconPosition="left"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'Minimize' : 'Expand View'}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button
                    variant="danger"
                    icon={Trash2}
                    iconPosition="left"
                    onClick={() => setShowDeleteDialog(true)}
                    loading={deleteDocumentMutation.isLoading}
                  >
                    Delete Document
                  </Button>
                </div>
              </div>
            )}
          </div>
          )}
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Delete Document"
          message={`Are you sure you want to delete "${displayDocument?.filename || 'this document'}"? This action cannot be undone.`}
          confirmText="Delete Document"
          type="danger"
          loading={deleteDocumentMutation.isLoading}
        />
      </motion.div>
    </AnimatePresence>
  )
}

export default DocumentPreview