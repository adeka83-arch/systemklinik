/*
=================================================================
PANDUAN INTEGRASI FORMULIR CETAK COMPACT UNTUK HALAMAN PASIEN
=================================================================

1. KOMPONEN YANG TERSEDIA:

   A. CompactPrintDropdown
      - 2 dropdown terpisah (formulir + dokter)
      - Tombol cetak terpisah
      - Lebih user-friendly untuk seleksi

   B. SinglePrintDropdown  
      - 1 dropdown dengan nested options
      - Langsung cetak saat dipilih
      - Lebih compact untuk tabel

   C. PatientActionsCompact
      - Kombinasi tombol aksi + dropdown cetak
      - Lengkap dengan edit, delete, view
      - Ideal untuk tabel dengan banyak aksi

2. CARA INTEGRASI DI PATIENTS.TSX:

   A. Import komponen yang dibutuhkan:
   ```typescript
   import { CompactPrintDropdown } from './compact-print-dropdown'
   import { SinglePrintDropdown } from './single-print-dropdown'
   import { PatientActionsCompact } from './patient-actions-compact'
   import { 
     generateMedicalRecord, 
     generateOrthoForm, 
     generatePrescription,
     generateXrayReferral,
     generateSpecialistReferral,
     generateMedicalCertificate
   } from './print-functions'
   ```

   B. Buat function handler untuk print:
   ```typescript
   const handlePrintForm = async (patient: Patient, formType: FormType, doctorId: string) => {
     try {
       const selectedDoctor = doctors.find(doc => doc.id === doctorId)
       if (!selectedDoctor) {
         toast.error('Dokter tidak ditemukan')
         return
       }

       const doctorName = selectedDoctor.name
       const printDate = new Date().toISOString().split('T')[0]

       switch (formType) {
         case 'informed-consent':
           generateInformedConsent(patient, doctorName, printDate)
           break
         case 'medical-record':
           generateMedicalRecord(patient, doctorName, printDate)
           break
         case 'ortho-form':
           generateOrthoForm(patient, doctorName, printDate)
           break
         case 'prescription':
           generatePrescription(patient, doctorName, printDate)
           break
         case 'xray-referral':
           generateXrayReferral(patient, doctorName, printDate)
           break
         case 'specialist-referral':
           generateSpecialistReferral(patient, doctorName, printDate)
           break
         case 'medical-certificate':
           generateMedicalCertificate(patient, doctorName, printDate)
           break
         default:
           toast.error('Tipe formulir tidak dikenal')
           return
       }

       toast.success('Dokumen berhasil dicetak')
     } catch (error) {
       console.error('Print error:', error)
       toast.error('Gagal mencetak dokumen')
     }
   }
   ```

   C. Gunakan di dalam TableRow:

   OPSI 1 - Menggunakan PatientActionsCompact (RECOMMENDED):
   ```jsx
   <TableRow key={patient.id}>
     <TableCell>{patient.name}</TableCell>
     <TableCell>{patient.phone}</TableCell>
     <TableCell>
       <PatientActionsCompact
         patient={patient}
         doctors={doctors}
         onEdit={handleEditPatient}
         onDelete={() => setDeletingPatient(patient)}
         onView={handleViewPatient}
       />
     </TableCell>
   </TableRow>
   ```

   OPSI 2 - Menggunakan SinglePrintDropdown:
   ```jsx
   <TableRow key={patient.id}>
     <TableCell>{patient.name}</TableCell>
     <TableCell>{patient.phone}</TableCell>
     <TableCell>
       <div className="flex gap-2">
         <Button size="sm" onClick={() => handleEditPatient(patient)}>
           Edit
         </Button>
         <SinglePrintDropdown
           patient={patient}
           doctors={doctors}
           onPrint={handlePrintForm}
         />
       </div>
     </TableCell>
   </TableRow>
   ```

   OPSI 3 - Menggunakan CompactPrintDropdown:
   ```jsx
   <TableRow key={patient.id}>
     <TableCell>{patient.name}</TableCell>
     <TableCell>{patient.phone}</TableCell>
     <TableCell>
       <div className="flex gap-2">
         <Button size="sm" onClick={() => handleEditPatient(patient)}>
           Edit
         </Button>
         <CompactPrintDropdown
           patient={patient}
           doctors={doctors}
           onPrint={handlePrintForm}
         />
       </div>
     </TableCell>
   </TableRow>
   ```

3. TEMPLATE FORMULIR YANG TERSEDIA:

   A. Informed Consent (A4)
      - Persetujuan tindakan medis
      - Format standar rumah sakit

   B. Medical Record (A4) 
      - Rekam medis pasien
      - Format dokumentasi medis

   C. Orthodontic Form (A4)
      - Formulir khusus ortodontik
      - Untuk perawatan behel

   D. Prescription (A5) 
      - Resep obat
      - Format praktis A5

   E. X-Ray Referral (A5)
      - Rujukan pemeriksaan rontgen
      - Checklist jenis pemeriksaan

   F. Specialist Referral (A5)
      - Rujukan ke dokter spesialis
      - Pilihan berbagai spesialisasi

   G. Medical Certificate (A5)
      - Surat keterangan berobat
      - Untuk keperluan administrasi

4. FITUR UTAMA:

   ✅ Dropdown dokter terintegrasi
   ✅ Auto-print setelah pemilihan
   ✅ Responsive design
   ✅ Loading state
   ✅ Error handling
   ✅ Toast notifications
   ✅ Format A4 dan A5
   ✅ Template profesional
   ✅ Logo klinik otomatis

5. KUSTOMISASI:

   - Semua template dapat dikustomisasi di print-functions.tsx
   - Styling dapat diubah sesuai kebutuhan klinik
   - Logo klinik otomatis dari clinicLogo import
   - Warna dan branding dapat disesuaikan

6. TESTING:

   Pastikan:
   - Data dokter sudah terload
   - Print preview berfungsi
   - Semua formulir dapat dicetak
   - Error handling bekerja
   - UI responsive di berbagai ukuran layar

7. MAINTENANCE:

   File yang perlu diperhatikan:
   - /components/compact-print-dropdown.tsx
   - /components/single-print-dropdown.tsx  
   - /components/patient-actions-compact.tsx
   - /components/print-functions.tsx

=================================================================
*/