import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { Plus, Edit, Trash2, TrendingDown, ArrowDown } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  date: string
  receipt: string
  notes?: string
  createdAt: string
}

interface ExpensesProps {
  accessToken: string
}

const expenseCategories = [
  'Operasional',
  'Peralatan Medis',
  'Obat-obatan',
  'Utilitas',
  'Pemeliharaan',
  'Marketing',
  'Transport',
  'Konsumsi',
  'Lain-lain'
]

export function Expenses({ accessToken }: ExpensesProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: '',
    receipt: '',
    notes: ''
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  const sortExpensesByDate = (expenses: Expense[]) => {
    return expenses.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA // Descending order (newest first)
    })
  }

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${serverUrl}/expenses`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        const sortedExpenses = sortExpensesByDate(data.expenses || [])
        setExpenses(sortedExpenses)
      }
    } catch (error) {
      console.log('Error fetching expenses:', error)
      toast.error('Gagal mengambil data pengeluaran')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const expenseData = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount) || 0,
        date: formData.date,
        receipt: formData.receipt,
        notes: formData.notes
      }

      if (editingExpense) {
        // Update existing expense
        const response = await fetch(`${serverUrl}/expenses/${editingExpense.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(expenseData)
        })

        if (response.ok) {
          toast.success('Data pengeluaran berhasil diperbarui')
          fetchExpenses()
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal memperbarui data pengeluaran')
        }
      } else {
        // Create new expense
        const response = await fetch(`${serverUrl}/expenses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(expenseData)
        })

        if (response.ok) {
          toast.success('Data pengeluaran berhasil ditambahkan')
          fetchExpenses()
          resetForm()
        } else {
          const data = await response.json()
          toast.error(data.error || 'Gagal menambahkan data pengeluaran')
        }
      }
    } catch (error) {
      console.log('Error saving expense:', error)
      toast.error('Terjadi kesalahan sistem')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pengeluaran ini?')) {
      return
    }

    try {
      const response = await fetch(`${serverUrl}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        toast.success('Data pengeluaran berhasil dihapus')
        fetchExpenses()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Gagal menghapus data pengeluaran')
      }
    } catch (error) {
      console.log('Error deleting expense:', error)
      toast.error('Terjadi kesalahan sistem')
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      receipt: expense.receipt,
      notes: expense.notes || ''
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      date: '',
      receipt: '',
      notes: ''
    })
    setEditingExpense(null)
    setDialogOpen(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const getExpensesByCategory = () => {
    const summary: { [key: string]: number } = {}
    expenses.forEach(expense => {
      summary[expense.category] = (summary[expense.category] || 0) + expense.amount
    })
    return summary
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600">Total Pengeluaran</p>
                <p className="text-2xl text-pink-800">{formatCurrency(getTotalExpenses())}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600">Jumlah Transaksi</p>
                <p className="text-2xl text-pink-800">{expenses.length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-pink-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600">Rata-rata per Transaksi</p>
                <p className="text-2xl text-pink-800">
                  {formatCurrency(expenses.length > 0 ? getTotalExpenses() / expenses.length : 0)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-pink-800 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Manajemen Pengeluaran
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => resetForm()}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Pengeluaran
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-pink-800">
                    {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
                  </DialogTitle>
                  <DialogDescription className="text-pink-600">
                    {editingExpense 
                      ? 'Perbarui informasi pengeluaran yang dipilih.' 
                      : 'Lengkapi form berikut untuk mencatat pengeluaran operasional klinik.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-pink-700">Kategori</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="border-pink-200">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-pink-700">Deskripsi</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="border-pink-200"
                      placeholder="Deskripsi pengeluaran"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-pink-700">Jumlah</Label>
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt" className="text-pink-700">No. Kwitansi/Nota (Opsional)</Label>
                    <Input
                      id="receipt"
                      value={formData.receipt}
                      onChange={(e) => setFormData({ ...formData, receipt: e.target.value })}
                      className="border-pink-200"
                      placeholder="Nomor kwitansi atau nota"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-pink-700">Keterangan Tambahan (Opsional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="border-pink-200"
                      placeholder="Catatan atau keterangan tambahan untuk pengeluaran ini"
                      rows={2}
                    />
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
                      {loading ? 'Menyimpan...' : (editingExpense ? 'Update' : 'Simpan')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-pink-700">
                    <div className="flex items-center gap-1">
                      Tanggal
                      <ArrowDown className="h-3 w-3 text-pink-500" />
                    </div>
                  </TableHead>
                  <TableHead className="text-pink-700">Kategori</TableHead>
                  <TableHead className="text-pink-700">Deskripsi</TableHead>
                  <TableHead className="text-pink-700">Jumlah</TableHead>
                  <TableHead className="text-pink-700">No. Kwitansi</TableHead>
                  <TableHead className="text-pink-700">Keterangan</TableHead>
                  <TableHead className="text-pink-700">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="font-semibold text-red-600">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>{expense.receipt || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {expense.notes ? (
                        <span title={expense.notes}>
                          {expense.notes.length > 30 ? `${expense.notes.substring(0, 30)}...` : expense.notes}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(expense)}
                          className="border-pink-200 text-pink-600 hover:bg-pink-50"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(expense.id)}
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
            {expenses.length === 0 && (
              <div className="text-center py-8 text-pink-600">
                Belum ada data pengeluaran
              </div>
            )}
          </div>
          {expenses.length > 0 && (
            <div className="mt-3 text-xs text-pink-500 flex items-center gap-1">
              <ArrowDown className="h-3 w-3" />
              Data diurutkan berdasarkan tanggal terbaru di atas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Summary by Category */}
      {expenses.length > 0 && (
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="text-pink-800">Ringkasan per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(getExpensesByCategory()).map(([category, amount]) => (
                <div key={category} className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                  <div className="text-sm text-pink-600">{category}</div>
                  <div className="text-lg text-pink-800">{formatCurrency(amount)}</div>
                  <div className="text-xs text-pink-500">
                    {((amount / getTotalExpenses()) * 100).toFixed(1)}% dari total
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}