# Utero AI - Python Backend

Backend Python untuk TTS (Text-to-Speech) menggunakan Google TTS (gTTS).

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Server
```bash
python app.py
```

Server akan berjalan di `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "Utero AI Backend",
  "version": "1.0.0"
}
```

### Text-to-Speech

#### Method 1: GET Request
```
GET /tts?text=Halo dunia&lang=id&stream=true
```

Query Parameters:
- `text` (required): Text to convert
- `lang` (optional): Language code (default: `id`)
- `slow` (optional): Speak slowly (default: `false`)
- `stream` (optional): Return audio directly (default: `false`)

#### Method 2: POST Request
```
POST /tts
Content-Type: application/json

{
  "text": "Halo dunia",
  "lang": "id",
  "slow": false,
  "stream": false
}
```

Response (stream=false):
```json
{
  "success": true,
  "audio_url": "http://localhost:5000/audio/tts_12345678.mp3",
  "text_length": 10,
  "lang": "id"
}
```

Response (stream=true): Audio file (audio/mpeg)

### Stream Audio
```
POST /tts/stream
Content-Type: application/json

{
  "text": "Halo dunia",
  "lang": "id"
}
```

Returns audio file directly.

### Serve Audio File
```
GET /audio/<filename>
```

## 🧩 Module: tts_module.py

Modul TTS yang dapat digunakan kembali di proyek lain.

### Usage

```python
from tts_module import TTSEngine, text_to_speech

# Method 1: Using class
engine = TTSEngine(lang='id')
audio_path = engine.generate_audio("Halo dunia!", "output.mp3")

# Method 2: Using helper function
audio_path = text_to_speech("Halo dunia!", "output.mp3", lang="id")
```

### Features

- ✅ Google TTS (suara natural)
- ✅ Caching audio untuk efisiensi
- ✅ Auto cleanup file lama
- ✅ Multi-language support

## 🔧 Configuration

### Environment Variables (Frontend)

Di file `.env` frontend (Next.js):

```env
# Enable/disable Python TTS
NEXT_PUBLIC_USE_PYTHON_TTS=true

# TTS API URL
NEXT_PUBLIC_TTS_API_URL=http://localhost:5000
```

### Testing dari HP/Device Lain

Jika testing dari device lain (HP, tablet):

1. Jalankan backend dengan `python app.py`
2. Catat IP address yang muncul (misal: `192.168.100.214`)
3. Update `.env` di frontend:
   ```env
   NEXT_PUBLIC_TTS_API_URL=http://192.168.100.214:5000
   ```
4. Pastikan laptop dan device di WiFi yang sama
5. Pastikan Windows Firewall mengizinkan port 5000

## 📁 Directory Structure

```
backend/
├── app.py              # Flask API server
├── tts_module.py       # TTS module (reusable)
├── requirements.txt    # Python dependencies
├── README.md           # This file
├── audio_cache/        # Cached audio files (auto-created)
└── audio_output/       # Generated audio files (auto-created)
```

## 🔒 Production Notes

- Gunakan WSGI server seperti Gunicorn atau Waitress
- Atur CORS origins sesuai domain production
- Gunakan HTTPS untuk keamanan
- Monitor penggunaan memori dan disk space

```bash
# Production with Gunicorn (Linux/Mac)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Production with Waitress (Windows)
pip install waitress
waitress-serve --host 0.0.0.0 --port 5000 app:app
```
