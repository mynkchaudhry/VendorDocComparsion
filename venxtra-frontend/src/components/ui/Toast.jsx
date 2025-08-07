import React from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { motion } from 'framer-motion'

const ToastContainer = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: 'transparent',
        boxShadow: 'none',
        padding: 0,
      },
    }}
  />
)

const CustomToast = ({ type, message, onClose }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  }

  const Icon = icons[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`${colors[type]} p-4 rounded-lg shadow-lg border flex items-center space-x-3 max-w-sm`}
    >
      <Icon className={`w-5 h-5 ${iconColors[type]} flex-shrink-0`} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

// Toast utility functions
export const showToast = {
  success: (message) => {
    toast((t) => <CustomToast type="success" message={message} onClose={() => toast.dismiss(t.id)} />)
  },
  error: (message) => {
    toast((t) => <CustomToast type="error" message={message} onClose={() => toast.dismiss(t.id)} />)
  },
  warning: (message) => {
    toast((t) => <CustomToast type="warning" message={message} onClose={() => toast.dismiss(t.id)} />)
  },
  info: (message) => {
    toast((t) => <CustomToast type="info" message={message} onClose={() => toast.dismiss(t.id)} />)
  },
}

export default ToastContainer