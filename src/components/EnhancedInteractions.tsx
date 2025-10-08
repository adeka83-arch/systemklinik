import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Sparkles, Heart, Star, Zap, Smile, Trophy, Gift } from 'lucide-react'

interface FloatingElementProps {
  children: React.ReactNode
  className?: string
  hoverScale?: number
  hoverRotate?: number
}

export function FloatingElement({ 
  children, 
  className = "", 
  hoverScale = 1.05, 
  hoverRotate = 2 
}: FloatingElementProps) {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        scale: hoverScale, 
        rotate: hoverRotate,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      whileTap={{ scale: 0.95 }}
      animate={{ 
        y: [0, -2, 0], 
      }}
      transition={{ 
        y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }}
    >
      {children}
    </motion.div>
  )
}

interface PulsingBadgeProps {
  children: React.ReactNode
  color?: 'pink' | 'green' | 'blue' | 'purple' | 'yellow'
  size?: 'sm' | 'md' | 'lg'
}

export function PulsingBadge({ children, color = 'pink', size = 'md' }: PulsingBadgeProps) {
  const colorClasses = {
    pink: 'bg-pink-100 text-pink-800 border-pink-300',
    green: 'bg-green-100 text-green-800 border-green-300', 
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  return (
    <motion.div
      animate={{ 
        scale: [1, 1.05, 1],
        boxShadow: [
          "0 0 0 0 rgba(236, 72, 153, 0.4)",
          "0 0 0 10px rgba(236, 72, 153, 0)",
          "0 0 0 0 rgba(236, 72, 153, 0)"
        ]
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={`inline-flex items-center rounded-full border-2 ${colorClasses[color]} ${sizeClasses[size]}`}
    >
      {children}
    </motion.div>
  )
}

interface SparkleButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  className?: string
}

export function SparkleButton({ 
  children, 
  onClick, 
  variant = 'default', 
  disabled = false,
  className = ""
}: SparkleButtonProps) {
  const [isClicked, setIsClicked] = useState(false)
  const [sparkles, setSparkles] = useState<Array<{ id: number, x: number, y: number }>>([])

  const variantClasses = {
    default: 'bg-pink-600 hover:bg-pink-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  }

  const handleClick = () => {
    if (disabled) return
    
    setIsClicked(true)
    
    // Generate random sparkles
    const newSparkles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100
    }))
    setSparkles(newSparkles)
    
    // Clear sparkles after animation
    setTimeout(() => {
      setSparkles([])
      setIsClicked(false)
    }, 800)
    
    onClick?.()
  }

  return (
    <motion.div className="relative inline-block">
      <motion.button
        className={`relative overflow-hidden px-6 py-2 rounded-lg font-medium transition-all duration-200 ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={handleClick}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        animate={isClicked ? { 
          scale: [1, 1.1, 1],
          rotateZ: [0, 5, -5, 0]
        } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {children}
        
        {/* Sparkle overlay */}
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              className="absolute pointer-events-none"
              style={{
                left: `${sparkle.x}%`,
                top: `${sparkle.y}%`
              }}
              initial={{ scale: 0, rotate: 0, opacity: 1 }}
              animate={{ 
                scale: [0, 1, 0], 
                rotate: [0, 180, 360],
                opacity: [1, 1, 0],
                y: [-10, -30]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Sparkles className="h-3 w-3 text-yellow-300" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}

interface MagneticButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function MagneticButton({ children, onClick, className = "" }: MagneticButtonProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    
    setMousePosition({ x: mouseX * 0.3, y: mouseY * 0.3 })
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setMousePosition({ x: 0, y: 0 })
  }

  return (
    <motion.button
      className={`relative bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-200 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        x: mousePosition.x,
        y: mousePosition.y,
        scale: isHovering ? 1.05 : 1
      }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 rounded-lg blur-lg"
        style={{ zIndex: -1 }}
        animate={{
          opacity: isHovering ? 0.7 : 0,
          scale: isHovering ? 1.1 : 1
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  )
}

interface CounterBadgeProps {
  count: number
  maxCount?: number
  label: string
  icon?: React.ReactNode
}

export function AnimatedCounter({ count, maxCount = 99, label, icon }: CounterBadgeProps) {
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString()
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{label}</span>
      <motion.div
        key={count}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-1"
      >
        {icon && (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
        )}
        <motion.span
          className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-sm font-bold"
          animate={{ 
            scale: count > 0 ? [1, 1.2, 1] : 1,
            backgroundColor: count > 0 ? ["#fce7f3", "#ec4899", "#fce7f3"] : "#fce7f3"
          }}
          transition={{ duration: 0.6 }}
        >
          {displayCount}
        </motion.span>
      </motion.div>
    </div>
  )
}

export function SuccessConfetti() {
  const icons = [
    <Heart className="h-4 w-4 text-red-500" />,
    <Star className="h-4 w-4 text-yellow-500" />,
    <Sparkles className="h-4 w-4 text-purple-500" />,
    <Zap className="h-4 w-4 text-blue-500" />,
    <Smile className="h-4 w-4 text-green-500" />,
    <Trophy className="h-4 w-4 text-amber-500" />,
    <Gift className="h-4 w-4 text-pink-500" />
  ]

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -50,
            rotate: 0,
            scale: 0
          }}
          animate={{
            y: window.innerHeight + 50,
            rotate: 360,
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
            ease: "easeOut"
          }}
        >
          {icons[Math.floor(Math.random() * icons.length)]}
        </motion.div>
      ))}
    </div>
  )
}

interface GlowCardProps {
  children: React.ReactNode
  glowColor?: string
  className?: string
}

export function GlowCard({ children, glowColor = "pink", className = "" }: GlowCardProps) {
  const [isHovering, setIsHovering] = useState(false)

  const glowColors = {
    pink: "shadow-pink-500/25",
    blue: "shadow-blue-500/25", 
    green: "shadow-green-500/25",
    purple: "shadow-purple-500/25",
    yellow: "shadow-yellow-500/25"
  }

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card 
        className={`relative transition-all duration-300 ${
          isHovering ? `shadow-xl ${glowColors[glowColor]}` : 'shadow-md'
        }`}
      >
        {children}
      </Card>
      
      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-lg border-2 border-transparent"
        style={{
          background: `linear-gradient(45deg, transparent, ${isHovering ? '#ec4899' : 'transparent'}, transparent)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude'
        }}
        animate={{
          opacity: isHovering ? 1 : 0
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}