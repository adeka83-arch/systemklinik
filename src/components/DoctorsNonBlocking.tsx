import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Checkbox } from './ui/checkbox'
import { Plus, Edit, Trash2, Stethoscope, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

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

export function DoctorsNonBlocking({ accessToken }: DoctorsProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)
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

  // Non-blocking data fetch
  useEffect(() => {
    if (accessToken) {
      // Start background fetch immediately without blocking render
      fetchDoctorsBackground()
    }
  }, [accessToken])

  const fetchDoctorsBackground = async () => {
    try {
      console.log('Starting background doctor fetch...')
      
      const response = await Promise.race([
        fetch(`${serverUrl}/doctors`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Background fetch timeout')), 3000)
        )
      ]) as Response
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Background doctors data received:', data)
      
      // Handle different response formats
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
      
      // Simple filtering - no complex processing to avoid delays
      const validDoctors = rawDoctors.filter(doctor => 
        doctor && doctor.name && doctor.id
      )
      
      setDoctors(validDoctors)
      setDataLoaded(true)
      setLoadingError(null)
      console.log('Background doctors loaded successfully:', validDoctors.length)
      
    } catch (error) {
      console.error('Background doctor fetch failed:', error)
      setLoadingError(error.message)
      setDataLoaded(true) // Still mark as loaded so user can see error state
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    setLoadingError(null)
    try {
      await fetchDoctorsBackground()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const method = editingDoctor ? 'PUT' : 'POST'
      const url = editingDoctor 
        ? `${serverUrl}/doctors/${editingDoctor.id}`
        : `${serverUrl}/doctors`

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingDoctor 
          ? `✅ Data dokter ${formData.name} berhasil diperbarui`
          : `✅ Dokter ${formData.name} berhasil ditambahkan`
        )
        await fetchDoctorsBackground()
        resetForm()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menyimpan data dokter')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat menyimpan data')
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
        await fetchDoctorsBackground()
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
                onClick={handleRefresh}
                disabled={loading}
                variant="outline"
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
            {!dataLoaded ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-pink-600">Memuat data dokter...</p>
                <p className="text-xs text-gray-500 mt-2">
                  Data sedang dimuat di background
                </p>
              </div>
            ) : loadingError ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <p className="text-red-600 mb-2">Gagal memuat data dokter</p>
                <p className="text-sm text-gray-500 mb-4">{loadingError}</p>
                <Button onClick={handleRefresh} variant="outline" className="border-pink-200 text-pink-600">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
              </div>
            ) : (
              <>
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
                
                {doctors.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    <Stethoscope className="h-12 w-12 mx-auto mb-4 text-pink-300" />
                    <p className="text-lg mb-2">Belum ada data dokter</p>
                    <p className="text-sm text-pink-500 mb-4">
                      Klik tombol "Tambah Dokter" untuk menambahkan dokter pertama
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}