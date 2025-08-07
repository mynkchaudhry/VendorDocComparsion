import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { vendorsAPI, documentsAPI } from '../utils/api'

const useAppStore = create(
  persist(
    immer((set, get) => ({
      // UI State
      ui: {
        sidebarCollapsed: false,
        theme: 'light',
        commandPaletteOpen: false,
        notificationsOpen: false,
        currentPage: 'dashboard',
        breadcrumbs: [],
        loading: false,
        globalSearch: '',
      },

      // User State
      user: {
        profile: null,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'MM/dd/yyyy',
          notifications: {
            email: true,
            push: true,
            desktop: true,
          },
          dashboard: {
            layout: 'grid',
            itemsPerPage: 10,
          }
        },
      },

      // Data State
      data: {
        projects: [],
        vendors: [],
        documents: [],
        comparisons: [],
        analytics: {
          totalProjects: 0,
          totalVendors: 0,
          totalDocuments: 0,
          processingSuccess: 0,
          avgProcessingTime: 0,
          recentActivity: [],
        }
      },

      // Notifications State
      notifications: {
        items: [],
        unreadCount: 0,
      },

      // Actions
      actions: {
        // UI Actions
        toggleSidebar: () => set((state) => {
          state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed
        }),

        setSidebarCollapsed: (collapsed) => set((state) => {
          state.ui.sidebarCollapsed = collapsed
        }),

        setTheme: (theme) => set((state) => {
          state.ui.theme = theme
        }),

        toggleCommandPalette: () => set((state) => {
          state.ui.commandPaletteOpen = !state.ui.commandPaletteOpen
        }),

        setCommandPaletteOpen: (open) => set((state) => {
          state.ui.commandPaletteOpen = open
        }),

        toggleNotifications: () => set((state) => {
          state.ui.notificationsOpen = !state.ui.notificationsOpen
        }),

        setCurrentPage: (page) => set((state) => {
          state.ui.currentPage = page
        }),

        setBreadcrumbs: (breadcrumbs) => set((state) => {
          state.ui.breadcrumbs = breadcrumbs
        }),

        setLoading: (loading) => set((state) => {
          state.ui.loading = loading
        }),

        setGlobalSearch: (search) => set((state) => {
          state.ui.globalSearch = search
        }),

        // User Actions
        setUserProfile: (profile) => set((state) => {
          state.user.profile = profile
        }),

        updateUserPreferences: (preferences) => set((state) => {
          state.user.preferences = { ...state.user.preferences, ...preferences }
          // Also update profile if avatar is being set
          if (preferences.avatar) {
            if (!state.user.profile) {
              state.user.profile = {}
            }
            state.user.profile.avatar = preferences.avatar
          }
        }),


        // Data Actions
        setProjects: (projects) => set((state) => {
          state.data.projects = projects
          state.data.analytics.totalProjects = projects.length
        }),

        addProject: (project) => set((state) => {
          state.data.projects.push(project)
          state.data.analytics.totalProjects += 1
        }),

        updateProject: (projectId, updates) => set((state) => {
          const index = state.data.projects.findIndex(p => p.id === projectId)
          if (index >= 0) {
            state.data.projects[index] = { ...state.data.projects[index], ...updates }
          }
        }),

        removeProject: (projectId) => set((state) => {
          state.data.projects = state.data.projects.filter(p => p.id !== projectId)
          state.data.analytics.totalProjects -= 1
        }),

        setVendors: (vendors) => set((state) => {
          state.data.vendors = vendors
          state.data.analytics.totalVendors = vendors.length
        }),

        addVendor: (vendor) => set((state) => {
          state.data.vendors.push(vendor)
          state.data.analytics.totalVendors += 1
        }),

        removeVendor: (vendorId) => set((state) => {
          state.data.vendors = state.data.vendors.filter(v => v.id !== vendorId)
          state.data.analytics.totalVendors = state.data.vendors.length
        }),

        setDocuments: (documents) => set((state) => {
          state.data.documents = documents
          state.data.analytics.totalDocuments = documents.length
          const successful = documents.filter(d => d.processing_status === 'completed').length
          state.data.analytics.processingSuccess = documents.length > 0 
            ? Math.round((successful / documents.length) * 100) 
            : 0
        }),

        addDocument: (document) => set((state) => {
          state.data.documents.push(document)
          state.data.analytics.totalDocuments += 1
        }),

        updateDocument: (documentId, updates) => set((state) => {
          const index = state.data.documents.findIndex(d => d.id === documentId)
          if (index >= 0) {
            state.data.documents[index] = { ...state.data.documents[index], ...updates }
            // Recalculate success rate
            const successful = state.data.documents.filter(d => d.processing_status === 'completed').length
            state.data.analytics.processingSuccess = state.data.documents.length > 0 
              ? Math.round((successful / state.data.documents.length) * 100) 
              : 0
          }
        }),

        removeDocument: (documentId) => set((state) => {
          state.data.documents = state.data.documents.filter(doc => doc.id !== documentId)
          state.data.analytics.totalDocuments = state.data.documents.length
          
          // Recalculate processing success rate
          const successful = state.data.documents.filter(doc => doc.processing_status === 'completed').length
          state.data.analytics.processingSuccess = state.data.documents.length > 0 
            ? Math.round((successful / state.data.documents.length) * 100) 
            : 0
        }),

        clearVendors: async () => {
          try {
            await vendorsAPI.deleteAll()
            set((state) => {
              state.data.vendors = []
              state.data.analytics.totalVendors = 0
            })
          } catch (error) {
            throw error
          }
        },

        clearDocuments: async () => {
          try {
            await documentsAPI.deleteAll()
            set((state) => {
              state.data.documents = []
              state.data.analytics.totalDocuments = 0
              state.data.analytics.processingSuccess = 0
            })
          } catch (error) {
            throw error
          }
        },

        clearAllData: () => set((state) => {
          state.data.projects = []
          state.data.vendors = []
          state.data.documents = []
          state.data.comparisons = []
          state.data.analytics = {
            totalProjects: 0,
            totalVendors: 0,
            totalDocuments: 0,
            processingSuccess: 0,
            avgProcessingTime: 0,
            recentActivity: [],
          }
        }),

        exportUserData: () => {
          const state = get()
          const exportData = {
            projects: state.data.projects,
            vendors: state.data.vendors,
            documents: state.data.documents,
            user: state.user,
            exportedAt: new Date().toISOString()
          }
          
          const dataStr = JSON.stringify(exportData, null, 2)
          const dataBlob = new Blob([dataStr], { type: 'application/json' })
          const url = URL.createObjectURL(dataBlob)
          
          const link = document.createElement('a')
          link.href = url
          link.download = `venxtra-export-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          URL.revokeObjectURL(url)
        },

        // Notification Actions
        addNotification: (notification) => set((state) => {
          const newNotification = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
          }
          state.notifications.items.unshift(newNotification)
          state.notifications.unreadCount += 1
        }),

        markNotificationRead: (notificationId) => set((state) => {
          const notification = state.notifications.items.find(n => n.id === notificationId)
          if (notification && !notification.read) {
            notification.read = true
            state.notifications.unreadCount -= 1
          }
        }),

        markAllNotificationsRead: () => set((state) => {
          state.notifications.items.forEach(n => n.read = true)
          state.notifications.unreadCount = 0
        }),

        clearNotifications: () => set((state) => {
          state.notifications.items = []
          state.notifications.unreadCount = 0
        }),

        // Analytics Actions
        updateAnalytics: (analytics) => set((state) => {
          state.data.analytics = { ...state.data.analytics, ...analytics }
        }),

        addRecentActivity: (activity) => set((state) => {
          const newActivity = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            ...activity
          }
          state.data.analytics.recentActivity.unshift(newActivity)
          state.data.analytics.recentActivity = state.data.analytics.recentActivity.slice(0, 10)
        }),
      },

      // Computed values
      getters: {

        getFilteredProjects: (searchTerm) => {
          const projects = get().data.projects
          if (!searchTerm) return projects
          return projects.filter(project => 
            project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        },

        getProjectVendors: (projectId) => {
          return get().data.vendors.filter(vendor => vendor.project_id === projectId)
        },

        getVendorDocuments: (vendorId) => {
          return get().data.documents.filter(doc => doc.vendor_id === vendorId)
        },

        getUnreadNotificationsCount: () => {
          return get().notifications.unreadCount
        },

        getCurrentPageBreadcrumbs: () => {
          return get().ui.breadcrumbs
        },
      }
    })),
    {
      name: 'venxtra-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: {
          ...state.user,
          profile: state.user.profile // Ensure profile is persisted
        },
        ui: {
          theme: state.ui.theme,
          sidebarCollapsed: state.ui.sidebarCollapsed,
        }
      })
    }
  )
)

export default useAppStore