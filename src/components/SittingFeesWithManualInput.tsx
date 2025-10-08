import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Edit, Trash2, Clock, ArrowDown, Settings, User, PlusCircle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { processValidDoctors } from '../utils/doctorNameCleaner'

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface SittingFee {
  id: string
  doctorId: string
  doctorName: string
  shift: string
  amount: number
  date: string
  createdAt: string
  isManual?: boolean
}

interface DoctorSittingFeeSetting {
  id: string
  doctorId: string
  doctorName: string
  shift: string
  amount: number
  createdAt: string
  updatedAt?: string
}

interface SittingFeesProps {
  accessToken: string
}

const shiftOptions = [
  { value: '09:00-15:00', label: 'Shift Pagi (09:00-15:00)' },
  { value: '18:00-20:00', label: 'Shift Sore (18:00-20:00)' }
]

export function SittingFees({ accessToken }: SittingFeesProps) {
  const [sittingFees, setSittingFees] = useState<SittingFee[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [sittingFeeSettings, setSittingFeeSettings] = useState<DoctorSittingFeeSetting[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [editingSittingFee, setEditingSittingFee] = useState<SittingFee | null>(null)
  const [editingSetting, setEditingSetting] = useState<DoctorSittingFeeSetting | null>(null)
  
  const [formData, setFormData] = useState({
    doctorId: '',
    shift: '',
    amount: '',
    date: ''
  })
  
  const [manualFormData, setManualFormData] = useState({
    doctorId: '',
    shift: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })
  
  const [settingsFormData, setSettingsFormData] = useState({
    doctorId: '',
    shift: '',
    amount: ''
  })

  // Function to convert shift time to status
  const getShiftStatus = (shift: string) => {
    if (shift === '09:00-15:00') {
      return 'Pagi'
    } else if (shift === '18:00-20:00') {
      return 'Sore'
    }
    return shift // fallback for any other format
  }

  // Function to get shift status color class
  const getShiftStatusColor = (shift: string) => {
    if (shift === '09:00-15:00') {
      return 'bg-blue-100 text-blue-800'
    } else if (shift === '18:00-20:00') {
      return 'bg-orange-100 text-orange-800'
    }
    return 'bg-pink-100 text-pink-800' // fallback
  }

  useEffect(() => {
    fetchSittingFees()
    fetchDoctors()
    fetchSittingFeeSettings()
  }, [])

  const fetchSittingFees = async () => {
    try {
      const response = await fetch(`${serverUrl}/sitting-fees`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Sort sitting fees by date and createdAt in descending order (newest first)
        const sortedSittingFees = (data.sittingFees || []).sort((a: SittingFee, b: SittingFee) => {
          // First sort by date (main criteria)
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime() // Descending order (newest first)
          }
          
          // If dates are the same, sort by createdAt (secondary criteria)
          const createdA = new Date(a.createdAt)
          const createdB = new Date(b.createdAt)
          return createdB.getTime() - createdA.getTime() // Descending order (newest first)
        })
        
        setSittingFees(sortedSittingFees)
      }
    } catch (error) {
      console.log('Error fetching sitting fees:', error)
      toast.error('Gagal mengambil data uang duduk')
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        // Clean and filter valid doctors using utility function
        const validDoctors = processValidDoctors(data.doctors || [])
        setDoctors(validDoctors)
      }
    } catch (error) {
      console.log('Error fetching doctors:', error)
    }
  }

  const fetchSittingFeeSettings = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctor-sitting-fee-settings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setSittingFeeSettings(data.settings || [])
      }
    } catch (error) {
      console.log('Error fetching sitting fee settings:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedDoctor = doctors.find(doc => doc.id === formData.doctorId)
      if (!selectedDoctor) {
        toast.error('Pilih dokter terlebih dahulu')
        setLoading(false)
        return
      }

      const sittingFeeData = {
        doctorId: formData.doctorId,
        doctorName: selectedDoctor.name,
        shift: formData.shift,
        amount: parseFloat(formData.amount) || 0,
        date: formData.date
      }

      if (editingSittingFee) {
        // Update existing sitting fee
        const response = await fetch(`${serverUrl}/sitting-fees/${editingSittingFee.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(sittingFeeData)
        })

        if (response.ok) {
          toast.success('Data uang duduk berhasil diperbarui')
          await fetchSittingFees() // Ensure fresh data with proper sorting
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal memperbarui data uang duduk')
        }
      } else {
        // Create new sitting fee
        const response = await fetch(`${serverUrl}/sitting-fees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(sittingFeeData)
        })

        if (response.ok) {
          toast.success('Data uang duduk berhasil ditambahkan')
          await fetchSittingFees() // Ensure fresh data with proper sorting
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal menambahkan data uang duduk')
        }
      }
    } catch (error) {
      console.log('Error saving sitting fee:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedDoctor = doctors.find(doc => doc.id === manualFormData.doctorId)
      if (!selectedDoctor) {
        toast.error('Pilih dokter terlebih dahulu')
        setLoading(false)
        return
      }

      const sittingFeeData = {
        doctorId: manualFormData.doctorId,
        doctorName: selectedDoctor.name,
        shift: manualFormData.shift,
        amount: parseFloat(manualFormData.amount) || 0,
        date: manualFormData.date,
        isManual: true,
        description: manualFormData.description
      }

      const response = await fetch(`${serverUrl}/sitting-fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(sittingFeeData)
      })

      if (response.ok) {
        toast.success('Data uang duduk manual berhasil ditambahkan')
        await fetchSittingFees()
        resetManualForm()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menambahkan data uang duduk manual')
      }
    } catch (error) {
      console.log('Error saving manual sitting fee:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedDoctor = doctors.find(doc => doc.id === settingsFormData.doctorId)
      if (!selectedDoctor) {
        toast.error('Pilih dokter terlebih dahulu')
        setLoading(false)
        return
      }

      const settingData = {
        doctorId: settingsFormData.doctorId,
        doctorName: selectedDoctor.name,
        shift: settingsFormData.shift,
        amount: parseFloat(settingsFormData.amount) || 0
      }

      if (editingSetting) {
        // Update existing setting
        const response = await fetch(`${serverUrl}/doctor-sitting-fee-settings/${editingSetting.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(settingData)
        })

        if (response.ok) {
          toast.success('Pengaturan uang duduk berhasil diperbarui')
          await fetchSittingFeeSettings()
          resetSettingsForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal memperbarui pengaturan uang duduk')
        }
      } else {
        // Check if setting already exists for this doctor and shift
        const existingSetting = sittingFeeSettings.find(
          s => s.doctorId === settingsFormData.doctorId && s.shift === settingsFormData.shift
        )

        if (existingSetting) {
          toast.error('Pengaturan untuk dokter dan shift ini sudah ada')
          setLoading(false)
          return
        }

        // Create new setting
        const response = await fetch(`${serverUrl}/doctor-sitting-fee-settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(settingData)
        })

        if (response.ok) {
          toast.success('Pengaturan uang duduk berhasil ditambahkan')
          await fetchSittingFeeSettings()
          resetSettingsForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal menambahkan pengaturan uang duduk')
        }
      }
    } catch (error) {
      console.log('Error saving sitting fee setting:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sittingFeeId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data uang duduk ini?')) {
      return
    }

    try {
      const response = await fetch(`${serverUrl}/sitting-fees/${sittingFeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        toast.success('Data uang duduk berhasil dihapus')
        await fetchSittingFees() // Ensure fresh data with proper sorting
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus data uang duduk')
      }
    } catch (error) {
      console.log('Error deleting sitting fee:', error)
      toast.error('Terjadi kesalahan sistem')
    }
  }

  const handleEdit = (sittingFee: SittingFee) => {
    setEditingSittingFee(sittingFee)
    setFormData({
      doctorId: sittingFee.doctorId,
      shift: sittingFee.shift,
      amount: sittingFee.amount.toString(),
      date: sittingFee.date
    })
    setDialogOpen(true)
  }

  const handleEditSetting = (setting: DoctorSittingFeeSetting) => {
    setEditingSetting(setting)
    setSettingsFormData({
      doctorId: setting.doctorId,
      shift: setting.shift,
      amount: setting.amount.toString()
    })
    setSettingsDialogOpen(true)
  }

  const handleDeleteSetting = async (settingId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengaturan uang duduk ini?')) {
      return
    }

    try {
      const response = await fetch(`${serverUrl}/doctor-sitting-fee-settings/${settingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        toast.success('Pengaturan uang duduk berhasil dihapus')
        await fetchSittingFeeSettings()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus pengaturan uang duduk')
      }
    } catch (error) {
      console.log('Error deleting sitting fee setting:', error)
      toast.error('Terjadi kesalahan sistem')
    }
  }

  const resetForm = () => {
    setFormData({
      doctorId: '',
      shift: '',
      amount: '',
      date: ''
    })
    setEditingSittingFee(null)
    setDialogOpen(false)
  }

  const resetManualForm = () => {
    setManualFormData({
      doctorId: '',
      shift: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    })
    setManualDialogOpen(false)
  }

  const resetSettingsForm = () => {
    setSettingsFormData({
      doctorId: '',
      shift: '',
      amount: ''
    })
    setEditingSetting(null)
    setSettingsDialogOpen(false)
  }

  // Auto-fill amount based on doctor and shift selection
  const handleDoctorShiftChange = async (doctorId: string, shift: string) => {
    setFormData(prev => ({ ...prev, doctorId, shift }))
    
    if (doctorId && shift) {
      try {
        const response = await fetch(`${serverUrl}/doctor-sitting-fee/${doctorId}/${encodeURIComponent(shift)}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        const data = await response.json()
        
        if (response.ok && data.setting) {
          setFormData(prev => ({ 
            ...prev, 
            amount: data.setting.amount.toString() 
          }))
          toast.success('Nominal uang duduk otomatis terisi berdasarkan pengaturan')
        }
      } catch (error) {
        console.log('Error fetching default sitting fee:', error)
      }
    }
  }

  // Auto-fill amount for manual form
  const handleManualDoctorShiftChange = async (doctorId: string, shift: string) => {
    setManualFormData(prev => ({ ...prev, doctorId, shift }))
    
    if (doctorId && shift) {
      try {
        const response = await fetch(`${serverUrl}/doctor-sitting-fee/${doctorId}/${encodeURIComponent(shift)}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        const data = await response.json()
        
        if (response.ok && data.setting) {
          setManualFormData(prev => ({ 
            ...prev, 
            amount: data.setting.amount.toString() 
          }))
        }
      } catch (error) {
        console.log('Error fetching default sitting fee:', error)
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-pink-800 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Manajemen Uang Duduk Dokter
              </CardTitle>
              <p className="text-sm text-pink-600 mt-1">
                Kelola data uang duduk yang tersimpan otomatis dan pengaturan default per dokter
              </p>
            </div>
            {/* Settings Button */}
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => resetSettingsForm()}
                  variant="outline"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Atur Default
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-pink-800">
                    {editingSetting ? 'Edit Pengaturan Uang Duduk' : 'Atur Default Uang Duduk'}
                  </DialogTitle>
                  <DialogDescription className="text-pink-600">
                    {editingSetting 
                      ? 'Perbarui nominal default uang duduk untuk dokter dan shift tertentu.' 
                      : 'Atur nominal default uang duduk yang akan otomatis terisi saat menambah data.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSettingsSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="settings-doctor" className="text-pink-700">Dokter</Label>
                    <Select 
                      value={settingsFormData.doctorId} 
                      onValueChange={(value) => setSettingsFormData({ ...settingsFormData, doctorId: value })}
                    >
                      <SelectTrigger className="border-pink-200">
                        <SelectValue placeholder="Pilih dokter" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.length > 0 ? (
                          doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} - {doctor.specialization}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                            Tidak ada dokter tersedia
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-shift" className="text-pink-700">Shift</Label>
                    <Select 
                      value={settingsFormData.shift} 
                      onValueChange={(value) => setSettingsFormData({ ...settingsFormData, shift: value })}
                    >
                      <SelectTrigger className="border-pink-200">
                        <SelectValue placeholder="Pilih shift" />
                      </SelectTrigger>
                      <SelectContent>
                        {shiftOptions.map((shift) => (
                          <SelectItem key={shift.value} value={shift.value}>
                            {shift.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="settings-amount" className="text-pink-700">Nominal Default</Label>
                    <Input
                      id="settings-amount"
                      type="number"
                      value={settingsFormData.amount}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, amount: e.target.value })}
                      required
                      className="border-pink-200"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetSettingsForm}
                      className="flex-1 border-pink-200 text-pink-600"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-pink-600 hover:bg-pink-700"
                    >
                      {loading ? 'Menyimpan...' : (editingSetting ? 'Update' : 'Simpan')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Data Uang Duduk
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Pengaturan Default
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="data" className="mt-6">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-pink-600">
                  Data diurutkan dari tanggal terbaru
                </p>
                <Button 
                  onClick={() => setManualDialogOpen(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Input Manual
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Shift</TableHead>
                      <TableHead className="text-pink-700">
                        <div className="flex items-center gap-1">
                          Tanggal
                          <ArrowDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="text-pink-700">Nominal</TableHead>
                      <TableHead className="text-pink-700">Tipe</TableHead>
                      <TableHead className="text-pink-700">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sittingFees.map((sittingFee) => (
                      <TableRow key={sittingFee.id}>
                        <TableCell>{sittingFee.doctorName}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getShiftStatusColor(sittingFee.shift)}`}>
                            {getShiftStatus(sittingFee.shift)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {new Date(sittingFee.date).toLocaleDateString('id-ID')}
                            </div>
                            {sittingFee.createdAt && (
                              <div className="text-xs text-gray-500">
                                Dibuat: {new Date(sittingFee.createdAt).toLocaleString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(sittingFee.amount)}
                        </TableCell>
                        <TableCell>
                          {sittingFee.isManual ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              Manual
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Otomatis
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(sittingFee)}
                              className="border-pink-200 text-pink-600 hover:bg-pink-50"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(sittingFee.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {sittingFees.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">Belum ada data uang duduk</p>
                  <Button 
                    onClick={() => setManualDialogOpen(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Tambah Data Manual
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="mb-4">
                <p className="text-sm text-pink-600">
                  Pengaturan default nominal uang duduk per dokter dan shift
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Shift</TableHead>
                      <TableHead className="text-pink-700">Nominal Default</TableHead>
                      <TableHead className="text-pink-700">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sittingFeeSettings.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell>{setting.doctorName}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getShiftStatusColor(setting.shift)}`}>
                            {getShiftStatus(setting.shift)}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(setting.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSetting(setting)}
                              className="border-pink-200 text-pink-600 hover:bg-pink-50"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteSetting(setting.id)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {sittingFeeSettings.length === 0 && (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">Belum ada pengaturan default</p>
                  <Button 
                    onClick={() => setSettingsDialogOpen(true)}
                    variant="outline" 
                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pengaturan
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Manual Input Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-800">
              Input Manual Uang Duduk
            </DialogTitle>
            <DialogDescription className="text-green-600">
              Tambahkan data uang duduk secara manual dengan keterangan khusus.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-doctor" className="text-green-700">Dokter</Label>
              <Select 
                value={manualFormData.doctorId} 
                onValueChange={(value) => handleManualDoctorShiftChange(value, manualFormData.shift)}
              >
                <SelectTrigger className="border-green-200">
                  <SelectValue placeholder="Pilih dokter" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                      Tidak ada dokter tersedia
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-shift" className="text-green-700">Shift</Label>
              <Select 
                value={manualFormData.shift} 
                onValueChange={(value) => handleManualDoctorShiftChange(manualFormData.doctorId, value)}
              >
                <SelectTrigger className="border-green-200">
                  <SelectValue placeholder="Pilih shift" />
                </SelectTrigger>
                <SelectContent>
                  {shiftOptions.map((shift) => (
                    <SelectItem key={shift.value} value={shift.value}>
                      {shift.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-date" className="text-green-700">Tanggal</Label>
              <Input
                id="manual-date"
                type="date"
                value={manualFormData.date}
                onChange={(e) => setManualFormData({ ...manualFormData, date: e.target.value })}
                required
                className="border-green-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-amount" className="text-green-700">Nominal Uang Duduk</Label>
              <Input
                id="manual-amount"
                type="number"
                value={manualFormData.amount}
                onChange={(e) => setManualFormData({ ...manualFormData, amount: e.target.value })}
                required
                className="border-green-200"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-description" className="text-green-700">Keterangan (Opsional)</Label>
              <Input
                id="manual-description"
                type="text"
                value={manualFormData.description}
                onChange={(e) => setManualFormData({ ...manualFormData, description: e.target.value })}
                className="border-green-200"
                placeholder="Contoh: Overtime, pengganti shift, dll"
              />
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>Catatan:</strong> Input manual berguna untuk kondisi khusus seperti overtime, 
                pengganti shift, atau adjustment uang duduk yang tidak tercover oleh perhitungan otomatis.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetManualForm}
                className="flex-1 border-green-200 text-green-600"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Menyimpan...' : 'Simpan Manual'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog for existing sitting fees */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              {editingSittingFee ? 'Edit Uang Duduk' : 'Tambah Uang Duduk Baru'}
            </DialogTitle>
            <DialogDescription className="text-pink-600">
              {editingSittingFee 
                ? 'Perbarui nominal uang duduk dokter untuk shift tertentu.' 
                : 'Tentukan nominal uang duduk dokter untuk shift dan tanggal tertentu.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctor" className="text-pink-700">Dokter</Label>
              <Select 
                value={formData.doctorId} 
                onValueChange={(value) => handleDoctorShiftChange(value, formData.shift)}
              >
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Pilih dokter" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.length > 0 ? (
                    doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-gray-500 text-center">
                      Tidak ada dokter tersedia
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift" className="text-pink-700">Shift</Label>
              <Select 
                value={formData.shift} 
                onValueChange={(value) => handleDoctorShiftChange(formData.doctorId, value)}
              >
                <SelectTrigger className="border-pink-200">
                  <SelectValue placeholder="Pilih shift" />
                </SelectTrigger>
                <SelectContent>
                  {shiftOptions.map((shift) => (
                    <SelectItem key={shift.value} value={shift.value}>
                      {shift.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-pink-700">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="border-pink-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-pink-700">Nominal Uang Duduk</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="border-pink-200"
                placeholder="0"
              />
            </div>

            <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
              <p className="text-sm text-pink-700">
                <strong>Catatan:</strong> Nominal akan otomatis terisi jika sudah ada pengaturan default untuk dokter dan shift yang dipilih. 
                Uang duduk akan dihitung otomatis berdasarkan kehadiran dokter dan fee tindakan.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="flex-1 border-pink-200 text-pink-600"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                {loading ? 'Menyimpan...' : (editingSittingFee ? 'Update' : 'Simpan')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}