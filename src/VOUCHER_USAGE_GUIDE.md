# 🎫 Panduan Lengkap Penggunaan Voucher Diskon

Sistem voucher diskon di Falasifah Dental Clinic memungkinkan Anda memberikan diskon kepada pasien dengan cara yang terstruktur dan dapat dilacak.

## 📋 Daftar Isi

1. [Cara Membuat Voucher](#1-cara-membuat-voucher)
2. [Cara Menggunakan Voucher](#2-cara-menggunakan-voucher)
3. [Integrasi dengan Sistem Treatment](#3-integrasi-dengan-sistem-treatment)
4. [Integrasi dengan Sistem Sales](#4-integrasi-dengan-sistem-sales)
5. [Monitoring dan Tracking](#5-monitoring-dan-tracking)
6. [API Endpoints](#6-api-endpoints)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. 📝 Cara Membuat Voucher

### Langkah-langkah:

1. **Akses Menu Promo**
   - Masuk ke menu "Manajemen Promo" di sidebar
   - Pilih tab "Voucher Diskon"

2. **Isi Form Voucher**
   - **Judul**: Nama voucher (contoh: "Diskon Hari Raya")
   - **Kode**: Kode unik (contoh: "RAYA2024")
   - **Tipe Diskon**: 
     - `Persentase` - diskon dalam persen (contoh: 20%)
     - `Nominal` - diskon dalam rupiah (contoh: Rp 50.000)
   - **Nilai Diskon**: Besaran diskon
   - **Minimum Transaksi**: (opsional) minimal pembelian
   - **Maksimal Diskon**: (opsional) batas maksimal untuk persentase
   - **Tanggal Kadaluarsa**: (opsional) batas waktu berlaku
   - **Batas Penggunaan**: (opsional) maksimal berapa kali bisa digunakan

3. **Simpan Voucher**
   - Klik "Tambah Voucher"
   - Voucher akan otomatis aktif dan siap digunakan

### Contoh Voucher:

```
Judul: Diskon Member VIP
Kode: VIP30
Tipe: Persentase
Nilai: 30%
Min Transaksi: Rp 500.000
Max Diskon: Rp 200.000
Berlaku hingga: 31 Des 2024
Batas: 100 penggunaan
```

---

## 2. 🎯 Cara Menggunakan Voucher

### Di Sistem Treatment:

1. **Pilih Pasien dan Tindakan**
   - Buat transaksi treatment baru
   - Pilih pasien dan tindakan yang akan dilakukan

2. **Masukkan Kode Voucher**
   - Scroll ke bagian "Voucher Diskon"
   - Ketik kode voucher di field yang disediakan
   - Klik tombol "Terapkan"

3. **Sistem Validasi Otomatis**
   - ✅ Voucher aktif dan valid
   - ✅ Belum kadaluarsa
   - ✅ Belum mencapai batas penggunaan
   - ✅ Memenuhi minimum transaksi
   - ✅ Pasien belum pernah menggunakan voucher ini

4. **Diskon Diterapkan**
   - Total transaksi akan otomatis terpotong diskon
   - Ringkasan diskon akan ditampilkan
   - Penggunaan voucher tercatat otomatis

### Di Sistem Sales:

Proses sama seperti di treatment, namun dengan kategori transaksi "Penjualan".

---

## 3. 🏥 Integrasi dengan Sistem Treatment

### Komponen yang Digunakan:

```tsx
import { VoucherUsage } from './components/VoucherUsage'

// Di dalam form treatment
<VoucherUsage
  accessToken={accessToken}
  onVoucherApplied={handleVoucherApplied}
  originalAmount={totalTreatmentCost}
  patientId={selectedPatient.id}
  patientName={selectedPatient.name}
  transactionType="treatment"
  disabled={totalTreatmentCost === 0}
/>
```

### Handler Function:

```tsx
const handleVoucherApplied = (voucher: Voucher | null, discountAmount: number) => {
  if (voucher) {
    // Voucher diterapkan
    setAppliedVoucher(voucher)
    setDiscountAmount(discountAmount)
    setFinalTotal(originalTotal - discountAmount)
  } else {
    // Voucher dihapus
    setAppliedVoucher(null)
    setDiscountAmount(0)
    setFinalTotal(originalTotal)
  }
}
```

### Saat Menyimpan Treatment:

```tsx
const saveTreatment = async () => {
  // Simpan data treatment
  const treatmentData = {
    // ... data treatment lainnya
    originalAmount: totalCost,
    discountAmount: discountAmount,
    finalAmount: totalCost - discountAmount,
    voucherUsed: appliedVoucher ? {
      id: appliedVoucher.id,
      code: appliedVoucher.code,
      title: appliedVoucher.title
    } : null
  }

  // Catat penggunaan voucher
  if (appliedVoucher && discountAmount > 0) {
    await fetch(`${serverUrl}/vouchers/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        voucherId: appliedVoucher.id,
        voucherCode: appliedVoucher.code,
        patientId: patient.id,
        patientName: patient.name,
        originalAmount: totalCost,
        discountAmount: discountAmount,
        finalAmount: totalCost - discountAmount,
        transactionType: 'treatment',
        transactionId: treatmentId
      })
    })
  }
}
```

---

## 4. 🛒 Integrasi dengan Sistem Sales

Sama seperti treatment, namun dengan `transactionType: 'sale'`.

---

## 5. 📊 Monitoring dan Tracking

### Menu Penggunaan Voucher:

Di "Manajemen Promo" → Tab "Penggunaan Voucher" Anda dapat melihat:

- **Statistik Umum**:
  - Total penggunaan voucher
  - Total diskon yang diberikan
  - Rata-rata diskon per transaksi
  - Voucher aktif vs total

- **Breakdown per Jenis**:
  - Penggunaan di treatment vs sales
  - Chart visualisasi data

- **Riwayat Penggunaan**:
  - Detail setiap penggunaan voucher
  - Filter berdasarkan tanggal, jenis, atau kode voucher
  - Export ke CSV untuk analisis

### Filter dan Pencarian:

```
🔍 Pencarian: Berdasarkan kode voucher atau nama pasien
📅 Filter Tanggal: Hari ini, 7 hari, 30 hari, atau semua
🏷️ Filter Jenis: Treatment, Penjualan, atau semua
```

---

## 6. 🔌 API Endpoints

### Validasi Voucher:
```
POST /vouchers/validate
```

**Request:**
```json
{
  "code": "VIP30",
  "amount": 500000,
  "patientId": "patient_123",
  "transactionType": "treatment"
}
```

**Response:**
```json
{
  "valid": true,
  "voucher": {
    "id": "voucher_123",
    "title": "Diskon Member VIP",
    "code": "VIP30",
    "discountType": "percentage",
    "discountValue": 30,
    "maxDiscount": 200000
  }
}
```

### Catat Penggunaan:
```
POST /vouchers/use
```

### Riwayat Penggunaan:
```
GET /vouchers/usage
```

### Statistik:
```
GET /vouchers/stats
```

---

## 7. 🔧 Troubleshooting

### Masalah Umum:

1. **"Voucher tidak valid"**
   - ✅ Pastikan kode voucher benar
   - ✅ Voucher masih aktif
   - ✅ Belum kadaluarsa
   - ✅ Belum mencapai batas penggunaan

2. **"Minimum transaksi tidak terpenuhi"**
   - ✅ Total transaksi harus >= minimum yang ditetapkan

3. **"Pasien sudah menggunakan voucher ini"**
   - ✅ Satu voucher hanya bisa digunakan sekali per pasien

4. **"Voucher sudah mencapai batas penggunaan"**
   - ✅ Voucher telah digunakan maksimal sesuai yang ditetapkan

### Tips Optimasi:

1. **Buat Kode Unik**: Gunakan kombinasi huruf dan angka yang mudah diingat
2. **Set Minimum Bijak**: Jangan terlalu tinggi agar voucher bermanfaat
3. **Monitor Penggunaan**: Cek statistik secara berkala
4. **Backup Data**: Export riwayat penggunaan secara berkala

---

## 📞 Bantuan

Jika mengalami masalah dengan sistem voucher, hubungi administrator sistem atau cek log error di browser console (F12 → Console).

---

## 🎉 Selamat!

Sistem voucher diskon siap digunakan untuk memberikan pengalaman terbaik kepada pasien Falasifah Dental Clinic! 🦷✨