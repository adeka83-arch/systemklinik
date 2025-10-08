import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Printer, X } from 'lucide-react'

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface Patient {
  id: string
  name: string
}

interface PatientPrintDialogProps {
  open: boolean
  onClose: () => void
  doctors: Doctor[]
  selectedDoctor: string
  setSelectedDoctor: (doctorId: string) => void
  printDate: string
  setPrintDate: (date: string) => void
  printType: 'informed-consent' | 'ortho-form' | 'prescription'
  selectedPatient: Patient | null
  onPrint: () => void
  onRefreshDoctors?: () => void
}

export function PatientPrintDialog({
  open,
  onClose,
  doctors,
  selectedDoctor,
  setSelectedDoctor,
  printDate,
  setPrintDate,
  printType,
  selectedPatient,
  onPrint,
  onRefreshDoctors
}: PatientPrintDialogProps) {
  // Debug logging
  console.log('PatientPrintDialog render:')
  console.log('- Dialog open:', open)
  console.log('- Doctors received:', doctors)
  console.log('- Number of doctors:', doctors?.length || 0)
  console.log('- Selected doctor:', selectedDoctor)
  console.log('- Selected patient:', selectedPatient?.name)

  const handleDoctorChange = (doctorId: string) => {
    console.log('Doctor selected:', doctorId)
    setSelectedDoctor(doctorId)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-pink-800 flex items-center gap-2">
            <Printer className="h-5 w-5" />
            {printType === 'informed-consent' ? 'Cetak Informed Consent' : 
             printType === 'ortho-form' ? 'Cetak Formulir Ortodontik' :
             'Cetak Resep Obat'}
          </DialogTitle>
          <DialogDescription>
            Pilih dokter yang akan tertera pada dokumen untuk pasien <strong>{selectedPatient?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="doctor" className="text-pink-700">Pilih Dokter *</Label>
              {onRefreshDoctors && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onRefreshDoctors}
                  className="text-pink-600 hover:text-pink-700 p-1 h-auto"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              )}
            </div>
            <Select value={selectedDoctor} onValueChange={handleDoctorChange}>
              <SelectTrigger className="border-pink-200">
                <SelectValue placeholder="Pilih dokter..." />
              </SelectTrigger>
              <SelectContent>
                {doctors && doctors.length > 0 ? (
                  doctors.map((doctor) => {
                    console.log('Rendering doctor option:', doctor)
                    return (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        drg. {doctor.name}{doctor.specialization ? ` - ${doctor.specialization}` : ''}
                      </SelectItem>
                    )
                  })
                ) : (
                  <SelectItem value="no-doctors" disabled>
                    Tidak ada dokter tersedia
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {/* Info and actions */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>{doctors?.length || 0} dokter tersedia</p>
              {(!doctors || doctors.length === 0) && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <p>Belum ada dokter tersedia.</p>
                  <p>Silakan tambahkan dokter di menu "Manajemen Dokter" terlebih dahulu.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="printDate" className="text-pink-700">Tanggal Dokumen</Label>
            <Input
              id="printDate"
              type="date"
              value={printDate}
              onChange={(e) => setPrintDate(e.target.value)}
              className="border-pink-200"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-300"
          >
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
          <Button
            onClick={onPrint}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
            disabled={!selectedDoctor || selectedDoctor === 'no-doctors'}
          >
            <Printer className="h-4 w-4 mr-2" />
            Cetak
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}