import React from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import useAppStore from '../../store/useAppStore'
import ProfilePhoto from '../ui/ProfilePhoto'
import ThemeToggle from '../ui/ThemeToggle'
import { 
  Search, Bell, Menu, ChevronRight,
  Plus, Command, User, Settings
} from 'lucide-react'

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    ui: { sidebarCollapsed, globalSearch },
    notifications: { unreadCount },
    actions: { 
      toggleSidebar, 
      setCommandPaletteOpen, 
      toggleNotifications,
      setGlobalSearch,
      addRecentActivity
    }
  } = useAppStore()

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ label: 'Home', path: '/dashboard' }]

    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
      return [{ label: 'Dashboard', path: '/dashboard' }]
    }

    pathSegments.forEach((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/')
      let label = segment.charAt(0).toUpperCase() + segment.slice(1)
      
      // Custom labels for specific routes
      if (segment === 'projects' && pathSegments[index + 1]) {
        label = 'Projects'
      } else if (segment === 'vendors') {
        label = 'Vendors'
      } else if (segment === 'compare') {
        label = 'Compare'
      } else if (segment === 'results') {
        label = 'Results'
      } else if (segment === 'analytics') {
        label = 'Analytics'
      }

      breadcrumbs.push({ label, path })
    })

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  const handleNewProject = () => {
    addRecentActivity({
      type: 'project',
      description: 'Started creating new project from header',
      metadata: { source: 'header' }
    })
    navigate('/projects')
  }

  const handleProfileClick = () => {
    navigate('/settings')
  }

  return (
    <header className="bg-white dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-primary px-6 py-4 flex items-center justify-between h-16 relative z-10 transition-colors duration-200">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-accent transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-dark-secondary" />
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path} className="flex items-center space-x-2">
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 dark:text-dark-muted" />}
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`text-sm font-medium ${
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 dark:text-dark-primary'
                    : 'text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-secondary'
                }`}
              >
                {crumb.label}
              </motion.span>
            </div>
          ))}
        </nav>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-2xl mx-8 hidden md:block">
        <div className="relative">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center space-x-3 px-4 py-2 bg-gray-50 dark:bg-dark-accent hover:bg-gray-100 dark:hover:bg-dark-primary border border-gray-200 dark:border-dark-primary rounded-lg transition-colors text-left group"
          >
            <Search className="w-4 h-4 text-gray-400 dark:text-dark-muted group-hover:text-gray-600 dark:group-hover:text-dark-secondary" />
            <span className="text-sm text-gray-500 dark:text-dark-muted group-hover:text-gray-700 dark:group-hover:text-dark-secondary">
              Search projects, vendors, documents...
            </span>
            <div className="ml-auto flex items-center space-x-1">
              <kbd className="px-2 py-1 text-xs bg-white dark:bg-dark-secondary border border-gray-300 dark:border-dark-primary rounded text-gray-500 dark:text-dark-muted">
                <Command className="w-3 h-3 inline mr-1" />
                K
              </kbd>
            </div>
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <ThemeToggle size="md" />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-accent transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-dark-secondary" />
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.div>
            )}
          </button>
        </div>

        {/* User Profile Menu */}
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleProfileClick}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-accent transition-colors"
            title="Profile & Settings"
          >
            <ProfilePhoto size="md" />
          </motion.button>
          
          {/* Quick profile tooltip */}
          <div className="absolute right-0 top-12 w-48 bg-white dark:bg-dark-secondary rounded-lg shadow-lg border border-gray-200 dark:border-dark-primary py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-primary">
              <p className="text-sm font-medium text-gray-900 dark:text-dark-primary">Profile & Settings</p>
              <p className="text-xs text-gray-600 dark:text-dark-muted">Manage your account</p>
            </div>
            <button
              onClick={handleProfileClick}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-accent flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>View Profile</span>
            </button>
            <button
              onClick={handleProfileClick}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-dark-secondary hover:bg-gray-50 dark:hover:bg-dark-accent flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header