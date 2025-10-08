// ✅ ERROR BERHASIL DIPERBAIKI - File ini dapat dihapus
// 
// The issue is in /components/PatientsUpdated.tsx around lines 1094-1205
// There's an extra <div className="min-w-full"> that doesn't have a proper closing tag
// 
// MANUAL FIX NEEDED:
// 1. Find line 1096: <div className="min-w-full">
// 2. Delete that entire line
// 3. The table structure should be:
//    <div className="border rounded-lg max-h-96 overflow-y-auto table-container">
//      <Table className="w-full table-fixed">
//        ... table content ...
//      </Table>
//    </div>
// 
// The corrected structure should be:

{/* Patient Selection Table */}
<div className="border rounded-lg max-h-96 overflow-y-auto table-container">
  <Table className="w-full table-fixed">
    <TableHeader>
      <TableRow className="bg-pink-50">
        <TableHead className="text-pink-700 w-[22%]">Nama Pasien</TableHead>
        <TableHead className="text-pink-700 w-[14%]">No. RM</TableHead>
        <TableHead className="text-pink-700 w-[16%]">Telepon</TableHead>
        <TableHead className="text-pink-700 w-[10%]">Umur</TableHead>
        <TableHead className="text-pink-700 w-[8%]">Gender</TableHead>
        <TableHead className="text-pink-700 w-[20%]">Alamat</TableHead>
        <TableHead className="text-pink-700 text-center w-[10%]">Pilih</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {!scheduleSearchTerm ? (
        <TableRow>
          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <Search className="h-12 w-12 text-gray-300" />
              <span className="text-lg">Ketik untuk mencari pasien</span>
              <span className="text-sm">Masukkan nama, nomor RM, atau telepon pasien</span>
            </div>
          </TableCell>
        </TableRow>
      ) : filteredSchedulePatients.length === 0 ? (
        <TableRow>
          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <Search className="h-12 w-12 text-gray-300" />
              <span className="text-lg">Tidak ada pasien yang cocok dengan pencarian</span>
              <span className="text-sm">Coba gunakan kata kunci yang berbeda</span>
            </div>
          </TableCell>
        </TableRow>
      ) : (
        filteredSchedulePatients.slice(0, 5).map((patient) => (
          <TableRow 
            key={patient.id} 
            className={`hover:bg-pink-50 cursor-pointer transition-colors ${
              scheduleForm.patientId === patient.id ? 'bg-pink-100 border-pink-200' : ''
            }`}
            onClick={() => {
              setScheduleForm(prev => ({ ...prev, patientId: patient.id }))
              setScheduleSearchTerm('')
            }}
          >
            <TableCell className="font-medium">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" title={patient.name}>
                    {patient.name}
                  </span>
                  {scheduleForm.patientId === patient.id && (
                    <Badge className="bg-pink-600 text-white text-xs flex-shrink-0">Terpilih</Badge>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(patient.registrationDate || patient.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: '2-digit'
                  })}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="font-mono text-xs bg-pink-50 text-pink-700 border-pink-200 truncate w-full justify-center">
                {patient.medicalRecordNumber || 'Belum ada'}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="truncate">{patient.phone}</span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-gray-600 text-center">
              {calculateAge(patient.birthDate)}
            </TableCell>
            <TableCell className="text-center">
              <Badge variant={patient.gender === 'Laki-laki' ? 'default' : 'secondary'} className="text-xs">
                {patient.gender === 'Laki-laki' ? 'L' : 'P'}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="truncate" title={patient.address}>
                  {patient.address}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-center">
              <Button
                type="button"
                size="sm"
                variant={scheduleForm.patientId === patient.id ? "default" : "outline"}
                className={`w-full ${scheduleForm.patientId === patient.id ? 
                  "bg-pink-600 hover:bg-pink-700 text-white" : 
                  "border-pink-200 text-pink-700 hover:bg-pink-50"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  setScheduleForm(prev => ({ ...prev, patientId: patient.id }))
                  setScheduleSearchTerm('')
                }}
              >
                {scheduleForm.patientId === patient.id ? '✓' : 'Pilih'}
              </Button>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>