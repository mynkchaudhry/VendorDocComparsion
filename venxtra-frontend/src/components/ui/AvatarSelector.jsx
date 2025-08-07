import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, User, Upload } from 'lucide-react'
import Button from './Button'

const COOL_AVATARS = [
  // Abstract geometric patterns
  'https://api.dicebear.com/7.x/shapes/svg?seed=1&backgroundColor=3b82f6',
  'https://api.dicebear.com/7.x/shapes/svg?seed=2&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/shapes/svg?seed=3&backgroundColor=8b5cf6',
  'https://api.dicebear.com/7.x/shapes/svg?seed=4&backgroundColor=f59e0b',
  'https://api.dicebear.com/7.x/shapes/svg?seed=5&backgroundColor=ef4444',
  'https://api.dicebear.com/7.x/shapes/svg?seed=6&backgroundColor=06b6d4',
  
  // Fun avatars with different styles
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1&backgroundColor=3b82f6',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3&backgroundColor=8b5cf6',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=4&backgroundColor=f59e0b',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=5&backgroundColor=ef4444',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=6&backgroundColor=06b6d4',
  
  // Pixel art style
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=1&backgroundColor=3b82f6',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=2&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=3&backgroundColor=8b5cf6',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=4&backgroundColor=f59e0b',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=5&backgroundColor=ef4444',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=6&backgroundColor=06b6d4',
  
  // Identicon style
  'https://api.dicebear.com/7.x/identicon/svg?seed=1&backgroundColor=3b82f6',
  'https://api.dicebear.com/7.x/identicon/svg?seed=2&backgroundColor=10b981',
  'https://api.dicebear.com/7.x/identicon/svg?seed=3&backgroundColor=8b5cf6',
  'https://api.dicebear.com/7.x/identicon/svg?seed=4&backgroundColor=f59e0b',
  'https://api.dicebear.com/7.x/identicon/svg?seed=5&backgroundColor=ef4444',
  'https://api.dicebear.com/7.x/identicon/svg?seed=6&backgroundColor=06b6d4',
]

const AvatarSelector = ({ isOpen, onClose, onSelect, currentAvatar }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setUploading(true)
    try {
      // Convert file to data URL for demo
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedAvatar(e.target.result)
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Failed to upload image:', error)
      setUploading(false)
    }
  }

  const handleConfirm = () => {
    onSelect(selectedAvatar)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white dark:bg-dark-secondary rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl dark:shadow-primary-500/20 border border-transparent dark:border-dark-primary"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-primary">Choose Avatar</h3>
              <p className="text-sm text-gray-600 dark:text-dark-muted mt-1">Select a cool avatar or upload your own image</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-accent transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
            </button>
          </div>

          {/* Current Selection */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-accent rounded-xl">
            <p className="text-sm font-medium text-gray-700 dark:text-dark-secondary mb-3">Selected Avatar:</p>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white dark:bg-dark-secondary shadow-sm border-2 border-blue-200 dark:border-primary-400">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="Selected avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-dark-primary">
                  {selectedAvatar ? 'Avatar Selected' : 'No Avatar Selected'}
                </p>
                <p className="text-sm text-gray-600 dark:text-dark-muted">
                  {selectedAvatar ? 'This will be your new profile picture' : 'Choose from options below'}
                </p>
              </div>
            </div>
          </div>

          {/* Upload Custom Image */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Upload Custom Image</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="avatar-upload"
                disabled={uploading}
              />
              <label
                htmlFor="avatar-upload"
                className={`w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer flex flex-col items-center space-y-2 ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </span>
                <span className="text-xs text-gray-500">PNG, JPG up to 5MB</span>
              </label>
            </div>
          </div>

          {/* Preset Avatars */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Choose from Cool Avatars</label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-h-64 overflow-y-auto">
              {COOL_AVATARS.map((avatar, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === avatar
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedAvatar === avatar && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="primary"
              className="flex-1"
              disabled={!selectedAvatar}
            >
              Save Avatar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AvatarSelector