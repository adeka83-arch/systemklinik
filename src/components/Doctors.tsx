import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Checkbox } from './ui/checkbox'
import { Plus, Edit, Trash2, Stethoscope, RefreshCw } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { processValidDoctors } from '../utils/doctorNameCleaner'

interface Doctor {
  id: string
  name: string
  specialization: string
  phone: string
  email: string
  licenseNumber: string
  shifts: string[]
  status: 'active' | 'inactive'
  createdAt: string
}

interface DoctorsProps {
  accessToken: string
}

const availableShifts = [
  { id: '09:00-15:00', label: 'Shift Pagi (09:00-15:00)' },
  { id: '18:00-20:00', label: 'Shift Sore (18:00-20:00)' }
]

export function Doctors({ accessToken }: DoctorsProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    phone: '',
    email: '',
    licenseNumber: '',
    shifts: [] as string[],
    status: 'active' as 'active' | 'inactive'
  })

  useEffect(() => {
    let mounted = true
    
    const initializeComponent = async () => {
      if (!accessToken) {
        setInitialLoading(false)
        return
      }

      try {
        console.log('Initializing Doctors component...')
        
        // Set timeout for component initialization
        const initTimeout = setTimeout(() => {
          if (mounted) {
            console.log('Doctors component initialization timeout, forcing render')
            setInitialLoading(false)
            toast.error('Timeout saat memuat data dokter, silakan refresh manual')
          }
        }, 8000) // 8 second timeout
        
        await fetchDoctors()
        
        if (mounted) {
          clearTimeout(initTimeout)
        }
      } catch (error) {
        console.error('Doctors component initialization failed:', error)
        if (mounted) {
          setInitialLoading(false)
          toast.error('Gagal menginisialisasi komponen dokter')
        }
      }
    }

    initializeComponent()

    return () => {
      mounted = false
    }
  }, [accessToken])

  const fetchDoctors = async () => {
    try {
      if (!accessToken) {
        console.log('No access token, skipping fetch')
        setInitialLoading(false)
        return
      }
      
      console.log('Fetching doctors data...')
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timeout')), 5000)
      )
      
      // Create fetch promise
      const fetchPromise = fetch(`${serverUrl}/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Doctors data received:', data)
      
      // Handle different response formats from server
      let rawDoctors = []
      if (Array.isArray(data)) {
        rawDoctors = data
      } else if (data.doctors && Array.isArray(data.doctors)) {
        rawDoctors = data.doctors
      } else if (data.success && data.doctors) {
        rawDoctors = data.doctors
      } else {
        rawDoctors = []
      }
      
      console.log('Processing doctors:', rawDoctors.length)
      
      // Clean doctor names from duplicate drg. prefix using utility function
      const cleanedDoctors = processValidDoctors(rawDoctors)
      setDoctors(cleanedDoctors)
      
      console.log('Doctors loaded successfully:', cleanedDoctors.length)
      
    } catch (error) {
      console.error('Error fetching doctors:', error)
      
      let errorMessage = 'Gagal mengambil data dokter'
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Fetch timeout')) {
          errorMessage = 'Timeout - server tidak merespons dalam 5 detik'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      // Don't show error toast for initial load timeout
      if (!initialLoading) {
        toast.error(errorMessage)
      }
      
      // Set empty array to show "no data" message
      setDoctors([])
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingDoctor) {
        // Update existing doctor
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, 10000) // 10 second timeout for update

        const response = await fetch(`${serverUrl}/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(formData)
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          toast.success(`✅ Data dokter ${formData.name} berhasil diperbarui`)
          fetchDoctors()
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal memperbarui data dokter')
        }
      } else {
        // Create new doctor
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
          controller.abort()
        }, 15000) // 15 second timeout for create

        const response = await fetch(`${serverUrl}/doctors`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(formData)
        })
        
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          toast.success(`✅ Dokter ${formData.name} berhasil ditambahkan ke sistem`)
          fetchDoctors()
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal menambahkan dokter')
        }
      }
    } catch (error) {
      let errorMessage = 'Terjadi kesalahan sistem'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - server tidak merespons dalam waktu yang ditentukan'
        } else {
          errorMessage = `Terjadi kesalahan: ${error.message}`
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (doctorId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokter ini?')) {
      return
    }

    try {
      const response = await fetch(`${serverUrl}/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        toast.success('Dokter berhasil dihapus')
        fetchDoctors()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus dokter')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem')
    }
  }

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setFormData({
      name: doctor.name,
      specialization: doctor.specialization,
      phone: doctor.phone,
      email: doctor.email,
      licenseNumber: doctor.licenseNumber,
      shifts: doctor.shifts || [],
      status: doctor.status
    })
    setDialogOpen(true)
  }

  const handleShiftChange = (shiftId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, shifts: [...formData.shifts, shiftId] })
    } else {
      setFormData({ ...formData, shifts: formData.shifts.filter(s => s !== shiftId) })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      specialization: '',
      phone: '',
      email: '',
      licenseNumber: '',
      shifts: [],
      status: 'active'
    })
    setEditingDoctor(null)
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-pink-800 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Manajemen Dokter
              </CardTitle>
              <p className="text-sm text-pink-600 mt-1">
                Kelola data dokter dan informasi profil mereka
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setInitialLoading(true)
                  fetchDoctors()
                }}
                disabled={loading || initialLoading}
                variant="outline"
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loading || initialLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => resetForm()}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Dokter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-pink-800">
                      {editingDoctor ? 'Edit Dokter' : 'Tambah Dokter Baru'}
                    </DialogTitle>
                    <DialogDescription className="text-pink-600">
                      {editingDoctor 
                        ? 'Perbarui informasi dokter yang dipilih.' 
                        : 'Lengkapi form berikut untuk menambahkan dokter baru ke sistem.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-pink-700">Nama Lengkap</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="border-pink-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specialization" className="text-pink-700">Spesialisasi</Label>
                        <Input
                          id="specialization"
                          value={formData.specialization}
                          onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                          required
                          className="border-pink-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-pink-700">No. Telepon</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="border-pink-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber" className="text-pink-700">No. SIP</Label>
                        <Input
                          id="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                          required
                          className="border-pink-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-pink-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="border-pink-200 focus:border-pink-400"
                        placeholder="Email dokter"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-pink-700">Shift Kerja</Label>
                      <div className="space-y-2">
                        {availableShifts.map((shift) => (
                          <div key={shift.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={shift.id}
                              checked={formData.shifts.includes(shift.id)}
                              onCheckedChange={(checked) => handleShiftChange(shift.id, !!checked)}
                            />
                            <Label htmlFor={shift.id} className="text-sm text-pink-700">
                              {shift.label}
                            </Label>
                          </div>
                        ))}
                      </div>
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
                        {loading ? 'Menyimpan...' : (editingDoctor ? 'Update' : 'Simpan')}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-pink-700">Nama</TableHead>
                  <TableHead className="text-pink-700">Spesialisasi</TableHead>
                  <TableHead className="text-pink-700">No. SIP</TableHead>
                  <TableHead className="text-pink-700">Telepon</TableHead>
                  <TableHead className="text-pink-700">Email</TableHead>
                  <TableHead className="text-pink-700">Shift</TableHead>
                  <TableHead className="text-pink-700">Status</TableHead>
                  <TableHead className="text-pink-700">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>{doctor.name}</TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell>{doctor.licenseNumber}</TableCell>
                    <TableCell>{doctor.phone}</TableCell>
                    <TableCell>{doctor.email}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {doctor.shifts?.map((shift) => (
                          <span key={shift} className="block text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">
                            {shift}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        doctor.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doctor.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(doctor)}
                          className="border-pink-200 text-pink-600 hover:bg-pink-50"
                          title="Edit dokter"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(doctor.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          title="Hapus dokter"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {initialLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-pink-600">Memuat data dokter...</p>
                <p className="text-xs text-gray-500 mt-2">
                  Jika loading terlalu lama, klik tombol Refresh
                </p>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-8 text-pink-600">
                <Stethoscope className="h-12 w-12 mx-auto mb-4 text-pink-300" />
                <p className="text-lg mb-2">Belum ada data dokter</p>
                <p className="text-sm text-pink-500 mb-4">
                  Klik tombol "Tambah Dokter" untuk menambahkan dokter pertama
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setInitialLoading(true)
                      fetchDoctors()
                    }}
                    variant="outline"
                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Coba Muat Ulang Data
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}