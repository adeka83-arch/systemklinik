import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { RefreshCw, Shield, CheckCircle, XCircle, User } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface AdminDebuggerProps {
  accessToken: string
}

interface UserDebugInfo {
  user: {
    id: string
    email: string
    user_metadata: any
  }
  roleCheck: {
    isAdmin: boolean
    roleValue: string | undefined
    hasMetadata: boolean
  }
}

export function AdminDebugger({ accessToken }: AdminDebuggerProps) {
  const [userInfo, setUserInfo] = useState<UserDebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [makingAdmin, setMakingAdmin] = useState(false)

  const fetchUserInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/debug/user`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data)
      } else {
        toast.error('Gagal mengambil info user')
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
      toast.error('Terjadi kesalahan saat mengambil info user')
    } finally {
      setLoading(false)
    }
  }

  const makeAdmin = async () => {
    setMakingAdmin(true)
    try {
      const response = await fetch(`${serverUrl}/make-admin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Berhasil dijadikan admin! Silakan refresh halaman atau logout/login ulang.')
        await fetchUserInfo()
        
        // Refresh halaman setelah 2 detik
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast.error(data.error || 'Gagal mengubah role menjadi admin')
      }
    } catch (error) {
      console.error('Error making admin:', error)
      toast.error('Terjadi kesalahan saat mengubah role')
    } finally {
      setMakingAdmin(false)
    }
  }

  const testVoucherCleanup = async () => {
    try {
      const response = await fetch(`${serverUrl}/vouchers/cleanup`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ autoFix: false })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(`Test berhasil! Ditemukan ${data.corruptVouchers} voucher corrupt.`)
      } else {
        toast.error(data.error || 'Test cleanup gagal')
      }
    } catch (error) {
      console.error('Error testing cleanup:', error)
      toast.error('Terjadi kesalahan saat test cleanup')
    }
  }

  useEffect(() => {
    fetchUserInfo()
  }, [])

  if (!userInfo) {
    return (
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <User className="h-5 w-5" />
            Admin Debugger - Loading...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-pink-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Debugger
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUserInfo}
            disabled={loading}
            className="border-pink-200 text-pink-700 hover:bg-pink-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Informasi User</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Email:</span> {userInfo.user.email}</div>
            <div><span className="font-medium">ID:</span> {userInfo.user.id}</div>
            <div><span className="font-medium">Name:</span> {userInfo.user.user_metadata?.name || 'Tidak ada'}</div>
          </div>
        </div>

        {/* Role Status */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Status Role</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Is Admin:</span>
              {userInfo.roleCheck.isAdmin ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ya
                </Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  <XCircle className="h-3 w-3 mr-1" />
                  Tidak
                </Badge>
              )}
            </div>
            <div className="text-sm">
              <span className="font-medium">Role Value:</span> {userInfo.roleCheck.roleValue || 'Tidak ada'}
            </div>
            <div className="text-sm">
              <span className="font-medium">Has Metadata:</span> {userInfo.roleCheck.hasMetadata ? 'Ya' : 'Tidak'}
            </div>
          </div>
        </div>

        {/* User Metadata */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">User Metadata</h3>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto">
            {JSON.stringify(userInfo.user.user_metadata, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {!userInfo.roleCheck.isAdmin && (
            <Button
              onClick={makeAdmin}
              disabled={makingAdmin}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {makingAdmin ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              {makingAdmin ? 'Mengubah Role...' : 'Jadikan Admin'}
            </Button>
          )}
          
          <Button
            onClick={testVoucherCleanup}
            variant="outline"
            className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            Test Voucher Cleanup
          </Button>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Catatan:</strong> Komponen ini hanya untuk debugging. 
            Setelah masalah role admin diperbaiki, komponen ini bisa dihapus.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}