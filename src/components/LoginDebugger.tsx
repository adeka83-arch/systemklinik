import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { serverUrl } from '../utils/supabase/client'

export function LoginDebugger() {
  const [email, setEmail] = useState('')
  const [debugResult, setDebugResult] = useState('')
  const [loading, setLoading] = useState(false)

  const checkUserRegistration = async () => {
    if (!email) {
      setDebugResult('❌ Masukkan email untuk dicek')
      return
    }

    setLoading(true)
    setDebugResult('🔍 Mengecek registrasi user...')

    try {
      // Check employees
      const employeesResponse = await fetch(`${serverUrl}/employees`, {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json()
        const employees = employeesData.employees || []
        const foundEmployee = employees.find(emp => emp.email?.toLowerCase() === email.toLowerCase())
        
        if (foundEmployee) {
          setDebugResult(`✅ DITEMUKAN SEBAGAI KARYAWAN!
📧 Email: ${foundEmployee.email}
👤 Nama: ${foundEmployee.name}
💼 Posisi: ${foundEmployee.position}
🔐 Login Access: ${foundEmployee.hasLoginAccess ? 'Aktif' : 'Tidak Aktif'}
🆔 Auth User ID: ${foundEmployee.authUserId || 'Tidak ada'}`)
          setLoading(false)
          return
        }
      }

      // Check doctors
      const doctorsResponse = await fetch(`${serverUrl}/doctors`, {
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json()
        const doctors = doctorsData.doctors || []
        const foundDoctor = doctors.find(doc => doc.email?.toLowerCase() === email.toLowerCase())
        
        if (foundDoctor) {
          setDebugResult(`✅ DITEMUKAN SEBAGAI DOKTER!
📧 Email: ${foundDoctor.email}
👤 Nama: ${foundDoctor.name}
🩺 Spesialisasi: ${foundDoctor.specialty || 'Umum'}
🔐 Login Access: ${foundDoctor.hasLoginAccess ? 'Aktif' : 'Tidak Aktif'}
🆔 Auth User ID: ${foundDoctor.authUserId || 'Tidak ada'}`)
          setLoading(false)
          return
        }
      }

      // Not found
      setDebugResult(`❌ EMAIL TIDAK TERDAFTAR!
📧 Email yang dicari: ${email}
❗ Email ini tidak terdaftar sebagai karyawan atau dokter di sistem.
💡 Saran: 
   1. Pastikan email sudah didaftarkan di menu Karyawan atau Dokter
   2. Periksa penulisan email (huruf besar/kecil tidak berpengaruh)
   3. Untuk dokter, pastikan checkbox "Buat Akun Login" sudah dicentang`)

    } catch (error) {
      setDebugResult(`❌ ERROR SISTEM!
⚠️ ${error.message}
🔧 Periksa koneksi internet atau hubungi administrator`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="text-center text-pink-800">🔍 Debug Login</CardTitle>
        <p className="text-sm text-pink-600 text-center">
          Cek apakah email sudah terdaftar di sistem
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Masukkan email untuk dicek..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-pink-200 focus:border-pink-400"
          />
          <Button
            onClick={checkUserRegistration}
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700 text-white whitespace-nowrap"
          >
            {loading ? '🔍' : 'Cek'}
          </Button>
        </div>
        
        {debugResult && (
          <div className="bg-gray-50 p-3 rounded-lg text-xs font-mono whitespace-pre-line border">
            {debugResult}
          </div>
        )}
      </CardContent>
    </Card>
  )
}