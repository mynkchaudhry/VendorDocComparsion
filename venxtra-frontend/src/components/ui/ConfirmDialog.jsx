import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'
import { AlertTriangle, Trash2, RefreshCw, X } from 'lucide-react'

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // danger, warning, info
  loading = false,
  requiresTyping = false,
  requiredText = ''
}) => {
  const [typedText, setTypedText] = React.useState('')
  const [isValid, setIsValid] = React.useState(!requiresTyping)

  React.useEffect(() => {
    if (requiresTyping && requiredText) {
      setIsValid(typedText === requiredText)
    }
  }, [typedText, requiredText, requiresTyping])

  React.useEffect(() => {
    if (isOpen) {
      setTypedText('')
      setIsValid(!requiresTyping)
    }
  }, [isOpen, requiresTyping])

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
      case 'info':
        return <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      default:
        return <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          confirmBtn: 'danger'
        }
      case 'warning':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          iconBg: 'bg-orange-100 dark:bg-orange-900/30',
          confirmBtn: 'warning'
        }
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          confirmBtn: 'primary'
        }
      default:
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          confirmBtn: 'danger'
        }
    }
  }

  const colors = getColors()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white dark:bg-dark-secondary rounded-2xl p-6 max-w-md w-full shadow-2xl dark:shadow-primary-500/10 border border-gray-200 dark:border-dark-primary"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
                {getIcon()}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-primary">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-accent transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
            </button>
          </div>

          {/* Message */}
          <div className={`p-4 ${colors.bg} ${colors.border} border rounded-lg mb-6`}>
            <p className="text-gray-700 dark:text-dark-secondary leading-relaxed">{message}</p>
          </div>

          {/* Typing Confirmation */}
          {requiresTyping && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-2">
                Type "<span className="font-bold text-red-600 dark:text-red-400">{requiredText}</span>" to confirm:
              </label>
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-dark-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-dark-accent text-gray-900 dark:text-dark-primary"
                placeholder={`Type ${requiredText} here...`}
                autoFocus
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              variant={colors.confirmBtn}
              className="flex-1"
              loading={loading}
              disabled={!isValid}
            >
              {confirmText}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ConfirmDialog