import { useState, useEffect } from 'react'
import { 
  Home, 
  Users, 
  UserCheck, 
  DollarSign, 
  FileText, 
  Receipt,
  Clock,
  TrendingDown,
  ShoppingBag,
  Package,
  Clipboard,
  MapPin,
  ShoppingCart,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  Megaphone,
  Settings,
  Shield,
  User
} from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { useCentralizedSecurity, SecurityLevel } from './CentralizedSecurityManager'
import { toast } from 'sonner@2.0.3'
import { Animated3DIcon } from './Animated3DIcon'

interface ClinicSettings {
  name: string
  logo: string | null
  logoPath?: string
}

interface UniformSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  clinicSettings: ClinicSettings
  isOpen: boolean
  onToggle: () => void
  isMobile: boolean
}

interface MenuItem {
  id: string
  label: string
  icon: any
}

// SEMUA USER MELIHAT MENU YANG SAMA - TIDAK ADA FILTER BERDASARKAN USER
const ALL_MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'patients', label: 'Pasien', icon: Users },
  { id: 'forms', label: 'Formulir Medis', icon: FileCheck },
  { id: 'treatments', label: 'Tindakan & Fee', icon: Receipt },
  { id: 'medical-record-summary', label: 'Rekapan RM', icon: FileText },
  { id: 'products', label: 'Daftar Produk', icon: Package },
  { id: 'product-field-trip', label: 'Produk Field Trip', icon: MapPin },
  { id: 'field-trip-sales', label: 'Field Trip Sales', icon: ShoppingCart },
  { id: 'doctor-status', label: 'Karyawan & Dokter', icon: UserCheck },
  { id: 'attendance', label: 'Absensi', icon: Clock },
  { id: 'sitting-fees', label: 'Uang Duduk', icon: Clock },
  { id: 'sales', label: 'Penjualan', icon: ShoppingBag },
  { id: 'stock-opname', label: 'Stok Opname', icon: Clipboard },
  { id: 'promo', label: 'Manajemen Promo', icon: Megaphone },
  { id: 'expenses', label: 'Pengeluaran', icon: TrendingDown },
  { id: 'salaries', label: 'Gaji Karyawan', icon: DollarSign },
  { id: 'reports', label: 'Laporan', icon: FileText },
  { id: 'security-settings', label: 'Pengaturan Keamanan', icon: Settings }
]

export function UniformSidebar({ activeTab, onTabChange, onLogout, clinicSettings, isOpen, onToggle, isMobile }: UniformSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showLevelUpgrade, setShowLevelUpgrade] = useState(false)
  const [upgradePassword, setUpgradePassword] = useState('')
  const [targetLevel, setTargetLevel] = useState<SecurityLevel>(SecurityLevel.STAFF)
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  const { 
    currentLevel, 
    hasAccess, 
    getPageAccess, 
    upgradeLevel,
    resetToDefault,
    getLevelName, 
    getLevelIcon 
  } = useCentralizedSecurity()

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false)
    }
  }, [isMobile])

  const handleTabChange = (tab: string) => {
    const requiredLevel = getPageAccess(tab)
    if (hasAccess(requiredLevel)) {
      onTabChange(tab)
      if (isMobile) {
        onToggle()
      }
    } else {
      // Show upgrade dialog
      setTargetLevel(requiredLevel)
      setShowLevelUpgrade(true)
      toast.info(`Halaman ini memerlukan akses ${getLevelName(requiredLevel)}`)
    }
  }

  const handleLevelUpgrade = async (level: SecurityLevel) => {
    if (level === currentLevel) return

    if (level <= currentLevel) {
      // Can downgrade without password
      const success = await upgradeLevel(level)
      if (success) {
        toast.success(`Beralih ke ${getLevelName(level)}`)
      }
    } else {
      // Need password for upgrade
      setTargetLevel(level)
      setShowLevelUpgrade(true)
    }
  }

  const handlePasswordUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpgradeLoading(true)

    const success = await upgradeLevel(targetLevel, upgradePassword)
    
    if (success) {
      setShowLevelUpgrade(false)
      setUpgradePassword('')
    }
    
    setUpgradeLoading(false)
  }

  const handleLogoutAll = () => {
    resetToDefault()
    onLogout()
    toast.success('Logout berhasil')
  }

  const getLevelBadgeColor = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return 'bg-emerald-100 text-emerald-900 border-emerald-300'
      case SecurityLevel.STAFF: return 'bg-blue-100 text-blue-800 border-blue-200'
      case SecurityLevel.OWNER: return 'bg-purple-100 text-purple-800 border-purple-200'
      case SecurityLevel.SUPER_USER: return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const renderSecurityLevelIcon = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return <User className="h-4 w-4 text-emerald-700" />
      case SecurityLevel.STAFF: return <User className="h-4 w-4 text-blue-600" />
      case SecurityLevel.OWNER: return <Shield className="h-4 w-4 text-purple-600" />
      case SecurityLevel.SUPER_USER: return <Shield className="h-4 w-4 text-red-600" />
      default: return <User className="h-4 w-4" />
    }
  }

  // Mobile sidebar
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden sidebar-overlay"
            onClick={onToggle}
            aria-hidden="true"
          />
        )}
        
        {/* Mobile Sidebar */}
        <div className={`fixed left-0 top-0 h-full bg-white border-r border-pink-200 z-50 sidebar-transition w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:hidden flex flex-col shadow-xl`}>
          {/* Header */}
          <div className="p-4 border-b border-pink-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {clinicSettings.logo && (
                  <motion.div
                    initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: "easeOut",
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ 
                      rotate: 5, 
                      scale: 1.05,
                      transition: { duration: 0.3 }
                    }}
                  >
                    <ImageWithFallback
                      src={clinicSettings.logo}
                      alt="Logo Klinik"
                      className="h-8 w-8 object-contain rounded border border-pink-200"
                    />
                  </motion.div>
                )}
                <motion.div 
                  className="min-w-0 flex-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <h2 className="text-lg text-pink-800 truncate">{clinicSettings.name}</h2>
                  <p className="text-xs text-pink-600">Management System</p>
                </motion.div>
              </div>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="text-pink-600 hover:text-pink-800 hover:bg-pink-50 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>

            {/* Level Access Display */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    variant="ghost" 
                    className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg border-2 ${getLevelBadgeColor(currentLevel)} hover:shadow-md transition-all`}
                  >
                    {renderSecurityLevelIcon(currentLevel)}
                    <span className="text-sm font-medium flex-1 text-left">
                      {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
                    </span>
                    <motion.div
                      animate={{ rotate: 0 }}
                      whileHover={{ rotate: 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.div>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">Pilih Level Akses</p>
                  <p className="text-xs text-gray-500">Level saat ini: {getLevelName(currentLevel)}</p>
                </div>
                {[SecurityLevel.DOCTOR, SecurityLevel.STAFF, SecurityLevel.OWNER, SecurityLevel.SUPER_USER].map(level => (
                  <DropdownMenuItem
                    key={level}
                    onClick={() => handleLevelUpgrade(level)}
                    disabled={level === currentLevel}
                    className={`cursor-pointer px-3 py-2 ${level === currentLevel ? 'bg-gray-100' : ''}`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      {renderSecurityLevelIcon(level)}
                      <span className="flex-1">{getLevelIcon(level)} {getLevelName(level)}</span>
                      {level === currentLevel && (
                        <span className="text-xs text-gray-500">Aktif</span>
                      )}
                      {level > currentLevel && (
                        <span className="text-xs text-amber-600">Password</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogoutAll}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer px-3 py-2"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout Sistem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            <div className="space-y-1">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="px-3 py-2 text-xs font-medium uppercase tracking-wider border-b border-pink-300 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 shadow-sm rounded-md flex items-center gap-2"
              >
                <Animated3DIcon
                  icon={Shield}
                  isActive={true}
                  hasAccess={true}
                  className="text-pink-600"
                  size={12}
                />
                Semua Fitur Sistem
                <Badge variant="secondary" className="ml-auto text-xs bg-emerald-200 text-emerald-900">
                  Seragam
                </Badge>
              </motion.div>
              
              {ALL_MENU_ITEMS
                .filter((item) => {
                  // Filter berdasarkan level akses - hanya tampilkan yang bisa diakses
                  const requiredLevel = getPageAccess(item.id)
                  return hasAccess(requiredLevel)
                })
                .map((item, index) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                const requiredLevel = getPageAccess(item.id)
                const hasItemAccess = hasAccess(requiredLevel)

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.1 * index,
                      ease: "easeOut"
                    }}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full justify-start transition-all duration-300 px-3 ml-2 ${
                        isActive 
                          ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 border-r-4 border-pink-600 shadow-md font-medium transform scale-105' 
                          : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 hover:transform hover:scale-105'
                      }`}
                    >
                      <div className="mr-2">
                        <Animated3DIcon
                          icon={Icon}
                          isActive={isActive}
                          hasAccess={hasItemAccess}
                          className={isActive 
                            ? 'text-pink-600' 
                            : 'text-emerald-600'
                          }
                          size={16}
                        />
                      </div>
                      <span className={`transition-all flex-1 text-left ${isActive ? 'font-medium' : ''}`}>
                        {item.label}
                      </span>
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          </nav>
        </div>

        {/* Password Upgrade Dialog */}
        <Dialog open={showLevelUpgrade} onOpenChange={(open) => {
          setShowLevelUpgrade(open)
          if (!open) {
            setUpgradePassword('')
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Upgrade Level Akses
              </DialogTitle>
              <DialogDescription>
                Masukkan password untuk upgrade ke level {getLevelName(targetLevel)}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePasswordUpgrade} className="space-y-4">
              <div>
                <Label htmlFor="password">Password {getLevelName(targetLevel)}</Label>
                <Input
                  id="password"
                  type="password"
                  value={upgradePassword}
                  onChange={(e) => setUpgradePassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowLevelUpgrade(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={!upgradePassword.trim() || upgradeLoading}
                  className="flex-1"
                >
                  {upgradeLoading ? 'Verifikasi...' : 'Upgrade'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Desktop sidebar (similar structure)
  return (
    <div className={`hidden lg:flex bg-white border-r border-pink-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex-col`}>
      {/* Desktop content similar to mobile but adapted for desktop layout */}
      <div className="p-4 border-b border-pink-200">
        <div className="flex items-center justify-between mb-3">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {clinicSettings.logo && (
                <motion.div
                  initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeOut",
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    rotate: 5, 
                    scale: 1.05,
                    transition: { duration: 0.3 }
                  }}
                  className="flex-shrink-0"
                >
                  <ImageWithFallback
                    src={clinicSettings.logo}
                    alt="Logo Klinik"
                    className="h-8 w-8 object-contain rounded border border-pink-200"
                  />
                </motion.div>
              )}
              <motion.div 
                className="min-w-0 flex-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h2 className="text-lg text-pink-800 truncate">{clinicSettings.name}</h2>
                <p className="text-xs text-pink-600">Management System</p>
              </motion.div>
            </div>
          ) : (
            clinicSettings.logo && (
              <motion.div 
                className="flex justify-center w-full"
                whileHover={{ 
                  rotate: 360,
                  transition: { duration: 0.6 }
                }}
              >
                <ImageWithFallback
                  src={clinicSettings.logo}
                  alt="Logo Klinik"
                  className="h-8 w-8 object-contain rounded border border-pink-200"
                />
              </motion.div>
            )
          )}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-pink-600 hover:text-pink-800 hover:bg-pink-50 flex-shrink-0 ml-2"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </motion.div>
            </Button>
          </motion.div>
        </div>

        {/* Level Access Display - Desktop */}
        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="ghost" 
                  className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg border-2 ${getLevelBadgeColor(currentLevel)} hover:shadow-md transition-all`}
                >
                  {renderSecurityLevelIcon(currentLevel)}
                  <span className="text-sm font-medium flex-1 text-left">
                    {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
                  </span>
                  <motion.div
                    animate={{ rotate: 0 }}
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.div>
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">Pilih Level Akses</p>
                <p className="text-xs text-gray-500">Level saat ini: {getLevelName(currentLevel)}</p>
              </div>
              {[SecurityLevel.DOCTOR, SecurityLevel.STAFF, SecurityLevel.OWNER, SecurityLevel.SUPER_USER].map(level => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => handleLevelUpgrade(level)}
                  disabled={level === currentLevel}
                  className={`cursor-pointer px-3 py-2 ${level === currentLevel ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex items-center gap-2 w-full">
                    {renderSecurityLevelIcon(level)}
                    <span className="flex-1">{getLevelIcon(level)} {getLevelName(level)}</span>
                    {level === currentLevel && (
                      <span className="text-xs text-gray-500">Aktif</span>
                    )}
                    {level > currentLevel && (
                      <span className="text-xs text-amber-600">Password</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogoutAll}
                className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer px-3 py-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout Sistem
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Menu Items - Desktop */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {!isCollapsed ? (
          <div className="space-y-1">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="px-3 py-2 text-xs font-medium uppercase tracking-wider border-b border-pink-300 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 shadow-sm rounded-md flex items-center gap-2"
            >
              <Animated3DIcon
                icon={Shield}
                isActive={true}
                hasAccess={true}
                className="text-pink-600"
                size={12}
              />
              Semua Fitur Sistem
              <Badge variant="secondary" className="ml-auto text-xs bg-emerald-200 text-emerald-900">
                Seragam
              </Badge>
            </motion.div>
            
            {ALL_MENU_ITEMS
              .filter((item) => {
                // Filter berdasarkan level akses - hanya tampilkan yang bisa diakses  
                const requiredLevel = getPageAccess(item.id)
                return hasAccess(requiredLevel)
              })
              .map((item, index) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const requiredLevel = getPageAccess(item.id)
              const hasItemAccess = hasAccess(requiredLevel)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.1 * index,
                    ease: "easeOut"
                  }}
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full justify-start transition-all duration-300 px-3 ml-2 ${
                      isActive 
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 border-r-4 border-pink-600 shadow-md font-medium transform scale-105' 
                        : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 hover:transform hover:scale-105'
                    }`}
                  >
                    <div className="mr-2">
                      <Animated3DIcon
                        icon={Icon}
                        isActive={isActive}
                        hasAccess={hasItemAccess}
                        className={isActive 
                          ? 'text-pink-600' 
                          : 'text-emerald-600'
                        }
                        size={16}
                      />
                    </div>
                    <span className={`transition-all flex-1 text-left ${isActive ? 'font-medium' : ''}`}>
                      {item.label}
                    </span>
                  </Button>
                </motion.div>
              )
            })}
          </div>
        ) : (
          // Collapsed view - just icons
          <div className="space-y-1">
            {ALL_MENU_ITEMS.map((item, index) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const requiredLevel = getPageAccess(item.id)
              const hasItemAccess = hasAccess(requiredLevel)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.05 * index,
                    ease: "easeOut"
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full justify-center p-2 transition-all duration-300 ${
                      isActive 
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 shadow-md' 
                        : hasItemAccess
                          ? 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                          : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                    }`}
                    title={item.label}
                  >
                    <Animated3DIcon
                      icon={Icon}
                      isActive={isActive}
                      hasAccess={hasItemAccess}
                      className={isActive 
                        ? 'text-pink-600' 
                        : hasItemAccess 
                          ? 'text-emerald-600'
                          : 'text-gray-400'
                      }
                      size={20}
                    />
                  </Button>
                </motion.div>
              )
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <motion.div 
          className="p-3 border-t border-pink-200 bg-emerald-50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.p 
              className="text-xs text-emerald-800 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              ✅ Sistem Akses Seragam
            </motion.p>
            <motion.p 
              className="text-xs text-green-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              Semua user melihat menu yang sama
            </motion.p>
          </motion.div>
        </motion.div>
      )}

      {/* Password Upgrade Dialog */}
      <Dialog open={showLevelUpgrade} onOpenChange={(open) => {
        setShowLevelUpgrade(open)
        if (!open) {
          setUpgradePassword('')
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Upgrade Level Akses
            </DialogTitle>
            <DialogDescription>
              Masukkan password untuk upgrade ke level {getLevelName(targetLevel)}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordUpgrade} className="space-y-4">
            <div>
              <Label htmlFor="password">Password {getLevelName(targetLevel)}</Label>
              <Input
                id="password"
                type="password"
                value={upgradePassword}
                onChange={(e) => setUpgradePassword(e.target.value)}
                placeholder="Masukkan password..."
                className="mt-1"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowLevelUpgrade(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={!upgradePassword.trim() || upgradeLoading}
                className="flex-1"
              >
                {upgradeLoading ? 'Verifikasi...' : 'Upgrade'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}