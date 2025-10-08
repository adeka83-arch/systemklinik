import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Checkbox } from './ui/checkbox'
import { MultiSelect } from './ui/multi-select'
import { Plus, Edit, Trash2, Percent, Settings } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { TreatmentSelectFixed } from './TreatmentSelectFixed'

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface FeeSettings {
  id: string
  doctorIds?: string[]
  doctorNames?: string[]
  category?: string
  treatmentTypes?: string[]
  feePercentage: number
  isDefault: boolean
  description?: string
  createdAt: string
  // Legacy fields untuk backward compatibility
  doctorId?: string
  doctorName?: string
  treatmentType?: string
}

interface TreatmentProduct {
  id: string
  name: string
  price: number
  category: string
}

interface TreatmentsFeeProps {
  accessToken: string
  doctors: Doctor[]
  treatmentProducts: TreatmentProduct[]
  onFeeSettingsChange?: () => void
}

const treatmentCategories = ['Tindakan', 'Laboratorium', 'Konsultasi']

export function TreatmentsFeeManagement({ accessToken, doctors = [], treatmentProducts = [], onFeeSettingsChange }: TreatmentsFeeProps) {
  const [feeSettings, setFeeSettings] = useState<FeeSettings[]>([])
  const [loading, setLoading] = useState(false)
  const [feeDialogOpen, setFeeDialogOpen] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeSettings | null>(null)
  const [feeFormData, setFeeFormData] = useState({
    doctorIds: [] as string[],
    category: '',
    treatmentTypes: [] as string[],
    feePercentage: '',
    isDefault: false,
    description: ''
  })

  useEffect(() => {
    fetchFeeSettings()
  }, [])

  // Reset form when dialog opens for new entry
  useEffect(() => {
    if (feeDialogOpen && !editingFee) {
      setFeeFormData({
        doctorIds: [],
        category: '',
        treatmentTypes: [],
        feePercentage: '',
        isDefault: false,
        description: ''
      })
    }
  }, [feeDialogOpen, editingFee])

  const fetchFeeSettings = async () => {
    try {
      console.log('Fetching fee settings...')
      const response = await fetch(`${serverUrl}/fee-settings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      console.log('Fee settings response:', data)
      
      if (response.ok) {
        console.log('Setting fee settings:', data.feeSettings || [])
        setFeeSettings(data.feeSettings || [])
      } else {
        console.log('Failed to fetch fee settings:', data)
      }
    } catch (error) {
      console.log('Error fetching fee settings:', error)
    }
  }

  const resetFeeForm = () => {
    console.log('Resetting fee form')
    setEditingFee(null)
    setFeeFormData({
      doctorIds: [],
      category: '',
      treatmentTypes: [],
      feePercentage: '',
      isDefault: false,
      description: ''
    })
    setFeeDialogOpen(false)
  }

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (parseFloat(feeFormData.feePercentage) <= 0 || parseFloat(feeFormData.feePercentage) > 100) {
        toast.error('Persentase fee harus antara 0-100%')
        setLoading(false)
        return
      }

      // Validate that at least one field is specified (doctor, category, or treatmentType) or isDefault is true
      if (feeFormData.doctorIds.length === 0 && !feeFormData.category && feeFormData.treatmentTypes.length === 0 && !feeFormData.isDefault) {
        toast.error('Pilih minimal satu: dokter, kategori, jenis tindakan, atau set sebagai default')
        setLoading(false)
        return
      }

      const selectedDoctors = doctors.filter(doc => feeFormData.doctorIds.includes(doc.id))

      // Extract treatment names from the combined ID-name format
      const treatmentNames = feeFormData.treatmentTypes.length > 0 
        ? feeFormData.treatmentTypes.map(value => {
            // Extract name from format "id-name" or "index-name"
            const dashIndex = value.indexOf('-')
            return dashIndex !== -1 ? value.substring(dashIndex + 1) : value
          })
        : []

      const feeData = {
        doctorIds: feeFormData.doctorIds.length > 0 ? feeFormData.doctorIds : null,
        doctorNames: selectedDoctors.length > 0 ? selectedDoctors.map(doc => doc.name) : null,
        category: feeFormData.category || null,
        treatmentTypes: treatmentNames.length > 0 ? treatmentNames : null,
        feePercentage: parseFloat(feeFormData.feePercentage),
        isDefault: feeFormData.isDefault,
        description: feeFormData.description
      }

      console.log('Submitting fee data:', feeData)
      console.log('Is editing?', !!editingFee, editingFee?.id)

      if (editingFee) {
        console.log('Updating existing fee setting:', editingFee.id)
        const response = await fetch(`${serverUrl}/fee-settings/${editingFee.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(feeData)
        })

        const responseData = await response.json()
        console.log('Update response:', responseData)

        if (response.ok) {
          toast.success('Pengaturan fee berhasil diperbarui')
          fetchFeeSettings()
          onFeeSettingsChange?.()
          resetFeeForm()
        } else {
          console.log('Update failed:', responseData)
          toast.error(responseData.error || 'Gagal memperbarui pengaturan fee')
        }
      } else {
        console.log('Creating new fee setting')
        const response = await fetch(`${serverUrl}/fee-settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(feeData)
        })

        const responseData = await response.json()
        console.log('Create response:', responseData)

        if (response.ok) {
          toast.success('Pengaturan fee berhasil ditambahkan')
          fetchFeeSettings()
          onFeeSettingsChange?.()
          resetFeeForm()
        } else {
          console.log('Create failed:', responseData)
          toast.error(responseData.error || 'Gagal menambahkan pengaturan fee')
        }
      }
    } catch (error) {
      console.log('Error saving fee setting:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleFeeEdit = (feeSetting: FeeSettings) => {
    console.log('Editing fee setting:', feeSetting)
    setEditingFee(feeSetting)
    
    // Handle backward compatibility
    const doctorIds = feeSetting.doctorIds || (feeSetting.doctorId ? [feeSetting.doctorId] : [])
    const savedTreatmentTypes = feeSetting.treatmentTypes || (feeSetting.treatmentType ? [feeSetting.treatmentType] : [])
    
    // Convert saved treatment names back to ID-name format for MultiSelect compatibility
    const treatmentTypesForForm = savedTreatmentTypes.map((treatmentName, index) => {
      // Find the matching product to get its ID
      const matchingProduct = treatmentProducts.find(product => product.name === treatmentName)
      return matchingProduct ? `${matchingProduct.id || index}-${matchingProduct.name}` : treatmentName
    })
    
    console.log('Setting form data with:', {
      doctorIds,
      category: feeSetting.category || '',
      treatmentTypes: treatmentTypesForForm,
      feePercentage: feeSetting.feePercentage.toString(),
      isDefault: feeSetting.isDefault,
      description: feeSetting.description || ''
    })
    
    setFeeFormData({
      doctorIds: doctorIds,
      category: feeSetting.category || '',
      treatmentTypes: treatmentTypesForForm,
      feePercentage: feeSetting.feePercentage.toString(),
      isDefault: feeSetting.isDefault,
      description: feeSetting.description || ''
    })
    setFeeDialogOpen(true)
  }

  const handleFeeDelete = async (feeId: string) => {
    console.log('Attempting to delete fee setting with ID:', feeId)
    
    if (!confirm('Apakah Anda yakin ingin menghapus pengaturan fee ini?')) {
      return
    }

    try {
      console.log('Sending DELETE request to:', `${serverUrl}/fee-settings/${feeId}`)
      
      const response = await fetch(`${serverUrl}/fee-settings/${feeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      console.log('Delete response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Delete response data:', data)
        toast.success('Pengaturan fee berhasil dihapus')
        fetchFeeSettings()
        onFeeSettingsChange?.()
      } else {
        const data = await response.json()
        console.log('Delete error response:', data)
        toast.error(data.error || 'Gagal menghapus pengaturan fee')
      }
    } catch (error) {
      console.log('Error deleting fee setting:', error)
      toast.error('Terjadi kesalahan sistem')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const getRuleDescription = (setting: FeeSettings) => {
    const parts = []
    
    if (setting.isDefault) {
      return 'Default untuk semua dokter'
    }
    
    // Handle multiple doctors
    const doctorNames = setting.doctorNames || (setting.doctorName ? [setting.doctorName] : [])
    if (doctorNames.length > 0) {
      if (doctorNames.length === 1) {
        parts.push(`Dokter: ${doctorNames[0]}`)
      } else {
        parts.push(`Dokter: ${doctorNames.length} dokter`)
      }
    }
    
    if (setting.category) {
      parts.push(`Kategori: ${setting.category}`)
    }
    
    // Handle multiple treatment types
    const treatmentTypes = setting.treatmentTypes || (setting.treatmentType ? [setting.treatmentType] : [])
    if (treatmentTypes.length > 0) {
      if (treatmentTypes.length === 1) {
        parts.push(`Tindakan: ${treatmentTypes[0]}`)
      } else {
        parts.push(`Tindakan: ${treatmentTypes.length} jenis`)
      }
    }
    
    return parts.length > 0 ? parts.join(' + ') : 'Aturan umum'
  }

  return (
    <Card className="bg-white border-pink-200">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-pink-100 border-b border-pink-200">
        <CardTitle className="flex items-center gap-2 text-pink-800">
          <Settings className="h-5 w-5" />
          Pengaturan Fee Dokter dalam Persentase
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-pink-600" />
            <span className="text-sm text-pink-600">
              {feeSettings.length} aturan fee terkonfigurasi
            </span>
          </div>
          <Button 
            onClick={() => {
              console.log('Opening add new fee dialog')
              // Ensure we're not in editing mode
              setEditingFee(null)
              setFeeFormData({
                doctorIds: [],
                category: '',
                treatmentTypes: [],
                feePercentage: '',
                isDefault: false,
                description: ''
              })
              setFeeDialogOpen(true)
            }}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Aturan Fee
          </Button>
        </div>

        <div className="rounded-lg border border-pink-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-pink-50 hover:bg-pink-50">
                <TableHead className="text-pink-800 font-semibold">Aturan</TableHead>
                <TableHead className="text-pink-800 font-semibold">Persentase Fee</TableHead>
                <TableHead className="text-pink-800 font-semibold">Status</TableHead>
                <TableHead className="text-pink-800 font-semibold">Keterangan</TableHead>
                <TableHead className="text-pink-800 font-semibold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeSettings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Belum ada aturan fee. Klik "Tambah Aturan Fee" untuk mulai mengatur persentase fee dokter.
                  </TableCell>
                </TableRow>
              ) : (
                feeSettings.sort((a, b) => {
                  // Sort: Default rules first, then by doctor name, then by creation date
                  if (a.isDefault && !b.isDefault) return -1
                  if (!a.isDefault && b.isDefault) return 1
                  
                  // Handle both single and multiple doctor names
                  const aFirstDoctorName = a.doctorNames?.[0] || a.doctorName || ''
                  const bFirstDoctorName = b.doctorNames?.[0] || b.doctorName || ''
                  
                  if (aFirstDoctorName && bFirstDoctorName) {
                    return aFirstDoctorName.localeCompare(bFirstDoctorName)
                  }
                  
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                }).map((setting) => {
                  console.log('Rendering fee setting row:', setting.id, setting)
                  return (
                  <TableRow key={setting.id} className="hover:bg-pink-50/50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">
                          {getRuleDescription(setting)}
                        </div>
                        
                        {/* Show detailed breakdown for multiple values */}
                        <div className="space-y-1 text-sm text-gray-600">
                          {/* Multiple doctors detail */}
                          {(setting.doctorNames || (setting.doctorName ? [setting.doctorName] : [])).length > 1 && (
                            <div className="flex flex-wrap gap-1">
                              {(setting.doctorNames || []).map((name, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Multiple treatments detail */}
                          {(setting.treatmentTypes || (setting.treatmentType ? [setting.treatmentType] : [])).length > 1 && (
                            <div className="flex flex-wrap gap-1">
                              {(setting.treatmentTypes || []).slice(0, 3).map((type, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  {type}
                                </Badge>
                              ))}
                              {(setting.treatmentTypes || []).length > 3 && (
                                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                                  +{(setting.treatmentTypes || []).length - 3} lainnya
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {setting.description && (
                          <div className="text-sm text-gray-500 italic">
                            {setting.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-300">
                        {setting.feePercentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {setting.isDefault ? (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                          Default
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          Spesifik
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        Dibuat: {new Date(setting.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('Edit button clicked for setting:', setting.id, setting)
                            handleFeeEdit(setting)
                          }}
                          className="text-pink-600 border-pink-300 hover:bg-pink-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('Delete button clicked for setting:', setting.id, setting)
                            handleFeeDelete(setting.id)
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Fee Settings Dialog */}
        <Dialog 
          open={feeDialogOpen} 
          onOpenChange={(open) => {
            if (!open) {
              console.log('Dialog closing, resetting form')
              setEditingFee(null)
              setFeeFormData({
                doctorIds: [],
                category: '',
                treatmentTypes: [],
                feePercentage: '',
                isDefault: false,
                description: ''
              })
            }
            setFeeDialogOpen(open)
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-pink-800">
                {editingFee ? 'Edit Aturan Fee' : 'Tambah Aturan Fee Baru'}
              </DialogTitle>
              <DialogDescription>
                Atur persentase fee dokter berdasarkan dokter, kategori tindakan, atau jenis tindakan spesifik.
                Aturan yang lebih spesifik akan diprioritaskan.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFeeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doctorIds" className="text-pink-700">Dokter (Opsional)</Label>
                  <MultiSelect
                    options={doctors
                      .filter(doctor => doctor && doctor.id && doctor.name)
                      .map(doctor => ({
                        value: doctor.id,
                        label: doctor.name,
                        description: doctor.specialization || ''
                      }))}
                    selected={feeFormData.doctorIds}
                    onSelectedChange={(values) => setFeeFormData(prev => ({ ...prev, doctorIds: values }))}
                    placeholder="Pilih dokter (kosongkan untuk semua dokter)"
                    className="border-pink-200 focus:border-pink-400"
                    maxDisplayItems={2}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-pink-700">Kategori Tindakan (Opsional)</Label>
                  <Select
                    value={feeFormData.category}
                    onValueChange={(value) => setFeeFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="border-pink-200 focus:border-pink-400">
                      <SelectValue placeholder="Pilih kategori (kosongkan untuk semua)" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatmentCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="treatmentTypes" className="text-pink-700">Jenis Tindakan Spesifik (Opsional)</Label>
                <div className="space-y-2">
                  <MultiSelect
                    options={treatmentProducts
                      .filter(product => product && product.name && (!feeFormData.category || product.category === feeFormData.category))
                      .map((product, index) => ({
                        value: `${product.id || index}-${product.name}`,
                        label: product.name,
                        description: `${product.category || 'Kategori tidak tersedia'} - ${formatCurrency(product.price || 0)}`
                      }))}
                    selected={feeFormData.treatmentTypes}
                    onSelectedChange={(values) => setFeeFormData(prev => ({ ...prev, treatmentTypes: values }))}
                    placeholder="Pilih tindakan spesifik (kosongkan untuk semua)"
                    className="border-pink-200 focus:border-pink-400"
                    maxDisplayItems={3}
                  />
                  <div className="text-xs text-gray-500">
                    💡 Gunakan kolom pencarian di dalam dropdown untuk mencari tindakan dengan cepat
                    {feeFormData.category && ` • Menampilkan ${treatmentProducts.filter(p => p.category === feeFormData.category).length} tindakan dalam kategori "${feeFormData.category}"`}
                    {!feeFormData.category && ` • Menampilkan ${treatmentProducts.length} tindakan total`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="feePercentage" className="text-pink-700">
                    Persentase Fee <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="feePercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={feeFormData.feePercentage}
                    onChange={(e) => setFeeFormData(prev => ({ ...prev, feePercentage: e.target.value }))}
                    placeholder="Contoh: 15.5"
                    className="border-pink-200 focus:border-pink-400"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Masukkan angka antara 0-100 (dapat desimal)
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-7">
                  <Checkbox
                    id="isDefault"
                    checked={feeFormData.isDefault}
                    onCheckedChange={(checked) => setFeeFormData(prev => ({ ...prev, isDefault: !!checked }))}
                    className="border-pink-300 data-[state=checked]:bg-pink-600"
                  />
                  <Label htmlFor="isDefault" className="text-pink-700">
                    Set sebagai Default
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-pink-700">Keterangan</Label>
                <Textarea
                  id="description"
                  value={feeFormData.description}
                  onChange={(e) => setFeeFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Keterangan tambahan untuk aturan fee ini..."
                  className="border-pink-200 focus:border-pink-400"
                  rows={3}
                />
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <h4 className="font-medium text-pink-800 mb-2">Prioritas Aturan Fee:</h4>
                <ol className="text-sm text-pink-700 space-y-1">
                  <li>1. Dokter + Jenis Tindakan Spesifik</li>
                  <li>2. Dokter + Kategori Tindakan</li>
                  <li>3. Dokter saja</li>
                  <li>4. Jenis Tindakan Spesifik</li>
                  <li>5. Kategori Tindakan</li>
                  <li>6. Aturan Default</li>
                </ol>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFeeForm}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  {loading ? 'Menyimpan...' : editingFee ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}