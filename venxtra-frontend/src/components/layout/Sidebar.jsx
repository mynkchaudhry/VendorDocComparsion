import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAppStore from '../../store/useAppStore'
import { useTranslation } from '../../contexts/TranslationContext'
import { 
  Home, FolderOpen, BarChart3, Settings, 
  ChevronLeft, ChevronRight, Zap, Search,
  Bell, User, LogOut, Star, Clock, Plus, Menu
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import ProfilePhoto from '../ui/ProfilePhoto'

const Sidebar = () => {
  const location = useLocation()
  const { logout, user: authUser } = useAuth()
  const { t } = useTranslation()
  const {
    ui: { sidebarCollapsed },
    user: { profile },
    data: { projects },
    actions: { toggleSidebar, setCommandPaletteOpen, addRecentActivity }
  } = useAppStore()

  const mainNavItems = [
    { icon: Home, label: t('nav.dashboard'), path: '/dashboard', id: 'dashboard' },
    { icon: FolderOpen, label: t('nav.projects'), path: '/projects', id: 'projects' },
    // { icon: FileText, label: 'Documents', path: '/documents', id: 'documents' },
    { icon: BarChart3, label: t('nav.analytics'), path: '/analytics', id: 'analytics' },
    { icon: Settings, label: t('nav.settings'), path: '/settings', id: 'settings' },
  ]

  const isActivePath = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const handleNavClick = (item) => {
    addRecentActivity({
      type: 'navigation',
      description: `Navigated to ${item.label}`,
      metadata: { page: item.id }
    })
  }

  const handleLogout = () => {
    addRecentActivity({
      type: 'auth',
      description: 'User logged out',
    })
    logout()
  }


  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 64 }
  }

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  }

  return (
    <motion.div
      variants={sidebarVariants}
      animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="bg-white dark:bg-dark-secondary border-r border-gray-200 dark:border-dark-primary flex flex-col h-full shadow-sm relative z-20 transition-colors duration-200"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-primary">
        <div className="flex items-center justify-between">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={contentVariants}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                <div className={`${sidebarCollapsed ? 'w-12 h-12' : 'w-8 h-8'} bg-gradient-to-br from-primary-600 to-purple-600 dark:from-primary-500 dark:to-purple-500 rounded-lg flex items-center justify-center transition-all duration-200`}>
                  <Zap className={`${sidebarCollapsed ? 'w-9 h-9' : 'w-5 h-5'} text-white transition-all duration-200`} />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
                    VenXtra
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-dark-muted">AI-Powered Platform</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-accent transition-colors group"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <Menu className="w-6 h-6 text-gray-600 dark:text-dark-secondary group-hover:text-gray-800 dark:group-hover:text-dark-primary transition-colors" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-dark-secondary group-hover:text-gray-800 dark:group-hover:text-dark-primary transition-colors" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      {!sidebarCollapsed && (
        <motion.div
          initial="collapsed"
          animate="expanded"
          variants={contentVariants}
          className="p-4 border-b border-gray-200 dark:border-dark-primary"
        >
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center space-x-3 p-2 bg-gray-50 dark:bg-dark-accent hover:bg-gray-100 dark:hover:bg-dark-primary rounded-lg transition-colors text-left"
          >
            <Search className="w-4 h-4 text-gray-400 dark:text-dark-muted" />
            <span className="text-sm text-gray-600 dark:text-dark-secondary">Search or jump to...</span>
            <div className="ml-auto flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-primary rounded text-gray-500 dark:text-dark-muted">⌘</kbd>
              <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-primary rounded text-gray-500 dark:text-dark-muted">K</kbd>
            </div>
          </button>
        </motion.div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const isActive = isActivePath(item.path)
          
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => handleNavClick(item)}
              className={`flex items-center space-x-3 ${sidebarCollapsed ? 'px-1.5 py-3.5' : 'px-3 py-2.5'} rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-800'
                  : 'text-gray-700 dark:text-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-accent hover:text-gray-900 dark:hover:text-dark-primary'
              }`}
            >
              <Icon className={`${sidebarCollapsed ? 'w-9 h-9' : 'w-5 h-5'} ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-dark-muted group-hover:text-gray-700 dark:group-hover:text-dark-primary'} transition-all duration-200`} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    variants={contentVariants}
                    transition={{ duration: 0.2 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && !sidebarCollapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          )
        })}

        {/* Quick Create Button */}
        <Link
          to="/projects/new"
          className={`flex items-center space-x-3 ${sidebarCollapsed ? 'px-1.5 py-3.5' : 'px-3 py-2.5'} rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-500 dark:to-purple-500 text-white hover:from-primary-700 hover:to-purple-700 dark:hover:from-primary-600 dark:hover:to-purple-600 transition-all duration-200 mt-4`}
        >
          <Plus className={`${sidebarCollapsed ? 'w-9 h-9' : 'w-5 h-5'} transition-all duration-200`} />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={contentVariants}
                transition={{ duration: 0.2 }}
                className="font-medium"
              >
                New Project
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </nav>

      {/* Recent & Favorites */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={contentVariants}
            className="px-4 py-4 border-t border-gray-200 dark:border-dark-primary space-y-4"
          >
            {/* Recent Projects */}
            {projects.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-500 dark:text-dark-muted" />
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-dark-muted uppercase tracking-wide">
                    Recent Projects
                  </h3>
                </div>
                <div className="space-y-1">
                  {projects.slice(0, 3).map(project => (
                    <Link
                      key={`recent-${project.id}`}
                      to={`/projects/${project.id}`}
                      className="block px-2 py-1.5 text-sm text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary hover:bg-gray-50 dark:hover:bg-dark-accent rounded transition-colors truncate"
                    >
                      {project.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-primary">
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <ProfilePhoto size="sm" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={contentVariants}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-dark-primary truncate">
                  {profile?.name || authUser?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                  {profile?.email || authUser?.email || 'user@example.com'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-accent transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-500 dark:text-dark-muted" />
            </button>
          )}
        </div>
        
        {/* Collapsed logout button */}
        {sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 flex justify-center"
          >
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-accent transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default Sidebar