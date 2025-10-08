import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { 
  Ticket, 
  RefreshCw, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Trash2,
  Zap,
  Shield
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface VoucherWithStatus {
  id: string
  code: string
  title: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  expiryDate: string
  usageLimit: number
  currentUsage: number
  isActive: boolean
  created_at: string
  status: 'active' | 'expired' | 'used_up' | 'inactive'
  statusColor: string
  statusText: string
  recipients: Array<{
    patientId: string
    patientName: string
    assignedDate: string
    used: boolean
  }>
  usages: Array<{
    id: string
    patientName: string
    usedDate: string
    discountAmount: number
  }>
}

interface VoucherStatusListProps {
  accessToken: string
}

export function VoucherStatusList({ accessToken }: VoucherStatusListProps) {
  const [vouchers, setVouchers] = useState<VoucherWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherWithStatus | null>(null)
  const [lastCleanupCheck, setLastCleanupCheck] = useState(0)
  const [corruptDataCount, setCorruptDataCount] = useState(0)
  const [autoCleanupEnabled, setAutoCleanupEnabled] = useState(true)

  useEffect(() => {
    if (accessToken) {
      fetchVoucherStatus()
      
      // Run silent check only once per session (or every 5 minutes)
      const now = Date.now()
      if (now - lastCleanupCheck > 5 * 60 * 1000) { // 5 minutes
        checkForCorruptData()
        setLastCleanupCheck(now)
      }
    }
  }, [accessToken])

  // Silent check for corrupt data without cleanup
  const checkForCorruptData = async () => {
    try {
      const response = await fetch(`${serverUrl}/cleanup-corrupt-data`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checkOnly: true })
      })

      if (response.ok) {
        const data = await response.json()
        const { results } = data
        const totalCorrupt = results.corruptVouchers + results.corruptHistory + results.corruptAssignments
        setCorruptDataCount(totalCorrupt)
        
        if (totalCorrupt > 0) {
          console.log(`⚠️ Found ${totalCorrupt} corrupt records that could be cleaned`)
        }
      }
    } catch (error) {
      console.log('Silent corruption check failed (non-critical):', error)
    }
  }

  const fetchVoucherStatus = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`${serverUrl}/vouchers/status`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Raw voucher data:', data.vouchers?.length || 0, 'vouchers')
        
        // More lenient filtering - only remove truly corrupt data
        const safeVouchers = (data.vouchers || [])
          .filter((voucher: any) => {
            // Only filter out completely corrupt/invalid data
            const hasCode = voucher.code && typeof voucher.code === 'string' && voucher.code.trim() !== '' && voucher.code !== 'UNDEFINED'
            const hasTitle = voucher.title && typeof voucher.title === 'string' && voucher.title.trim() !== '' && voucher.title !== 'UNDEFINED'
            const hasValidDiscount = typeof voucher.discountValue === 'number' && !isNaN(voucher.discountValue) && voucher.discountValue >= 0
            const hasValidDate = (voucher.created_at || voucher.createdDate) && 
                                !isNaN(new Date(voucher.created_at || voucher.createdDate).getTime())
            
            const isValid = hasCode && hasTitle && hasValidDiscount && hasValidDate
            
            if (!isValid) {
              console.log('Filtering out corrupt voucher:', {
                id: voucher.id,
                code: voucher.code,
                title: voucher.title,
                discountValue: voucher.discountValue,
                hasCode, hasTitle, hasValidDiscount, hasValidDate
              })
            }
            
            return isValid
          })
          .map((voucher: any) => ({
            ...voucher,
            code: voucher.code || 'N/A',
            title: voucher.title || 'Voucher Tanpa Judul',
            discountValue: voucher.discountValue || 0,
            currentUsage: voucher.currentUsage || 0,
            recipients: voucher.recipients || [],
            usages: voucher.usages || [],
            status: voucher.status || 'unknown',
            statusText: voucher.statusText || 'Status Tidak Diketahui',
            statusColor: voucher.statusColor || 'gray',
            // Ensure we have a valid date field
            created_at: voucher.created_at || voucher.createdDate || new Date().toISOString()
          }))
        
        setVouchers(safeVouchers)
        console.log('✅ Loaded vouchers with status (filtered):', safeVouchers.length)
        
        // Only show warning if too many vouchers are filtered out
        const filteredCount = (data.vouchers?.length || 0) - safeVouchers.length
        if (filteredCount > 0 && filteredCount > safeVouchers.length) {
          console.warn(`⚠️ ${filteredCount} vouchers were filtered out as corrupt`)
        }
      } else {
        console.error('Failed to fetch voucher status:', response.status)
        toast.error('Gagal memuat status voucher')
      }
    } catch (error) {
      console.error('Error fetching voucher status:', error)
      toast.error('Terjadi kesalahan saat memuat status voucher')
    } finally {
      setLoading(false)
    }
  }

  // Function to cleanup corrupt data (manual only)
  const cleanupCorruptData = async () => {
    try {
      console.log('🧹 Running manual cleanup for corrupt voucher data...')
      
      // Show loading state
      const toastId = toast.loading('Membersihkan data corrupt...')
      
      const response = await fetch(`${serverUrl}/cleanup-corrupt-data`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const { results } = data
        
        // Dismiss loading toast
        toast.dismiss(toastId)
        
        const totalCleaned = results.corruptVouchers + results.corruptHistory + results.corruptAssignments
        
        if (totalCleaned > 0) {
          toast.success(`Berhasil membersihkan ${totalCleaned} data corrupt (${results.corruptVouchers} voucher, ${results.corruptHistory} history, ${results.corruptAssignments} assignment)`)
          // Reset corrupt counter and refresh data
          setCorruptDataCount(0)
          setTimeout(() => fetchVoucherStatus(), 1000) // Small delay to ensure cleanup is complete
        } else {
          toast.info('Tidak ada data corrupt yang ditemukan. Database sudah bersih!')
          setCorruptDataCount(0)
        }
      } else {
        toast.dismiss(toastId)
        toast.error('Gagal melakukan cleanup')
      }
    } catch (error) {
      console.log('Cleanup error:', error)
      toast.error('Terjadi kesalahan saat cleanup')
    }
  }

  // Silent background check for corruption (no toasts)
  const checkCorruptDataSilently = async () => {
    try {
      console.log('🔍 Checking for corrupt data (silent)...')
      
      const response = await fetch(`${serverUrl}/cleanup-corrupt-data`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checkOnly: true }) // Add flag to only check, not clean
      })

      if (response.ok) {
        const data = await response.json()
        const { results } = data
        const totalCorrupt = results.corruptVouchers + results.corruptHistory + results.corruptAssignments
        
        if (totalCorrupt > 0) {
          console.log(`⚠️ Found ${totalCorrupt} corrupt records that could be cleaned`)
        } else {
          console.log('✅ No corrupt data found')
        }
        
        return totalCorrupt
      }
    } catch (error) {
      console.log('Silent check error (non-critical):', error)
      return 0
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'used':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'expired':
        return <Clock className="h-4 w-4 text-red-600" />
      case 'used_up':
        return <XCircle className="h-4 w-4 text-orange-600" />
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Ticket className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string, statusText: string, statusColor: string) => {
    const colorClasses = {
      green: 'bg-green-100 text-green-700 border-green-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200'
    }

    return (
      <Badge variant="outline" className={colorClasses[statusColor as keyof typeof colorClasses] || colorClasses.gray}>
        {getStatusIcon(status)}
        <span className="ml-1">{statusText}</span>
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-pink-600">Memuat status voucher...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Corruption Warning Banner */}
      {corruptDataCount > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-800">
                Ditemukan <span className="font-medium">{corruptDataCount} data corrupt</span> yang dapat memengaruhi performa sistem.
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Klik tombol "Cleanup" untuk membersihkan data corrupt secara otomatis.
              </p>
            </div>
            <Button 
              onClick={cleanupCorruptData} 
              size="sm" 
              variant="outline"
              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Bersihkan Sekarang
            </Button>
          </div>
        </div>
      )}

      <Card className="border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-pink-800 flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Riwayat Voucher dengan Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-pink-200 text-pink-700">
                {vouchers.length} Total Voucher
              </Badge>
              <Button onClick={fetchVoucherStatus} size="sm" variant="outline">
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={cleanupCorruptData} 
                size="sm" 
                variant={corruptDataCount > 0 ? "destructive" : "outline"}
                className={corruptDataCount > 0 ? "" : "text-red-600 border-red-200 hover:bg-red-50"}
                title={corruptDataCount > 0 ? `Ditemukan ${corruptDataCount} data corrupt yang bisa dibersihkan` : "Bersihkan data corrupt dari database"}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {corruptDataCount > 0 ? `Cleanup (${corruptDataCount})` : "Cleanup Data"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-3">
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
              <div className="flex items-center gap-2 text-pink-700">
                <Ticket className="h-4 w-4" />
                <span className="text-sm font-medium">Status Voucher:</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-green-700">Aktif: belum terpakai & belum kadaluwarsa</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-700">Terpakai: sudah digunakan dalam tindakan</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-red-600" />
                  <span className="text-red-700">Kadaluwarsa: sudah lewat masa aktif</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-gray-600" />
                  <span className="text-gray-700">Tidak Aktif: dinonaktifkan manual</span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Catatan:</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Data voucher corrupt (dengan kode "UNKNOWN" atau tanggal invalid) telah disembunyikan secara otomatis untuk menjaga kualitas data.
              </p>
            </div>
          </div>

          {vouchers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada voucher yang dibuat</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Voucher</TableHead>
                  <TableHead>Judul</TableHead>
                  <TableHead>Nama Pemilik</TableHead>
                  <TableHead>Penerima</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => {
                  // Get primary recipient (first recipient)
                  const primaryRecipient = voucher.recipients && voucher.recipients.length > 0 
                    ? voucher.recipients[0] 
                    : null
                  
                  return (
                    <TableRow key={voucher.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(voucher.created_at).toLocaleDateString('id-ID')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(voucher.created_at).toLocaleTimeString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {voucher.discountType === 'percentage' ? (
                            <Percent className="h-4 w-4 text-pink-600" />
                          ) : (
                            <DollarSign className="h-4 w-4 text-pink-600" />
                          )}
                          <div className="text-xs font-mono bg-pink-50 px-2 py-1 rounded border">
                            {voucher.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{voucher.title || 'Voucher Tanpa Judul'}</div>
                        <div className="text-xs text-pink-600">
                          {voucher.discountType === 'percentage' 
                            ? `${voucher.discountValue || 0}% diskon`
                            : `Rp ${(voucher.discountValue || 0).toLocaleString('id-ID')} diskon`
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        {primaryRecipient ? (
                          <div>
                            <div className="text-sm font-medium text-pink-700">
                              {primaryRecipient.patientName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(primaryRecipient.assignedDate).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 italic">
                            Belum ada pemilik
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{(voucher.recipients || []).length} pasien</div>
                        <div className="text-xs text-gray-500">
                          {voucher.currentUsage || 0}/{voucher.usageLimit || '∞'} digunakan
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(voucher.status, voucher.statusText, voucher.statusColor)}
                        {voucher.expiryDate && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Exp: {new Date(voucher.expiryDate).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVoucher(voucher)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedVoucher} onOpenChange={() => setSelectedVoucher(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-pink-600" />
              Detail Voucher: {selectedVoucher?.title}
            </DialogTitle>
            <DialogDescription>
              Status dan informasi lengkap voucher
            </DialogDescription>
          </DialogHeader>

          {selectedVoucher && (
            <div className="space-y-6">
              {/* Voucher Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Informasi Voucher</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Kode Voucher</label>
                      <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{selectedVoucher.code}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Diskon</label>
                      <p className="text-sm">
                        {selectedVoucher.discountType === 'percentage' 
                          ? `${selectedVoucher.discountValue || 0}%`
                          : `Rp ${(selectedVoucher.discountValue || 0).toLocaleString('id-ID')}`
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Masa Berlaku</label>
                      <p className="text-sm">
                        {selectedVoucher.expiryDate ? new Date(selectedVoucher.expiryDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        }) : 'Tidak ada'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedVoucher.status, selectedVoucher.statusText, selectedVoucher.statusColor)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Statistik Penggunaan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Total Penerima</span>
                      <span className="text-sm font-medium">{(selectedVoucher.recipients || []).length} pasien</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Sudah Digunakan</span>
                      <span className="text-sm font-medium">{selectedVoucher.currentUsage || 0} kali</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Batas Penggunaan</span>
                      <span className="text-sm font-medium">{selectedVoucher.usageLimit || 'Tidak terbatas'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recipients */}
              {(selectedVoucher.recipients || []).length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Daftar Pemilik Voucher ({(selectedVoucher.recipients || []).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">No</TableHead>
                            <TableHead className="text-xs">Nama Pemilik</TableHead>
                            <TableHead className="text-xs">Tanggal Diterima</TableHead>
                            <TableHead className="text-xs">Status Penggunaan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(selectedVoucher.recipients || []).map((recipient, index) => (
                            <TableRow key={index}>
                              <TableCell className="text-xs font-medium">{index + 1}</TableCell>
                              <TableCell className="text-xs">
                                <div className="font-medium text-pink-700">
                                  {recipient.patientName || 'Unknown'}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs">
                                {recipient.assignedDate ? new Date(recipient.assignedDate).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 'N/A'}
                              </TableCell>
                              <TableCell className="text-xs">
                                {recipient.used ? (
                                  <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Sudah Digunakan
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Belum Digunakan
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Daftar Pemilik Voucher
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">Voucher ini belum memiliki pemilik</p>
                      <p className="text-xs mt-1">Voucher dapat digunakan oleh siapa saja sampai batas penggunaan tercapai</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Usage History */}
              {(selectedVoucher.usages || []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Riwayat Penggunaan ({(selectedVoucher.usages || []).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Nama Pasien</TableHead>
                            <TableHead className="text-xs">Tanggal Pakai</TableHead>
                            <TableHead className="text-xs">Nilai Diskon</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(selectedVoucher.usages || []).map((usage) => (
                            <TableRow key={usage.id}>
                              <TableCell className="text-xs">{usage.patientName || 'Unknown'}</TableCell>
                              <TableCell className="text-xs">
                                {usage.usedDate ? new Date(usage.usedDate).toLocaleString('id-ID') : 'N/A'}
                              </TableCell>
                              <TableCell className="text-xs">
                                Rp {(usage.discountAmount || 0).toLocaleString('id-ID')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}