import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { serverUrl } from '../utils/supabase/client'
import { toast } from 'sonner@2.0.3'

interface DoctorLoginTestProps {
  accessToken: string
}

export function DoctorLoginTest({ accessToken }: DoctorLoginTestProps) {
  const [testEmail, setTestEmail] = useState('test.dokter@example.com')
  const [testPassword, setTestPassword] = useState('testpassword123')
  const [loading, setLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)

  const createTestDoctor = async () => {
    setLoading(true)
    try {
      console.log('🩺 Creating comprehensive test doctor...')
      
      // First try the enhanced endpoint
      let response = await fetch(`${serverUrl}/debug/create-test-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Test doctor created with full integration:', data)
        
        toast.success(`🎉 Test dokter berhasil dibuat dengan integrasi penuh!

📋 Detail Doctor:
• ID: ${data.doctor.id}
• Nama: ${data.doctor.name}
• Email: ${data.credentials.email}
• Password: ${data.credentials.password}
• Role: ${data.doctor.role}
• Login Access: ${data.doctor.hasLoginAccess ? '✅ Ya' : '❌ Tidak'}
• Auth User ID: ${data.authUser.id}

🔐 Auth User Metadata:
• Role: ${data.authUser.user_metadata?.role}
• User Type: ${data.authUser.user_metadata?.userType}
• Position: ${data.authUser.user_metadata?.position}

🚀 Sekarang coba logout dan login dengan:
📧 ${data.credentials.email}
🔐 ${data.credentials.password}

✅ Doctor sudah terintegrasi dengan sistem verifikasi!`)
        return
      } else {
        console.log('⚠️ Enhanced endpoint failed, trying fallback...')
      }
      
      // Fallback to regular doctor creation
      const doctorData = {
        name: 'Dr. Test Dokter',
        specialization: 'Dokter Umum',
        phone: '081234567890',
        email: testEmail,
        licenseNumber: 'SIP-TEST-2024',
        shifts: ['09:00-15:00'],
        status: 'active',
        hasLoginAccess: true,
        password: testPassword
      }
      
      console.log('📋 Trying fallback doctor creation with data:', doctorData)
      
      response = await fetch(`${serverUrl}/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(doctorData)
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Test doctor created successfully:', data)
        
        // Verify the creation was successful
        if (data.doctor && data.doctor.hasLoginAccess) {
          toast.success(`✅ Test dokter berhasil dibuat (fallback)!

📋 Detail Doctor:
• ID: ${data.doctor.id}
• Nama: ${data.doctor.name}
• Email: ${testEmail}
• Password: ${testPassword}
• Role: ${data.doctor.role}
• Login Access: ${data.doctor.hasLoginAccess ? '✅ Ya' : '❌ Tidak'}
• Auth User ID: ${data.doctor.authUserId || 'Tidak ada'}

🚀 Sekarang coba logout dan login dengan:
📧 ${testEmail}
🔐 ${testPassword}`)
        } else {
          toast.warning(`⚠️ Dokter dibuat tapi ada masalah:
${JSON.stringify(data, null, 2)}`)
        }
      } else {
        const error = await response.json()
        console.error('❌ Failed to create test doctor:', error)
        toast.error(`❌ Gagal membuat test dokter: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating test doctor:', error)
      toast.error('Terjadi kesalahan saat membuat test dokter')
    } finally {
      setLoading(false)
    }
  }

  const verifyDoctorAuth = async () => {
    setVerifyLoading(true)
    try {
      console.log('Verifying doctor data...')
      
      // Check doctors in KV store
      const doctorsResponse = await fetch(`${serverUrl}/debug/doctors`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      // Check auth users
      const authResponse = await fetch(`${serverUrl}/debug/auth-users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (doctorsResponse.ok && authResponse.ok) {
        const doctorsData = await doctorsResponse.json()
        const authData = await authResponse.json()
        
        console.log('Doctors in KV store:', doctorsData)
        console.log('Auth users:', authData)
        
        const testDoctor = doctorsData.doctors.find(doc => doc.email === testEmail)
        const testAuthUser = authData.users.find(user => user.email === testEmail)
        
        let message = `📊 Debug Results:

🗃️ KV Store:
• Total doctors: ${doctorsData.count}
• Test doctor: ${testDoctor ? '✅ Found' : '❌ Not found'}

🔐 Auth Users:
• Total users: ${authData.count}
• Test auth user: ${testAuthUser ? '✅ Found' : '❌ Not found'}

${testDoctor && testAuthUser ? '🎉 Ready for login!' : '⚠️ Setup incomplete'}`

        if (testDoctor) {
          message += `

📋 Doctor Details:
• Name: ${testDoctor.name}
• Email: ${testDoctor.email}
• Has Login Access: ${testDoctor.hasLoginAccess}`
        }

        if (testAuthUser) {
          message += `

🔐 Auth User Details:
• Email: ${testAuthUser.email}
• Created: ${new Date(testAuthUser.created_at).toLocaleString()}`
        }

        toast.success(message)
      } else {
        toast.error('Gagal mengambil data debug')
      }
    } catch (error) {
      console.error('Error verifying doctor auth:', error)
      toast.error('Terjadi kesalahan saat verifikasi')
    } finally {
      setVerifyLoading(false)
    }
  }

  const cleanupTestUsers = async () => {
    try {
      const response = await fetch(`${serverUrl}/debug/cleanup-test-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`✅ Cleanup completed: ${data.summary}`)
      } else {
        toast.error('Gagal cleanup test users')
      }
    } catch (error) {
      console.error('Error cleanup:', error)
      toast.error('Terjadi kesalahan saat cleanup')
    }
  }

  const testVerifyUser = async () => {
    try {
      console.log('🔍 Testing verify-user endpoint...')
      
      const response = await fetch(`${serverUrl}/verify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ email: testEmail })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Verify user successful:', data)
        
        toast.success(`✅ Verify user test berhasil!

👤 User Data:
• ID: ${data.user.id}
• Name: ${data.user.name}
• Email: ${data.user.email}
• Role: ${data.user.role}
• User Type: ${data.user.userType}
• Has Login Access: ${data.user.hasLoginAccess}

🎉 Email ${testEmail} terdaftar di sistem!`)
      } else {
        const error = await response.json()
        console.log('❌ Verify user failed:', error)
        
        toast.error(`❌ Verify user test gagal:

${error.error}

💡 Solusi:
1. Pastikan test doctor sudah dibuat
2. Cek apakah email benar: ${testEmail}
3. Verifikasi hasLoginAccess = true`)
      }
    } catch (error) {
      console.error('Error testing verify user:', error)
      toast.error('Terjadi kesalahan saat test verify user')
    }
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-800">🧪 Doctor Login Test Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="testEmail">Test Email</Label>
            <Input
              id="testEmail"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test.dokter@example.com"
            />
          </div>
          <div>
            <Label htmlFor="testPassword">Test Password</Label>
            <Input
              id="testPassword"
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="testpassword123"
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={createTestDoctor}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Creating...' : '🩺 Create Test Doctor'}
          </Button>
          
          <Button 
            onClick={verifyDoctorAuth}
            disabled={verifyLoading}
            variant="outline"
            className="border-blue-200 text-blue-600"
          >
            {verifyLoading ? 'Checking...' : '🔍 Verify Doctor Auth'}
          </Button>
          
          <Button 
            onClick={testVerifyUser}
            variant="outline"
            className="border-purple-200 text-purple-600"
          >
            🔬 Test Verify User
          </Button>
          
          <Button 
            onClick={cleanupTestUsers}
            variant="outline"
            className="border-red-200 text-red-600"
          >
            🧹 Cleanup Test Users
          </Button>
          
          <Button 
            onClick={() => {
              // Pre-fill the login form and show instructions
              const loginUrl = `/auth?email=${encodeURIComponent(testEmail)}`
              window.open(loginUrl, '_blank')
            }}
            variant="outline"
            className="border-green-200 text-green-600"
          >
            🚀 Test Login
          </Button>
        </div>
        
        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
          <strong>Instructions:</strong>
          <br />1. Click "Create Test Doctor" to create a doctor with login access
          <br />2. Try logging out and logging in with the test credentials
          <br />3. Verify that doctor can access the system with limited permissions
          <br />4. Use "Cleanup Test Users" to remove test data when done
        </div>
      </CardContent>
    </Card>
  )
}