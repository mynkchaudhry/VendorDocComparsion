import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { projectsAPI, vendorsAPI, documentsAPI } from '../utils/api'
import useAppStore from '../store/useAppStore'

export const useRealTimeUpdates = (options = {}) => {
  const {
    enablePolling = true,
    pollingInterval = 8000, // Further optimized to 8 seconds
    enableProcessingLogs = false, // Disabled since we removed processing logs
    maxLogEntries = 10 // Further reduced for better memory usage
  } = options

  const [isLiveUpdating, setIsLiveUpdating] = useState(false)
  const [processingLogs, setProcessingLogs] = useState([])
  const [lastUpdateTime, setLastUpdateTime] = useState(null)
  const [updateCount, setUpdateCount] = useState(0)
  
  const queryClient = useQueryClient()
  const intervalRef = useRef(null)
  const logCountRef = useRef(0)
  
  const store = useAppStore()
  const { 
    setProjects, 
    setVendors, 
    setDocuments, 
    updateAnalytics,
    addNotification 
  } = store.actions

  // Simplified processing log (minimal usage)
  const addProcessingLog = useCallback((entry) => {
    if (!enableProcessingLogs) return // Skip if disabled
    
    const timestamp = new Date().toISOString()
    const logEntry = {
      id: `log_${++logCountRef.current}`,
      timestamp,
      ...entry
    }
    
    setProcessingLogs(prev => {
      const newLogs = [logEntry, ...prev].slice(0, maxLogEntries)
      return newLogs
    })
  }, [maxLogEntries, enableProcessingLogs])

  // Fetch latest data
  const fetchLatestData = useCallback(async () => {
    try {
      setIsLiveUpdating(true)
      
      // Fetch all data in parallel
      const [projectsRes, vendorsRes, documentsRes] = await Promise.all([
        projectsAPI.getAll().catch(err => ({ data: [] })),
        vendorsAPI.getAll().catch(err => ({ data: [] })),
        documentsAPI.getAll().catch(err => ({ data: [] }))
      ])

      const projects = projectsRes.data || []
      const vendors = vendorsRes.data || []
      const documents = documentsRes.data || []

      // Update store
      setProjects(projects)
      setVendors(vendors)
      setDocuments(documents)

      // Update analytics
      const processingDocs = documents.filter(doc => 
        doc.processing_status === 'processing' || doc.processing_status === 'pending'
      )
      const completedDocs = documents.filter(doc => 
        doc.processing_status === 'completed'
      )

      updateAnalytics({
        totalProjects: projects.length,
        totalVendors: vendors.length,
        totalDocuments: documents.length,
        processingDocuments: processingDocs.length,
        completedDocuments: completedDocs.length,
        successRate: documents.length > 0 ? (completedDocs.length / documents.length) * 100 : 0
      })


      // Smart query invalidation - only if data count changed significantly
      const currentProjectsCount = queryClient.getQueryData(['projects'])?.length || 0
      const currentVendorsCount = queryClient.getQueryData(['vendors'])?.length || 0  
      const currentDocumentsCount = queryClient.getQueryData(['documents'])?.length || 0
      
      if (Math.abs(projects.length - currentProjectsCount) > 0) {
        queryClient.invalidateQueries(['projects'])
      }
      if (Math.abs(vendors.length - currentVendorsCount) > 0) {
        queryClient.invalidateQueries(['vendors'])
      }
      if (Math.abs(documents.length - currentDocumentsCount) > 0) {
        queryClient.invalidateQueries(['documents'])
      }

      setLastUpdateTime(new Date())
      setUpdateCount(prev => prev + 1)

      return { projects, vendors, documents }
    } catch (error) {
      console.error('Real-time update failed:', error)
      addProcessingLog({
        type: 'error',
        level: 'error',
        message: `❌ Update failed: ${error.message}`,
        error: error.message
      })
      throw error
    } finally {
      setIsLiveUpdating(false)
    }
  }, [queryClient, setProjects, setVendors, setDocuments, updateAnalytics, addProcessingLog])

  // Start/stop real-time updates
  const startRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) return // Already running
    
    addProcessingLog({
      type: 'system',
      level: 'info',
      message: '🔄 Real-time updates started'
    })

    // Initial fetch
    fetchLatestData()
    
    // Set up polling
    if (enablePolling) {
      intervalRef.current = setInterval(() => {
        fetchLatestData()
      }, pollingInterval)
    }
  }, [fetchLatestData, enablePolling, pollingInterval, addProcessingLog])

  const stopRealTimeUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      
      addProcessingLog({
        type: 'system',
        level: 'info',
        message: '⏸️ Real-time updates paused'
      })
    }
  }, [addProcessingLog])

  const forceUpdate = useCallback(async () => {
    addProcessingLog({
      type: 'system',
      level: 'info',
      message: '🔄 Manual refresh triggered'
    })
    
    return await fetchLatestData()
  }, [fetchLatestData, addProcessingLog])

  // Auto-start on mount
  useEffect(() => {
    startRealTimeUpdates()
    
    return () => {
      stopRealTimeUpdates()
    }
  }, [startRealTimeUpdates, stopRealTimeUpdates])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    isLiveUpdating,
    processingLogs,
    lastUpdateTime,
    updateCount,
    startRealTimeUpdates,
    stopRealTimeUpdates,
    forceUpdate,
    addProcessingLog
  }
}

export default useRealTimeUpdates