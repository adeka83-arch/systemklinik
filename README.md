# Sistem Absensi Klinik

Sistem manajemen absensi dan gaji klinik yang lengkap dengan fitur admin untuk mengelola karyawan, dokter, absensi, gaji, dan laporan.

## Fitur Utama

### 🔐 Autentikasi
- Login dan registrasi admin
- Session management dengan Supabase Auth

### 👥 Manajemen Data
- **Karyawan**: Tambah, edit, hapus data karyawan
- **Dokter**: Manajemen data dokter dengan spesialisasi dan shift kerja
- **Absensi**: Sistem absensi dokter dengan 2 shift (pagi & sore)
- **Gaji**: Perhitungan gaji karyawan dengan bonus dan tunjangan raya

### 💰 Sistem Fee Dokter
- **Uang Duduk**: Manajemen nominal uang duduk per shift
- **Tindakan**: Input tindakan medis dan fee dokter
- **Perhitungan Otomatis**:
  - Jika ada tindakan, uang duduk hilang
  - Jika fee tindakan < uang duduk, dokter dapat uang duduk
  - Jika fee tindakan ≥ uang duduk, dokter dapat fee tindakan

### 📊 Laporan & Export
- Laporan absensi dokter
- Laporan gaji karyawan  
- Laporan fee dokter
- Export ke PDF dan Excel (CSV)

### ⚙️ Pengaturan
- Upload logo klinik dari komputer
- Ubah nama klinik
- Pengaturan sistem dinamis

## Teknologi yang Digunakan

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Supabase (Database, Auth, Storage)
- **Deployment**: Vercel
- **Icons**: Lucide React

## Instalasi dan Penggunaan

### 1. Clone Repository
```bash
git clone https://github.com/username/sistem-absensi-klinik.git
cd sistem-absensi-klinik
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Buat file `.env.local`:
```env
VITE_SUPABASE_URL=https://hgzmzbkzgojgxqyurqzy.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build untuk Production
```bash
npm run build
```

### 6. Deploy ke Vercel
```bash
npm run deploy
```

## Struktur Database

Sistem menggunakan Supabase dengan key-value store untuk menyimpan:

- `clinic_settings`: Pengaturan klinik (nama, logo)
- `employee_*`: Data karyawan
- `doctor_*`: Data dokter
- `attendance_*`: Record absensi
- `salary_*`: Data gaji karyawan
- `sitting_fee_*`: Data uang duduk dokter
- `treatment_*`: Data tindakan dan fee
- `expense_*`: Data pengeluaran

## Shift Kerja Dokter

### Hari Kerja (Senin-Jumat)
- **Shift Pagi**: 09:00 - 15:00
- **Shift Sore**: 18:00 - 20:00

### Weekend (Sabtu-Minggu)
- **Shift Pagi**: 09:00 - 15:00 (hanya shift pagi)

## Cara Kerja Sistem Fee Dokter

1. **Hanya Uang Duduk**: Jika dokter tidak ada tindakan, dapat uang duduk penuh
2. **Ada Tindakan**: 
   - Fee tindakan < uang duduk → dokter dapat uang duduk
   - Fee tindakan ≥ uang duduk → dokter dapat fee tindakan
3. **Multiple Tindakan**: Total fee tindakan dalam 1 shift dibandingkan dengan uang duduk

## Export Data

Sistem mendukung export dalam format:
- **PDF**: Untuk laporan formal
- **Excel/CSV**: Untuk analisis data lebih lanjut

## Deployment ke GitHub & Vercel

### GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/sistem-absensi-klinik.git
git push -u origin main
```

### Vercel
1. Import project dari GitHub
2. Set environment variables
3. Deploy automatically

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## Support

Jika ada pertanyaan atau bug, silakan buat issue di GitHub repository.

---

**Developed with ❤️ for Healthcare Management**