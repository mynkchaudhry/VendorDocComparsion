import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import useAppStore from '../store/useAppStore'
import Sidebar from './layout/Sidebar'
import Header from './layout/Header'
import CommandPalette from './ui/CommandPalette'
import NotificationCenter from './ui/NotificationCenter'
import PageLoader from './ui/PageLoader'
import { userAPI } from '../utils/api'

const Layout = () => {
  const location = useLocation()
  const { user } = useAuth()
  const {
    ui: { loading, sidebarCollapsed },
    actions: { setCurrentPage, setBreadcrumbs, setUserProfile }
  } = useAppStore()

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await userAPI.getProfile()
        if (response.data) {
          setUserProfile(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
      }
    }
    
    if (user) {
      fetchUserProfile()
    }
  }, [user, setUserProfile])

  // Update current page and breadcrumbs based on location
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const currentPage = pathSegments[0] || 'dashboard'
    setCurrentPage(currentPage)

    // Generate breadcrumbs based on current route
    const breadcrumbs = []
    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') {
      breadcrumbs.push({ label: 'Dashboard', path: '/dashboard' })
    } else {
      breadcrumbs.push({ label: 'Home', path: '/dashboard' })
      pathSegments.forEach((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/')
        let label = segment.charAt(0).toUpperCase() + segment.slice(1)
        
        // Custom labels for better UX
        switch (segment) {
          case 'projects':
            label = pathSegments[index + 1] ? 'Projects' : 'All Projects'
            break
          case 'vendors':
            label = 'Vendors'
            break
          case 'compare':
            label = 'Compare'
            break
          case 'results':
            label = 'Comparison Results'
            break
          case 'analytics':
            label = 'Analytics'
            break
          case 'settings':
            label = 'Settings'
            break
        }
        
        breadcrumbs.push({ label, path })
      })
    }
    
    setBreadcrumbs(breadcrumbs)
  }, [location.pathname, setCurrentPage, setBreadcrumbs])

  // Set user profile when available
  useEffect(() => {
    if (user) {
      setUserProfile(user)
    }
  }, [user, setUserProfile])

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  }

  const contentVariants = {
    expanded: { marginLeft: 0 },
    collapsed: { marginLeft: 0 }
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-dark-primary flex overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-primary relative transition-colors duration-200">
          <AnimatePresence mode="wait">
            {loading ? (
              <PageLoader key="loader" message="Loading..." />
            ) : (
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="h-full"
              >
                <div className="container mx-auto px-6 py-8 max-w-none">
                  <Outlet />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Global Components */}
      <CommandPalette />
      <NotificationCenter />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-10 lg:hidden"
            onClick={() => useAppStore.getState().actions.setSidebarCollapsed(true)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Layout