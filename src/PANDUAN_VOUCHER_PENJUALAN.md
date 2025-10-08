# 🎁 Panduan Penggunaan Voucher di Penjualan

## 📌 Cara Membuat Voucher

### 1. Buka Menu Manajemen Promo
- Klik menu **"Manajemen Promo"** di sidebar
- Pilih tab **"Voucher Elektronik"**

### 2. Buat Voucher Baru
Klik tombol **"+ Buat Voucher Baru"** dan isi:

**Field Wajib:**
- **Kode Voucher**: Contoh `DISC20`, `HEMAT50`, `GIGI100` (otomatis uppercase)
- **Judul**: Contoh "Diskon 20% Produk Medis"
- **Deskripsi**: Penjelasan voucher
- **Jenis Diskon**: 
  - Persentase (contoh: 20%)
  - Nominal (contoh: Rp 50.000)
- **Nilai Diskon**: Angka sesuai jenis (20 atau 50000)
- **Tanggal Kadaluarsa**: Sampai kapan voucher berlaku
- **Limit Penggunaan**: Berapa kali voucher bisa dipakai

**Field Opsional:**
- **Minimum Pembelian**: Contoh Rp 100.000 (kosongkan jika tidak ada syarat)

### 3. Simpan Voucher
- Klik tombol **"Simpan Voucher"**
- Voucher langsung aktif dan bisa digunakan

---

## 🛒 Cara Menggunakan Voucher di Penjualan

### 1. Buka Menu Manajemen Penjualan
- Klik menu **"Manajemen Penjualan"** di sidebar
- Klik tombol **"+ Tambah Penjualan"**

### 2. Pilih Produk
- Pilih produk dari dropdown
- Set jumlah/quantity
- Harga akan otomatis terisi

### 3. Masukkan Kode Voucher
Di bagian **"Kode Voucher (Opsional)"**:
- Ketik kode voucher (contoh: `DISC20`)
- Klik tombol **"✓ Terapkan"**
- Tunggu validasi

### 4. Hasil Validasi

**✅ Voucher Valid:**
- Muncul card hijau dengan info voucher
- Diskon otomatis terhitung
- Total berubah sesuai diskon
- Kolom "Diskon Manual" hilang (tidak bisa double diskon)

**❌ Voucher Tidak Valid:**
- Muncul pesan error merah
- Kemungkinan penyebab:
  - Kode salah/tidak ada
  - Voucher sudah expired
  - Voucher sudah habis limit
  - Minimum pembelian belum terpenuhi

### 5. Preview Total
Sebelum simpan, cek preview di kotak pink:
```
Subtotal:               Rp 100.000
🎁 Diskon Voucher:     -Rp  20.000
────────────────────────────────────
Total:                  Rp  80.000
```

### 6. Simpan Transaksi
- Klik tombol **"Simpan"**
- Transaksi tersimpan
- Voucher usage count otomatis +1
- Stock produk otomatis -1
- Muncul notifikasi sukses

---

## 🔄 Cara Membatalkan Voucher

Jika sudah apply voucher tapi mau batalkan:
1. Klik tombol **X** di kanan card voucher hijau
2. Voucher dihapus
3. Diskon kembali ke 0
4. Total kembali ke subtotal
5. Bisa input voucher lain atau lanjut tanpa voucher

---

## ⚠️ Penting Diketahui

### **Voucher vs Diskon Manual**
- ❌ **TIDAK BISA** pakai voucher DAN diskon manual bersamaan
- ✅ Pilih salah satu saja:
  - Pakai voucher → Otomatis dapat diskon sesuai voucher
  - Pakai diskon manual → Isi manual di kolom diskon

### **Syarat Voucher Valid**
Voucher hanya bisa dipakai jika:
- ✅ Kode benar
- ✅ Status aktif (isActive = true)
- ✅ Belum expired
- ✅ Masih ada limit (usageCount < usageLimit)
- ✅ Minimum pembelian terpenuhi (jika ada syarat)

### **Update Otomatis**
Setiap kali voucher berhasil dipakai:
- ✅ Usage count +1
- ✅ Data transaksi tersimpan dengan kode voucher
- ✅ Stock produk berkurang
- ✅ Jika usage count = limit → Voucher jadi "used up"

---

## 📊 Monitoring Voucher

### 1. Cek Status Voucher
Di **Manajemen Promo** → tab **Voucher Elektronik**:

**Kolom yang ada:**
- Kode voucher
- Judul
- Jenis diskon
- Nilai diskon
- **Terpakai**: Shows X/Y (contoh: 15/100)
- Tanggal expired
- Status (badge warna)

**Badge Status:**
- 🟢 **Active** - Bisa dipakai
- 🔴 **Expired** - Sudah lewat tanggal
- 🟡 **Used Up** - Sudah habis limit
- ⚫ **Inactive** - Dinonaktifkan admin

### 2. Perpanjang Voucher
Jika voucher mau expired tapi masih ingin dipakai:
1. Klik tombol **Edit** (icon pensil)
2. Ubah **Tanggal Kadaluarsa** ke tanggal baru
3. Klik **"Perbarui Voucher"**
4. Voucher kembali aktif

### 3. Naikkan Limit
Jika voucher sudah hampir habis limit:
1. Klik tombol **Edit**
2. Ubah **Limit Penggunaan** ke angka lebih besar
3. Klik **"Perbarui Voucher"**
4. Voucher bisa dipakai lagi

---

## 💡 Tips & Tricks

### **Membuat Kode Voucher yang Baik**
✅ **GOOD:**
- `DISC20` - Jelas artinya (Discount 20%)
- `GIGI50` - Spesifik (Produk gigi diskon 50rb)
- `FEB2025` - Pakai bulan/tahun
- `HEMAT100` - Mudah diingat

❌ **AVOID:**
- `ABC123` - Tidak jelas
- `VOUCHER1` - Kurang deskriptif
- `X` - Terlalu pendek

### **Setting Limit yang Bijak**
- **Promo Terbatas**: Set limit kecil (10-50)
- **Promo Umum**: Set limit besar (100-1000)
- **Voucher Personal**: Set limit 1 (one-time use)

### **Minimum Purchase Strategy**
- **No Minimum**: Semua orang bisa pakai (attracts more)
- **Rp 50.000**: Pastikan transaksi cukup besar
- **Rp 100.000+**: Untuk voucher diskon besar

### **Tanggal Expired Optimal**
- **Promo Weekend**: Expired hari Minggu malam
- **Promo Bulanan**: Expired akhir bulan
- **Promo Musiman**: Expired akhir musim
- **Flash Sale**: Expired beberapa jam/hari

---

## 🆘 Troubleshooting

### **Problem: "Kode voucher tidak valid"**
**Solusi:**
1. Cek ejaan kode (case-insensitive tapi pastikan benar)
2. Cek di Manajemen Promo apakah voucher ada
3. Cek status voucher (aktif/expired/used up)

### **Problem: "Minimum pembelian tidak terpenuhi"**
**Solusi:**
1. Lihat error message berapa minimum pembelian
2. Tambah quantity produk, atau
3. Ganti produk yang lebih mahal, atau
4. Pakai voucher lain tanpa minimum purchase

### **Problem: Voucher sudah di-apply tapi mau ganti**
**Solusi:**
1. Klik tombol X untuk remove voucher
2. Masukkan kode voucher baru
3. Klik Terapkan

### **Problem: Voucher tidak muncul diskon**
**Solusi:**
1. Pastikan sudah klik tombol "Terapkan"
2. Tunggu sampai muncul card hijau
3. Jika error, baca pesan error dan perbaiki
4. Refresh page jika masih error

### **Problem: Tombol Simpan disabled**
**Solusi:**
1. Pastikan sudah pilih produk
2. Pastikan quantity > 0
3. Voucher tidak harus ada (opsional)
4. Jika sudah lengkap tapi masih disabled, coba refresh

---

## 📞 Bantuan Lebih Lanjut

Jika masih ada masalah atau pertanyaan:
1. Cek dokumentasi lengkap di `SALES_VOUCHER_INTEGRATION_COMPLETED.md`
2. Kontak administrator sistem
3. Laporkan bug atau request fitur baru

---

**Dibuat:** 6 Oktober 2025  
**Version:** 1.0.0  
**Status:** ✅ READY TO USE
