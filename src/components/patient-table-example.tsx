import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { PatientActionsCompact } from './patient-actions-compact'
import { Phone, MapPin, Calendar } from 'lucide-react'

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

interface PatientTableExampleProps {
  patients: Patient[]
  doctors: Doctor[]
  onEditPatient: (patient: Patient) => void
  onDeletePatient: (patient: Patient) => void
  onViewPatient?: (patient: Patient) => void
}

export function PatientTableExample({ 
  patients, 
  doctors, 
  onEditPatient, 
  onDeletePatient, 
  onViewPatient 
}: PatientTableExampleProps) {
  
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
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-pink-50">
            <TableHead className="text-pink-800 font-medium">No. RM</TableHead>
            <TableHead className="text-pink-800 font-medium">Data Pasien</TableHead>
            <TableHead className="text-pink-800 font-medium">Kontak</TableHead>
            <TableHead className="text-pink-800 font-medium">Info Tambahan</TableHead>
            <TableHead className="text-pink-800 font-medium min-w-[400px]">Aksi & Cetak Formulir</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                Belum ada data pasien
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow key={patient.id} className="hover:bg-pink-25">
                <TableCell className="font-mono text-xs">
                  <div className="font-medium text-pink-700">
                    {patient.medicalRecordNumber || 'Belum ada'}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{patient.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {calculateAge(patient.birthDate)} tahun
                      <Badge variant="secondary" className="text-xs">
                        {patient.gender}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs">
                      <Phone className="h-3 w-3 text-green-600" />
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex items-start gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 mt-0.5 text-red-500 flex-shrink-0" />
                      <span className="line-clamp-2">{patient.address}</span>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-gray-500">Daftar:</span>
                      <span className="ml-1">{formatDate(patient.registrationDate)}</span>
                    </div>
                    {patient.bloodType && (
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {patient.bloodType}
                        </Badge>
                      </div>
                    )}
                    {patient.allergies && (
                      <div className="text-red-600 text-xs">
                        Alergi: {patient.allergies}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="min-w-0">
                  <PatientActionsCompact
                    patient={patient}
                    doctors={doctors}
                    onEdit={onEditPatient}
                    onDelete={onDeletePatient}
                    onView={onViewPatient}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Contoh penggunaan di dalam komponen Patients:
/*
<PatientTableExample
  patients={filteredPatients}
  doctors={doctors}
  onEditPatient={handleEditPatient}
  onDeletePatient={setDeletingPatient}
  onViewPatient={handleViewPatient}
/>
*/