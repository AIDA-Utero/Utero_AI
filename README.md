# 🤖 Utero Interactive AI Avatar

**Utero Interactive AI** adalah sistem asisten virtual berbasis web yang dirancang khusus untuk merepresentasikan **PT Utero Kreatif Indonesia**. Sistem ini menghadirkan pengalaman interaksi yang unik di mana pengguna tidak mengetik, melainkan berbicara langsung (*Voice Interaction*) dengan Avatar Virtual.

Proyek ini dibangun menggunakan **Next.js 16** dengan **App Router** dan memanfaatkan **OpenRouter** sebagai agregator AI untuk mengakses model LLM canggih secara gratis dan efisien.

---

## ✨ Fitur Utama

- **🎙️ Voice-Only Interaction**: Tidak ada input chat teks. Sistem menggunakan **Speech-to-Text (STT)** untuk mendengar user dan **Text-to-Speech (TTS)** untuk menjawab.
- **🛡️ Strict Domain Guardrails**: AI hanya akan menjawab pertanyaan seputar PT Utero Kreatif Indonesia (Layanan, Portofolio, Budaya Kerja, Kontak). Pertanyaan di luar topik (politik, cuaca, koding umum) akan ditolak secara otomatis.
- **🧠 AI Brain via OpenRouter**: Menggunakan model AI gratis dari OpenRouter dengan default **Google Gemma 3**.
- **🇮🇩 Full Indonesian Support**: Dioptimalkan untuk memahami dan merespons dalam Bahasa Indonesia yang natural.
- **🎨 Modern UI/UX**: Tampilan dengan tema merah yang elegan, efek glassmorphism, dan animasi yang smooth.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **AI Provider**: OpenRouter API
- **Voice Processing**:
  - Input: Web Speech API (STT)
  - Output: Web Speech API (TTS)
- **Styling**: Tailwind CSS v4

---

## 🚀 Alur Logika Sistem (System Flow)

Sistem ini menggabungkan interaksi suara dengan kecerdasan buatan yang dibatasi konteksnya.

1. **User Berbicara**: Frontend menangkap suara user dan mengubahnya menjadi teks (STT) melalui Web Speech API.
2. **Context Injection**: Teks user digabungkan dengan **System Prompt** rahasia yang berisi aturan ketat *"Hanya bahas Utero"* beserta informasi lengkap perusahaan.
3. **AI Processing**: API Route mengirim request ke OpenRouter menggunakan model yang ditentukan (default: Google Gemma 3).
4. **Response Generation**: AI menjawab sesuai konteks atau menolak jika di luar topik.
5. **Avatar Speaks**: Jawaban teks dari AI dikonversi kembali menjadi suara (TTS) dan disinkronkan dengan animasi Avatar.

---

**Keterangan:**
- `OPENROUTER_API_KEY` - API Key dari OpenRouter (dapatkan gratis di [openrouter.ai](https://openrouter.ai))
- `NEXT_PUBLIC_SITE_URL` - URL aplikasi Anda (untuk development gunakan localhost)


### A. Model yang Digunakan

Default model yang digunakan adalah **Google Gemma 3** via OpenRouter:

| Model Name | ID OpenRouter |
|------------|---------------|
| **Google Gemma 3** | `google/gemma-3-27b-it:free` |

Model dapat diganti dengan mengubah konstanta `DEFAULT_MODEL` di file `src/constants/ai.ts`.

### B. System Prompt (The Brain)

Logika pembatasan topik ada di file `src/constants/ai.ts`. Kita menggunakan teknik _System Prompting_ untuk mendoktrin AI agar fokus pada topik Utero saja.

System prompt berisi:
- **Informasi Perusahaan**: Profil lengkap, kontak, layanan, dan jam operasional PT Utero Kreatif Indonesia
- **Aturan Fokus Topik**: AI hanya boleh menjawab hal terkait Utero
- **Pembatasan Ketat**: Daftar topik yang dilarang (coding, politik, cuaca, dll)
- **Gaya Bahasa**: Panduan berbahasa Indonesia yang sopan dan profesional
- **Format Output**: Optimalisasi untuk Text-to-Speech (tanpa markdown symbols)
- **Contoh Jawaban**: Template jawaban yang benar dan cara menolak pertanyaan di luar topik

### C. API Route

File `src/app/api/chat/route.ts` berfungsi sebagai proxy ke OpenRouter.

```typescript
// src/app/api/chat/route.ts

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { message, model, history = [] } = body;

    const selectedModel = model || DEFAULT_MODEL;

    // Build messages array with system prompt and history
    const messages = [
        { role: 'system', content: getSystemPrompt() },
        ...history,
        { role: 'user', content: message },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://utero.id',
            'X-Title': 'Utero AI Avatar',
        },
        body: JSON.stringify({
            model: selectedModel,
            messages,
            max_tokens: 500,
            temperature: 0.7,
        }),
    });

    const data = await response.json();
    return NextResponse.json(data);
}
```

---

## 📂 Struktur Folder

```text
utero-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts       # API Route ke OpenRouter
│   │   ├── globals.css            # Global CSS dengan Tailwind
│   │   ├── layout.tsx             # Root layout
│   │   ├── logo.png               # Logo Utero
│   │   └── page.tsx               # Halaman utama
│   ├── components/
│   │   ├── AvatarCanvas.tsx       # Komponen Visual Avatar
│   │   ├── ChatBubble.tsx         # Bubble chat untuk pesan
│   │   ├── VoiceControl.tsx       # Tombol Mic & Status STT
│   │   └── index.ts               # Export barrel
│   ├── constants/
│   │   └── ai.ts                  # System Prompt & AI Config
│   ├── hooks/
│   │   └── useVoiceAI.ts          # Custom hook untuk logic voice AI
│   └── types/
│       └── index.ts               # TypeScript type definitions
├── public/
│   └── [icons & assets]
├── .env.example                   # Contoh environment variables
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts             # (jika ada)
├── tsconfig.json
└── README.md
```

---

## 🎯 Komponen Utama

### 1. `AvatarCanvas.tsx`
Komponen visual avatar yang menampilkan representasi AI. Memiliki animasi berdasarkan state (idle, listening, processing, speaking).

### 2. `VoiceControl.tsx`
Kontrol mikrofon dengan UI yang dinamis. Menampilkan status listening dan transcript secara real-time.

### 3. `ChatBubble.tsx`
Menampilkan riwayat percakapan antara user dan AI dalam format bubble chat.

### 4. `useVoiceAI.ts`
Custom hook yang mengelola:
- Speech Recognition (STT)
- Speech Synthesis (TTS)
- Komunikasi dengan API
- State management untuk voice interaction

---

## 📝 Catatan Pengembangan

- **Audio Permission**: Pastikan browser user memberikan izin akses mikrofon.
- **Latency**: Karena menggunakan layanan free tier OpenRouter, mungkin ada sedikit jeda respon.
- **Browser Support**: Web Speech API (STT/TTS) bekerja paling baik di **Google Chrome** dan **Microsoft Edge**.
- **TTS Optimization**: System prompt sudah dioptimalkan untuk output tanpa markdown symbols, sehingga TTS lebih natural.

---

## 📧 Kontak PT Utero Kreatif Indonesia

- **Telepon**: (0341) 408408
- **Website**: [uteroindonesia.com](https://uteroindonesia.com/)
- **Alamat**: Jl. Bantaran 1 No.25, Tulusrejo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65141

---

Built with ❤️ for **PT Utero Kreatif Indonesia** X **POLINEMA DEV** © 2026
