const generateDoctorFeesTable = (data: DoctorFeeReport[], filters?: { doctorName?: string, groupByDoctor?: boolean }): string => {
  // Calculate doctor fee statistics grouped by doctor
  const doctorStats = {}
  let grandTotalFees = 0
  
  data.forEach(item => {
    const doctorName = item.doctor || 'Unknown'
    const treatmentFee = item.treatmentFee || 0
    const sittingFee = item.sittingFee || 0
    const finalFee = item.finalFee || 0
    
    if (!doctorStats[doctorName]) {
      doctorStats[doctorName] = {
        name: doctorName,
        totalTreatmentFee: 0,
        totalSittingFee: 0,
        totalFinalFee: 0,
        treatmentCount: 0,
        sessionsWithTreatments: 0,
        sessionsWithoutTreatments: 0
      }
    }
    
    doctorStats[doctorName].totalTreatmentFee += treatmentFee
    doctorStats[doctorName].totalSittingFee += sittingFee
    doctorStats[doctorName].totalFinalFee += finalFee
    doctorStats[doctorName].treatmentCount += 1
    
    if (item.hasTreatments) {
      doctorStats[doctorName].sessionsWithTreatments += 1
    } else {
      doctorStats[doctorName].sessionsWithoutTreatments += 1
    }
    
    grandTotalFees += finalFee
  })
  
  const doctors = Object.values(doctorStats)
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fce7f3;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Dokter</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Shift</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Tanggal</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Fee Tindakan</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Uang Duduk</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Fee Final</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.doctor}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.shift}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${new Date(item.date).toLocaleDateString('id-ID')}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatCurrency(item.treatmentFee)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${formatCurrency(item.sittingFee)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #16a34a;">${formatCurrency(item.finalFee)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">
              <span style="padding: 2px 8px; border-radius: 4px; background-color: ${item.hasTreatments ? '#dcfce7' : '#fef3c7'}; color: ${item.hasTreatments ? '#15803d' : '#b45309'};">
                ${item.hasTreatments ? 'Ada Tindakan' : 'Duduk Saja'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <!-- Doctor Fees Summary -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #7c3aed; border-radius: 8px; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);">
      <h3 style="margin: 0 0 12px 0; color: #7c3aed; font-size: 16px; text-align: center; border-bottom: 1px solid #7c3aed; padding-bottom: 8px;">
        👩‍⚕️ RINGKASAN FEE DOKTER PER INDIVIDU
      </h3>
      
      <!-- Per Doctor Breakdown -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 16px;">
        ${doctors.map(doctor => `
          <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #7c3aed; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; font-weight: bold; color: #7c3aed; margin-bottom: 8px;">${doctor.name}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
              <div>
                <span style="color: #6b7280;">Fee Tindakan:</span><br>
                <span style="font-weight: bold; color: #16a34a;">${formatCurrency(doctor.totalTreatmentFee)}</span>
              </div>
              <div>
                <span style="color: #6b7280;">Uang Duduk:</span><br>
                <span style="font-weight: bold; color: #2563eb;">${formatCurrency(doctor.totalSittingFee)}</span>
              </div>
              <div style="grid-column: 1 / -1; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px;">
                <span style="color: #6b7280;">Total Fee:</span><br>
                <span style="font-weight: bold; font-size: 13px; color: #7c3aed;">${formatCurrency(doctor.totalFinalFee)}</span>
              </div>
              <div style="grid-column: 1 / -1; font-size: 10px; color: #6b7280;">
                Sesi: ${doctor.treatmentCount} | Dengan tindakan: ${doctor.sessionsWithTreatments} | Duduk saja: ${doctor.sessionsWithoutTreatments}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- Grand Total -->
      <div style="padding: 16px; background: rgba(124, 58, 237, 0.1); border-radius: 8px; border: 2px dashed #7c3aed;">
        <div style="text-align: center;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">💰 TOTAL FEE SEMUA DOKTER</div>
          <div style="font-size: 28px; font-weight: bold; color: #7c3aed;">${formatCurrency(grandTotalFees)}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px; font-style: italic;">
            Dari ${data.length} sesi pelayanan | Melibatkan ${doctors.length} dokter
          </div>
        </div>
      </div>
    </div>
    
    ${generateDoctorSignatureSection(data, filters)}
  `
}