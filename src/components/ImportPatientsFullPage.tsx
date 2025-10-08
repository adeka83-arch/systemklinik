import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner@2.0.3'
import { Upload, FileSpreadsheet, Check, X, AlertTriangle, Users, Download, ArrowLeft } from 'lucide-react'
import { serverUrl } from '../utils/supabase/client'

interface PatientData {
  no?: number
  nama: string
  no_rm?: string
  tanggal_lahir?: string
  tanggal_mendaftar?: string
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

interface ImportPatientsFullPageProps {
  accessToken: string
  onImportComplete?: () => void
  onClose?: () => void
}

// Column mapping untuk berbagai format Excel yang mungkin
const COLUMN_MAPPING = {
  'no': ['no', 'nomor', 'number', '#'],
  'nama': ['nama', 'name', 'nama pasien', 'patient name', 'nama lengkap', 'full name'],
  'tanggal_lahir': ['tanggal_lahir', 'tanggal lahir', 'tgl lahir', 'date of birth', 'dob', 'birth date', 'lahir', 'tgl_lahir'],
  'tanggal_mendaftar': ['tanggal_mendaftar', 'tanggal mendaftar', 'tgl mendaftar', 'registration date', 'reg date', 'mendaftar', 'tgl_mendaftar', 'tanggal daftar'],
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

export function ImportPatientsFullPage({ accessToken, onImportComplete, onClose }: ImportPatientsFullPageProps) {
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
    const XLSX = await import('xlsx')
    
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
          
          if (jsonData.length === 0) {
            throw new Error('File Excel kosong')
          }

          const mappedData = mapExcelData(jsonData)
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

    const headers = Object.keys(rawData[0]).map(h => h.toLowerCase().trim())
    const fieldMapping: { [key: string]: string } = {}
    
    Object.entries(COLUMN_MAPPING).forEach(([field, possibleNames]) => {
      const matchedHeader = headers.find(header => 
        possibleNames.some(name => 
          header.includes(name.toLowerCase()) || name.toLowerCase().includes(header)
        )
      )
      if (matchedHeader) {
        const originalKey = Object.keys(rawData[0]).find(k => k.toLowerCase().trim() === matchedHeader)
        if (originalKey) {
          fieldMapping[field] = originalKey
        }
      }
    })

    return rawData.map((row) => {
      const patient: PatientData = { nama: '' }

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
            case 'tanggal_mendaftar':
              if (value instanceof Date) {
                patient[field] = value.toISOString().split('T')[0]
              } else if (typeof value === 'string' || typeof value === 'number') {
                const parsedDate = parseDate(value)
                if (parsedDate) {
                  patient[field] = parsedDate
                }
              }
              break
            case 'jenis_kelamin':
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
              (patient as any)[field] = value.toString().trim()
              break
          }
        }
      })

      if (!patient.nama) {
        const firstTextValue = Object.values(row).find(val => 
          val && typeof val === 'string' && val.trim().length > 2
        )
        if (firstTextValue) {
          patient.nama = firstTextValue.toString().trim()
        }
      }

      // Auto-generate tanggal mendaftar jika tidak ada dalam format DD/MM/YYYY
      if (!patient.tanggal_mendaftar) {
        const today = new Date()
        const day = today.getDate().toString().padStart(2, '0')
        const month = (today.getMonth() + 1).toString().padStart(2, '0')
        const year = today.getFullYear()
        patient.tanggal_mendaftar = `${day}/${month}/${year}`
      }

      return patient
    }).filter(patient => patient.nama && patient.nama.length > 0)
  }

  // Helper function to convert DD/MM/YYYY to YYYY-MM-DD for database storage
  const convertToDBFormat = (dateStr: string): string | undefined => {
    if (!dateStr) return undefined
    
    const ddmmyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const match = dateStr.match(ddmmyyRegex)
    
    if (match) {
      const day = match[1].padStart(2, '0')
      const month = match[2].padStart(2, '0')
      const year = match[3]
      return `${year}-${month}-${day}`
    }
    
    return dateStr // Return as-is if not in DD/MM/YYYY format
  }

  const parseDate = (dateStr: string | number): string | undefined => {
    if (!dateStr) return undefined

    // Handle Excel serial date numbers
    if (typeof dateStr === 'number') {
      // Excel date serial number (days since 1900-01-01)
      const excelEpoch = new Date(1900, 0, 1)
      const date = new Date(excelEpoch.getTime() + (dateStr - 1) * 24 * 60 * 60 * 1000)
      if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2030) {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${day}/${month}/${year}` // Format Indonesia DD/MM/YYYY
      }
    }

    // Convert to string and clean up
    const cleanStr = dateStr.toString().trim()
    if (!cleanStr || cleanStr.length < 6) return undefined

    // Handle various date formats
    const formats = [
      // DD/MM/YYYY or DD-MM-YYYY (already in correct format)
      /^(\d{1,2})[\\/\-\.](\d{1,2})[\\/\-\.](\d{4})$/,
      // DD/MM/YY or DD-MM-YY
      /^(\d{1,2})[\\/\-\.](\d{1,2})[\\/\-\.](\d{2})$/,
      // YYYY-MM-DD or YYYY/MM/DD (need to convert)
      /^(\d{4})[\\/\-\.](\d{1,2})[\\/\-\.](\d{1,2})$/,
      // MM/DD/YYYY (US format - need to swap)
      /^(\d{1,2})[\\/\-\.](\d{1,2})[\\/\-\.](\d{4})$/,
      // DDMMYYYY
      /^(\d{2})(\d{2})(\d{4})$/,
      // YYYYMMDD
      /^(\d{4})(\d{2})(\d{2})$/
    ]

    for (let i = 0; i < formats.length; i++) {
      const format = formats[i]
      const match = cleanStr.match(format)
      if (match) {
        let day, month, year
        
        if (i === 2) { // YYYY-MM-DD format
          year = parseInt(match[1])
          month = parseInt(match[2])
          day = parseInt(match[3])
        } else if (i === 5) { // YYYYMMDD format
          year = parseInt(match[1])
          month = parseInt(match[2])
          day = parseInt(match[3])
        } else if (i === 4) { // DDMMYYYY format
          day = parseInt(match[1])
          month = parseInt(match[2])
          year = parseInt(match[3])
        } else { // DD/MM/YYYY or DD/MM/YY format
          day = parseInt(match[1])
          month = parseInt(match[2])
          year = parseInt(match[3])
          
          // Handle 2-digit years
          if (year < 100) {
            year = year < 50 ? 2000 + year : 1900 + year
          }
        }

        // Validate date components
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2030) {
          // Additional validation for days in month
          const daysInMonth = new Date(year, month, 0).getDate()
          if (day <= daysInMonth) {
            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}` // Format Indonesia DD/MM/YYYY
          }
        }
      }
    }

    // Try parsing as JavaScript Date
    try {
      const date = new Date(cleanStr)
      if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2030) {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${day}/${month}/${year}` // Format Indonesia DD/MM/YYYY
      }
    } catch (error) {
      // Continue to next parsing method
    }

    return undefined
  }

  const validateData = (data: PatientData[]): { validData: PatientData[], errors: ValidationError[] } => {
    const errors: ValidationError[] = []
    const validData: PatientData[] = []

    data.forEach((patient, index) => {
      const rowNumber = index + 1
      
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

      if (patient.telepon && !isValidPhone(patient.telepon)) {
        errors.push({
          row: rowNumber,
          field: 'telepon',
          message: 'Format telepon tidak valid',
          value: patient.telepon
        })
      }

      if (patient.tanggal_lahir && !isValidDate(patient.tanggal_lahir)) {
        errors.push({
          row: rowNumber,
          field: 'tanggal_lahir',
          message: 'Format tanggal lahir tidak valid',
          value: patient.tanggal_lahir
        })
      }

      const rowErrors = errors.filter(e => e.row === rowNumber)
      const hasCriticalError = rowErrors.some(e => REQUIRED_FIELDS.includes(e.field))
      
      if (!hasCriticalError) {
        validData.push(patient)
      }
    })

    return { validData, errors }
  }

  const isValidPhone = (phone: string): boolean => {
    return /^(?:\+62|62|0)[\d\-\s]{8,15}$/.test(phone.replace(/\s/g, ''))
  }

  const isValidDate = (date: string): boolean => {
    // Accept both DD/MM/YYYY and YYYY-MM-DD formats
    const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const yyyymmddRegex = /^\d{4}-\d{2}-\d{2}$/
    if (ddmmyyyyRegex.test(date)) {
      const match = date.match(ddmmyyyyRegex)
      if (match) {
        const day = parseInt(match[1])
        const month = parseInt(match[2])
        const year = parseInt(match[3])
        
        // Validate date components
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2030) {
          const daysInMonth = new Date(year, month, 0).getDate()
          return day <= daysInMonth
        }
      }
      return false
    }
    
    if (yyyymmddRegex.test(date)) {
      const dateObj = new Date(date)
      return dateObj instanceof Date && !isNaN(dateObj.getTime())
    }
    
    return false
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
      // Convert date formats to database format (YYYY-MM-DD) before sending
      const patientsForDB = previewData.map(patient => ({
        ...patient,
        tanggal_lahir: patient.tanggal_lahir ? convertToDBFormat(patient.tanggal_lahir) : undefined,
        tanggal_mendaftar: patient.tanggal_mendaftar ? convertToDBFormat(patient.tanggal_mendaftar) : undefined
      }))
      
      const response = await fetch(`${serverUrl}/patients/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          patients: patientsForDB
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
    const templateData = [
      {
        'No': '1',
        'Nama': 'Contoh Pasien',
        'Tanggal Lahir': '01/01/1990',
        'Tanggal Mendaftar': '15/12/2024',
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
      }
    ]

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(templateData[0]).join(",") + "\n"
      + templateData.map(row => Object.values(row).join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "template_import_pasien.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-green-800 flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6" />
                Import Data Pasien dari Excel
              </h1>
              <p className="text-green-600 text-sm">
                Upload file Excel (.xlsx, .xls) atau CSV untuk import data pasien secara bulk. No RM akan di-generate otomatis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[
              { step: 'upload', label: 'Upload File', icon: Upload },
              { step: 'preview', label: 'Preview Data', icon: FileSpreadsheet },
              { step: 'importing', label: 'Import Data', icon: Users },
              { step: 'complete', label: 'Selesai', icon: Check }
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  currentStep === step 
                    ? 'bg-green-600 text-white border-green-600' 
                    : index < ['upload', 'preview', 'importing', 'complete'].indexOf(currentStep)
                      ? 'bg-green-100 text-green-600 border-green-600'
                      : 'bg-gray-100 text-gray-400 border-gray-300'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3 mr-8">
                  <p className={`text-sm font-medium ${
                    currentStep === step ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {label}
                  </p>
                </div>
                {index < 3 && (
                  <div className={`mr-8 h-0.5 w-16 ${
                    index < ['upload', 'preview', 'importing', 'complete'].indexOf(currentStep)
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {currentStep === 'upload' && (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-12 bg-green-50">
                    <Upload className="h-16 w-16 text-green-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Pilih file Excel untuk diimport
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Format yang didukung: .xlsx, .xls, .csv (maksimal 1000 data)<br/>
                      <strong>Catatan:</strong> No RM akan di-generate otomatis, tidak perlu dimasukkan dalam file Excel
                    </p>
                    <div className="space-y-4">
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Pilih File
                      </Button>
                      <div>
                        <Button variant="outline" onClick={downloadTemplate} className="ml-4">
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
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
                    <div className="text-center p-4 bg-green-100 rounded-lg">
                      <p className="text-green-800">
                        File terpilih: <span className="font-semibold">{file.name}</span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'preview' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-6"></div>
                  <p className="text-lg">Memproses file...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-green-100 text-green-800 text-base px-4 py-2">
                        {previewData.length} data valid
                      </Badge>
                      {validationErrors.length > 0 && (
                        <Badge variant="destructive" className="text-base px-4 py-2">
                          {validationErrors.length} error
                        </Badge>
                      )}
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                        Pilih File Lain
                      </Button>
                      <Button 
                        onClick={handleImport}
                        disabled={previewData.length === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Import {previewData.length} Data
                      </Button>
                    </div>
                  </div>

                  {validationErrors.length > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium text-yellow-800">Ditemukan error pada data:</p>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {validationErrors.slice(0, 20).map((error, index) => (
                              <p key={index} className="text-sm text-yellow-700">
                                Baris {error.row}: {error.message} ({error.field})
                              </p>
                            ))}
                            {validationErrors.length > 20 && (
                              <p className="text-sm text-yellow-600">
                                ...dan {validationErrors.length - 20} error lainnya
                              </p>
                            )}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">
                        Preview Data ({previewData.length} pasien)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto max-h-96">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-green-50">
                                <TableHead className="w-16">No</TableHead>
                                <TableHead className="min-w-[200px]">Nama</TableHead>
                                <TableHead className="min-w-[120px]">Tanggal Lahir</TableHead>
                                <TableHead className="min-w-[130px]">Tanggal Mendaftar</TableHead>
                                <TableHead className="min-w-[120px]">Jenis Kelamin</TableHead>
                                <TableHead className="min-w-[140px]">Telepon</TableHead>
                                <TableHead className="min-w-[200px]">Alamat</TableHead>
                                <TableHead className="min-w-[120px]">Pekerjaan</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {previewData.slice(0, 100).map((patient, index) => (
                                <TableRow key={index} className="hover:bg-green-50">
                                  <TableCell className="text-center">{index + 1}</TableCell>
                                  <TableCell className="font-medium">{patient.nama}</TableCell>
                                  <TableCell>{patient.tanggal_lahir || '-'}</TableCell>
                                  <TableCell>{patient.tanggal_mendaftar || '-'}</TableCell>
                                  <TableCell>{patient.jenis_kelamin || '-'}</TableCell>
                                  <TableCell>{patient.telepon || '-'}</TableCell>
                                  <TableCell className="max-w-xs truncate">{patient.alamat || '-'}</TableCell>
                                  <TableCell>{patient.pekerjaan || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {previewData.length > 100 && (
                          <div className="text-center py-4 bg-gray-50 border-t">
                            <p className="text-sm text-gray-500">
                              Menampilkan 100 dari {previewData.length} data. Semua data akan diimport.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {currentStep === 'importing' && (
            <div className="text-center py-16 space-y-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Mengimport data pasien...</h3>
                <p className="text-gray-500">Mohon tunggu, proses sedang berlangsung</p>
              </div>
              <Progress value={progress} className="w-96 mx-auto h-3" />
            </div>
          )}

          {currentStep === 'complete' && importResults && (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Import Berhasil!</h3>
                  <p className="text-gray-500">Data pasien telah berhasil diimport ke sistem</p>
                </div>
                <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{importResults.total}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
                    <p className="text-sm text-gray-500">Berhasil</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{importResults.errors}</p>
                    <p className="text-sm text-gray-500">Error</p>
                  </div>
                </div>
                <div className="space-x-4">
                  <Button 
                    onClick={onClose}
                    className="bg-green-600 hover:bg-green-700 px-8"
                  >
                    Selesai
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetDialog}
                  >
                    Import Lagi
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}