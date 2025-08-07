import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vendorsAPI, documentsAPI } from '../utils/api'
import FileUpload from '../components/FileUpload'
import VendorDataTable from '../components/VendorDataTable'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import FileUploadProgress from '../components/ui/FileUploadProgress'
import DocumentPreview from '../components/ui/DocumentPreview'
import { FileText, Upload, Clock, CheckCircle, XCircle, AlertCircle, Table, Search, Trash2, MoreHorizontal, ArrowLeft, Eye } from 'lucide-react'
import useAppStore from '../store/useAppStore'
import { showToast } from '../components/ui/Toast'

const DocumentStatus = ({ status }) => {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    processing: { icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    completed: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    failed: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' }
  }

  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </span>
  )
}

const VendorDetails = () => {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [activeTab, setActiveTab] = useState('documents')
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, documentId: null, documentName: '' })
  const [vendorDeleteDialog, setVendorDeleteDialog] = useState({ isOpen: false })
  const [deletingDocuments, setDeletingDocuments] = useState(new Set())
  const [previewDocument, setPreviewDocument] = useState({ isOpen: false, document: null, documentId: null })
  
  const { 
    actions: { setDocuments, addDocument, updateDocument, removeDocument, removeVendor, addRecentActivity, addNotification }
  } = useAppStore()

  console.log('VendorDetails rendered, vendorId:', vendorId)

  if (!vendorId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">No vendor ID provided</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    )
  }

  const { data: vendor, isLoading: vendorLoading, error: vendorError } = useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      const response = await vendorsAPI.getOne(vendorId)
      return response.data
    }
  })

  const { data: documents = [], refetch: refetchDocuments, isLoading: documentsLoading, error: documentsError } = useQuery({
    queryKey: ['documents', vendorId],
    queryFn: async () => {
      const response = await documentsAPI.getByVendor(vendorId)
      return response.data
    },
    enabled: !!vendorId,
    refetchInterval: (data) => {
      if (!Array.isArray(data)) return false
      const hasPending = data.some(doc => 
        doc.processing_status === 'pending' || doc.processing_status === 'processing'
      )
      return hasPending ? 2000 : false
    }
  })

  // Update store when documents are fetched or updated
  useEffect(() => {
    if (documents.length > 0) {
      setDocuments(documents)
      
      // Update individual document status in store if changed
      documents.forEach(doc => {
        updateDocument(doc.id, {
          processing_status: doc.processing_status,
          structured_data: doc.structured_data,
          processed: doc.processing_status === 'completed'
        })
      })
    }
  }, [documents, setDocuments, updateDocument])

  // Document deletion mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: documentsAPI.delete,
    onMutate: (documentId) => {
      setDeletingDocuments(prev => new Set([...prev, documentId]))
    },
    onSuccess: (_, documentId) => {
      const deletedDoc = documents.find(doc => doc.id === documentId)
      
      // Remove from store
      removeDocument(documentId)
      
      // Refetch documents
      refetchDocuments()
      
      // Invalidate global documents query
      queryClient.invalidateQueries(['documents'])
      
      // Add activity
      addRecentActivity({
        type: 'document',
        description: `Deleted document: ${deletedDoc?.filename || 'Unknown'}`,
        metadata: { documentId, vendorId, fileName: deletedDoc?.filename }
      })
      
      // Success notification
      addNotification({
        type: 'success',
        title: 'Document Deleted',
        message: `"${deletedDoc?.filename || 'Document'}" has been deleted successfully.`
      })
      
      showToast.success('Document deleted successfully!')
      setDeleteDialog({ isOpen: false, documentId: null, documentName: '' })
    },
    onError: (error, documentId) => {
      showToast.error('Failed to delete document')
      
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'There was an error deleting the document. Please try again.'
      })
    },
    onSettled: (_, __, documentId) => {
      setDeletingDocuments(prev => {
        const newSet = new Set(prev)
        newSet.delete(documentId)
        return newSet
      })
    }
  })

  // Vendor deletion mutation
  const deleteVendorMutation = useMutation({
    mutationFn: vendorsAPI.delete,
    onSuccess: (_, vendorId) => {
      // Remove from store
      removeVendor(vendorId)
      
      // Invalidate queries
      queryClient.invalidateQueries(['vendors'])
      queryClient.invalidateQueries(['vendor', vendorId])
      
      // Add activity
      addRecentActivity({
        type: 'vendor',
        description: `Deleted vendor: ${vendor?.name || 'Unknown'}`,
        metadata: { vendorId, projectId: vendor?.project_id }
      })
      
      // Success notification
      addNotification({
        type: 'success',
        title: 'Vendor Deleted',
        message: `"${vendor?.name || 'Vendor'}" has been deleted successfully along with all its documents.`
      })
      
      showToast.success('Vendor deleted successfully!')
      
      // Navigate back to project
      navigate(`/projects/${vendor?.project_id}`)
    },
    onError: (error) => {
      showToast.error('Failed to delete vendor')
      
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'There was an error deleting the vendor. Please try again.'
      })
    }
  })

  const handleDeleteVendor = () => {
    setVendorDeleteDialog({ isOpen: true })
  }

  const handleConfirmVendorDelete = () => {
    if (vendorId) {
      deleteVendorMutation.mutate(vendorId)
      setVendorDeleteDialog({ isOpen: false })
    }
  }

  const handleDeleteDocument = (document) => {
    setDeleteDialog({
      isOpen: true,
      documentId: document.id,
      documentName: document.filename
    })
  }

  const handleConfirmDelete = () => {
    if (deleteDialog.documentId) {
      deleteDocumentMutation.mutate(deleteDialog.documentId)
    }
  }

  const handleFileSelect = (files) => {
    setSelectedFiles([...selectedFiles, ...files].slice(0, 5))
  }

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress({})
    
    try {
      const uploadedDocs = []
      
      // Process files with individual progress tracking
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        
        try {
          // Set uploading status
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'uploading', percentage: 0, message: 'Uploading...' }
          }))
          
          // Simulate upload progress (since we don't have real progress from API)
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [i]: { 
                ...prev[i],
                percentage: Math.min((prev[i]?.percentage || 0) + Math.random() * 20, 85)
              }
            }))
          }, 200)
          
          // Upload the file
          const response = await documentsAPI.upload(vendorId, file)
          clearInterval(progressInterval)
          
          // Set processing status
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'processing', percentage: 90, message: 'Processing with AI...' }
          }))
          
          uploadedDocs.push(response.data)
          
          // Add document to store
          addDocument(response.data)
          
          // Set completed status
          setUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'completed', percentage: 100, message: 'Upload complete!' }
          }))
          
          // Add activity for each upload
          addRecentActivity({
            type: 'document',
            description: `Uploaded document: ${file.name}`,
            metadata: { documentId: response.data.id, vendorId, fileName: file.name }
          })
          
        } catch (fileError) {
          console.error(`Failed to upload ${file.name}:`, fileError)
          clearInterval(progressInterval)
          
          // Check if it's a duplicate error
          const errorMessage = fileError.response?.data?.detail || 'Upload failed'
          const isDuplicateError = errorMessage.includes('already exists for this vendor')
          
          setUploadProgress(prev => ({
            ...prev,
            [i]: { 
              status: 'error', 
              percentage: 0, 
              message: isDuplicateError ? 'Duplicate file' : 'Upload failed',
              errorDetail: errorMessage
            }
          }))
          
          // Show more specific toast for duplicate errors
          if (isDuplicateError) {
            showToast.error(`${file.name}: This document already exists for this vendor`)
          } else {
            showToast.error(`Failed to upload ${file.name}`)
          }
        }
      }
      
      // Success notification
      if (uploadedDocs.length > 0) {
        addNotification({
          type: 'success',
          title: 'Documents Uploaded',
          message: `Successfully uploaded ${uploadedDocs.length} of ${selectedFiles.length} document${selectedFiles.length > 1 ? 's' : ''}.`
        })
        
        showToast.success(`${uploadedDocs.length} document${uploadedDocs.length > 1 ? 's' : ''} uploaded successfully!`)
        
        // Clear completed files after a delay
        setTimeout(() => {
          setSelectedFiles([])
          setUploadProgress({})
        }, 2000)
        
        refetchDocuments()
        
        // Invalidate global documents query to update dashboard
        queryClient.invalidateQueries(['documents'])
      }
      
    } catch (error) {
      console.error('Upload process failed:', error)
      showToast.error('Failed to upload documents')
      
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: 'There was an error uploading your documents. Please try again.'
      })
    } finally {
      setUploading(false)
    }
  }

  if (vendorLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (vendorError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Error loading vendor: {vendorError.message}</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-dark-muted">Vendor not found</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/projects/${vendor.project_id}`)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-dark-primary text-sm font-medium rounded-md text-gray-700 dark:text-dark-secondary bg-white dark:bg-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </button>
      </div>
      <div className="bg-white dark:bg-dark-secondary shadow px-4 py-5 sm:rounded-lg sm:px-6 border border-gray-200 dark:border-dark-primary">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-primary">{vendor.name}</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
              Upload and manage documents for this vendor
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleDeleteVendor}
              disabled={deleteVendorMutation.isLoading}
              className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-dark-secondary hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteVendorMutation.isLoading ? 'Deleting...' : 'Delete Vendor'}
            </button>
            {vendor && (
              <Link
                to={`/projects/${vendor.project_id}/results?vendors=${vendorId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                <Search className="h-4 w-4 mr-2" />
                Compare with Others
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-secondary shadow sm:rounded-lg border border-gray-200 dark:border-dark-primary">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-dark-primary mb-4">
            Upload Documents
          </h3>
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFiles={selectedFiles}
            onRemoveFile={handleRemoveFile}
          />
          {selectedFiles.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:opacity-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Files'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File Upload Progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <FileUploadProgress
          uploadProgress={uploadProgress}
          selectedFiles={selectedFiles}
          isUploading={uploading}
          className="mb-6"
        />
      )}

      <div className="bg-white dark:bg-dark-secondary shadow sm:rounded-lg border border-gray-200 dark:border-dark-primary">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-dark-primary">
              Document Analysis
            </h3>
            <div className="flex space-x-1 bg-gray-100 dark:bg-dark-accent p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary shadow-sm'
                    : 'text-gray-500 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-primary'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1" />
                Documents
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'table'
                    ? 'bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary shadow-sm'
                    : 'text-gray-500 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-primary'
                }`}
              >
                <Table className="h-4 w-4 inline mr-1" />
                Data Table
              </button>
            </div>
          </div>
          {documentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600 dark:text-dark-muted">Loading documents...</span>
            </div>
          ) : documentsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">Error loading documents: {documentsError.message}</p>
            </div>
          ) : (
            <>
              {activeTab === 'documents' && (
                documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-muted" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-dark-muted">No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="border border-gray-200 dark:border-dark-primary rounded-lg p-4 bg-white dark:bg-dark-accent/50 hover:shadow-md dark:hover:shadow-primary-500/10 transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="h-5 w-5 text-gray-400 dark:text-dark-muted" />
                              <h4 className="text-sm font-medium text-gray-900 dark:text-dark-primary">{doc.filename}</h4>
                              <DocumentStatus status={doc.processing_status} />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-dark-muted">
                              Uploaded {new Date(doc.uploaded_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setPreviewDocument({ isOpen: true, document: doc, documentId: doc.id })}
                              className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 dark:text-dark-muted hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Preview document"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc)}
                              disabled={deletingDocuments.has(doc.id)}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-dark-muted hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              title="Delete document"
                            >
                              {deletingDocuments.has(doc.id) ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
              
              {activeTab === 'table' && (
                <VendorDataTable vendor={vendor} documents={documents} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Document Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, documentId: null, documentName: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteDialog.documentName}"? This action cannot be undone.`}
        confirmText="Delete Document"
        cancelText="Cancel"
        type="danger"
        loading={deleteDocumentMutation.isLoading}
      />

      {/* Delete Vendor Confirmation Dialog */}
      <ConfirmDialog
        isOpen={vendorDeleteDialog.isOpen}
        onClose={() => setVendorDeleteDialog({ isOpen: false })}
        onConfirm={handleConfirmVendorDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${vendor?.name || 'this vendor'}"? This action cannot be undone and will permanently remove the vendor and all its associated documents.`}
        confirmText="Delete Vendor"
        cancelText="Cancel"
        type="danger"
        loading={deleteVendorMutation.isLoading}
      />

      {/* Document Preview Modal */}
      <DocumentPreview
        document={previewDocument.document}
        documentId={previewDocument.documentId}
        isOpen={previewDocument.isOpen}
        onClose={() => setPreviewDocument({ isOpen: false, document: null, documentId: null })}
        showActions={true}
      />
    </div>
  )
}

export default VendorDetails