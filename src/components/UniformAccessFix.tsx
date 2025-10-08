import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { Users, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import { forceResetSecuritySystem } from './SecurityManagerV4'
import { toast } from 'sonner@2.0.3'

export function UniformAccessFix() {
  const [loading, setLoading] = useState(false)

  const handleForceReset = async () => {
    try {
      setLoading(true)
      
      // Call the force reset function
      forceResetSecuritySystem()
      
    } catch (error) {
      console.error('Error during force reset:', error)
      toast.error('Gagal mereset sistem')
      setLoading(false)
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Perbaikan Tampilan User
        </CardTitle>
        <p className="text-sm text-orange-700">
          Perbaiki masalah user yang melihat menu berbeda-beda
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-orange-100 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Masalah yang diperbaiki:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>User yang berbeda melihat menu sidebar yang berbeda</li>
                  <li>Beberapa user tidak bisa akses halaman tertentu</li>
                  <li>Inkonsistensi akses antar user account</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Setelah reset:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>SEMUA user melihat menu yang sama (Akses Dokter lengkap)</li>
                  <li>Semua halaman dapat diakses oleh semua user</li>
                  <li>User dapat upgrade ke level lebih tinggi dengan password</li>
                  <li>Sistem akan refresh otomatis</li>
                </ul>
              </div>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Mereset Sistem...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Reset untuk Tampilan Seragam
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Konfirmasi Reset Sistem
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin mereset sistem keamanan? 
                  <br /><br />
                  <strong>Ini akan:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Memberikan akses DOKTER penuh ke semua menu untuk SEMUA user</li>
                    <li>Menghapus semua konfigurasi dan sesi lama</li>
                    <li>Memastikan semua user melihat tampilan yang sama</li>
                    <li>User masih bisa upgrade ke level lebih tinggi dengan password</li>
                    <li>Halaman akan refresh otomatis</li>
                  </ul>
                  <br />
                  <strong>Password default:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                    <li>Staff: staff123</li>
                    <li>Owner: owner456</li>
                    <li>Super User: super789</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleForceReset}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Ya, Reset Sistem
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="text-xs text-gray-600 text-center">
            <p>Reset ini akan memastikan semua user account melihat tampilan yang sama</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}