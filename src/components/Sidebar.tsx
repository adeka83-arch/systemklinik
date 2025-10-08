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
  Settings
} from 'lucide-react'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { getFilteredMenuItems } from './PermissionGuard'

interface ClinicSettings {
  name: string
  logo: string | null
  logoPath?: string
}

interface SidebarProps {
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

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'patients', label: 'Pasien', icon: Users },
  { id: 'forms', label: 'Formulir', icon: FileCheck },
  { id: 'medical-record-summary', label: 'Rekapan RM', icon: FileText },
  { id: 'doctor-status', label: 'Karyawan & Dokter', icon: UserCheck },
  { id: 'products', label: 'Daftar Produk', icon: Package },
  { id: 'product-field-trip', label: 'Produk Field Trip', icon: MapPin },
  { id: 'field-trip-sales', label: 'Penjualan Field Trip', icon: ShoppingCart },
  { id: 'stock-opname', label: 'Stok Opname', icon: Clipboard },
  { id: 'promo', label: 'Manajemen Promo', icon: Megaphone },

  { id: 'attendance', label: 'Absensi', icon: Clock },
  { id: 'salaries', label: 'Gaji Karyawan', icon: DollarSign },
  { id: 'sitting-fees', label: 'Uang Duduk', icon: Clock },
  { id: 'treatments', label: 'Tindakan & Fee', icon: Receipt },
  { id: 'sales', label: 'Penjualan', icon: ShoppingBag },
  { id: 'expenses', label: 'Pengeluaran', icon: TrendingDown },
  { id: 'reports', label: 'Laporan', icon: FileText },
  { id: 'security-settings', label: 'Keamanan', icon: Settings },
]

export function Sidebar({ activeTab, onTabChange, onLogout, clinicSettings, isOpen, onToggle, isMobile, userRole, userType }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Filter menu items based on user permissions
  const filteredMenuItems = getFilteredMenuItems(menuItems, userRole, userType)
  
  // Fallback: if filtering results in empty array, show default menu for employees
  const finalMenuItems = filteredMenuItems.length === 0 ? menuItems : filteredMenuItems

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false) // Always expanded when visible on mobile
    }
  }, [isMobile])



  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    // Auto-close sidebar on mobile after selecting
    if (isMobile) {
      onToggle()
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {clinicSettings.logo && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-1 hover:bg-pink-50 rounded-md"
                        title="Klik untuk logout"
                      >
                        <ImageWithFallback
                          src={clinicSettings.logo}
                          alt="Logo Klinik"
                          className="h-8 w-8 object-contain rounded border border-pink-200"
                          key={`sidebar-mobile-${clinicSettings.logo}-${clinicSettings.logoPath}-${clinicSettings.name}`}
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem 
                        onClick={onLogout}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
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
          </div>

          {/* Mobile Menu Items */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {finalMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full justify-start transition-colors px-3 ${
                    isActive 
                      ? 'bg-pink-100 text-pink-800 border-r-2 border-pink-600' 
                      : 'text-pink-600 hover:text-pink-800 hover:bg-pink-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span>{item.label}</span>
                </Button>
              )
            })}
          </nav>


        </div>
      </>
    )
  }

  // Desktop Sidebar
  return (
    <div className={`hidden lg:flex bg-white border-r border-pink-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex-col`}>
      {/* Desktop Header */}
      <div className="p-4 border-b border-pink-200">
        <div className="flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {clinicSettings.logo && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="p-1 hover:bg-pink-50 rounded-md"
                      title="Klik untuk logout"
                    >
                      <ImageWithFallback
                        src={clinicSettings.logo}
                        alt="Logo Klinik"
                        className="h-8 w-8 object-contain rounded border border-pink-200 flex-shrink-0"
                        key={`sidebar-expanded-${clinicSettings.logo}-${clinicSettings.logoPath}-${clinicSettings.name}`}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem 
                      onClick={onLogout}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
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
                      title="Klik untuk logout"
                    >
                      <ImageWithFallback
                        src={clinicSettings.logo}
                        alt="Logo Klinik"
                        className="h-8 w-8 object-contain rounded border border-pink-200"
                        key={`sidebar-collapsed-${clinicSettings.logo}-${clinicSettings.logoPath}-${clinicSettings.name}`}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem 
                      onClick={onLogout}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
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
      </div>

      {/* Desktop Menu Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {finalMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onTabChange(item.id)}
              className={`w-full justify-start transition-colors ${
                isActive 
                  ? 'bg-pink-100 text-pink-800 border-r-2 border-pink-600' 
                  : 'text-pink-600 hover:text-pink-800 hover:bg-pink-50'
              } ${isCollapsed ? 'px-2' : 'px-3'}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'} flex-shrink-0`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Button>
          )
        })}
      </nav>


    </div>
  )
}