# 🧪 Testing Guide: Sales Voucher Integration

## Quick Test Scenarios

### ✅ Scenario 1: Apply Valid Voucher
**Steps**:
1. Buka menu "Manajemen Penjualan"
2. Klik "Tambah Penjualan"
3. Pilih produk dari dropdown
4. Set quantity
5. Di bagian "Kode Voucher", ketik kode voucher yang valid (misal: DISKON10)
6. Klik "Terapkan" atau tekan Enter

**Expected Result**:
- ✅ Voucher card muncul dengan warna hijau
- ✅ Menampilkan title dan description voucher
- ✅ Badge dengan kode voucher
- ✅ Diskon otomatis terhitung di preview
- ✅ Total berubah sesuai diskon
- ✅ Toast success: "Voucher ... berhasil diterapkan!"

---

### ❌ Scenario 2: Apply Invalid Voucher
**Steps**:
1. Buka form tambah penjualan
2. Pilih produk
3. Ketik kode voucher yang tidak ada (misal: INVALID123)
4. Klik "Terapkan"

**Expected Result**:
- ❌ Error message merah muncul: "Kode voucher tidak valid atau sudah tidak aktif"
- ❌ Tidak ada voucher yang ter-apply
- ❌ Form tetap bisa diisi dengan manual discount

---

### 💰 Scenario 3: Minimum Purchase Not Met
**Steps**:
1. Buat voucher dengan minPurchase = 100.000
2. Buka form penjualan
3. Pilih produk dengan total < 100.000
4. Apply voucher

**Expected Result**:
- ❌ Error message: "Minimum pembelian untuk voucher ini adalah Rp 100.000"
- ❌ Voucher tidak ter-apply

---

### ✅ Scenario 4: Complete Transaction with Voucher
**Steps**:
1. Apply voucher valid
2. Lengkapi semua field
3. Klik "Simpan"

**Expected Result**:
- ✅ Sale tersimpan di database
- ✅ Stock produk berkurang
- ✅ Voucher usage count bertambah +1
- ✅ Usage history tercatat
- ✅ Toast success
- ✅ Dialog tertutup
- ✅ List penjualan ter-refresh

**Verify di Console**:
```
✅ Voucher usage count updated successfully
✅ Loaded X active vouchers
```

---

### 🔄 Scenario 5: Remove Applied Voucher
**Steps**:
1. Apply voucher
2. Klik tombol X di voucher card

**Expected Result**:
- ✅ Voucher card hilang
- ✅ Form kembali ke input kode voucher
- ✅ Manual discount field muncul kembali
- ✅ Preview discount = 0
- ✅ Toast: "Voucher dihapus"

---

### 🚫 Scenario 6: Expired Voucher
**Steps**:
1. Buat voucher dengan expiryDate = kemarin
2. Coba apply voucher tersebut

**Expected Result**:
- ❌ Voucher tidak muncul di list (ter-filter)
- ❌ Error: "Kode voucher tidak valid atau sudah tidak aktif"

---

### 📊 Scenario 7: Usage Limit Reached
**Steps**:
1. Buat voucher dengan usageLimit = 2
2. Gunakan voucher 2x
3. Coba gunakan lagi

**Expected Result**:
- ❌ Voucher tidak muncul di list (ter-filter karena usageCount >= usageLimit)
- ❌ Error: "Kode voucher tidak valid atau sudah tidak aktif"

---

### 📝 Scenario 8: Edit Mode No Voucher
**Steps**:
1. Edit penjualan existing
2. Cek form

**Expected Result**:
- ✅ Form tidak ada voucher ter-apply (even if original transaction used voucher)
- ✅ Manual discount field muncul
- ✅ Ini correct behavior - edit tidak re-apply voucher

---

### 🔢 Scenario 9: Percentage Discount
**Steps**:
1. Buat voucher percentage 20%
2. Pilih produk Rp 100.000
3. Apply voucher

**Expected Result**:
- ✅ Discount = Rp 20.000
- ✅ Total = Rp 80.000
- ✅ Preview shows "(20%)"

---

### 💵 Scenario 10: Fixed Discount
**Steps**:
1. Buat voucher fixed Rp 15.000
2. Pilih produk Rp 100.000
3. Apply voucher

**Expected Result**:
- ✅ Discount = Rp 15.000
- ✅ Total = Rp 85.000
- ✅ Preview tidak show percentage

---

## 🔍 Debug Checklist

### Frontend Console Logs to Check
```javascript
// When fetching vouchers
✅ Loaded X active vouchers

// When validating voucher
🎫 Validating voucher: CODE
✅ Voucher "Title" berhasil diterapkan!

// When submitting with voucher
✅ Voucher usage count updated successfully
```

### Backend Logs to Check
```javascript
// Vouchers endpoint
🎫 Vouchers GET endpoint called
📊 Found X vouchers in database
✅ Returning Y valid vouchers

// Voucher usage endpoint
🎫 Recording voucher usage: { voucherId, voucherCode, ... }
✅ Updated voucher usage count: N
✅ Voucher usage recorded successfully
```

---

## 📋 Data Verification

### Check KV Store
```javascript
// Voucher record should have:
{
  id: "voucher_xxx",
  code: "DISKON10",
  currentUsage: 3, // should increment
  usageCount: 3,   // should match currentUsage
  usageLimit: 100,
  isActive: true,
  // ... other fields
}

// Usage record should exist:
{
  id: "voucher_usage_xxx",
  voucherId: "voucher_xxx",
  voucherCode: "DISKON10",
  patientId: "walk-in-customer",
  originalAmount: 100000,
  discountAmount: 10000,
  finalAmount: 90000,
  transactionType: "sale",
  transactionId: "sale_xxx",
  usedDate: "2025-10-06T...",
  // ... other fields
}
```

---

## ✅ All Tests Should Pass

Jika semua scenario di atas berjalan sesuai expected result, maka integrasi voucher **100% berhasil** dan siap production!

---

## 🐛 Common Issues & Solutions

### Issue: Voucher tidak muncul di list
**Check**:
- isActive = true?
- expiryDate > today?
- usageCount < usageLimit?
- code tidak CORRUPT?

### Issue: Discount tidak terhitung
**Check**:
- appliedVoucher not null?
- discountType & discountValue valid?
- subtotal > 0?

### Issue: Usage count tidak update
**Check**:
- Endpoint `/vouchers/use` called?
- Response 200 OK?
- voucherId valid?
- Backend logs show update?

---

*Testing Guide - Version 1.0*
*Created: October 6, 2025*
