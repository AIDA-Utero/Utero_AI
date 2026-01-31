# 🚂 Panduan Deploy Python TTS Backend ke Railway

Panduan ini menjelaskan cara deploy Python TTS backend ke Railway agar bisa diakses dari frontend Vercel.

---

## 📋 Prasyarat

1. Akun GitHub (https://github.com)
2. Akun Railway (https://railway.app) - bisa login dengan GitHub
3. Repository GitHub yang berisi folder `backend/`

---

## 🚀 Langkah-langkah Deploy

### Step 1: Siapkan Repository GitHub

1. Pastikan folder `backend/` sudah ada di repository Anda
2. Struktur folder harus seperti ini:
   ```
   your-repo/
   ├── backend/
   │   ├── app.py
   │   ├── tts_module.py
   │   ├── requirements.txt
   │   ├── Procfile
   │   ├── runtime.txt
   │   └── railway.json
   ├── src/
   ├── package.json
   └── ...
   ```

3. Push semua perubahan ke GitHub:
   ```bash
   git add .
   git commit -m "Add Python TTS backend deployment config"
   git push origin main
   ```

### Step 2: Buat Project di Railway

1. Buka **[Railway.app](https://railway.app)** dan login dengan GitHub
2. Klik **"New Project"**
3. Pilih **"Deploy from GitHub repo"**
4. Pilih repository Anda
5. Railway akan auto-detect sebagai monorepo

### Step 3: Konfigurasi Service

1. Setelah project dibuat, klik **"Add a Service"** → **"GitHub Repo"**
2. Pilih repository yang sama
3. Di settings service, set **Root Directory** ke `backend`
   - Klik service → **Settings** → **Root Directory** → ketik `backend`
4. Railway akan auto-deploy

### Step 4: Dapatkan URL Backend

1. Setelah deploy sukses, klik service
2. Pergi ke tab **"Settings"** → **"Networking"**
3. Klik **"Generate Domain"**
4. Anda akan mendapat URL seperti:
   ```
   https://utero-tts-backend-production.up.railway.app
   ```

### Step 5: Update Frontend Environment

1. Di Vercel Dashboard, buka project frontend Anda
2. Pergi ke **Settings** → **Environment Variables**
3. Tambahkan variable:
   ```
   NEXT_PUBLIC_TTS_API_URL = https://your-backend-url.railway.app
   NEXT_PUBLIC_USE_PYTHON_TTS = true
   ```
4. Redeploy frontend

---

## ✅ Verifikasi Deployment

### Test Health Check
```bash
curl https://your-backend-url.railway.app/health
```

Response seharusnya:
```json
{
  "status": "healthy",
  "service": "Utero AI Backend",
  "version": "1.0.0"
}
```

### Test TTS
```bash
curl -X POST https://your-backend-url.railway.app/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Halo, saya Utero AI", "lang": "id"}'
```

---

## 🔧 Troubleshooting

### Error: "No start command"
- Pastikan file `Procfile` ada di folder `backend/`
- Pastikan Root Directory di Railway diset ke `backend`

### Error: "Module not found"
- Pastikan `requirements.txt` sudah lengkap dengan gunicorn

### CORS Error di Frontend
- Pastikan URL di `NEXT_PUBLIC_TTS_API_URL` menggunakan HTTPS
- Pastikan tidak ada trailing slash di URL

### Audio tidak diputar
- Buka browser console, cek error message
- Pastikan browser mengizinkan autoplay audio

---

## 💰 Biaya Railway

Railway Free Tier:
- **$5 credit gratis per bulan**
- Cukup untuk ~500 jam runtime
- Cocok untuk development dan low traffic

Jika traffic tinggi, pertimbangkan upgrade atau gunakan caching agresif.

---

## 📁 File Konfigurasi

### Procfile
```
web: gunicorn app:app --bind 0.0.0.0:$PORT
```

### runtime.txt
```
python-3.11.7
```

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn app:app --bind 0.0.0.0:$PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## 🔄 Arsitektur Setelah Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│    ┌─────────────────────┐      ┌─────────────────────┐     │
│    │       VERCEL        │      │      RAILWAY        │     │
│    │   (Frontend)        │      │   (Python Backend)  │     │
│    │                     │      │                     │     │
│    │   Next.js App       │─────▶│   Flask TTS API     │     │
│    │   utero-ai.vercel   │      │   *.railway.app     │     │
│    │   .app              │      │                     │     │
│    └─────────────────────┘      └─────────────────────┘     │
│              │                            │                  │
│              ▼                            ▼                  │
│    ┌─────────────────────┐      ┌─────────────────────┐     │
│    │   OpenRouter/       │      │   Google TTS        │     │
│    │   Gemini API        │      │   (gTTS)            │     │
│    │   (AI Response)     │      │   (Audio)           │     │
│    └─────────────────────┘      └─────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Selesai! 🎉** Setelah mengikuti langkah-langkah di atas, sistem TTS Python Anda akan berjalan di Railway dan dapat diakses oleh frontend di Vercel.
