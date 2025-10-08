import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner@2.0.3'
import { Upload, FileSpreadsheet, Check, X, AlertTriangle, Users, Download } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'

interface PatientData {
  no?: number
  nama: string
  no_rm?: string
  tanggal_lahir?: string
  jenis_kelamin?: string
  alamat?: string
  telepon?: string
  pekerjaan?: string
  status_pernikahan?: string
  agama?: string
  kewarganegaraan?: string
  kontak_darurat?: string
  telepon_darurat?: string
  asuransi?: string
  nomor_asuransi?: string
  golongan_darah?: string
  tinggi_badan?: number
  berat_badan?: number
  riwayat_alergi?: string
  riwayat_penyakit?: string
  catatan?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
  value: any
}

interface ImportPatientsXLSXProps {
  accessToken: string
  onImportComplete?: () => void
}

// Column mapping untuk berbagai format Excel yang mungkin
const COLUMN_MAPPING = {
  // Format standar
  'no': ['no', 'nomor', 'number', '#'],
  'nama': ['nama', 'name', 'nama pasien', 'patient name', 'nama lengkap', 'full name'],
  'no_rm': ['no_rm', 'no rm', 'rekam medis', 'medical record', 'rm', 'mrn', 'no. rm'],
  'tanggal_lahir': ['tanggal_lahir', 'tanggal lahir', 'tgl lahir', 'date of birth', 'dob', 'birth date', 'lahir'],
  'jenis_kelamin': ['jenis_kelamin', 'jenis kelamin', 'gender', 'sex', 'kelamin', 'jk', 'l/p'],
  'alamat': ['alamat', 'address', 'tempat tinggal', 'domisili'],
  'telepon': ['telepon', 'phone', 'no hp', 'handphone', 'mobile', 'contact', 'hp', 'no telepon', 'no. telepon'],
  'pekerjaan': ['pekerjaan', 'job', 'occupation', 'profesi', 'kerja'],
  'status_pernikahan': ['status_pernikahan', 'status pernikahan', 'marital status', 'status nikah', 'pernikahan'],
  'agama': ['agama', 'religion', 'kepercayaan'],
  'kewarganegaraan': ['kewarganegaraan', 'nationality', 'citizenship', 'negara'],
  'kontak_darurat': ['kontak_darurat', 'kontak darurat', 'emergency contact', 'nama darurat', 'emergency name'],
  'telepon_darurat': ['telepon_darurat', 'telepon darurat', 'emergency phone', 'no darurat', 'emergency number'],
  'asuransi': ['asuransi', 'insurance', 'bpjs', 'jkn', 'askes'],
  'nomor_asuransi': ['nomor_asuransi', 'nomor asuransi', 'insurance number', 'no asuransi', 'no bpjs'],
  'golongan_darah': ['golongan_darah', 'golongan darah', 'blood type', 'gol darah', 'darah'],
  'tinggi_badan': ['tinggi_badan', 'tinggi badan', 'height', 'tinggi', 'tb'],
  'berat_badan': ['berat_badan', 'berat badan', 'weight', 'berat', 'bb'],
  'riwayat_alergi': ['riwayat_alergi', 'riwayat alergi', 'allergy', 'alergi', 'riwayat allergy'],
  'riwayat_penyakit': ['riwayat_penyakit', 'riwayat penyakit', 'medical history', 'history', 'riwayat medis'],
  'catatan': ['catatan', 'notes', 'keterangan', 'note', 'remarks']
}

const REQUIRED_FIELDS = ['nama']

export function ImportPatientsXLSX({ accessToken, onImportComplete }: ImportPatientsXLSXProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewData, setPreviewData] = useState<PatientData[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importResults, setImportResults] = useState<{
    total: number
    success: number
    errors: number
  } | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().match(/\.(xlsx?|csv)$/)) {
      toast.error('Format file harus .xlsx, .xls, atau .csv')
      return
    }

    setFile(selectedFile)
    setCurrentStep('preview')
    setIsLoading(true)

    try {
      await parseExcelFile(selectedFile)
    } catch (error) {
      console.error('Error parsing file:', error)
      toast.error('Gagal membaca file. Pastikan format file benar.')
      setCurrentStep('upload')
    } finally {
      setIsLoading(false)
    }
  }

  const parseExcelFile = async (file: File) => {
    // Dynamic import untuk xlsx library
    const XLSX = await import('xlsx')
    
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Ambil sheet pertama
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Convert ke JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
          
          if (jsonData.length === 0) {
            throw new Error('File Excel kosong')
          }

          // Map data ke format yang diinginkan
          const mappedData = mapExcelData(jsonData)
          
          // Validasi data
          const { validData, errors } = validateData(mappedData)
          
          setPreviewData(validData)
          setValidationErrors(errors)
          
          if (errors.length > 0) {
            toast.warning(`Ditemukan ${errors.length} error. Periksa data sebelum import.`)
          } else {
            toast.success(`Berhasil memproses ${validData.length} data pasien.`)
          }
          
          resolve()
        } catch (error) {
          console.error('Parse error:', error)
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Gagal membaca file'))
      reader.readAsArrayBuffer(file)
    })
  }

  const mapExcelData = (rawData: any[]): PatientData[] => {
    if (rawData.length === 0) return []

    // Ambil header dari baris pertama
    const headers = Object.keys(rawData[0]).map(h => h.toLowerCase().trim())
    
    // Buat mapping berdasarkan header yang ditemukan
    const fieldMapping: { [key: string]: string } = {}
    
    Object.entries(COLUMN_MAPPING).forEach(([field, possibleNames]) => {
      const matchedHeader = headers.find(header => 
        possibleNames.some(name => 
          header.includes(name.toLowerCase()) || name.toLowerCase().includes(header)
        )
      )
      if (matchedHeader) {
        // Cari key asli yang case-sensitive
        const originalKey = Object.keys(rawData[0]).find(k => k.toLowerCase().trim() === matchedHeader)
        if (originalKey) {
          fieldMapping[field] = originalKey
        }
      }
    })

    console.log('Field mapping:', fieldMapping)

    return rawData.map((row, index) => {
      const patient: PatientData = {
        nama: '', // required field
      }

      // Map setiap field yang ditemukan
      Object.entries(fieldMapping).forEach(([field, excelColumn]) => {
        const value = row[excelColumn]
        
        if (value !== undefined && value !== null && value !== '') {
          switch (field) {
            case 'no':
              patient.no = typeof value === 'number' ? value : parseInt(value) || undefined
              break
            case 'tinggi_badan':
            case 'berat_badan':
              patient[field] = typeof value === 'number' ? value : parseFloat(value) || undefined
              break
            case 'tanggal_lahir':
              // Handle berbagai format tanggal
              if (value instanceof Date) {
                patient.tanggal_lahir = value.toISOString().split('T')[0]
              } else if (typeof value === 'string') {
                const dateStr = value.trim()
                // Coba parsing berbagai format
                const parsedDate = parseDate(dateStr)
                if (parsedDate) {
                  patient.tanggal_lahir = parsedDate
                }
              }
              break
            case 'jenis_kelamin':
              // Normalize gender values
              const gender = value.toString().toLowerCase().trim()
              if (gender.includes('l') || gender.includes('male') || gender.includes('pria')) {
                patient.jenis_kelamin = 'Laki-laki'
              } else if (gender.includes('p') || gender.includes('female') || gender.includes('wanita')) {
                patient.jenis_kelamin = 'Perempuan'
              } else {
                patient.jenis_kelamin = value.toString().trim()
              }
              break
            default:
              // String fields
              (patient as any)[field] = value.toString().trim()
              break
          }
        }
      })

      // Jika nama tidak ditemukan dalam mapping, coba ambil dari kolom pertama yang berisi text
      if (!patient.nama) {
        const firstTextValue = Object.values(row).find(val => 
          val && typeof val === 'string' && val.trim().length > 2
        )
        if (firstTextValue) {
          patient.nama = firstTextValue.toString().trim()
        }
      }

      return patient
    }).filter(patient => patient.nama && patient.nama.length > 0) // Filter out empty names
  }

  const parseDate = (dateStr: string): string | undefined => {
    // Handle various date formats
    const formats = [
      // DD/MM/YYYY, DD-MM-YYYY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      // DD/MM/YY, DD-MM-YY  
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
      // YYYY-MM-DD
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      // YYYY/MM/DD
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/
    ]

    for (const format of formats) {
      const match = dateStr.match(format)
      if (match) {
        let day, month, year
        
        if (format.source.startsWith('^(\\d{4})')) {
          // YYYY-MM-DD or YYYY/MM/DD
          year = parseInt(match[1])
          month = parseInt(match[2])
          day = parseInt(match[3])
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          day = parseInt(match[1])
          month = parseInt(match[2])
          year = parseInt(match[3])
          
          // Handle 2-digit years
          if (year < 100) {
            year = year < 50 ? 2000 + year : 1900 + year
          }
        }

        // Validate date
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2024) {
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        }
      }
    }

    return undefined
  }

  const validateData = (data: PatientData[]): { validData: PatientData[], errors: ValidationError[] } => {
    const errors: ValidationError[] = []
    const validData: PatientData[] = []

    data.forEach((patient, index) => {
      const rowNumber = index + 1
      
      // Check required fields
      REQUIRED_FIELDS.forEach(field => {
        if (!patient[field as keyof PatientData] || patient[field as keyof PatientData] === '') {
          errors.push({
            row: rowNumber,
            field,
            message: `Field ${field} wajib diisi`,
            value: patient[field as keyof PatientData]
          })
        }
      })

      // Email validation removed - field no longer used

      // Validate phone format
      if (patient.telepon && !isValidPhone(patient.telepon)) {
        errors.push({
          row: rowNumber,
          field: 'telepon',
          message: 'Format telepon tidak valid',
          value: patient.telepon
        })
      }

      // Validate date format
      if (patient.tanggal_lahir && !isValidDate(patient.tanggal_lahir)) {
        errors.push({
          row: rowNumber,
          field: 'tanggal_lahir',
          message: 'Format tanggal lahir tidak valid',
          value: patient.tanggal_lahir
        })
      }

      // Only add to valid data if no critical errors for this row
      const rowErrors = errors.filter(e => e.row === rowNumber)
      const hasCriticalError = rowErrors.some(e => REQUIRED_FIELDS.includes(e.field))
      
      if (!hasCriticalError) {
        validData.push(patient)
      }
    })

    return { validData, errors }
  }

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isValidPhone = (phone: string): boolean => {
    // Indonesian phone number validation
    return /^(?:\+62|62|0)[\d\-\s]{8,15}$/.test(phone.replace(/\s/g, ''))
  }

  const isValidDate = (date: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(date)) return false
    
    const dateObj = new Date(date)
    return dateObj instanceof Date && !isNaN(dateObj.getTime())
  }

  const handleImport = async () => {
    if (previewData.length === 0) {
      toast.error('Tidak ada data untuk diimport')
      return
    }

    setCurrentStep('importing')
    setIsLoading(true)
    setProgress(0)

    try {
      const response = await fetch(`${serverUrl}/patients/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          patients: previewData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import gagal')
      }

      setImportResults({
        total: previewData.length,
        success: result.imported || 0,
        errors: result.errors || 0
      })

      setCurrentStep('complete')
      toast.success(`Import berhasil! ${result.imported} pasien berhasil ditambahkan.`)
      
      if (onImportComplete) {
        onImportComplete()
      }

    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import gagal: ' + (error as Error).message)
      setCurrentStep('preview')
    } finally {
      setIsLoading(false)
      setProgress(100)
    }
  }

  const resetDialog = () => {
    setFile(null)
    setPreviewData([])
    setValidationErrors([])
    setImportResults(null)
    setCurrentStep('upload')
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    // Buat template Excel untuk download
    const templateData = [
      {
        'No': '1',
        'Nama': 'Contoh Pasien',
        'No RM': 'RM001',
        'Tanggal Lahir': '22/09/1990',
        'Jenis Kelamin': 'Laki-laki',
        'Alamat': 'Jl. Contoh No. 123',
        'Telepon': '081234567890',
        'Pekerjaan': 'Karyawan',
        'Status Pernikahan': 'Belum Menikah',
        'Agama': 'Islam',
        'Kewarganegaraan': 'Indonesia',
        'Kontak Darurat': 'Keluarga Contoh',
        'Telepon Darurat': '081234567891',
        'Asuransi': 'BPJS',
        'Nomor Asuransi': '1234567890',
        'Golongan Darah': 'A',
        'Tinggi Badan': '170',
        'Berat Badan': '65',
        'Riwayat Alergi': 'Tidak ada',
        'Riwayat Penyakit': 'Tidak ada',
        'Catatan': 'Catatan tambahan'
      },
      {
        'No': '2',
        'Nama': 'Contoh Pasien 2',
        'No RM': 'RM002',
        'Tanggal Lahir': '15/05/1985',
        'Jenis Kelamin': 'Perempuan',
        'Alamat': 'Jl. Contoh No. 456',
        'Telepon': '081234567891',
        'Pekerjaan': '',
        'Status Pernikahan': '',
        'Agama': '',
        'Kewarganegaraan': '',
        'Kontak Darurat': '',
        'Telepon Darurat': '',
        'Asuransi': '',
        'Nomor Asuransi': '',
        'Golongan Darah': '',
        'Tinggi Badan': '',
        'Berat Badan': '',
        'Riwayat Alergi': '',
        'Riwayat Penyakit': '',
        'Catatan': ''
      }
    ]

    // Convert to CSV for simple download
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(templateData[0]).join(",") + "\n"
      + templateData.map(row => Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "template_import_pasien.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Excel
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[100vw] h-[100vh] max-w-none max-h-none m-0 rounded-none overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Import Data Pasien dari Excel
          </DialogTitle>
          <DialogDescription>
            Upload file Excel (.xlsx, .xls) atau CSV untuk import data pasien secara bulk
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[
              { step: 'upload', label: 'Upload', icon: Upload },
              { step: 'preview', label: 'Preview', icon: FileSpreadsheet },
              { step: 'importing', label: 'Import', icon: Users },
              { step: 'complete', label: 'Selesai', icon: Check }
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep === step 
                    ? 'bg-green-600 text-white' 
                    : index < ['upload', 'preview', 'importing', 'complete'].indexOf(currentStep)
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep === step ? 'text-green-600 font-medium' : 'text-gray-500'
                }`}>
                  {label}
                </span>
                {index < 3 && (
                  <div className={`mx-4 h-0.5 w-8 ${
                    index < ['upload', 'preview', 'importing', 'complete'].indexOf(currentStep)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Upload Step */}
          {currentStep === 'upload' && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Pilih file Excel untuk diimport
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Format yang didukung: .xlsx, .xls, .csv (maksimal 1000 data)
                    </p>
                    <div className="space-y-2">
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Pilih File
                      </Button>
                      <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  
                  {file && (
                    <div className="text-sm text-gray-600">
                      File terpilih: <span className="font-medium">{file.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p>Memproses file...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {previewData.length} data valid
                      </Badge>
                      {validationErrors.length > 0 && (
                        <Badge variant="destructive">
                          {validationErrors.length} error
                        </Badge>
                      )}
                    </div>
                    <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                      Pilih File Lain
                    </Button>
                  </div>

                  {validationErrors.length > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium text-yellow-800">Ditemukan error pada data:</p>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {validationErrors.slice(0, 10).map((error, index) => (
                              <p key={index} className="text-sm text-yellow-700">
                                Baris {error.row}: {error.message} ({error.field})
                              </p>
                            ))}
                            {validationErrors.length > 10 && (
                              <p className="text-sm text-yellow-600">
                                ...dan {validationErrors.length - 10} error lainnya
                              </p>
                            )}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preview Data ({previewData.length} dari {previewData.length + validationErrors.filter(e => REQUIRED_FIELDS.includes(e.field)).length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">No</TableHead>
                              <TableHead>Nama</TableHead>
                              <TableHead>No RM</TableHead>
                              <TableHead>Tanggal Lahir</TableHead>
                              <TableHead>Jenis Kelamin</TableHead>
                              <TableHead>Telepon</TableHead>
                              <TableHead>Alamat</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.slice(0, 50).map((patient, index) => (
                              <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{patient.nama}</TableCell>
                                <TableCell>{patient.no_rm || '-'}</TableCell>
                                <TableCell>{patient.tanggal_lahir || '-'}</TableCell>
                                <TableCell>{patient.jenis_kelamin || '-'}</TableCell>
                                <TableCell>{patient.telepon || '-'}</TableCell>
                                <TableCell className="max-w-xs truncate">{patient.alamat || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {previewData.length > 50 && (
                          <p className="text-center text-sm text-gray-500 py-4">
                            ...dan {previewData.length - 50} data lainnya
                          </p>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Importing Step */}
          {currentStep === 'importing' && (
            <div className="text-center py-8 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <div>
                <p className="text-lg font-medium">Mengimport data pasien...</p>
                <p className="text-sm text-gray-500">Mohon tunggu, proses sedang berlangsung</p>
              </div>
              <Progress value={progress} className="w-64 mx-auto" />
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && importResults && (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Import Berhasil!</h3>
                  <p className="text-sm text-gray-500">Data pasien telah berhasil diimport ke sistem</p>
                </div>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{importResults.total}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
                    <p className="text-sm text-gray-500">Berhasil</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{importResults.errors}</p>
                    <p className="text-sm text-gray-500">Error</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {currentStep === 'complete' ? 'Tutup' : 'Batal'}
            </Button>
            <div className="space-x-2">
              {currentStep === 'complete' && (
                <Button onClick={resetDialog}>
                  Import Lagi
                </Button>
              )}
              {currentStep === 'preview' && (
                <Button 
                  onClick={handleImport}
                  disabled={previewData.length === 0 || isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Import {previewData.length} Pasien
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}