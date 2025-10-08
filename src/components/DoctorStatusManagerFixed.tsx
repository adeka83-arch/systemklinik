import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'
import { processValidDoctors } from '../utils/doctorNameCleaner'
import { Trash2, CheckCircle, XCircle, UserCheck, UserX, Plus, Edit, RefreshCw, Stethoscope, Users, Key } from 'lucide-react'

interface Doctor {
  id: string
  name: string
  specialization?: string
  email?: string
  phone?: string
  licenseNumber?: string
  shifts?: string[]
  status?: 'active' | 'inactive'
  isActive?: boolean
  statusUpdatedAt?: string
  statusUpdatedBy?: string
  createdAt: string
}

interface Employee {
  id: string
  name: string
  position?: string
  email?: string
  phone?: string
  joinDate?: string
  status?: 'active' | 'inactive'
  authUserId?: string
  hasLoginAccess?: boolean
  role?: string
  isActive?: boolean
  statusUpdatedAt?: string
  statusUpdatedBy?: string
  createdAt: string
}

interface DoctorStatusManagerProps {
  accessToken: string
}

const availableShifts = [
  { id: '09:00-15:00', label: 'Shift Pagi (09:00-15:00)' },
  { id: '18:00-20:00', label: 'Shift Sore (18:00-20:00)' }
]

export function DoctorStatusManager({ accessToken }: DoctorStatusManagerProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'doctors' | 'employees'>('doctors')
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Form states
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false)
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  
  // Doctor form data
  const [doctorFormData, setDoctorFormData] = useState({
    name: '',
    specialization: '',
    phone: '',
    email: '',
    licenseNumber: '',
    shifts: [] as string[],
    status: 'active' as 'active' | 'inactive'
  })
  
  // Employee form data
  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    password: '',
    joinDate: '',
    status: 'active' as 'active' | 'inactive'
  })

  useEffect(() => {
    fetchDoctors()
    fetchEmployees()
  }, [])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching doctors from:', `${serverUrl}/doctors`)
      console.log('🔑 Using access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'Missing')
      
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      console.log('📡 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response error:', errorText)
        throw new Error(`Failed to fetch doctors: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📊 Raw response data:', data)
      
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
      
      console.log('👨‍⚕️ Raw doctors found:', rawDoctors.length)
      console.log('👨‍⚕️ Raw doctors data:', rawDoctors)
      
      // Clean doctor names from duplicate drg. prefix using utility function
      const cleanedDoctors = processValidDoctors(rawDoctors)
      console.log('✅ Cleaned doctors:', cleanedDoctors.length)
      
      setDoctors(cleanedDoctors)
    } catch (error) {
      console.error('💥 Error fetching doctors:', error)
      toast.error(`Gagal mengambil data dokter: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${serverUrl}/employees`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }
      
      const data = await response.json()
      setEmployees(data.employees || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Gagal mengambil data karyawan')
    } finally {
      setLoading(false)
    }
  }

  const updateDoctorStatus = async (doctorId: string, isActive: boolean) => {
    try {
      const response = await fetch(`${serverUrl}/doctors/${doctorId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update doctor status')
      }

      const data = await response.json()
      toast.success(data.message)
      
      // Update local state
      setDoctors(prev => prev.map(doctor => 
        doctor.id === doctorId 
          ? { ...doctor, isActive, statusUpdatedAt: new Date().toISOString() }
          : doctor
      ))
    } catch (error) {
      console.error('Error updating doctor status:', error)
      toast.error('Gagal mengupdate status dokter')
    }
  }

  const updateEmployeeStatus = async (employeeId: string, isActive: boolean) => {
    try {
      const response = await fetch(`${serverUrl}/employees/${employeeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update employee status')
      }

      const data = await response.json()
      toast.success(data.message)
      
      // Update local state
      setEmployees(prev => prev.map(employee => 
        employee.id === employeeId 
          ? { ...employee, isActive, statusUpdatedAt: new Date().toISOString() }
          : employee
      ))
    } catch (error) {
      console.error('Error updating employee status:', error)
      toast.error('Gagal mengupdate status karyawan')
    }
  }

  const deleteDoctor = async (doctorId: string, doctorName: string) => {
    try {
      setDeleting(doctorId)
      const response = await fetch(`${serverUrl}/doctors/${doctorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete doctor')
      }

      const data = await response.json()
      toast.success(`Dokter ${doctorName} berhasil dihapus`)
      
      // Remove from local state
      setDoctors(prev => prev.filter(doctor => doctor.id !== doctorId))
    } catch (error) {
      console.error('Error deleting doctor:', error)
      toast.error(`Gagal menghapus dokter: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleting(null)
    }
  }

  const deleteEmployee = async (employeeId: string, employeeName: string) => {
    try {
      setDeleting(employeeId)
      const response = await fetch(`${serverUrl}/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete employee')
      }

      const data = await response.json()
      toast.success(`Karyawan ${employeeName} berhasil dihapus`)
      
      // Remove from local state
      setEmployees(prev => prev.filter(employee => employee.id !== employeeId))
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error(`Gagal menghapus karyawan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setDeleting(null)
    }
  }

  // Doctor form functions
  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('📝 Doctor form data being submitted:', doctorFormData)
      console.log('✏️ Editing doctor:', editingDoctor)
      
      // Prepare the data payload matching the expected interface
      const doctorPayload = {
        name: doctorFormData.name,
        specialization: doctorFormData.specialization,
        phone: doctorFormData.phone,
        email: doctorFormData.email,
        licenseNumber: doctorFormData.licenseNumber,
        shifts: doctorFormData.shifts,
        status: doctorFormData.status
      }

      console.log('📦 Prepared payload:', doctorPayload)
      
      if (editingDoctor) {
        // Update existing doctor
        console.log('🔄 Updating doctor with ID:', editingDoctor.id)
        const response = await fetch(`${serverUrl}/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(doctorPayload)
        })

        console.log('📡 Update response status:', response.status)
        
        const responseData = await response.json()
        console.log('📊 Update response data:', responseData)
        
        if (response.ok) {
          console.log('✅ Update successful:', responseData)
          toast.success(responseData.message || `✅ Data dokter ${doctorFormData.name} berhasil diperbarui`)
          await fetchDoctors() // Refresh data
          resetDoctorForm()
        } else {
          console.error('❌ Update failed:', responseData)
          toast.error(responseData.error || 'Gagal memperbarui data dokter')
        }
      } else {
        // Create new doctor
        console.log('➕ Creating new doctor')
        const response = await fetch(`${serverUrl}/doctors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(doctorPayload)
        })

        console.log('📡 Create response status:', response.status)

        const responseData = await response.json()
        console.log('📊 Create response data:', responseData)

        if (response.ok) {
          console.log('✅ Create successful:', responseData)
          toast.success(responseData.message || `✅ Dokter ${doctorFormData.name} berhasil ditambahkan ke sistem`)
          await fetchDoctors() // Refresh data
          resetDoctorForm()
        } else {
          console.error('❌ Create failed:', responseData)
          toast.error(responseData.error || 'Gagal menambahkan dokter')
        }
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error)
      toast.error(`Terjadi kesalahan sistem: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditDoctor = (doctor: Doctor) => {
    console.log('✏️ Starting to edit doctor:', doctor)
    setEditingDoctor(doctor)
    
    const formData = {
      name: doctor.name || '',
      specialization: doctor.specialization || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      licenseNumber: doctor.licenseNumber || '',
      shifts: doctor.shifts || [],
      status: doctor.status || 'active'
    }
    
    console.log('📝 Setting form data:', formData)
    setDoctorFormData(formData)
    setDoctorDialogOpen(true)
  }

  const handleShiftChange = (shiftId: string, checked: boolean) => {
    if (checked) {
      setDoctorFormData(prev => ({ ...prev, shifts: [...prev.shifts, shiftId] }))
    } else {
      setDoctorFormData(prev => ({ ...prev, shifts: prev.shifts.filter(s => s !== shiftId) }))
    }
  }

  const resetDoctorForm = () => {
    console.log('🔄 Resetting doctor form')
    setDoctorFormData({
      name: '',
      specialization: '',
      phone: '',
      email: '',
      licenseNumber: '',
      shifts: [],
      status: 'active'
    })
    setEditingDoctor(null)
    setDoctorDialogOpen(false)
  }

  // Employee form functions
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('📝 Employee form data being submitted:', employeeFormData)
      console.log('✏️ Editing employee:', editingEmployee)
      
      // Validation for new employees
      if (!editingEmployee) {
        if (!employeeFormData.email) {
          toast.error('Email tidak boleh kosong')
          setLoading(false)
          return
        }
        
        if (!employeeFormData.password || employeeFormData.password.length < 6) {
          toast.error('Password minimal 6 karakter')
          setLoading(false)
          return
        }
      }

      if (editingEmployee) {
        // Update existing employee
        console.log('🔄 Updating employee with ID:', editingEmployee.id)
        const updateData = { ...employeeFormData }
        // Only send password if it's provided
        if (!employeeFormData.password) {
          delete updateData.password
        }

        const response = await fetch(`${serverUrl}/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updateData)
        })

        console.log('📡 Update response status:', response.status)
        
        const data = await response.json()
        if (response.ok) {
          console.log('✅ Update successful:', data)
          toast.success(data.message || 'Data karyawan berhasil diperbarui')
          await fetchEmployees() // Refresh data
          resetEmployeeForm()
        } else {
          console.error('❌ Update failed:', data)
          toast.error(data.error || 'Gagal memperbarui data karyawan')
        }
      } else {
        // Create new employee
        console.log('➕ Creating new employee')
        const response = await fetch(`${serverUrl}/employees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(employeeFormData)
        })

        console.log('📡 Create response status:', response.status)

        const data = await response.json()
        if (response.ok) {
          console.log('✅ Create successful:', data)
          toast.success(data.message || 'Karyawan berhasil ditambahkan dengan akses login')
          await fetchEmployees() // Refresh data
          resetEmployeeForm()
        } else {
          console.error('❌ Create failed:', data)
          toast.error(data.error || 'Gagal menambahkan karyawan')
        }
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    console.log('✏️ Starting to edit employee:', employee)
    setEditingEmployee(employee)
    
    const formData = {
      name: employee.name || '',
      position: employee.position || '',
      phone: employee.phone || '',
      email: employee.email || '',
      password: '', // Don't pre-fill password for security
      joinDate: employee.joinDate || '',
      status: employee.status || 'active'
    }
    
    console.log('📝 Setting employee form data:', formData)
    setEmployeeFormData(formData)
    setEmployeeDialogOpen(true)
  }

  const resetEmployeeForm = () => {
    console.log('🔄 Resetting employee form')
    setEmployeeFormData({
      name: '',
      position: '',
      phone: '',
      email: '',
      password: '',
      joinDate: '',
      status: 'active'
    })
    setEditingEmployee(null)
    setEmployeeDialogOpen(false)
  }

  const getStatusBadge = (isActive?: boolean) => {
    if (isActive === false) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Non-Aktif
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-600 text-white">
        <CheckCircle className="h-3 w-3" />
        Aktif
      </Badge>
    )
  }

  const activeDoctors = doctors.filter(d => d.isActive !== false)
  const inactiveDoctors = doctors.filter(d => d.isActive === false)
  const activeEmployees = employees.filter(e => e.isActive !== false)
  const inactiveEmployees = employees.filter(e => e.isActive === false)

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{activeDoctors.length}</p>
                <p className="text-sm text-muted-foreground">Dokter Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserX className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{inactiveDoctors.length}</p>
                <p className="text-sm text-muted-foreground">Dokter Non-Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{activeEmployees.length}</p>
                <p className="text-sm text-muted-foreground">Karyawan Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserX className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{inactiveEmployees.length}</p>
                <p className="text-sm text-muted-foreground">Karyawan Non-Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b">
        <Button 
          variant={activeTab === 'doctors' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('doctors')}
          className="rounded-b-none"
        >
          <Stethoscope className="h-4 w-4 mr-2" />
          Dokter ({doctors.length})
        </Button>
        <Button 
          variant={activeTab === 'employees' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('employees')}
          className="rounded-b-none"
        >
          <Users className="h-4 w-4 mr-2" />
          Karyawan ({employees.length})
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {activeTab === 'doctors' ? (
                  <>
                    <Stethoscope className="h-5 w-5" />
                    Manajemen Dokter & Status
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5" />
                    Manajemen Karyawan & Status
                    <Key className="h-4 w-4 text-blue-600" title="Karyawan mendapat akses login sistem" />
                  </>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {activeTab === 'doctors' 
                  ? 'Kelola data dokter dan status aktif/non-aktif mereka'
                  : 'Kelola data karyawan dengan akses login otomatis sebagai Administrator'
                }
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (activeTab === 'doctors') {
                    fetchDoctors()
                  } else {
                    fetchEmployees()
                  }
                }}
                disabled={loading}
                variant="outline"
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {activeTab === 'doctors' ? (
                <Dialog open={doctorDialogOpen} onOpenChange={setDoctorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        console.log('🆕 Opening new doctor dialog')
                        resetDoctorForm()
                      }}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Dokter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                    <form onSubmit={handleDoctorSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="doctorName" className="text-pink-700">Nama Lengkap</Label>
                          <Input
                            id="doctorName"
                            value={doctorFormData.name}
                            onChange={(e) => setDoctorFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            className="border-pink-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="doctorSpecialization" className="text-pink-700">Spesialisasi</Label>
                          <Input
                            id="doctorSpecialization"
                            value={doctorFormData.specialization}
                            onChange={(e) => setDoctorFormData(prev => ({ ...prev, specialization: e.target.value }))}
                            required
                            className="border-pink-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="doctorPhone" className="text-pink-700">No. Telepon</Label>
                          <Input
                            id="doctorPhone"
                            value={doctorFormData.phone}
                            onChange={(e) => setDoctorFormData(prev => ({ ...prev, phone: e.target.value }))}
                            required
                            className="border-pink-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="doctorLicense" className="text-pink-700">No. SIP</Label>
                          <Input
                            id="doctorLicense"
                            value={doctorFormData.licenseNumber}
                            onChange={(e) => setDoctorFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                            required
                            className="border-pink-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="doctorEmail" className="text-pink-700">Email</Label>
                        <Input
                          id="doctorEmail"
                          type="email"
                          value={doctorFormData.email}
                          onChange={(e) => setDoctorFormData(prev => ({ ...prev, email: e.target.value }))}
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
                                id={`doctor-${shift.id}`}
                                checked={doctorFormData.shifts.includes(shift.id)}
                                onCheckedChange={(checked) => handleShiftChange(shift.id, !!checked)}
                              />
                              <Label htmlFor={`doctor-${shift.id}`} className="text-sm text-pink-700">
                                {shift.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-pink-600 hover:bg-pink-700"
                        >
                          {loading ? 'Menyimpan...' : editingDoctor ? 'Perbarui' : 'Tambah'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            console.log('❌ Cancel button clicked')
                            resetDoctorForm()
                          }}
                          className="flex-1 border-pink-200"
                        >
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        console.log('🆕 Opening new employee dialog')
                        resetEmployeeForm()
                      }}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Karyawan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-pink-800">
                        {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
                      </DialogTitle>
                      <DialogDescription className="text-pink-600">
                        {editingEmployee 
                          ? 'Perbarui informasi karyawan yang dipilih.' 
                          : 'Lengkapi form berikut untuk menambahkan karyawan baru dengan akses login Administrator.'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="employeeName" className="text-pink-700">Nama Lengkap</Label>
                          <Input
                            id="employeeName"
                            value={employeeFormData.name}
                            onChange={(e) => setEmployeeFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                            className="border-pink-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="employeePosition" className="text-pink-700">Posisi/Jabatan</Label>
                          <Input
                            id="employeePosition"
                            value={employeeFormData.position}
                            onChange={(e) => setEmployeeFormData(prev => ({ ...prev, position: e.target.value }))}
                            required
                            className="border-pink-200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="employeePhone" className="text-pink-700">No. Telepon</Label>
                          <Input
                            id="employeePhone"
                            value={employeeFormData.phone}
                            onChange={(e) => setEmployeeFormData(prev => ({ ...prev, phone: e.target.value }))}
                            required
                            className="border-pink-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="employeeJoinDate" className="text-pink-700">Tanggal Bergabung</Label>
                          <Input
                            id="employeeJoinDate"
                            type="date"
                            value={employeeFormData.joinDate}
                            onChange={(e) => setEmployeeFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                            className="border-pink-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employeeEmail" className="text-pink-700">Email (untuk login)</Label>
                        <Input
                          id="employeeEmail"
                          type="email"
                          value={employeeFormData.email}
                          onChange={(e) => setEmployeeFormData(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="border-pink-200"
                          placeholder="Email untuk akses login"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employeePassword" className="text-pink-700">
                          Password {editingEmployee ? '(kosongkan jika tidak diubah)' : '(minimal 6 karakter)'}
                        </Label>
                        <Input
                          id="employeePassword"
                          type="password"
                          value={employeeFormData.password}
                          onChange={(e) => setEmployeeFormData(prev => ({ ...prev, password: e.target.value }))}
                          required={!editingEmployee}
                          className="border-pink-200"
                          placeholder={editingEmployee ? "Password baru (opsional)" : "Password untuk login"}
                          minLength={editingEmployee ? 0 : 6}
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-pink-600 hover:bg-pink-700"
                        >
                          {loading ? 'Menyimpan...' : editingEmployee ? 'Perbarui' : 'Tambah'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            console.log('❌ Cancel button clicked')
                            resetEmployeeForm()
                          }}
                          className="flex-1 border-pink-200"
                        >
                          Batal
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    {activeTab === 'doctors' ? (
                      <>
                        <TableHead>Spesialisasi</TableHead>
                        <TableHead>No. SIP</TableHead>
                        <TableHead>Shift</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead>Posisi</TableHead>
                        <TableHead>Tanggal Bergabung</TableHead>
                        <TableHead>Login</TableHead>
                      </>
                    )}
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activeTab === 'doctors' ? doctors : employees).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={activeTab === 'doctors' ? 8 : 8} className="text-center py-8 text-gray-500">
                        Belum ada data {activeTab === 'doctors' ? 'dokter' : 'karyawan'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (activeTab === 'doctors' ? doctors : employees).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        {activeTab === 'doctors' ? (
                          <>
                            <TableCell>{(item as Doctor).specialization || '-'}</TableCell>
                            <TableCell>{(item as Doctor).licenseNumber || '-'}</TableCell>
                            <TableCell>
                              {(item as Doctor).shifts && (item as Doctor).shifts.length > 0 ? (
                                <div className="space-y-1">
                                  {(item as Doctor).shifts.map(shift => (
                                    <Badge key={shift} variant="outline" className="text-xs">
                                      {shift}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{(item as Employee).position || '-'}</TableCell>
                            <TableCell>
                              {(item as Employee).joinDate 
                                ? new Date((item as Employee).joinDate).toLocaleDateString('id-ID')
                                : '-'
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-blue-600 text-white">
                                <Key className="h-3 w-3 mr-1" />
                                Administrator
                              </Badge>
                            </TableCell>
                          </>
                        )}
                        <TableCell>{item.email || '-'}</TableCell>
                        <TableCell>{item.phone || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(item.isActive)}
                            <Switch
                              checked={item.isActive !== false}
                              onCheckedChange={(checked) => {
                                if (activeTab === 'doctors') {
                                  updateDoctorStatus(item.id, checked)
                                } else {
                                  updateEmployeeStatus(item.id, checked)
                                }
                              }}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                console.log('✏️ Edit button clicked for:', item.name)
                                if (activeTab === 'doctors') {
                                  handleEditDoctor(item as Doctor)
                                } else {
                                  handleEditEmployee(item as Employee)
                                }
                              }}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={deleting === item.id}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus {activeTab === 'doctors' ? 'dokter' : 'karyawan'} <strong>{item.name}</strong>?
                                    Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      if (activeTab === 'doctors') {
                                        deleteDoctor(item.id, item.name)
                                      } else {
                                        deleteEmployee(item.id, item.name)
                                      }
                                    }}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}