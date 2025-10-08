import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Lock, Eye, EyeOff, Shield } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { getPasswordGuardConfig } from './PasswordGuardSettings'

interface PasswordGuardProps {
  children: React.ReactNode
  pageName: string
  requiredPassword?: string
  userRole?: string
  userType?: string
  userId?: string
  userEmail?: string
}

const PASSWORD_SESSION_PREFIX = 'phantom_auth_user_'

// Generate user-specific session key
const getUserSessionKey = (userId: string, pageName: string) => {
  return `${PASSWORD_SESSION_PREFIX}${userId}_${pageName}`
}

export function PasswordGuard({ children, pageName, requiredPassword, userRole, userType, userId, userEmail }: PasswordGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [config, setConfig] = useState(getPasswordGuardConfig())

  // Update config when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setConfig(getPasswordGuardConfig())
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check for config changes periodically
    const interval = setInterval(() => {
      setConfig(getPasswordGuardConfig())
    }, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Check if page is protected based on dynamic config
  const isProtectedPage = config.protectedPages[pageName]?.enabled || false
  const pageDisplayName = config.protectedPages[pageName]?.displayName || pageName
  const actualPassword = requiredPassword || config.masterPassword
  const expiryMinutes = config.expiryMinutes

  // Check if user has permission to access protected pages
  const hasUserPermission = () => {
    const role = (userRole || '').toLowerCase()
    const type = (userType || '').toLowerCase()
    
    return config.authorizedRoles.includes(role) || config.authorizedUserTypes.includes(type)
  }

  useEffect(() => {
    if (!isProtectedPage) {
      setIsAuthenticated(true)
      return
    }

    // First check if user has permission
    if (!hasUserPermission()) {
      console.log('User does not have permission to access protected pages:', { userRole, userType })
      setIsAuthenticated(false)
      setShowPasswordDialog(false) // Don't show password dialog for unauthorized users
      return
    }

    // If no userId provided, require authentication
    if (!userId) {
      console.log('No user ID provided - requiring password authentication')
      setIsAuthenticated(false)
      setShowPasswordDialog(true)
      return
    }

    // Get user-specific session key
    const userSessionKey = getUserSessionKey(userId, pageName)
    
    // Check if this specific user has authenticated for this page
    const existingAuth = sessionStorage.getItem(userSessionKey)
    
    if (existingAuth) {
      try {
        const authData = JSON.parse(existingAuth)
        const expiryTime = new Date(authData.expiry)
        const now = new Date()
        
        // Check if session is still valid and belongs to current user
        if (now < expiryTime && authData.userId === userId && authData.userEmail === userEmail) {
          console.log('✅ Valid user-specific session found for:', userEmail, 'on page:', pageDisplayName)
          setIsAuthenticated(true)
          setShowPasswordDialog(false)
          return
        } else {
          console.log('🔒 Session expired or user mismatch - requiring new password')
          sessionStorage.removeItem(userSessionKey)
        }
      } catch (error) {
        console.log('🔒 Invalid session data - requiring new password')
        sessionStorage.removeItem(userSessionKey)
      }
    }

    // Always require password for this user on this page
    setIsAuthenticated(false)
    setShowPasswordDialog(true)
    
    console.log('🔐 Password required for user:', userEmail, 'on page:', pageDisplayName)
  }, [isProtectedPage, pageName, userRole, userType, userId, userEmail])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate a small delay for security appearance
    await new Promise(resolve => setTimeout(resolve, 500))

    if (password === actualPassword) {
      // Set temporary expiry time (for current session only)
      const expiryTime = new Date()
      expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes)

      // Store user-specific authentication
      const authData = {
        authenticated: true,
        expiry: expiryTime.toISOString(),
        timestamp: new Date().toISOString(),
        userId: userId || 'unknown',
        userEmail: userEmail || 'unknown',
        userRole: userRole || 'unknown',
        userType: userType || 'unknown',
        pageName: pageName
      }

      const userSessionKey = getUserSessionKey(userId || 'unknown', pageName)
      sessionStorage.setItem(userSessionKey, JSON.stringify(authData))
      
      setIsAuthenticated(true)
      setShowPasswordDialog(false)
      setPassword('')
      setAttempts(0)
      
      toast.success(`Akses berhasil ke ${pageDisplayName}`, {
        description: `Sesi berlaku ${expiryMinutes} menit untuk user: ${userEmail}`,
        duration: 3000
      })
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      
      toast.error('Password salah!', {
        description: `Percobaan ${newAttempts}/3`,
        duration: 2000
      })

      // Lock after 3 attempts
      if (newAttempts >= 3) {
        toast.error('Terlalu banyak percobaan gagal', {
          description: 'Silakan tunggu 30 detik sebelum mencoba lagi',
          duration: 5000
        })
        
        setTimeout(() => {
          setAttempts(0)
          setPassword('')
        }, 30000) // 30 second lockout
      }
      
      setPassword('')
    }
    
    setLoading(false)
  }

  const handleLogout = () => {
    // Clear user-specific session
    if (userId) {
      const userSessionKey = getUserSessionKey(userId, pageName)
      sessionStorage.removeItem(userSessionKey)
    }
    
    setIsAuthenticated(false)
    setShowPasswordDialog(true)
    setPassword('')
    setAttempts(0)
    toast.info('Sesi keamanan berakhir untuk user ini')
  }

  const handleCloseDialog = () => {
    // Clear password and close dialog
    setPassword('')
    setAttempts(0)
    setShowPasswordDialog(false)
    setIsAuthenticated(false)
    
    // Clear any partial session data
    if (userId) {
      const userSessionKey = getUserSessionKey(userId, pageName)
      sessionStorage.removeItem(userSessionKey)
    }
    
    toast.info('Dialog akses ditutup untuk user ini')
  }

  // Clear session when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      if (isProtectedPage && userId) {
        const userSessionKey = getUserSessionKey(userId, pageName)
        sessionStorage.removeItem(userSessionKey)
      }
    }
  }, [isProtectedPage, userId, pageName])

  // If not a protected page, render children directly
  if (!isProtectedPage) {
    return <>{children}</>
  }

  // If user doesn't have permission, show access denied
  if (!hasUserPermission()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="h-12 w-12 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg text-red-800 mb-2">Akses Ditolak</h3>
              <p className="text-red-600 text-sm mb-4">
                Anda tidak memiliki izin untuk mengakses halaman {pageDisplayName}
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Role Anda: {userRole || 'Tidak diketahui'}</div>
                <div>• Tipe User: {userType || 'Tidak diketahui'}</div>
                <div>• Hubungi administrator untuk mendapatkan akses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If authenticated, render children with logout option
  if (isAuthenticated) {
    return (
      <div className="relative">
        {/* Security indicator and logout button */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 shadow-sm">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-green-700 text-sm">Akses Aman</span>
            <button
              onClick={handleLogout}
              className="text-green-600 hover:text-green-800 text-xs underline ml-2"
              title="Keluar dari sesi aman"
            >
              Keluar
            </button>
          </div>
        </div>
        
        {children}
      </div>
    )
  }

  // Show password dialog
  return (
    <>
      <Dialog open={showPasswordDialog} onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog()
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-pink-800">
              <Lock className="h-5 w-5" />
              Akses Terbatas
            </DialogTitle>
            <DialogDescription>
              Halaman ini dilindungi dengan password khusus untuk keamanan sistem dan data sensitif klinik.
            </DialogDescription>
          </DialogHeader>
          
          <Card className="border-pink-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-pink-700">
                {pageDisplayName}
              </CardTitle>
              <CardDescription>
                Halaman ini memerlukan password khusus untuk mengakses fitur-fitur sensitif.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-pink-700">
                    Password Akses
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password..."
                      className="pr-10 border-pink-200 focus:border-pink-400"
                      disabled={loading || attempts >= 3}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {attempts > 0 && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                    Password salah! Percobaan: {attempts}/3
                    {attempts >= 3 && (
                      <div className="mt-1 text-xs">
                        Terlalu banyak percobaan. Tunggu 30 detik.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={loading}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !password.trim() || attempts >= 3}
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Memverifikasi...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Akses
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="mt-4 pt-4 border-t border-pink-200">
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Password diperlukan untuk setiap user secara individual</div>
                  <div>• Sesi password berlaku {expiryMinutes} menit per user</div>
                  <div>• User: {userEmail || 'Tidak diketahui'}</div>
                  <div>• Role: {userRole || 'Tidak diketahui'}</div>
                  <div>• Hubungi administrator jika lupa password</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Placeholder content while waiting for authentication */}
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="h-12 w-12 text-pink-300 mx-auto mb-4" />
              <h3 className="text-lg text-pink-800 mb-2">Akses Terbatas</h3>
              <p className="text-pink-600 text-sm">
                Masukkan password untuk mengakses {pageDisplayName}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Utility function to check if user is authenticated for protected pages
export const isPageAuthenticated = (pageName: string, userRole?: string, userType?: string): boolean => {
  const config = getPasswordGuardConfig()
  
  if (!config.protectedPages[pageName]?.enabled) {
    return true // Non-protected pages are always accessible
  }

  // Check user permission first
  const role = (userRole || '').toLowerCase()
  const type = (userType || '').toLowerCase()
  const hasPermission = config.authorizedRoles.includes(role) || config.authorizedUserTypes.includes(type)
  
  if (!hasPermission) {
    return false // User doesn't have permission
  }

  // Always return false for protected pages - password is required every time
  return false
}

// Utility function to clear authentication for specific user
export const clearPasswordAuth = (userId?: string, pageName?: string) => {
  if (userId && pageName) {
    const userSessionKey = getUserSessionKey(userId, pageName)
    sessionStorage.removeItem(userSessionKey)
  } else {
    // Clear all phantom auth sessions if no specific user provided
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(PASSWORD_SESSION_PREFIX)) {
        sessionStorage.removeItem(key)
      }
    })
  }
}