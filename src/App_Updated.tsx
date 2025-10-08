import { useState, useEffect, useRef } from 'react'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner@2.0.3'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Auth } from './components/Auth'
import { SidebarV4 } from './components/SidebarV4'
import { Dashboard } from './components/Dashboard'
import { SecurityProvider, clearAllSecuritySessions } from './components/SecurityManagerV4'
import { PasswordGuardV4 } from './components/PasswordGuardV4'
import { SecuritySettingsPageV4 } from './components/SecuritySettingsPageV4'
import { LevelSwitcher } from './components/LevelSwitcher'
import { 
  LazyAttendance,
  LazySalaries,
  LazySittingFees,
  LazyTreatmentSystem,
  LazySales,
  LazyExpenses,
  LazyReports,
  LazyPatients,
  LazyForms,
  LazyProductList,
  LazyProductFieldTrip,
  LazyFieldTripSales,
  LazyStockOpname,
  LazyPromoManager,
  LazyMedicalRecordSummary,
  LazyDoctorStatusManager,
  LazyPasswordGuardSettings,
  preloadComponents
} from './components/LazyComponentLoader'

import { TimeoutRecovery } from './components/TimeoutRecovery'
import { PasswordGuard } from './components/PasswordGuard'
import { AuthDebugger } from './components/AuthDebugger'
import { ServerHealthChecker } from './components/ServerHealthChecker'
import { TimeoutManager, emergencyCleanup } from './utils/timeoutPrevention'

import { supabase, serverUrl, checkServerHealth } from './utils/supabase/client'
import { getAuthDebugInfo, getFreshSession, validateTokenWithServer } from './utils/authHelpers'
import { ImageWithFallback } from './components/figma/ImageWithFallback'
import { Menu, LogOut } from 'lucide-react'
import { Button } from './components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu'
import { useIsMobile } from './components/ui/use-mobile'
import clinicLogo from 'figma:asset/09e25dc7ebe8d0ded4144bacbb79bd5f5841d5a1.png'

interface User {
  id: string
  email: string
  user_metadata?: {
    name?: string
    role?: string
    position?: string
    userType?: string
  }
}

interface ClinicSettings {
  name: string
  logo: string | null
  logoPath?: string
  adminFee?: number
}

// Simplified loading fallback
const QuickLoader = ({ message = "Memuat..." }: { message?: string }) => (
  <div className="flex items-center justify-center p-6">
    <div className="text-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto mb-2"></div>
      <p className="text-pink-600 text-sm">{message}</p>
    </div>
  </div>
)

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string>('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>({
    name: 'Falasifah Dental Clinic',
    logo: clinicLogo,
    logoPath: undefined,
    adminFee: 20000
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [appFailed, setAppFailed] = useState(false)
  const [showTimeoutRecovery, setShowTimeoutRecovery] = useState(false)
  const [showAuthDebugger, setShowAuthDebugger] = useState(false)
  const isMobile = useIsMobile()
  const globalTimeoutRef = useRef<NodeJS.Timeout>()
  const emergencyTimeoutRef = useRef<NodeJS.Timeout>()

  // [Previous useEffect hooks and functions remain the same - not repeating for brevity]
  // ... All the existing logic from original App.tsx ...

  const handleLogout = async () => {
    try {
      // Clear all security sessions (both old and new system)
      if (user?.id) {
        try {
          const { clearPasswordAuth } = await import('./components/PasswordGuard')
          clearPasswordAuth() // Clear old system sessions
        } catch (error) {
          console.log('Old password system not available:', error)
        }
      }
      
      // Clear new security system sessions
      clearAllSecuritySessions()
      
      await supabase.auth.signOut()
      setUser(null)
      setAccessToken('')
      setActiveTab('dashboard')
      setSidebarOpen(false)
      
      toast.success('Logout berhasil - semua sesi keamanan dibersihkan')
    } catch (error) {
      // Handle logout error silently
      console.log('Logout error:', error)
    }
  }

  const renderActiveComponent = () => {
    if (!user || !accessToken) {
      // ... existing loading UI logic ...
      return <div>Loading...</div>
    }

    try {
      switch (activeTab) {
        case 'dashboard':
          return <Dashboard accessToken={accessToken} onNavigate={setActiveTab} />
        case 'doctor-status':
          return (
            <PasswordGuardV4 
              pageName="doctor-status"
              userId={user.id}
              userEmail={user.email}
            >
              <LazyDoctorStatusManager accessToken={accessToken} />
            </PasswordGuardV4>
          )
        case 'attendance':
          return <LazyAttendance accessToken={accessToken} />
        case 'salaries':
          return (
            <PasswordGuardV4 
              pageName="salaries"
              userId={user.id}
              userEmail={user.email}
            >
              <LazySalaries accessToken={accessToken} />
            </PasswordGuardV4>
          )
        case 'sitting-fees':
          return <LazySittingFees accessToken={accessToken} />
        case 'treatments':
          return (
            <LazyTreatmentSystem 
              accessToken={accessToken} 
              refreshTrigger={refreshTrigger} 
              adminFee={clinicSettings.adminFee || 20000}
              clinicSettings={clinicSettings}
              onRefreshNeeded={() => setRefreshTrigger(prev => prev + 1)}
              key={`treatments-${clinicSettings.adminFee}-${refreshTrigger}`}
            />
          )
        case 'sales':
          return <LazySales accessToken={accessToken} clinicSettings={clinicSettings} />
        case 'expenses':
          return <LazyExpenses accessToken={accessToken} />
        case 'reports':
          return (
            <PasswordGuardV4 
              pageName="reports"
              userId={user.id}
              userEmail={user.email}
            >
              <LazyReports accessToken={accessToken} />
            </PasswordGuardV4>
          )
        case 'patients':
          return <LazyPatients accessToken={accessToken} />
        case 'forms':
          return <LazyForms accessToken={accessToken} />
        case 'products':
          return <LazyProductList accessToken={accessToken} />
        case 'product-field-trip':
          return <LazyProductFieldTrip accessToken={accessToken} />
        case 'field-trip-sales':
          return <LazyFieldTripSales accessToken={accessToken} clinicSettings={clinicSettings} />
        case 'stock-opname':
          return <LazyStockOpname accessToken={accessToken} />
        case 'promo':
          return (
            <LazyPromoManager 
              accessToken={accessToken} 
              refreshTrigger={refreshTrigger}
              key={`promo-${refreshTrigger}`}
            />
          )
        case 'medical-record-summary':
          return <LazyMedicalRecordSummary accessToken={accessToken} />
        case 'security-settings':
          return (
            <PasswordGuardV4 
              pageName="security-settings"
              userId={user.id}
              userEmail={user.email}
            >
              <SecuritySettingsPageV4 userId={user.id} userEmail={user.email} />
            </PasswordGuardV4>
          )
        default:
          return <Dashboard accessToken={accessToken} />
      }
    } catch (error) {
      console.error('Error rendering component:', error)
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">Terjadi kesalahan</p>
            <div className="space-x-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 text-sm"
              >
                Dashboard
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  if (appFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="mt-4 text-red-600 text-lg font-medium">Aplikasi gagal dimuat</p>
          <p className="text-gray-600 text-sm mt-2">Terjadi timeout saat memuat aplikasi</p>
          <div className="mt-6 space-y-3">
            <button 
              onClick={() => {
                setAppFailed(false)
                setLoading(true)
                window.location.reload()
              }}
              className="block mx-auto bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 font-medium"
            >
              Muat Ulang Aplikasi
            </button>
            <button 
              onClick={() => {
                setAppFailed(false)
                setLoading(false)
              }}
              className="block mx-auto bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 font-medium"
            >
              Lanjutkan Tanpa Loading
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-pink-600 text-sm lg:text-base">Memuat aplikasi...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <SecurityProvider userId={undefined}>
          <div>
            <Auth onAuthSuccess={handleAuthSuccess} clinicSettings={clinicSettings} />
            <Toaster position="top-right" />
          </div>
        </SecurityProvider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <SecurityProvider userId={user.id}>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex">
          <SidebarV4 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
            onLogout={handleLogout}
            clinicSettings={clinicSettings}
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
            isMobile={isMobile}
          />
          
          <main className="flex-1 overflow-hidden w-full lg:w-auto">
            <div className="h-full overflow-y-auto">
              {/* Header */}
              <div className="bg-white border-b border-pink-200 px-4 lg:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleSidebar}
                        className="text-pink-600 hover:text-pink-800 hover:bg-pink-50 lg:hidden"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    )}
                    
                    {/* Logo with Logout - Hidden on mobile when sidebar button is present */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`p-1 hover:bg-pink-50 rounded-md ${isMobile ? 'hidden sm:block' : ''}`}
                          title="Klik untuk logout"
                        >
                          <ImageWithFallback
                            src={clinicSettings.logo}
                            alt="Logo Klinik"
                            className="h-10 lg:h-12 w-auto object-contain"
                            key={`${clinicSettings.logo}-${clinicSettings.logoPath}-${Date.now()}`}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem 
                          onClick={handleLogout}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg lg:text-2xl text-pink-800 truncate">
                        {activeTab === 'dashboard' && 'Dashboard'}
                        {activeTab === 'patients' && 'Manajemen Pasien'}
                        {activeTab === 'forms' && 'Formulir Medis'}
                        {activeTab === 'doctor-status' && 'Manajemen Karyawan & Dokter'}
                        {activeTab === 'products' && 'Daftar Produk'}
                        {activeTab === 'product-field-trip' && 'Produk Field Trip'}
                        {activeTab === 'field-trip-sales' && 'Penjualan Field Trip'}
                        {activeTab === 'stock-opname' && 'Stock Opname'}
                        {activeTab === 'promo' && 'Manajemen Promo'}
                        {activeTab === 'medical-record-summary' && 'Rekapan Rekam Medis'}
                        {activeTab === 'security-settings' && 'Pengaturan Keamanan'}

                        {activeTab === 'attendance' && 'Data Absensi'}
                        {activeTab === 'salaries' && 'Manajemen Gaji'}
                        {activeTab === 'sitting-fees' && 'Uang Duduk Dokter'}
                        {activeTab === 'treatments' && 'Tindakan'}
                        {activeTab === 'sales' && 'Manajemen Penjualan'}
                        {activeTab === 'expenses' && 'Pengeluaran Klinik'}
                        {activeTab === 'reports' && 'Laporan & Export'}
                      </h1>
                      <p className="text-pink-600 text-xs lg:text-sm hidden sm:block">
                        {clinicSettings.name} - {new Date().toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 lg:gap-4">
                    {/* Level Switcher */}
                    <LevelSwitcher variant="compact" className="hidden sm:block" />
                    
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-pink-800 truncate max-w-[150px] lg:max-w-none">
                        Selamat datang, {user.user_metadata?.name || user.email}
                      </p>
                      <p className="text-xs text-pink-600 hidden lg:block">
                        {user.user_metadata?.role || 'Administrator'}
                        {user.user_metadata?.position && ` - ${user.user_metadata.position}`}
                      </p>
                    </div>
                    <div className="h-8 w-8 lg:h-10 lg:w-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-pink-600 text-xs lg:text-sm font-medium">
                        {(user.user_metadata?.name || user.email)?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 lg:p-6">
                {renderActiveComponent()}
              </div>
            </div>
          </main>

          <Toaster position="top-right" />
          
          {/* Timeout Recovery Dialog */}
          {showTimeoutRecovery && (
            <TimeoutRecovery
              onRecovery={() => {
                setShowTimeoutRecovery(false)
                setLoading(false)
                setAppFailed(false)
              }}
              onForceReload={() => window.location.reload()}
            />
          )}
          
          {/* Auth Debugger Dialog */}
          {showAuthDebugger && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Authentication Debugger</h2>
                    <button
                      onClick={() => setShowAuthDebugger(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-6">
                  <AuthDebugger 
                    accessToken={accessToken}
                    onTokenUpdate={(token) => {
                      setAccessToken(token)
                      setShowAuthDebugger(false)
                    }}
                  />
                  
                  <ServerHealthChecker accessToken={accessToken} />
                </div>
              </div>
            </div>
          )}
        </div>
      </SecurityProvider>
    </ErrorBoundary>
  )
}