import { useEffect, useState } from 'react'
import { Card, CardContent } from './ui/card'
import { CheckCircle, Users, Shield, Settings } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { useCentralizedSecurity } from './CentralizedSecurityManager'

export function CentralizedSecurityConfirmation() {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { currentLevel, getLevelName, getLevelIcon } = useCentralizedSecurity()

  useEffect(() => {
    // Show confirmation after a short delay
    const timer = setTimeout(() => {
      setShowConfirmation(true)
      
      // Show success toast
      toast.success('✅ Sistem Keamanan Terpusat Aktif', {
        description: 'Super User mengontrol akses, semua user mulai level Dokter',
        duration: 5000
      })
      
      // Auto-hide confirmation after 10 seconds
      setTimeout(() => {
        setShowConfirmation(false)
      }, 10000)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (!showConfirmation) return null

  return (
    <Card className="border-emerald-300 bg-emerald-50 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-6 w-6 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-emerald-800 font-medium mb-2">
              ✅ Sistem Keamanan Terpusat Berhasil Diterapkan
            </h3>
            <div className="text-sm text-emerald-800 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span><strong>Seragam:</strong> Semua user melihat menu yang persis sama</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span><strong>Default:</strong> Semua user mulai dengan level {getLevelIcon(currentLevel)} {getLevelName(currentLevel)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span><strong>Terpusat:</strong> Super User mengatur konfigurasi akses halaman</span>
              </div>
              <div className="bg-emerald-100 p-3 rounded border border-emerald-300 mt-3">
                <p className="text-xs text-emerald-800 space-y-1">
                  <strong>🔧 Fitur Utama Sistem Baru:</strong><br/>
                  • Super User dapat mengatur level akses setiap halaman melalui "Pengaturan Keamanan"<br/>
                  • Semua user mendapat akses level Dokter by default (tidak ada perbedaan antar account)<br/>
                  • User dapat upgrade dengan password: staff123, owner456, super789<br/>
                  • Menu sidebar seragam untuk semua user dengan indikator level yang diperlukan<br/>
                  • Konfigurasi tersimpan terpusat, bukan di localStorage individual
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}