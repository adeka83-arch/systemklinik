// Field Trip Doctor Fees Table Generator
const generateFieldTripDoctorFeesTable = (data: any[]): string => {
  const totalFees = data.reduce((sum, item) => sum + (item.fee || 0), 0)
  const totalFieldTrips = data.reduce((sum, item) => sum + (item.fieldTripCount || 0), 0)
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #fef3c7;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">No</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Nama Dokter</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Spesialisasi</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Jumlah Field Trip</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Total Fee</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Rata-rata Fee</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #b45309;">${item.doctorName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.specialization}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${item.fieldTripCount}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #16a34a;">${formatCurrency(item.fee)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; color: #2563eb;">${formatCurrency(item.averageFee)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 2px solid #b45309;">
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #b45309; text-align: center;">
            TOTAL (${data.length} Dokter)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #b45309; background-color: #fef3c7; text-align: center;">
            ${totalFieldTrips}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #16a34a; background-color: #dcfce7; font-size: 14px;">
            ${formatCurrency(totalFees)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #2563eb; background-color: #dbeafe;">
            ${formatCurrency(data.length > 0 ? totalFees / data.length : 0)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Field Trip Doctor Fees Summary -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #b45309; border-radius: 8px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);">
      <h3 style="margin: 0 0 12px 0; color: #b45309; font-size: 16px; text-align: center; border-bottom: 1px solid #b45309; padding-bottom: 8px;">
        👩‍⚕️ RINGKASAN FEE DOKTER FIELD TRIP
      </h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 16px;">
        ${data.map(doctor => `
          <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #b45309; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; font-weight: bold; color: #b45309; margin-bottom: 8px;">${doctor.doctorName}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
              <div>
                <span style="color: #6b7280;">Spesialisasi:</span><br>
                <span style="font-weight: bold; color: #7c3aed;">${doctor.specialization}</span>
              </div>
              <div>
                <span style="color: #6b7280;">Field Trip:</span><br>
                <span style="font-weight: bold; color: #2563eb;">${doctor.fieldTripCount} Kegiatan</span>
              </div>
              <div style="grid-column: 1 / -1; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px;">
                <span style="color: #6b7280;">Total Fee:</span><br>
                <span style="font-weight: bold; font-size: 13px; color: #16a34a;">${formatCurrency(doctor.fee)}</span>
              </div>
              <div style="grid-column: 1 / -1; font-size: 10px; color: #6b7280;">
                Rata-rata per kegiatan: ${formatCurrency(doctor.averageFee)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- Grand Total -->
      <div style="padding: 16px; background: rgba(180, 83, 9, 0.1); border-radius: 8px; border: 2px dashed #b45309;">
        <div style="text-align: center;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">💰 TOTAL FEE DOKTER FIELD TRIP</div>
          <div style="font-size: 28px; font-weight: bold; color: #b45309;">${formatCurrency(totalFees)}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px; font-style: italic;">
            Dari ${totalFieldTrips} kegiatan field trip | Melibatkan ${data.length} dokter
          </div>
        </div>
      </div>
    </div>
  `
}

// Field Trip Employee Bonuses Table Generator
const generateFieldTripEmployeeBonusesTable = (data: any[]): string => {
  const totalBonuses = data.reduce((sum, item) => sum + (item.bonus || 0), 0)
  const totalFieldTrips = data.reduce((sum, item) => sum + (item.fieldTripCount || 0), 0)
  
  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #dcfce7;">
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">No</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Nama Karyawan</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Posisi</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Jumlah Field Trip</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Total Bonus</th>
          <th style="border: 1px solid #e5e7eb; padding: 8px; text-align: left;">Rata-rata Bonus</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => `
          <tr>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #15803d;">${item.employeeName}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px;">${item.position}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center;">${item.fieldTripCount}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; font-weight: bold; color: #16a34a;">${formatCurrency(item.bonus)}</td>
            <td style="border: 1px solid #e5e7eb; padding: 8px; color: #2563eb;">${formatCurrency(item.averageBonus)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="background-color: #f1f5f9; border-top: 2px solid #15803d;">
          <td colspan="3" style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #15803d; text-align: center;">
            TOTAL (${data.length} Karyawan)
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #15803d; background-color: #dcfce7; text-align: center;">
            ${totalFieldTrips}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #16a34a; background-color: #dcfce7; font-size: 14px;">
            ${formatCurrency(totalBonuses)}
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 12px; font-weight: bold; color: #2563eb; background-color: #dbeafe;">
            ${formatCurrency(data.length > 0 ? totalBonuses / data.length : 0)}
          </td>
        </tr>
      </tfoot>
    </table>
    
    <!-- Field Trip Employee Bonuses Summary -->
    <div style="margin: 20px 0; padding: 16px; border: 2px solid #15803d; border-radius: 8px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">
      <h3 style="margin: 0 0 12px 0; color: #15803d; font-size: 16px; text-align: center; border-bottom: 1px solid #15803d; padding-bottom: 8px;">
        💰 RINGKASAN BONUS KARYAWAN FIELD TRIP
      </h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 16px;">
        ${data.map(employee => `
          <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #15803d; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 14px; font-weight: bold; color: #15803d; margin-bottom: 8px;">${employee.employeeName}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
              <div>
                <span style="color: #6b7280;">Posisi:</span><br>
                <span style="font-weight: bold; color: #7c3aed;">${employee.position}</span>
              </div>
              <div>
                <span style="color: #6b7280;">Field Trip:</span><br>
                <span style="font-weight: bold; color: #2563eb;">${employee.fieldTripCount} Kegiatan</span>
              </div>
              <div style="grid-column: 1 / -1; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px;">
                <span style="color: #6b7280;">Total Bonus:</span><br>
                <span style="font-weight: bold; font-size: 13px; color: #16a34a;">${formatCurrency(employee.bonus)}</span>
              </div>
              <div style="grid-column: 1 / -1; font-size: 10px; color: #6b7280;">
                Rata-rata per kegiatan: ${formatCurrency(employee.averageBonus)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- Grand Total -->
      <div style="padding: 16px; background: rgba(21, 128, 61, 0.1); border-radius: 8px; border: 2px dashed #15803d;">
        <div style="text-align: center;">
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">💰 TOTAL BONUS KARYAWAN FIELD TRIP</div>
          <div style="font-size: 28px; font-weight: bold; color: #15803d;">${formatCurrency(totalBonuses)}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px; font-style: italic;">
            Dari ${totalFieldTrips} kegiatan field trip | Melibatkan ${data.length} karyawan
          </div>
        </div>
      </div>
    </div>
  `
}