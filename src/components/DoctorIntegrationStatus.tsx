import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export function DoctorIntegrationStatus() {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Status Integrasi Doctor Login
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fixed Issues */}
          <div className="space-y-2">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              ✅ Masalah yang Diperbaiki
            </h4>
            <div className="text-sm space-y-1 text-green-700">
              <div>• Enhanced endpoint create-test-doctor</div>
              <div>• Konsistensi role: Dokter vs dokter</div>
              <div>• User metadata dengan userType: 'doctor'</div>
              <div>• Integrasi Auth + KV store</div>
              <div>• Debug tools komprehensif</div>
              <div>• Pre-filled login form</div>
            </div>
          </div>
          
          {/* Current Issues */}
          <div className="space-y-2">
            <h4 className="font-semibold text-red-800 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              ❌ Masalah Saat Ini
            </h4>
            <div className="text-sm space-y-1 text-red-700">
              <div>• Data dokter terpisah dari karyawan</div>
              <div>• Email test.dokter tidak terdaftar</div>
              <div>• Verify-user endpoint mungkin tidak berfungsi</div>
              <div>• Permission system filtering berlebihan</div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">🔧 Langkah Perbaikan</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>1. <strong>Buat Test Doctor:</strong> Klik "🩺 Create Test Doctor" di atas</div>
            <div>2. <strong>Verify Integration:</strong> Klik "🔬 Test Verify User"</div>
            <div>3. <strong>Test Login:</strong> Klik "🚀 Test Login" dan masukkan password</div>
            <div>4. <strong>Check Permissions:</strong> Pastikan sidebar menampilkan menu dokter</div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2">📋 Next Steps</h4>
          <div className="text-sm text-purple-700 space-y-1">
            <div>• Sinkronisasi data dokter dengan sistem karyawan</div>
            <div>• Implementasi unified user management</div>
            <div>• Improve permission system untuk dokter</div>
            <div>• Add doctor dashboard dengan fitur khusus</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}