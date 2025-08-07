import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { clsx } from 'clsx'

const ThemeToggle = ({ size = 'md', className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme()

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className={clsx(
        'relative rounded-full border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'bg-white dark:bg-dark-secondary',
        'border-gray-200 dark:border-dark-primary',
        'hover:border-primary-300 dark:hover:border-primary-400',
        'focus:ring-primary-500 dark:focus:ring-primary-400',
        'shadow-sm hover:shadow-md dark:shadow-dark-primary/20',
        sizes[size],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={false}
      animate={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e5e7eb'
      }}
      transition={{ duration: 0.2 }}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          scale: isDark ? 0 : 1,
          opacity: isDark ? 0 : 1,
          rotate: isDark ? 180 : 0
        }}
        transition={{ duration: 0.2 }}
      >
        <Sun className={clsx(iconSizes[size], 'text-yellow-500')} />
      </motion.div>
      
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          scale: isDark ? 1 : 0,
          opacity: isDark ? 1 : 0,
          rotate: isDark ? 0 : -180
        }}
        transition={{ duration: 0.2 }}
      >
        <Moon className={clsx(iconSizes[size], 'text-primary-400')} />
      </motion.div>

      {/* Glow effect for dark mode */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={false}
        animate={{
          boxShadow: isDark 
            ? '0 0 20px rgba(56, 189, 248, 0.3), inset 0 0 20px rgba(56, 189, 248, 0.1)' 
            : '0 0 0px rgba(0, 0, 0, 0)'
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
}

export default ThemeToggle