import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Eye, EyeOff, User, Mail, Lock, UserPlus, LogIn, Stethoscope, Users } from 'lucide-react'
import { supabase, serverUrl } from '../utils/supabase/client'
import { publicAnonKey } from '../utils/supabase/info'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { AnimatedBackground } from './AnimatedBackground'

interface User {
  id: string
  email: string
  user_metadata?: {
    name?: string
    role?: string
  }
}

interface ClinicSettings {
  name: string
  logo: string | null
}

interface AuthProps {
  onAuthSuccess: (user: User) => void
  clinicSettings: ClinicSettings
}

export function Auth({ onAuthSuccess, clinicSettings }: AuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('karyawan')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Step 1: Login with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Login gagal - user tidak ditemukan')
      }

      // Step 2: Verify user exists in our system
      const response = await fetch(`${serverUrl}/verify-user`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      const result = await response.json()

      if (!result.success) {
        await supabase.auth.signOut()
        if (result.needsRegistration) {
          setError('Akun belum terdaftar dalam sistem. Silakan registrasi terlebih dahulu.')
        } else {
          setError(result.error || 'User tidak dikenali sistem')
        }
        return
      }

      // Step 3: Success - update user metadata and proceed
      const userData: User = {
        id: authData.user.id,
        email: authData.user.email!,
        user_metadata: {
          name: result.user.name,
          role: result.user.role
        }
      }

      onAuthSuccess(userData)

    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Terjadi kesalahan saat login')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('🚀 Starting registration...')
      console.log('📡 Server URL:', serverUrl)
      
      const requestData = {
        email: email.trim().toLowerCase(),
        password: password,
        name: name.trim(),
        role: role
      }
      
      console.log('📋 Request data:', {
        ...requestData,
        password: '***hidden***'
      })

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch(`${serverUrl}/register`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(requestData)
      })

      clearTimeout(timeoutId)
      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ Response error text:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('📨 Response result:', result)

      if (!result.success) {
        setError(result.error || 'Registrasi gagal')
        return
      }

      setSuccess(result.message)
      
      // Reset form
      setEmail('')
      setPassword('')
      setName('')
      setRole('karyawan')

    } catch (error: any) {
      console.error('💥 Register error:', error)
      
      if (error.name === 'AbortError') {
        setError('⏰ Timeout - Registrasi membutuhkan waktu terlalu lama. Silakan coba lagi.')
      } else {
        setError(error.message || 'Terjadi kesalahan saat registrasi. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4 relative">
      <AnimatedBackground 
        particleCount={30}
        colors={['#fce7f3', '#f3e8ff', '#e0f2fe']}
        speed={0.15}
        className="opacity-25"
      />
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <ImageWithFallback
            src={clinicSettings.logo}
            alt="Logo Klinik"
            className="h-16 w-auto mx-auto mb-4 drop-shadow-md"
          />
          <h1 className="text-3xl text-pink-800 mb-2">
            {clinicSettings.name}
          </h1>
          <p className="text-pink-600 text-sm">
            Sistem Manajemen Klinik
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-white/90 shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-pink-800">
              Selamat Datang
            </CardTitle>
            <CardDescription>
              Silakan login atau registrasi untuk mengakses sistem
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Registrasi
                </TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-pink-500" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-pink-500" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-pink-500 hover:text-pink-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Memproses...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Login
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* REGISTER TAB */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-pink-500" />
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Nama lengkap"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-pink-500" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-pink-500" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-pink-500 hover:text-pink-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Role/Posisi</Label>
                    <RadioGroup value={role} onValueChange={setRole}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="karyawan" id="karyawan" />
                        <Label htmlFor="karyawan" className="flex items-center gap-2 cursor-pointer">
                          <Users className="h-4 w-4 text-blue-500" />
                          Karyawan/Staff
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dokter" id="dokter" />
                        <Label htmlFor="dokter" className="flex items-center gap-2 cursor-pointer">
                          <Stethoscope className="h-4 w-4 text-green-500" />
                          Dokter
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Memproses...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Registrasi
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Error & Success Messages */}
            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mt-4 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}