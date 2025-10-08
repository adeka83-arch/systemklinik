import { Button } from './ui/button'
import { FileCheck, Receipt, Smile, Printer } from 'lucide-react'

interface Patient {
  id: string
  name: string
  phone: string
  address: string
  birthDate: string
  gender: string
  bloodType?: string
  allergies?: string
  emergencyContact?: string
  emergencyPhone?: string
  registrationDate: string
  medicalRecordNumber?: string
  created_at: string
}

interface PatientPrintButtonsProps {
  patient: Patient
  onPrint: (patient: Patient, type: 'informed-consent' | 'ortho-form' | 'prescription') => void
}

export function PatientPrintButtons({ patient, onPrint }: PatientPrintButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Informed Consent Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPrint(patient, 'informed-consent')}
        className="flex items-center gap-2 text-blue-700 border-blue-200 hover:bg-blue-50"
      >
        <FileCheck className="h-4 w-4" />
        Informed Consent
      </Button>



      {/* Orthodontic Form Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPrint(patient, 'ortho-form')}
        className="flex items-center gap-2 text-orange-700 border-orange-200 hover:bg-orange-50"
      >
        <Smile className="h-4 w-4" />
        Formulir Ortodontik
      </Button>

      {/* Prescription Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onPrint(patient, 'prescription')}
        className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
      >
        <Receipt className="h-4 w-4" />
        Resep Obat
      </Button>
    </div>
  )
}