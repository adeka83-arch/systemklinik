import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Lock, Shield } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { useCentralizedSecurity, SecurityLevel } from './CentralizedSecurityManager'

interface CentralizedPasswordGuardProps {
  children: React.ReactNode
  pageName: string
}

export function CentralizedPasswordGuard({ children, pageName }: CentralizedPasswordGuardProps) {
  const { 
    currentLevel, 
    hasAccess, 
    getPageAccess, 
    upgradeLevel,
    getLevelName, 
    getLevelIcon
  } = useCentralizedSecurity()
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const requiredLevel = getPageAccess(pageName)
  const hasPageAccess = hasAccess(requiredLevel)

  useEffect(() => {
    if (!hasPageAccess) {
      setShowPasswordDialog(true)
    } else {
      setShowPasswordDialog(false)
    }
  }, [hasPageAccess, requiredLevel])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const success = await upgradeLevel(requiredLevel, password)
    
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
  }

  // If user has access, show content directly
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
                <Shield className="h-5 w-5" />
                Akses {getLevelName(requiredLevel)} Diperlukan
              </CardTitle>
              <CardDescription>
                Halaman "{pageName}" memerlukan minimal akses {getLevelName(requiredLevel)}.
                <br />
                Akses saat ini: {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-pink-700">
                    Password {getLevelName(requiredLevel)}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    className="border-pink-200 focus:border-pink-400"
                    disabled={loading || attempts >= 3}
                    autoFocus
                  />
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

              <div className="mt-4 pt-4 border-t border-pink-200">
                <div className="text-xs text-gray-600 space-y-1">
                  <div>• Level akses menentukan halaman yang dapat diakses</div>
                  <div>• Level tinggi dapat mengakses semua fitur level rendah</div>
                  <div>• Password berlaku untuk satu sesi login</div>
                  <div>• Sistem diatur terpusat oleh Super User</div>
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