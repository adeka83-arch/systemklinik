import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { DollarSign, Printer, Users, Calculator } from 'lucide-react'
import { formatCurrency } from '../utils/reports/helpers'
import { fetchFieldTripSales } from '../utils/reports/dataService'
import { filterFieldTripSalesData } from '../utils/reports/filters'
import type { FieldTripSaleReport, ReportFilters } from '../utils/reports/types'

interface FieldTripBonusReportProps {
  accessToken: string
  filters: ReportFilters
  onPrint: (type: string) => void
}

interface DoctorFeeDetail {
  doctorName: string
  specialization: string
  fee: number
  fieldTripCount: number
}

interface EmployeeBonusDetail {
  employeeName: string
  position: string
  bonus: number
  fieldTripCount: number
}

export function FieldTripBonusReport({ accessToken, filters, onPrint }: FieldTripBonusReportProps) {
  const [fieldTripSalesData, setFieldTripSalesData] = useState<FieldTripSaleReport[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const fieldTripSales = await fetchFieldTripSales(accessToken)
      setFieldTripSalesData(fieldTripSales)
      console.log('=== FIELD TRIP BONUS REPORT DEBUG ===')
      console.log('Field trip data for bonus report:', fieldTripSales)
      console.log('Number of records:', fieldTripSales?.length || 0)
      if (fieldTripSales && fieldTripSales.length > 0) {
        console.log('Sample field trip sale:', fieldTripSales[0])
        console.log('Sample selectedDoctors:', fieldTripSales[0]?.selectedDoctors)
        console.log('Sample selectedEmployees:', fieldTripSales[0]?.selectedEmployees)
      }
      console.log('=== END DEBUG ===')
    } catch (error) {
      console.log('Error fetching field trip sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFieldTripSalesData = filterFieldTripSalesData(fieldTripSalesData, filters)
  
  console.log('=== FILTER RESULT DEBUG ===')
  console.log('Original data length:', fieldTripSalesData.length)
  console.log('Filtered data length:', filteredFieldTripSalesData.length)
  console.log('Current filters:', filters)
  console.log('=== END FILTER DEBUG ===')

  // Calculate doctor fee details
  const calculateDoctorFees = (): DoctorFeeDetail[] => {
    const doctorFees: { [key: string]: DoctorFeeDetail } = {}
    
    console.log('=== CALCULATING DOCTOR FEES ===')
    console.log('Total filtered field trip sales:', filteredFieldTripSalesData.length)
    
    filteredFieldTripSalesData.forEach((sale, index) => {
      console.log(`Processing sale ${index + 1}:`, sale.id)
      console.log('  selectedDoctors:', sale.selectedDoctors)
      
      if (sale.selectedDoctors && Array.isArray(sale.selectedDoctors)) {
        sale.selectedDoctors.forEach((doctor, doctorIndex) => {
          console.log(`  Doctor ${doctorIndex + 1}:`, doctor)
          const key = doctor.doctorId || doctor.doctorName
          if (doctorFees[key]) {
            doctorFees[key].fee += doctor.fee || 0
            doctorFees[key].fieldTripCount += 1
          } else {
            doctorFees[key] = {
              doctorName: doctor.doctorName || 'Unknown Doctor',
              specialization: doctor.specialization || 'GP',
              fee: doctor.fee || 0,
              fieldTripCount: 1
            }
          }
        })
      } else {
        console.log('  No selectedDoctors found or not array')
      }
    })
    
    const result = Object.values(doctorFees).sort((a, b) => b.fee - a.fee)
    console.log('Final doctor fees result:', result)
    console.log('=== END CALCULATING DOCTOR FEES ===')
    
    return result
  }

  // Calculate employee bonus details
  const calculateEmployeeBonuses = (): EmployeeBonusDetail[] => {
    const employeeBonuses: { [key: string]: EmployeeBonusDetail } = {}
    
    console.log('=== CALCULATING EMPLOYEE BONUSES ===')
    console.log('Total filtered field trip sales:', filteredFieldTripSalesData.length)
    
    filteredFieldTripSalesData.forEach((sale, index) => {
      console.log(`Processing sale ${index + 1}:`, sale.id)
      console.log('  selectedEmployees:', sale.selectedEmployees)
      
      if (sale.selectedEmployees && Array.isArray(sale.selectedEmployees)) {
        sale.selectedEmployees.forEach((employee, employeeIndex) => {
          console.log(`  Employee ${employeeIndex + 1}:`, employee)
          const key = employee.employeeId || employee.employeeName
          if (employeeBonuses[key]) {
            employeeBonuses[key].bonus += employee.bonus || 0
            employeeBonuses[key].fieldTripCount += 1
          } else {
            employeeBonuses[key] = {
              employeeName: employee.employeeName || 'Unknown Employee',
              position: employee.position || 'Staff',
              bonus: employee.bonus || 0,
              fieldTripCount: 1
            }
          }
        })
      } else {
        console.log('  No selectedEmployees found or not array')
      }
    })
    
    const result = Object.values(employeeBonuses).sort((a, b) => b.bonus - a.bonus)
    console.log('Final employee bonuses result:', result)
    console.log('=== END CALCULATING EMPLOYEE BONUSES ===')
    
    return result
  }

  const doctorFeeDetails = calculateDoctorFees()
  const employeeBonusDetails = calculateEmployeeBonuses()

  const totalDoctorFees = doctorFeeDetails.reduce((total, doctor) => total + doctor.fee, 0)
  const totalEmployeeBonuses = employeeBonusDetails.reduce((total, employee) => total + employee.bonus, 0)
  const grandTotal = totalDoctorFees + totalEmployeeBonuses

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        <span className="ml-2 text-pink-600">Memuat data field trip...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">
            <p><strong>Debug Info:</strong></p>
            <p>Total Field Trip Sales: {fieldTripSalesData.length}</p>
            <p>Filtered Field Trip Sales: {filteredFieldTripSalesData.length}</p>
            <p>Doctor Fee Details: {doctorFeeDetails.length}</p>
            <p>Employee Bonus Details: {employeeBonusDetails.length}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm">Total Fee Dokter</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {formatCurrency(totalDoctorFees)}
                </p>
                <p className="text-xs text-gray-500">{doctorFeeDetails.length} dokter</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm">Total Bonus Karyawan</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(totalEmployeeBonuses)}
                </p>
                <p className="text-xs text-gray-500">{employeeBonusDetails.length} karyawan</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm">Total Fee & Bonus</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(grandTotal)}
                </p>
                <p className="text-xs text-gray-500">{filteredFieldTripSalesData.length} field trip</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Fees Detail */}
      <Card className="border-yellow-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Rincian Fee Dokter Field Trip
            </CardTitle>
            <Button
              onClick={() => onPrint('field-trip-doctor-fees')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Fee Dokter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-yellow-50">
                  <TableHead className="text-yellow-700">No</TableHead>
                  <TableHead className="text-yellow-700">Nama Dokter</TableHead>
                  <TableHead className="text-yellow-700">Spesialisasi</TableHead>
                  <TableHead className="text-yellow-700">Jumlah Field Trip</TableHead>
                  <TableHead className="text-yellow-700">Total Fee</TableHead>
                  <TableHead className="text-yellow-700">Rata-rata Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctorFeeDetails.map((doctor, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium text-yellow-800">{doctor.doctorName}</TableCell>
                    <TableCell>{doctor.specialization}</TableCell>
                    <TableCell className="text-center">{doctor.fieldTripCount}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(doctor.fee)}</TableCell>
                    <TableCell>{formatCurrency(doctor.fee / doctor.fieldTripCount)}</TableCell>
                  </TableRow>
                ))}
                {doctorFeeDetails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-yellow-600">
                      Belum ada data fee dokter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {doctorFeeDetails.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between text-sm text-yellow-700">
                <span>Total {doctorFeeDetails.length} dokter</span>
                <span className="font-medium">Total Fee: {formatCurrency(totalDoctorFees)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Bonuses Detail */}
      <Card className="border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Rincian Bonus Karyawan Field Trip
            </CardTitle>
            <Button
              onClick={() => onPrint('field-trip-employee-bonuses')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Bonus Karyawan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="text-green-700">No</TableHead>
                  <TableHead className="text-green-700">Nama Karyawan</TableHead>
                  <TableHead className="text-green-700">Posisi</TableHead>
                  <TableHead className="text-green-700">Jumlah Field Trip</TableHead>
                  <TableHead className="text-green-700">Total Bonus</TableHead>
                  <TableHead className="text-green-700">Rata-rata Bonus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeBonusDetails.map((employee, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium text-green-800">{employee.employeeName}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell className="text-center">{employee.fieldTripCount}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(employee.bonus)}</TableCell>
                    <TableCell>{formatCurrency(employee.bonus / employee.fieldTripCount)}</TableCell>
                  </TableRow>
                ))}
                {employeeBonusDetails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-green-600">
                      Belum ada data bonus karyawan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {employeeBonusDetails.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between text-sm text-green-700">
                <span>Total {employeeBonusDetails.length} karyawan</span>
                <span className="font-medium">Total Bonus: {formatCurrency(totalEmployeeBonuses)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Trip Activity Summary */}
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Ringkasan Aktivitas Field Trip
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredFieldTripSalesData.length}
                </div>
                <div className="text-sm text-blue-700">Total Field Trip</div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredFieldTripSalesData.reduce((total, sale) => total + (sale.participants || 0), 0)}
                </div>
                <div className="text-sm text-purple-700">Total Peserta</div>
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(filteredFieldTripSalesData.reduce((total, sale) => total + (sale.totalAmount || 0), 0))}
                </div>
                <div className="text-sm text-orange-700">Total Pendapatan</div>
              </div>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(grandTotal)}
                </div>
                <div className="text-sm text-red-700">Total Pengeluaran Fee & Bonus</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}