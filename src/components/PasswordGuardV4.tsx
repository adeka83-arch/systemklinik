import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Lock, Eye, EyeOff, Shield, Crown, User } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { useSecurityManager, SecurityLevel } from './SecurityManagerV4'

interface PasswordGuardV4Props {
  children: React.ReactNode
  pageName: string
  userId?: string
  userEmail?: string
}

export function PasswordGuardV4({ children, pageName, userId, userEmail }: PasswordGuardV4Props) {
  const { 
    currentLevel, 
    hasAccess, 
    getPageAccess, 
    getLevelName, 
    getLevelIcon,
    switchLevel,
    logout
  } = useSecurityManager()
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [targetLevel, setTargetLevel] = useState<SecurityLevel>(SecurityLevel.DOCTOR)

  const requiredLevel = getPageAccess(pageName)
  const hasPageAccess = hasAccess(requiredLevel)

  useEffect(() => {
    if (!hasPageAccess) {
      // Need to upgrade access level
      setTargetLevel(requiredLevel)
      setShowPasswordDialog(true)
    } else {
      setShowPasswordDialog(false)
    }
  }, [hasPageAccess, requiredLevel])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const success = await switchLevel(targetLevel, password)
    
    if (success) {
      setShowPasswordDialog(false)
      setPassword('')
      setAttempts(0)
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      
      if (newAttempts >= 3) {
        toast.error('Terlalu banyak percobaan gagal', {
          description: 'Tunggu 30 detik sebelum mencoba lagi',
          duration: 5000
        })
        
        setTimeout(() => {
          setAttempts(0)
          setPassword('')
        }, 30000)
      }
      
      setPassword('')
    }
    
    setLoading(false)
  }

  const handleCloseDialog = () => {
    setPassword('')
    setAttempts(0)
    setShowPasswordDialog(false)
    // Don't change access level, just close dialog
  }

  const getIcon = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return <User className="h-5 w-5 text-green-600" />
      case SecurityLevel.STAFF: return <User className="h-5 w-5 text-blue-600" />
      case SecurityLevel.OWNER: return <Crown className="h-5 w-5 text-purple-600" />
      case SecurityLevel.SUPER_USER: return <Shield className="h-5 w-5 text-red-600" />
      default: return <User className="h-5 w-5" />
    }
  }

  const getLevelColor = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return 'text-green-600 border-green-200 bg-green-50'
      case SecurityLevel.STAFF: return 'text-blue-600 border-blue-200 bg-blue-50'
      case SecurityLevel.OWNER: return 'text-purple-600 border-purple-200 bg-purple-50'
      case SecurityLevel.SUPER_USER: return 'text-red-600 border-red-200 bg-red-50'
      default: return 'text-gray-600 border-gray-200 bg-gray-50'
    }
  }

  // If user has access, show content directly without security indicator
  if (hasPageAccess) {
    return <>{children}</>
  }

  // Show access denied or password dialog
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
              Upgrade Akses Diperlukan
            </DialogTitle>
            <DialogDescription>
              Halaman ini memerlukan level akses yang lebih tinggi untuk keamanan data sensitif.
            </DialogDescription>
          </DialogHeader>
          
          <Card className="border-pink-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-pink-700 flex items-center gap-2">
                {getIcon(targetLevel)}
                Akses {getLevelName(targetLevel)} Diperlukan
              </CardTitle>
              <CardDescription>
                Halaman "{pageName}" memerlukan minimal akses {getLevelName(targetLevel)}.
                <br />
                Akses saat ini: {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {targetLevel === SecurityLevel.DOCTOR ? (
                <div className="text-center">
                  <p className="text-green-600 mb-4">
                    Akses Dokter tidak memerlukan password
                  </p>
                  <Button
                    onClick={() => switchLevel(SecurityLevel.DOCTOR)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Beralih ke Akses Dokter
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-pink-700">
                      Password {getLevelName(targetLevel)}
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
                          Upgrade Akses
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              <div className="mt-4 pt-4 border-t border-pink-200">
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Level akses menentukan halaman yang dapat diakses</div>
                  <div>• Level tinggi dapat mengakses semua fitur level rendah</div>
                  <div>• Password berlaku untuk satu sesi login</div>
                  <div>• User: {userEmail || 'Tidak diketahui'}</div>
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
              <p className="text-pink-600 text-sm mb-4">
                Halaman ini memerlukan akses {getLevelName(requiredLevel)}
              </p>
              <div className="text-xs text-gray-600">
                Akses saat ini: {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}