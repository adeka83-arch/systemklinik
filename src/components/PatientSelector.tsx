import React, { useState, useEffect, useRef } from 'react'
import { Search, User, Calendar, MapPin, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
// import { ScrollArea } from './ui/scroll-area' // Temporary disabled
// Simple cn function without external dependencies
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}

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

interface PatientSelectorProps {
  patients: Patient[]
  selectedPatientId: string | null
  onPatientSelect: (patientId: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  patients,
  selectedPatientId,
  onPatientSelect,
  disabled = false,
  placeholder = "Pilih Pasien",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(patients)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  // Filter patients based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients)
    } else {
      const filtered = patients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        (patient.medicalRecordNumber && patient.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        patient.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPatients(filtered)
    }
  }, [searchTerm, patients])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus search input when opening
      setTimeout(() => {
        if (searchRef.current) {
          searchRef.current.focus()
        }
      }, 100)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handlePatientSelect = (patient: Patient) => {
    onPatientSelect(patient.id)
    setIsOpen(false)
    setSearchTerm('')
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    })
  }

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full justify-between h-auto min-h-[56px] p-4 text-left",
          "hover:bg-pink-50 border-pink-200 focus:border-pink-400 focus:ring-pink-400",
          "transition-all duration-200",
          isOpen && "border-pink-400 ring-2 ring-pink-400 ring-opacity-20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-pink-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {selectedPatient ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-pink-800 truncate text-sm">
                    {selectedPatient.name}
                  </span>
                  <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5">
                    {selectedPatient.gender === 'male' ? 'L' : 'P'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-pink-600">
                  <span className="font-medium">
                    RM: {selectedPatient.medicalRecordNumber || 'Belum tersedia'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {calculateAge(selectedPatient.birthDate)} thn
                  </span>
                  <span className="flex items-center gap-1 max-w-[100px] truncate">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    {selectedPatient.phone}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                {placeholder}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-pink-600 transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-4 h-4 text-pink-600 transition-transform duration-200" />
          )}
        </div>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 w-full mt-2 z-50 shadow-xl border-pink-200 bg-white">
          <CardContent className="p-0">
            {/* Search Header */}
            <div className="p-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-400" />
                <Input
                  ref={searchRef}
                  placeholder="Cari nama, nomor RM, telepon, atau alamat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white"
                />
              </div>
            </div>

            {/* Patient List */}
            <div className="max-h-72 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="w-12 h-12 text-pink-300 mx-auto mb-4" />
                  <p className="text-pink-700 font-medium text-sm">
                    {searchTerm ? 'Tidak ada pasien yang ditemukan' : 'Belum ada data pasien'}
                  </p>
                  <p className="text-pink-500 text-xs mt-2">
                    {searchTerm ? 'Coba kata kunci lain' : 'Tambahkan pasien terlebih dahulu'}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                        "hover:bg-pink-50 border border-transparent hover:border-pink-200 hover:shadow-sm",
                        selectedPatientId === patient.id && "bg-pink-50 border-pink-300 shadow-sm"
                      )}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-9 h-9 bg-pink-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-pink-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-pink-800 truncate text-sm">
                            {patient.name}
                          </span>
                          <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5">
                            {patient.gender === 'male' ? 'L' : 'P'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-3 text-xs text-pink-600">
                            <span className="font-medium">
                              RM: {patient.medicalRecordNumber || 'Belum tersedia'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {calculateAge(patient.birthDate)} thn
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-pink-500">
                            <span className="flex items-center gap-1 max-w-[120px] truncate">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              {patient.phone}
                            </span>
                            <span className="flex items-center gap-1 truncate flex-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              {patient.address}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredPatients.length > 0 && (
              <div className="px-4 py-3 border-t border-pink-100 bg-gradient-to-r from-pink-50 to-white">
                <p className="text-xs text-pink-600 text-center font-medium">
                  {filteredPatients.length} pasien ditemukan
                  {searchTerm && ` dari pencarian "${searchTerm}"`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}