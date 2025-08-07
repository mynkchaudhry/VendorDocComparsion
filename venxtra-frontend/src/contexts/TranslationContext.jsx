import React, { createContext, useContext, useState, useEffect } from 'react'
import useAppStore from '../store/useAppStore'

const TranslationContext = createContext()

// Translation keys for different languages
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Projects',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.vendors': 'Vendors',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.overview': "Here's what's happening with your vendor comparisons.",
    'dashboard.newProject': 'New Project',
    'dashboard.activeProjects': 'Active Projects',
    'dashboard.vendorsAdded': 'Vendors Added',
    'dashboard.documentsProcessed': 'Documents Processed',
    'dashboard.processingStatus': 'Processing Status',
    'dashboard.vendorComparisons': 'Vendor Comparisons',
    'dashboard.readyToStart': 'Ready to get started?',
    'dashboard.createFirstProject': 'Create your first project to start organizing vendors and making data-driven comparisons.',
    'dashboard.createYourFirstProject': 'Create Your First Project',
    
    // Projects
    'projects.title': 'Projects',
    'projects.subtitle': 'Manage all your vendor comparison projects in one place',
    'projects.searchPlaceholder': 'Search projects...',
    'projects.allProjects': 'All Projects',
    'projects.favorites': 'Favorites',
    'projects.recent': 'Recent',
    'projects.noProjectsFound': 'No projects found',
    'projects.noProjectsYet': 'No projects yet',
    'projects.createNewProject': 'Create New Project',
    'projects.projectName': 'Project Name',
    'projects.description': 'Description (optional)',
    'projects.cancel': 'Cancel',
    'projects.createProject': 'Create Project',
    
    // Vendors
    'vendors.title': 'Vendors',
    'vendors.addVendor': 'Add Vendor',
    'vendors.noVendors': 'No vendors',
    'vendors.getStarted': 'Get started by adding vendors to this project.',
    'vendors.clickToView': 'Click to view details',
    'vendors.addNewVendor': 'Add New Vendor',
    'vendors.vendorName': 'Vendor Name',
    'vendors.quickCompare': 'Quick Compare',
    'vendors.advancedCompare': 'Advanced Compare',
    
    // Documents
    'documents.uploadDocuments': 'Upload Documents',
    'documents.documentAnalysis': 'Document Analysis',
    'documents.documents': 'Documents',
    'documents.dataTable': 'Data Table',
    'documents.noDocuments': 'No documents uploaded yet',
    'documents.uploadFiles': 'Upload Files',
    'documents.uploading': 'Uploading...',
    'documents.deleteDocument': 'Delete Document',
    'documents.confirmDelete': 'Are you sure you want to delete',
    'documents.cannotBeUndone': 'This action cannot be undone.',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account preferences and application settings',
    'settings.profile': 'Profile',
    'settings.notifications': 'Notifications',
    'settings.aiSettings': 'AI Settings',
    'settings.data': 'Data',
    'settings.saveChanges': 'Save Changes',
    'settings.unsavedChanges': 'Unsaved changes',
    'settings.profileInformation': 'Profile Information',
    'settings.updatePersonalInfo': 'Update your personal information and account details',
    'settings.fullName': 'Full Name',
    'settings.emailAddress': 'Email Address',
    'settings.language': 'Language',
    'settings.timezone': 'Timezone',
    'settings.preferences': 'Preferences',
    'settings.customizeExperience': 'Customize your application experience',
    
    // Analytics
    'analytics.title': 'Analytics',
    'analytics.subtitle': 'Insights and performance metrics for your vendor comparisons',
    'analytics.overview': 'Overview',
    'analytics.exportReport': 'Export Report',
    'analytics.projectsOverTime': 'Projects Over Time',
    'analytics.vendorsByCategory': 'Vendors by Category',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
  },
  
  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.projects': 'परियोजनाएं',
    'nav.analytics': 'विश्लेषण',
    'nav.settings': 'सेटिंग्स',
    'nav.vendors': 'विक्रेता',
    
    // Dashboard
    'dashboard.welcome': 'वापसी पर स्वागत है',
    'dashboard.overview': 'यहां आपकी विक्रेता तुलनाओं के साथ क्या हो रहा है।',
    'dashboard.newProject': 'नई परियोजना',
    'dashboard.activeProjects': 'सक्रिय परियोजनाएं',
    'dashboard.vendorsAdded': 'विक्रेता जोड़े गए',
    'dashboard.documentsProcessed': 'दस्तावेज़ संसाधित',
    'dashboard.processingStatus': 'प्रसंस्करण स्थिति',
    'dashboard.vendorComparisons': 'विक्रेता तुलनाएं',
    'dashboard.readyToStart': 'शुरू करने के लिए तैयार हैं?',
    'dashboard.createFirstProject': 'विक्रेताओं को व्यवस्थित करने और डेटा-संचालित तुलनाएं करने के लिए अपनी पहली परियोजना बनाएं।',
    'dashboard.createYourFirstProject': 'अपनी पहली परियोजना बनाएं',
    
    // Projects
    'projects.title': 'परियोजनाएं',
    'projects.subtitle': 'अपनी सभी विक्रेता तुलना परियोजनाओं को एक स्थान पर प्रबंधित करें',
    'projects.searchPlaceholder': 'परियोजनाएं खोजें...',
    'projects.allProjects': 'सभी परियोजनाएं',
    'projects.favorites': 'पसंदीदा',
    'projects.recent': 'हाल ही में',
    'projects.noProjectsFound': 'कोई परियोजना नहीं मिली',
    'projects.noProjectsYet': 'अभी तक कोई परियोजना नहीं',
    'projects.createNewProject': 'नई परियोजना बनाएं',
    'projects.projectName': 'परियोजना का नाम',
    'projects.description': 'विवरण (वैकल्पिक)',
    'projects.cancel': 'रद्द करें',
    'projects.createProject': 'परियोजना बनाएं',
    
    // Vendors
    'vendors.title': 'विक्रेता',
    'vendors.addVendor': 'विक्रेता जोड़ें',
    'vendors.noVendors': 'कोई विक्रेता नहीं',
    'vendors.getStarted': 'इस परियोजना में विक्रेताओं को जोड़कर शुरुआत करें।',
    'vendors.clickToView': 'विवरण देखने के लिए क्लिक करें',
    'vendors.addNewVendor': 'नया विक्रेता जोड़ें',
    'vendors.vendorName': 'विक्रेता का नाम',
    'vendors.quickCompare': 'त्वरित तुलना',
    'vendors.advancedCompare': 'उन्नत तुलना',
    
    // Documents
    'documents.uploadDocuments': 'दस्तावेज़ अपलोड करें',
    'documents.documentAnalysis': 'दस्तावेज़ विश्लेषण',
    'documents.documents': 'दस्तावेज़',
    'documents.dataTable': 'डेटा तालिका',
    'documents.noDocuments': 'अभी तक कोई दस्तावेज़ अपलोड नहीं किया गया',
    'documents.uploadFiles': 'फाइलें अपलोड करें',
    'documents.uploading': 'अपलोड हो रहा है...',
    'documents.deleteDocument': 'दस्तावेज़ हटाएं',
    'documents.confirmDelete': 'क्या आप वाकई हटाना चाहते हैं',
    'documents.cannotBeUndone': 'यह क्रिया पूर्ववत नहीं की जा सकती।',
    
    // Settings
    'settings.title': 'सेटिंग्स',
    'settings.subtitle': 'अपनी खाता प्राथमिकताओं और एप्लिकेशन सेटिंग्स को प्रबंधित करें',
    'settings.profile': 'प्रोफ़ाइल',
    'settings.notifications': 'सूचनाएं',
    'settings.aiSettings': 'AI सेटिंग्स',
    'settings.data': 'डेटा',
    'settings.saveChanges': 'परिवर्तन सहेजें',
    'settings.unsavedChanges': 'असहेजे गए परिवर्तन',
    'settings.profileInformation': 'प्रोफ़ाइल जानकारी',
    'settings.updatePersonalInfo': 'अपनी व्यक्तिगत जानकारी और खाता विवरण अपडेट करें',
    'settings.fullName': 'पूरा नाम',
    'settings.emailAddress': 'ईमेल पता',
    'settings.language': 'भाषा',
    'settings.timezone': 'समय क्षेत्र',
    'settings.preferences': 'प्राथमिकताएं',
    'settings.customizeExperience': 'अपना एप्लिकेशन अनुभव अनुकूलित करें',
    
    // Analytics
    'analytics.title': 'विश्लेषण',
    'analytics.subtitle': 'आपकी विक्रेता तुलनाओं के लिए अंतर्दृष्टि और प्रदर्शन मेट्रिक्स',
    'analytics.overview': 'अवलोकन',
    'analytics.exportReport': 'रिपोर्ट निर्यात करें',
    'analytics.projectsOverTime': 'समय के साथ परियोजनाएं',
    'analytics.vendorsByCategory': 'श्रेणी के अनुसार विक्रेता',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.view': 'देखें',
    'common.add': 'जोड़ें',
    'common.search': 'खोजें',
    'common.filter': 'फ़िल्टर',
    'common.export': 'निर्यात',
    'common.close': 'बंद करें',
    'common.confirm': 'पुष्टि करें',
    'common.yes': 'हाँ',
    'common.no': 'नहीं',
  }
}

export const TranslationProvider = ({ children }) => {
  const store = useAppStore()
  const preferences = store.user.preferences
  const [currentLanguage, setCurrentLanguage] = useState(preferences?.language || 'en')

  // Update language when preferences change
  useEffect(() => {
    if (preferences?.language && preferences.language !== currentLanguage) {
      setCurrentLanguage(preferences.language)
    }
  }, [preferences?.language, currentLanguage])

  const t = (key, fallback = key) => {
    const languageTranslations = translations[currentLanguage] || translations.en
    return languageTranslations[key] || translations.en[key] || fallback
  }

  const changeLanguage = (lang) => {
    setCurrentLanguage(lang)
  }

  return (
    <TranslationContext.Provider value={{ 
      currentLanguage, 
      changeLanguage, 
      t,
      availableLanguages: Object.keys(translations)
    }}>
      {children}
    </TranslationContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}

export default TranslationContext