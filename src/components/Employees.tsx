import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Edit, Trash2, Users, Key } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface Employee {
  id: string
  name: string
  position: string
  phone: string
  email: string
  joinDate: string
  status: 'active' | 'inactive'
  authUserId?: string
  hasLoginAccess?: boolean
  role?: string
  createdAt: string
}

interface EmployeesProps {
  accessToken: string
}

export function Employees({ accessToken }: EmployeesProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    password: '',
    joinDate: '',
    status: 'active' as 'active' | 'inactive'
  })
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${serverUrl}/employees`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.log('Error fetching employees:', error)
      toast.error('Gagal mengambil data karyawan')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation for new employees
      if (!editingEmployee) {
        if (!formData.email) {
          toast.error('Email tidak boleh kosong')
          setLoading(false)
          return
        }
        
        if (!formData.password || formData.password.length < 6) {
          toast.error('Password minimal 6 karakter')
          setLoading(false)
          return
        }
      }

      if (editingEmployee) {
        // Update existing employee
        const updateData = { ...formData }
        // Only send password if it's provided
        if (!formData.password) {
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

        const data = await response.json()
        if (response.ok) {
          toast.success(data.message || 'Data karyawan berhasil diperbarui')
          fetchEmployees()
          resetForm()
        } else {
          toast.error(data.error || 'Gagal memperbarui data karyawan')
        }
      } else {
        // Create new employee
        const response = await fetch(`${serverUrl}/employees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(formData)
        })

        const data = await response.json()
        if (response.ok) {
          toast.success(data.message || 'Karyawan berhasil ditambahkan dengan akses login')
          fetchEmployees()
          resetForm()
        } else {
          toast.error(data.error || 'Gagal menambahkan karyawan')
        }
      }
    } catch (error) {
      console.log('Error saving employee:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus karyawan "${employeeName}"? \n\nTindakan ini akan menghapus akses login karyawan dan tidak dapat dibatalkan.`)) {
      return
    }

    try {
      const response = await fetch(`${serverUrl}/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        toast.success(data.message || 'Karyawan dan akses login berhasil dihapus')
        fetchEmployees()
      } else {
        toast.error(data.error || 'Gagal menghapus karyawan')
      }
    } catch (error) {
      console.log('Error deleting employee:', error)
      toast.error('Terjadi kesalahan sistem')
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      position: employee.position,
      phone: employee.phone,
      email: employee.email,
      password: '', // Don't pre-fill password for security
      joinDate: employee.joinDate,
      status: employee.status
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      phone: '',
      email: '',
      password: '',
      joinDate: '',
      status: 'active'
    })
    setEditingEmployee(null)
    setDialogOpen(false)
  }

  const handleDebugAuthUsers = async () => {
    try {
      const response = await fetch(`${serverUrl}/debug/auth-users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setDebugInfo(data)
        console.log('Auth users debug info:', data)
      } else {
        toast.error('Gagal mengambil debug info')
      }
    } catch (error) {
      console.log('Error getting debug info:', error)
      toast.error('Error mengambil debug info')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-pink-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manajemen Karyawan
                <Key className="h-4 w-4 text-blue-600" title="Karyawan mendapat akses login sistem" />
              </CardTitle>
              <p className="text-sm text-pink-600 mt-1">
                Karyawan otomatis mendapat akses login sebagai Administrator
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-xs border-gray-300 text-gray-600"
                >
                  {showDebug ? 'Sembunyikan' : 'Debug Info'}
                </Button>
                {showDebug && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDebugAuthUsers}
                    className="text-xs border-blue-300 text-blue-600"
                  >
                    Cek Auth Users
                  </Button>
                )}
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => resetForm()}
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
                      ? 'Perbarui informasi karyawan yang dipilih. Password hanya diubah jika diisi.' 
                      : 'Lengkapi form berikut untuk menambahkan karyawan baru ke sistem. Karyawan akan mendapat akses login sebagai Administrator.'
                    }
                  </DialogDescription>
                </DialogHeader>
                {!editingEmployee && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-blue-800 text-sm">
                      <Key className="h-4 w-4" />
                      <span className="font-medium">Akses Login Otomatis</span>
                    </div>
                    <p className="text-blue-600 text-xs mt-1">
                      Karyawan yang ditambahkan akan otomatis mendapat akses login ke sistem sebagai Administrator.
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Label htmlFor="position" className="text-pink-700">Posisi</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      required
                      className="border-pink-200"
                    />
                  </div>

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
                    <Label htmlFor="email" className="text-pink-700">
                      Email {!editingEmployee && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required={!editingEmployee}
                      disabled={editingEmployee} // Email tidak bisa diubah
                      className="border-pink-200"
                      placeholder={editingEmployee ? "Email tidak dapat diubah" : "Masukkan email karyawan"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-pink-700">
                      Password {!editingEmployee ? <span className="text-red-500">* (min. 6 karakter)</span> : "(kosongkan jika tidak ingin mengubah)"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingEmployee}
                      minLength={6}
                      className="border-pink-200"
                      placeholder={editingEmployee ? "Masukkan password baru" : "Masukkan password login"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="joinDate" className="text-pink-700">Tanggal Bergabung</Label>
                    <Input
                      id="joinDate"
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      required
                      className="border-pink-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-pink-700">Status</Label>
                    <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="border-pink-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Tidak Aktif</SelectItem>
                      </SelectContent>
                    </Select>
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
                      {loading ? 'Menyimpan...' : (editingEmployee ? 'Update' : 'Simpan')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {showDebug && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Debug Information</h4>
              {debugInfo && (
                <div className="space-y-2">
                  <p className="text-xs text-blue-700">
                    Total Auth Users: {debugInfo.authUsers?.length || 0}
                  </p>
                  {debugInfo.authUsers?.map((user: any) => (
                    <div key={user.id} className="text-xs bg-white p-2 rounded border">
                      <div><strong>Email:</strong> {user.email}</div>
                      <div><strong>Role:</strong> {user.user_metadata?.role || 'N/A'}</div>
                      <div><strong>Name:</strong> {user.user_metadata?.name || 'N/A'}</div>
                      <div><strong>Confirmed:</strong> {user.confirmed ? 'Yes' : 'No'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-pink-700">Nama</TableHead>
                  <TableHead className="text-pink-700">Posisi</TableHead>
                  <TableHead className="text-pink-700">Telepon</TableHead>
                  <TableHead className="text-pink-700">Email</TableHead>
                  <TableHead className="text-pink-700">Tanggal Bergabung</TableHead>
                  <TableHead className="text-pink-700">Status</TableHead>
                  <TableHead className="text-pink-700">Akses Login</TableHead>
                  <TableHead className="text-pink-700">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>{employee.phone}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      {new Date(employee.joinDate).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        employee.hasLoginAccess 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.hasLoginAccess ? 'Administrator' : 'Tidak Ada'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(employee)}
                          className="border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(employee.id, employee.name)}
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
            {employees.length === 0 && (
              <div className="text-center py-8 text-pink-600">
                Belum ada data karyawan
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}