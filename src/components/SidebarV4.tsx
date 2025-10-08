import { useState, useEffect } from 'react'
import { 
  Home, 
  Users, 
  UserCheck, 
  DollarSign, 
  FileText, 
  Stethoscope,
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
  Crown,
  User,
  Building2,
  Calculator,
  Archive,
  BarChart3
} from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { useSecurityManager, SecurityLevel } from './SecurityManagerV4'
import { toast } from 'sonner@2.0.3'

interface ClinicSettings {
  name: string
  logo: string | null
  logoPath?: string
}

interface SidebarV4Props {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  clinicSettings: ClinicSettings
  isOpen: boolean
  onToggle: () => void
  isMobile: boolean
  userRole?: string
  userType?: string
}

interface MenuItem {
  id: string
  label: string
  icon: any
}

interface MenuLevelSection {
  level: SecurityLevel
  title: string
  icon: any
  items: MenuItem[]
}

// Group menu items by security level
const menuLevelSections: MenuLevelSection[] = [
  {
    level: SecurityLevel.DOCTOR,
    title: 'Akses Dokter',
    icon: User,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'patients', label: 'Pasien', icon: Users },
      { id: 'forms', label: 'Formulir Medis', icon: FileCheck },
      { id: 'treatments', label: 'Tindakan & Fee', icon: Receipt },
      { id: 'medical-record-summary', label: 'Rekapan RM', icon: FileText },
      { id: 'products', label: 'Daftar Produk', icon: Package }
    ]
  },
  {
    level: SecurityLevel.STAFF,
    title: 'Akses Kasir/Staff',
    icon: User,
    items: [
      { id: 'product-field-trip', label: 'Produk Field Trip', icon: MapPin },
      { id: 'field-trip-sales', label: 'Field Trip Sales', icon: ShoppingCart },
      { id: 'doctor-status', label: 'Karyawan & Dokter', icon: UserCheck },
      { id: 'attendance', label: 'Absensi', icon: Clock },
      { id: 'sitting-fees', label: 'Uang Duduk', icon: Clock },
      { id: 'sales', label: 'Penjualan', icon: ShoppingBag },
      { id: 'stock-opname', label: 'Stok Opname', icon: Clipboard },
      { id: 'promo', label: 'Manajemen Promo', icon: Megaphone },
      { id: 'expenses', label: 'Pengeluaran', icon: TrendingDown }
    ]
  },
  {
    level: SecurityLevel.OWNER,
    title: 'Akses Owner',
    icon: Crown,
    items: [
      { id: 'salaries', label: 'Gaji Karyawan', icon: DollarSign },
      { id: 'reports', label: 'Laporan', icon: FileText }
    ]
  },
  {
    level: SecurityLevel.SUPER_USER,
    title: 'Akses Super User',
    icon: Shield,
    items: [
      { id: 'security-settings', label: 'Pengaturan Keamanan', icon: Settings }
    ]
  }
]

// Flatten for backward compatibility
const menuItems = menuLevelSections.flatMap(section => section.items)

export function SidebarV4({ activeTab, onTabChange, onLogout, clinicSettings, isOpen, onToggle, isMobile }: SidebarV4Props) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showLevelSwitcher, setShowLevelSwitcher] = useState(false)
  const [switchPassword, setSwitchPassword] = useState('')
  const [targetLevel, setTargetLevel] = useState<SecurityLevel>(SecurityLevel.DOCTOR)
  const [switchLoading, setSwitchLoading] = useState(false)

  const { 
    currentLevel, 
    hasAccess, 
    getPageAccess, 
    getLevelName, 
    getLevelIcon,
    switchLevel,
    logout: securityLogout,
    getSidebarColor
  } = useSecurityManager()

  // Group menu items dynamically based on ACTUAL level access
  const getMenuItemsByActualLevelAccess = () => {
    // Get all menu items
    const allMenuItems = menuLevelSections.flatMap(section => section.items)
    
    // Create a map of level -> menu items based on ACTUAL page access
    const levelMenuMap: { [level: number]: MenuItem[] } = {
      [SecurityLevel.DOCTOR]: [],
      [SecurityLevel.STAFF]: [],
      [SecurityLevel.OWNER]: [],
      [SecurityLevel.SUPER_USER]: []
    }
    
    // Categorize menu items by their ACTUAL required level
    allMenuItems.forEach(item => {
      const requiredLevel = getPageAccess(item.id)
      if (hasAccess(requiredLevel)) {
        levelMenuMap[requiredLevel].push(item)
      }
    })
    
    // Create sections only for levels that have accessible items
    const organizedSections: MenuLevelSection[] = []
    
    // FIXED ORDER: Always show sections in the specified order regardless of current level
    const fixedLevelOrder = [SecurityLevel.DOCTOR, SecurityLevel.STAFF, SecurityLevel.OWNER, SecurityLevel.SUPER_USER]
    
    fixedLevelOrder.forEach(level => {
      if (levelMenuMap[level] && levelMenuMap[level].length > 0) {
        const sectionTitle = getSectionTitle(level)
        const sectionIcon = getSectionIcon(level)
        
        organizedSections.push({
          level,
          title: sectionTitle,
          icon: sectionIcon,
          items: levelMenuMap[level]
        })
      }
    })
    
    return organizedSections
  }
  
  // Helper functions for section titles and icons
  const getSectionTitle = (level: SecurityLevel): string => {
    switch (level) {
      case SecurityLevel.DOCTOR: return 'Akses Dokter'
      case SecurityLevel.STAFF: return 'Akses Kasir/Staff'
      case SecurityLevel.OWNER: return 'Akses Owner'
      case SecurityLevel.SUPER_USER: return 'Akses Super User'
      default: return 'Unknown'
    }
  }
  
  const getSectionIcon = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return User
      case SecurityLevel.STAFF: return User
      case SecurityLevel.OWNER: return Crown
      case SecurityLevel.SUPER_USER: return Shield
      default: return User
    }
  }

  const dynamicMenuSections = getMenuItemsByActualLevelAccess()
  
  // Debug menu organization
  useEffect(() => {
    console.log('🎛️ Menu sections organized:', dynamicMenuSections.map(section => ({
      level: section.level,
      title: section.title,
      items: section.items.map(item => item.label),
      isCurrentLevel: section.level === currentLevel
    })))
  }, [dynamicMenuSections, currentLevel])
  
  // Filter menu items based on current access level (for backward compatibility)
  const getFilteredMenuItems = () => {
    return menuItems.filter(item => hasAccess(getPageAccess(item.id)))
  }

  const filteredMenuItems = getFilteredMenuItems()

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false) // Always expanded when visible on mobile
    }
  }, [isMobile])

  // Force re-render when current level changes
  useEffect(() => {
    console.log('🔄 Current level changed to:', currentLevel, getLevelName(currentLevel))
    // This will trigger a re-render of the component and reorganize menus
  }, [currentLevel])

  const handleTabChange = (tab: string) => {
    const requiredLevel = getPageAccess(tab)
    if (hasAccess(requiredLevel)) {
      onTabChange(tab)
      // Auto-close sidebar on mobile after selecting
      if (isMobile) {
        onToggle()
      }
    } else {
      toast.error(`Akses ${getLevelName(requiredLevel)} diperlukan untuk halaman ini`)
    }
  }

  const handleLevelSwitch = async (level: SecurityLevel) => {
    if (level === currentLevel) {
      return
    }

    if (currentLevel >= level) {
      // Can switch down without password
      const success = await switchLevel(level)
      if (success) {
        toast.success(`Beralih ke ${getLevelName(level)}`)
      }
    } else {
      // Need password for higher level
      if (level === SecurityLevel.DOCTOR) {
        const success = await switchLevel(level)
        if (success) {
          toast.success(`Beralih ke ${getLevelName(level)}`)
        }
      } else {
        // Show password dialog
        setTargetLevel(level)
        setShowLevelSwitcher(true)
      }
    }
  }

  const handlePasswordSwitch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSwitchLoading(true)

    const success = await switchLevel(targetLevel, switchPassword)
    
    if (success) {
      setShowLevelSwitcher(false)
      setSwitchPassword('')
      setTargetLevel(SecurityLevel.DOCTOR)
      toast.success(`Berhasil upgrade ke ${getLevelName(targetLevel)}`)
    }
    
    setSwitchLoading(false)
  }

  const handleLogoutAll = () => {
    securityLogout() // Reset to doctor level
    onLogout() // Original logout function
  }

  const renderSecurityLevelIcon = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return <User className="h-4 w-4 text-green-600" />
      case SecurityLevel.STAFF: return <User className="h-4 w-4 text-blue-600" />
      case SecurityLevel.OWNER: return <Crown className="h-4 w-4 text-purple-600" />
      case SecurityLevel.SUPER_USER: return <Shield className="h-4 w-4 text-red-600" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getLevelBadgeColor = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return 'bg-green-100 text-green-800 border-green-200'
      case SecurityLevel.STAFF: return 'bg-blue-100 text-blue-800 border-blue-200'
      case SecurityLevel.OWNER: return 'bg-purple-100 text-purple-800 border-purple-200'
      case SecurityLevel.SUPER_USER: return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Mobile overlay
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
        } lg:hidden flex flex-col shadow-xl`}
        role="navigation"
        aria-label="Main navigation">
          {/* Mobile Header */}
          <div className="p-4 border-b border-pink-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {clinicSettings.logo && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-1 hover:bg-pink-50 rounded-md"
                        title="Menu aksi"
                      >
                        <ImageWithFallback
                          src={clinicSettings.logo}
                          alt="Logo Klinik"
                          className="h-8 w-8 object-contain rounded border border-pink-200"
                          key={`sidebar-mobile-${clinicSettings.logo}-${clinicSettings.logoPath}-${clinicSettings.name}`}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem 
                        onClick={() => setShowLevelSwitcher(true)}
                        className="cursor-pointer"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Ganti Level Akses
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLogoutAll}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout Sistem
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg text-pink-800 truncate">{clinicSettings.name}</h2>
                  <p className="text-xs text-pink-600">Management System</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-pink-600 hover:text-pink-800 hover:bg-pink-50 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Level Access Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg border-2 ${getLevelBadgeColor(currentLevel)} hover:shadow-md transition-all`}
                >
                  {renderSecurityLevelIcon(currentLevel)}
                  <span className="text-sm font-medium flex-1 text-left">
                    {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">Pilih Level Akses</p>
                  <p className="text-xs text-gray-500">Level saat ini: {getLevelName(currentLevel)}</p>
                </div>
                {[SecurityLevel.DOCTOR, SecurityLevel.STAFF, SecurityLevel.OWNER, SecurityLevel.SUPER_USER].map(level => (
                  <DropdownMenuItem
                    key={level}
                    onClick={() => handleLevelSwitch(level)}
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

          {/* Mobile Menu Items - Dynamic Organization */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {dynamicMenuSections.map((section) => {
              const isCurrentLevelSection = section.level === currentLevel
              const sectionColor = getSidebarColor(section.level)
              
              // Enhanced colors for current level section
              const enhancedSectionColor = isCurrentLevelSection 
                ? `${sectionColor} bg-gradient-to-r from-pink-50 to-purple-50 border-l-4 border-pink-500`
                : sectionColor

              return (
                <div key={section.level} className={`space-y-1 transition-all duration-300 ${isCurrentLevelSection ? 'p-1 rounded-lg bg-pink-25' : ''}`}>
                  {/* Section Header with Level Icon - Enhanced for current level */}
                  <div className={`px-3 py-2 text-xs font-medium uppercase tracking-wider border-b flex items-center gap-2 transition-all duration-300
                    ${isCurrentLevelSection 
                      ? 'border-pink-300 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 shadow-sm rounded-md' 
                      : 'border-gray-200 text-gray-600'
                    }`}>
                    <section.icon className={`h-3 w-3 transition-colors ${isCurrentLevelSection ? 'text-pink-600' : 'text-gray-500'}`} />
                    {section.title}
                    {isCurrentLevelSection && (
                      <Badge variant="secondary" className="ml-auto text-xs bg-pink-200 text-pink-800 animate-pulse">
                        Aktif
                      </Badge>
                    )}
                  </div>
                  
                  {/* Section Items - Enhanced styling based on level */}
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id
                    const itemRequiredLevel = getPageAccess(item.id)
                    const hasItemAccess = hasAccess(itemRequiredLevel)

                    return (
                      <Button
                        key={item.id}
                        variant="ghost"
                        onClick={() => handleTabChange(item.id)}
                        disabled={!hasItemAccess}
                        className={`w-full justify-start transition-all duration-300 px-3 ml-2 ${
                          isActive 
                            ? `bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 border-r-4 border-pink-600 shadow-md font-medium transform scale-105` 
                            : isCurrentLevelSection
                              ? `${enhancedSectionColor} hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:text-pink-800 hover:shadow-sm hover:border-r-2 hover:border-pink-400 hover:transform hover:scale-105`
                              : `${sectionColor} opacity-75 hover:opacity-100 hover:transform hover:scale-105`
                        }`}
                      >
                        <Icon className={`h-4 w-4 mr-2 transition-colors ${
                          isActive 
                            ? 'text-pink-600' 
                            : isCurrentLevelSection 
                              ? 'text-pink-500' 
                              : 'text-gray-500'
                        }`} />
                        <span className={`transition-all ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
                        {isCurrentLevelSection && !isActive && (
                          <div className="ml-auto w-2 h-2 bg-pink-400 rounded-full opacity-50 animate-pulse"></div>
                        )}
                      </Button>
                    )
                  })}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Password Input Dialog */}
        <Dialog open={showLevelSwitcher} onOpenChange={(open) => {
          setShowLevelSwitcher(open)
          if (!open) {
            setSwitchPassword('')
            setTargetLevel(SecurityLevel.DOCTOR)
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

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Upgrade dari: <Badge className={getLevelBadgeColor(currentLevel)}>
                  {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
                </Badge> → <Badge className={getLevelBadgeColor(targetLevel)}>
                  {getLevelIcon(targetLevel)} {getLevelName(targetLevel)}
                </Badge>
              </div>

              <form onSubmit={handlePasswordSwitch} className="space-y-4">
                <div>
                  <Label htmlFor="password">Password {getLevelName(targetLevel)}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={switchPassword}
                    onChange={(e) => setSwitchPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowLevelSwitcher(false)
                      setSwitchPassword('')
                    }}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!switchPassword.trim() || switchLoading}
                    className="flex-1"
                  >
                    {switchLoading ? 'Verifikasi...' : 'Upgrade'}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Desktop Sidebar
  return (
    <>
      <div className={`hidden lg:flex bg-white border-r border-pink-200 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } flex-col`}>
        {/* Desktop Header */}
        <div className="p-4 border-b border-pink-200">
          <div className="flex items-center justify-between mb-3">
            {!isCollapsed ? (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {clinicSettings.logo && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-1 hover:bg-pink-50 rounded-md"
                        title="Menu aksi"
                      >
                        <ImageWithFallback
                          src={clinicSettings.logo}
                          alt="Logo Klinik"
                          className="h-8 w-8 object-contain rounded border border-pink-200 flex-shrink-0"
                          key={`sidebar-expanded-${clinicSettings.logo}-${clinicSettings.logoPath}-${clinicSettings.name}`}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem 
                        onClick={() => setShowLevelSwitcher(true)}
                        className="cursor-pointer"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Ganti Level Akses
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLogoutAll}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout Sistem
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg text-pink-800 truncate">{clinicSettings.name}</h2>
                  <p className="text-xs text-pink-600">Management System</p>
                </div>
              </div>
            ) : (
              clinicSettings.logo && (
                <div className="flex justify-center w-full">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-1 hover:bg-pink-50 rounded-md"
                        title="Menu aksi"
                      >
                        <ImageWithFallback
                          src={clinicSettings.logo}
                          alt="Logo Klinik"
                          className="h-8 w-8 object-contain rounded border border-pink-200"
                          key={`sidebar-collapsed-${clinicSettings.logo}-${clinicSettings.logoPath}-${clinicSettings.name}`}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem 
                        onClick={() => setShowLevelSwitcher(true)}
                        className="cursor-pointer"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Ganti Level Akses
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleLogoutAll}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout Sistem
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-pink-600 hover:text-pink-800 hover:bg-pink-50 flex-shrink-0 ml-2"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Level Access Dropdown */}
          {!isCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`w-full flex items-center gap-2 px-3 py-3 rounded-lg border-2 ${getLevelBadgeColor(currentLevel)} hover:shadow-md transition-all`}
                >
                  {renderSecurityLevelIcon(currentLevel)}
                  <span className="text-sm font-medium flex-1 text-left">
                    {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium">Pilih Level Akses</p>
                  <p className="text-xs text-gray-500">Level saat ini: {getLevelName(currentLevel)}</p>
                </div>
                {[SecurityLevel.DOCTOR, SecurityLevel.STAFF, SecurityLevel.OWNER, SecurityLevel.SUPER_USER].map(level => (
                  <DropdownMenuItem
                    key={level}
                    onClick={() => handleLevelSwitch(level)}
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
          ) : (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`p-2 rounded-lg border-2 ${getLevelBadgeColor(currentLevel)} hover:shadow-md transition-all`}
                    title={`Level: ${getLevelName(currentLevel)}`}
                  >
                    {renderSecurityLevelIcon(currentLevel)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">Pilih Level Akses</p>
                    <p className="text-xs text-gray-500">Level saat ini: {getLevelName(currentLevel)}</p>
                  </div>
                  {[SecurityLevel.DOCTOR, SecurityLevel.STAFF, SecurityLevel.OWNER, SecurityLevel.SUPER_USER].map(level => (
                    <DropdownMenuItem
                      key={level}
                      onClick={() => handleLevelSwitch(level)}
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
          )}
        </div>

        {/* Desktop Menu Items - Dynamic Organization */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {dynamicMenuSections.map((section) => {
            const isCurrentLevelSection = section.level === currentLevel
            const sectionColor = getSidebarColor(section.level)
            
            // Enhanced colors for current level section
            const enhancedSectionColor = isCurrentLevelSection 
              ? `${sectionColor} bg-gradient-to-r from-pink-50 to-purple-50 border-l-4 border-pink-500`
              : sectionColor

            return (
              <div key={section.level} className={`space-y-1 transition-all duration-300 ${isCurrentLevelSection ? 'p-1 rounded-lg bg-pink-25' : ''}`}>
                {/* Section Header with Level Icon - Enhanced for current level */}
                {!isCollapsed && (
                  <div className={`px-3 py-2 text-xs font-medium uppercase tracking-wider border-b flex items-center gap-2 transition-all duration-300
                    ${isCurrentLevelSection 
                      ? 'border-pink-300 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 shadow-sm rounded-md' 
                      : 'border-gray-200 text-gray-600'
                    }`}>
                    <section.icon className={`h-3 w-3 transition-colors ${isCurrentLevelSection ? 'text-pink-600' : 'text-gray-500'}`} />
                    {section.title}
                    {isCurrentLevelSection && (
                      <Badge variant="secondary" className="ml-auto text-xs bg-pink-200 text-pink-800 animate-pulse">
                        Aktif
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Section Items - Enhanced styling based on level */}
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  const itemRequiredLevel = getPageAccess(item.id)
                  const hasItemAccess = hasAccess(itemRequiredLevel)

                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      onClick={() => handleTabChange(item.id)}
                      disabled={!hasItemAccess}
                      className={`w-full justify-start transition-all duration-300 px-3 ${isCollapsed ? '' : 'ml-2'} ${
                        isActive 
                          ? `bg-gradient-to-r from-pink-100 to-purple-100 text-pink-800 border-r-4 border-pink-600 shadow-md font-medium transform scale-105` 
                          : isCurrentLevelSection
                            ? `${enhancedSectionColor} hover:bg-gradient-to-r hover:from-pink-100 hover:to-purple-100 hover:text-pink-800 hover:shadow-sm hover:border-r-2 hover:border-pink-400 hover:transform hover:scale-105`
                            : `${sectionColor} opacity-75 hover:opacity-100 hover:transform hover:scale-105`
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'} transition-colors ${
                        isActive 
                          ? 'text-pink-600' 
                          : isCurrentLevelSection 
                            ? 'text-pink-500' 
                            : 'text-gray-500'
                      }`} />
                      {!isCollapsed && (
                        <>
                          <span className={`transition-all ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
                          {isCurrentLevelSection && !isActive && (
                            <div className="ml-auto w-2 h-2 bg-pink-400 rounded-full opacity-50 animate-pulse"></div>
                          )}
                        </>
                      )}
                    </Button>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Password Input Dialog */}
      <Dialog open={showLevelSwitcher} onOpenChange={(open) => {
        setShowLevelSwitcher(open)
        if (!open) {
          setSwitchPassword('')
          setTargetLevel(SecurityLevel.DOCTOR)
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

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Upgrade dari: <Badge className={getLevelBadgeColor(currentLevel)}>
                {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
              </Badge> → <Badge className={getLevelBadgeColor(targetLevel)}>
                {getLevelIcon(targetLevel)} {getLevelName(targetLevel)}
              </Badge>
            </div>

            <form onSubmit={handlePasswordSwitch} className="space-y-4">
              <div>
                <Label htmlFor="password">Password {getLevelName(targetLevel)}</Label>
                <Input
                  id="password"
                  type="password"
                  value={switchPassword}
                  onChange={(e) => setSwitchPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowLevelSwitcher(false)
                    setSwitchPassword('')
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={!switchPassword.trim() || switchLoading}
                  className="flex-1"
                >
                  {switchLoading ? 'Verifikasi...' : 'Upgrade'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}