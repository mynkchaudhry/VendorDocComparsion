import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Command,
  Search, 
  FolderOpen, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Plus,
  Clock,
  Star,
  Zap
} from 'lucide-react'
import useAppStore from '../../store/useAppStore'

const CommandPalette = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const {
    ui: { commandPaletteOpen },
    data: { projects, vendors, documents },
    actions: { setCommandPaletteOpen, addRecentActivity }
  } = useAppStore()

  // Quick actions
  const quickActions = [
    {
      id: 'new-project',
      title: 'Create New Project',
      subtitle: 'Start a new vendor comparison project',
      icon: Plus,
      action: () => navigate('/projects/new'),
      category: 'Actions'
    },
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View your overview and stats',
      icon: BarChart3,
      action: () => navigate('/dashboard'),
      category: 'Navigation'
    },
    {
      id: 'projects',
      title: 'View All Projects',
      subtitle: 'Browse all your projects',
      icon: FolderOpen,
      action: () => navigate('/projects'),
      category: 'Navigation'
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      subtitle: 'See detailed insights and reports',
      icon: BarChart3,
      action: () => navigate('/analytics'),
      category: 'Navigation'
    },
    {
      id: 'settings',
      title: 'Open Settings',
      subtitle: 'Manage your account and preferences',
      icon: Settings,
      action: () => navigate('/settings'),
      category: 'Navigation'
    }
  ]

  // Generate searchable items
  const searchableItems = useMemo(() => {
    const items = [...quickActions]

    // Add projects
    projects.forEach(project => {
      items.push({
        id: `project-${project.id}`,
        title: project.name,
        subtitle: `Project • ${project.description || 'No description'}`,
        icon: FolderOpen,
        action: () => navigate(`/projects/${project.id}`),
        category: 'Projects'
      })
    })

    // Add vendors
    vendors.forEach(vendor => {
      items.push({
        id: `vendor-${vendor.id}`,
        title: vendor.name,
        subtitle: 'Vendor • Click to view details',
        icon: Users,
        action: () => navigate(`/vendors/${vendor.id}`),
        category: 'Vendors'
      })
    })

    // Add priority to recent projects (first 3)
    projects.slice(0, 3).forEach(project => {
      const existingIndex = items.findIndex(item => item.id === `project-${project.id}`)
      if (existingIndex >= 0) {
        items[existingIndex].priority = true
        items[existingIndex].subtitle = `Recent Project • ${project.description || 'No description'}`
      }
    })

    return items
  }, [projects, vendors, navigate])

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      // Show recent and priority items when no query
      const recent = searchableItems.filter(item => item.priority || item.category === 'Actions').slice(0, 8)
      return recent.length > 0 ? recent : searchableItems.slice(0, 8)
    }

    const searchTerm = query.toLowerCase()
    return searchableItems.filter(item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.subtitle.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm)
    ).slice(0, 10)
  }, [query, searchableItems])

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {}
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })
    return groups
  }, [filteredItems])

  const [selectedIndex, setSelectedIndex] = useState(0)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!commandPaletteOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % filteredItems.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length)
          break
        case 'Enter':
          e.preventDefault()
          if (filteredItems[selectedIndex]) {
            handleItemSelect(filteredItems[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          setCommandPaletteOpen(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, filteredItems, selectedIndex, setCommandPaletteOpen])

  // Global shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [setCommandPaletteOpen])

  // Reset state when opening
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [commandPaletteOpen])

  const handleItemSelect = (item) => {
    addRecentActivity({
      type: 'command_palette',
      description: `Used command palette: ${item.title}`,
      metadata: { command: item.id }
    })
    item.action()
    setCommandPaletteOpen(false)
  }

  if (!commandPaletteOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]"
        onClick={() => setCommandPaletteOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-2xl mx-4 bg-white dark:bg-dark-secondary rounded-2xl shadow-2xl dark:shadow-primary-500/20 border border-gray-200 dark:border-dark-primary overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-dark-primary">
            <Search className="w-5 h-5 text-gray-400 dark:text-dark-muted mr-3" />
            <input
              type="text"
              placeholder="Search for projects, vendors, or actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 outline-none text-lg placeholder-gray-500 dark:placeholder-dark-muted bg-transparent text-gray-900 dark:text-dark-primary"
              autoFocus
            />
            <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-dark-muted">
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-dark-accent rounded text-gray-500 dark:text-dark-muted">↑↓</kbd>
              <span>navigate</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-dark-accent rounded text-gray-500 dark:text-dark-muted">↵</kbd>
              <span>select</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-dark-accent rounded text-gray-500 dark:text-dark-muted">esc</kbd>
              <span>close</span>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {Object.keys(groupedItems).length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No results found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Try searching for projects, vendors, or actions
                </p>
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {category}
                    </div>
                    {items.map((item, categoryIndex) => {
                      const globalIndex = filteredItems.indexOf(item)
                      const isSelected = globalIndex === selectedIndex
                      const Icon = item.icon

                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: categoryIndex * 0.05 }}
                          onClick={() => handleItemSelect(item)}
                          className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                            isSelected 
                              ? 'bg-blue-100' 
                              : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              isSelected 
                                ? 'text-blue-600' 
                                : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <p className={`font-medium truncate ${
                                isSelected ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {item.title}
                              </p>
                              {item.priority && (
                                <Star className="w-3 h-3 text-yellow-500 ml-2 flex-shrink-0" />
                              )}
                            </div>
                            <p className={`text-sm truncate mt-0.5 ${
                              isSelected ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {item.subtitle}
                            </p>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center text-xs text-blue-600"
                            >
                              <kbd className="px-2 py-1 bg-blue-100 rounded">↵</kbd>
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>AI-powered search</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <span>Powered by</span>
              <span className="font-semibold text-blue-600">VenXtra</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CommandPalette