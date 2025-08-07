import React from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const Card = ({
  children,
  className = '',
  hover = true,
  padding = 'md',
  shadow = 'md',
  animated = true,
  onClick,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  }

  const baseClasses = clsx(
    'bg-white dark:bg-dark-secondary rounded-xl border border-gray-200 dark:border-dark-primary transition-colors duration-200',
    paddingClasses[padding],
    shadowClasses[shadow],
    hover && 'hover:shadow-lg dark:hover:shadow-primary-500/10 transition-shadow duration-300',
    onClick && 'cursor-pointer',
    className
  )

  const MotionComponent = animated ? motion.div : 'div'
  const animationProps = animated ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
    whileHover: hover ? { y: -2, transition: { duration: 0.2 } } : {},
  } : {}

  return (
    <MotionComponent
      className={baseClasses}
      onClick={onClick}
      {...animationProps}
      {...props}
    >
      {children}
    </MotionComponent>
  )
}

export default Card