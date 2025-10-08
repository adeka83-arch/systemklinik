import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { 
  Building2, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Printer,
  Receipt,
  Image as ImageIcon,
  Monitor
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { serverUrl } from '../utils/supabase/client'

interface ClinicBrandingManagerProps {
  accessToken: string
  clinicSettings: any
  onSettingsUpdate: () => void
}

interface AffectedArea {
  name: string
  icon: React.ReactNode
  description: string
  updates: string[]
  details?: string[]
}

export function ClinicBrandingManager({ 
  accessToken, 
  clinicSettings, 
  onSettingsUpdate 
}: ClinicBrandingManagerProps) {
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: clinicSettings?.name || 'Falasifah Dental Clinic',
    address: clinicSettings?.address || 'Sawangan, Depok City, West Java, Indonesia',
    city: clinicSettings?.city || 'Depok City',
    province: clinicSettings?.province || 'West Java', 
    country: clinicSettings?.country || 'Indonesia',
    phone: clinicSettings?.phone || '+62 21 1234567',
    email: clinicSettings?.email || 'info@falasifah-dental.com',
    website: clinicSettings?.website || 'www.falasifah-dental.com',
    description: clinicSettings?.description || 'Klinik Gigi Terpercaya dengan Pelayanan Terbaik'
  })

  const [logoPreview, setLogoPreview] = useState<string | null>(clinicSettings?.logo || null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const [affectedAreas] = useState([
    {
      name: 'Medical Forms (7 Types)',
      icon: <FileText className="h-5 w-5" />,
      description: 'All medical forms with automatic header updates',
      updates: ['Logo', 'Clinic Name', 'Address', 'Contact Info'],
      details: [
        'Formulir Tindakan Dokter (A5)',
        'Informed Consent (A4)', 
        'Form Ortodontik (A4)',
        'Resep Obat (Siap Print)',
        'Rujukan Rontgen (Siap Print)',
        'Rujukan Spesialis (Siap Print)',
        'Surat Keterangan Berobat (Siap Print)'
      ]
    },
    {
      name: 'Print Reports (8 Types)',
      icon: <Printer className="h-5 w-5" />,
      description: 'All financial, employee, sales, and medical reports',
      updates: ['Header Logo', 'Clinic Information', 'Contact Details'],
      details: [
        'Laporan Keuangan (Financial)',
        'Laporan Pengeluaran (Expenses)',
        'Laporan Absensi Karyawan (Employee Attendance)', 
        'Laporan Gaji & Bonus (Salary & Bonus)',
        'Laporan Uang Duduk Dokter (Doctor Fees)',
        'Laporan Penjualan Produk (Product Sales)',
        'Laporan Field Trip Sales (Field Trip)',
        'Laporan Tindakan & Treatment (Medical Treatments)'
      ]
    },
    {
      name: 'Invoices & Receipts (4 Types)',
      icon: <Receipt className="h-5 w-5" />,
      description: 'Treatment and field trip invoices with receipts',
      updates: ['Logo', 'Clinic Name', 'Address', 'Phone/Email'],
      details: [
        'Invoice Tindakan (Medical Treatments)',
        'Invoice Field Trip (Field Trip Services)',
        'Kwitansi Tindakan (Treatment Receipts)',
        'Kwitansi Field Trip (Field Trip Receipts)'
      ]
    },
    {
      name: 'System Interface',
      icon: <Monitor className="h-5 w-5" />,
      description: 'Dashboard, sidebar, and all UI components',
      updates: ['Logo Display', 'Clinic Name', 'Theme Integration'],
      details: [
        'Dashboard Header',
        'Sidebar Logo',
        'Login Page Branding',
        'All UI Components'
      ]
    }
  ])

  useEffect(() => {
    // Update form when clinic settings change
    if (clinicSettings) {
      setFormData({
        name: clinicSettings.name || 'Falasifah Dental Clinic',
        address: clinicSettings.address || 'Sawangan, Depok City, West Java, Indonesia',
        city: clinicSettings.city || 'Depok City',
        province: clinicSettings.province || 'West Java',
        country: clinicSettings.country || 'Indonesia',
        phone: clinicSettings.phone || '+62 21 1234567',
        email: clinicSettings.email || 'info@falasifah-dental.com',
        website: clinicSettings.website || 'www.falasifah-dental.com',
        description: clinicSettings.description || 'Klinik Gigi Terpercaya dengan Pelayanan Terbaik'
      })
      setLogoPreview(clinicSettings.logo)
    }
  }, [clinicSettings])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setLogoFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoPreview

    const formData = new FormData()
    formData.append('logo', logoFile)

    try {
      const response = await fetch(`${serverUrl}/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        return data.logoUrl
      } else {
        throw new Error('Logo upload failed')
      }
    } catch (error) {
      console.error('Logo upload error:', error)
      throw error
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    
    try {
      let logoUrl = logoPreview

      // Upload logo if new file selected
      if (logoFile) {
        toast.success('Uploading logo...')
        logoUrl = await uploadLogo()
      }

      // Save clinic settings
      const settingsData = {
        ...formData,
        logo: logoUrl,
        logoPath: logoUrl,
        updatedAt: new Date().toISOString()
      }

      const response = await fetch(`${serverUrl}/clinic-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ settings: settingsData })
      })

      if (response.ok) {
        toast.success('✅ Clinic branding updated successfully!')
        toast.success('📋 All forms and reports will use the new branding')
        toast.success('🖨️ Print templates updated automatically')
        
        // Clear the file input
        setLogoFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Trigger settings refresh
        onSettingsUpdate()
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save clinic settings')
    } finally {
      setLoading(false)
    }
  }

  const resetToDefaults = () => {
    setFormData({
      name: 'Falasifah Dental Clinic',
      address: 'Sawangan, Depok City, West Java, Indonesia',
      city: 'Depok City',
      province: 'West Java',
      country: 'Indonesia',
      phone: '+62 21 1234567',
      email: 'info@falasifah-dental.com',
      website: 'www.falasifah-dental.com',
      description: 'Klinik Gigi Terpercaya dengan Pelayanan Terbaik'
    })
    setLogoFile(null)
    setLogoPreview(clinicSettings?.logo || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert className="border-blue-200 bg-blue-50">
          <Building2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Comprehensive Auto-Update System:</strong> Changes made here will automatically update across 
            <strong>7 medical forms</strong>, all print reports, invoices, receipts, and system interfaces. 
            No manual editing required for any document templates.
          </AlertDescription>
        </Alert>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-pink-600" />
                Logo Management
              </CardTitle>
              <CardDescription>
                Upload and manage your clinic logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Logo Preview */}
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-white border-2 border-pink-200 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                  {logoPreview ? (
                    <ImageWithFallback
                      src={logoPreview}
                      alt="Clinic Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-xs">No Logo</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">Current Logo</p>
              </div>

              {/* Upload Button */}
              <div className="space-y-2">
                <Label>Upload New Logo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full border-pink-200 text-pink-600 hover:bg-pink-50"
                  disabled={loading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Logo File
                </Button>
                <p className="text-xs text-gray-500">
                  Supported: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>

              {logoFile && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    New logo selected: <strong>{logoFile.name}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Clinic Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-pink-600" />
                Clinic Information
              </CardTitle>
              <CardDescription>
                Basic clinic information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-name">Clinic Name</Label>
                <Input
                  id="clinic-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="border-pink-200"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="border-pink-200"
                  rows={2}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10 border-pink-200"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10 border-pink-200"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="pl-10 border-pink-200"
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Address Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-pink-600" />
              Address Information
            </CardTitle>
            <CardDescription>
              Complete address details for forms and documents
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="border-pink-200"
                rows={2}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="border-pink-200"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Province/State</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                className="border-pink-200"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="border-pink-200"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Preview Address</Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
                {formData.address}<br />
                {formData.city}, {formData.province}<br />
                {formData.country}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Affected Areas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              Auto-Update Areas
            </CardTitle>
            <CardDescription>
              These areas will be automatically updated when you save changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {affectedAreas.map((area, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {area.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{area.name}</h4>
                      <p className="text-xs text-gray-600">{area.description}</p>
                    </div>
                  </div>
                  
                  {/* Update badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {area.updates.map((update, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {update}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Detailed list */}
                  {area.details && (
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <p className="text-xs font-medium text-blue-800 mb-2">Mencakup:</p>
                      <div className="space-y-1">
                        {area.details.map((detail, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            {detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="flex gap-4">
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700 flex-1"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>

          <Button
            onClick={resetToDefaults}
            variant="outline"
            disabled={loading}
            className="border-pink-200 text-pink-600 hover:bg-pink-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>
      </motion.div>
    </div>
  )
}