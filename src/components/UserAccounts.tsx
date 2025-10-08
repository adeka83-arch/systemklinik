import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Users, UserPlus, Edit, Trash2, Eye, EyeOff, RefreshCw, Shield, Stethoscope, UserCheck, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { serverUrl } from '../utils/supabase/client'

interface UserAccountsProps {
  accessToken: string
}

interface Doctor {
  id: string
  name: string
  specialization: string
  email: string
  phone: string
  status: string
}

interface Employee {
  id: string
  name: string
  position: string
  email: string
  phone: string
  status: string
  access_level?: string
}

interface UserAccount {
  id: string
  name: string
  email: string
  phone: string
  role: 'doctor' | 'employee'
  position: string
  status: string
  access_level: 'Owner' | 'Co-owner' | 'Admin' | 'Dokter'
  has_login: boolean
  source_type: 'doctor' | 'employee'
  source_id: string
  username?: string
  password?: string
  created_at?: string
}

interface CreateUserForm {
  name: string
  email: string
  password: string
  role: 'doctor' | 'employee'
  access_level: 'Owner' | 'Co-owner' | 'Admin' | 'Dokter'
  source_id: string
}

export function UserAccounts({ accessToken }: UserAccountsProps) {
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterAccessLevel, setFilterAccessLevel] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    access_level: 'Admin',
    source_id: ''
  })

  useEffect(() => {
    fetchData()
  }, [accessToken])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchDoctors(),
        fetchEmployees(),
        fetchUserAccounts()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data user accounts')
    } finally {
      setLoading(false)
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

      if (response.ok) {
        const data = await response.json()
        // Filter out invalid doctors to prevent undefined properties
        const validDoctors = (data.doctors || []).filter((doctor: Doctor) => doctor && doctor.id)
        setDoctors(validDoctors)
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      setDoctors([]) // Ensure doctors is always an array
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${serverUrl}/employees`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Filter out invalid employees to prevent undefined properties
        const validEmployees = (data.employees || []).filter((employee: Employee) => employee && employee.id)
        setEmployees(validEmployees)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)  
      setEmployees([]) // Ensure employees is always an array
    }
  }

  const fetchUserAccounts = async () => {
    try {
      const response = await fetch(`${serverUrl}/user-accounts?include_credentials=true`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('User accounts data:', data)
        // Filter out invalid user accounts
        const validAccounts = (data.accounts || []).filter((account: UserAccount) => account && account.id)
        setUserAccounts(validAccounts)
      }
    } catch (error) {
      console.error('Error fetching user accounts:', error)
      setUserAccounts([]) // Ensure userAccounts is always an array
    }
  }

  const combineUserData = (): UserAccount[] => {
    const combined: UserAccount[] = []

    // Add doctors
    doctors.forEach(doctor => {
      // Skip if doctor doesn't have required fields
      if (!doctor || !doctor.id) return;
      
      const existingAccount = userAccounts.find(acc => 
        (acc.source_type === 'doctor' && acc.source_id === doctor.id) ||
        (acc.role === 'doctor' && acc.email === doctor.email)
      )
      
      combined.push({
        id: existingAccount?.id || `doctor-${doctor.id}`,
        name: doctor.name || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        role: 'doctor',
        position: doctor.specialization || '',
        status: doctor.status || 'active',
        access_level: existingAccount?.access_level || 'Dokter',
        has_login: !!existingAccount,
        source_type: 'doctor',
        source_id: doctor.id,
        username: existingAccount?.username,
        password: existingAccount?.password,
        created_at: existingAccount?.created_at || existingAccount?.createdAt
      })
    })

    // Add employees
    employees.forEach(employee => {
      // Skip if employee doesn't have required fields
      if (!employee || !employee.id) return;
      
      const existingAccount = userAccounts.find(acc => 
        (acc.source_type === 'employee' && acc.source_id === employee.id) ||
        (acc.role === 'employee' && acc.email === employee.email)
      )
      
      combined.push({
        id: existingAccount?.id || `employee-${employee.id}`,
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: 'employee',
        position: employee.position || '',
        status: employee.status || 'active',
        access_level: existingAccount?.access_level || employee.access_level || 'Admin',
        has_login: !!existingAccount,
        source_type: 'employee',
        source_id: employee.id,
        username: existingAccount?.username,
        password: existingAccount?.password,
        created_at: existingAccount?.created_at || existingAccount?.createdAt
      })
    })

    return combined
  }

  const filteredUsers = combineUserData().filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.position || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesAccessLevel = filterAccessLevel === 'all' || user.access_level === filterAccessLevel

    return matchesSearch && matchesRole && matchesAccessLevel
  })

  const handleCreateUser = async () => {
    try {
      console.log('Creating user with data:', createForm)
      
      // Validate form
      if (!createForm.source_id) {
        toast.error('Pilih dokter atau karyawan terlebih dahulu')
        return
      }
      
      if (!createForm.password) {
        toast.error('Password harus diisi')
        return
      }

      if (createForm.password.length < 6) {
        toast.error('Password minimal 6 karakter')
        return
      }

      const response = await fetch(`${serverUrl}/user-accounts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          role: createForm.role,
          access_level: createForm.access_level,
          source_id: createForm.source_id,
          source_type: createForm.role
        })
      })

      const data = await response.json()
      console.log('Create user response:', data)

      if (response.ok) {
        toast.success('User account berhasil dibuat')
        setShowCreateDialog(false)
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'employee',
          access_level: 'Admin',
          source_id: ''
        })
        await fetchUserAccounts()
      } else {
        console.error('Create user error:', data)
        toast.error(data.error || 'Gagal membuat user account')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Terjadi kesalahan saat membuat user account')
    }
  }

  const handleUpdateAccessLevel = async (userId: string, newAccessLevel: string) => {
    try {
      const response = await fetch(`${serverUrl}/user-accounts/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_level: newAccessLevel
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Access level berhasil diupdate')
        fetchUserAccounts()
      } else {
        toast.error(data.error || 'Gagal mengupdate access level')
      }
    } catch (error) {
      console.error('Error updating access level:', error)
      toast.error('Terjadi kesalahan saat mengupdate access level')
    }
  }

  const handleToggleLogin = async (user: UserAccount) => {
    if (user.has_login) {
      // Disable login
      try {
        const response = await fetch(`${serverUrl}/user-accounts/${user.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          toast.success('Login access berhasil dinonaktifkan')
          fetchUserAccounts()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal menonaktifkan login access')
        }
      } catch (error) {
        console.error('Error disabling login:', error)
        toast.error('Terjadi kesalahan saat menonaktifkan login access')
      }
    } else {
      // Enable login - open create dialog with pre-filled data
      setCreateForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        access_level: user.access_level,
        source_id: user.source_id
      })
      setShowCreateDialog(true)
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'Owner':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Co-owner':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Dokter':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'doctor' ? (
      <Stethoscope className="h-4 w-4" />
    ) : (
      <Users className="h-4 w-4" />
    )
  }

  const getSourceOptions = () => {
    if (createForm.role === 'doctor') {
      return doctors
        .filter(doctor => doctor && doctor.id && doctor.name)
        .map(doctor => ({
          value: doctor.id,
          label: `${doctor.name || ''} - ${doctor.specialization || ''}`
        }))
    } else {
      return employees
        .filter(employee => employee && employee.id && employee.name)
        .map(employee => ({
          value: employee.id,
          label: `${employee.name || ''} - ${employee.position || ''}`
        }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-pink-600">Memuat data user accounts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl text-pink-800 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Manajemen User Accounts
          </h2>
          <p className="text-pink-600 text-sm mt-1">
            Kelola akses login dokter dan karyawan
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-pink-600 hover:bg-pink-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Buat User Login
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Buat User Account Baru</DialogTitle>
              <DialogDescription>
                Pilih dokter atau karyawan untuk diberi akses login ke sistem. Password akan disimpan dan dapat dilihat di daftar user accounts untuk referensi.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Tipe User</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value: 'doctor' | 'employee') => {
                    setCreateForm(prev => ({
                      ...prev,
                      role: value,
                      source_id: '',
                      access_level: value === 'doctor' ? 'Dokter' : 'Admin'
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Karyawan</SelectItem>
                    <SelectItem value="doctor">Dokter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Pilih {createForm.role === 'doctor' ? 'Dokter' : 'Karyawan'}</Label>
                <Select
                  value={createForm.source_id}
                  onValueChange={(value) => {
                    setCreateForm(prev => ({ ...prev, source_id: value }))
                    
                    // Auto-fill name and email
                    if (createForm.role === 'doctor') {
                      const doctor = doctors.find(d => d.id === value)
                      if (doctor) {
                        setCreateForm(prev => ({
                          ...prev,
                          name: doctor.name,
                          email: doctor.email
                        }))
                      }
                    } else {
                      const employee = employees.find(e => e.id === value)
                      if (employee) {
                        setCreateForm(prev => ({
                          ...prev,
                          name: employee.name,
                          email: employee.email
                        }))
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Pilih ${createForm.role === 'doctor' ? 'Dokter' : 'Karyawan'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getSourceOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nama</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  disabled
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled
                />
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Masukkan password"
                />
              </div>

              <div>
                <Label>Access Level</Label>
                <Select
                  value={createForm.access_level}
                  onValueChange={(value: 'Owner' | 'Co-owner' | 'Admin' | 'Dokter') => 
                    setCreateForm(prev => ({ ...prev, access_level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Co-owner">Co-owner</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Dokter">Dokter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {createForm.password && createForm.password.length > 0 && createForm.password.length < 6 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600 text-sm">
                    Password minimal 6 karakter
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCreateUser}
                  disabled={!createForm.source_id || !createForm.password || createForm.password.length < 6}
                  className="flex-1 bg-pink-600 hover:bg-pink-700"
                >
                  Buat Account
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setCreateForm({
                      name: '',
                      email: '',
                      password: '',
                      role: 'employee',
                      access_level: 'Admin',
                      source_id: ''
                    })
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Cari User</Label>
              <Input
                placeholder="Nama, email, atau posisi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Filter Tipe</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="doctor">Dokter</SelectItem>
                  <SelectItem value="employee">Karyawan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filter Access Level</Label>
              <Select value={filterAccessLevel} onValueChange={setFilterAccessLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Level</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Co-owner">Co-owner</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Dokter">Dokter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-pink-800">{filteredUsers.length}</p>
              </div>
              <Users className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Memiliki Login</p>
                <p className="text-2xl font-bold text-green-800">
                  {filteredUsers.filter(u => u.has_login).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dokter</p>
                <p className="text-2xl font-bold text-blue-800">
                  {filteredUsers.filter(u => u.role === 'doctor').length}
                </p>
              </div>
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Karyawan</p>
                <p className="text-2xl font-bold text-purple-800">
                  {filteredUsers.filter(u => u.role === 'employee').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar User Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <Alert>
              <AlertDescription>
                Tidak ada user yang ditemukan dengan kriteria pencarian.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Posisi</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Status Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.has_login ? (
                          <div className="flex items-center gap-2">
                            <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded max-w-32 truncate" title={`Username: ${user.username || user.email}`}>
                              {user.username || user.email}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(user.username || user.email)
                                toast.success('Username disalin ke clipboard')
                              }}
                              className="h-6 w-6 p-0 text-pink-600 hover:text-pink-800"
                              title="Salin username"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.has_login ? (
                          <div className="flex items-center gap-2">
                            <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded max-w-32" title={`Password: ${user.password || '••••••••'}`}>
                              {user.password || '••••••••'}
                            </div>
                            {user.password && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(user.password!)
                                  toast.success('Password disalin ke clipboard')
                                }}
                                className="h-6 w-6 p-0 text-pink-600 hover:text-pink-800"
                                title="Salin password"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.role === 'doctor' ? 'Dokter' : 'Karyawan'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.position}</TableCell>
                      <TableCell>
                        <Select
                          value={user.access_level}
                          onValueChange={(value) => user.has_login && handleUpdateAccessLevel(user.id, value)}
                          disabled={!user.has_login}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Owner">Owner</SelectItem>
                            <SelectItem value="Co-owner">Co-owner</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Dokter">Dokter</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={user.has_login ? 
                            'bg-green-100 text-green-800 border-green-200' : 
                            'bg-gray-100 text-gray-800 border-gray-200'
                          }
                        >
                          {user.has_login ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={user.status === 'active' ? 
                            'bg-green-100 text-green-800 border-green-200' : 
                            'bg-red-100 text-red-800 border-red-200'
                          }
                        >
                          {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleLogin(user)}
                          className={user.has_login ? 
                            'text-red-600 hover:text-red-800 hover:bg-red-50' :
                            'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }
                        >
                          {user.has_login ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Nonaktifkan
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Aktifkan
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}