import React, { useState, useEffect, useRef } from 'react'
import { Search, Stethoscope, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
// import { ScrollArea } from './ui/scroll-area' // Temporary disabled
// Simple cn function without external dependencies
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ')
}

interface Doctor {
  id: string
  name: string
  specialization: string
  phone?: string
  email?: string
  license?: string
}

interface DoctorSelectorProps {
  doctors: Doctor[]
  selectedDoctorId: string | null
  onDoctorSelect: (doctorId: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export const DoctorSelector: React.FC<DoctorSelectorProps> = ({
  doctors = [],
  selectedDoctorId = null,
  onDoctorSelect,
  disabled = false,
  placeholder = "Pilih Dokter",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>(doctors.filter(doctor => doctor && doctor.id && doctor.name))
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Debug log untuk memastikan props valid
  useEffect(() => {
    console.log('🩺 DoctorSelector props:', {
      doctors: doctors?.length || 0,
      selectedDoctorId,
      onDoctorSelectType: typeof onDoctorSelect,
      disabled,
      placeholder
    })
  }, [doctors, selectedDoctorId, onDoctorSelect, disabled, placeholder])

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId)

  // Filter doctors based on search term
  useEffect(() => {
    // First filter out invalid doctors
    const validDoctors = doctors.filter(doctor => doctor && doctor.id && doctor.name)
    
    if (!searchTerm.trim()) {
      setFilteredDoctors(validDoctors)
    } else {
      const filtered = validDoctors.filter(doctor => 
        (doctor.name && doctor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doctor.phone && doctor.phone.includes(searchTerm)) ||
        (doctor.email && doctor.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doctor.license && doctor.license.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredDoctors(filtered)
    }
  }, [searchTerm, doctors])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Focus search input when opening with longer delay for dialog
      setTimeout(() => {
        if (searchRef.current) {
          searchRef.current.focus()
        }
      }, 150)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleDoctorSelect = (doctor: Doctor) => {
    console.log('🩺 Doctor selected:', doctor.name, doctor.id) // Debug log
    
    // Safety check for onDoctorSelect prop
    if (typeof onDoctorSelect === 'function') {
      onDoctorSelect(doctor.id)
    } else {
      console.warn('onDoctorSelect prop is missing or not a function. Doctor selected:', doctor.name)
      // Don't crash the app, just continue
    }
    
    setIsOpen(false)
    setSearchTerm('')
  }

  const getSpecializationColor = (specialization: string) => {
    if (!specialization || typeof specialization !== 'string') return 'bg-gray-100 text-gray-700'
    const spec = specialization.toLowerCase()
    if (spec.includes('umum') || spec.includes('general')) return 'bg-blue-100 text-blue-700'
    if (spec.includes('ortodonti')) return 'bg-purple-100 text-purple-700'
    if (spec.includes('bedah')) return 'bg-red-100 text-red-700'
    if (spec.includes('anak') || spec.includes('pedodonti')) return 'bg-green-100 text-green-700'
    if (spec.includes('konservasi')) return 'bg-orange-100 text-orange-700'
    if (spec.includes('prostodonti')) return 'bg-indigo-100 text-indigo-700'
    if (spec.includes('periodonti')) return 'bg-teal-100 text-teal-700'
    return 'bg-gray-100 text-gray-700'
  }

  const formatDoctorName = (name: string) => {
    // Clean up doctor names (remove duplicate titles)
    if (!name || typeof name !== 'string') return ''
    return name.replace(/^(drg\.\\s*){2,}/gi, 'drg. ').replace(/^drg\.\\s*/i, 'drg. ')
  }

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!disabled) {
            console.log('🩺 DoctorSelector button clicked, isOpen:', isOpen) // Debug log
            setIsOpen(!isOpen)
          }
        }}
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
              <Stethoscope className="w-5 h-5 text-pink-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {selectedDoctor ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-pink-800 truncate text-sm">
                    {selectedDoctor.name ? formatDoctorName(selectedDoctor.name) : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={cn("text-xs px-2 py-0.5", getSpecializationColor(selectedDoctor.specialization))}
                  >
                    <GraduationCap className="w-3 h-3 mr-1" />
                    {selectedDoctor.specialization || 'Belum ditentukan'}
                  </Badge>
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

      {/* Dropdown with portal-like behavior for dialog compatibility */}
      {isOpen && (
        <Card className="absolute top-full left-0 w-full mt-2 z-[9999] shadow-xl border-pink-200 bg-white">
          <CardContent className="p-0">
            {/* Search Header */}
            <div className="p-4 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-400" />
                <Input
                  ref={searchRef}
                  placeholder="Cari nama dokter atau spesialisasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white"
                />
              </div>
            </div>

            {/* Doctor List */}
            <div className="max-h-72 overflow-y-auto" role="listbox" aria-label="Daftar dokter">
              {filteredDoctors.length === 0 ? (
                <div className="p-8 text-center">
                  <Stethoscope className="w-12 h-12 text-pink-300 mx-auto mb-4" />
                  <p className="text-pink-700 font-medium text-sm">
                    {searchTerm ? 'Tidak ada dokter yang ditemukan' : 'Belum ada data dokter'}
                  </p>
                  <p className="text-pink-500 text-xs mt-2">
                    {searchTerm ? 'Coba kata kunci lain' : 'Tambahkan dokter terlebih dahulu'}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('🩺 Doctor item clicked:', doctor.name) // Debug log
                        handleDoctorSelect(doctor)
                      }}
                      onMouseDown={(e) => {
                        // Prevent blur event from closing dropdown before click
                        e.preventDefault()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDoctorSelect(doctor)
                        }
                      }}
                      tabIndex={0}
                      role="option"
                      aria-selected={selectedDoctorId === doctor.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                        "hover:bg-pink-50 border border-transparent hover:border-pink-200 hover:shadow-sm",
                        "focus:outline-none focus:bg-pink-50 focus:border-pink-300",
                        selectedDoctorId === doctor.id && "bg-pink-50 border-pink-300 shadow-sm"
                      )}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-9 h-9 bg-pink-100 rounded-full flex items-center justify-center">
                          <Stethoscope className="w-4 h-4 text-pink-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-pink-800 truncate text-sm">
                            {doctor.name ? formatDoctorName(doctor.name) : ''}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs px-2 py-0.5", getSpecializationColor(doctor.specialization))}
                            >
                              <GraduationCap className="w-3 h-3 mr-1" />
                              {doctor.specialization || 'Belum ditentukan'}
                            </Badge>
                          </div>
                          
                          {(doctor.phone || doctor.email) && (
                            <div className="flex items-center gap-3 text-xs text-pink-500">
                              {doctor.phone && (
                                <span className="max-w-[120px] truncate">{doctor.phone}</span>
                              )}
                              {doctor.email && (
                                <span className="truncate flex-1">{doctor.email}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredDoctors.length > 0 && (
              <div className="px-4 py-3 border-t border-pink-100 bg-gradient-to-r from-pink-50 to-white">
                <p className="text-xs text-pink-600 text-center font-medium">
                  {filteredDoctors.length} dokter ditemukan
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