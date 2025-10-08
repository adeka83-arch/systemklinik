import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { serverUrl } from '../utils/supabase/client'
import { publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { Loader2, User, Database, CheckCircle, AlertCircle, Settings } from 'lucide-react'

interface DatabaseSetupProps {
  onSetupComplete: () => void
}

export function DatabaseSetup({ onSetupComplete }: DatabaseSetupProps) {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [setupData, setSetupData] = useState<any>(null)

  const checkCurrentSetup = async () => {
    setChecking(true)
    try {
      const response = await fetch(`${serverUrl}/check-setup`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSetupData(data.data)
        toast.success('Data setup berhasil dicek')
      } else {
        const error = await response.json()
        toast.error('Gagal cek setup: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      toast.error('Error checking setup: ' + error.message)
    } finally {
      setChecking(false)
    }
  }

  const quickSetupAdeka = async () => {
    setLoading(true)
    toast.info('Memulai setup cepat untuk Adeka...')

    try {
      // Try setup untuk existing user dulu
      console.log('🔄 Trying setup for existing user...')
      let response = await fetch(`${serverUrl}/setup-existing-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: 'adeka83@gmail.com',
          name: 'Ade Mardiansyah Eka Putra'
        })
      })

      // Jika gagal, coba setup complete
      if (!response.ok) {
        console.log('⚠️ Existing user setup failed, trying complete setup...')
        response = await fetch(`${serverUrl}/quick-setup-adeka`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          }
        })
      }

      if (response.ok) {
        const data = await response.json()
        toast.success('Setup berhasil!')
        console.log('✅ Setup successful:', data)
        
        // Show success details
        if (data.instructions) {
          console.log('Setup instructions:', data.instructions)
        }
        
        // Wait a bit then trigger completion
        setTimeout(() => {
          onSetupComplete()
        }, 2000)
      } else {
        const error = await response.json()
        console.error('❌ Setup failed:', error)
        toast.error('Setup gagal: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('💥 Setup exception:', error)
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const setupExistingUser = async () => {
    setLoading(true)
    toast.info('Setup untuk user yang sudah ada...')

    try {
      const response = await fetch(`${serverUrl}/setup-existing-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: 'adeka83@gmail.com',
          name: 'Ade Mardiansyah Eka Putra'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Setup existing user berhasil!')
        console.log('✅ Existing user setup successful:', data)
        
        setTimeout(() => {
          onSetupComplete()
        }, 2000)
      } else {
        const error = await response.json()
        console.error('❌ Existing user setup failed:', error)
        toast.error('Setup gagal: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('💥 Existing user setup exception:', error)
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const setupCompleteUser = async () => {
    setLoading(true)
    toast.info('Membuat setup lengkap...')

    try {
      const response = await fetch(`${serverUrl}/setup-complete-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email: 'adeka83@gmail.com',
          password: '1sampai9',
          name: 'Ade Mardiansyah Eka Putra'
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Setup lengkap berhasil!')
        
        setTimeout(() => {
          onSetupComplete()
        }, 2000)
      } else {
        const error = await response.json()
        toast.error('Setup gagal: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      toast.error('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <Card className="border-pink-200 bg-pink-50/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 bg-pink-600 rounded-full flex items-center justify-center">
              <Database className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-pink-800">Setup Database Baru</CardTitle>
            <CardDescription className="text-pink-600">
              Database baru membutuhkan setup data user dan karyawan
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Setup Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup Actions
            </CardTitle>
            <CardDescription>
              Pilih salah satu metode setup untuk membuat data yang diperlukan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Setup */}
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-green-800 font-medium">Quick Setup (Recommended)</h3>
                  <p className="text-green-700 text-sm mt-1">
                    Setup otomatis untuk email: adeka83@gmail.com dengan password: 1sampai9
                  </p>
                  <Button
                    onClick={quickSetupAdeka}
                    disabled={loading}
                    className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 mr-2" />
                        Quick Setup Adeka
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing User Setup */}
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-orange-800 font-medium">Setup User Yang Sudah Ada</h3>
                  <p className="text-orange-700 text-sm mt-1">
                    Khusus untuk user yang sudah ada di Supabase Auth tapi belum ada di database
                  </p>
                  <Button
                    onClick={setupExistingUser}
                    disabled={loading}
                    variant="outline"
                    className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-100"
                    size="sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      'Setup Existing User'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Complete Setup */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-blue-800 font-medium">Complete Setup</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Setup lengkap dengan auth user, employee record, dan doctor record
                  </p>
                  <Button
                    onClick={setupCompleteUser}
                    disabled={loading}
                    variant="outline"
                    className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                    size="sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      'Setup Lengkap'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Check Current Setup */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-gray-800 font-medium">Check Current Setup</h3>
                  <p className="text-gray-700 text-sm mt-1">
                    Cek status data yang sudah ada di database
                  </p>
                  <Button
                    onClick={checkCurrentSetup}
                    disabled={checking}
                    variant="outline"
                    className="mt-3"
                    size="sm"
                  >
                    {checking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Check Setup Status'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Status */}
        {setupData && (
          <Card>
            <CardHeader>
              <CardTitle>Setup Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">Total Employees</div>
                  <div className="text-lg font-bold text-gray-900">{setupData.totalEmployees}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700">Total Doctors</div>
                  <div className="text-lg font-bold text-gray-900">{setupData.totalDoctors}</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="font-medium text-green-700">Auth Employees</div>
                  <div className="text-lg font-bold text-green-800">{setupData.authEmployees}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="font-medium text-blue-700">Auth Doctors</div>
                  <div className="text-lg font-bold text-blue-800">{setupData.authDoctors}</div>
                </div>
              </div>

              <div className={`p-3 rounded ${setupData.adekaUserExists ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {setupData.adekaUserExists ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={setupData.adekaUserExists ? 'text-green-800' : 'text-red-800'}>
                    Adeka User: {setupData.adekaUserExists ? 'EXISTS' : 'NOT FOUND'}
                  </span>
                </div>
              </div>

              {setupData.authEmployeesList && setupData.authEmployeesList.length > 0 && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium text-gray-700 mb-2">Auth Employees:</div>
                  {setupData.authEmployeesList.map((emp, idx) => (
                    <div key={idx} className="text-sm text-gray-600">
                      • {emp.name} ({emp.email})
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-yellow-800 text-sm">
              <h4 className="font-medium mb-2">📋 Yang Akan Dibuat:</h4>
              <ul className="space-y-1 list-disc ml-4">
                <li>Employee record dengan status: "auth" (bisa login)</li>
                <li>Doctor record dengan status: "auth" (bisa login)</li>
                <li>User mapping untuk verifikasi login cepat</li>
                <li>Link ke Supabase Auth user yang sudah ada</li>
              </ul>
              <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                <strong>💡 Tips:</strong> Karena user sudah ada di Supabase Auth, gunakan <strong>"Setup User Yang Sudah Ada"</strong> atau <strong>"Quick Setup"</strong> untuk membuat data yang diperlukan tanpa membuat user auth baru.
              </div>
              <p className="mt-2 text-xs">
                Setelah setup, Anda bisa login dengan email: adeka83@gmail.com dan password: 1sampai9
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}