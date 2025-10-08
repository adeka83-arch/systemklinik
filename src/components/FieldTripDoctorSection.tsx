import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Plus, X, User, Stethoscope } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface FieldTripDoctor {
  id: string
  name: string
  specialization: string
}

interface SelectedFieldTripDoctor {
  doctorId: string
  doctorName: string
  specialization: string
  fee: number
}

interface FieldTripDoctorSectionProps {
  doctors: FieldTripDoctor[]
  selectedDoctors: SelectedFieldTripDoctor[]
  onAddDoctor: (doctorId: string) => void
  onUpdateDoctorFee: (index: number, fee: number) => void
  onRemoveDoctor: (index: number) => void
}

export function FieldTripDoctorSection({
  doctors,
  selectedDoctors,
  onAddDoctor,
  onUpdateDoctorFee,
  onRemoveDoctor
}: FieldTripDoctorSectionProps) {
  const availableDoctors = doctors.filter(doctor => 
    !selectedDoctors.find(selected => selected.doctorId === doctor.id)
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount)
  }

  const totalDoctorFees = selectedDoctors.reduce((sum, doctor) => sum + doctor.fee, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Stethoscope className="h-5 w-5 text-pink-600" />
        <Label className="text-base font-semibold text-pink-800">
          Dokter Pendamping
        </Label>
      </div>
      
      {/* Add Doctor Dropdown */}
      {availableDoctors.length > 0 && (
        <div className="flex gap-2">
          <select
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            onChange={(e) => {
              if (e.target.value) {
                onAddDoctor(e.target.value)
                e.target.value = ''
              }
            }}
            defaultValue=""
          >
            <option value="">Pilih dokter pendamping...</option>
            {availableDoctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} - {doctor.specialization}
              </option>
            ))}
          </select>
          <Button 
            type="button" 
            className="bg-pink-600 hover:bg-pink-700"
            disabled={availableDoctors.length === 0}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected Doctors List */}
      {selectedDoctors.length > 0 ? (
        <div className="space-y-3">
          {selectedDoctors.map((doctor, index) => (
            <div 
              key={`${doctor.doctorId}-${index}`} 
              className="flex items-center gap-3 p-3 bg-pink-50 border border-pink-200 rounded-lg"
            >
              <div className="flex items-center gap-2 flex-1">
                <User className="h-4 w-4 text-pink-600" />
                <div>
                  <div className="font-medium text-pink-900">{doctor.doctorName}</div>
                  <div className="text-sm text-pink-600">{doctor.specialization}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <Label className="text-xs text-pink-700 mb-1">Fee Kegiatan</Label>
                  <Input
                    type="number"
                    value={doctor.fee}
                    onChange={(e) => onUpdateDoctorFee(index, parseInt(e.target.value) || 0)}
                    className="w-32 text-sm"
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveDoctor(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Total Doctor Fees */}
          <div className="flex justify-between items-center pt-2 border-t border-pink-200">
            <span className="font-medium text-pink-800">Total Fee Dokter:</span>
            <span className="font-bold text-pink-900">{formatCurrency(totalDoctorFees)}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          <Stethoscope className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Belum ada dokter pendamping dipilih</p>
          <p className="text-sm">Pilih dokter dari dropdown di atas</p>
        </div>
      )}
    </div>
  )
}