// Fixed generatePrintContent function - hanya mengganti xrayImages dengan currentXrayImages

// Perubahan yang diperlukan:
// 1. Sudah ditambahkan: const currentXrayImages = xrayImages || []
// 2. Sudah diubah: ${currentXrayImages.length} di stat-card
// 3. Perlu diubah: ${xrayImages.length > 0 ? menjadi ${currentXrayImages.length > 0 ?
// 4. Perlu diubah: ${xrayImages.map(image => menjadi ${currentXrayImages.map(image =>

// Perbaikan diperlukan di 2 tempat dalam HTML template:
// - Bagian X-ray gallery section
// - Referensi xrayImages lainnya dalam HTML