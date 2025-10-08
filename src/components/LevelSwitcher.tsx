import { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Shield, ChevronDown, User, Crown, Lock, AlertTriangle } from 'lucide-react'
import { useSecurityManager, SecurityLevel } from './SecurityManagerV4'
import { toast } from 'sonner@2.0.3'

interface LevelSwitcherProps {
  variant?: 'button' | 'badge' | 'compact'
  showCurrentLevel?: boolean
  className?: string
}

export function LevelSwitcher({ variant = 'button', showCurrentLevel = true, className = '' }: LevelSwitcherProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [targetLevel, setTargetLevel] = useState<SecurityLevel>(SecurityLevel.DOCTOR)
  const [loading, setLoading] = useState(false)

  const { 
    currentLevel, 
    switchLevel,
    logout,
    getLevelName, 
    getLevelIcon,
    isPasswordSet
  } = useSecurityManager()

  const handleLevelSelect = async (level: SecurityLevel) => {
    if (level === currentLevel) return

    if (currentLevel >= level) {
      // Can switch down without password
      const success = await switchLevel(level)
      if (success) {
        toast.success(`Beralih ke akses ${getLevelName(level)}`)
      }
    } else {
      // Need password for upgrade
      if (level === SecurityLevel.DOCTOR) {
        const success = await switchLevel(level)
        if (success) {
          toast.success(`Beralih ke akses ${getLevelName(level)}`)
        }
      } else {
        // Check if password is set before showing dialog
        if (!isPasswordSet(level)) {
          toast.error(`Password untuk ${getLevelName(level)} belum diatur. Silakan atur password terlebih dahulu di Pengaturan Keamanan.`)
          return
        }
        setTargetLevel(level)
        setShowDialog(true)
      }
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const success = await switchLevel(targetLevel, password)
    
    if (success) {
      setShowDialog(false)
      setPassword('')
      toast.success(`Berhasil upgrade ke akses ${getLevelName(targetLevel)}`)
    }
    
    setLoading(false)
  }

  const getLevelColor = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return 'bg-green-100 text-green-800 border-green-200'
      case SecurityLevel.STAFF: return 'bg-blue-100 text-blue-800 border-blue-200'
      case SecurityLevel.OWNER: return 'bg-purple-100 text-purple-800 border-purple-200'
      case SecurityLevel.SUPER_USER: return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLevelButtonColor = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return 'text-green-600 hover:text-green-800 hover:bg-green-50'
      case SecurityLevel.STAFF: return 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
      case SecurityLevel.OWNER: return 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
      case SecurityLevel.SUPER_USER: return 'text-red-600 hover:text-red-800 hover:bg-red-50'
      default: return 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
    }
  }

  const renderLevelIcon = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return <User className="h-4 w-4" />
      case SecurityLevel.STAFF: return <User className="h-4 w-4" />
      case SecurityLevel.OWNER: return <Crown className="h-4 w-4" />
      case SecurityLevel.SUPER_USER: return <Shield className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  if (variant === 'badge') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`${getLevelColor(currentLevel)} hover:opacity-80 ${className}`}
            >
              {renderLevelIcon(currentLevel)}
              <span className="ml-1">
                {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
              </span>
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1 text-xs text-gray-500">
              Ganti Level Akses
            </div>
            <DropdownMenuSeparator />
            {[SecurityLevel.DOCTOR, SecurityLevel.STAFF, SecurityLevel.OWNER, SecurityLevel.SUPER_USER].map(level => (
              <DropdownMenuItem
                key={level}
                onClick={() => handleLevelSelect(level)}
                disabled={level === currentLevel}
                className={`${getLevelButtonColor(level)} cursor-pointer`}
              >
                {renderLevelIcon(level)}
                <span className="ml-2">
                  {getLevelIcon(level)} {getLevelName(level)}
                </span>
                {level === currentLevel && (
                  <span className="ml-auto text-xs opacity-60">Aktif</span>
                )}
                {level > currentLevel && (
                  <>
                    {!isPasswordSet(level) && level !== SecurityLevel.DOCTOR && (
                      <AlertTriangle className="h-3 w-3 text-orange-500 ml-auto mr-1" title="Password belum diatur" />
                    )}
                    <Lock className="h-3 w-3 ml-auto opacity-60" />
                  </>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 cursor-pointer"
            >
              <User className="h-4 w-4 mr-2" />
              Reset ke Dokter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Password Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Upgrade Level Akses
              </DialogTitle>
              <DialogDescription>
                Masukkan password untuk upgrade ke {getLevelName(targetLevel)}
                {!isPasswordSet(targetLevel) && (
                  <span className="block mt-2 text-orange-600 text-sm">
                    ⚠️ Password untuk level ini belum diatur. Silakan atur di Pengaturan Keamanan.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Password {getLevelName(targetLevel)}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowDialog(false)
                    setPassword('')
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={!password.trim() || loading}
                  className="flex-1"
                >
                  {loading ? 'Verifikasi...' : 'Upgrade'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (variant === 'compact') {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`${className} p-2`}
              title={`Level akses: ${getLevelName(currentLevel)}`}
            >
              {renderLevelIcon(currentLevel)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1 text-xs text-gray-500">
              Level: {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
            </div>
            <DropdownMenuSeparator />
            {[SecurityLevel.DOCTOR, SecurityLevel.STAFF, SecurityLevel.OWNER, SecurityLevel.SUPER_USER].map(level => (
              <DropdownMenuItem
                key={level}
                onClick={() => handleLevelSelect(level)}
                disabled={level === currentLevel}
                className={`${getLevelButtonColor(level)} cursor-pointer`}
              >
                {renderLevelIcon(level)}
                <span className="ml-2">
                  {getLevelIcon(level)} {getLevelName(level)}
                </span>
                {level === currentLevel && (
                  <span className="ml-auto text-xs opacity-60">•</span>
                )}
                {level > currentLevel && (
                  <>
                    {!isPasswordSet(level) && level !== SecurityLevel.DOCTOR && (
                      <AlertTriangle className="h-3 w-3 text-orange-500 ml-auto mr-1" title="Password belum diatur" />
                    )}
                    <Lock className="h-3 w-3 ml-auto opacity-60" />
                  </>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Password Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upgrade Level Akses</DialogTitle>
              <DialogDescription>
                Masukkan password untuk {getLevelName(targetLevel)}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowDialog(false)
                    setPassword('')
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={!password.trim() || loading}
                  className="flex-1"
                >
                  {loading ? 'Verifikasi...' : 'OK'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Default button variant
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`${className}`}
          >
            {renderLevelIcon(currentLevel)}
            {showCurrentLevel && (
              <span className="ml-2">
                {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
              </span>
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1 text-xs text-gray-500">
            Ganti Level Akses
          </div>
          <DropdownMenuSeparator />
          {[SecurityLevel.DOCTOR, SecurityLevel.STAFF, SecurityLevel.OWNER, SecurityLevel.SUPER_USER].map(level => (
            <DropdownMenuItem
              key={level}
              onClick={() => handleLevelSelect(level)}
              disabled={level === currentLevel}
              className={`${getLevelButtonColor(level)} cursor-pointer`}
            >
              {renderLevelIcon(level)}
              <span className="ml-2">
                {getLevelIcon(level)} {getLevelName(level)}
              </span>
              {level === currentLevel && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Aktif
                </Badge>
              )}
              {level > currentLevel && (
                <>
                  {!isPasswordSet(level) && level !== SecurityLevel.DOCTOR && (
                    <AlertTriangle className="h-4 w-4 text-orange-500 ml-auto mr-1" title="Password belum diatur" />
                  )}
                  <Lock className="h-4 w-4 ml-auto opacity-60" />
                </>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 cursor-pointer"
          >
            <User className="h-4 w-4 mr-2" />
            Reset ke Dokter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Password Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Upgrade Level Akses
            </DialogTitle>
            <DialogDescription>
              Masukkan password untuk upgrade ke {getLevelName(targetLevel)}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Password {getLevelName(targetLevel)}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDialog(false)
                  setPassword('')
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={!password.trim() || loading}
                className="flex-1"
              >
                {loading ? 'Verifikasi...' : 'Upgrade'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}