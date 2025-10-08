import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Edit, Trash2, Clock, ArrowDown, Settings, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react'
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
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [editingSetting, setEditingSetting] = useState<DoctorSittingFeeSetting | null>(null)
  const [editingSittingFee, setEditingSittingFee] = useState<SittingFee | null>(null)
  
  const [manualFormData, setManualFormData] = useState({
    doctorId: '',
    shift: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  })

  const [editFormData, setEditFormData] = useState({
    doctorId: '',
    shift: '',
    amount: '',
    date: ''
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
    return shift
  }

  // Function to get shift status color class
  const getShiftStatusColor = (shift: string) => {
    if (shift === '09:00-15:00') {
      return 'bg-blue-100 text-blue-800'
    } else if (shift === '18:00-20:00') {
      return 'bg-orange-100 text-orange-800'
    }
    return 'bg-pink-100 text-pink-800'
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setDataLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchSittingFees(),
        fetchDoctors(),
        fetchSittingFeeSettings()
      ])
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Gagal memuat data. Silakan coba lagi.')
    } finally {
      setDataLoading(false)
    }
  }

  const fetchSittingFees = async () => {
    try {
      const response = await fetch(`${serverUrl}/sitting-fees`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        const sortedSittingFees = (data.sittingFees || []).sort((a: SittingFee, b: SittingFee) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime()
          }
          
          const createdA = new Date(a.createdAt)
          const createdB = new Date(b.createdAt)
          return createdB.getTime() - createdA.getTime()
        })
        
        setSittingFees(sortedSittingFees)
      } else {
        throw new Error(data.error || 'Gagal mengambil data uang duduk')
      }
    } catch (error) {
      console.error('Error fetching sitting fees:', error)
      throw error
    }
  }

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        const validDoctors = processValidDoctors(data.doctors || [])
        setDoctors(validDoctors)
      } else {
        throw new Error(data.error || 'Gagal mengambil data dokter')
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      throw error
    }
  }

  const fetchSittingFeeSettings = async () => {
    try {
      const response = await fetch(`${serverUrl}/doctor-sitting-fee-settings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        setSittingFeeSettings(data.settings || [])
      } else {
        throw new Error(data.error || 'Gagal mengambil pengaturan uang duduk')
      }
    } catch (error) {
      console.error('Error fetching sitting fee settings:', error)
      throw error
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

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Data uang duduk berhasil ditambahkan')
        await fetchSittingFees()
        resetManualForm()
      } else {
        toast.error(data.error || 'Gagal menambahkan data uang duduk')
      }
    } catch (error) {
      console.error('Error saving manual sitting fee:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSittingFee) return
    
    setLoading(true)

    try {
      const selectedDoctor = doctors.find(doc => doc.id === editFormData.doctorId)
      if (!selectedDoctor) {
        toast.error('Pilih dokter terlebih dahulu')
        setLoading(false)
        return
      }

      const sittingFeeData = {
        doctorId: editFormData.doctorId,
        doctorName: selectedDoctor.name,
        shift: editFormData.shift,
        amount: parseFloat(editFormData.amount) || 0,
        date: editFormData.date,
        isManual: editingSittingFee.isManual
      }

      const response = await fetch(`${serverUrl}/sitting-fees/${editingSittingFee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(sittingFeeData)
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Data uang duduk berhasil diperbarui')
        await fetchSittingFees()
        resetEditForm()
      } else {
        toast.error(data.error || 'Gagal memperbarui data uang duduk')
      }
    } catch (error) {
      console.error('Error updating sitting fee:', error)
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
        const response = await fetch(`${serverUrl}/doctor-sitting-fee-settings/${editingSetting.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(settingData)
        })

        const data = await response.json()
        if (response.ok && data.success) {
          toast.success('Pengaturan uang duduk berhasil diperbarui')
          await fetchSittingFeeSettings()
          resetSettingsForm()
        } else {
          toast.error(data.error || 'Gagal memperbarui pengaturan uang duduk')
        }
      } else {
        const existingSetting = sittingFeeSettings.find(
          s => s.doctorId === settingsFormData.doctorId && s.shift === settingsFormData.shift
        )

        if (existingSetting) {
          toast.error('Pengaturan untuk dokter dan shift ini sudah ada')
          setLoading(false)
          return
        }

        const response = await fetch(`${serverUrl}/doctor-sitting-fee-settings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(settingData)
        })

        const data = await response.json()
        if (response.ok && data.success) {
          toast.success('Pengaturan uang duduk berhasil ditambahkan')
          await fetchSittingFeeSettings()
          resetSettingsForm()
        } else {
          toast.error(data.error || 'Gagal menambahkan pengaturan uang duduk')
        }
      }
    } catch (error) {
      console.error('Error saving sitting fee setting:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleEditSittingFee = (sittingFee: SittingFee) => {
    setEditingSittingFee(sittingFee)
    setEditFormData({
      doctorId: sittingFee.doctorId,
      shift: sittingFee.shift,
      amount: sittingFee.amount.toString(),
      date: sittingFee.date
    })
    setEditDialogOpen(true)
  }

  const handleDeleteSittingFee = async (sittingFeeId: string) => {
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

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Data uang duduk berhasil dihapus')
        await fetchSittingFees()
      } else {
        toast.error(data.error || 'Gagal menghapus data uang duduk')
      }
    } catch (error) {
      console.error('Error deleting sitting fee:', error)
      toast.error('Terjadi kesalahan sistem')
    }
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

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Pengaturan uang duduk berhasil dihapus')
        await fetchSittingFeeSettings()
      } else {
        toast.error(data.error || 'Gagal menghapus pengaturan uang duduk')
      }
    } catch (error) {
      console.error('Error deleting sitting fee setting:', error)
      toast.error('Terjadi kesalahan sistem')
    }
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

  const resetEditForm = () => {
    setEditFormData({
      doctorId: '',
      shift: '',
      amount: '',
      date: ''
    })
    setEditingSittingFee(null)
    setEditDialogOpen(false)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  if (dataLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-pink-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
                <span className="text-pink-600">Memuat data uang duduk...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Gagal Memuat Data</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button 
                  onClick={loadData}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={dataLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            <div className="flex gap-2">
              <Button 
                onClick={loadData}
                variant="outline"
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
                disabled={dataLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
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
                  Tambah Data Manual
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
                    {sittingFees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-4">
                            <Clock className="h-12 w-12 text-gray-300" />
                            <div className="text-center">
                              <p className="text-gray-500 mb-4">Belum ada data uang duduk</p>
                              <Button 
                                onClick={() => setManualDialogOpen(true)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Tambah Data Manual
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sittingFees.map((sittingFee) => (
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
                                onClick={() => handleEditSittingFee(sittingFee)}
                                className="border-pink-200 text-pink-600 hover:bg-pink-50"
                                title="Edit data uang duduk"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteSittingFee(sittingFee.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                title="Hapus data uang duduk"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-pink-600">
                  Pengaturan default nominal uang duduk per dokter dan shift
                </p>
                <Button 
                  onClick={() => {
                    resetSettingsForm()
                    setSettingsDialogOpen(true)
                  }}
                  size="sm"
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Pengaturan
                </Button>
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
                    {sittingFeeSettings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="flex flex-col items-center gap-4">
                            <Settings className="h-12 w-12 text-gray-300" />
                            <div className="text-center">
                              <p className="text-gray-500 mb-4">Belum ada pengaturan default</p>
                              <Button 
                                onClick={() => {
                                  resetSettingsForm()
                                  setSettingsDialogOpen(true)
                                }}
                                className="bg-pink-600 hover:bg-pink-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Pengaturan
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      sittingFeeSettings.map((setting) => (
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Manual Entry Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800">Tambah Data Uang Duduk Manual</DialogTitle>
            <DialogDescription className="text-pink-600">
              Tambahkan data uang duduk manual untuk dokter dan tanggal tertentu.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-doctor" className="text-pink-700">Dokter</Label>
              <Select 
                value={manualFormData.doctorId} 
                onValueChange={(value) => setManualFormData({ ...manualFormData, doctorId: value })}
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
              <Label htmlFor="manual-shift" className="text-pink-700">Shift</Label>
              <Select 
                value={manualFormData.shift} 
                onValueChange={(value) => setManualFormData({ ...manualFormData, shift: value })}
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
              <Label htmlFor="manual-date" className="text-pink-700">Tanggal</Label>
              <Input
                id="manual-date"
                type="date"
                value={manualFormData.date}
                onChange={(e) => setManualFormData({ ...manualFormData, date: e.target.value })}
                required
                className="border-pink-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-amount" className="text-pink-700">Nominal</Label>
              <Input
                id="manual-amount"
                type="number"
                value={manualFormData.amount}
                onChange={(e) => setManualFormData({ ...manualFormData, amount: e.target.value })}
                required
                className="border-pink-200"
                placeholder="0"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetManualForm}
                className="flex-1 border-pink-200 text-pink-600"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Sitting Fee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800">Edit Data Uang Duduk</DialogTitle>
            <DialogDescription className="text-pink-600">
              Perbarui data uang duduk untuk dokter dan tanggal tertentu.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-doctor" className="text-pink-700">Dokter</Label>
              <Select 
                value={editFormData.doctorId} 
                onValueChange={(value) => setEditFormData({ ...editFormData, doctorId: value })}
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
              <Label htmlFor="edit-shift" className="text-pink-700">Shift</Label>
              <Select 
                value={editFormData.shift} 
                onValueChange={(value) => setEditFormData({ ...editFormData, shift: value })}
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
              <Label htmlFor="edit-date" className="text-pink-700">Tanggal</Label>
              <Input
                id="edit-date"
                type="date"
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                required
                className="border-pink-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount" className="text-pink-700">Nominal</Label>
              <Input
                id="edit-amount"
                type="number"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                required
                className="border-pink-200"
                placeholder="0"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetEditForm}
                className="flex-1 border-pink-200 text-pink-600"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-pink-600 hover:bg-pink-700"
              >
                {loading ? 'Menyimpan...' : 'Update'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pink-800">
              {editingSetting ? 'Edit Pengaturan Uang Duduk' : 'Tambah Pengaturan Uang Duduk'}
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
  )
}