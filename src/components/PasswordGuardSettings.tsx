import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Eye, EyeOff, Shield, Lock, Settings, Save, RotateCcw, Info } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface PasswordGuardConfig {
  masterPassword: string
  expiryMinutes: number
  protectedPages: {
    [key: string]: {
      enabled: boolean
      displayName: string
      description: string
    }
  }
  authorizedRoles: string[]
  authorizedUserTypes: string[]
}

// Default configuration
const DEFAULT_CONFIG: PasswordGuardConfig = {
  masterPassword: 'Phantom83',
  expiryMinutes: 30,
  protectedPages: {
    'doctor-status': {
      enabled: true,
      displayName: 'Karyawan & Dokter',
      description: 'Halaman manajemen data karyawan dan dokter'
    },
    'salaries': {
      enabled: true,
      displayName: 'Gaji Karyawan',
      description: 'Halaman perhitungan dan manajemen gaji'
    },
    'reports': {
      enabled: true,
      displayName: 'Laporan & Export',
      description: 'Halaman laporan keuangan dan export data'
    },
    'security-settings': {
      enabled: true,
      displayName: 'Pengaturan Keamanan',
      description: 'Halaman konfigurasi sistem keamanan dan PasswordGuard'
    },
    'expenses': {
      enabled: false,
      displayName: 'Pengeluaran Klinik',
      description: 'Halaman manajemen pengeluaran operasional'
    },
    'treatments': {
      enabled: false,
      displayName: 'Sistem Tindakan',
      description: 'Halaman manajemen tindakan medis'
    },
    'sitting-fees': {
      enabled: false,
      displayName: 'Uang Duduk Dokter',
      description: 'Halaman perhitungan uang duduk dokter'
    },
    'patients': {
      enabled: false,
      displayName: 'Manajemen Pasien',
      description: 'Halaman data dan rekam medis pasien'
    },
    'sales': {
      enabled: false,
      displayName: 'Manajemen Penjualan',
      description: 'Halaman sistem penjualan dan transaksi'
    }
  },
  authorizedRoles: ['administrator', 'admin', 'owner', 'co-owner', 'manager'],
  authorizedUserTypes: ['employee', 'admin', 'owner']
}

const CONFIG_STORAGE_KEY = 'phantom_guard_config'

interface PasswordGuardSettingsProps {
  onConfigUpdate?: (config: PasswordGuardConfig) => void
}

export function PasswordGuardSettings({ onConfigUpdate }: PasswordGuardSettingsProps) {
  const [config, setConfig] = useState<PasswordGuardConfig>(DEFAULT_CONFIG)
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setSaving] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Load configuration from localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY)
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        setConfig({ ...DEFAULT_CONFIG, ...parsed })
      }
    } catch (error) {
      console.log('Error loading config, using defaults:', error)
    }
  }, [])

  // Save configuration to localStorage
  const saveConfig = (newConfig: PasswordGuardConfig) => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig))
      setConfig(newConfig)
      onConfigUpdate?.(newConfig)
      return true
    } catch (error) {
      console.error('Error saving config:', error)
      return false
    }
  }

  // Authenticate with current password
  const handleAuthenticate = () => {
    if (currentPassword === config.masterPassword) {
      setIsAuthenticated(true)
      setCurrentPassword('')
      toast.success('Autentikasi berhasil')
    } else {
      toast.error('Password salah!')
      setCurrentPassword('')
    }
  }

  // Handle password change
  const handlePasswordChange = () => {
    if (!newPassword.trim()) {
      toast.error('Password baru tidak boleh kosong')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Password konfirmasi tidak cocok')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    const updatedConfig = {
      ...config,
      masterPassword: newPassword
    }

    if (saveConfig(updatedConfig)) {
      toast.success('Password berhasil diubah')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      toast.error('Gagal menyimpan password baru')
    }
  }

  // Handle page protection toggle
  const handlePageToggle = (pageKey: string, enabled: boolean) => {
    const updatedConfig = {
      ...config,
      protectedPages: {
        ...config.protectedPages,
        [pageKey]: {
          ...config.protectedPages[pageKey],
          enabled
        }
      }
    }

    if (saveConfig(updatedConfig)) {
      toast.success(
        enabled 
          ? `Halaman ${config.protectedPages[pageKey].displayName} telah dikunci`
          : `Halaman ${config.protectedPages[pageKey].displayName} telah dibuka`
      )
    }
  }

  // Handle expiry minutes change
  const handleExpiryChange = (minutes: number) => {
    if (minutes < 1 || minutes > 480) { // Max 8 hours
      toast.error('Durasi sesi harus antara 1-480 menit')
      return
    }

    const updatedConfig = {
      ...config,
      expiryMinutes: minutes
    }

    if (saveConfig(updatedConfig)) {
      toast.success(`Durasi sesi diubah menjadi ${minutes} menit`)
    }
  }

  // Reset to default
  const handleReset = () => {
    if (saveConfig(DEFAULT_CONFIG)) {
      toast.success('Konfigurasi direset ke default')
      setIsAuthenticated(false)
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  // Get protected pages count
  const protectedPagesCount = Object.values(config.protectedPages).filter(page => page.enabled).length
  const totalPagesCount = Object.keys(config.protectedPages).length

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-800">
            <Shield className="h-5 w-5" />
            Pengaturan PasswordGuard
          </CardTitle>
          <CardDescription>
            Masukkan password master untuk mengakses pengaturan keamanan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Password Master Saat Ini</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password master..."
                className="pr-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAuthenticate()
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button 
            onClick={handleAuthenticate}
            disabled={!currentPassword.trim()}
            className="w-full bg-pink-600 hover:bg-pink-700"
          >
            <Lock className="h-4 w-4 mr-2" />
            Akses Pengaturan
          </Button>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Password default: <code className="bg-gray-100 px-1 rounded">Phantom83</code>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-800">
            <Settings className="h-5 w-5" />
            Pengaturan PasswordGuard
          </CardTitle>
          <CardDescription>
            Kelola password dan halaman yang dilindungi sistem keamanan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <Badge variant="outline" className="text-pink-600 border-pink-200">
              {protectedPagesCount} dari {totalPagesCount} halaman dikunci
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Sesi berlaku {config.expiryMinutes} menit
            </Badge>
            <Button
              onClick={() => setIsAuthenticated(false)}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              Keluar dari Pengaturan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pengaturan Password</CardTitle>
          <CardDescription>
            Ubah password master yang digunakan untuk mengakses halaman yang dilindungi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru..."
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry-minutes">Durasi Sesi (menit)</Label>
            <Input
              id="expiry-minutes"
              type="number"
              min="1"
              max="480"
              value={config.expiryMinutes}
              onChange={(e) => handleExpiryChange(parseInt(e.target.value) || 30)}
              className="w-32"
            />
            <p className="text-xs text-gray-600">
              Berapa lama user tetap memiliki akses setelah memasukkan password (1-480 menit)
            </p>
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Simpan Password Baru
          </Button>
        </CardContent>
      </Card>

      {/* Protected Pages Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Halaman yang Dilindungi</CardTitle>
          <CardDescription>
            Pilih halaman mana saja yang memerlukan password untuk diakses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(config.protectedPages).map(([pageKey, pageConfig]) => (
              <div key={pageKey} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{pageConfig.displayName}</h4>
                    {pageConfig.enabled && (
                      <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700">
                        Dikunci
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{pageConfig.description}</p>
                </div>
                <Switch
                  checked={pageConfig.enabled}
                  onCheckedChange={(enabled) => handlePageToggle(pageKey, enabled)}
                />
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Catatan:</strong> Perubahan akan berlaku segera. User yang sedang login akan diminta password 
              saat mengakses halaman yang baru dikunci.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pengaturan Lanjutan</CardTitle>
          <CardDescription>
            Konfigurasi role dan tipe user yang memiliki akses ke sistem keamanan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium">Role yang Diizinkan</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {config.authorizedRoles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Tipe User yang Diizinkan</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {config.authorizedUserTypes.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={handleReset}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset ke Pengaturan Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook untuk mendapatkan konfigurasi saat ini
export const usePasswordGuardConfig = (): PasswordGuardConfig => {
  const [config, setConfig] = useState<PasswordGuardConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY)
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        setConfig({ ...DEFAULT_CONFIG, ...parsed })
      }
    } catch (error) {
      console.log('Error loading config, using defaults:', error)
    }
  }, [])

  return config
}

// Utility function untuk mendapatkan konfigurasi
export const getPasswordGuardConfig = (): PasswordGuardConfig => {
  try {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      return { ...DEFAULT_CONFIG, ...parsed }
    }
  } catch (error) {
    console.log('Error loading config, using defaults:', error)
  }
  return DEFAULT_CONFIG
}

// Utility function untuk menyimpan konfigurasi
export const savePasswordGuardConfig = (config: PasswordGuardConfig): boolean => {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
    return true
  } catch (error) {
    console.error('Error saving config:', error)
    return false
  }
}