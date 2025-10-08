        {/* Laporan Tindakan */}
        <TabsContent value="treatments" className="space-y-4">
          <Card className="border-pink-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-pink-800 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Laporan Tindakan Medis
                </CardTitle>
                <Button
                  onClick={() => onPrint('treatments')}
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
                      <TableHead className="text-pink-700">Tanggal</TableHead>
                      <TableHead className="text-pink-700">Pasien</TableHead>
                      <TableHead className="text-pink-700">Tindakan</TableHead>
                      <TableHead className="text-pink-700">Dokter</TableHead>
                      <TableHead className="text-pink-700">Nominal</TableHead>
                      <TableHead className="text-pink-700">Fee Dokter</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTreatmentData.map((treatment) => (
                      <TableRow key={treatment.id}>
                        <TableCell>
                          {new Date(treatment.date).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-pink-800">{treatment.patientName}</TableCell>
                        <TableCell>{treatment.treatmentName}</TableCell>
                        <TableCell className="text-pink-600">{treatment.doctorName}</TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(treatment.nominal || treatment.amount || 0)}
                        </TableCell>
                        <TableCell className="text-blue-600">
                          {formatCurrency(treatment.calculatedFee || treatment.fee || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTreatmentData.length === 0 && (
                  <div className="text-center py-8 text-pink-600">
                    {treatmentData.length === 0 
                      ? 'Belum ada data tindakan' 
                      : 'Tidak ada data yang sesuai dengan filter'
                    }
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center justify-between text-sm text-pink-700">
                  <span>Total data ditampilkan: {filteredTreatmentData.length} dari {treatmentData.length} record</span>
                  <span>Total nominal: {formatCurrency(filteredTreatmentData.reduce((total, treatment) => total + (treatment.nominal || treatment.amount || 0), 0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>