import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CheckCircle, Users, UserCheck, Shield } from 'lucide-react'

export function DoctorLoginSummary() {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-green-800 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          ✅ Sistem Login Dokter Aktif
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Features */}
          <div className="space-y-2">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Fitur Tersedia
            </h4>
            <div className="text-sm space-y-1 text-green-700">
              <div>✅ Login dokter dengan role terpisah</div>
              <div>✅ Permission system otomatis</div>
              <div>✅ Menu akses terbatas untuk dokter</div>
              <div>✅ Integrasi dengan sistem absensi</div>
              <div>✅ Akses uang duduk dan tindakan</div>
            </div>
          </div>
          
          {/* How to Use */}
          <div className="space-y-2">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Cara Menggunakan
            </h4>
            <div className="text-sm space-y-1 text-green-700">
              <div>🆕 <strong>Dokter baru:</strong> Centang "Buat Akun Login"</div>
              <div>👥 <strong>Dokter lama:</strong> Klik tombol <Shield className="h-3 w-3 inline" /> di tabel</div>
              <div>🔐 <strong>Password:</strong> Minimal 6 karakter</div>
              <div>📧 <strong>Email:</strong> Digunakan sebagai username</div>
              <div>🚪 <strong>Login:</strong> Role otomatis "Dokter"</div>
            </div>
          </div>
          
          {/* Doctor Menu Access */}
          <div className="space-y-2">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Akses Menu Dokter
            </h4>
            <div className="text-sm space-y-1 text-green-700">
              <div>✅ Dashboard</div>
              <div>✅ Absensi</div>
              <div>✅ Uang Duduk</div>
              <div>✅ Tindakan & Fee</div>
              <div>❌ Karyawan, Produk, Laporan</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white border border-green-200 rounded">
          <p className="text-sm text-green-800">
            <strong>🎉 Sistem Siap Digunakan!</strong> Dokter dapat login dan mengakses fitur sesuai dengan role mereka. 
            Permission system otomatis mengatur akses menu berdasarkan level user.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}