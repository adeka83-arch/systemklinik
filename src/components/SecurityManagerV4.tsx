import { useState, useEffect, createContext, useContext } from 'react'
import { toast } from 'sonner@2.0.3'

// Level keamanan hierarkis
export enum SecurityLevel {
  DOCTOR = 0,      // Dokter - Tanpa password
  STAFF = 1,       // Kasir/Staff - Password level 1
  OWNER = 2,       // Owner - Password level 2
  SUPER_USER = 3   // Super User - Password level 3
}

export interface SecurityConfig {
  currentLevel: SecurityLevel
  passwords: {
    [SecurityLevel.STAFF]: string
    [SecurityLevel.OWNER]: string
    [SecurityLevel.SUPER_USER]: string
  }
  pageAccess: {
    [key: string]: SecurityLevel // halaman -> level minimum yang dibutuhkan
  }
  reportAccess: {
    [key: string]: SecurityLevel // laporan -> level minimum yang dibutuhkan
  }
  sessionConfig: {
    expiryMinutes: number
    requirePasswordPerSession: boolean
    autoLogoutEnabled: boolean
  }
  sidebarColors: {
    [SecurityLevel.DOCTOR]: string
    [SecurityLevel.STAFF]: string
    [SecurityLevel.OWNER]: string
    [SecurityLevel.SUPER_USER]: string
  }
}

// Default configuration with ALL pages accessible at DOCTOR level
const DEFAULT_CONFIG: SecurityConfig = {
  currentLevel: SecurityLevel.DOCTOR,
  passwords: {
    [SecurityLevel.STAFF]: 'staff123',
    [SecurityLevel.OWNER]: 'owner456',
    [SecurityLevel.SUPER_USER]: 'super789'
  },
  pageAccess: {
    'dashboard': SecurityLevel.DOCTOR,
    'patients': SecurityLevel.DOCTOR,
    'forms': SecurityLevel.DOCTOR,
    'medical-record-summary': SecurityLevel.DOCTOR,
    'treatments': SecurityLevel.DOCTOR,
    'products': SecurityLevel.DOCTOR,
    'product-field-trip': SecurityLevel.DOCTOR,
    'field-trip-sales': SecurityLevel.DOCTOR,
    'doctor-status': SecurityLevel.DOCTOR,
    'attendance': SecurityLevel.DOCTOR,
    'sitting-fees': SecurityLevel.DOCTOR,
    'sales': SecurityLevel.DOCTOR,
    'stock-opname': SecurityLevel.DOCTOR,
    'promo': SecurityLevel.DOCTOR,
    'expenses': SecurityLevel.DOCTOR,
    'salaries': SecurityLevel.DOCTOR,
    'reports': SecurityLevel.DOCTOR,
    'security-settings': SecurityLevel.DOCTOR
  },
  reportAccess: {
    'financial': SecurityLevel.DOCTOR,
    'doctor-fees': SecurityLevel.DOCTOR,
    'salary': SecurityLevel.DOCTOR,
    'attendance': SecurityLevel.DOCTOR,
    'treatment': SecurityLevel.DOCTOR,
    'patient': SecurityLevel.DOCTOR
  },
  sessionConfig: {
    expiryMinutes: 30,
    requirePasswordPerSession: true,
    autoLogoutEnabled: true
  },
  sidebarColors: {
    [SecurityLevel.DOCTOR]: 'text-green-600 hover:text-green-800 hover:bg-green-50',
    [SecurityLevel.STAFF]: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    [SecurityLevel.OWNER]: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50',
    [SecurityLevel.SUPER_USER]: 'text-red-600 hover:text-red-800 hover:bg-red-50'
  }
}

const STORAGE_KEY = 'falasifah_security_config_v4'
const SESSION_KEY_PREFIX = 'falasifah_security_session_'

interface SecurityContextType {
  config: SecurityConfig
  currentLevel: SecurityLevel
  isAuthenticated: boolean
  updateConfig: (newConfig: Partial<SecurityConfig>) => void
  authenticate: (level: SecurityLevel, password?: string) => Promise<boolean>
  switchLevel: (level: SecurityLevel, password?: string) => Promise<boolean>
  logout: () => void
  hasAccess: (requiredLevel: SecurityLevel) => boolean
  getPageAccess: (pageName: string) => SecurityLevel
  getReportAccess: (reportName: string) => SecurityLevel
  getSidebarColor: (level: SecurityLevel) => string
  getLevelName: (level: SecurityLevel) => string
  getLevelIcon: (level: SecurityLevel) => string
  isPasswordSet: (level: SecurityLevel) => boolean
  emergencyResetPasswords: () => void
}

const SecurityContext = createContext<SecurityContextType | null>(null)

export const useSecurityManager = () => {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurityManager must be used within SecurityProvider')
  }
  return context
}

interface SecurityProviderProps {
  children: React.ReactNode
  userId?: string
}

export function SecurityProvider({ children, userId }: SecurityProviderProps) {
  const [config, setConfig] = useState<SecurityConfig>(() => {
    // FORCE RESET: Always use new default config for consistent user experience
    console.log('🔧 Forcing security reset for consistent user access across all accounts')
    
    // Clear any existing configuration to ensure fresh start
    localStorage.removeItem(STORAGE_KEY)
    
    // Set the new configuration that gives all users doctor-level access to everything
    const freshConfig = { ...DEFAULT_CONFIG }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshConfig))
    
    console.log('✅ Security system reset - all users now have consistent doctor-level access')
    console.log('🎯 Pages accessible to all users:', Object.keys(freshConfig.pageAccess))
    
    return freshConfig
  })

  const [currentLevel, setCurrentLevel] = useState<SecurityLevel>(SecurityLevel.DOCTOR)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Initialize security system
  useEffect(() => {
    initializeSecurity()
  }, [userId])

  const initializeSecurity = () => {
    // FORCE RESET: Clear all existing sessions to ensure consistent start
    console.log('🔧 Clearing all security sessions for fresh start')
    
    // Clear all security sessions from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(SESSION_KEY_PREFIX)) {
        sessionStorage.removeItem(key)
        console.log('🗑️ Cleared session:', key)
      }
    })
    
    // ALWAYS start at doctor level for ALL users
    setCurrentLevel(SecurityLevel.DOCTOR)
    setIsAuthenticated(true)
    
    console.log('✅ All users initialized at DOCTOR level with full access')
    console.log('🎯 Users can upgrade to higher levels using passwords: staff123, owner456, super789')
  }

  const updateConfig = (newConfig: Partial<SecurityConfig>) => {
    const updatedConfig = { ...config, ...newConfig }
    setConfig(updatedConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig))
    toast.success('Konfigurasi keamanan berhasil diperbarui')
  }

  const authenticate = async (level: SecurityLevel, password?: string): Promise<boolean> => {
    // Doctor level doesn't need password
    if (level === SecurityLevel.DOCTOR) {
      setCurrentLevel(level)
      setIsAuthenticated(true)
      saveSession(level)
      toast.success(`Berhasil beralih ke akses ${getLevelName(level)}`)
      return true
    }

    // Check if password is set for this level
    const requiredPassword = config.passwords[level]
    if (!requiredPassword || requiredPassword.trim() === '') {
      toast.error(`Password untuk ${getLevelName(level)} belum diatur. Silakan atur password terlebih dahulu di Pengaturan Keamanan.`)
      return false
    }

    // Check password for other levels
    if (password !== requiredPassword) {
      toast.error('Password salah!')
      return false
    }

    setCurrentLevel(level)
    setIsAuthenticated(true)
    saveSession(level)
    toast.success(`Berhasil beralih ke akses ${getLevelName(level)}`)
    return true
  }

  const switchLevel = async (level: SecurityLevel, password?: string): Promise<boolean> => {
    // Check if current level can switch to target level
    if (currentLevel >= level) {
      // Higher or equal level can switch down without password
      setCurrentLevel(level)
      saveSession(level)
      toast.success(`Beralih ke akses ${getLevelName(level)}`)
      return true
    }

    // Need to authenticate for higher level
    return authenticate(level, password)
  }

  const logout = () => {
    setCurrentLevel(SecurityLevel.DOCTOR)
    setIsAuthenticated(true) // Still authenticated as doctor
    clearSession()
    toast.info('Kembali ke akses Dokter')
  }

  const saveSession = (level: SecurityLevel) => {
    if (config.sessionConfig.requirePasswordPerSession && level > SecurityLevel.DOCTOR) {
      const sessionKey = `${SESSION_KEY_PREFIX}${userId || 'default'}`
      const expiry = new Date()
      expiry.setMinutes(expiry.getMinutes() + config.sessionConfig.expiryMinutes)
      
      const session = {
        level,
        expiry: expiry.toISOString(),
        timestamp: new Date().toISOString()
      }
      
      sessionStorage.setItem(sessionKey, JSON.stringify(session))
    }
  }

  const clearSession = () => {
    const sessionKey = `${SESSION_KEY_PREFIX}${userId || 'default'}`
    sessionStorage.removeItem(sessionKey)
  }

  const hasAccess = (requiredLevel: SecurityLevel): boolean => {
    return currentLevel >= requiredLevel
  }

  const getPageAccess = (pageName: string): SecurityLevel => {
    return config.pageAccess[pageName] ?? SecurityLevel.DOCTOR
  }

  const getReportAccess = (reportName: string): SecurityLevel => {
    return config.reportAccess[reportName] ?? SecurityLevel.OWNER
  }

  const getSidebarColor = (level: SecurityLevel): string => {
    return config.sidebarColors[level] ?? config.sidebarColors[SecurityLevel.DOCTOR]
  }

  const getLevelName = (level: SecurityLevel): string => {
    switch (level) {
      case SecurityLevel.DOCTOR: return 'Dokter'
      case SecurityLevel.STAFF: return 'Kasir/Staff'
      case SecurityLevel.OWNER: return 'Owner'
      case SecurityLevel.SUPER_USER: return 'Super User'
      default: return 'Unknown'
    }
  }

  const getLevelIcon = (level: SecurityLevel): string => {
    switch (level) {
      case SecurityLevel.DOCTOR: return '👨‍⚕️'
      case SecurityLevel.STAFF: return '👩‍💼'
      case SecurityLevel.OWNER: return '👑'
      case SecurityLevel.SUPER_USER: return '🔧'
      default: return '👤'
    }
  }

  const isPasswordSet = (level: SecurityLevel): boolean => {
    if (level === SecurityLevel.DOCTOR) return true
    const password = config.passwords[level]
    return password && password.trim() !== ''
  }

  const emergencyResetPasswords = () => {
    const resetConfig = {
      ...config,
      passwords: {
        [SecurityLevel.STAFF]: 'staff123',
        [SecurityLevel.OWNER]: 'owner456',
        [SecurityLevel.SUPER_USER]: 'super789'
      }
    }
    setConfig(resetConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetConfig))
    toast.success('🚨 Emergency Reset: Password default telah dipulihkan (staff123, owner456, super789)')
    console.log('🚨 Emergency password reset completed')
  }

  const contextValue: SecurityContextType = {
    config,
    currentLevel,
    isAuthenticated,
    updateConfig,
    authenticate,
    switchLevel,
    logout,
    hasAccess,
    getPageAccess,
    getReportAccess,
    getSidebarColor,
    getLevelName,
    getLevelIcon,
    isPasswordSet,
    emergencyResetPasswords
  }

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  )
}

// Utility functions for external use
export const getSecurityConfig = (): SecurityConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsedConfig = JSON.parse(stored)
      return { ...DEFAULT_CONFIG, ...parsedConfig }
    }
  } catch (error) {
    console.error('Error loading security config:', error)
  }
  return DEFAULT_CONFIG
}

export const clearAllSecuritySessions = () => {
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith(SESSION_KEY_PREFIX)) {
      sessionStorage.removeItem(key)
    }
  })
  toast.info('Semua sesi keamanan telah dibersihkan')
}

// Force reset security system to ensure all users see the same interface
export const forceResetSecuritySystem = () => {
  // Clear localStorage configuration
  localStorage.removeItem(STORAGE_KEY)
  
  // Clear all sessions
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith(SESSION_KEY_PREFIX)) {
      sessionStorage.removeItem(key)
    }
  })
  
  // Set fresh configuration
  const freshConfig = { ...DEFAULT_CONFIG }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(freshConfig))
  
  console.log('🔧 Force reset completed - all users will now see consistent interface')
  console.log('✅ ALL pages now accessible at DOCTOR level')
  
  toast.success('Sistem keamanan direset - semua user akan melihat tampilan yang sama')
  
  // Reload page to apply changes
  setTimeout(() => {
    window.location.reload()
  }, 1000)
}