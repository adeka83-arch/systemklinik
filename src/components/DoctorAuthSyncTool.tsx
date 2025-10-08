import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { toast } from 'sonner'
import { serverUrl } from '../utils/supabase/client'

interface Doctor {
  id: string
  name: string
  email: string
  hasLoginAccess: boolean
  authUserId: string | null
}

interface Props {
  accessToken: string
}

export function DoctorAuthSyncTool({ accessToken }: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [password, setPassword] = useState('')
  const [syncing, setSyncing] = useState<string | null>(null)

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${serverUrl}/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDoctors(data.doctors || [])
        
        const doctorsNeedingAuth = data.doctors.filter(
          (doc: Doctor) => doc.hasLoginAccess && !doc.authUserId
        )
        
        if (doctorsNeedingAuth.length > 0) {
          toast.warning(`${doctorsNeedingAuth.length} dokter memiliki akses login tapi belum memiliki akun Supabase Auth`)
        }
      } else {
        toast.error('Gagal mengambil data dokter')
      }
    } catch (error) {
      console.error('Error fetching doctors:', error)
      toast.error('Error saat mengambil data dokter')
    } finally {
      setLoading(false)
    }
  }

  const checkEmailConflict = async (email: string) => {
    try {
      const response = await fetch(`${serverUrl}/debug/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        const data = await response.json()
        return data
      }
      return { conflict: false }
    } catch (error) {
      console.error('Error checking email conflict:', error)
      return { conflict: false }
    }
  }

  const createAuthUser = async (doctor: Doctor) => {
    if (!password) {
      toast.error('Password harus diisi!')
      return
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter!')
      return
    }

    // Additional password validation
    if (!/^(?=.*[a-z])(?=.*\d).{6,}$/.test(password)) {
      toast.error('Password harus mengandung minimal 1 huruf dan 1 angka!')
      return
    }

    setSyncing(doctor.id)
    
    // Check for email conflicts first
    console.log('🔍 Checking email conflicts for:', doctor.email)
    const emailCheck = await checkEmailConflict(doctor.email)
    if (emailCheck.conflict) {
      console.log('⚠️ Email conflict detected:', emailCheck.existingUser)
      toast.error(`Email ${doctor.email} sudah digunakan oleh user: ${emailCheck.existingUser.name} (${emailCheck.existingUser.role})`)
      setSyncing(null)
      return
    }
    
    console.log('=== FRONTEND AUTH USER CREATION START ===')
    console.log('Doctor ID:', doctor.id)
    console.log('Doctor Name:', doctor.name)
    console.log('Doctor Email:', doctor.email)
    console.log('Password Length:', password.length)
    console.log('Server URL:', `${serverUrl}/doctors/${doctor.id}`)
    
    try {
      const requestBody = {
        ...doctor,
        password: password,
        hasLoginAccess: true
      }
      
      console.log('Request body keys:', Object.keys(requestBody))
      console.log('Request body (password hidden):', { ...requestBody, password: '[HIDDEN]' })
      
      const response = await fetch(`${serverUrl}/doctors/${doctor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('✅ Success response:', responseData)
        toast.success(`✅ Akun auth berhasil dibuat untuk Dr. ${doctor.name}! Email: ${doctor.email}`)
        setPassword('')
        setSelectedDoctor(null)
        
        // Wait a bit before refreshing to allow server to complete
        setTimeout(() => {
          fetchDoctors() // Refresh data
        }, 1500) // Increased wait time
      } else {
        const errorData = await response.json()
        console.error('❌ Auth creation failed:', errorData)
        console.error('Error status:', response.status)
        console.error('Error statusText:', response.statusText)
        
        let userFriendlyError = errorData.error || 'Unknown error'
        if (userFriendlyError.includes('already been registered')) {
          userFriendlyError = `Email ${doctor.email} sudah terdaftar di sistem. Gunakan email lain atau hapus user yang sudah ada.`
        } else if (userFriendlyError.includes('Password')) {
          userFriendlyError = 'Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.'
        }
        
        toast.error(`❌ Gagal membuat akun auth: ${userFriendlyError}`)
      }
    } catch (error) {
      console.error('❌ Error creating auth user:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      toast.error('❌ Error saat membuat akun auth: ' + error.message)
    } finally {
      console.log('=== FRONTEND AUTH USER CREATION END ===')
      setSyncing(null)
    }
  }

  const doctorsNeedingAuth = doctors.filter(doc => doc.hasLoginAccess && !doc.authUserId)
  const doctorsWithAuth = doctors.filter(doc => doc.hasLoginAccess && doc.authUserId)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-pink-800">🔧 Doctor Auth Sync Tool</CardTitle>
        <p className="text-sm text-pink-600">
          Tool untuk sinkronisasi akun login dokter dengan Supabase Auth
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={fetchDoctors}
          disabled={loading}
          className="bg-pink-600 hover:bg-pink-700 text-white"
        >
          {loading ? '🔄 Memuat...' : '📋 Cek Status Dokter'}
        </Button>

        {doctors.length > 0 && (
          <div className="space-y-4">
            {/* Doctors with Auth */}
            {doctorsWithAuth.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription>
                  <strong className="text-green-800">✅ Dokter dengan akun auth ({doctorsWithAuth.length}):</strong>
                  <ul className="mt-2 space-y-1">
                    {doctorsWithAuth.map(doc => (
                      <li key={doc.id} className="text-sm text-green-700">
                        • Dr. {doc.name} ({doc.email}) - Auth ID: {doc.authUserId?.substring(0, 8)}...
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Doctors needing Auth */}
            {doctorsNeedingAuth.length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertDescription>
                  <strong className="text-orange-800">⚠️ Dokter perlu dibuat akun auth ({doctorsNeedingAuth.length}):</strong>
                  <ul className="mt-2 space-y-2">
                    {doctorsNeedingAuth.map(doc => (
                      <li key={doc.id} className="text-sm text-orange-700 border-b border-orange-200 pb-2">
                        <div className="flex items-center justify-between">
                          <span>• Dr. {doc.name} ({doc.email})</span>
                          <Button
                            size="sm"
                            onClick={() => setSelectedDoctor(doc)}
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
                          >
                            Buat Auth
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Create Auth Form */}
            {selectedDoctor && (
              <Card className="border-pink-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-pink-800">
                    🔐 Buat Akun Auth untuk Dr. {selectedDoctor.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-pink-700">Email Dokter</Label>
                    <Input
                      value={selectedDoctor.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-pink-700">Password untuk Login</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contoh: dokter123 (min 6 karakter, 1 huruf & 1 angka)"
                      className="border-pink-200 focus:border-pink-400"
                    />
                    <p className="text-xs text-pink-600 mt-1">
                      Password harus minimal 6 karakter dan mengandung huruf serta angka
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => createAuthUser(selectedDoctor)}
                      disabled={!password || syncing === selectedDoctor.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {syncing === selectedDoctor.id ? '⏳ Membuat...' : '✅ Buat Akun Auth'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedDoctor(null)
                        setPassword('')
                      }}
                      className="border-gray-300"
                    >
                      Batal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {doctorsNeedingAuth.length === 0 && doctorsWithAuth.length > 0 && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  🎉 Semua dokter yang memiliki akses login sudah memiliki akun Supabase Auth!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}