import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { serverUrl } from '../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

interface AuthSetupHelperProps {
  onComplete?: () => void
}

export function AuthSetupHelper({ onComplete }: AuthSetupHelperProps) {
  const [loading, setLoading] = useState(false)
  const [debugging, setDebugging] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    type: 'employee' as 'doctor' | 'employee'
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = 'Email harus diisi'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password harus diisi'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter'
    }
    
    if (!formData.name) {
      newErrors.name = 'Nama harus diisi'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Nama minimal 2 karakter'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSetupUser = async () => {
    if (!validateForm()) {
      toast.error('Mohon lengkapi semua field yang diperlukan')
      return
    }
    
    setLoading(true)
    
    try {
      console.log('🔧 Setting up Supabase auth user...', formData.email)
      
      const response = await fetch(`${serverUrl}/setup-auth-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      console.log('📡 Server response:', data)
      
      if (response.ok && data.success) {
        console.log('✅ Auth user setup successful:', data)
        
        if (data.authUserExists) {
          toast.success(`${formData.name} berhasil ditambahkan ke sistem! (Auth user sudah ada)`)
        } else {
          toast.success(`${formData.name} berhasil dibuat sebagai ${formData.type}! Silakan login sekarang.`)
        }
        
        if (onComplete) {
          onComplete()
        }
      } else {
        console.log('❌ Auth user setup failed:', data)
        
        // Handle specific error cases
        if (response.status === 409) {
          // User already exists
          if (data.existingUser) {
            toast.warning(`Email ${formData.email} sudah terdaftar sebagai ${data.existingUser.name}`)
          } else {
            toast.warning('Email sudah terdaftar dalam sistem')
          }
        } else if (data.error && data.error.includes('already been registered')) {
          toast.info('User sudah terdaftar di Supabase Auth. Mencoba membuat record dokter/karyawan...')
          
          // Try to just create the doctor/employee record
          await handleCreateRecord()
        } else {
          toast.error(data.error || 'Gagal membuat user')
        }
      }
    } catch (error) {
      console.log('❌ Auth setup error:', error)
      toast.error('Terjadi kesalahan saat setup user. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRecord = async () => {
    try {
      console.log('🔄 Creating fallback record for existing auth user...')
      
      // Just try to verify if user can login now
      const verifyResponse = await fetch(`${serverUrl}/verify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: formData.email })
      })

      const verifyData = await verifyResponse.json()
      
      if (verifyResponse.ok && verifyData.success) {
        toast.success(`${formData.name} sudah siap untuk login!`)
        if (onComplete) {
          onComplete()
        }
      } else {
        toast.info('Auth user sudah ada. Silakan coba login langsung.')
        if (onComplete) {
          onComplete()
        }
      }
    } catch (error) {
      console.log('Error in fallback record creation:', error)
      toast.info('User mungkin sudah siap. Coba login langsung.')
      if (onComplete) {
        onComplete()
      }
    }
  }

  const handleDebugUser = async () => {
    if (!formData.email) {
      toast.error('Masukkan email terlebih dahulu')
      return
    }
    
    setDebugging(true)
    try {
      const response = await fetch(`${serverUrl}/debug-user-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: formData.email })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setDebugInfo(data.status)
        console.log('🔍 Debug info:', data.status)
        
        if (data.status.canLogin) {
          toast.success('User sudah bisa login!')
        } else if (data.status.kvStore.hasDoctor || data.status.kvStore.hasEmployee) {
          toast.warning('User ada di database tapi status belum auth')
        } else if (data.status.supabaseAuth.hasUser) {
          toast.info('User ada di Supabase Auth tapi belum ada record dokter/karyawan')
        } else {
          toast.info('User belum terdaftar sama sekali')
        }
      } else {
        toast.error('Gagal mengecek status user')
      }
    } catch (error) {
      console.log('Debug error:', error)
      toast.error('Terjadi kesalahan saat debug')
    } finally {
      setDebugging(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-pink-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-pink-800">Setup User Auth</CardTitle>
          <CardDescription>
            Setup akun Supabase Auth untuk dokter/karyawan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, email: e.target.value }))
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
              }}
              placeholder="contoh: nama@email.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, password: e.target.value }))
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
              }}
              placeholder="Minimal 6 karakter"
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }))
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }))
              }}
              placeholder="Nama lengkap pengguna"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipe User</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: 'doctor' | 'employee') => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Dokter</SelectItem>
                <SelectItem value="employee">Karyawan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleSetupUser}
              disabled={loading || !formData.email || !formData.password || !formData.name}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {loading ? 'Sedang Setup...' : 'Setup User Auth'}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setFormData({
                  email: 'adeka83@gmail.com',
                  password: '1sampai9',
                  name: 'Dr. Adeka Falasifah',
                  type: 'doctor'
                })}
                className="text-pink-600 border-pink-300 hover:bg-pink-50"
                disabled={loading || debugging}
              >
                Isi Default Dokter
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setFormData({
                  email: '',
                  password: '',
                  name: '',
                  type: 'employee'
                })}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
                disabled={loading || debugging}
              >
                Reset Form
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDebugUser}
                disabled={debugging || loading || !formData.email}
                className="col-span-2 text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                {debugging ? 'Mengecek Status...' : '🔍 Cek Status User'}
              </Button>
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={onComplete}
              className="text-pink-600 hover:text-pink-800"
            >
              Kembali ke Login
            </Button>
          </div>

          <div className="text-xs text-gray-600 bg-yellow-50 p-3 rounded border">
            <p className="font-medium mb-1">Catatan:</p>
            <p>• Tool ini akan membuat user di Supabase Auth</p>
            <p>• Sekaligus membuat record dokter/karyawan</p>
            <p>• User harus memiliki status 'auth' untuk bisa login</p>
            <p>• Jika email sudah terdaftar, hanya record baru yang dibuat</p>
          </div>
          
          {Object.keys(errors).length > 0 && (
            <div className="text-xs text-red-600 bg-red-50 p-3 rounded border border-red-200">
              <p className="font-medium mb-1">⚠️ Gagal membuat user:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {debugInfo && (
            <div className="text-xs bg-blue-50 p-3 rounded border border-blue-200">
              <p className="font-medium mb-2 text-blue-800">📊 Status User: {debugInfo.email}</p>
              
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-blue-700">Database KV Store:</p>
                  <p className="text-blue-600">
                    {debugInfo.kvStore.hasDoctor ? `✅ Dokter: ${debugInfo.kvStore.doctor.nama} (${debugInfo.kvStore.doctor.status})` : '❌ Tidak ada sebagai dokter'}
                  </p>
                  <p className="text-blue-600">
                    {debugInfo.kvStore.hasEmployee ? `✅ Karyawan: ${debugInfo.kvStore.employee.nama} (${debugInfo.kvStore.employee.status})` : '❌ Tidak ada sebagai karyawan'}
                  </p>
                </div>
                
                <div>
                  <p className="font-medium text-blue-700">Supabase Auth:</p>
                  <p className="text-blue-600">
                    {debugInfo.supabaseAuth.hasUser ? '✅ Terdaftar di Auth' : '❌ Belum terdaftar di Auth'}
                  </p>
                </div>
                
                <div className="pt-1 border-t border-blue-200">
                  <p className="font-medium text-blue-700">
                    Status Login: {debugInfo.canLogin ? '✅ BISA LOGIN' : '❌ TIDAK BISA LOGIN'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}