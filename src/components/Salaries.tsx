import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Edit, Trash2, DollarSign, Calculator } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface Employee {
  id: string
  name: string
  position: string
}

interface Salary {
  id: string
  employeeId: string
  employeeName: string
  baseSalary: number
  bonus: number
  holidayAllowance: number
  totalSalary: number
  month: string
  year: string
  createdAt: string
}

interface SalariesProps {
  accessToken: string
}

export function Salaries({ accessToken }: SalariesProps) {
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    baseSalary: '',
    bonus: '',
    holidayAllowance: '',
    month: '',
    year: ''
  })

  useEffect(() => {
    fetchSalaries()
    fetchEmployees()
  }, [])

  const fetchSalaries = async () => {
    try {
      const response = await fetch(`${serverUrl}/salaries`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setSalaries(data.salaries || [])
      }
    } catch (error) {
      console.log('Error fetching salaries:', error)
      toast.error('Gagal mengambil data gaji')
    }
  }

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
    }
  }

  const calculateTotalSalary = () => {
    const base = parseFloat(formData.baseSalary) || 0
    const bonus = parseFloat(formData.bonus) || 0
    const holiday = parseFloat(formData.holidayAllowance) || 0
    return base + bonus + holiday
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedEmployee = employees.find(emp => emp.id === formData.employeeId)
      if (!selectedEmployee) {
        toast.error('Pilih karyawan terlebih dahulu')
        setLoading(false)
        return
      }

      const salaryData = {
        employeeId: formData.employeeId,
        employeeName: selectedEmployee.name,
        baseSalary: parseFloat(formData.baseSalary) || 0,
        bonus: parseFloat(formData.bonus) || 0,
        holidayAllowance: parseFloat(formData.holidayAllowance) || 0,
        totalSalary: calculateTotalSalary(),
        month: formData.month,
        year: formData.year
      }

      if (editingSalary) {
        // Update existing salary
        const response = await fetch(`${serverUrl}/salaries/${editingSalary.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(salaryData)
        })

        if (response.ok) {
          toast.success('Data gaji berhasil diperbarui')
          fetchSalaries()
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal memperbarui data gaji')
        }
      } else {
        // Create new salary
        const response = await fetch(`${serverUrl}/salaries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(salaryData)
        })

        if (response.ok) {
          toast.success('Data gaji berhasil ditambahkan')
          fetchSalaries()
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal menambahkan data gaji')
        }
      }
    } catch (error) {
      console.log('Error saving salary:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (salaryId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data gaji ini?')) {
      return
    }

    try {
      const response = await fetch(`${serverUrl}/salaries/${salaryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        toast.success('Data gaji berhasil dihapus')
        fetchSalaries()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus data gaji')
      }
    } catch (error) {
      console.log('Error deleting salary:', error)
      toast.error('Terjadi kesalahan sistem')
    }
  }

  const handleEdit = (salary: Salary) => {
    setEditingSalary(salary)
    setFormData({
      employeeId: salary.employeeId,
      baseSalary: salary.baseSalary.toString(),
      bonus: salary.bonus.toString(),
      holidayAllowance: salary.holidayAllowance.toString(),
      month: salary.month,
      year: salary.year
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      employeeId: '',
      baseSalary: '',
      bonus: '',
      holidayAllowance: '',
      month: '',
      year: ''
    })
    setEditingSalary(null)
    setDialogOpen(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const months = [
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ]

  const currentYear = new Date().getFullYear()
  // Membuat range tahun yang lebih panjang untuk penggunaan jangka panjang klinik
  // Dari 2020 sampai 30 tahun ke depan dari tahun saat ini
  const startYear = 2020
  const endYear = currentYear + 30
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)

  return (
    <div className="space-y-6">
      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-pink-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Manajemen Gaji Karyawan
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    resetForm()
                    setDialogOpen(true)
                  }}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Data Gaji
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSalary ? 'Edit Data Gaji' : 'Tambah Data Gaji'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSalary ? 'Perbarui informasi gaji karyawan' : 'Masukkan informasi gaji karyawan baru'}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee">Karyawan</Label>
                    <Select 
                      value={formData.employeeId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih karyawan" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} - {employee.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="month">Bulan</Label>
                      <Select 
                        value={formData.month} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, month: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih bulan" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(month => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Tahun</Label>
                      <Select 
                        value={formData.year} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tahun" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseSalary">Gaji Pokok</Label>
                    <Input
                      id="baseSalary"
                      type="number"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, baseSalary: e.target.value }))}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bonus">Bonus</Label>
                    <Input
                      id="bonus"
                      type="number"
                      value={formData.bonus}
                      onChange={(e) => setFormData(prev => ({ ...prev, bonus: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="holidayAllowance">Tunjangan Hari Raya</Label>
                    <Input
                      id="holidayAllowance"
                      type="number"
                      value={formData.holidayAllowance}
                      onChange={(e) => setFormData(prev => ({ ...prev, holidayAllowance: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  {/* Total Salary Display */}
                  <div className="space-y-2">
                    <Label>Total Gaji</Label>
                    <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-md border border-pink-200">
                      <Calculator className="h-4 w-4 text-pink-600" />
                      <span className="text-pink-800 font-medium text-lg">
                        {formatCurrency(calculateTotalSalary())}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      {loading ? 'Menyimpan...' : editingSalary ? 'Perbarui' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {salaries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Belum ada data gaji karyawan
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Gaji Pokok</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>THR</TableHead>
                  <TableHead>Total Gaji</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell className="font-medium">{salary.employeeName}</TableCell>
                    <TableCell>
                      {months.find(m => m.value === salary.month)?.label} {salary.year}
                    </TableCell>
                    <TableCell>{formatCurrency(salary.baseSalary)}</TableCell>
                    <TableCell>{formatCurrency(salary.bonus)}</TableCell>
                    <TableCell>{formatCurrency(salary.holidayAllowance)}</TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(salary.totalSalary)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(salary)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(salary.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}