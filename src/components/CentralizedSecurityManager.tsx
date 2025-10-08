import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner@2.0.3'

// Security Levels
export enum SecurityLevel {
  DOCTOR = 1,
  STAFF = 2, 
  OWNER = 3,
  SUPER_USER = 4
}

// Page Access Configuration (Server-Controlled)
interface PageAccessConfig {
  [pageName: string]: SecurityLevel
}

// Default configuration set by Super User
const DEFAULT_PAGE_ACCESS: PageAccessConfig = {
  // Level Dokter (Default untuk semua user)
  'dashboard': SecurityLevel.DOCTOR,
  'patients': SecurityLevel.DOCTOR,
  'forms': SecurityLevel.DOCTOR,
  'medical-record-summary': SecurityLevel.DOCTOR,
  'products': SecurityLevel.DOCTOR,
  
  // Level Staff
  'treatments': SecurityLevel.STAFF, // Tindakan & Fee memerlukan level Staff
  'product-field-trip': SecurityLevel.STAFF,
  'field-trip-sales': SecurityLevel.STAFF,
  'doctor-status': SecurityLevel.STAFF,
  'attendance': SecurityLevel.STAFF,
  'sitting-fees': SecurityLevel.STAFF,
  'sales': SecurityLevel.STAFF,
  'stock-opname': SecurityLevel.STAFF,
  'promo': SecurityLevel.STAFF,
  'expenses': SecurityLevel.STAFF,
  
  // Level Owner
  'salaries': SecurityLevel.OWNER,
  'reports': SecurityLevel.OWNER,
  
  // Level Super User
  'security-settings': SecurityLevel.SUPER_USER,
  'system-configuration': SecurityLevel.SUPER_USER,
  'backup-manager': SecurityLevel.SUPER_USER
}

// Password Configuration
const LEVEL_PASSWORDS: { [key in SecurityLevel]: string } = {
  [SecurityLevel.DOCTOR]: '', // No password needed
  [SecurityLevel.STAFF]: 'staff123',
  [SecurityLevel.OWNER]: 'owner456', 
  [SecurityLevel.SUPER_USER]: 'super789'
}

interface SecurityContextType {
  currentLevel: SecurityLevel
  pageAccessConfig: PageAccessConfig
  hasAccess: (requiredLevel: SecurityLevel) => boolean
  getPageAccess: (pageName: string) => SecurityLevel
  upgradeLevel: (targetLevel: SecurityLevel, password?: string) => Promise<boolean>
  resetToDefault: () => void
  getLevelName: (level: SecurityLevel) => string
  getLevelIcon: (level: SecurityLevel) => string
  isConfigAdmin: () => boolean
  updatePageAccess: (pageName: string, requiredLevel: SecurityLevel) => Promise<boolean>
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

interface SecurityProviderProps {
  children: ReactNode
  userId?: string
}

export function CentralizedSecurityProvider({ children, userId }: SecurityProviderProps) {
  // SEMUA USER MULAI DENGAN LEVEL DOKTER - TIDAK ADA PENGECUALIAN
  const [currentLevel, setCurrentLevel] = useState<SecurityLevel>(SecurityLevel.DOCTOR)
  const [pageAccessConfig, setPageAccessConfig] = useState<PageAccessConfig>(DEFAULT_PAGE_ACCESS)
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  // Utility functions (defined early)
  const getLevelName = (level: SecurityLevel): string => {
    switch (level) {
      case SecurityLevel.DOCTOR: return 'Dokter'
      case SecurityLevel.STAFF: return 'Staff'
      case SecurityLevel.OWNER: return 'Owner'
      case SecurityLevel.SUPER_USER: return 'Super User'
      default: return 'Unknown'
    }
  }

  const getLevelIcon = (level: SecurityLevel): string => {
    switch (level) {
      case SecurityLevel.DOCTOR: return '👨‍⚕️'
      case SecurityLevel.STAFF: return '👥'
      case SecurityLevel.OWNER: return '👑'
      case SecurityLevel.SUPER_USER: return '🔧'
      default: return '❓'
    }
  }

  // Load page access configuration from server (controlled by Super User)
  useEffect(() => {
    loadPageAccessConfig()
    
    // FORCE RESET: Semua user mulai dengan level dokter
    console.log('🔧 CENTRALIZED SECURITY: All users start with DOCTOR level access')
    setCurrentLevel(SecurityLevel.DOCTOR)
    setIsAuthenticated(true)
  }, [userId])

  const loadPageAccessConfig = async () => {
    try {
      // TODO: Load from server/database - for now use default
      // const response = await fetch('/api/page-access-config')
      // const config = await response.json()
      console.log('📋 Loading page access configuration from Super User settings')
      setPageAccessConfig(DEFAULT_PAGE_ACCESS)
      console.log('✅ Page access configuration loaded:', DEFAULT_PAGE_ACCESS)
    } catch (error) {
      console.log('⚠️ Failed to load page access config, using defaults')
      setPageAccessConfig(DEFAULT_PAGE_ACCESS)
    }
  }

  const hasAccess = (requiredLevel: SecurityLevel): boolean => {
    const access = currentLevel >= requiredLevel
    console.log(`🔒 Access Check: Current Level ${currentLevel} (${getLevelName(currentLevel)}) >= Required Level ${requiredLevel} (${getLevelName(requiredLevel)}) = ${access}`)
    return access
  }

  const getPageAccess = (pageName: string): SecurityLevel => {
    const level = pageAccessConfig[pageName] || SecurityLevel.DOCTOR
    console.log(`📋 Page Access: "${pageName}" requires level ${level} (${getLevelName(level)})`)
    return level
  }

  const upgradeLevel = async (targetLevel: SecurityLevel, password?: string): Promise<boolean> => {
    if (targetLevel <= currentLevel) {
      // Can downgrade without password
      setCurrentLevel(targetLevel)
      toast.success(`Beralih ke ${getLevelName(targetLevel)}`)
      return true
    }

    // Check password for upgrade
    const requiredPassword = LEVEL_PASSWORDS[targetLevel]
    if (password !== requiredPassword) {
      toast.error('Password salah!')
      return false
    }

    setCurrentLevel(targetLevel)
    toast.success(`Berhasil upgrade ke ${getLevelName(targetLevel)}`)
    return true
  }

  const resetToDefault = () => {
    setCurrentLevel(SecurityLevel.DOCTOR)
    console.log('🔄 Reset to default DOCTOR level access')
  }

  const isConfigAdmin = (): boolean => {
    return currentLevel >= SecurityLevel.SUPER_USER
  }

  const updatePageAccess = async (pageName: string, requiredLevel: SecurityLevel): Promise<boolean> => {
    if (!isConfigAdmin()) {
      toast.error('Hanya Super User yang dapat mengubah konfigurasi akses')
      return false
    }

    try {
      // TODO: Save to server/database
      // await fetch('/api/page-access-config', {
      //   method: 'PUT',
      //   body: JSON.stringify({ pageName, requiredLevel })
      // })

      setPageAccessConfig(prev => ({
        ...prev,
        [pageName]: requiredLevel
      }))

      toast.success(`Akses halaman ${pageName} diubah ke ${getLevelName(requiredLevel)}`)
      return true
    } catch (error) {
      toast.error('Gagal mengubah konfigurasi akses')
      return false
    }
  }

  const contextValue: SecurityContextType = {
    currentLevel,
    pageAccessConfig,
    hasAccess,
    getPageAccess, 
    upgradeLevel,
    resetToDefault,
    getLevelName,
    getLevelIcon,
    isConfigAdmin,
    updatePageAccess
  }

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  )
}

export function useCentralizedSecurity() {
  const context = useContext(SecurityContext)
  if (context === undefined) {
    throw new Error('useCentralizedSecurity must be used within a CentralizedSecurityProvider')
  }
  return context
}

// Utility function to clear all security sessions on logout
export function clearAllSecuritySessions() {
  // Clear any cached data
  console.log('🧹 Clearing all security sessions')
}