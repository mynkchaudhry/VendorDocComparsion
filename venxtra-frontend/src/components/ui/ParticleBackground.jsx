import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const ParticleBackground = ({ particleCount = 15, colorScheme = 'blue' }) => {
  const particles = useMemo(() => {
    const colorVariants = {
      blue: ['bg-blue-300/20', 'bg-blue-400/15', 'bg-white/10', 'bg-cyan-300/25'],
      purple: ['bg-purple-300/20', 'bg-purple-400/15', 'bg-white/10', 'bg-pink-300/25']
    }
    
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      size: Math.random() * 60 + 20, // 20-80px
      x: Math.random() * 100, // 0-100%
      y: Math.random() * 100, // 0-100%
      duration: Math.random() * 20 + 15, // 15-35s
      delay: Math.random() * 10, // 0-10s delay
      color: colorVariants[colorScheme][Math.floor(Math.random() * colorVariants[colorScheme].length)],
      blur: Math.random() * 30 + 10, // 10-40px blur
      opacity: Math.random() * 0.4 + 0.1, // 0.1-0.5 opacity
    }))
  }, [particleCount, colorScheme])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${particle.color}`}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            filter: `blur(${particle.blur}px)`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -100, 0, 100, 0],
            x: [0, 50, -30, 20, 0],
            scale: [1, 1.2, 0.8, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Additional floating bubbles */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`bubble-${i}`}
          className="absolute w-4 h-4 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -150, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      
      {/* Gentle wave effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-white/5"
        animate={{
          opacity: [0.3, 0.1, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}

export default ParticleBackground