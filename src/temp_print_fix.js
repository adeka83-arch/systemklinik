// Fixed print content function - hanya bagian HTML yang perlu diperbaiki

// 1. Hapus section diagnosis umum
// 2. Pindahkan X-ray ke halaman terpisah dengan page-break
// 3. Tambahkan .page-break { page-break-before: always; } di CSS

// Contoh perubahan:
// Hapus bagian ini:
/*
  ${commonDiagnoses.length > 0 ? `
  <div class="section">
    <div class="section-title">Diagnosis Umum</div>
    <div class="diagnosis-list">
      ${commonDiagnoses.map(diagnosis => `
      <div class="list-item">${diagnosis}</div>
      `).join('')}
    </div>
  </div>
  ` : ''}
*/

// Dan pindahkan X-ray section ke page baru:
/*
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
*/