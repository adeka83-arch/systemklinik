# Sistem Tindakan Multi Fee - Falasifah Dental Clinic (SISTEM UTAMA)

## Overview
Sistem tindakan dengan multi fee kini menjadi sistem utama yang menggantikan sistem lama. Sistem ini menyediakan perhitungan fee yang fleksibel - baik single fee (seperti sistem lama) maupun multi fee per tindakan berdasargan aturan yang telah ditetapkan. Sistem ini lengkap dengan semua fitur yang ada di sistem sebelumnya plus fitur multi fee yang canggih.

## Fitur Utama

### 1. Smart Matching Algorithm
- **Prioritas Tertinggi**: Dokter + Tindakan Spesifik (Score: 100)
- **Prioritas Tinggi**: Dokter Spesifik (Score: 50)
- **Prioritas Sedang**: Tindakan Spesifik (Score: 40)
- **Prioritas Rendah**: Kategori Match (Score: 30)
- **Prioritas Terendah**: Default Rule (Score: 10)

### 2. Komponen Utama

#### `TreatmentMultiFeeSection`
- Toggle antara Single Fee dan Multi Fee mode
- Tabel detail fee per tindakan
- Manual override untuk fee individual
- Alert untuk konflik dan status
- Summary perhitungan total

#### `TreatmentFormWithMultiFee`
- Form demo lengkap dengan multi fee
- Integrasi dengan data dokter, pasien, dan tindakan
- Support untuk DP dan pembayaran lunas
- Real-time calculation

#### `MultiFeeCalculator` (Advanced)
- Komponen lengkap untuk perhitungan kompleks
- Detailed breakdown dan analytics
- Export ready untuk integrasi lanjutan

### 3. Cara Kerja

1. **Pemilihan Tindakan**: User memilih multiple tindakan untuk satu pasien
2. **Auto Matching**: Sistem otomatis mencocokkan setiap tindakan dengan aturan fee terbaik
3. **Manual Override**: User dapat override fee secara manual jika diperlukan
4. **Perhitungan Total**: Sistem menghitung total fee dari semua tindakan
5. **Support DP**: Fee dihitung proportional berdasarkan outstanding amount

### 4. Contoh Skenario

**Pasien dengan kombinasi tindakan:**
- Buccal Tube (Rp 150,000) → Rule: "Ortodonti 15%" → Fee: Rp 22,500
- Ortho Pemasangan (Rp 5,500,000) → Rule: "Ortodonti 20%" → Fee: Rp 1,100,000
- **Total Fee Dokter: Rp 1,122,500**

### 5. Integrasi dengan Sistem Existing

- **Database**: Menggunakan tabel `fee_settings` yang sudah ada
- **API**: Terintegrasi dengan endpoint `/fee-settings`
- **Smart Match**: Backward compatible dengan single fee system
- **Data Structure**: Support untuk `doctorIds[]` dan `treatmentTypes[]`

### 6. Mode Operasional

#### Single Fee Mode (Default)
- Satu persentase fee untuk semua tindakan
- Compatible dengan sistem lama
- Mudah digunakan untuk kasus sederhana

#### Multi Fee Mode
- Fee berbeda per tindakan
- Berdasarkan aturan yang telah dibuat
- Cocok untuk kombinasi tindakan kompleks
- Manual override available

### 7. UI/UX Features

- **Toggle sederhana** antara mode Single dan Multi Fee
- **Visual indicators** untuk status aturan (Auto Rules, No Rules, Manual Override)
- **Real-time calculation** saat user mengubah tindakan atau diskon
- **Alert system** untuk konflik dan informasi penting
- **Responsive design** untuk desktop dan mobile

### 8. Manfaat

- **Akurasi**: Fee dihitung sesuai aturan spesifik setiap tindakan
- **Fleksibilitas**: Manual override untuk kasus khusus
- **Transparansi**: Breakdown detail fee per tindakan
- **Efisiensi**: Otomatis matching tanpa input manual
- **Compatibility**: Tetap mendukung single fee mode
- **Lengkap**: Semua fitur sistem lama + multi fee (admin fee, obat, diskon, print, dll)

## Penggunaan Sistem Baru

1. Buka menu **Tindakan** di sidebar
2. Pada tab **Data Tindakan** - lihat semua data tindakan yang ada
3. Pada tab **Tambah Tindakan** - buat tindakan baru dengan fitur multi fee
4. Pilih dokter dan pasien
5. Tambahkan multiple tindakan dengan diskon jika diperlukan
6. Tambahkan obat jika diperlukan (sistem akan update stok)
7. Atur biaya admin (override atau gunakan default)
8. Pilih metode dan status pembayaran (Lunas/DP)
9. Toggle **Multi Fee** untuk mengaktifkan perhitungan per tindakan
10. Sistem otomatis menghitung total fee berdasarkan aturan yang ada
11. Simpan dan cetak invoice/kwitansi

## Fitur Tambahan Sistem Lengkap

- **Manajemen Stok Obat**: Otomatis update stok saat tindakan disimpan
- **Biaya Admin**: Support override biaya admin per transaksi
- **Sistem Diskon**: Diskon persentase per tindakan
- **Payment Options**: Support Cash, Debit, QRIS, Credit Card
- **DP System**: Support down payment dengan perhitungan outstanding
- **Print System**: Print invoice dan kwitansi dengan tanda tangan kasir
- **Edit/Delete**: Edit dan hapus data tindakan dengan konfirmasi
- **Auto Calculation**: Real-time calculation saat input data

## Migrasi dari Sistem Lama

Sistem lama (`TreatmentsWithFeeSettings`) telah digantikan dengan `TreatmentSystemComplete`. Semua data dan fungsi tetap kompatibel:

- **Data Structure**: Struktur database sama, tidak perlu migrasi data
- **API Endpoints**: Menggunakan endpoint yang sama
- **Fee Settings**: Semua aturan fee yang sudah dibuat tetap berlaku
- **Print Templates**: Template invoice/kwitansi tetap sama
- **User Experience**: Interface lebih intuitif dengan tabs terpisah

## Developer Notes

- Komponen `TreatmentSystemComplete` adalah sistem lengkap yang menggantikan komponen lama
- Support untuk TypeScript dengan interface yang lengkap dan konsisten
- Menggunakan state management yang optimal untuk performa
- Error handling untuk semua edge cases termasuk stok obat dan validasi
- Extensible untuk fitur lanjutan seperti laporan dan analytics
- Backward compatible dengan semua data dan pengaturan yang sudah ada

## File Structure Update

**File Utama Baru:**
- `/components/TreatmentSystemComplete.tsx` - Sistem utama yang menggantikan semua komponen lama
- `/components/TreatmentMultiFeeSection.tsx` - Komponen multi fee calculator
- `/App.tsx` - Updated untuk menggunakan sistem baru

**File Lama (Deprecated):**
- `/components/TreatmentsWithFeeSettings.tsx`
- `/components/TreatmentsWithMultiFeeDemo.tsx` 
- `/components/TreatmentFormWithMultiFee.tsx` (incomplete)