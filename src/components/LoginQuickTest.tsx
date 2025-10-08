import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { serverUrl, supabase } from '../utils/supabase/client'
import { publicAnonKey } from '../utils/supabase/info'
import { DoctorAuthDiagnostic } from './DoctorAuthDiagnostic'
import { ServerAuthDiagnostic } from './ServerAuthDiagnostic'

interface LoginQuickTestProps {
  onFillCredentials?: (email: string, password: string) => void
  accessToken?: string
}

export function LoginQuickTest({ onFillCredentials, accessToken }: LoginQuickTestProps) {
  const [loading, setLoading] = useState(false)
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [showServerDiagnostic, setShowServerDiagnostic] = useState(false)

  const setupTestDoctor = async () => {
    setLoading(true)
    try {
      console.log('Setting up test doctor...')
      console.log('Server URL:', serverUrl)
      
      const response = await fetch(`${serverUrl}/debug/setup-test-doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      console.log('Setup response status:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Test doctor setup result:', data)
        
        toast.success(`✅ Test Doctor Setup Berhasil!

📋 Doctor: ${data.doctor?.name || 'Test Doctor'}
📧 Email: ${data.loginCredentials?.email || 'test.dokter@example.com'}
🔐 Password: ${data.loginCredentials?.password || 'testpassword123'}

Sekarang bisa test login dengan credentials di atas!`)
      } else {
        const errorText = await response.text()
        console.error('Setup error response:', response.status, errorText)
        
        let errorMessage = 'Server error'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorJson.message || errorText
        } catch (e) {
          errorMessage = errorText
        }
        
        toast.error(`Gagal setup test doctor: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Setup exception:', error)
      toast.error('Terjadi kesalahan saat setup test doctor')
    } finally {
      setLoading(false)
    }
  }

  const testDirectEndpoint = async () => {
    setLoading(true)
    try {
      console.log('Testing direct endpoint access...')
      
      // Test multiple endpoints to see which ones work
      const endpoints = [
        '/health',
        '/debug/setup-test-doctor'
      ]
      
      for (const endpoint of endpoints) {
        const fullUrl = `${serverUrl}${endpoint}`
        console.log(`Testing: ${fullUrl}`)
        
        try {
          const response = await fetch(fullUrl, {
            method: endpoint.includes('setup-test-doctor') ? 'POST' : 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            }
          })
          
          console.log(`${endpoint}: ${response.status} ${response.statusText}`)
          
          if (response.ok && endpoint === '/health') {
            const data = await response.json()
            console.log('Health data:', data)
          }
        } catch (error) {
          console.log(`${endpoint}: Error -`, error)
        }
      }
      
      toast.success('✅ Direct endpoint test completed - check console')
      
    } catch (error) {
      console.error('Direct test error:', error)
      toast.error('❌ Direct test failed')
    } finally {
      setLoading(false)
    }
  }

  const testVerifyEndpoint = async () => {
    setLoading(true)
    try {
      console.log('Testing server health...')
      console.log('Health URL:', `${serverUrl}/health`)
      
      const response = await fetch(`${serverUrl}/health`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      console.log('Health response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Server health:', data)
        toast.success(`✅ Server Online: ${data.status}`)
      } else {
        const errorText = await response.text()
        console.error('Health check failed:', response.status, errorText)
        toast.error(`❌ Server Error: ${response.status}`)
      }
    } catch (error) {
      console.error('Server test error:', error)
      toast.error('❌ Server tidak dapat dijangkau')
    } finally {
      setLoading(false)
    }
  }

  const testSpecificDoctor = async () => {
    setLoading(true)
    try {
      console.log('Testing specific doctor: drga.falasifah...')
      
      const email = 'lalafalasifah@gmail.com'
      const response = await fetch(`${serverUrl}/debug/doctor-by-email/${encodeURIComponent(email)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Doctor debug result:', data)
        
        if (data.success) {
          toast.success(`✅ Doctor Found!
          
👤 Name: ${data.doctor.name}
📧 Email: ${data.doctor.email}
🔑 Has Login Access: ${data.doctor.hasLoginAccess ? 'Yes' : 'No'}
🆔 Auth User ID: ${data.doctor.authUserId || 'Not set'}
✅ Auth User Exists: ${data.authUserExists ? 'Yes' : 'No'}
🚪 Can Login: ${data.canLogin ? 'YES' : 'NO'}`)
        } else {
          toast.error(`❌ Doctor Not Found
          
📧 Searched: ${data.requestedEmail}
📊 Total doctors: ${data.allDoctorEmails?.length || 0}

Available emails:
${data.allDoctorEmails?.slice(0, 3).map(d => `• ${d.email}`).join('\n') || 'None'}`)
        }
      } else {
        const error = await response.text()
        console.error('Doctor debug error:', error)
        toast.error(`Failed to debug doctor: ${error}`)
      }
    } catch (error) {
      console.error('Doctor debug exception:', error)
      toast.error('Error debugging doctor')
    } finally {
      setLoading(false)
    }
  }

  const resetDoctorPassword = async () => {
    setLoading(true)
    try {
      console.log('🔧 Emergency password reset for drga.falasifah...')
      
      const response = await fetch(`${serverUrl}/emergency/reset-doctor-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emergencyCode: 'FALASIFAH2024RESET',
          email: 'drga.falasifah@gmail.com',
          newPassword: 'falasifah123'
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Password reset successful:', data)
        toast.success(`✅ Password Reset Success!\n\ndrga.falasifah@gmail.com\nNew password: falasifah123\n\nTry logging in now!`)
      } else {
        console.error('❌ Password reset failed:', data)
        toast.error(`❌ Password Reset Failed!\n\n${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Reset error:', error)
      toast.error(`❌ Password Reset Error!\n\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testCompleteLoginFlow = async () => {
    setLoading(true)
    try {
      console.log('Testing complete login flow for drga.falasifah...')
      
      // Untuk test ini, kita perlu password yang sebenarnya
      const email = 'lalafalasifah@gmail.com'
      const password = prompt('Enter password for drga.falasifah:')
      
      if (!password) {
        toast.error('Password diperlukan untuk test login flow')
        return
      }
      
      const response = await fetch(`${serverUrl}/debug/test-login-flow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Login flow test result:', data)
        
        if (data.success) {
          toast.success(`✅ Complete Login Flow Success!
          
🔐 Supabase Auth: ${data.steps.supabase_auth}
👤 Doctor Verification: ${data.steps.doctor_verification}
📝 User Info Generation: ${data.steps.user_info_generation}

Doctor: ${data.doctorData.name}
Email: ${data.doctorData.email}
Has Login Access: ${data.doctorData.hasLoginAccess}`)
        } else {
          let errorMsg = `❌ Login Flow Failed at: ${data.step}\n\nError: ${data.error}`
          
          if (data.step === 'doctor_verification' && data.availableDoctors) {
            errorMsg += `\n\nSearched: ${data.searchedEmail}\nAuth Email: ${data.authUserEmail}\n\nAvailable doctors:\n${data.availableDoctors.slice(0, 3).map(d => `• ${d.name} (${d.email})`).join('\n')}`
          }
          
          toast.error(errorMsg)
        }
      } else {
        const error = await response.text()
        console.error('Login flow test error:', error)
        toast.error(`Failed to test login flow: ${error}`)
      }
    } catch (error) {
      console.error('Login flow test exception:', error)
      toast.error('Error testing login flow')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-blue-200 bg-blue-50 mb-4">
      <CardHeader>
        <CardTitle className="text-blue-800 text-sm">🧪 Quick Login Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={setupTestDoctor}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            {loading ? 'Setting up...' : '🏥 Setup Test Doctor'}
          </Button>
          
          <Button
            size="sm"
            onClick={testVerifyEndpoint}
            disabled={loading}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs"
          >
            {loading ? 'Testing...' : '🔗 Test Server'}
          </Button>
          
          <Button
            size="sm"
            onClick={testDirectEndpoint}
            disabled={loading}
            variant="outline"
            className="border-green-200 text-green-600 hover:bg-green-50 text-xs"
          >
            {loading ? 'Testing...' : '🧪 Direct Test'}
          </Button>
          
          {onFillCredentials && (
            <Button
              size="sm"
              onClick={() => onFillCredentials('test.dokter@example.com', 'testpassword123')}
              disabled={loading}
              variant="outline"
              className="border-purple-200 text-purple-600 hover:bg-purple-50 text-xs"
            >
              🎯 Fill Form
            </Button>
          )}
          
          <Button
            size="sm"
            onClick={() => setShowDiagnostic(!showDiagnostic)}
            disabled={loading}
            variant="outline"
            className="border-orange-200 text-orange-600 hover:bg-orange-50 text-xs"
          >
            {showDiagnostic ? '🔼 Hide Diagnostic' : '🩺 Doctor Diagnostic'}
          </Button>
          
          <Button
            size="sm"
            onClick={() => setShowServerDiagnostic(!showServerDiagnostic)}
            disabled={loading}
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs"
          >
            {showServerDiagnostic ? '🔼 Hide Server' : '🔧 Server Diagnostic'}
          </Button>
          
          <Button
            size="sm"
            onClick={testSpecificDoctor}
            disabled={loading}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
          >
            🔍 Debug Falasifah
          </Button>
          
          <Button
            size="sm"
            onClick={testCompleteLoginFlow}
            disabled={loading}
            variant="outline"
            className="border-purple-200 text-purple-600 hover:bg-purple-50 text-xs"
          >
            🔄 Test Complete Flow
          </Button>
          
          {onFillCredentials && (
            <Button
              size="sm"
              onClick={() => onFillCredentials('drga.falasifah@gmail.com', 'falasifah123')}
              disabled={loading}
              variant="outline"
              className="border-pink-200 text-pink-600 hover:bg-pink-50 text-xs"
            >
              👩‍⚕️ Fill Falasifah
            </Button>
          )}
          
          <Button
            size="sm"
            onClick={resetDoctorPassword}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs"
          >
            {loading ? 'Resetting...' : '🚨 Reset Password'}
          </Button>
        </div>
        
        <div className="mt-3 text-xs text-blue-700">
          <p><strong>Test Credentials:</strong></p>
          <p>📧 Test Doctor: test.dokter@example.com | testpassword123</p>
          <p>👩‍⚕️ Real Doctor: drga.falasifah@gmail.com | falasifah123</p>
          <p>👩‍⚕️ Falasifah: lalafalasifah@gmail.com | [set password in diagnostic]</p>
          <p><strong>Debug Tools:</strong></p>
          <p>🔍 Debug Falasifah = Check doctor data status</p>
          <p>🩺 Doctor Diagnostic = Fix all doctor auth issues</p>
        </div>
        
        {showDiagnostic && (
          <div className="mt-4">
            <DoctorAuthDiagnostic />
          </div>
        )}
        
        {showServerDiagnostic && (
          <div className="mt-4">
            <ServerAuthDiagnostic accessToken={accessToken} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}