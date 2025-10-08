# Perbaikan Upload Gambar Promo - Manajemen Promo

## Masalah yang Diperbaiki

Pada halaman **Manajemen Promo** di tab "**Promo Gambar**", fitur upload gambar tidak berfungsi karena **endpoint backend yang hilang**. Komponen PromoManager.tsx mencoba mengakses beberapa endpoint yang tidak ada:

1. ❌ `POST /promo-images/upload` - untuk upload gambar
2. ❌ `GET /promo-images` - untuk mengambil daftar gambar
3. ❌ `DELETE /promo-images/:id` - untuk hapus gambar
4. ❌ `GET /patients` - untuk daftar pasien
5. ❌ `GET /vouchers` - untuk daftar voucher
6. ❌ `GET /promo-history` - untuk riwayat promo

## Perubahan Backend

### 1. **Promo Images Endpoints** - ✅ Ditambahkan

#### **File:** `/supabase/functions/server/promo_endpoints.tsx`

#### **GET /promo-images**
- ✅ Mengambil semua gambar promo yang terupload
- ✅ Transform data dengan dual field mapping
- ✅ Return metadata gambar (filename, size, url, upload date)

#### **POST /promo-images/upload**
- ✅ Upload gambar promo dengan FormData
- ✅ Validasi file type (JPEG, PNG only)
- ✅ Validasi ukuran file (maksimal 5MB)
- ✅ Generate unique filename dengan timestamp
- ✅ Convert ke base64 untuk penyimpanan
- ✅ Auto-generate file URL

#### **DELETE /promo-images/:id**
- ✅ Hapus gambar promo by ID
- ✅ Validasi gambar exists sebelum delete

### 2. **Patients Endpoints** - ✅ Ditambahkan

#### **GET /patients**
- ✅ Mengambil semua data pasien
- ✅ Filter hanya pasien yang punya nomor telepon
- ✅ Transform data dengan dual field mapping
- ✅ Support untuk kirim promo via WhatsApp

### 3. **Vouchers Endpoints** - ✅ Ditambahkan

#### **GET /vouchers**
- ✅ Mengambil semua voucher
- ✅ **Filter out voucher corrupt** secara otomatis
- ✅ Validasi data voucher (code, title, discount value, expiry date)
- ✅ Transform data dengan dual field mapping

#### **POST /vouchers**
- ✅ Buat voucher baru
- ✅ Validasi field wajib
- ✅ Auto-uppercase code voucher
- ✅ Dual field names untuk kompatibilitas

#### **DELETE /vouchers/:id**
- ✅ Hapus voucher
- ✅ Support force delete untuk voucher corrupt
- ✅ Auto-detect voucher corrupt

### 4. **Promo History Endpoints** - ✅ Ditambahkan

#### **GET /promo-history**
- ✅ Mengambil riwayat pengiriman promo
- ✅ Support untuk voucher dan image promo
- ✅ Transform data dengan complete mapping

#### **DELETE /promo-history/:id**
- ✅ Hapus riwayat promo
- ✅ Validasi exists sebelum delete

### 5. **Integrasi ke Server Utama** - ✅ Ditambahkan

Updated `/supabase/functions/server/index.tsx`:
```javascript
import { 
  addPromoImagesEndpoints, 
  addPromoHistoryEndpoints, 
  addPatientsEndpoints, 
  addVouchersEndpoints 
} from './promo_endpoints.tsx'

// Add to server initialization
addPromoImagesEndpoints(app)
addPromoHistoryEndpoints(app)
addPatientsEndpoints(app)
addVouchersEndpoints(app)
```

## Struktur Data

### **Promo Images:**
```javascript
{
  id: "promo_image_1737686400000_abc123",
  filename: "promo_1737686400000.jpg",
  originalName: "promo-diskon-gigi.jpg", 
  original_name: "promo-diskon-gigi.jpg",
  fileUrl: "data:image/jpeg;base64,/9j/4AAQ...", // Base64 URL
  file_url: "data:image/jpeg;base64,/9j/4AAQ...",
  fileSize: 245760, file_size: 245760,
  mimeType: "image/jpeg", mime_type: "image/jpeg",
  uploadDate: "2025-01-23T...", upload_date: "2025-01-23T...",
  uploadedBy: "user", uploaded_by: "user",
  created_at: "2025-01-23T..."
}
```

### **Patients (for Promo):**
```javascript
{
  id: "patient_1737686400000_def456",
  name: "John Doe", nama: "John Doe",
  phone: "081234567890", telepon: "081234567890", 
  email: "john@example.com",
  address: "Jakarta", alamat: "Jakarta",
  birthDate: "1990-01-01", tanggalLahir: "1990-01-01",
  medicalRecordNumber: "RM001", nomorRekamMedis: "RM001",
  created_at: "2025-01-23T..."
}
```

### **Vouchers (Filtered):**
```javascript
{
  id: "voucher_1737686400000_ghi789",
  code: "DENTAL2025",
  title: "Diskon Scaling 50%",
  description: "Berlaku untuk scaling gigi", deskripsi: "...",
  discountType: "percentage", discount_type: "percentage",
  discountValue: 50, discount_value: 50,
  expiryDate: "2025-12-31", expiry_date: "2025-12-31",
  usageLimit: 100, usage_limit: 100,
  usageCount: 5, usage_count: 5, currentUsage: 5,
  isActive: true, is_active: true,
  minPurchase: 100000, min_purchase: 100000, minAmount: 100000,
  createdDate: "2025-01-23T...", created_by: "user",
  created_at: "2025-01-23T..."
}
```

## Validasi Upload Gambar

### **File Type Validation:**
- ✅ Hanya JPEG dan PNG yang diperbolehkan
- ✅ MIME type validation: `image/jpeg`, `image/jpg`, `image/png`

### **File Size Validation:**
- ✅ Maksimal 5MB per file
- ✅ Error message: "Ukuran file maksimal 5MB"

### **File Processing:**
- ✅ Generate unique filename dengan timestamp
- ✅ Convert ke base64 untuk storage
- ✅ Create data URL yang bisa langsung digunakan
- ✅ Preserve original filename untuk referensi

## Fitur yang Sekarang Berfungsi

### 📤 **Upload Gambar Promo:**
1. Pilih file gambar (JPEG/PNG, max 5MB)
2. Upload dengan progress indicator
3. File tersimpan ke database dengan metadata lengkap
4. Generate preview URL otomatis

### 🖼️ **Manajemen Gambar:**
1. Lihat daftar semua gambar promo yang terupload
2. Preview gambar dengan ukuran file dan tanggal upload
3. Hapus gambar yang tidak diperlukan
4. Pilih gambar untuk dikirim sebagai promo

### 👥 **Pilih Penerima:**
1. Daftar pasien otomatis dimuat dari database
2. Filter pasien yang punya nomor WhatsApp
3. Pilih multiple pasien sebagai penerima promo
4. Validasi minimal 1 pasien harus dipilih

### 📱 **Kirim Promo Image:**
1. Pilih gambar promo yang sudah diupload
2. Tulis judul dan pesan promo
3. Pilih pasien penerima
4. Kirim via WhatsApp dengan URL gambar

### 🎫 **Manajemen Voucher:**
1. Daftar voucher dengan filter corrupt otomatis
2. Buat voucher baru dengan validasi lengkap
3. Hapus voucher (support force delete untuk corrupt data)
4. Preview voucher sebelum kirim

### 📊 **Riwayat Promo:**
1. Track semua promo yang pernah dikirim
2. Detail penerima dan tanggal pengiriman
3. Hapus riwayat yang tidak diperlukan

## Error Handling

### **Upload Errors:**
- ❌ "File gambar wajib diunggah" - Jika tidak ada file
- ❌ "Hanya file JPEG dan PNG yang diperbolehkan" - File type salah
- ❌ "Ukuran file maksimal 5MB" - File terlalu besar

### **Promo Send Errors:**
- ❌ "Pilih gambar promo terlebih dahulu" - Belum pilih gambar
- ❌ "Pilih minimal satu pasien" - Belum pilih penerima
- ❌ "Masukkan judul promo" - Judul kosong

### **Data Validation:**
- ✅ Auto-filter voucher corrupt
- ✅ Validate patient phone numbers
- ✅ Check image existence before delete

## Response Format

### **Upload Success:**
```json
{
  "success": true,
  "message": "Gambar promo berhasil diunggah",
  "imageData": {
    "id": "promo_image_...",
    "filename": "promo_1737686400000.jpg",
    "fileUrl": "data:image/jpeg;base64,..."
  }
}
```

### **Upload Error:**
```json
{
  "success": false,
  "error": "Ukuran file maksimal 5MB"
}
```

## Status

✅ **COMPLETED** - Halaman Manajemen Promo sekarang dapat:

### **Tab Promo Gambar:**
- ✅ Upload gambar promo (JPEG/PNG, max 5MB)
- ✅ Preview dan manage gambar yang terupload
- ✅ Hapus gambar yang tidak diperlukan
- ✅ Pilih pasien penerima dari database
- ✅ Kirim promo image via WhatsApp dengan URL gambar
- ✅ Progress indicator saat upload dan kirim

### **Tab Voucher:**
- ✅ Load voucher dengan filter corrupt otomatis
- ✅ Buat voucher baru dengan validasi
- ✅ Delete voucher (normal + force delete)
- ✅ Preview voucher sebelum kirim

### **Tab Riwayat:**
- ✅ Track riwayat pengiriman promo
- ✅ Detail penerima dan metadata
- ✅ Hapus riwayat lama

## Testing

### ✅ **Berhasil Ditest:**
1. **Upload Gambar:** File JPEG 2MB berhasil diupload
2. **Validasi File:** File PDF dan file >5MB ditolak dengan error yang tepat
3. **Preview:** Gambar muncul di gallery dengan metadata lengkap
4. **Delete:** Hapus gambar berfungsi normal
5. **Load Patients:** Data pasien dimuat untuk selection
6. **Load Vouchers:** Voucher corrupt auto-filtered
7. **Send Promo:** WhatsApp link generated dengan gambar URL

**Catatan:** Semua endpoint promo sudah aktif. Refresh halaman jika masih ada masalah dengan upload gambar pada tab "Promo Gambar".