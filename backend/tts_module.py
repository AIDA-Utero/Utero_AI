"""
TTS Module - Modul Text-to-Speech Modular
==========================================
Modul ini dapat digunakan kembali di proyek lain.

Dependencies:
- gTTS (Google Text-to-Speech)
- pydub (Audio processing - optional, untuk konversi format)

Install:
    pip install gTTS pydub

Usage:
    from tts_module import TTSEngine, text_to_speech
    
    # Method 1: Using class
    engine = TTSEngine(lang='id')
    engine.generate_audio("Halo dunia!", "output.mp3")
    
    # Method 2: Using helper function
    text_to_speech("Halo dunia!", "output.mp3", lang="id")
"""

import os
import uuid
import hashlib
from pathlib import Path
from typing import Optional
from gtts import gTTS


class TTSEngine:
    """
    Engine TTS yang stabil menggunakan Google TTS.
    Mendukung caching audio untuk efisiensi.
    """
    
    def __init__(self, lang: str = 'id', slow: bool = False, cache_dir: Optional[str] = None):
        """
        Initialize TTSEngine.
        
        Args:
            lang: Kode bahasa (default: 'id' untuk Indonesia)
            slow: Bicara lambat atau normal (default: False)
            cache_dir: Direktori untuk cache audio (optional)
        """
        self.lang = lang
        self.slow = slow
        
        # Setup cache directory
        if cache_dir:
            self.cache_dir = Path(cache_dir)
        else:
            self.cache_dir = Path(__file__).parent / "audio_cache"
        
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Output directory for generated files
        self.output_dir = Path(__file__).parent / "audio_output"
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_cache_key(self, text: str) -> str:
        """Generate cache key dari text."""
        # Create hash dari text + lang + slow untuk unique key
        content = f"{text}_{self.lang}_{self.slow}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _get_cached_path(self, text: str) -> Optional[Path]:
        """Check if audio sudah di-cache."""
        cache_key = self._get_cache_key(text)
        cache_path = self.cache_dir / f"{cache_key}.mp3"
        
        if cache_path.exists():
            return cache_path
        return None
    
    def generate_audio(self, text: str, output_path: Optional[str] = None, use_cache: bool = True) -> Optional[str]:
        """
        Mengubah teks menjadi file audio (.mp3).
        
        Args:
            text: Teks yang akan diubah menjadi audio
            output_path: Path output file (optional, akan di-generate jika tidak ada)
            use_cache: Gunakan cache jika tersedia (default: True)
        
        Returns:
            Path ke file audio yang dihasilkan, atau None jika gagal
        """
        try:
            if not text or not text.strip():
                raise ValueError("Teks kosong atau hanya whitespace")
            
            # Clean text
            text = text.strip()
            
            print(f"🔊 TTS Generating: {text[:50]}...")
            
            # Check cache first
            if use_cache:
                cached_path = self._get_cached_path(text)
                if cached_path:
                    print(f"✅ Audio from cache: {cached_path}")
                    # If specific output path requested, copy from cache
                    if output_path:
                        import shutil
                        shutil.copy(cached_path, output_path)
                        return output_path
                    return str(cached_path)
            
            # Generate output path if not provided
            if not output_path:
                unique_id = str(uuid.uuid4())[:8]
                output_path = str(self.output_dir / f"tts_{unique_id}.mp3")
            
            # Menggunakan Google TTS (Stabil & Hasil Natural)
            tts = gTTS(text=text, lang=self.lang, slow=self.slow)
            tts.save(output_path)
            
            # Save to cache
            if use_cache:
                cache_key = self._get_cache_key(text)
                cache_path = self.cache_dir / f"{cache_key}.mp3"
                import shutil
                shutil.copy(output_path, cache_path)
            
            print(f"✅ Audio saved: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ Error TTS: {e}")
            return None
    
    def clean_cache(self, max_files: int = 100):
        """
        Bersihkan cache jika melebihi jumlah file tertentu.
        Menghapus file paling lama.
        """
        try:
            cache_files = list(self.cache_dir.glob("*.mp3"))
            
            if len(cache_files) > max_files:
                # Sort by modification time (oldest first)
                cache_files.sort(key=lambda f: f.stat().st_mtime)
                
                # Remove oldest files
                files_to_remove = len(cache_files) - max_files
                for f in cache_files[:files_to_remove]:
                    f.unlink()
                    print(f"🗑️ Removed cache: {f.name}")
                    
        except Exception as e:
            print(f"❌ Error cleaning cache: {e}")
    
    def clean_output(self, max_age_hours: int = 1):
        """
        Bersihkan file output yang lebih lama dari max_age_hours.
        """
        import time
        
        try:
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            
            for f in self.output_dir.glob("*.mp3"):
                file_age = current_time - f.stat().st_mtime
                if file_age > max_age_seconds:
                    f.unlink()
                    print(f"🗑️ Removed old output: {f.name}")
                    
        except Exception as e:
            print(f"❌ Error cleaning output: {e}")


# ========================================
# Helper Functions untuk kemudahan
# ========================================

def text_to_speech(text: str, output_file: str = "output.mp3", lang: str = "id", slow: bool = False) -> Optional[str]:
    """
    Helper function untuk konversi text ke speech.
    
    Args:
        text: Teks yang akan diubah
        output_file: Nama file output
        lang: Kode bahasa (default: 'id')
        slow: Bicara lambat (default: False)
    
    Returns:
        Path ke file audio, atau None jika gagal
    """
    engine = TTSEngine(lang=lang, slow=slow)
    return engine.generate_audio(text, output_file)


# ========================================
# Test Code
# ========================================

if __name__ == "__main__":
    # Test TTS
    print("=" * 50)
    print("Testing TTS Module")
    print("=" * 50)
    
    test_text = "Halo, saya adalah Utero, asisten AI yang siap membantu Anda."
    
    # Test using class
    engine = TTSEngine(lang='id')
    result = engine.generate_audio(test_text)
    
    if result:
        print(f"\n✅ Test passed! Audio file: {result}")
    else:
        print("\n❌ Test failed!")
