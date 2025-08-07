import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { documentsAPI } from '../utils/api'
import useAppStore from '../store/useAppStore'
import DocumentCard from '../components/ui/DocumentCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import PageLoader from '../components/ui/PageLoader'
import { 
  FileText, 
  Search, 
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  RefreshCw,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader
} from 'lucide-react'

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('uploaded_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('grid')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    actions: { addRecentActivity }
  } = useAppStore()

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await documentsAPI.getAll()
      return response.data
    },
    refetchInterval: 10000 // Refetch every 10 seconds for processing updates
  })

  useEffect(() => {
    addRecentActivity({
      type: 'navigation',
      description: 'Viewed Documents page',
      metadata: { page: 'documents' }
    })
  }, [addRecentActivity])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      addRecentActivity({
        type: 'system',
        description: 'Documents list refreshed',
        metadata: { action: 'refresh' }
      })
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  // Filter and sort documents
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.structured_data?.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.structured_data?.document_type?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || doc.processing_status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'filename':
          aValue = a.filename.toLowerCase()
          bValue = b.filename.toLowerCase()
          break
        case 'uploaded_at':
          aValue = new Date(a.uploaded_at)
          bValue = new Date(b.uploaded_at)
          break
        case 'processed_at':
          aValue = a.processed_at ? new Date(a.processed_at) : new Date(0)
          bValue = b.processed_at ? new Date(b.processed_at) : new Date(0)
          break
        case 'status':
          aValue = a.processing_status
          bValue = b.processing_status
          break
        default:
          aValue = a[sortBy]
          bValue = b[sortBy]
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const getStatusStats = () => {
    const stats = documents.reduce((acc, doc) => {
      acc[doc.processing_status] = (acc[doc.processing_status] || 0) + 1
      return acc
    }, {})

    return {
      total: documents.length,
      completed: stats.completed || 0,
      processing: stats.processing || 0,
      failed: stats.failed || 0,
      pending: stats.pending || 0
    }
  }

  const stats = getStatusStats()

  if (isLoading && documents.length === 0) {
    return <PageLoader message="Loading documents..." fullScreen={false} />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="mt-2 text-gray-600">
            Manage and preview all your uploaded documents
          </p>
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
            className="relative overflow-hidden group"
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
          </Button>
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="w-5 h-5 text-green-500 mr-1" />
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-1">
            <Loader className="w-5 h-5 text-blue-500 mr-1 animate-spin" />
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </div>
          <div className="text-sm text-gray-600">Processing</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-5 h-5 text-yellow-500 mr-1" />
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center mb-1">
            <AlertCircle className="w-5 h-5 text-red-500 mr-1" />
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </div>
          <div className="text-sm text-gray-600">Failed</div>
        </Card>
      </motion.div>

      {/* Filters and Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4"
      >
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('_')
              setSortBy(field)
              setSortOrder(order)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="uploaded_at_desc">Newest First</option>
            <option value="uploaded_at_asc">Oldest First</option>
            <option value="filename_asc">Name A-Z</option>
            <option value="filename_desc">Name Z-A</option>
            <option value="status_asc">Status A-Z</option>
            <option value="processed_at_desc">Recently Processed</option>
          </select>

          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Documents Grid/List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {filteredAndSortedDocuments.length === 0 ? (
          <Card className="text-center py-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
            </motion.div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}
            </h3>
            <p className="text-gray-600 mb-8">
              {documents.length === 0 
                ? 'Upload your first document to get started with AI analysis.'
                : 'Try adjusting your search terms or filters.'}
            </p>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-3'
          }>
            {filteredAndSortedDocuments.map((document, index) => (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <DocumentCard 
                  document={document} 
                  compact={viewMode === 'list'}
                  showVendorInfo={true}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Documents