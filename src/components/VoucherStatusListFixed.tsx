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

  useEffect(() => {
    if (accessToken) {
      fetchVoucherStatus()
      
      // Start the corruption cleanup system
      const cleanupInterval = setInterval(() => {
        silentCleanup()
      }, 2 * 60 * 1000) // Every 2 minutes
      
      // Initial cleanup
      setTimeout(() => silentCleanup(), 3000)
      
      return () => clearInterval(cleanupInterval)
    }
  }, [accessToken])

  // Silent cleanup in background - NO TOASTS
  const silentCleanup = async () => {
    try {
      console.log('🛡️ Running silent anti-corruption cleanup...')
      
      const response = await fetch(`${serverUrl}/nuclear-cleanup`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.results?.totalDeleted > 0) {
          console.log(`🛡️ Silent cleanup: Eliminated ${data.results.totalDeleted} corrupt records`)
          // Silently refresh data
          setTimeout(() => fetchVoucherStatus(), 1000)
        }
      }
    } catch (error) {
      console.log('🛡️ Silent cleanup failed (non-critical):', error)
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
        
        // Debug: Log raw vouchers for troubleshooting
        console.log('🔍 Raw vouchers received from server:', data.vouchers?.length || 0)
        if (data.vouchers && data.vouchers.length > 0) {
          console.log('🔍 Sample voucher:', data.vouchers[0])
        }

        // SIMPLIFIED processing - Only sanitize, don't filter out
        const processedVouchers = (data.vouchers || [])
          .map((voucher: any) => {
            // Sanitize each voucher with fallback values
            return {
              ...voucher,
              id: voucher.id || `voucher_${Date.now()}_${Math.random()}`,
              code: voucher.code || 'NO_CODE',
              title: voucher.title || 'Voucher Tanpa Judul',
              description: voucher.description || '',
              discountValue: Number(voucher.discountValue) || 0,
              currentUsage: Number(voucher.currentUsage) || 0,
              recipients: Array.isArray(voucher.recipients) ? voucher.recipients : [],
              usages: Array.isArray(voucher.usages) ? voucher.usages : [],
              status: voucher.status || 'unknown',
              statusText: voucher.statusText || 'Status Tidak Diketahui',
              statusColor: voucher.statusColor || 'gray',
              created_at: voucher.created_at || voucher.createdDate || new Date().toISOString(),
              discountType: voucher.discountType || 'percentage',
              expiryDate: voucher.expiryDate || null,
              usageLimit: Number(voucher.usageLimit) || 0,
              isActive: voucher.isActive !== false
            }
          })
          .filter((voucher: any) => {
            // Only filter out completely broken entries (missing ID)
            return voucher.id && voucher.id !== 'undefined'
          })
        
        setVouchers(processedVouchers)
        console.log('✅ Processed vouchers successfully:', processedVouchers.length)
        
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

  // Manual nuclear cleanup for emergencies
  const nuclearCleanup = async () => {
    try {
      const confirmed = window.confirm(
        '☢️ NUCLEAR CLEANUP ☢️\n\n' +
        'Ini akan MENGHAPUS SEMUA data corrupt secara permanen!\n' +
        'Operasi ini tidak dapat dibatalkan.\n\n' +
        'Lanjutkan dengan Nuclear Cleanup?'
      )
      
      if (!confirmed) return
      
      console.log('☢️ Initiating nuclear cleanup...')
      const toastId = toast.loading('☢️ Nuclear Cleanup sedang berlangsung...')
      
      const response = await fetch(`${serverUrl}/nuclear-cleanup`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast.dismiss(toastId)
        
        if (data.results?.totalDeleted > 0) {
          toast.success(`☢️ Nuclear Cleanup selesai! ${data.results.totalDeleted} data corrupt dihancurkan!`)
        } else {
          toast.success('☢️ Database sudah bersih! Tidak ada data corrupt ditemukan.')
        }
        
        setTimeout(() => fetchVoucherStatus(), 2000)
      } else {
        toast.dismiss(toastId)
        toast.error('☢️ Nuclear Cleanup gagal!')
      }
    } catch (error) {
      console.log('Nuclear cleanup error:', error)
      toast.error('☢️ Nuclear Cleanup error!')
    }
  }

  // Delete voucher function
  const deleteVoucher = async (voucherId: string, voucherCode: string) => {
    try {
      const confirmed = window.confirm(
        `Hapus voucher "${voucherCode}"?\n\n` +
        'Voucher yang dihapus tidak dapat dikembalikan.\n' +
        'Lanjutkan menghapus voucher ini?'
      )
      
      if (!confirmed) return
      
      console.log('🗑️ Deleting voucher:', voucherId)
      const toastId = toast.loading('Menghapus voucher...')
      
      const response = await fetch(`${serverUrl}/vouchers/${voucherId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.dismiss(toastId)
        toast.success(`Voucher "${voucherCode}" berhasil dihapus!`)
        
        // Refresh voucher list
        setTimeout(() => fetchVoucherStatus(), 1000)
      } else {
        toast.dismiss(toastId)
        toast.error('Gagal menghapus voucher!')
      }
    } catch (error) {
      console.log('Delete voucher error:', error)
      toast.error('Terjadi kesalahan saat menghapus voucher!')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
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
      {/* Anti-Corruption Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-green-800">
              <span className="font-medium">🛡️ Anti-Corruption System Active</span> - Sistem membersihkan data corrupt otomatis setiap 2 menit.
            </p>
            <p className="text-green-700 text-sm mt-1">
              Data corrupt akan dihapus secara otomatis di background tanpa mengganggu workflow.
            </p>
          </div>
          <Button 
            onClick={nuclearCleanup} 
            size="sm" 
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <Zap className="h-4 w-4 mr-1" />
            ☢️ Emergency Cleanup
          </Button>
        </div>
      </div>

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
                  <span className="text-green-700">aktif: belum terpakai & belum kadaluwarsa</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-orange-600" />
                  <span className="text-orange-700">terpakai: sudah ada validasi pemakaian</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-red-600" />
                  <span className="text-red-700">kadaluwarsa: sudah lewat masa aktif</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-gray-600" />
                  <span className="text-gray-700">non aktif: dinonaktifkan manual</span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Sistema Anti-Corruption:</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Sistem membersihkan data corrupt secara otomatis setiap 2 menit untuk menjaga kualitas data dan performa optimal.
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
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVoucher(voucher)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteVoucher(voucher.id, voucher.code)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}