import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Stethoscope, Users, Clock, TrendingUp } from 'lucide-react'
import { DoctorAttendanceReport } from './DoctorAttendanceReport'
import { EmployeeAttendanceReport } from './EmployeeAttendanceReport'

interface AttendanceReportsUnifiedProps {
  accessToken: string
}

export function AttendanceReportsUnified({ accessToken }: AttendanceReportsUnifiedProps) {
  const [activeTab, setActiveTab] = useState("employees")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl text-gray-800 flex items-center justify-center gap-2">
          <Clock className="h-8 w-8 text-pink-600" />
          Laporan Absensi
        </h1>
        <p className="text-gray-600">Generate laporan absensi dokter dan karyawan dengan filter lengkap</p>
      </div>



      {/* Tabs untuk memilih jenis laporan */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-auto">
          <TabsTrigger 
            value="employees" 
            className="flex items-center gap-3 p-4 text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <Users className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Absensi Karyawan</div>
              <div className="text-xs opacity-80">Laporan kehadiran karyawan</div>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="doctors" 
            className="flex items-center gap-3 p-4 text-base data-[state=active]:bg-pink-600 data-[state=active]:text-white"
          >
            <Stethoscope className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Absensi Dokter</div>
              <div className="text-xs opacity-80">Laporan kehadiran dokter</div>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Konten untuk Laporan Absensi Karyawan */}
        <TabsContent value="employees" className="space-y-6">
          <EmployeeAttendanceReport accessToken={accessToken} />
        </TabsContent>

        {/* Konten untuk Laporan Absensi Dokter */}
        <TabsContent value="doctors" className="space-y-6">
          <DoctorAttendanceReport accessToken={accessToken} />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Laporan tersedia dalam format cetak dan dapat di-export</span>
            </div>
            <div className="text-right">
              <p>Falasifah Dental Clinic</p>
              <p className="text-xs">Sistem Laporan Absensi Terintegrasi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}