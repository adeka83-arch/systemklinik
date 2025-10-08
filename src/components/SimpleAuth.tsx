import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { toast } from 'sonner@2.0.3'
import { supabase, serverUrl } from '../utils/supabase/client'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { AnimatedBackground } from './AnimatedBackground'
import { Eye, EyeOff, User, Mail, Lock, UserPlus, LogIn, Database, Key } from 'lucide-react'
import { DatabaseConnectionTester } from './DatabaseConnectionTester'
import { DirectDatabaseTester } from './DirectDatabaseTester'

interface User {
  id: string
  email: string
  user_metadata?: {
    name?: string
    role?: string
    position?: string
    userType?: string
  }
}

interface ClinicSettings {
  name: string
  logo: string | null
}

interface SimpleAuthProps {
  onAuthSuccess: (user: User) => void
  clinicSettings: ClinicSettings
}

export function SimpleAuth({ onAuthSuccess, clinicSettings }: SimpleAuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTester, setShowTester] = useState(false)
  const [showDirectTester, setShowDirectTester] = useState(false)

  const handleRegister = async () => {
    try {
      console.log('🆕 REGISTRASI:', email)
      
      const response = await fetch(`${serverUrl}/create-new-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      
      const result = await response.json()
      console.log('📥 Response:', response.status, result)
      
      if (response.ok && result.success) {
        toast.success('✅ Akun berhasil dibuat! Silakan login.')
        setIsRegister(false)
        setPassword('')
        setName('')
        setError('')
      } else {
        setError(result.error || 'Gagal membuat akun')
      }
    } catch (error) {
      console.log('❌ Register error:', error)
      setError('Terjadi kesalahan koneksi')
    }
  }

  const handleLogin = async () => {
    try {
      console.log('🔐 LOGIN:', email)
      
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (loginError) {
        console.log('❌ Login error:', loginError.message)
        setError(loginError.message)
        return
      }
      
      if (data.user && data.session) {
        console.log('✅ Login success, verifying...')
        
        const verifyResponse = await fetch(`${serverUrl}/verify-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        
        const verifyResult = await verifyResponse.json()
        console.log('🔍 Verify:', verifyResponse.status, verifyResult)
        
        if (verifyResponse.ok && verifyResult.success) {
          const user = {
            ...data.user,
            user_metadata: {
              name: verifyResult.user.name,
              role: verifyResult.user.role,
              userType: verifyResult.user.userType
            }
          }
          
          onAuthSuccess(user)
          toast.success('🎉 Login berhasil!')
        } else {
          await supabase.auth.signOut()
          setError('User tidak memiliki akses ke sistem')
        }
      }
    } catch (error) {
      console.log('❌ Login error:', error)
      setError('Terjadi kesalahan')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isRegister) {
      await handleRegister()
    } else {
      await handleLogin()
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4 relative">
      <AnimatedBackground 
        particleCount={20}
        colors={['#fce7f3', '#f3e8ff']}
        speed={0.1}
        className="opacity-30"
      />
      
      <div className="w-full max-w-md relative z-10">
        <Card className="shadow-2xl border-pink-200 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center">
                <ImageWithFallback
                  src={clinicSettings.logo}
                  alt="Logo Klinik"
                  className="w-16 h-16 object-contain rounded-full"
                />
              </div>
            </div>
            
            <div>
              <CardTitle className="text-2xl text-pink-800">
                {clinicSettings.name}
              </CardTitle>
              <CardDescription className="text-pink-600 mt-2">
                Sistem Manajemen Klinik
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-pink-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nama Lengkap
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="border-pink-200 focus:border-pink-500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-pink-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  className="border-pink-200 focus:border-pink-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-pink-700 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="border-pink-200 focus:border-pink-500 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-pink-600 hover:text-pink-800"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isRegister ? 'Mendaftar...' : 'Masuk...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isRegister ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                    {isRegister ? 'Daftar' : 'Masuk'}
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError('')
                  setPassword('')
                  setName('')
                }}
                className="text-pink-600 hover:text-pink-800"
              >
                {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
              </Button>
            </div>

            {/* Akun Testing */}
            <div className="bg-green-50 p-3 rounded-lg text-xs text-green-700">
              <p className="mb-2"><strong>Akun Administrator:</strong></p>
              <p>Email: adeka83@gmail.com</p>
              <p>Password: 1sampai9</p>
              <p className="mt-1 text-green-600">Status: Administrator</p>
            </div>

            {/* Database Connection Tester */}
            <div className="text-center space-y-2">
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTester(!showTester)}
                  className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Database className="h-3 w-3 mr-1" />
                  {showTester ? 'Hide' : 'Server'} Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDirectTester(!showDirectTester)}
                  className="text-xs border-green-200 text-green-600 hover:bg-green-50"
                >
                  <Key className="h-3 w-3 mr-1" />
                  {showDirectTester ? 'Hide' : 'Direct'} Test
                </Button>
              </div>
              <p className="text-xs text-gray-500">Gunakan "Direct Test" jika server test gagal</p>
            </div>

            {/* Debug Info */}
            <div className="text-xs text-gray-500 text-center">
              Server: {serverUrl.split('.supabase.co')[0].split('//')[1]}.supabase.co
            </div>
          </CardContent>
        </Card>

        {/* Database Connection Tester */}
        {showTester && (
          <div className="mt-6">
            <DatabaseConnectionTester />
          </div>
        )}

        {/* Direct Database Tester */}
        {showDirectTester && (
          <div className="mt-6">
            <DirectDatabaseTester />
          </div>
        )}
      </div>
    </div>
  )
}