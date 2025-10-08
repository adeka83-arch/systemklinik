import { useState } from 'react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Printer, FileCheck, Receipt, Smile, FileText, Camera, UserCheck, ClipboardList } from 'lucide-react'

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

interface Doctor {
  id: string
  name: string
  specialization: string
}

interface CompactPrintDropdownProps {
  patient: Patient
  doctors: Doctor[]
  onPrint: (patient: Patient, type: FormType, doctorId: string) => void
  disabled?: boolean
}

export type FormType = 
  | 'informed-consent' 
  | 'ortho-form' 
  | 'prescription'
  | 'xray-referral'
  | 'specialist-referral'
  | 'medical-certificate'

const FORM_OPTIONS = [
  {
    value: 'informed-consent',
    label: 'Informed Consent',
    icon: FileCheck,
    color: 'text-blue-600',
    size: 'A4'
  },

  {
    value: 'ortho-form',
    label: 'Form Ortodontik',
    icon: Smile,
    color: 'text-orange-600',
    size: 'A4'
  },
  {
    value: 'prescription',
    label: 'Resep Obat',
    icon: Receipt,
    color: 'text-green-600',
    size: 'A5'
  },
  {
    value: 'xray-referral',
    label: 'Rujukan Rontgen',
    icon: Camera,
    color: 'text-indigo-600',
    size: 'A5'
  },
  {
    value: 'specialist-referral',
    label: 'Rujukan Spesialis',
    icon: UserCheck,
    color: 'text-cyan-600',
    size: 'A5'
  },
  {
    value: 'medical-certificate',
    label: 'Surat Ket. Berobat',
    icon: ClipboardList,
    color: 'text-rose-600',
    size: 'A5'
  }
] as const

export function CompactPrintDropdown({ patient, doctors, onPrint, disabled = false }: CompactPrintDropdownProps) {
  const [selectedForm, setSelectedForm] = useState<FormType | ''>('')
  const [selectedDoctor, setSelectedDoctor] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePrint = async () => {
    if (!selectedForm || !selectedDoctor || isLoading) return
    
    setIsLoading(true)
    try {
      await onPrint(patient, selectedForm, selectedDoctor)
      // Reset selections after successful print
      setSelectedForm('')
      setSelectedDoctor('')
    } catch (error) {
      console.error('Print error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedFormData = FORM_OPTIONS.find(option => option.value === selectedForm)
  const selectedDoctorData = doctors.find(doc => doc.id === selectedDoctor)

  const canPrint = selectedForm && selectedDoctor && !isLoading && !disabled

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Form Type Dropdown */}
      <div className="min-w-[140px]">
        <Select value={selectedForm} onValueChange={(value) => {
          setSelectedForm(value as FormType)
          setSelectedDoctor('') // Reset doctor when form changes
        }}>
          <SelectTrigger className="h-8 text-xs border-gray-200 focus:border-pink-300">
            <SelectValue placeholder="Pilih Formulir">
              {selectedFormData && (
                <div className="flex items-center gap-1">
                  <selectedFormData.icon className={`h-3 w-3 ${selectedFormData.color}`} />
                  <span className="truncate">{selectedFormData.label}</span>
                  <span className="text-[10px] text-gray-500">({selectedFormData.size})</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-[200px]">
            {FORM_OPTIONS.map((option) => {
              const IconComponent = option.icon
              return (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  <div className="flex items-center gap-2 w-full">
                    <IconComponent className={`h-3 w-3 ${option.color}`} />
                    <span className="flex-1">{option.label}</span>
                    <span className="text-[10px] text-gray-500">{option.size}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Doctor Dropdown */}
      {selectedForm && (
        <div className="min-w-[120px]">
          <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
            <SelectTrigger className="h-8 text-xs border-gray-200 focus:border-pink-300">
              <SelectValue placeholder="Pilih Dokter">
                {selectedDoctorData && (
                  <span className="truncate">drg. {selectedDoctorData.name}</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-[180px]">
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id} className="text-xs">
                    <div className="flex flex-col">
                      <span>drg. {doctor.name}</span>
                      {doctor.specialization && (
                        <span className="text-[10px] text-gray-500">{doctor.specialization}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-doctors" disabled className="text-xs text-gray-500">
                  Tidak ada dokter tersedia
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Print Button */}
      {selectedForm && (
        <Button
          size="sm"
          onClick={handlePrint}
          disabled={!canPrint}
          className={`h-8 px-3 text-xs ${
            canPrint 
              ? 'bg-pink-600 hover:bg-pink-700 text-white' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span>Cetak...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Printer className="h-3 w-3" />
              <span>Cetak</span>
            </div>
          )}
        </Button>
      )}
    </div>
  )
}