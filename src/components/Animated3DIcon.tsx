import { motion } from 'motion/react'
import { LucideIcon } from 'lucide-react'

interface Animated3DIconProps {
  icon: LucideIcon
  isActive?: boolean
  hasAccess?: boolean
  className?: string
  size?: number
}

export function Animated3DIcon({ 
  icon: Icon, 
  isActive = false, 
  hasAccess = true, 
  className = "", 
  size = 16 
}: Animated3DIconProps) {
  // Base animation variants
  const iconVariants = {
    idle: {
      rotateY: 0,
      rotateX: 0,
      scale: 1,
      z: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      rotateY: hasAccess ? [0, 15, -10, 5, 0] : [0, 5, -5, 0],
      rotateX: hasAccess ? [0, -10, 5, -3, 0] : [0, -3, 3, 0],
      scale: hasAccess ? 1.15 : 1.05,
      z: hasAccess ? 20 : 5,
      transition: {
        duration: hasAccess ? 0.8 : 0.4,
        ease: "easeOut",
        rotateY: {
          duration: hasAccess ? 1.2 : 0.6,
          ease: "easeInOut"
        },
        rotateX: {
          duration: hasAccess ? 1.0 : 0.5,
          ease: "easeInOut"
        }
      }
    },
    active: {
      rotateY: [0, 20, -15, 10, -5, 0],
      rotateX: [0, -15, 10, -8, 3, 0],
      scale: [1, 1.2, 1.1, 1.15],
      z: 25,
      transition: {
        duration: 2.0,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse",
        repeatDelay: 1.5
      }
    },
    locked: {
      rotateY: [0, 5, -5, 0],
      rotateX: [0, -3, 3, 0],
      scale: [1, 0.95, 1],
      opacity: [0.5, 0.7, 0.5],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  }

  // Color animation variants
  const colorVariants = {
    idle: {
      filter: hasAccess 
        ? "hue-rotate(0deg) brightness(1) saturate(1)"
        : "hue-rotate(0deg) brightness(0.6) saturate(0.5)",
    },
    hover: {
      filter: hasAccess 
        ? "hue-rotate(15deg) brightness(1.2) saturate(1.3)"
        : "hue-rotate(30deg) brightness(0.8) saturate(0.8)",
    },
    active: {
      filter: [
        "hue-rotate(0deg) brightness(1.1) saturate(1.2)",
        "hue-rotate(10deg) brightness(1.3) saturate(1.4)",
        "hue-rotate(5deg) brightness(1.2) saturate(1.3)",
        "hue-rotate(0deg) brightness(1.1) saturate(1.2)"
      ],
      transition: {
        duration: 2.0,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    },
    locked: {
      filter: [
        "hue-rotate(0deg) brightness(0.6) saturate(0.5)",
        "hue-rotate(30deg) brightness(0.7) saturate(0.7)",
        "hue-rotate(0deg) brightness(0.6) saturate(0.5)"
      ],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  }

  // Glow effect variants
  const glowVariants = {
    idle: {
      boxShadow: isActive 
        ? "0 0 8px rgba(236, 72, 153, 0.4), 0 0 16px rgba(236, 72, 153, 0.2)"
        : hasAccess 
          ? "0 0 4px rgba(5, 150, 105, 0.3)"
          : "0 0 2px rgba(156, 163, 175, 0.2)",
    },
    hover: {
      boxShadow: isActive 
        ? "0 0 20px rgba(236, 72, 153, 0.8), 0 0 40px rgba(236, 72, 153, 0.4), 0 0 60px rgba(236, 72, 153, 0.2)"
        : hasAccess 
          ? "0 0 12px rgba(5, 150, 105, 0.7), 0 0 24px rgba(5, 150, 105, 0.4)"
          : "0 0 8px rgba(245, 158, 11, 0.5), 0 0 16px rgba(245, 158, 11, 0.2)",
    },
    active: {
      boxShadow: [
        "0 0 15px rgba(236, 72, 153, 0.6), 0 0 30px rgba(236, 72, 153, 0.3)",
        "0 0 25px rgba(236, 72, 153, 0.8), 0 0 50px rgba(236, 72, 153, 0.4), 0 0 75px rgba(236, 72, 153, 0.2)",
        "0 0 20px rgba(236, 72, 153, 0.7), 0 0 40px rgba(236, 72, 153, 0.35)"
      ],
      transition: {
        duration: 2.0,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    },
    locked: {
      boxShadow: [
        "0 0 4px rgba(156, 163, 175, 0.3)",
        "0 0 8px rgba(245, 158, 11, 0.4), 0 0 16px rgba(245, 158, 11, 0.2)",
        "0 0 4px rgba(156, 163, 175, 0.3)"
      ],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  }

  // Particle effect for active icons
  const particleVariants = {
    idle: { opacity: 0, scale: 0 },
    active: {
      opacity: [0, 1, 0],
      scale: [0, 1.2, 0],
      x: [0, 15, -15, 10, -10, 0],
      y: [0, -10, 5, -8, 3, 0],
      transition: {
        duration: 3.0,
        ease: "easeInOut",
        repeat: Infinity,
        repeatDelay: 0.5
      }
    }
  }

  const getAnimationState = () => {
    if (!hasAccess) return "locked"
    if (isActive) return "active"
    return "idle"
  }

  return (
    <div className="relative inline-block" style={{ perspective: "1000px" }}>
      {/* Main icon with 3D animation */}
      <motion.div
        className="relative"
        variants={iconVariants}
        initial="idle"
        animate={getAnimationState()}
        whileHover="hover"
        style={{ 
          transformStyle: "preserve-3d",
          transformOrigin: "center center"
        }}
      >
        {/* Glow background */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          variants={glowVariants}
          initial="idle"
          animate={getAnimationState()}
          whileHover="hover"
          style={{ 
            transform: "translateZ(-5px)",
            filter: "blur(4px)"
          }}
        />
        
        {/* Icon with color animation */}
        <motion.div
          variants={colorVariants}
          initial="idle"
          animate={getAnimationState()}
          whileHover="hover"
          className="relative z-10"
        >
          <Icon 
            size={size} 
            className={`${className} transition-all duration-300`}
            style={{ 
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
            }}
          />
        </motion.div>

        {/* Particle effects for active state */}
        {isActive && (
          <>
            <motion.div
              className="absolute top-0 right-0 w-1 h-1 bg-pink-400 rounded-full"
              variants={particleVariants}
              initial="idle"
              animate="active"
              style={{ transform: "translateZ(10px)" }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-0.5 h-0.5 bg-purple-400 rounded-full"
              variants={particleVariants}
              initial="idle"
              animate="active"
              style={{ 
                transform: "translateZ(15px)",
                animationDelay: "1s"
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-pink-300 rounded-full"
              variants={particleVariants}
              initial="idle"
              animate="active"
              style={{ 
                transform: "translateZ(8px) translate(-50%, -50%)",
                animationDelay: "2s"
              }}
            />
          </>
        )}
      </motion.div>

      {/* Floating animation for extra visual appeal */}
      {hasAccess && (
        <motion.div
          className="absolute inset-0"
          animate={{
            y: isActive ? [-1, 1, -1] : [0, -0.5, 0],
          }}
          transition={{
            duration: isActive ? 2.5 : 4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      )}
    </div>
  )
}