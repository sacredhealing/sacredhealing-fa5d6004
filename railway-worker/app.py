import os
import json
import requests
import numpy as np
import librosa
import soundfile as sf
import noisereduce as nr
from flask import Flask, request, jsonify
from flask_cors import CORS
from pydub import AudioSegment
from pydub.effects import normalize
import tempfile
import threading
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Configuration
API_KEY = os.getenv('AUDIO_WORKER_API_KEY', '')
PORT = int(os.getenv('PORT', 8080))

# Binaural beat frequencies (Hz)
BINAURAL_FREQUENCIES = {
    'delta': 0.5,    # 0.5-4 Hz - Deep sleep
    'theta': 4.0,   # 4-8 Hz - Meditation, deep relaxation
    'alpha': 8.0,   # 8-13 Hz - Light meditation, relaxed awareness
    'beta': 14.0,   # 14-30 Hz - Focus, active thinking
    'gamma': 30.0   # 30-100 Hz - Peak concentration, insight
}

# Solfeggio frequencies (Hz)
SOLFEGGIO_FREQUENCIES = {
    174: 'Foundation - Pain relief, grounding',
    285: 'Quantum cognition - Tissue healing',
    396: 'Liberation - Release fear, guilt',
    417: 'Facilitation - Undoing situations, change',
    432: 'Natural frequency - DNA repair, harmony',
    444: 'Love frequency - Heart coherence',
    528: 'Miracle tone - Transformation, DNA repair',
    639: 'Connection - Relationships, harmony',
    741: 'Expression - Intuition, problem solving',
    777: 'Spiritual awakening - Luck, miracles',
    852: 'Third eye - Intuition, spiritual awareness',
    888: 'Abundance - Prosperity, manifestation',
    936: 'Pineal gland - Connection to source',
    963: 'Crown chakra - Divine connection',
    999: 'Highest consciousness - Completion'
}

# Meditation style presets
MEDITATION_STYLES = {
    'vedic': {
        'elements': ['tanpura_drone', 'temple_bells', 'mantra_chant'],
        'tempo': 60,
        'layers': 3
    },
    'shamanic': {
        'elements': ['frame_drum', 'rattle', 'flute'],
        'tempo': 72,
        'layers': 2
    },
    'tibetan': {
        'elements': ['singing_bowls', 'long_horn', 'overtone_chant'],
        'tempo': 50,
        'layers': 4
    },
    'nature': {
        'elements': ['forest_birds', 'wind', 'rustling_leaves'],
        'tempo': 0,
        'layers': 3
    },
    'ocean': {
        'elements': ['ocean_waves', 'seagulls', 'distant_thunder'],
        'tempo': 0,
        'layers': 2
    },
    'forest': {
        'elements': ['birdsong', 'rustling_leaves', 'stream'],
        'tempo': 0,
        'layers': 3
    },
    'indian-vedic': {
        'elements': ['tanpura_drone', 'temple_bells', 'mantra_chant'],
        'tempo': 60,
        'layers': 3
    },
    'shamanic': {
        'elements': ['frame_drum', 'rattle', 'flute'],
        'tempo': 72,
        'layers': 2
    },
    'mystic': {
        'elements': ['etheric_pads', 'choirs', 'cosmic_textures'],
        'tempo': 55,
        'layers': 4
    },
    'tibetan': {
        'elements': ['singing_bowls', 'long_horn', 'overtone_chant'],
        'tempo': 50,
        'layers': 4
    },
    'sufi': {
        'elements': ['whirling_rhythms', 'ney_flute', 'devotion'],
        'tempo': 65,
        'layers': 3
    },
    'zen': {
        'elements': ['minimal_ambience', 'breath_awareness'],
        'tempo': 0,
        'layers': 2
    },
    'nature-healing': {
        'elements': ['forest_birds', 'wind', 'rustling_leaves'],
        'tempo': 0,
        'layers': 3
    },
    'ocean-water': {
        'elements': ['ocean_waves', 'seagulls', 'distant_thunder'],
        'tempo': 0,
        'layers': 2
    },
    'sound-bath': {
        'elements': ['gongs', 'crystal_bowls', 'harmonic_overtones'],
        'tempo': 0,
        'layers': 5
    },
    'chakra-balancing': {
        'elements': ['layered_tones', 'chakra_frequencies'],
        'tempo': 0,
        'layers': 7
    },
    'higher-consciousness': {
        'elements': ['cosmic_tones', 'transcendence'],
        'tempo': 0,
        'layers': 4
    },
    'relaxing': {
        'elements': ['gentle_ambient', 'soft_pads'],
        'tempo': 0,
        'layers': 2
    },
    'forest': {
        'elements': ['birdsong', 'rustling_leaves', 'stream'],
        'tempo': 0,
        'layers': 3
    },
    'breath-focus': {
        'elements': ['minimal', 'breath_guiding'],
        'tempo': 0,
        'layers': 1
    },
    'kundalini-energy': {
        'elements': ['rising_energy', 'activation_tones'],
        'tempo': 70,
        'layers': 3
    }
}


def verify_api_key():
    """Verify API key from request headers"""
    if not API_KEY:
        return True  # Allow if no key configured (development)
    # Check both header names for compatibility
    api_key = request.headers.get('X-Worker-Key', '') or request.headers.get('x-api-key', '')
    return api_key == API_KEY


def generate_binaural_beats(frequency_hz, binaural_type, duration_seconds, sample_rate=44100):
    """Generate binaural beats"""
    if not binaural_type or binaural_type.lower() == 'none':
        return None
    
    beat_freq = BINAURAL_FREQUENCIES.get(binaural_type.lower(), 4.0)
    carrier_freq = frequency_hz
    
    # Left ear: carrier frequency
    # Right ear: carrier frequency + beat frequency
    t = np.linspace(0, duration_seconds, int(sample_rate * duration_seconds))
    
    left = np.sin(2 * np.pi * carrier_freq * t)
    right = np.sin(2 * np.pi * (carrier_freq + beat_freq) * t)
    
    # Combine into stereo
    binaural = np.column_stack([left, right])
    
    # Normalize
    max_val = np.max(np.abs(binaural))
    if max_val > 0:
        binaural = binaural / max_val * 0.3  # 30% volume
    
    return binaural


def generate_healing_tone(frequency_hz, duration_seconds, sample_rate=44100):
    """Generate pure tone at healing frequency"""
    t = np.linspace(0, duration_seconds, int(sample_rate * duration_seconds))
    
    # Generate sine wave with gentle fade in/out
    tone = np.sin(2 * np.pi * frequency_hz * t)
    
    # Apply fade envelope
    fade_samples = int(sample_rate * 0.5)  # 0.5 second fade
    fade_in = np.linspace(0, 1, fade_samples)
    fade_out = np.linspace(1, 0, fade_samples)
    
    tone[:fade_samples] *= fade_in
    tone[-fade_samples:] *= fade_out
    
    # Normalize
    tone = tone / np.max(np.abs(tone)) * 0.2  # 20% volume
    
    return tone


def apply_noise_reduction(audio, sample_rate, reduction_level='medium'):
    """Apply noise reduction using noisereduce"""
    try:
        # Convert to mono if stereo
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)
        
        # Map reduction level to noisereduce parameters
        reduction_map = {
            'light': {'stationary': True, 'prop_decrease': 0.3},
            'medium': {'stationary': True, 'prop_decrease': 0.6},
            'aggressive': {'stationary': True, 'prop_decrease': 0.9}
        }
        
        params = reduction_map.get(reduction_level, reduction_map['medium'])
        
        # Apply noise reduction
        reduced = nr.reduce_noise(y=audio, sr=sample_rate, **params)
        
        return reduced
    except Exception as e:
        print(f"Noise reduction error: {e}")
        return audio  # Return original if reduction fails


def download_audio(url):
    """Download audio from URL or YouTube"""
    try:
        # Check if YouTube URL
        if 'youtube.com' in url or 'youtu.be' in url:
            import yt_dlp
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': '%(id)s.%(ext)s',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'wav',
                    'preferredquality': '192',
                }],
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info).replace('.webm', '.wav').replace('.m4a', '.wav')
                return filename
        else:
            # Direct download
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            # Save to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                return f.name
    except Exception as e:
        print(f"Download error: {e}")
        return None


def process_audio_file(audio_path, frequency_hz, binaural_type, style, duration, 
                      noise_reduction_level=None, sample_rate=44100):
    """Process audio file with all effects"""
    try:
        # Load audio
        audio, sr = librosa.load(audio_path, sr=sample_rate, mono=False)
        
        # Convert to mono if needed for processing
        if len(audio.shape) > 1:
            audio_mono = np.mean(audio, axis=0)
        else:
            audio_mono = audio
        
        # Apply noise reduction if requested
        if noise_reduction_level:
            audio_mono = apply_noise_reduction(audio_mono, sr, noise_reduction_level)
        
        # Generate healing tone
        healing_tone = generate_healing_tone(frequency_hz, len(audio_mono) / sr, sr)
        
        # Generate binaural beats if requested
        binaural = None
        if binaural_type != 'none':
            binaural = generate_binaural_beats(frequency_hz, binaural_type, 
                                              len(audio_mono) / sr, sr)
        
        # Mix audio layers
        # Base audio: 40%
        processed = audio_mono * 0.4
        
        # Healing tone: 30%
        if len(healing_tone) > len(processed):
            healing_tone = healing_tone[:len(processed)]
        elif len(healing_tone) < len(processed):
            healing_tone = np.pad(healing_tone, (0, len(processed) - len(healing_tone)))
        processed += healing_tone * 0.3
        
        # Binaural beats: 30% (if enabled)
        if binaural is not None:
            binaural_mono = np.mean(binaural, axis=1)
            if len(binaural_mono) > len(processed):
                binaural_mono = binaural_mono[:len(processed)]
            elif len(binaural_mono) < len(processed):
                binaural_mono = np.pad(binaural_mono, (0, len(processed) - len(binaural_mono)))
            processed += binaural_mono * 0.3
        
        # Normalize
        processed = processed / np.max(np.abs(processed)) * 0.9
        
        # Convert back to stereo
        processed_stereo = np.column_stack([processed, processed])
        
        return processed_stereo, sr
        
    except Exception as e:
        print(f"Audio processing error: {e}")
        raise


def save_audio(audio, sample_rate, output_path):
    """Save audio to file"""
    try:
        sf.write(output_path, audio, sample_rate)
        return True
    except Exception as e:
        print(f"Save error: {e}")
        return False


def send_callback(callback_url, callback_api_key, job_id, status, progress, result_url=None, error=None):
    """Send callback to Supabase edge function"""
    try:
        payload = {
            'job_id': job_id,
            'status': status,
            'progress': progress,
            'result_url': result_url,
            'error': error
        }
        
        headers = {
            'Content-Type': 'application/json',
            'x-worker-api-key': callback_api_key
        }
        
        response = requests.post(callback_url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Callback error: {e}")
        return False


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'audio-worker'}), 200


@app.route('/process-audio', methods=['POST'])
def process_audio():
    """Main audio processing endpoint"""
    if not verify_api_key():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        job_id = data.get('job_id')
        callback_url = data.get('callback_url')
        callback_api_key = data.get('callback_api_key')
        
        # Extract parameters
        payload = data.get('payload', {})
        frequency_hz = payload.get('frequency_hz', 432)
        binaural = payload.get('binaural', 'none')
        style = payload.get('style', 'nature-healing')
        duration = payload.get('duration', 30)
        variants = payload.get('variants', 1)
        audio_url = payload.get('audioUrl')
        youtube_urls = payload.get('youtube_urls', [])
        direct_urls = payload.get('direct_urls', [])
        noise_reduction_level = payload.get('noise_reduction_level')
        mastering_enabled = payload.get('mastering_enabled', False)
        mastering_preset = payload.get('mastering_preset', 'balanced')
        
        # Process in background thread
        def process_job():
            try:
                # Update status: processing
                send_callback(callback_url, callback_api_key, job_id, 'processing', 10)
                
                # Download audio
                audio_path = None
                if audio_url:
                    audio_path = download_audio(audio_url)
                elif youtube_urls:
                    audio_path = download_audio(youtube_urls[0])
                elif direct_urls:
                    audio_path = download_audio(direct_urls[0])
                
                if not audio_path:
                    raise Exception("No audio source provided")
                
                send_callback(callback_url, callback_api_key, job_id, 'processing', 30)
                
                # Process audio
                processed_audio, sr = process_audio_file(
                    audio_path, frequency_hz, binaural or 'none', style, duration, noise_reduction_level
                )
                
                send_callback(callback_url, callback_api_key, job_id, 'processing', 60)
                
                # Generate variants
                output_files = []
                for i in range(variants):
                    # Save variant
                    output_path = f"/tmp/{job_id}_variant_{i+1}.wav"
                    save_audio(processed_audio, sr, output_path)
                    output_files.append(output_path)
                
                send_callback(callback_url, callback_api_key, job_id, 'processing', 80)
                
                # TODO: Apply LANDR mastering if enabled
                if mastering_enabled:
                    # This would call LANDR API
                    pass
                
                # Upload to storage (this would be implemented based on your storage solution)
                # For now, return file paths
                result_urls = output_files
                
                send_callback(callback_url, callback_api_key, job_id, 'completed', 100, 
                            result_url=result_urls[0] if result_urls else None)
                
            except Exception as e:
                error_msg = str(e)
                print(f"Processing error: {error_msg}")
                send_callback(callback_url, callback_api_key, job_id, 'failed', 0, 
                            error=error_msg)
        
        # Start processing in background
        thread = threading.Thread(target=process_job)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'message': 'Processing started'
        }), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=False)

