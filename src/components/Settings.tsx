import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Settings as SettingsIcon, Upload, Save } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface ClinicSettings {
  name: string
  logo: string | null
  logoPath?: string  // Store the file path for future signed URL generation
  adminFee: number // Biaya admin untuk perhitungan fee tindakan
}

interface SettingsProps {
  accessToken: string
  onSettingsUpdate?: () => void
}

export function Settings({ accessToken, onSettingsUpdate }: SettingsProps) {
  const [settings, setSettings] = useState<ClinicSettings>({
    name: 'Klinik Sehat',
    logo: null,
    logoPath: undefined,
    adminFee: 0
  })
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [isEditing, setIsEditing] = useState(false) // Track if user is editing
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  // Re-fetch settings when switching tabs (only if not editing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isEditing) {
        console.log('Tab became visible, fetching settings')
        fetchSettings()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isEditing])

  const handleNameChange = (newName: string) => {
    setSettings({ ...settings, name: newName })
    setIsEditing(true)
  }

  const handleAdminFeeChange = (newFee: number) => {
    setSettings({ ...settings, adminFee: newFee })
    setIsEditing(true)
  }

  const fetchSettings = async () => {
    // Don't overwrite if user is currently editing
    if (isEditing) {
      console.log('Skipping fetch because user is editing')
      return
    }
    
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = new Date().getTime()
      const response = await fetch(`${serverUrl}/clinic-settings?t=${timestamp}`)
      const data = await response.json()
      console.log('Fetched settings in Settings component:', data)
      if (data.settings) {
        // Ensure all fields have default values
        const settingsWithDefaults = {
          name: data.settings.name || 'Klinik Sehat',
          logo: data.settings.logo || null,
          logoPath: data.settings.logoPath || undefined,
          adminFee: typeof data.settings.adminFee === 'number' ? data.settings.adminFee : 0
        }
        setSettings(settingsWithDefaults)
        console.log('Settings state updated:', settingsWithDefaults)
      }
    } catch (error) {
      console.log('Error fetching settings:', error)
      toast.error('Gagal mengambil pengaturan klinik')
    }
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      console.log('Saving clinic settings:', settings)
      const response = await fetch(`${serverUrl}/clinic-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      console.log('Save response:', data)

      if (response.ok) {
        console.log('Settings saved successfully:', data)
        
        // Update local state with saved data to ensure consistency
        if (data.settings) {
          const settingsWithDefaults = {
            name: data.settings.name || 'Klinik Sehat',
            logo: data.settings.logo || null,
            logoPath: data.settings.logoPath || undefined,
            adminFee: typeof data.settings.adminFee === 'number' ? data.settings.adminFee : 0
          }
          console.log('Updating local settings with:', settingsWithDefaults)
          setSettings(settingsWithDefaults)
        }
        
        toast.success('Pengaturan klinik berhasil disimpan')
        setIsEditing(false) // Reset editing state after successful save
        if (onSettingsUpdate) {
          console.log('Calling onSettingsUpdate...')
          await onSettingsUpdate()
        }
      } else {
        console.log('Failed to save settings:', data)
        toast.error(data.error || 'Gagal menyimpan pengaturan')
      }
    } catch (error) {
      console.log('Error saving settings:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan PNG, JPG, atau JPEG.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB.')
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch(`${serverUrl}/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      const data = await response.json()
      if (response.ok) {
        const updatedSettings = { 
          ...settings, 
          logo: data.logoUrl,
          logoPath: data.logoPath  // Store the path for future reference
        }
        setSettings(updatedSettings)
        toast.success('Logo berhasil diupload, klik "Simpan Pengaturan" untuk menyimpan')
      } else {
        toast.error(data.error || 'Gagal mengupload logo')
      }
    } catch (error) {
      console.log('Error uploading logo:', error)
      toast.error('Terjadi kesalahan saat mengupload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleBrowseFile = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveLogo = () => {
    setSettings({ ...settings, logo: null, logoPath: undefined })
    toast.success('Logo dihapus, klik "Simpan Pengaturan" untuk menyimpan perubahan')
  }

  return (
    <div className="space-y-6">
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Pengaturan Klinik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Clinic Name */}
          <div className="space-y-2">
            <Label htmlFor="clinicName" className="text-pink-700">Nama Klinik</Label>
            <Input
              id="clinicName"
              value={settings.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="border-pink-200"
              placeholder="Masukkan nama klinik"
            />
          </div>

          {/* Admin Fee */}
          <div className="space-y-2">
            <Label htmlFor="adminFee" className="text-pink-700">Biaya Admin</Label>
            <div className="relative">
              <Input
                id="adminFee"
                type="number"
                value={settings.adminFee}
                onChange={(e) => handleAdminFeeChange(parseFloat(e.target.value) || 0)}
                className="border-pink-200 pl-10"
                placeholder="0"
                min="0"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-600 text-sm pointer-events-none">
                Rp
              </div>
            </div>
            <p className="text-xs text-pink-500">
              Biaya admin akan dikurangi dari perhitungan fee tindakan dokter
            </p>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <Label className="text-pink-700">Logo Klinik</Label>
            
            {/* Current Logo Display */}
            {settings.logo && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border border-pink-200 rounded-lg bg-pink-50">
                  <div className="border border-pink-300 rounded-lg p-2 bg-white">
                    <ImageWithFallback
                      src={settings.logo}
                      alt="Logo Klinik"
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-pink-700 font-medium">Logo Klinik Saat Ini</p>
                    <p className="text-xs text-pink-600">Logo ini akan ditampilkan di seluruh aplikasi</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Hapus Logo
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Controls */}
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-pink-200 rounded-lg p-6 text-center bg-pink-25">
                <Upload className="h-8 w-8 text-pink-400 mx-auto mb-2" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBrowseFile}
                  disabled={uploadingLogo}
                  className="border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  {uploadingLogo ? 'Mengupload...' : 'Pilih Logo Baru'}
                </Button>
                <p className="text-xs text-pink-500 mt-2">
                  Format yang didukung: PNG, JPG, JPEG. Maksimal 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-pink-200">
            <Button
              onClick={handleSaveSettings}
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-700 w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800">Informasi Sistem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <h4 className="text-pink-800 font-medium">Versi Sistem</h4>
              <p className="text-pink-600">v1.0.0</p>
            </div>
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <h4 className="text-pink-800 font-medium">Database</h4>
              <p className="text-pink-600">Supabase</p>
            </div>
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <h4 className="text-pink-800 font-medium">Status Koneksi</h4>
              <p className="text-green-600">Terhubung</p>
            </div>
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <h4 className="text-pink-800 font-medium">Terakhir Update</h4>
              <p className="text-pink-600">{new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Information */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800">Fitur Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-pink-800 font-medium">Manajemen Data</h4>
              <ul className="text-sm text-pink-600 space-y-1">
                <li>• Manajemen Karyawan & Dokter</li>
                <li>• Sistem Absensi Multi-Shift</li>
                <li>• Perhitungan Gaji Otomatis</li>
                <li>• Manajemen Uang Duduk</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-pink-800 font-medium">Laporan & Export</h4>
              <ul className="text-sm text-pink-600 space-y-1">
                <li>• Laporan Absensi</li>
                <li>• Laporan Gaji</li>
                <li>• Export PDF & Excel</li>
                <li>• Ringkasan Fee Dokter</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}