import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Shield, Settings, Save, RotateCcw, Database, Clock, Mail, Github } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { useCentralizedSecurity, SecurityLevel } from './CentralizedSecurityManager'

interface PageConfigItem {
  id: string
  label: string
  currentLevel: SecurityLevel
}

const PAGES_CONFIG: PageConfigItem[] = [
  { id: 'dashboard', label: 'Dashboard', currentLevel: SecurityLevel.DOCTOR },
  { id: 'patients', label: 'Manajemen Pasien', currentLevel: SecurityLevel.DOCTOR },
  { id: 'forms', label: 'Formulir Medis', currentLevel: SecurityLevel.DOCTOR },
  { id: 'medical-record-summary', label: 'Rekapan Rekam Medis', currentLevel: SecurityLevel.DOCTOR },
  { id: 'products', label: 'Daftar Produk', currentLevel: SecurityLevel.DOCTOR },
  { id: 'treatments', label: 'Tindakan & Fee Dokter', currentLevel: SecurityLevel.STAFF },
  { id: 'product-field-trip', label: 'Produk Field Trip', currentLevel: SecurityLevel.STAFF },
  { id: 'field-trip-sales', label: 'Penjualan Field Trip', currentLevel: SecurityLevel.STAFF },
  { id: 'doctor-status', label: 'Manajemen Karyawan & Dokter', currentLevel: SecurityLevel.STAFF },
  { id: 'attendance', label: 'Data Absensi', currentLevel: SecurityLevel.STAFF },
  { id: 'sitting-fees', label: 'Uang Duduk Dokter', currentLevel: SecurityLevel.STAFF },
  { id: 'sales', label: 'Manajemen Penjualan', currentLevel: SecurityLevel.STAFF },
  { id: 'stock-opname', label: 'Stock Opname', currentLevel: SecurityLevel.STAFF },
  { id: 'promo', label: 'Manajemen Promo', currentLevel: SecurityLevel.STAFF },
  { id: 'expenses', label: 'Pengeluaran Klinik', currentLevel: SecurityLevel.STAFF },
  { id: 'salaries', label: 'Manajemen Gaji', currentLevel: SecurityLevel.OWNER },
  { id: 'reports', label: 'Laporan & Export', currentLevel: SecurityLevel.OWNER },
  { id: 'backup-manager', label: 'Backup Database', currentLevel: SecurityLevel.SUPER_USER },
  { id: 'security-settings', label: 'Pengaturan Keamanan', currentLevel: SecurityLevel.SUPER_USER }
]

interface BackupSecurityConfig {
  enableAutoBackup: boolean
  enableEmailNotification: boolean
  enableGithubIntegration: boolean
  requireConfirmation: boolean
  backupRetentionDays: number
}

export function SuperUserConfigPanel() {
  const [pagesConfig, setPagesConfig] = useState<PageConfigItem[]>(PAGES_CONFIG)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [backupConfig, setBackupConfig] = useState<BackupSecurityConfig>({
    enableAutoBackup: true,
    enableEmailNotification: true,
    enableGithubIntegration: true,
    requireConfirmation: true,
    backupRetentionDays: 30
  })

  const { 
    pageAccessConfig,
    isConfigAdmin,
    updatePageAccess,
    getLevelName,
    getLevelIcon,
    currentLevel
  } = useCentralizedSecurity()

  useEffect(() => {
    // Sync with current configuration
    const updatedConfig = PAGES_CONFIG.map(page => ({
      ...page,
      currentLevel: pageAccessConfig[page.id] || page.currentLevel
    }))
    setPagesConfig(updatedConfig)

    // Load backup security configuration
    const savedBackupConfig = localStorage.getItem('backup-security-config')
    if (savedBackupConfig) {
      try {
        setBackupConfig(JSON.parse(savedBackupConfig))
      } catch (error) {
        // Use default config
      }
    }
  }, [pageAccessConfig])

  if (!isConfigAdmin()) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg text-red-800 mb-2">Akses Super User Diperlukan</h3>
            <p className="text-red-600 text-sm mb-4">
              Hanya Super User yang dapat mengatur konfigurasi akses halaman sistem.
            </p>
            <p className="text-xs text-gray-600">
              Level saat ini: {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleLevelChange = (pageId: string, newLevel: SecurityLevel) => {
    setPagesConfig(prev => 
      prev.map(page => 
        page.id === pageId 
          ? { ...page, currentLevel: newLevel }
          : page
      )
    )
    setHasChanges(true)
  }

  const handleSaveChanges = async () => {
    setSaving(true)
    
    try {
      // Save page access configuration
      for (const page of pagesConfig) {
        await updatePageAccess(page.id, page.currentLevel)
      }
      
      // Save backup security configuration
      localStorage.setItem('backup-security-config', JSON.stringify(backupConfig))
      
      setHasChanges(false)
      toast.success('Konfigurasi keamanan berhasil disimpan')
    } catch (error) {
      toast.error('Gagal menyimpan konfigurasi keamanan')
    } finally {
      setSaving(false)
    }
  }

  const handleBackupConfigChange = (key: keyof BackupSecurityConfig, value: boolean | number) => {
    setBackupConfig(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }

  const handleResetToDefault = () => {
    setPagesConfig(PAGES_CONFIG)
    setHasChanges(true)
    toast.info('Konfigurasi direset ke pengaturan default')
  }

  const getLevelColor = (level: SecurityLevel) => {
    switch (level) {
      case SecurityLevel.DOCTOR: return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case SecurityLevel.STAFF: return 'bg-blue-100 text-blue-800 border-blue-300'
      case SecurityLevel.OWNER: return 'bg-purple-100 text-purple-800 border-purple-300'
      case SecurityLevel.SUPER_USER: return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const groupedPages = {
    [SecurityLevel.DOCTOR]: pagesConfig.filter(p => p.currentLevel === SecurityLevel.DOCTOR),
    [SecurityLevel.STAFF]: pagesConfig.filter(p => p.currentLevel === SecurityLevel.STAFF),
    [SecurityLevel.OWNER]: pagesConfig.filter(p => p.currentLevel === SecurityLevel.OWNER),
    [SecurityLevel.SUPER_USER]: pagesConfig.filter(p => p.currentLevel === SecurityLevel.SUPER_USER)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Settings className="h-6 w-6" />
            Konfigurasi Akses Halaman Sistem
          </CardTitle>
          <CardDescription className="text-red-700">
            <strong>Super User Panel:</strong> Atur level akses minimum untuk setiap halaman sistem. 
            Semua user akan mengikuti konfigurasi yang Anda tetapkan di sini.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-800">
                {groupedPages[SecurityLevel.DOCTOR].length}
              </div>
              <div className="text-sm text-emerald-700">Halaman Level Dokter</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800">
                {groupedPages[SecurityLevel.STAFF].length}
              </div>
              <div className="text-sm text-blue-600">Halaman Level Staff</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-800">
                {groupedPages[SecurityLevel.OWNER].length + groupedPages[SecurityLevel.SUPER_USER].length}
              </div>
              <div className="text-sm text-purple-600">Halaman Level Tinggi</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pengaturan Akses Per Halaman</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
                disabled={saving}
                className="text-gray-600 hover:text-gray-800"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset Default
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={!hasChanges || saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Pilih level akses minimum yang diperlukan untuk mengakses setiap halaman.
            Perubahan akan berlaku untuk semua user setelah disimpan.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {pagesConfig.map((page) => (
              <div key={page.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{page.label}</h4>
                  <p className="text-sm text-gray-500">ID: {page.id}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={getLevelColor(page.currentLevel)}>
                    {getLevelIcon(page.currentLevel)} {getLevelName(page.currentLevel)}
                  </Badge>
                  
                  <Select
                    value={page.currentLevel.toString()}
                    onValueChange={(value) => handleLevelChange(page.id, parseInt(value) as SecurityLevel)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SecurityLevel.DOCTOR.toString()}>
                        👨‍⚕️ Level Dokter
                      </SelectItem>
                      <SelectItem value={SecurityLevel.STAFF.toString()}>
                        👥 Level Staff
                      </SelectItem>
                      <SelectItem value={SecurityLevel.OWNER.toString()}>
                        👑 Level Owner
                      </SelectItem>
                      <SelectItem value={SecurityLevel.SUPER_USER.toString()}>
                        🔧 Level Super User
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup Security Configuration */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Database className="h-6 w-6" />
            Konfigurasi Keamanan Backup Database
          </CardTitle>
          <CardDescription className="text-orange-700">
            Pengaturan keamanan dan otomatisasi untuk sistem backup database
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Access Level for Backup Manager */}
          <div className="p-4 border border-orange-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">Level Akses Backup Manager</h4>
                <p className="text-sm text-gray-500">Tentukan siapa yang dapat mengakses halaman backup database</p>
              </div>
              <Badge className={getLevelColor(pagesConfig.find(p => p.id === 'backup-manager')?.currentLevel || SecurityLevel.SUPER_USER)}>
                {getLevelIcon(pagesConfig.find(p => p.id === 'backup-manager')?.currentLevel || SecurityLevel.SUPER_USER)} 
                {getLevelName(pagesConfig.find(p => p.id === 'backup-manager')?.currentLevel || SecurityLevel.SUPER_USER)}
              </Badge>
            </div>
          </div>

          {/* Backup Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-orange-200 rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Auto Backup Harian</h4>
                    <p className="text-sm text-gray-500">Backup otomatis setiap jam 11 malam</p>
                  </div>
                </div>
                <Switch
                  checked={backupConfig.enableAutoBackup}
                  onCheckedChange={(checked) => handleBackupConfigChange('enableAutoBackup', checked)}
                />
              </div>
            </div>

            <div className="p-4 border border-orange-200 rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notification</h4>
                    <p className="text-sm text-gray-500">Notifikasi hasil backup via email</p>
                  </div>
                </div>
                <Switch
                  checked={backupConfig.enableEmailNotification}
                  onCheckedChange={(checked) => handleBackupConfigChange('enableEmailNotification', checked)}
                />
              </div>
            </div>

            <div className="p-4 border border-orange-200 rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Github className="h-5 w-5 text-gray-800" />
                  <div>
                    <h4 className="font-medium text-gray-900">GitHub Integration</h4>
                    <p className="text-sm text-gray-500">Upload backup ke repository private</p>
                  </div>
                </div>
                <Switch
                  checked={backupConfig.enableGithubIntegration}
                  onCheckedChange={(checked) => handleBackupConfigChange('enableGithubIntegration', checked)}
                />
              </div>
            </div>

            <div className="p-4 border border-orange-200 rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-red-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Konfirmasi Wajib</h4>
                    <p className="text-sm text-gray-500">Memerlukan konfirmasi untuk backup manual</p>
                  </div>
                </div>
                <Switch
                  checked={backupConfig.requireConfirmation}
                  onCheckedChange={(checked) => handleBackupConfigChange('requireConfirmation', checked)}
                />
              </div>
            </div>
          </div>

          {/* Backup Retention Settings */}
          <div className="p-4 border border-orange-200 rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Retention Period</h4>
                <p className="text-sm text-gray-500">Lama penyimpanan backup (hari)</p>
              </div>
              <Select
                value={backupConfig.backupRetentionDays.toString()}
                onValueChange={(value) => handleBackupConfigChange('backupRetentionDays', parseInt(value))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Hari</SelectItem>
                  <SelectItem value="14">14 Hari</SelectItem>
                  <SelectItem value="30">30 Hari</SelectItem>
                  <SelectItem value="60">60 Hari</SelectItem>
                  <SelectItem value="90">90 Hari</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Backup Security Status */}
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <h4 className="font-medium text-green-800 mb-3">🔒 Status Keamanan Backup</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${backupConfig.enableAutoBackup ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div className="text-xs text-green-700">Auto Backup</div>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${backupConfig.enableEmailNotification ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div className="text-xs text-green-700">Email Alert</div>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${backupConfig.enableGithubIntegration ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div className="text-xs text-green-700">GitHub Sync</div>
              </div>
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${backupConfig.requireConfirmation ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div className="text-xs text-green-700">Konfirmasi</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-800 mb-2">📋 Cara Kerja Sistem Akses:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• <strong>Semua user</strong> mulai dengan akses level <strong>Dokter</strong> saat login</div>
              <div>• User dapat upgrade level dengan password jika memerlukan akses lebih tinggi</div>
              <div>• Konfigurasi yang Anda tetapkan berlaku untuk <strong>semua user</strong> tanpa pengecualian</div>
              <div>• Semua user melihat <strong>menu yang sama</strong> dengan indikator level yang diperlukan</div>
              <div>• Password: Staff (staff123), Owner (owner456), Super User (super789)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-orange-800 mb-2">🔐 Keamanan Backup Database:</h4>
            <div className="text-sm text-orange-700 space-y-1">
              <div>• <strong>Backup Manager</strong> default hanya untuk <strong>Super User</strong></div>
              <div>• Auto backup berjalan setiap hari jam 11 malam jika diaktifkan</div>
              <div>• Email notification mengirim laporan hasil backup</div>
              <div>• GitHub integration menyimpan backup ke repository private</div>
              <div>• Konfirmasi wajib menambah lapisan keamanan untuk backup manual</div>
              <div>• Retention period mengatur berapa lama backup disimpan</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {hasChanges && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <span className="font-medium">⚠️ Ada perubahan yang belum disimpan</span>
              <Button
                size="sm"
                onClick={handleSaveChanges}
                disabled={saving}
                className="ml-auto bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Simpan Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}