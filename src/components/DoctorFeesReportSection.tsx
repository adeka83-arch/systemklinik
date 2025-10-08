import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { formatCurrency } from '../utils/reports/helpers'
import type { DoctorFeeReport } from '../utils/reports/types'

interface DoctorFeesReportSectionProps {
  filteredDoctorFeeData: DoctorFeeReport[]
  doctorFeeData: DoctorFeeReport[]
}

export function DoctorFeesReportSection({ filteredDoctorFeeData, doctorFeeData }: DoctorFeesReportSectionProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-pink-50">
            <TableHead className="text-pink-700">Dokter</TableHead>
            <TableHead className="text-pink-700">Shift/Jenis</TableHead>
            <TableHead className="text-pink-700">Tanggal</TableHead>
            <TableHead className="text-pink-700">Fee Tindakan</TableHead>
            <TableHead className="text-pink-700">Uang Duduk</TableHead>
            <TableHead className="text-pink-700">Fee Kegiatan</TableHead>
            <TableHead className="text-pink-700">Total Fee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDoctorFeeData.map((fee, index) => (
            <TableRow key={`${fee.doctor}-${fee.date}-${fee.shift}-${index}`}>
              <TableCell className="text-pink-800">{fee.doctor}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs ${
                  fee.shift === 'Field Trip' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-pink-100 text-pink-800'
                }`}>
                  {fee.shift}
                </span>
              </TableCell>
              <TableCell>
                {new Date(fee.date).toLocaleDateString('id-ID', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </TableCell>
              <TableCell className="text-green-600">
                {formatCurrency(fee.treatmentFee)}
              </TableCell>
              <TableCell className="text-blue-600">
                {formatCurrency(fee.sittingFee)}
              </TableCell>
              <TableCell className="text-purple-600">
                {formatCurrency(fee.fieldTripFee)}
              </TableCell>
              <TableCell className="text-pink-800 font-medium">
                {formatCurrency(fee.finalFee)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {filteredDoctorFeeData.length === 0 && (
        <div className="text-center py-8 text-pink-600">
          {doctorFeeData.length === 0 
            ? 'Belum ada data fee dokter' 
            : 'Tidak ada data yang sesuai dengan filter'
          }
        </div>
      )}
      
      <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-pink-700">
              <span>Total data ditampilkan:</span>
              <span>{filteredDoctorFeeData.length} dari {doctorFeeData.length} record</span>
            </div>
            <div className="flex justify-between text-sm text-purple-600">
              <span>Total Fee Kegiatan:</span>
              <span>{formatCurrency(filteredDoctorFeeData.reduce((total, fee) => total + fee.fieldTripFee, 0))}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between font-medium text-pink-800 border-t pt-2">
              <span>TOTAL SEMUA FEE:</span>
              <span>{formatCurrency(filteredDoctorFeeData.reduce((total, fee) => total + fee.finalFee, 0))}</span>
            </div>
            <div className="text-right text-xs text-pink-600">
              Terakhir diperbarui: {new Date().toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}