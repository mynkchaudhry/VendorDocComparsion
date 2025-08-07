import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  containerClassName = '',
  size = 'md',
  variant = 'default',
  ...props
}, ref) => {
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-5 py-4 text-base'
  }

  const variants = {
    default: 'border-gray-300 dark:border-dark-primary focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary placeholder-gray-500 dark:placeholder-dark-muted',
    error: 'border-red-300 dark:border-red-400 focus:border-red-500 focus:ring-red-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary placeholder-gray-500 dark:placeholder-dark-muted',
    success: 'border-green-300 dark:border-green-400 focus:border-green-500 focus:ring-green-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-dark-primary placeholder-gray-500 dark:placeholder-dark-muted'
  }

  const inputVariant = error ? 'error' : variant

  const baseClasses = clsx(
    'w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed',
    sizes[size],
    variants[inputVariant],
    Icon && iconPosition === 'left' && 'pl-10',
    Icon && iconPosition === 'right' && 'pr-10',
    className
  )

  return (
    <div className={clsx('relative', containerClassName)}>
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-sm font-medium text-gray-700 dark:text-dark-secondary mb-2"
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 dark:text-dark-muted" />
          </div>
        )}
        
        <motion.input
          ref={ref}
          className={baseClasses}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          {...props}
        />
        
        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400 dark:text-dark-muted" />
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'mt-2 text-sm',
            error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-dark-muted'
          )}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input