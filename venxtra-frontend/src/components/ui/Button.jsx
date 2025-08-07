import React from 'react'
import { motion } from 'framer-motion'
import LoadingSpinner from './LoadingSpinner'
import { clsx } from 'clsx'

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white focus:ring-primary-500 shadow-md hover:shadow-lg dark:shadow-primary-500/20',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-dark-accent dark:hover:bg-dark-secondary text-gray-900 dark:text-dark-primary focus:ring-gray-500 dark:focus:ring-primary-400 border border-gray-300 dark:border-dark-primary',
    success: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white focus:ring-green-500 shadow-md hover:shadow-lg',
    warning: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white focus:ring-yellow-500 shadow-md hover:shadow-lg',
    danger: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white focus:ring-red-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-500 dark:hover:text-white focus:ring-primary-500',
    ghost: 'text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary hover:bg-gray-100 dark:hover:bg-dark-accent focus:ring-gray-500 dark:focus:ring-primary-400'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }

  const isDisabled = disabled || loading

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isDisabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          color={variant === 'secondary' || variant === 'ghost' ? 'secondary' : 'white'} 
          className="mr-2" 
        />
      )}
      
      {Icon && iconPosition === 'left' && !loading && (
        <Icon className={clsx('w-4 h-4', children ? 'mr-2' : '')} />
      )}
      
      {children}
      
      {Icon && iconPosition === 'right' && !loading && (
        <Icon className={clsx('w-4 h-4', children ? 'ml-2' : '')} />
      )}
    </motion.button>
  )
}

export default Button