import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { AlertTriangle, Shield } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface EmergencyRecoveryProps {
  onClose: () => void
}

export function EmergencyRecovery({ onClose }: EmergencyRecoveryProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    emergencyCode: '',
    email: '',
    password: '',
    name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Creating emergency super user...')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log('Emergency creation timeout, aborting...')
        controller.abort()
      }, 15000) // 15 second timeout

      const response = await fetch(`${serverUrl}/emergency/create-super-user`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      clearTimeout(timeoutId)

      const data = await response.json()

      if (response.ok) {
        toast.success(
          `✅ Super User berhasil dibuat!\n\n` +
          `📧 Email: ${formData.email}\n` +
          `🔐 Password: [sesuai yang diset]\n` +
          `👤 Role: Super Administrator\n\n` +
          `Silakan refresh halaman dan login dengan kredensial ini.`
        )
        onClose()
      } else {
        toast.error(data.error || 'Gagal membuat super user')
      }
    } catch (error) {
      console.log('Error creating emergency super user:', error)
      
      let errorMessage = 'Terjadi kesalahan sistem'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - server tidak merespons'
        } else {
          errorMessage = `Terjadi kesalahan: ${error.message}`
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Sistem Pemulihan Darurat
          </CardTitle>
          <p className="text-red-600 text-sm">
            Sistem ini hanya untuk pemulihan akses darurat ketika tidak bisa login.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyCode" className="text-red-700">
                Kode Darurat *
              </Label>
              <Input
                id="emergencyCode"
                type="password"
                value={formData.emergencyCode}
                onChange={(e) => setFormData({ ...formData, emergencyCode: e.target.value })}
                required
                className="border-red-200 focus:border-red-400"
                placeholder="Masukkan kode darurat"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-red-700">
                Nama Super User *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-red-200 focus:border-red-400"
                placeholder="Nama lengkap admin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-red-700">
                Email Login *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="border-red-200 focus:border-red-400"
                placeholder="Email untuk login"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-red-700">
                Password Login *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="border-red-200 focus:border-red-400"
                placeholder="Password minimal 6 karakter"
              />
            </div>

            <div className="text-xs text-red-600 bg-red-100 p-3 rounded border border-red-200">
              <div className="flex items-center gap-1 mb-2">
                <Shield className="h-3 w-3" />
                <strong>Catatan Penting:</strong>
              </div>
              • Super User memiliki akses penuh ke seluruh sistem
              <br />
              • Gunakan hanya dalam situasi darurat
              <br />
              • Setelah dibuat, silakan refresh halaman dan login
              <br />
              • Kode darurat harus diperoleh dari administrator sistem
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Membuat...' : 'Buat Super User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}