import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import useAppStore from '../../store/useAppStore'
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  FileText,
  Users,
  BarChart3,
  Zap,
  Check,
  Trash2
} from 'lucide-react'

const NotificationCenter = () => {
  const {
    ui: { notificationsOpen },
    notifications: { items, unreadCount },
    actions: { 
      toggleNotifications, 
      markNotificationRead, 
      markAllNotificationsRead,
      clearNotifications 
    }
  } = useAppStore()

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'warning':
        return AlertCircle
      case 'error':
        return AlertCircle
      case 'document':
        return FileText
      case 'vendor':
        return Users
      case 'analytics':
        return BarChart3
      case 'system':
        return Zap
      default:
        return Info
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
      case 'document':
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
      case 'vendor':
        return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
      case 'analytics':
        return 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30'
      case 'system':
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
    }
  }

  if (!notificationsOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={toggleNotifications}
      >
        <motion.div
          initial={{ opacity: 0, x: 300, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 300, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="absolute top-16 right-4 w-96 bg-white dark:bg-dark-secondary rounded-2xl shadow-2xl dark:shadow-primary-500/20 border border-gray-200 dark:border-dark-primary overflow-hidden max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-primary bg-gray-50 dark:bg-dark-accent">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-500 dark:text-dark-muted">{unreadCount} unread</p>
                  )}
                </div>
              </div>
              <button
                onClick={toggleNotifications}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-secondary transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-dark-muted" />
              </button>
            </div>

            {/* Quick Actions */}
            {items.length > 0 && (
              <div className="flex items-center space-x-2 mt-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={clearNotifications}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear all</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-dark-primary mb-2">No notifications</h4>
                <p className="text-gray-500 dark:text-dark-muted text-sm">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-dark-primary">
                {items.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type)
                  const colorClasses = getNotificationColor(notification.type)
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-dark-accent/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900 dark:text-dark-primary' : 'text-gray-700 dark:text-dark-secondary'
                              }`}>
                                {notification.title}
                              </p>
                              <p className={`text-sm mt-1 ${
                                !notification.read ? 'text-gray-700 dark:text-dark-secondary' : 'text-gray-500 dark:text-dark-muted'
                              }`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-dark-muted mt-2">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>

                          {/* Action Buttons */}
                          {notification.actions && (
                            <div className="flex items-center space-x-2 mt-3">
                              {notification.actions.map((action, actionIndex) => (
                                <button
                                  key={actionIndex}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    action.handler()
                                  }}
                                  className="px-3 py-1 text-xs font-medium bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-primary rounded-md hover:bg-gray-50 dark:hover:bg-dark-accent transition-colors text-gray-700 dark:text-dark-secondary"
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default NotificationCenter