import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  History,
  Search,
  Calendar,
  User,
  DollarSign,
  Filter,
  Download,
  BarChart3,
  Ticket,
  TrendingUp,
  Users,
  Target
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface VoucherUsage {
  id: string
  voucherId: string
  voucherCode: string
  patientId: string
  patientName: string
  originalAmount: number
  discountAmount: number
  finalAmount: number
  usedDate: string
  usedBy: string
  transactionType: 'treatment' | 'sale'
  transactionId?: string
}

interface VoucherStats {
  totalVouchers: number
  activeVouchers: number
  totalUsages: number
  totalDiscountGiven: number
  totalSavings: number
  avgDiscountPerUsage: number
  usagesByType: {
    treatment: number
    sale: number
  }
  recentUsages: VoucherUsage[]
}

interface VoucherUsageHistoryProps {
  accessToken: string
}

export function VoucherUsageHistory({ accessToken }: VoucherUsageHistoryProps) {
  const [usages, setUsages] = useState<VoucherUsage[]>([])
  const [stats, setStats] = useState<VoucherStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'treatment' | 'sale'>('all')
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // serverUrl imported from utils/supabase/client

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('🎫 Fetching voucher data...', { serverUrl, accessToken: accessToken ? 'present' : 'missing' })
      
      // Fetch usage history and stats in parallel
      const [usageResponse, statsResponse] = await Promise.all([
        fetch(`${serverUrl}/vouchers/usage`, {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Usage fetch error:', err)
          throw err
        }),
        fetch(`${serverUrl}/vouchers/stats`, {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => {
          console.error('Stats fetch error:', err)
          throw err
        })
      ])

      console.log('🎫 Usage response status:', usageResponse.status)
      console.log('🎫 Stats response status:', statsResponse.status)

      if (usageResponse.ok) {
        const usageData = await usageResponse.json()
        console.log('🎫 Usage data received:', usageData)
        setUsages(usageData.usages || [])
      } else {
        const errorText = await usageResponse.text()
        console.error('Usage response error:', errorText)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log('🎫 Stats data received:', statsData)
        setStats(statsData.stats || {
          totalVouchers: 0,
          activeVouchers: 0,
          totalUsages: 0,
          totalDiscountGiven: 0,
          totalSavings: 0,
          avgDiscountPerUsage: 0,
          usagesByType: { treatment: 0, sale: 0 },
          recentUsages: []
        })
      } else {
        const errorText = await statsResponse.text()
        console.error('Stats response error:', errorText)
        // Set empty stats on error
        setStats({
          totalVouchers: 0,
          activeVouchers: 0,
          totalUsages: 0,
          totalDiscountGiven: 0,
          totalSavings: 0,
          avgDiscountPerUsage: 0,
          usagesByType: { treatment: 0, sale: 0 },
          recentUsages: []
        })
      }
    } catch (error) {
      console.error('Error fetching voucher data:', error)
      toast.error(`Gagal memuat data voucher: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsages = usages.filter(usage => {
    // Filter by search term
    const matchesSearch = 
      usage.voucherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usage.patientName.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter by transaction type
    const matchesType = filterType === 'all' || usage.transactionType === filterType

    // Filter by date range
    let matchesDate = true
    if (dateRange !== 'all') {
      const usageDate = new Date(usage.usedDate)
      const now = new Date()
      
      switch (dateRange) {
        case 'today':
          matchesDate = usageDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = usageDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = usageDate >= monthAgo
          break
      }
    }

    return matchesSearch && matchesType && matchesDate
  })

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Kode Voucher', 'Pasien', 'Jenis', 'Total Asli', 'Diskon', 'Total Bayar']
    const csvContent = [
      headers.join(','),
      ...filteredUsages.map(usage => [
        new Date(usage.usedDate).toLocaleDateString('id-ID'),
        usage.voucherCode,
        usage.patientName,
        usage.transactionType === 'treatment' ? 'Tindakan' : 'Penjualan',
        usage.originalAmount,
        usage.discountAmount,
        usage.finalAmount
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `voucher-usage-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Memuat riwayat voucher...</p>
          <p className="text-sm text-gray-500 mt-2">Menghubungkan ke server...</p>
        </div>
      </div>
    )
  }

  // Show empty state if no data and not loading
  if (!loading && (!stats || stats.totalUsages === 0) && usages.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-800 mb-2">Belum Ada Data Voucher</h3>
              <p className="text-gray-600 mb-4">
                Belum ada voucher yang digunakan di sistem. Mulai buat voucher dan bagikan kepada pasien!
              </p>
              <div className="flex justify-center gap-2">
                <Button
                  onClick={fetchData}
                  variant="outline"
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      console.log('🧪 Testing voucher endpoint...')
                      const response = await fetch(`${serverUrl}/vouchers/test`, {
                        headers: { 
                          'Authorization': `Bearer ${accessToken}`,
                          'Content-Type': 'application/json'
                        }
                      })
                      const data = await response.json()
                      console.log('🧪 Test response:', data)
                      toast.success('Test berhasil! Cek console untuk detail.')
                    } catch (error) {
                      console.error('🧪 Test error:', error)
                      toast.error(`Test gagal: ${error.message}`)
                    }
                  }}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  🧪 Test Connection
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
      {/* Statistics Cards */}
      {stats && Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Ticket className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Penggunaan</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.totalUsages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Diskon</p>
                  <p className="text-2xl font-bold text-green-900">
                    Rp {stats.totalDiscountGiven.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Rata-rata Diskon</p>
                  <p className="text-2xl font-bold text-blue-900">
                    Rp {Math.round(stats.avgDiscountPerUsage).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Voucher Aktif</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.activeVouchers} / {stats.totalVouchers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage by Type */}
      {stats && stats.totalUsages > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-pink-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Penggunaan per Jenis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tindakan</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-pink-500 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.totalUsages > 0 ? (stats.usagesByType.treatment / stats.totalUsages) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{stats.usagesByType.treatment}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Penjualan</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ 
                          width: `${stats.totalUsages > 0 ? (stats.usagesByType.sale / stats.totalUsages) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{stats.usagesByType.sale}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-indigo-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Penggunaan Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentUsages.slice(0, 5).map((usage) => (
                  <div key={usage.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{usage.voucherCode}</p>
                      <p className="text-gray-500">{usage.patientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        -Rp {usage.discountAmount.toLocaleString('id-ID')}
                      </p>
                      <p className="text-gray-500">
                        {new Date(usage.usedDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Penggunaan Voucher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari kode voucher atau nama pasien..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="treatment">Tindakan</SelectItem>
                <SelectItem value="sale">Penjualan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">7 Hari</SelectItem>
                <SelectItem value="month">30 Hari</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={exportToCSV}
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Button
              onClick={async () => {
                try {
                  console.log('🧪 Testing voucher endpoint...')
                  const response = await fetch(`${serverUrl}/vouchers/test`, {
                    headers: { 
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json'
                    }
                  })
                  const data = await response.json()
                  console.log('🧪 Test response:', data)
                  toast.success('Test berhasil! Cek console untuk detail.')
                } catch (error) {
                  console.error('🧪 Test error:', error)
                  toast.error(`Test gagal: ${error.message}`)
                }
              }}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              🧪 Test Connection
            </Button>
          </div>

          {filteredUsages.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Tidak ada riwayat penggunaan voucher</p>
              <p className="text-sm text-gray-500">
                {searchTerm || filterType !== 'all' || dateRange !== 'all'
                  ? 'Coba ubah filter pencarian'
                  : 'Belum ada voucher yang digunakan'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kode Voucher</TableHead>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Total Asli</TableHead>
                    <TableHead className="text-right">Diskon</TableHead>
                    <TableHead className="text-right">Total Bayar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsages.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell className="font-medium">
                        {new Date(usage.usedDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                        <div className="text-xs text-gray-500">
                          {new Date(usage.usedDate).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono bg-purple-50 text-purple-700 px-2 py-1 rounded text-sm inline-block">
                          {usage.voucherCode}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{usage.patientName}</p>
                          {usage.patientId && (
                            <p className="text-xs text-gray-500">ID: {usage.patientId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={usage.transactionType === 'treatment' ? 'default' : 'secondary'}>
                          {usage.transactionType === 'treatment' ? 'Tindakan' : 'Penjualan'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {usage.originalAmount.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">
                        -Rp {usage.discountAmount.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        Rp {usage.finalAmount.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredUsages.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Menampilkan {filteredUsages.length} dari {usages.length} riwayat penggunaan
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}