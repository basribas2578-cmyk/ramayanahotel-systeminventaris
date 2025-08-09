# 📋 Panduan Setup Hotel Inventory System

## 🎯 Overview

Panduan lengkap untuk setup Hotel Inventory System dari awal hingga siap digunakan.

## 🚀 Metode 1: Setup Otomatis (Recommended)

### Langkah 1: Persiapan Supabase

1. **Buat Akun Supabase**
   - Kunjungi [supabase.com](https://supabase.com)
   - Klik "Start your project"
   - Daftar dengan email atau GitHub

2. **Buat Project Baru**
   - Klik "New Project"
   - Pilih organization
   - Isi nama project: `hotel-inventory`
   - Pilih region terdekat
   - Buat password database yang kuat
   - Klik "Create new project"

3. **Dapatkan Credentials**
   - Tunggu project selesai dibuat (2-3 menit)
   - Masuk ke Settings → API
   - Copy **Project URL** dan **anon/public key**

### Langkah 2: Setup Aplikasi

1. **Download & Install**
   \`\`\`bash
   # Download project dari v0
   # Extract ke folder
   cd hotel-inventory-system
   
   # Install dependencies
   npm install
   
   # Jalankan aplikasi
   npm run dev
   \`\`\`

2. **Buka Setup Wizard**
   - Buka browser: `http://localhost:3000/setup`
   - Masukkan Supabase URL dan API key
   - Klik "Mulai Setup Otomatis"

3. **Tunggu Proses Selesai**
   - ✅ Validasi konfigurasi
   - ✅ Setup database & tabel
   - ✅ Insert data sample
   - ✅ Deploy ke Vercel
   - ✅ Setup selesai!

### Langkah 3: Akses Aplikasi

- Aplikasi akan tersedia di URL Vercel
- Login dengan akun default:
  - Admin: `admin@hotel.com` / `admin123`
  - Manager: `manager@hotel.com` / `manager123`
  - Staff: `staff@hotel.com` / `staff123`

## 🔧 Metode 2: Setup Manual

### 1. Environment Variables

Buat file `.env.local` di root project:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

### 2. Database Schema

Jalankan SQL berikut di Supabase SQL Editor:

\`\`\`sql
-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create locations table
CREATE TABLE locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) REFERENCES categories(name),
  quantity INTEGER NOT NULL DEFAULT 0,
  location VARCHAR(255) REFERENCES locations(name),
  condition VARCHAR(100) NOT NULL,
  purchase_date DATE,
  price DECIMAL(15,2),
  supplier VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and equipment'),
('Furniture', 'Office and hotel furniture'),
('Appliances', 'Kitchen and room appliances'),
('Linens', 'Bed sheets, towels, and textiles');

INSERT INTO locations (name, description) VALUES
('Reception', 'Hotel reception area'),
('Office', 'Administrative office'),
('Kitchen', 'Hotel kitchen area'),
('Storage', 'Main storage room'),
('Rooms', 'Guest rooms');
\`\`\`

### 3. Deploy ke Vercel

\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables di Vercel dashboard
\`\`\`

## 🔍 Troubleshooting

### Error: "Module not found '@/lib/mock-db'"

**Solusi**: File mock-db.ts sudah dibuat otomatis. Jika masih error:
\`\`\`bash
npm run build
\`\`\`

### Error: "Failed to connect to Supabase"

**Penyebab**: URL atau API key salah
**Solusi**: 
1. Periksa kembali credentials di Supabase
2. Pastikan project Supabase sudah aktif
3. Coba generate API key baru

### Error: "Database table doesn't exist"

**Penyebab**: Tabel belum dibuat
**Solusi**: Jalankan SQL schema di Supabase SQL Editor

### Deployment Failed

**Penyebab**: Environment variables tidak diset
**Solusi**: 
1. Set environment variables di Vercel dashboard
2. Redeploy aplikasi

## 📊 Verifikasi Setup

Setelah setup selesai, pastikan:

- ✅ Aplikasi bisa diakses
- ✅ Login berhasil
- ✅ Dashboard menampilkan data
- ✅ Bisa tambah/edit item
- ✅ Export CSV berfungsi

## 🎯 Next Steps

1. **Customize Data**: Hapus data sample, tambah data real
2. **User Management**: Tambah user baru sesuai kebutuhan
3. **Backup**: Setup backup database otomatis
4. **Monitoring**: Setup monitoring untuk production

## 📞 Bantuan

Jika masih mengalami masalah:

1. Cek kembali setiap langkah
2. Pastikan semua dependencies terinstall
3. Periksa console browser untuk error
4. Hubungi support jika diperlukan

---

**Setup berhasil? Selamat! Sistem inventaris hotel Anda siap digunakan! 🎉**
