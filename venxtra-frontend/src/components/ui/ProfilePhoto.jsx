import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Camera, Upload } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import AvatarSelector from './AvatarSelector'
import useAppStore from '../../store/useAppStore'

const ProfilePhoto = ({ size = 'md', showUpload = false, className = '' }) => {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  
  const { 
    user: { preferences, profile },
    actions: { updateUserPreferences } 
  } = useAppStore()
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
    '2xl': 'w-24 h-24 text-xl'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10'
  }

  // Generate initials from user name
  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Generate a consistent color based on user name
  const getAvatarColor = (name) => {
    if (!name) return 'from-gray-500 to-gray-600'
    
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-red-500 to-red-600',
      'from-orange-500 to-orange-600',
      'from-teal-500 to-teal-600'
    ]
    
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  const handleAvatarSelect = async (avatarUrl) => {
    setIsUploading(true)
    try {
      // Update user preferences with new avatar
      await updateUserPreferences({
        avatar: avatarUrl
      })
      
      console.log('Profile photo updated:', avatarUrl)
      setImageError(false)
    } catch (error) {
      console.error('Failed to update avatar:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    if (showUpload) {
      setShowAvatarSelector(true)
    }
  }

  const profileImage = profile?.avatar || preferences?.avatar || user?.avatar || user?.profileImage

  return (
    <>
      <div className={`relative inline-flex ${className}`}>
        <motion.div
          whileHover={showUpload ? { scale: 1.05 } : {}}
          transition={{ duration: 0.2 }}
          onClick={handleClick}
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white shadow-sm overflow-hidden relative ${
            showUpload ? 'cursor-pointer group' : ''
          }`}
        >
        {profileImage && !imageError ? (
          <img
            src={profileImage}
            alt={user?.name || 'Profile'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center`}>
            {user?.name ? (
              <span className="font-semibold">
                {getInitials(user.name)}
              </span>
            ) : (
              <User className={iconSizes[size]} />
            )}
          </div>
        )}
        
        {/* Upload overlay */}
        {showUpload && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            {isUploading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Upload className={`${iconSizes[size]} text-white`} />
              </motion.div>
            ) : (
              <Camera className={`${iconSizes[size]} text-white`} />
            )}
          </div>
        )}
      </motion.div>
      
      {/* Upload indicator */}
      {showUpload && (
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
          <Camera className="w-3 h-3 text-white" />
        </div>
      )}
      
      {/* Online status indicator (optional) */}
      {user?.isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
      </div>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={profileImage}
      />
    </>
  )
}

export default ProfilePhoto