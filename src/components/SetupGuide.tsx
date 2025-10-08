import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { CheckCircle, AlertCircle, Database, User, Key, Target, RefreshCw } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'

export function SetupGuide() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [setupResult, setSetupResult] = useState<any>(null)
  const [checkResult, setCheckResult] = useState<any>(null)

  const steps = [
    {
      id: 1,
      title: 'Persiapan',
      description: 'Pastikan database Supabase sudah siap',
      icon: <Database className="h-5 w-5" />
    },
    {
      id: 2,
      title: 'Setup User',
      description: 'Buat akun user untuk login',
      icon: <User className="h-5 w-5" />
    },
    {
      id: 3,
      title: 'Verifikasi',
      description: 'Test login dan akses sistem',
      icon: <CheckCircle className="h-5 w-5" />
    },
    {
      id: 4,
      title: 'Selesai',
      description: 'Sistem siap digunakan',
      icon: <Target className="h-5 w-5" />
    }
  ]

  const checkDatabaseStatus = async () => {
    try {
      setIsLoading(true)
      setStatusMessage('Memeriksa status database...')
      
      const response = await fetch(`${serverUrl}/check-setup`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setCheckResult(result.data)
        setStatusMessage('Status database berhasil diperiksa')
        
        if (result.data.adekaUserExists) {
          setStep(4)
          setStatusMessage('✅ Setup sudah lengkap! User siap untuk login.')
        } else {
          setStep(2)
          setStatusMessage('Database kosong, lanjut ke setup user')
        }
      } else {
        throw new Error(result.error || 'Gagal memeriksa status')
      }
    } catch (error) {
      console.error('Error checking database:', error)
      setStatusMessage(`❌ Gagal memeriksa database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const setupUser = async () => {
    try {
      setIsLoading(true)
      setStatusMessage('Membuat user account...')
      
      const response = await fetch(`${serverUrl}/quick-setup-adeka`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setSetupResult(result)
        setStep(3)
        setStatusMessage('✅ User account berhasil dibuat!')
        
        // Auto-check status after setup
        setTimeout(() => {
          checkDatabaseStatus()
        }, 1000)
      } else {
        throw new Error(result.error || 'Setup gagal')
      }
    } catch (error) {
      console.error('Setup error:', error)
      setStatusMessage(`❌ Setup gagal: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Database className="h-4 w-4" />
              <AlertDescription>
                <strong>Database URL:</strong> https://bxtefmfkcwbyqoctpfdb.supabase.co<br />
                <strong>Status:</strong> Siap untuk setup
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Sistem ini akan terhubung ke database Supabase baru. Pastikan:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Database Supabase sudah dikonfigurasi</li>
                <li>• Koneksi internet stabil</li>
                <li>• Server edge functions aktif</li>
              </ul>
            </div>
            <Button 
              onClick={checkDatabaseStatus}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memeriksa...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Periksa Database
                </>
              )}
            </Button>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h3 className="flex items-center gap-2 text-pink-800 mb-3">
                <User className="h-5 w-5" />
                User Account yang Akan Dibuat
              </h3>
              <div className="space-y-2 text-sm">
                <div><strong>Email:</strong> adeka83@gmail.com</div>
                <div><strong>Password:</strong> 1sampai9</div>
                <div><strong>Nama:</strong> Ade Mardiansyah Eka Putra</div>
                <div><strong>Role:</strong> Administrator</div>
                <div><strong>Status:</strong> <Badge variant="secondary">auth (bisa login)</Badge></div>
              </div>
            </div>
            
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                User akan dibuat sebagai Employee dan Doctor dengan status 'auth' sehingga bisa login ke sistem.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={setupUser}
              disabled={isLoading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setup User...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Buat User Account
                </>
              )}
            </Button>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            {setupResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 mb-3">✅ Setup Berhasil!</h3>
                <div className="space-y-1 text-sm text-green-700">
                  {setupResult.instructions?.map((instruction: string, index: number) => (
                    <div key={index}>{instruction}</div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="flex items-center gap-2 text-blue-800 mb-3">
                <Key className="h-5 w-5" />
                Cara Login
              </h3>
              <div className="space-y-2 text-sm text-blue-700">
                <p>1. Kembali ke halaman login</p>
                <p>2. Gunakan email: <code className="bg-blue-100 px-1 rounded">adeka83@gmail.com</code></p>
                <p>3. Gunakan password: <code className="bg-blue-100 px-1 rounded">1sampai9</code></p>
                <p>4. Klik "Masuk" dan mulai menggunakan sistem</p>
              </div>
            </div>
            
            <Button 
              onClick={checkDatabaseStatus}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memverifikasi...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verifikasi Setup
                </>
              )}
            </Button>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-green-800 text-lg font-medium mb-2">🎉 Setup Selesai!</h3>
              <p className="text-green-700 text-sm">
                Database dan user account berhasil dibuat. Sistem siap digunakan.
              </p>
            </div>
            
            {checkResult && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-gray-800 mb-3">📊 Status Database</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Total Employees:</strong> {checkResult.totalEmployees}
                  </div>
                  <div>
                    <strong>Total Doctors:</strong> {checkResult.totalDoctors}
                  </div>
                  <div>
                    <strong>Auth Employees:</strong> {checkResult.authEmployees}
                  </div>
                  <div>
                    <strong>Auth Doctors:</strong> {checkResult.authDoctors}
                  </div>
                </div>
                
                {checkResult.authEmployeesList?.length > 0 && (
                  <div className="mt-3">
                    <strong className="text-sm">Auth Users:</strong>
                    <ul className="text-sm text-gray-600 mt-1">
                      {checkResult.authEmployeesList.map((emp: any, idx: number) => (
                        <li key={idx}>• {emp.name} ({emp.email})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-800 mb-2">🚀 Langkah Selanjutnya</h3>
              <div className="space-y-1 text-sm text-blue-700">
                <p>• Kembali ke halaman login dan masuk dengan akun yang sudah dibuat</p>
                <p>• Mulai gunakan sistem manajemen klinik</p>
                <p>• Tambahkan data dokter, karyawan, dan pasien sesuai kebutuhan</p>
                <p>• Konfigurasi pengaturan klinik di menu Settings</p>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-pink-200 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-pink-800">
              <Database className="h-6 w-6" />
              Setup Database Falasifah Dental Clinic
            </CardTitle>
            <CardDescription>
              Setup sistem absensi klinik dengan database baru
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step Progress */}
            <div className="flex items-center justify-between">
              {steps.map((stepItem, index) => (
                <div key={stepItem.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                    ${step >= stepItem.id 
                      ? 'bg-pink-600 border-pink-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}>
                    {step > stepItem.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      stepItem.icon
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-16 h-0.5 mx-2 transition-all duration-200
                      ${step > stepItem.id ? 'bg-pink-600' : 'bg-gray-300'}
                    `} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Labels */}
            <div className="flex items-center justify-between text-center">
              {steps.map((stepItem) => (
                <div key={stepItem.id} className="flex-1 px-2">
                  <h3 className={`text-sm font-medium ${
                    step >= stepItem.id ? 'text-pink-800' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </h3>
                  <p className={`text-xs ${
                    step >= stepItem.id ? 'text-pink-600' : 'text-gray-400'
                  }`}>
                    {stepItem.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <Alert className="border-pink-200 bg-pink-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Status:</strong> {statusMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Current Step Content */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Step {step}: {steps.find(s => s.id === step)?.title}
              </h2>
              {getCurrentStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1 || isLoading}
              >
                Kembali
              </Button>
              
              {step < 4 && (
                <Button
                  onClick={() => setStep(Math.min(4, step + 1))}
                  disabled={isLoading}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  Lanjut
                </Button>
              )}
              
              {step === 4 && (
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Selesai & Login
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}