import { useState } from 'react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Printer, FileCheck, Receipt, Smile, FileText, Camera, UserCheck, ClipboardList, ChevronDown } from 'lucide-react'
import { FormType } from './compact-print-dropdown'

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

interface SinglePrintDropdownProps {
  patient: Patient
  doctors: Doctor[]
  onPrint: (patient: Patient, type: FormType, doctorId: string) => void
  disabled?: boolean
  className?: string
}

const PRINT_OPTIONS = [
  {
    value: 'informed-consent',
    label: 'Informed Consent (A4)',
    icon: FileCheck,
    color: 'text-blue-600'
  },

  {
    value: 'ortho-form',
    label: 'Form Ortodontik (A4)',
    icon: Smile,
    color: 'text-orange-600'
  },
  {
    value: 'prescription',
    label: 'Resep Obat (A5)',
    icon: Receipt,
    color: 'text-green-600'
  },
  {
    value: 'xray-referral',
    label: 'Rujukan Rontgen (A5)',
    icon: Camera,
    color: 'text-indigo-600'
  },
  {
    value: 'specialist-referral',
    label: 'Rujukan Spesialis (A5)',
    icon: UserCheck,
    color: 'text-cyan-600'
  },
  {
    value: 'medical-certificate',
    label: 'Surat Keterangan (A5)',
    icon: ClipboardList,
    color: 'text-rose-600'
  }
] as const

export function SinglePrintDropdown({ 
  patient, 
  doctors, 
  onPrint, 
  disabled = false,
  className = ''
}: SinglePrintDropdownProps) {
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handlePrintSelect = async (value: string) => {
    if (disabled || isLoading) return
    
    // Parse value: "formType|doctorId"
    const [formType, doctorId] = value.split('|')
    
    if (!formType || !doctorId) return
    
    setIsLoading(true)
    try {
      await onPrint(patient, formType as FormType, doctorId)
      setSelectedOption('') // Reset selection
    } catch (error) {
      console.error('Print error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`min-w-[200px] ${className}`}>
      <Select 
        value={selectedOption} 
        onValueChange={handlePrintSelect}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="h-8 text-xs border-pink-200 focus:border-pink-300">
          <div className="flex items-center gap-2 w-full">
            <Printer className="h-3 w-3 text-pink-600" />
            <span className="flex-1 text-left">
              {isLoading ? 'Mencetak...' : 'Cetak Formulir'}
            </span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
        </SelectTrigger>
        <SelectContent className="w-[300px]">
          {doctors.length === 0 ? (
            <SelectItem value="no-doctors" disabled className="text-xs text-gray-500">
              Tidak ada dokter tersedia
            </SelectItem>
          ) : (
            <>
              {/* Group by form type */}
              {PRINT_OPTIONS.map((option) => {
                const IconComponent = option.icon
                return (
                  <div key={option.value}>
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-3 w-3 ${option.color}`} />
                        {option.label}
                      </div>
                    </div>
                    {doctors.map((doctor) => (
                      <SelectItem 
                        key={`${option.value}|${doctor.id}`}
                        value={`${option.value}|${doctor.id}`}
                        className="text-xs pl-6"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>drg. {doctor.name}</span>
                          {doctor.specialization && (
                            <span className="text-[10px] text-gray-400 ml-2">
                              {doctor.specialization}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}