// Generate Print Content Function - FIXED VERSION
const generatePrintContent = () => {
  if (!patientSummary) return ''

  const { patient, medicalRecords, totalVisits, lastVisit, treatingDoctors } = patientSummary
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rekapan Rekam Medis - ${patient.name}</title>
  <style>
    @page { 
      size: A5; 
      margin: 10mm; 
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.3;
      color: #333;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 1.5px solid #e91e63;
      padding-bottom: 8px;
    }
    
    .clinic-name {
      font-size: 16px;
      font-weight: bold;
      color: #e91e63;
      margin-bottom: 4px;
    }
    
    .report-title {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 4px;
    }
    
    .print-date {
      font-size: 10px;
      color: #666;
    }
    
    .patient-info {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 12px;
      border-left: 3px solid #e91e63;
    }
    
    .patient-info h3 {
      color: #e91e63;
      font-size: 12px;
      margin-bottom: 8px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      font-size: 10px;
    }
    
    .info-item {
      display: flex;
    }
    
    .info-label {
      font-weight: bold;
      min-width: 70px;
      color: #555;
    }
    
    .info-value {
      color: #333;
    }
    
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .stat-card {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 8px;
      text-align: center;
    }
    
    .stat-number {
      font-size: 18px;
      font-weight: bold;
      color: #e91e63;
      margin-bottom: 3px;
    }
    
    .stat-label {
      color: #666;
      font-size: 9px;
    }
    
    .section {
      margin-bottom: 12px;
    }
    
    .section-title {
      background: #e91e63;
      color: white;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .records-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 9px;
    }
    
    .records-table th,
    .records-table td {
      border: 1px solid #ddd;
      padding: 5px 6px;
      text-align: left;
      vertical-align: top;
    }
    
    .records-table th {
      background: #f1f8e9;
      font-weight: bold;
      color: #333;
      font-size: 9px;
    }
    
    .records-table tr:nth-child(even) {
      background: #fafafa;
    }
    
    .date-col { width: 15%; }
    .complaint-col { width: 25%; }
    .diagnosis-col { width: 20%; }
    .treatment-col { width: 25%; }
    .doctor-col { width: 15%; }
    
    .doctor-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 4px;
    }
    
    .list-item {
      background: #f8f9fa;
      padding: 6px;
      border-radius: 3px;
      border-left: 2px solid #e91e63;
      font-size: 9px;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    .xray-section {
      margin-top: 10px;
    }
    
    .xray-gallery {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 10px 0;
    }
    
    .xray-item {
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
      text-align: center;
    }
    
    .xray-image {
      width: 100%;
      max-width: 160px;
      height: auto;
      max-height: 120px;
      object-fit: contain;
      border: 1px solid #eee;
      border-radius: 3px;
      margin-bottom: 6px;
    }
    
    .xray-type {
      background: #e91e63;
      color: white;
      padding: 3px 6px;
      border-radius: 3px;
      font-size: 8px;
      display: inline-block;
      margin-bottom: 4px;
    }
    
    .xray-filename {
      font-size: 8px;
      color: #666;
      margin-bottom: 3px;
      word-break: break-all;
    }
    
    .xray-description {
      font-size: 8px;
      color: #333;
    }
    
    .blank-form {
      margin-top: 20px;
    }
    
    .blank-form-title {
      background: #e91e63;
      color: white;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .form-field {
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    
    .form-label {
      font-weight: bold;
      min-width: 90px;
      font-size: 11px;
      color: #333;
    }
    
    .form-line {
      flex: 1;
      border-bottom: 1px solid #333;
      height: 24px;
      margin-left: 10px;
    }
    
    .form-textarea {
      width: 100%;
      min-height: 70px;
      border: 1px solid #333;
      margin-top: 6px;
    }
    
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-top: 25px;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 1px solid #333;
      height: 45px;
      margin-bottom: 6px;
    }
    
    .signature-label {
      font-size: 10px;
      color: #333;
    }
    
    .footer {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="clinic-name">Falasifah Dental Clinic</div>
    <div class="report-title">Rekapan Rekam Medis</div>
    <div class="print-date">Dicetak pada: ${currentDate}</div>
  </div>

  <div class="patient-info">
    <h3>Informasi Pasien</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Nama:</span>
        <span class="info-value">${patient.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">No. RM:</span>
        <span class="info-value">${patient.medicalRecordNumber}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Telepon:</span>
        <span class="info-value">${patient.phone}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Tgl Lahir:</span>
        <span class="info-value">${new Date(patient.birthDate).toLocaleDateString('id-ID')}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Gender:</span>
        <span class="info-value">${patient.gender === 'male' ? 'L' : 'P'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Alamat:</span>
        <span class="info-value">${patient.address}</span>
      </div>
    </div>
  </div>

  <div class="summary-stats">
    <div class="stat-card">
      <div class="stat-number">${totalVisits}</div>
      <div class="stat-label">Kunjungan</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${medicalRecords.length}</div>
      <div class="stat-label">Rekam Medis</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${treatingDoctors.length}</div>
      <div class="stat-label">Dokter</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${xrayImages.length}</div>
      <div class="stat-label">X-Ray</div>
    </div>
  </div>

  ${medicalRecords.length > 0 ? `
  <div class="section">
    <div class="section-title">Riwayat Rekam Medis</div>
    <table class="records-table">
      <thead>
        <tr>
          <th class="date-col">Tanggal</th>
          <th class="complaint-col">Keluhan</th>
          <th class="diagnosis-col">Diagnosis</th>
          <th class="treatment-col">Perawatan</th>
          <th class="doctor-col">Dokter</th>
        </tr>
      </thead>
      <tbody>
        ${medicalRecords.slice(0, 8).map(record => `
        <tr>
          <td>${new Date(record.visitDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
          <td>${(record.complaint || '-').length > 35 ? (record.complaint || '-').substring(0, 35) + '...' : (record.complaint || '-')}</td>
          <td>${(record.diagnosis || '-').length > 30 ? (record.diagnosis || '-').substring(0, 30) + '...' : (record.diagnosis || '-')}</td>
          <td>${(record.treatment || '-').length > 35 ? (record.treatment || '-').substring(0, 35) + '...' : (record.treatment || '-')}</td>
          <td>${(record.doctorName || '-').length > 18 ? (record.doctorName || '-').substring(0, 18) + '...' : (record.doctorName || '-')}</td>
        </tr>
        `).join('')}
        ${medicalRecords.length > 8 ? `
        <tr>
          <td colspan="5" style="text-align: center; font-style: italic; color: #666;">
            ... dan ${medicalRecords.length - 8} kunjungan lainnya
          </td>
        </tr>
        ` : ''}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${treatingDoctors.length > 0 ? `
  <div class="section">
    <div class="section-title">Dokter Pemeriksa</div>
    <div class="doctor-list">
      ${treatingDoctors.map(doctor => `
      <div class="list-item">${doctor}</div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- X-Ray di halaman terpisah -->
  ${xrayImages.length > 0 ? `
  <div class="page-break">
    <div class="section xray-section">
      <div class="section-title">Gambar X-Ray & Radiografi</div>
      <div class="xray-gallery">
        ${xrayImages.map(image => `
        <div class="xray-item">
          <div class="xray-type">${image.type.toUpperCase()}</div>
          <img src="${image.fileUrl}" alt="${image.fileName}" class="xray-image" />
          <div class="xray-filename">${image.fileName}</div>
          <div class="xray-description">${image.description ? (image.description.length > 50 ? image.description.substring(0, 50) + '...' : image.description) : 'Tanpa deskripsi'}</div>
        </div>
        `).join('')}
      </div>
    </div>
  </div>
  ` : ''}

  <!-- Halaman Form Manual -->
  <div class="page-break">
    <div class="blank-form">
      <div class="blank-form-title">Form Rekam Medis - Kunjungan Berikutnya</div>
      
      <div class="patient-info">
        <h3>Data Pasien</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Nama:</span>
            <span class="info-value">${patient.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">No. RM:</span>
            <span class="info-value">${patient.medicalRecordNumber}</span>
          </div>
        </div>
      </div>

      <div class="form-field">
        <span class="form-label">Tanggal:</span>
        <div class="form-line"></div>
        <span class="form-label" style="margin-left: 20px;">Dokter:</span>
        <div class="form-line"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Keluhan:</span>
        <div class="form-line"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Pemeriksaan:</span>
        <div class="form-textarea"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Diagnosis:</span>
        <div class="form-line"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Perawatan:</span>
        <div class="form-textarea"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Resep:</span>
        <div class="form-textarea"></div>
      </div>

      <div class="form-field">
        <span class="form-label">Catatan:</span>
        <div class="form-line"></div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Tanda Tangan Dokter</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Tanggal & Waktu</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>Falasifah Dental Clinic - Sistem Manajemen Rekam Medis</div>
    <div>Dicetak pada: ${currentDate}</div>
  </div>
</body>
</html>`

  return printHTML
}