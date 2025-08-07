import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trash2, Download, Archive, Tag, 
  CheckSquare, X, Users, FileText,
  Copy, Move, Star, RefreshCw
} from 'lucide-react'
import Button from './Button'
import ConfirmDialog from './ConfirmDialog'

const BulkActionsPanel = ({ 
  selectedItems = [], 
  onClearSelection, 
  onBulkDelete, 
  onBulkDownload,
  onBulkArchive,
  onBulkTag,
  onBulkMove,
  onBulkCopy,
  onBulkFavorite,
  type = 'documents', // 'documents' or 'vendors'
  loading = false 
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState(null)
  const [newTag, setNewTag] = useState('')

  const handleBulkAction = (action) => {
    setBulkAction(action)
    if (action === 'delete' || action === 'archive') {
      setShowConfirmDialog(true)
    } else if (action === 'tag') {
      setShowTagDialog(true)
    } else {
      executeAction(action)
    }
  }

  const executeAction = (action) => {
    switch (action) {
      case 'delete':
        onBulkDelete?.(selectedItems)
        break
      case 'download':
        onBulkDownload?.(selectedItems)
        break
      case 'archive':
        onBulkArchive?.(selectedItems)
        break
      case 'tag':
        onBulkTag?.(selectedItems, newTag)
        setNewTag('')
        break
      case 'move':
        onBulkMove?.(selectedItems)
        break
      case 'copy':
        onBulkCopy?.(selectedItems)
        break
      case 'favorite':
        onBulkFavorite?.(selectedItems)
        break
    }
  }

  const confirmAction = () => {
    executeAction(bulkAction)
    setShowConfirmDialog(false)
    setBulkAction(null)
  }

  if (selectedItems.length === 0) return null

  const actions = [
    {
      id: 'download',
      icon: Download,
      label: 'Download',
      color: 'blue',
      show: type === 'documents'
    },
    {
      id: 'favorite',
      icon: Star,
      label: 'Favorite',
      color: 'yellow',
      show: true
    },
    {
      id: 'tag',
      icon: Tag,
      label: 'Tag',
      color: 'green',
      show: true
    },
    {
      id: 'copy',
      icon: Copy,
      label: 'Duplicate',
      color: 'purple',
      show: type === 'vendors'
    },
    {
      id: 'archive',
      icon: Archive,
      label: 'Archive',
      color: 'orange',
      show: true
    },
    {
      id: 'delete',
      icon: Trash2,
      label: 'Delete',
      color: 'red',
      show: true
    }
  ]

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-white dark:bg-dark-secondary border border-gray-200 dark:border-dark-primary rounded-2xl shadow-2xl p-4 min-w-[320px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  {type === 'documents' ? (
                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  ) : (
                    <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-dark-primary">
                    {selectedItems.length} {type} selected
                  </p>
                  <p className="text-sm text-gray-500 dark:text-dark-muted">
                    Choose an action to apply
                  </p>
                </div>
              </div>
              <button
                onClick={onClearSelection}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-accent rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400 dark:text-dark-muted" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {actions.filter(action => action.show).map((action) => {
                const Icon = action.icon
                const colorClasses = {
                  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50',
                  yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
                  green: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50',
                  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50',
                  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50',
                  red: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                }

                return (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBulkAction(action.id)}
                    disabled={loading}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${colorClasses[action.color]} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading && bulkAction === action.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span>{action.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false)
          setBulkAction(null)
        }}
        onConfirm={confirmAction}
        title={`${bulkAction === 'delete' ? 'Delete' : 'Archive'} ${type}`}
        message={`Are you sure you want to ${bulkAction} ${selectedItems.length} ${type}? ${bulkAction === 'delete' ? 'This action cannot be undone.' : 'You can restore them later.'}`}
        confirmText={bulkAction === 'delete' ? 'Delete' : 'Archive'}
        cancelText="Cancel"
        type={bulkAction === 'delete' ? 'danger' : 'warning'}
        loading={loading}
      />

      {/* Tag Dialog */}
      <AnimatePresence>
        {showTagDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowTagDialog(false)
              setBulkAction(null)
              setNewTag('')
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-dark-secondary rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl mb-4">
                  <Tag className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-dark-primary mb-2">
                  Add Tag
                </h3>
                <p className="text-gray-600 dark:text-dark-muted">
                  Add a tag to {selectedItems.length} selected {type}
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag name"
                  className="w-full rounded-lg border border-gray-300 dark:border-dark-primary bg-white dark:bg-dark-accent px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 focus:border-primary-500 text-gray-900 dark:text-dark-primary placeholder-gray-500 dark:placeholder-dark-muted"
                  autoFocus
                />

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setShowTagDialog(false)
                      setBulkAction(null)
                      setNewTag('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      if (newTag.trim()) {
                        executeAction('tag')
                        setShowTagDialog(false)
                        setBulkAction(null)
                      }
                    }}
                    disabled={!newTag.trim() || loading}
                    icon={Tag}
                  >
                    Add Tag
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default BulkActionsPanel