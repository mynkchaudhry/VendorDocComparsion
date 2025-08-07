import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { 
  User, 
  Bell, 
  Shield, 
  Database,
  Globe,
  Save,
  RefreshCw,
  Trash2,
  Download,
  AlertTriangle,
  Mail,
  Lock,
  Zap,
  FileText
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { showToast } from '../components/ui/Toast'
import ProfilePhoto from '../components/ui/ProfilePhoto'
import useAppStore from '../store/useAppStore'
import { userAPI } from '../utils/api'

const SettingsSection = ({ icon: Icon, title, description, children, className = '' }) => (
  <Card className={`p-6 ${className}`}>
    <div className="flex items-center space-x-3 mb-6">
      <div className="w-10 h-10 bg-blue-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-blue-600 dark:text-primary-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-primary">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-dark-secondary">{description}</p>
      </div>
    </div>
    {children}
  </Card>
)

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium text-gray-900 dark:text-dark-primary">{label}</p>
      {description && <p className="text-sm text-gray-600 dark:text-dark-secondary">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
        enabled ? 'bg-blue-600 dark:bg-primary-500' : 'bg-gray-200 dark:bg-dark-accent'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
)

const Settings = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCleanDialog, setShowCleanDialog] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [cleanLoading, setCleanLoading] = useState(false)
  
  const {
    user: { preferences, profile },
    data: { projects, vendors, documents },
    actions: { 
      updateUserPreferences, 
      setUserProfile,
      addRecentActivity, 
      addNotification,
      exportUserData,
      clearAllData,
      clearVendors,
      clearDocuments
    }
  } = useAppStore()

  const [formData, setFormData] = useState({
    // Profile
    name: profile?.name || user?.name || '',
    email: profile?.email || user?.email || '',
    
    // Preferences
    language: preferences.language || 'en',
    timezone: preferences.timezone || 'UTC',
    notifications: {
      email: preferences.notifications?.email ?? true,
      projectUpdates: preferences.notifications?.projectUpdates ?? true,
      analysisComplete: preferences.notifications?.analysisComplete ?? true
    },
    
    // AI Settings
    aiSettings: {
      autoAnalysis: preferences.aiSettings?.autoAnalysis ?? true,
      confidenceThreshold: preferences.aiSettings?.confidenceThreshold ?? 0.8,
      maxRetries: preferences.aiSettings?.maxRetries ?? 3
    }
  })

  useEffect(() => {
    addRecentActivity({
      type: 'navigation',
      description: 'Opened Settings page',
      metadata: { page: 'settings' }
    })
  }, [addRecentActivity])

  // Update form data when profile changes
  useEffect(() => {
    if (profile?.name || profile?.email) {
      setFormData(prev => ({
        ...prev,
        name: profile?.name || prev.name,
        email: profile?.email || prev.email
      }))
    }
  }, [profile])

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setUnsavedChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save profile data to backend
      if (formData.name || formData.email) {
        const profileResponse = await userAPI.updateProfile({
          name: formData.name,
          email: formData.email
        })
        
        // Update local store with backend response
        if (profileResponse.data) {
          setUserProfile({
            name: profileResponse.data.name,
            email: profileResponse.data.email,
            ...profileResponse.data
          })
        }
      }
      
      // Update user preferences
      await updateUserPreferences({
        language: formData.language,
        timezone: formData.timezone,
        notifications: formData.notifications,
        aiSettings: formData.aiSettings
      })
      
      addRecentActivity({
        type: 'settings',
        description: 'Updated user preferences',
        metadata: { section: activeTab }
      })
      
      addNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your preferences have been updated successfully.'
      })
      
      showToast.success('Settings saved successfully!')
      setUnsavedChanges(false)
    } catch (error) {
      console.error('Save settings error:', error)
      showToast.error(error.response?.data?.detail || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleCleanDatabase = async () => {
    setCleanLoading(true)
    try {
      // Clear vendors and documents but preserve user and projects
      await clearVendors()
      await clearDocuments()
      
      addRecentActivity({
        type: 'data',
        description: 'Cleaned database - removed all vendors and documents',
        metadata: { action: 'clean_db', itemsRemoved: vendors.length + documents.length }
      })
      
      addNotification({
        type: 'success',
        title: 'Database Cleaned',
        message: `Removed ${vendors.length} vendors and ${documents.length} documents. Your projects and account are preserved.`
      })
      
      showToast.success(`Database cleaned! Removed ${vendors.length} vendors and ${documents.length} documents.`)
      setShowCleanDialog(false)
    } catch (error) {
      showToast.error('Failed to clean database')
    } finally {
      setCleanLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      await exportUserData()
      addRecentActivity({
        type: 'data',
        description: 'Exported user data',
        metadata: { action: 'export' }
      })
      showToast.success('Data export started. You will receive an email when ready.')
    } catch (error) {
      showToast.error('Failed to export data')
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      await clearAllData()
      addRecentActivity({
        type: 'security',
        description: 'Account deletion initiated',
        metadata: { action: 'delete_account' }
      })
      showToast.success('Account deletion initiated')
      logout()
    } catch (error) {
      showToast.error('Failed to delete account')
    } finally {
      setDeleteLoading(false)
      setShowDeleteDialog(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI Settings', icon: Zap },
    { id: 'data', label: 'Data', icon: Database }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-primary">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-dark-muted">
            Manage your account preferences and application settings
          </p>
        </motion.div>
        
        {unsavedChanges && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 lg:mt-0 flex items-center space-x-4"
          >
            <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Unsaved changes</span>
            </div>
            <Button
              onClick={handleSave}
              loading={loading}
              variant="primary"
              icon={Save}
              iconPosition="left"
            >
              Save Changes
            </Button>
          </motion.div>
        )}
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="border-b border-gray-200 dark:border-dark-primary">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 dark:border-primary-400 text-blue-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-secondary hover:border-gray-300 dark:hover:border-dark-primary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {activeTab === 'profile' && (
          <>
            <SettingsSection
              icon={User}
              title="Profile Information"
              description="Update your personal information and account details"
            >
              <div className="space-y-6">
                {/* Profile Photo Section */}
                <div className="flex items-center space-x-6 p-4 bg-gray-50 dark:bg-dark-accent rounded-xl">
                  <ProfilePhoto size="2xl" showUpload={true} />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-dark-primary mb-1">Profile Picture</h4>
                    <p className="text-sm text-gray-600 dark:text-dark-secondary mb-3">
                      Click on your avatar to change your profile picture. Choose from cool avatars or upload your own image.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted">
                      Recommended: Square image, at least 200x200 pixels
                    </p>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                      setUnsavedChanges(true)
                    }}
                    placeholder="Enter your full name"
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }))
                      setUnsavedChanges(true)
                    }}
                    placeholder="Enter your email"
                    icon={Mail}
                  />
                </div>
              </div>
            </SettingsSection>


            <SettingsSection
              icon={Globe}
              title="Preferences"
              description="Customize your application experience"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-2">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, language: e.target.value }))
                      setUnsavedChanges(true)
                    }}
                    className="w-full rounded-lg border border-gray-300 dark:border-dark-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary"
                  >
                    <option value="en">English</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="it">Italiano (Italian)</option>
                    <option value="pt">Português (Portuguese)</option>
                    <option value="ru">Русский (Russian)</option>
                    <option value="ja">日本語 (Japanese)</option>
                    <option value="ko">한국어 (Korean)</option>
                    <option value="zh">中文 (Chinese)</option>
                    <option value="ar">العربية (Arabic)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-2">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, timezone: e.target.value }))
                      setUnsavedChanges(true)
                    }}
                    className="w-full rounded-lg border border-gray-300 dark:border-dark-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>
            </SettingsSection>
          </>
        )}

        {activeTab === 'notifications' && (
          <SettingsSection
            icon={Bell}
            title="Notification Preferences"
            description="Control when and how you receive notifications"
          >
            <div className="space-y-6">
              <ToggleSwitch
                enabled={formData.notifications.email}
                onChange={(value) => handleInputChange('notifications', 'email', value)}
                label="Email Notifications"
                description="Receive notifications via email"
              />
              <ToggleSwitch
                enabled={formData.notifications.projectUpdates}
                onChange={(value) => handleInputChange('notifications', 'projectUpdates', value)}
                label="Project Updates"
                description="Get notified when projects are updated"
              />
              <ToggleSwitch
                enabled={formData.notifications.analysisComplete}
                onChange={(value) => handleInputChange('notifications', 'analysisComplete', value)}
                label="Analysis Complete"
                description="Notify when document analysis is finished"
              />
            </div>
          </SettingsSection>
        )}

        {activeTab === 'ai' && (
          <SettingsSection
            icon={Zap}
            title="AI & Analysis Settings"
            description="Configure AI processing and analysis preferences"
          >
            <div className="space-y-6">
              <ToggleSwitch
                enabled={formData.aiSettings.autoAnalysis}
                onChange={(value) => handleInputChange('aiSettings', 'autoAnalysis', value)}
                label="Automatic Analysis"
                description="Automatically analyze documents when uploaded"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-2">
                    Confidence Threshold
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.1"
                    value={formData.aiSettings.confidenceThreshold}
                    onChange={(e) => handleInputChange('aiSettings', 'confidenceThreshold', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-dark-muted mt-1">
                    <span>0.5 (Low)</span>
                    <span>{formData.aiSettings.confidenceThreshold}</span>
                    <span>1.0 (High)</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-dark-secondary mt-2">
                    Minimum confidence level for AI analysis results
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-2">
                    Max Retries
                  </label>
                  <select
                    value={formData.aiSettings.maxRetries}
                    onChange={(e) => handleInputChange('aiSettings', 'maxRetries', parseInt(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 dark:border-dark-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary"
                  >
                    <option value={1}>1 retry</option>
                    <option value={2}>2 retries</option>
                    <option value={3}>3 retries</option>
                    <option value={5}>5 retries</option>
                  </select>
                  <p className="text-sm text-gray-600 dark:text-dark-secondary mt-2">
                    Number of retries for failed analysis attempts
                  </p>
                </div>
              </div>
            </div>
          </SettingsSection>
        )}


        {activeTab === 'data' && (
          <>
            <SettingsSection
              icon={Download}
              title="Data Export"
              description="Download your data in a portable format"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-dark-primary">Export All Data</p>
                  <p className="text-sm text-gray-600 dark:text-dark-secondary">
                    Download all your projects, vendors, and analysis data
                  </p>
                </div>
                <Button
                  onClick={handleExportData}
                  variant="secondary"
                  icon={Download}
                  iconPosition="left"
                >
                  Export Data
                </Button>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={Trash2}
              title="Data Management"
              description="Manage your stored data and account"
              className="border-red-200"
            >
              <div className="space-y-6">
                {/* Clean Database */}
                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="font-medium text-orange-900 dark:text-orange-200">Clean Database</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Remove all vendors and documents. Your account and projects will be preserved.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowCleanDialog(true)}
                    variant="primary"
                    icon={RefreshCw}
                    iconPosition="left"
                  >
                    Clean DB
                  </Button>
                </div>
                
                {/* Delete Account */}
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-200">Delete Account</p>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        This action cannot be undone. All your data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="danger"
                    icon={Trash2}
                    iconPosition="left"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </SettingsSection>
          </>
        )}
      </motion.div>

      {/* Clean Database Dialog */}
      <ConfirmDialog
        isOpen={showCleanDialog}
        onClose={() => setShowCleanDialog(false)}
        onConfirm={handleCleanDatabase}
        title="Clean Database"
        message={`This will remove all ${vendors.length} vendors and ${documents.length} documents from your account. Your projects and account information will be preserved. This action cannot be undone.`}
        confirmText="Clean Database"
        type="warning"
        loading={cleanLoading}
        requiresTyping={true}
        requiredText="CLEAN"
      />

      {/* Delete Account Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="This will permanently delete your account and all associated data including projects, vendors, and documents. This action cannot be undone."
        confirmText="Delete Account"
        type="danger"
        loading={deleteLoading}
        requiresTyping={true}
        requiredText="DELETE"
      />
    </div>
  )
}

export default Settings