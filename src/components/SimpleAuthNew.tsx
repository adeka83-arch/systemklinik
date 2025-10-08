import { useState, useEffect } from 'react'
import { supabase, serverUrl } from '../utils/supabase/client'
import { toast } from 'sonner@2.0.3'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface AuthProps {
  onAuthSuccess: (user: any) => void
  clinicSettings: any
}

export function SimpleAuthNew({ onAuthSuccess, clinicSettings }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token && session?.user) {
        onAuthSuccess(session.user)
      }
    } catch (error) {
      console.log('Error checking session:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        // REGISTRASI USER BARU
        console.log('🆕 Registering new user:', email)
        
        const response = await fetch(`${serverUrl}/create-new-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            name: name.trim()
          })
        })
        
        const result = await response.json()
        
        if (response.ok && result.success) {
          toast.success('Akun berhasil dibuat! Silakan login.')
          setIsRegister(false)
          setPassword('')
          setName('')
          setError('')
        } else {
          setError(result.error || 'Gagal membuat akun')
        }
        
      } else {
        // LOGIN
        console.log('🔐 Logging in user:', email)
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          console.log('🚫 Login error:', error)
          
          let errorMessage = error.message
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Email atau password salah.'
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Email belum dikonfirmasi. Coba buat akun baru jika belum terdaftar.'
          } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit.'
          }
          
          setError(errorMessage)
        } else if (data.user && data.session) {
          console.log('✅ Login successful for:', data.user.email)
          
          // Auto-register user di database lokal
          try {
            const autoRegisterResponse = await fetch(`${serverUrl}/auto-register-user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`
              },
              body: JSON.stringify({ 
                email: data.user.email,
                userData: {
                  name: data.user.user_metadata?.name || data.user.email.split('@')[0]
                }
              })
            })
            
            let userData = data.user
            
            if (autoRegisterResponse.ok) {
              const autoRegisterData = await autoRegisterResponse.json()
              console.log('✅ Auto-registration successful')
              
              userData = {
                ...data.user,
                user_metadata: {
                  ...data.user.user_metadata,
                  name: autoRegisterData.user.name,
                  role: autoRegisterData.user.role,
                  userType: autoRegisterData.user.userType,
                  position: autoRegisterData.user.position
                }
              }
            } else {
              // Fallback jika auto-register gagal
              userData = {
                ...data.user,
                user_metadata: {
                  ...data.user.user_metadata,
                  name: data.user.user_metadata?.name || data.user.email.split('@')[0],
                  role: 'karyawan',
                  userType: 'employee',
                  position: 'Staff'
                }
              }
            }
            
            onAuthSuccess(userData)
            toast.success('Login berhasil!')
            
          } catch (error) {
            console.log('Auto-register error:', error)
            
            // Tetap login dengan data minimal
            const fallbackUser = {
              ...data.user,
              user_metadata: {
                ...data.user.user_metadata,
                name: data.user.user_metadata?.name || data.user.email.split('@')[0],
                role: 'karyawan',
                userType: 'employee',
                position: 'Staff'
              }
            }
            
            onAuthSuccess(fallbackUser)
            toast.success('Login berhasil!')
          }
        }
      }
    } catch (error: any) {
      console.log('Auth error:', error)
      let errorMessage = 'Terjadi kesalahan sistem. Silakan coba lagi.'
      if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = 'Gagal terhubung ke server. Periksa koneksi internet.'
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setName('')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-pink-200 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-6">
            {clinicSettings.logo && (
              <div className="flex justify-center">
                <div className="relative">
                  <ImageWithFallback
                    src={clinicSettings.logo}
                    alt="Logo Klinik"
                    className="h-20 w-20 object-contain rounded-lg border border-pink-200 shadow-sm"
                  />
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-600 rounded-full border-2 border-white shadow-sm"></div>
                </div>
              </div>
            )}
            <div>
              <CardTitle className="text-2xl font-semibold text-pink-800">{clinicSettings.name}</CardTitle>
              <p className="text-pink-600 mt-2 text-sm">Sistem Manajemen Klinik</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="h-1 w-8 bg-pink-300 rounded"></div>
                <div className="h-1 w-4 bg-pink-500 rounded"></div>
                <div className="h-1 w-8 bg-pink-300 rounded"></div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Field Nama - hanya untuk registrasi */}
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-pink-700 flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Nama Lengkap
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isRegister}
                    className="border-pink-200 focus:border-pink-400 transition-colors duration-200"
                    placeholder="Nama lengkap Anda"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-pink-700 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-pink-200 focus:border-pink-400 transition-colors duration-200"
                  placeholder="nama@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-pink-700 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-pink-200 focus:border-pink-400 transition-colors duration-200"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-red-700 text-sm bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm">
                  <div className="flex items-start gap-2">
                    <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Memproses...</span>
                  </div>
                ) : (
                  isRegister ? 'Daftar' : 'Masuk'
                )}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-pink-600 hover:text-pink-800 text-sm font-medium underline"
                >
                  {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar Baru'}
                </button>
              </div>
              
              {/* Info untuk user */}
              <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium text-blue-700">
                    {isRegister ? 'Registrasi User Baru' : 'Login Sistem'}
                  </p>
                </div>
                <p className="text-blue-600">
                  {isRegister 
                    ? 'Akun baru akan otomatis dibuat dengan email confirmed dan bisa langsung login.' 
                    : 'User akan otomatis didaftarkan sebagai karyawan jika berhasil login.'
                  }
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Quick Access untuk Testing */}
        <Card className="mt-4 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-green-800 text-sm font-medium mb-3">🚀 Quick Test</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('danielgusti@gmail.com')
                  setPassword('test123')
                  setName('Daniel Gusti')
                  setIsRegister(true)
                }}
                className="text-xs border-green-300 text-green-700 hover:bg-green-100"
              >
                👤 Daniel (Register)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('adeka83@gmail.com')
                  setPassword('1sampai9')
                  setIsRegister(false)
                }}
                className="text-xs border-pink-300 text-pink-700 hover:bg-pink-100"
              >
                👨‍⚕️ Adeka (Login)
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            © 2024 {clinicSettings.name}. Sistem Manajemen Klinik.
          </p>
        </div>
      </div>
    </div>
  )
}