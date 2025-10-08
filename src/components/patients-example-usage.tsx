// Contoh penggunaan tombol di dalam tabel pasien atau card pasien
// Tambahkan ini di bagian return statement Patients.tsx

/*
Contoh penggunaan di dalam TableRow untuk setiap pasien:

<TableRow key={patient.id}>
  <TableCell>{patient.name}</TableCell>
  <TableCell>{patient.phone}</TableCell>
  <TableCell>
    <div className="flex flex-wrap gap-2">
      {/* Tombol Individual */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => openDoctorDialog(patient, 'informed-consent')}
        className="flex items-center gap-2 text-blue-700 border-blue-200 hover:bg-blue-50"
      >
        <FileCheck className="h-4 w-4" />
        Informed Consent
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => openDoctorDialog(patient, 'medical-record')}
        className="flex items-center gap-2 text-purple-700 border-purple-200 hover:bg-purple-50"
      >
        <Printer className="h-4 w-4" />
        Rekam Medis
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => openDoctorDialog(patient, 'ortho-form')}
        className="flex items-center gap-2 text-orange-700 border-orange-200 hover:bg-orange-50"
      >
        <Smile className="h-4 w-4" />
        Formulir Ortodontik
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => openDoctorDialog(patient, 'prescription')}
        className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
      >
        <Receipt className="h-4 w-4" />
        Resep Obat
      </Button>
    </div>
  </TableCell>
</TableRow>

ATAU gunakan komponen yang sudah dibuat:

<TableRow key={patient.id}>
  <TableCell>{patient.name}</TableCell>
  <TableCell>{patient.phone}</TableCell>
  <TableCell>
    <PatientPrintButtons patient={patient} onPrint={openDoctorDialog} />
  </TableCell>
</TableRow>

Jangan lupa tambahkan Dialog di akhir return statement:

{/* Doctor Selection Dialog */}
<DoctorSelectionDialog
  open={doctorDialogOpen}
  onClose={() => setDoctorDialogOpen(false)}
  doctors={doctors}
  selectedDoctor={selectedDoctor}
  setSelectedDoctor={setSelectedDoctor}
  printDate={printDate}
  setPrintDate={setPrintDate}
  printType={printType}
  selectedPatient={selectedPatientForPrint}
  onPrint={handlePrintWithDoctor}
  onRefreshDoctors={fetchDoctors}
/>

*/