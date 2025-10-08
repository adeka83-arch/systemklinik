import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { 
  Shield, 
  Lock, 
  Key, 
  Settings, 
  Clock, 
  Eye, 
  EyeOff, 
  User, 
  Crown, 
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { useSecurityManager, SecurityLevel, SecurityConfig } from './SecurityManagerV4'

interface SecuritySettingsPageV4Props {
  userId?: string
  userEmail?: string
}

export function SecuritySettingsPageV4({ userId, userEmail }: SecuritySettingsPageV4Props) {
  const { 
    config, 
    currentLevel, 
    updateConfig, 
    getLevelName, 
    getLevelIcon,
    hasAccess,
    isPasswordSet
  } = useSecurityManager()

  const [activeTab, setActiveTab] = useState('levels')
  const [localConfig, setLocalConfig] = useState<SecurityConfig>(config)
  const [showPasswords, setShowPasswords] = useState({
    [SecurityLevel.STAFF]: false,
    [SecurityLevel.OWNER]: false,
    [SecurityLevel.SUPER_USER]: false
  })
  const [hasChanges, setHasChanges] = useState(false)

  // Menu items with their default access levels
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'patients', name: 'Pasien', icon: '👥' },
    { id: 'forms', name: 'Formulir', icon: '📝' },
    { id: 'medical-record-summary', name: 'Rekapan RM', icon: '📋' },
    { id: 'doctor-status', name: 'Karyawan & Dokter', icon: '👨‍⚕️' },
    { id: 'products', name: 'Daftar Produk', icon: '📦' },
    { id: 'product-field-trip', name: 'Produk Field Trip', icon: '🎒' },
    { id: 'field-trip-sales', name: 'Penjualan Field Trip', icon: '🛒' },
    { id: 'stock-opname', name: 'Stok Opname', icon: '📊' },
    { id: 'promo', name: 'Manajemen Promo', icon: '📢' },
    { id: 'attendance', name: 'Absensi', icon: '⏰' },
    { id: 'salaries', name: 'Gaji Karyawan', icon: '💰' },
    { id: 'sitting-fees', name: 'Uang Duduk', icon: '💺' },
    { id: 'treatments', name: 'Tindakan & Fee', icon: '🩺' },
    { id: 'sales', name: 'Penjualan', icon: '🛍️' },
    { id: 'expenses', name: 'Pengeluaran', icon: '📉' },
    { id: 'reports', name: 'Laporan', icon: '📊' },
    { id: 'security-settings', name: 'Keamanan', icon: '🔒' }
  ]



  useEffect(() => {
    setLocalConfig(config)
    setHasChanges(false)
  }, [config])

  const handleConfigChange = (key: keyof SecurityConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handlePasswordChange = (level: SecurityLevel, password: string) => {
    setLocalConfig(prev => ({
      ...prev,
      passwords: { ...prev.passwords, [level]: password }
    }))
    setHasChanges(true)
  }

  const handlePageAccessChange = (pageId: string, level: SecurityLevel) => {
    setLocalConfig(prev => ({
      ...prev,
      pageAccess: { ...prev.pageAccess, [pageId]: level }
    }))
    setHasChanges(true)
  }



  const handleSaveConfig = () => {
    updateConfig(localConfig)
    setHasChanges(false)
    toast.success('Konfigurasi keamanan berhasil disimpan')
  }

  const handleResetConfig = () => {
    setLocalConfig(config)
    setHasChanges(false)
    toast.info('Perubahan dibatalkan')
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

  const togglePasswordVisibility = (level: SecurityLevel) => {
    setShowPasswords(prev => ({ ...prev, [level]: !prev[level] }))
  }

  // Generate secure password
  const generatePassword = (length: number = 12): string => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    const allChars = lowercase + uppercase + numbers + symbols
    let password = ''
    
    // Ensure at least one character from each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  // Get password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { text: 'Belum diisi', color: 'bg-gray-300' }
    
    const length = password.length
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    
    const criteriaMet = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length
    
    if (length < 6) return { text: 'Sangat Lemah', color: 'bg-red-400' }
    if (length < 8 || criteriaMet < 2) return { text: 'Lemah', color: 'bg-orange-400' }
    if (length < 10 || criteriaMet < 3) return { text: 'Sedang', color: 'bg-yellow-400' }
    if (length < 12 || criteriaMet < 4) return { text: 'Kuat', color: 'bg-blue-400' }
    return { text: 'Sangat Kuat', color: 'bg-green-400' }
  }

  // Handle generate password for specific level
  const handleGeneratePassword = (level: SecurityLevel) => {
    let length = 12
    switch (level) {
      case SecurityLevel.STAFF:
        length = 8
        break
      case SecurityLevel.OWNER:
        length = 10
        break
      case SecurityLevel.SUPER_USER:
        length = 14
        break
    }
    
    const newPassword = generatePassword(length)
    handlePasswordChange(level, newPassword)
    toast.success(`Password ${getLevelName(level)} berhasil di-generate`)
  }

  // Generate all passwords
  const handleGenerateAllPasswords = () => {
    const passwords = {
      [SecurityLevel.STAFF]: generatePassword(8),
      [SecurityLevel.OWNER]: generatePassword(10),
      [SecurityLevel.SUPER_USER]: generatePassword(14)
    }
    
    setLocalConfig(prev => ({
      ...prev,
      passwords: { ...prev.passwords, ...passwords }
    }))
    setHasChanges(true)
    toast.success('Semua password berhasil di-generate')
  }

  // Reset to default passwords
  const handleResetToDefaults = () => {
    const defaultPasswords = {
      [SecurityLevel.STAFF]: 'staff123',
      [SecurityLevel.OWNER]: 'owner456',
      [SecurityLevel.SUPER_USER]: 'super789'
    }
    
    setLocalConfig(prev => ({
      ...prev,
      passwords: { ...prev.passwords, ...defaultPasswords }
    }))
    setHasChanges(true)
    toast.info('Password direset ke default')
  }

  // Check if current user has super user access
  const canEditSecurity = hasAccess(SecurityLevel.SUPER_USER)

  if (!canEditSecurity) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg text-red-800 mb-2">Akses Ditolak</h3>
              <p className="text-red-600 text-sm mb-4">
                Hanya Super User yang dapat mengakses pengaturan keamanan
              </p>
              <p className="text-xs text-gray-600">
                Akses saat ini: {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-pink-800">Pengaturan Keamanan</h1>
          <p className="text-pink-600 text-sm">
            Kelola sistem keamanan hierarkis 4 level untuk klinik
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Ada perubahan
            </Badge>
          )}
          <Badge className={getLevelBadgeColor(currentLevel)}>
            {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">Anda memiliki perubahan yang belum disimpan</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetConfig}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Batal
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveConfig}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Simpan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Level Akses
          </TabsTrigger>
          <TabsTrigger value="passwords" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Password
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Akses Halaman
          </TabsTrigger>
          <TabsTrigger value="session" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Konfigurasi Sesi
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Level Akses */}
        <TabsContent value="levels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sistem Level Akses Hierarkis
              </CardTitle>
              <CardDescription>
                Sistem keamanan 4 level dengan hierarki akses. Level tinggi dapat mengakses semua fitur level rendah.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Level 0: Dokter */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800">Level 0 - Dokter</h3>
                      <p className="text-sm text-green-600">Akses dasar tanpa password</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    👨‍⚕️ Tanpa Password
                  </Badge>
                </div>
                <div className="text-sm text-green-700">
                  <p>• Akses ke fitur dasar klinik (pasien, tindakan, formulir)</p>
                  <p>• Tidak memerlukan password khusus</p>
                  <p>• Level akses default untuk semua pengguna</p>
                </div>
              </div>

              {/* Level 1: Staff */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-800">Level 1 - Kasir/Staff</h3>
                      <p className="text-sm text-blue-600">Akses operasional dengan password</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      👩‍💼 Password Level 1
                    </Badge>
                    <div className={`h-2 w-2 rounded-full ${isPasswordSet(SecurityLevel.STAFF) ? 'bg-green-400' : 'bg-red-400'}`} 
                         title={isPasswordSet(SecurityLevel.STAFF) ? 'Password sudah diatur' : 'Password belum diatur'}></div>
                  </div>
                </div>
                <div className="text-sm text-blue-700">
                  <p>• Akses semua fitur Dokter + manajemen stok, absensi</p>
                  <p>• Dapat mengelola data operasional harian</p>
                  <p>• Memerlukan password khusus untuk upgrade akses</p>
                </div>
              </div>

              {/* Level 2: Owner */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Crown className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-800">Level 2 - Owner</h3>
                      <p className="text-sm text-purple-600">Akses manajemen dengan password</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      👑 Password Level 2
                    </Badge>
                    <div className={`h-2 w-2 rounded-full ${isPasswordSet(SecurityLevel.OWNER) ? 'bg-green-400' : 'bg-red-400'}`} 
                         title={isPasswordSet(SecurityLevel.OWNER) ? 'Password sudah diatur' : 'Password belum diatur'}></div>
                  </div>
                </div>
                <div className="text-sm text-purple-700">
                  <p>• Akses semua fitur Staff + laporan keuangan, gaji</p>
                  <p>• Dapat melihat data finansial dan mengatur kompensasi</p>
                  <p>• Kontrol penuh atas operasional bisnis</p>
                </div>
              </div>

              {/* Level 3: Super User */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <Shield className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-red-800">Level 3 - Super User</h3>
                      <p className="text-sm text-red-600">Akses sistem dengan password</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      🔧 Password Level 3
                    </Badge>
                    <div className={`h-2 w-2 rounded-full ${isPasswordSet(SecurityLevel.SUPER_USER) ? 'bg-green-400' : 'bg-red-400'}`} 
                         title={isPasswordSet(SecurityLevel.SUPER_USER) ? 'Password sudah diatur' : 'Password belum diatur'}></div>
                  </div>
                </div>
                <div className="text-sm text-red-700">
                  <p>• Akses semua fitur Owner + pengaturan keamanan sistem</p>
                  <p>• Dapat mengatur level akses halaman dan password</p>
                  <p>• Kontrol penuh atas konfigurasi sistem keamanan</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Aturan Hierarki:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Level tinggi dapat mengakses semua fitur level rendah</p>
                  <p>• Super User dapat menurunkan akses tanpa password</p>
                  <p>• Upgrade akses memerlukan password sesuai level target</p>
                  <p>• Password berlaku untuk satu sesi login</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Status Password:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${isPasswordSet(SecurityLevel.STAFF) ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-blue-700">Staff: {isPasswordSet(SecurityLevel.STAFF) ? 'Sudah diatur' : 'Belum diatur'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${isPasswordSet(SecurityLevel.OWNER) ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-purple-700">Owner: {isPasswordSet(SecurityLevel.OWNER) ? 'Sudah diatur' : 'Belum diatur'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${isPasswordSet(SecurityLevel.SUPER_USER) ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-red-700">Super User: {isPasswordSet(SecurityLevel.SUPER_USER) ? 'Sudah diatur' : 'Belum diatur'}</span>
                  </div>
                </div>
                {(!isPasswordSet(SecurityLevel.STAFF) || !isPasswordSet(SecurityLevel.OWNER) || !isPasswordSet(SecurityLevel.SUPER_USER)) && (
                  <div className="mt-3 text-xs text-orange-600">
                    ⚠️ Ada level yang belum memiliki password. Silakan atur di tab "Password" untuk mengaktifkan level tersebut.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Password Settings */}
        <TabsContent value="passwords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Pengaturan Password Level Akses
              </CardTitle>
              <CardDescription>
                Atur password untuk setiap level akses. Password diperlukan untuk upgrade ke level yang lebih tinggi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Staff Password */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-blue-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Password Level 1 - Kasir/Staff
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePassword(SecurityLevel.STAFF)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showPasswords[SecurityLevel.STAFF] ? 'text' : 'password'}
                    value={localConfig.passwords[SecurityLevel.STAFF]}
                    onChange={(e) => handlePasswordChange(SecurityLevel.STAFF, e.target.value)}
                    placeholder="Masukkan password untuk level Staff..."
                    className="pr-10 border-blue-200 focus:border-blue-400"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(SecurityLevel.STAFF)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords[SecurityLevel.STAFF] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getPasswordStrength(localConfig.passwords[SecurityLevel.STAFF]).color}`}></div>
                  <span className="text-xs text-gray-600">
                    Kekuatan: {getPasswordStrength(localConfig.passwords[SecurityLevel.STAFF]).text}
                    {localConfig.passwords[SecurityLevel.STAFF].length > 0 && ` (${localConfig.passwords[SecurityLevel.STAFF].length} karakter)`}
                  </span>
                </div>
                <p className="text-xs text-blue-600">
                  Password ini diperlukan untuk upgrade dari Dokter ke Staff
                </p>
              </div>

              <Separator />

              {/* Owner Password */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-purple-700 flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Password Level 2 - Owner
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePassword(SecurityLevel.OWNER)}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showPasswords[SecurityLevel.OWNER] ? 'text' : 'password'}
                    value={localConfig.passwords[SecurityLevel.OWNER]}
                    onChange={(e) => handlePasswordChange(SecurityLevel.OWNER, e.target.value)}
                    placeholder="Masukkan password untuk level Owner..."
                    className="pr-10 border-purple-200 focus:border-purple-400"
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(SecurityLevel.OWNER)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords[SecurityLevel.OWNER] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getPasswordStrength(localConfig.passwords[SecurityLevel.OWNER]).color}`}></div>
                  <span className="text-xs text-gray-600">
                    Kekuatan: {getPasswordStrength(localConfig.passwords[SecurityLevel.OWNER]).text}
                    {localConfig.passwords[SecurityLevel.OWNER].length > 0 && ` (${localConfig.passwords[SecurityLevel.OWNER].length} karakter)`}
                  </span>
                </div>
                <p className="text-xs text-purple-600">
                  Password ini diperlukan untuk upgrade dari Staff/Dokter ke Owner
                </p>
              </div>

              <Separator />

              {/* Super User Password */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-red-700 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Password Level 3 - Super User
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePassword(SecurityLevel.SUPER_USER)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showPasswords[SecurityLevel.SUPER_USER] ? 'text' : 'password'}
                    value={localConfig.passwords[SecurityLevel.SUPER_USER]}
                    onChange={(e) => handlePasswordChange(SecurityLevel.SUPER_USER, e.target.value)}
                    placeholder="Masukkan password untuk level Super User..."
                    className="pr-10 border-red-200 focus:border-red-400"
                    minLength={10}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility(SecurityLevel.SUPER_USER)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords[SecurityLevel.SUPER_USER] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getPasswordStrength(localConfig.passwords[SecurityLevel.SUPER_USER]).color}`}></div>
                  <span className="text-xs text-gray-600">
                    Kekuatan: {getPasswordStrength(localConfig.passwords[SecurityLevel.SUPER_USER]).text}
                    {localConfig.passwords[SecurityLevel.SUPER_USER].length > 0 && ` (${localConfig.passwords[SecurityLevel.SUPER_USER].length} karakter)`}
                  </span>
                </div>
                <p className="text-xs text-red-600">
                  Password ini diperlukan untuk upgrade ke level Super User
                </p>
              </div>

              <Separator />

              {/* Password Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateAllPasswords}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate Semua Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetToDefaults}
                  className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Reset ke Default
                </Button>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-800">Tips Keamanan Password:</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>• Minimal 6 karakter untuk Staff, 8 untuk Owner, 10 untuk Super User</p>
                      <p>• Gunakan kombinasi huruf besar, kecil, angka, dan simbol</p>
                      <p>• Hindari kata-kata umum atau informasi personal</p>
                      <p>• Ganti password secara berkala untuk keamanan optimal</p>
                      <p>• Gunakan fitur "Generate" untuk password yang aman</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Persyaratan Password:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-medium text-blue-700">Level 1 - Staff:</p>
                    <div className="space-y-1 text-blue-600">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${localConfig.passwords[SecurityLevel.STAFF].length >= 6 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                        <span>Minimal 6 karakter</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-purple-700">Level 2 - Owner:</p>
                    <div className="space-y-1 text-purple-600">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${localConfig.passwords[SecurityLevel.OWNER].length >= 8 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                        <span>Minimal 8 karakter</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-red-700">Level 3 - Super User:</p>
                    <div className="space-y-1 text-red-600">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${localConfig.passwords[SecurityLevel.SUPER_USER].length >= 10 ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                        <span>Minimal 10 karakter</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Page Access */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Pengaturan Akses Halaman Sidebar
              </CardTitle>
              <CardDescription>
                Tentukan level akses minimum untuk setiap halaman. Sidebar akan menampilkan menu sesuai level akses dengan warna yang berbeda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">ID: {item.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={localConfig.pageAccess[item.id]?.toString() || '0'}
                        onValueChange={(value) => handlePageAccessChange(item.id, parseInt(value) as SecurityLevel)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">👨‍⚕️ Dokter</SelectItem>
                          <SelectItem value="1">👩‍💼 Staff</SelectItem>
                          <SelectItem value="2">👑 Owner</SelectItem>
                          <SelectItem value="3">🔧 Super User</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge className={getLevelBadgeColor(localConfig.pageAccess[item.id] || SecurityLevel.DOCTOR)}>
                        {getLevelName(localConfig.pageAccess[item.id] || SecurityLevel.DOCTOR)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Color Coding Sidebar:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-200 rounded"></div>
                    <span className="text-green-700">👨‍⚕️ Level Dokter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-200 rounded"></div>
                    <span className="text-blue-700">👩‍💼 Level Staff</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-200 rounded"></div>
                    <span className="text-purple-700">👑 Level Owner</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-200 rounded"></div>
                    <span className="text-red-700">🔧 Level Super User</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        {/* Tab 4: Session Configuration */}
        <TabsContent value="session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Konfigurasi Sesi Keamanan
              </CardTitle>
              <CardDescription>
                Atur durasi sesi, timeout otomatis, dan pengaturan keamanan lainnya.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Session Duration */}
              <div className="space-y-3">
                <Label>Durasi Sesi (Menit)</Label>
                <Select
                  value={localConfig.sessionConfig.expiryMinutes.toString()}
                  onValueChange={(value) => handleConfigChange('sessionConfig', {
                    ...localConfig.sessionConfig,
                    expiryMinutes: parseInt(value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 menit</SelectItem>
                    <SelectItem value="30">30 menit</SelectItem>
                    <SelectItem value="60">1 jam</SelectItem>
                    <SelectItem value="120">2 jam</SelectItem>
                    <SelectItem value="240">4 jam</SelectItem>
                    <SelectItem value="480">8 jam</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600">
                  Durasi password akses berlaku sebelum memerlukan input ulang
                </p>
              </div>

              <Separator />

              {/* Password Per Session */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Password Sekali Per Sesi</Label>
                  <p className="text-sm text-gray-600">
                    Jika diaktifkan, password hanya perlu dimasukkan sekali per sesi login
                  </p>
                </div>
                <Switch
                  checked={localConfig.sessionConfig.requirePasswordPerSession}
                  onCheckedChange={(checked) => handleConfigChange('sessionConfig', {
                    ...localConfig.sessionConfig,
                    requirePasswordPerSession: checked
                  })}
                />
              </div>

              <Separator />

              {/* Auto Logout */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto Logout</Label>
                  <p className="text-sm text-gray-600">
                    Otomatis logout ke level Dokter saat sesi berakhir
                  </p>
                </div>
                <Switch
                  checked={localConfig.sessionConfig.autoLogoutEnabled}
                  onCheckedChange={(checked) => handleConfigChange('sessionConfig', {
                    ...localConfig.sessionConfig,
                    autoLogoutEnabled: checked
                  })}
                />
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-800">Rekomendasi Keamanan:</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>• Gunakan durasi sesi 30-60 menit untuk keseimbangan keamanan dan kenyamanan</p>
                      <p>• Aktifkan "Password Sekali Per Sesi" untuk mengurangi gangguan workflow</p>
                      <p>• Aktifkan "Auto Logout" untuk keamanan tambahan</p>
                      <p>• Untuk lingkungan dengan risiko tinggi, gunakan durasi sesi yang lebih pendek</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}