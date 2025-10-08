import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { MapPin, Printer, Eye } from 'lucide-react'
import { formatCurrency } from '../utils/reports/helpers'
import { fetchFieldTripSales } from '../utils/reports/dataService'
import { filterFieldTripSalesData } from '../utils/reports/filters'
import type { FieldTripSaleReport, ReportFilters } from '../utils/reports/types'

interface FieldTripReportProps {
  accessToken: string
  filters: ReportFilters
  onPrint: (type: string) => void
}

export function FieldTripReportClean({ accessToken, filters, onPrint }: FieldTripReportProps) {
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
    } catch (error) {
      console.log('Error fetching field trip sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredFieldTripSalesData = filterFieldTripSalesData(fieldTripSalesData, filters)

  return (
    <Card className="border-pink-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-pink-800 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Laporan Penjualan Field Trip
          </CardTitle>
          <Button
            onClick={() => onPrint('field-trip-sales')}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-pink-50">
                <TableHead className="text-pink-700">No</TableHead>
                <TableHead className="text-pink-700">Tanggal</TableHead>
                <TableHead className="text-pink-700">Customer</TableHead>
                <TableHead className="text-pink-700">Produk</TableHead>
                <TableHead className="text-pink-700">Qty</TableHead>
                <TableHead className="text-pink-700">Tim Pendamping</TableHead>
                <TableHead className="text-pink-700">Total</TableHead>
                <TableHead className="text-pink-700">Final</TableHead>
                <TableHead className="text-pink-700">Status</TableHead>
                <TableHead className="text-pink-700">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFieldTripSalesData.map((sale, index) => (
                <TableRow key={sale.id}>
                  <TableCell className="text-center">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{new Date(sale.date).toLocaleDateString('id-ID')}</span>
                      <span className="text-xs text-gray-500">Event: {new Date(sale.date).toLocaleDateString('id-ID')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{sale.organization || sale.location}</span>
                      <span className="text-xs text-gray-500">{sale.participants || 0} peserta</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-pink-800">{sale.productName}</span>
                      <span className="text-xs text-gray-500">{sale.participants || 0} peserta</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{sale.quantity}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {(sale.doctorName || sale.employeeName) ? (
                        <>
                          {sale.doctorName && (
                            <div className="flex items-center gap-1">
                              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                🩺 2 dokter
                              </div>
                            </div>
                          )}
                          {sale.employeeName && (
                            <div className="flex items-center gap-1">
                              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                👥 2 karyawan
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">
                          Belum ada tim
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(sale.subtotal || sale.totalAmount)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
                      <span className="text-xs text-blue-600">Cash - Lunas</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                      Lunas
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredFieldTripSalesData.length === 0 && (
            <div className="text-center py-8 text-pink-600">
              {fieldTripSalesData.length === 0 
                ? 'Belum ada data penjualan field trip' 
                : 'Tidak ada data yang sesuai dengan filter'
              }
            </div>
          )}
        </div>

        {/* Field Trip Sales Summary - Enhanced */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredFieldTripSalesData.length}
              </div>
              <div className="text-sm text-blue-700">Total Transaksi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredFieldTripSalesData.reduce((total, sale) => total + (sale.totalAmount || 0), 0))}
              </div>
              <div className="text-sm text-green-700">Total Pendapatan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredFieldTripSalesData.reduce((total, sale) => total + (sale.participants || 0), 0)}
              </div>
              <div className="text-sm text-purple-700">Total Peserta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {new Set(filteredFieldTripSalesData.map(s => s.location)).size}
              </div>
              <div className="text-sm text-orange-700">Lokasi Field Trip</div>
            </div>
          </div>
        </div>



        <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
          <div className="flex items-center justify-between text-sm text-pink-700">
            <span>Total data ditampilkan: {filteredFieldTripSalesData.length} dari {fieldTripSalesData.length} record</span>
            <span>Total pendapatan field trip: {formatCurrency(filteredFieldTripSalesData.reduce((total, sale) => total + (sale.totalAmount || 0), 0))}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}