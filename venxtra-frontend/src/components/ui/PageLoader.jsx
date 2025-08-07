import React from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from './LoadingSpinner'

const PageLoader = ({ message = 'Loading...', fullScreen = true }) => {
  const containerClass = fullScreen 
    ? 'fixed inset-0 bg-white dark:bg-dark-primary bg-opacity-90 dark:bg-opacity-90 backdrop-blur-sm z-50'
    : 'w-full py-12'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${containerClass} flex items-center justify-center`}
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <LoadingSpinner size="xl" />
        </motion.div>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 dark:text-dark-secondary text-lg font-medium"
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  )
}

export default PageLoader