import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Database, Users, Stethoscope, AlertCircle, CheckCircle, Loader, Package } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { serverUrl } from '../utils/supabase/client'

interface DataInitializerProps {
  accessToken: string
}

export function DataInitializer({ accessToken }: DataInitializerProps) {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [restoreMode, setRestoreMode] = useState('complete') // 'complete', 'doctors-only', 'employees-only', 'patients-only', 'existing-doctors'

  // Sample data untuk karyawan
  const sampleEmployees = [
    {
      name: 'Siti Nurhaliza',
      position: 'Resepsionis',
      phone: '081234567890',
      email: 'siti.nurhaliza@falasifah.com',
      password: 'password123',
      joinDate: '2024-01-15',
      status: 'active'
    },
    {
      name: 'Ahmad Rizky',
      position: 'Asisten Dokter',
      phone: '081234567891',
      email: 'ahmad.rizky@falasifah.com',
      password: 'password123',
      joinDate: '2024-02-01',
      status: 'active'
    },
    {
      name: 'Dewi Sartika',
      position: 'Perawat',
      phone: '081234567892',
      email: 'dewi.sartika@falasifah.com',
      password: 'password123',
      joinDate: '2024-01-20',
      status: 'active'
    },
    {
      name: 'Budi Santoso',
      position: 'Teknisi Laboratorium',
      phone: '081234567893',
      email: 'budi.santoso@falasifah.com',
      password: 'password123',
      joinDate: '2024-03-01',
      status: 'active'
    },
    {
      name: 'Maya Putri',
      position: 'Administrasi Keuangan',
      phone: '081234567894',
      email: 'maya.putri@falasifah.com',
      password: 'password123',
      joinDate: '2024-02-15',
      status: 'active'
    }
  ]

  // Sample data untuk produk/obat
  const sampleProducts = [
    {
      name: 'Paracetamol 500mg',
      category: 'Obat',
      stock: 100,
      unit: 'tablet',
      price: 500,
      description: 'Obat pereda nyeri dan demam'
    },
    {
      name: 'Amoxicillin 500mg',
      category: 'Obat',
      stock: 50,
      unit: 'kapsul',
      price: 1200,
      description: 'Antibiotik untuk infeksi bakteri'
    },
    {
      name: 'Chlorhexidine Mouthwash',
      category: 'Produk Medis',
      stock: 25,
      unit: 'botol',
      price: 35000,
      description: 'Obat kumur antiseptik'
    },
    {
      name: 'Dental Floss',
      category: 'Produk Medis',
      stock: 75,
      unit: 'pcs',
      price: 15000,
      description: 'Benang gigi untuk pembersihan'
    },
    {
      name: 'Sikat Gigi Ortodonti',
      category: 'Produk Medis',
      stock: 30,
      unit: 'pcs',
      price: 25000,
      description: 'Sikat gigi khusus untuk kawat gigi'
    },
    {
      name: 'Fluoride Gel',
      category: 'Produk Medis',
      stock: 20,
      unit: 'tube',
      price: 45000,
      description: 'Gel fluoride untuk perawatan gigi'
    },
    {
      name: 'Lidocaine 2%',
      category: 'Obat',
      stock: 15,
      unit: 'vial',
      price: 12000,
      description: 'Anestesi lokal untuk tindakan dental'
    },
    {
      name: 'Dental Cement',
      category: 'Produk Medis',
      stock: 10,
      unit: 'pack',
      price: 85000,
      description: 'Semen gigi untuk tambal permanent'
    }
  ]

  // Sample data untuk dokter
  const sampleDoctors = [
    {
      name: 'drg. Dr. Sarah Amanda, Sp.KGA',
      specialization: 'Dokter Gigi Anak',
      phone: '081234567895',
      email: 'dr.sarah@falasifah.com',
      licenseNumber: 'SIP.446/DINKES/2024/001',
      shifts: ['09:00-15:00', '18:00-20:00'],
      status: 'active'
    },
    {
      name: 'drg. Muhammad Fadli, Sp.Ort',
      specialization: 'Orthodontist',
      phone: '081234567896',
      email: 'dr.fadli@falasifah.com',
      licenseNumber: 'SIP.446/DINKES/2024/002',
      shifts: ['09:00-15:00'],
      status: 'active'
    },
    {
      name: 'drg. Rina Melati, Sp.Perio',
      specialization: 'Periodontist',
      phone: '081234567897',
      email: 'dr.rina@falasifah.com',
      licenseNumber: 'SIP.446/DINKES/2024/003',
      shifts: ['18:00-20:00'],
      status: 'active'
    },
    {
      name: 'drg. Arief Wijaya',
      specialization: 'Dokter Gigi Umum',
      phone: '081234567898',
      email: 'dr.arief@falasifah.com',
      licenseNumber: 'SIP.446/DINKES/2024/004',
      shifts: ['09:00-15:00', '18:00-20:00'],
      status: 'active'
    },
    {
      name: 'drg. Linda Kartika, Sp.Pros',
      specialization: 'Prosthodontist',
      phone: '081234567899',
      email: 'dr.linda@falasifah.com',
      licenseNumber: 'SIP.446/DINKES/2024/005',
      shifts: ['09:00-15:00'],
      status: 'active'
    }
  ]

  // Data dokter yang sudah ada sebelumnya (restore)
  const existingDoctors = [
    {
      name: 'drg. Falasifah',
      specialization: 'GP',
      phone: '081234567801',
      email: 'dr.falasifah@falasifah.com',
      licenseNumber: 'SIP.446/DINKES/2023/001',
      shifts: ['09:00-15:00', '18:00-20:00'],
      status: 'active'
    },
    {
      name: 'drg. Azwinder Eka Satria',
      specialization: 'GP',
      phone: '081234567802',
      email: 'dr.azwinder@falasifah.com',
      licenseNumber: 'SIP.446/DINKES/2023/002',
      shifts: ['09:00-15:00'],
      status: 'active'
    },
    {
      name: 'drg. Eka Puspitasari',
      specialization: 'GP',
      phone: '081234567803',
      email: 'dr.eka@falasifah.com',
      licenseNumber: 'SIP.446/DINKES/2023/003',
      shifts: ['18:00-20:00'],
      status: 'active'
    }
  ]

  // Sample data untuk pasien
  const samplePatients = [
    {
      name: 'Andi Pratama',
      phone: '081234560001',
      email: 'andi.pratama@gmail.com',
      address: 'Jl. Mawar No. 12, Jakarta Selatan',
      birthDate: '1990-05-15',
      gender: 'male',
      emergencyContact: '081234560002',
      medicalHistory: 'Alergi Penisilin',
      notes: 'Pasien regular untuk scaling rutin'
    },
    {
      name: 'Sari Wulandari',
      phone: '081234560003',
      email: 'sari.wulan@gmail.com',
      address: 'Jl. Melati No. 25, Jakarta Timur',
      birthDate: '1985-08-20',
      gender: 'female',
      emergencyContact: '081234560004',
      medicalHistory: 'Diabetes Mellitus Tipe 2',
      notes: 'Perlu perhatian khusus untuk prosedur invasif'
    },
    {
      name: 'Budi Santoso',
      phone: '081234560005',
      email: 'budi.santoso@gmail.com',
      address: 'Jl. Anggrek No. 8, Jakarta Barat',
      birthDate: '1995-12-10',
      gender: 'male',
      emergencyContact: '081234560006',
      medicalHistory: 'Hipertensi',
      notes: 'Pasien baru, perlu pemeriksaan lengkap'
    },
    {
      name: 'Maya Sari',
      phone: '081234560007',
      email: 'maya.sari@gmail.com',
      address: 'Jl. Dahlia No. 33, Jakarta Utara',
      birthDate: '1988-03-25',
      gender: 'female',
      emergencyContact: '081234560008',
      medicalHistory: 'Tidak Ada',
      notes: 'Pasien regular, konsultasi ortodonti'
    },
    {
      name: 'Rudi Hermawan',
      phone: '081234560009',
      email: 'rudi.hermawan@gmail.com',
      address: 'Jl. Flamboyan No. 17, Jakarta Pusat',
      birthDate: '1992-11-08',
      gender: 'male',
      emergencyContact: '081234560010',
      medicalHistory: 'Asma Ringan',
      notes: 'Riwayat cabut gigi bungsu'
    },
    {
      name: 'Lina Susanti',
      phone: '081234560011',
      email: 'lina.susanti@gmail.com',
      address: 'Jl. Kenanga No. 45, Tangerang',
      birthDate: '1987-06-30',
      gender: 'female',
      emergencyContact: '081234560012',
      medicalHistory: 'Migrain Kronis',
      notes: 'Pasien VIP, preferensi jadwal pagi'
    },
    {
      name: 'Ahmad Fauzi',
      phone: '081234560013',
      email: 'ahmad.fauzi@gmail.com',
      address: 'Jl. Cempaka No. 22, Bekasi',
      birthDate: '1993-09-14',
      gender: 'male',
      emergencyContact: '081234560014',
      medicalHistory: 'Penyakit Jantung',
      notes: 'Membutuhkan konsultasi sebelum prosedur'
    },
    {
      name: 'Dewi Kartika',
      phone: '081234560015',
      email: 'dewi.kartika@gmail.com',
      address: 'Jl. Seruni No. 11, Depok',
      birthDate: '1991-04-18',
      gender: 'female',
      emergencyContact: '081234560016',
      medicalHistory: 'Osteoporosis',
      notes: 'Konsultasi implant gigi'
    }
  ]

  const initializeEmployees = async () => {
    const employeeResults = []
    
    for (const employee of sampleEmployees) {
      try {
        console.log(`Creating employee: ${employee.name}`)
        
        const response = await fetch(`${serverUrl}/employees`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(employee)
        })

        const data = await response.json()
        
        if (response.ok) {
          employeeResults.push({
            name: employee.name,
            status: 'success',
            message: data.message || 'Berhasil ditambahkan'
          })
          console.log(`✅ Employee created: ${employee.name}`)
        } else {
          employeeResults.push({
            name: employee.name,
            status: 'error',
            message: data.error || 'Gagal menambahkan'
          })
          console.log(`❌ Employee failed: ${employee.name} - ${data.error}`)
        }
      } catch (error) {
        employeeResults.push({
          name: employee.name,
          status: 'error',
          message: 'Error: ' + error.message
        })
        console.log(`❌ Employee error: ${employee.name} - ${error.message}`)
      }
    }
    
    return employeeResults
  }

  const initializeDoctors = async (useExistingData = false) => {
    const doctorResults = []
    const doctorList = useExistingData ? existingDoctors : sampleDoctors
    
    for (const doctor of doctorList) {
      try {
        console.log(`Creating doctor: ${doctor.name}`)
        
        const response = await fetch(`${serverUrl}/doctors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(doctor)
        })

        const data = await response.json()
        
        if (response.ok) {
          doctorResults.push({
            name: doctor.name,
            status: 'success',
            message: 'Berhasil ditambahkan'
          })
          console.log(`✅ Doctor created: ${doctor.name}`)
        } else {
          doctorResults.push({
            name: doctor.name,
            status: 'error',
            message: data.error || 'Gagal menambahkan'
          })
          console.log(`❌ Doctor failed: ${doctor.name} - ${data.error}`)
        }
      } catch (error) {
        doctorResults.push({
          name: doctor.name,
          status: 'error',
          message: 'Error: ' + error.message
        })
        console.log(`❌ Doctor error: ${doctor.name} - ${error.message}`)
      }
    }
    
    return doctorResults
  }

  const initializeProducts = async () => {
    const productResults = []
    
    for (const product of sampleProducts) {
      try {
        console.log(`Creating product: ${product.name}`)
        
        const response = await fetch(`${serverUrl}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(product)
        })

        const data = await response.json()
        
        if (response.ok) {
          productResults.push({
            name: product.name,
            status: 'success',
            message: 'Berhasil ditambahkan'
          })
          console.log(`✅ Product created: ${product.name}`)
        } else {
          productResults.push({
            name: product.name,
            status: 'error',
            message: data.error || 'Gagal menambahkan'
          })
          console.log(`❌ Product failed: ${product.name} - ${data.error}`)
        }
      } catch (error) {
        productResults.push({
          name: product.name,
          status: 'error',
          message: 'Error: ' + error.message
        })
        console.log(`❌ Product error: ${product.name} - ${error.message}`)
      }
    }
    
    return productResults
  }

  const initializePatients = async () => {
    const patientResults = []
    
    for (const patient of samplePatients) {
      try {
        console.log(`Creating patient: ${patient.name}`)
        
        const response = await fetch(`${serverUrl}/patients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(patient)
        })

        const data = await response.json()
        
        if (response.ok) {
          patientResults.push({
            name: patient.name,
            status: 'success',
            message: 'Berhasil ditambahkan'
          })
          console.log(`✅ Patient created: ${patient.name}`)
        } else {
          patientResults.push({
            name: patient.name,
            status: 'error',
            message: data.error || 'Gagal menambahkan'
          })
          console.log(`❌ Patient failed: ${patient.name} - ${data.error}`)
        }
      } catch (error) {
        patientResults.push({
          name: patient.name,
          status: 'error',
          message: 'Error: ' + error.message
        })
        console.log(`❌ Patient error: ${patient.name} - ${error.message}`)
      }
    }
    
    return patientResults
  }

  const handleRestoreData = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      let employeeResults = []
      let doctorResults = []
      let productResults = []
      let patientResults = []
      
      console.log(`🚀 Starting ${restoreMode} restoration...`)
      
      switch (restoreMode) {
        case 'complete':
          toast.info('Memulai inisialisasi data lengkap...')
          console.log('👥 Initializing employees...')
          employeeResults = await initializeEmployees()
          console.log('🩺 Initializing new doctors...')
          doctorResults = await initializeDoctors(false)
          console.log('📦 Initializing products...')
          productResults = await initializeProducts()
          console.log('👤 Initializing patients...')
          patientResults = await initializePatients()
          break
          
        case 'existing-doctors':
          toast.info('Memulai restore dokter yang sudah ada...')
          console.log('🩺 Restoring existing doctors...')
          doctorResults = await initializeDoctors(true)
          break
          
        case 'doctors-only':
          toast.info('Memulai inisialisasi dokter baru...')
          console.log('🩺 Initializing new doctors...')
          doctorResults = await initializeDoctors(false)
          break
          
        case 'employees-only':
          toast.info('Memulai inisialisasi karyawan...')
          console.log('👥 Initializing employees...')
          employeeResults = await initializeEmployees()
          break
          
        case 'patients-only':
          toast.info('Memulai inisialisasi pasien...')
          console.log('👤 Initializing patients...')
          patientResults = await initializePatients()
          break
          
        case 'products-only':
          toast.info('Memulai inisialisasi produk...')
          console.log('📦 Initializing products...')
          productResults = await initializeProducts()
          break
      }
      
      const finalResults = {
        employees: employeeResults,
        doctors: doctorResults,
        products: productResults,
        patients: patientResults,
        summary: {
          employeesSuccess: employeeResults.filter(r => r.status === 'success').length,
          employeesFailed: employeeResults.filter(r => r.status === 'error').length,
          doctorsSuccess: doctorResults.filter(r => r.status === 'success').length,
          doctorsFailed: doctorResults.filter(r => r.status === 'error').length,
          productsSuccess: productResults.filter(r => r.status === 'success').length,
          productsFailed: productResults.filter(r => r.status === 'error').length,
          patientsSuccess: patientResults.filter(r => r.status === 'success').length,
          patientsFailed: patientResults.filter(r => r.status === 'error').length
        }
      }
      
      setResults(finalResults)
      
      const totalSuccess = finalResults.summary.employeesSuccess + finalResults.summary.doctorsSuccess + finalResults.summary.productsSuccess + finalResults.summary.patientsSuccess
      const totalFailed = finalResults.summary.employeesFailed + finalResults.summary.doctorsFailed + finalResults.summary.productsFailed + finalResults.summary.patientsFailed
      
      if (totalFailed === 0) {
        toast.success(`✅ Semua data berhasil diinisialisasi! (${totalSuccess} record)`)
      } else {
        toast.warning(`⚠️ Inisialisasi selesai: ${totalSuccess} berhasil, ${totalFailed} gagal`)
      }
      
      console.log('✅ Data restoration completed:', finalResults.summary)
      
    } catch (error) {
      console.error('❌ Data restoration error:', error)
      toast.error('Terjadi kesalahan saat restore data')
    } finally {
      setLoading(false)
    }
  }

  const resetResults = () => {
    setResults(null)
  }

  const getButtonStyle = () => {
    switch (restoreMode) {
      case 'complete':
        return 'bg-pink-600 hover:bg-pink-700'
      case 'existing-doctors':
        return 'bg-green-600 hover:bg-green-700'
      case 'doctors-only':
        return 'bg-blue-600 hover:bg-blue-700'
      case 'employees-only':
        return 'bg-purple-600 hover:bg-purple-700'
      case 'patients-only':
        return 'bg-orange-600 hover:bg-orange-700'
      case 'products-only':
        return 'bg-indigo-600 hover:bg-indigo-700'
      default:
        return 'bg-pink-600 hover:bg-pink-700'
    }
  }

  const getButtonIcon = () => {
    switch (restoreMode) {
      case 'complete':
        return <Database className="h-4 w-4" />
      case 'existing-doctors':
      case 'doctors-only':
        return <Stethoscope className="h-4 w-4" />
      case 'employees-only':
        return <Users className="h-4 w-4" />
      case 'patients-only':
        return <Users className="h-4 w-4" />
      case 'products-only':
        return <Package className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  const getButtonText = () => {
    switch (restoreMode) {
      case 'complete':
        return 'Restore Data Lengkap'
      case 'existing-doctors':
        return 'Restore Dokter Lama'
      case 'doctors-only':
        return 'Restore Dokter Baru'
      case 'employees-only':
        return 'Restore Karyawan'
      case 'patients-only':
        return 'Restore Pasien'
      case 'products-only':
        return 'Restore Produk'
      default:
        return 'Restore Data'
    }
  }

  const getResultMessage = () => {
    switch (restoreMode) {
      case 'complete':
        return 'Restore data lengkap selesai'
      case 'existing-doctors':
        return 'Restore dokter yang sudah ada selesai'
      case 'doctors-only':
        return 'Restore dokter baru selesai'
      case 'employees-only':
        return 'Restore karyawan selesai'
      case 'patients-only':
        return 'Restore pasien selesai'
      case 'products-only':
        return 'Restore produk selesai'
      default:
        return 'Restore data selesai'
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Inisialisasi Data Karyawan & Dokter
          </CardTitle>
          <p className="text-sm text-pink-600">
            Populate database dengan data sample karyawan dan dokter untuk Falasifah Dental Clinic
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Pilih jenis restore data:</strong>
              <div className="mt-3 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="initMode"
                    value="complete"
                    checked={restoreMode === 'complete'}
                    onChange={(e) => setRestoreMode(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">
                    <strong>Data Lengkap Baru:</strong> {sampleEmployees.length} Karyawan + {sampleDoctors.length} Dokter + {sampleProducts.length} Produk + {samplePatients.length} Pasien
                  </span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="initMode"
                    value="existing-doctors"
                    checked={restoreMode === 'existing-doctors'}
                    onChange={(e) => setRestoreMode(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">
                    <strong>Restore Dokter Lama:</strong> {existingDoctors.length} Dokter (drg. Falasifah, drg. Azwinder, drg. Eka)
                  </span>
                </label>

                <div className="border-l-2 border-gray-300 pl-4 mt-2">
                  <p className="text-xs text-gray-600 mb-2"><strong>Restore Individual:</strong></p>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="initMode"
                      value="employees-only"
                      checked={restoreMode === 'employees-only'}
                      onChange={(e) => setRestoreMode(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Hanya Karyawan ({sampleEmployees.length})</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="initMode"
                      value="doctors-only"
                      checked={restoreMode === 'doctors-only'}
                      onChange={(e) => setRestoreMode(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Hanya Dokter Baru ({sampleDoctors.length})</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="initMode"
                      value="patients-only"
                      checked={restoreMode === 'patients-only'}
                      onChange={(e) => setRestoreMode(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Hanya Pasien ({samplePatients.length})</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="initMode"
                      value="products-only"
                      checked={restoreMode === 'products-only'}
                      onChange={(e) => setRestoreMode(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="text-sm">Hanya Produk ({sampleProducts.length})</span>
                  </label>
                </div>
              </div>
              <p className="mt-2 text-sm">
                <strong>Password default karyawan:</strong> password123
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleRestoreData}
              disabled={loading}
              className={`${getButtonStyle()} flex items-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  {getButtonIcon()}
                  {getButtonText()}
                </>
              )}
            </Button>

            {results && (
              <Button
                onClick={resetResults}
                variant="outline"
                className="border-gray-300 text-gray-600"
              >
                Reset Hasil
              </Button>
            )}
          </div>

          {results && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Hasil Restore:</strong>
                  <p className="text-sm mt-1">
                    {getResultMessage()}
                  </p>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-800">Karyawan Berhasil</p>
                    <p className="text-2xl font-bold text-green-600">{results.summary.employeesSuccess}</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-800">Karyawan Gagal</p>
                    <p className="text-2xl font-bold text-red-600">{results.summary.employeesFailed}</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <Stethoscope className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-800">Dokter Berhasil</p>
                    <p className="text-2xl font-bold text-green-600">{results.summary.doctorsSuccess}</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <Stethoscope className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-800">Dokter Gagal</p>
                    <p className="text-2xl font-bold text-red-600">{results.summary.doctorsFailed}</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-800">Produk Berhasil</p>
                    <p className="text-2xl font-bold text-green-600">{results.summary.productsSuccess}</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <Package className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-800">Produk Gagal</p>
                    <p className="text-2xl font-bold text-red-600">{results.summary.productsFailed}</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-800">Pasien Berhasil</p>
                    <p className="text-2xl font-bold text-green-600">{results.summary.patientsSuccess}</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-red-800">Pasien Gagal</p>
                    <p className="text-2xl font-bold text-red-600">{results.summary.patientsFailed}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Hasil Karyawan */}
                <Card className="border-pink-200">
                  <CardHeader>
                    <CardTitle className="text-pink-800 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Hasil Karyawan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {results.employees.map((emp, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            emp.status === 'success'
                              ? 'bg-green-50 text-green-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {emp.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-xs opacity-80">{emp.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Hasil Dokter */}
                <Card className="border-pink-200">
                  <CardHeader>
                    <CardTitle className="text-pink-800 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Hasil Dokter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {results.doctors.map((doc, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            doc.status === 'success'
                              ? 'bg-green-50 text-green-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {doc.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-xs opacity-80">{doc.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Hasil Produk */}
                <Card className="border-pink-200">
                  <CardHeader>
                    <CardTitle className="text-pink-800 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Hasil Produk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {results.products.map((prod, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            prod.status === 'success'
                              ? 'bg-green-50 text-green-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {prod.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{prod.name}</p>
                            <p className="text-xs opacity-80">{prod.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Hasil Pasien */}
                <Card className="border-pink-200">
                  <CardHeader>
                    <CardTitle className="text-pink-800 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Hasil Pasien
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {results.patients.map((patient, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            patient.status === 'success'
                              ? 'bg-green-50 text-green-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {patient.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-xs opacity-80">{patient.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}