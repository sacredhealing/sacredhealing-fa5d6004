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


def apply_noise_reduction(audio, sample_rate, reduction_level='medium', preserve_stereo=True):
    """Apply noise reduction using noisereduce - preserves stereo if requested"""
    try:
        is_stereo = len(audio.shape) > 1 and audio.shape[1] >= 2
        
        if preserve_stereo and is_stereo:
            # Process each channel separately to preserve stereo
            left = audio[:, 0]
            right = audio[:, 1]
            
            # Map reduction level to noisereduce parameters (more aggressive for vocal recordings)
            reduction_map = {
                'light': {'stationary': True, 'prop_decrease': 0.4, 'n_std_thresh_stationary': 1.5},
                'medium': {'stationary': True, 'prop_decrease': 0.7, 'n_std_thresh_stationary': 2.0},
                'aggressive': {'stationary': True, 'prop_decrease': 0.95, 'n_std_thresh_stationary': 2.5}
            }
            
            params = reduction_map.get(reduction_level, reduction_map['aggressive'])
            
            # Apply noise reduction to each channel
            left_reduced = nr.reduce_noise(y=left, sr=sample_rate, **params)
            right_reduced = nr.reduce_noise(y=right, sr=sample_rate, **params)
            
            # Combine back to stereo
            reduced = np.column_stack([left_reduced, right_reduced])
            print(f"[NOISE REDUCTION] Applied {reduction_level} noise reduction to stereo channels")
        else:
            # Convert to mono if not preserving stereo
            if is_stereo:
                audio = np.mean(audio, axis=1)
            
            # Map reduction level to noisereduce parameters
            reduction_map = {
                'light': {'stationary': True, 'prop_decrease': 0.4, 'n_std_thresh_stationary': 1.5},
                'medium': {'stationary': True, 'prop_decrease': 0.7, 'n_std_thresh_stationary': 2.0},
                'aggressive': {'stationary': True, 'prop_decrease': 0.95, 'n_std_thresh_stationary': 2.5}
            }
            
            params = reduction_map.get(reduction_level, reduction_map['aggressive'])
            
            # Apply noise reduction
            reduced = nr.reduce_noise(y=audio, sr=sample_rate, **params)
            print(f"[NOISE REDUCTION] Applied {reduction_level} noise reduction to mono audio")
        
        return reduced
    except Exception as e:
        print(f"Noise reduction error: {e}")
        return audio  # Return original if reduction fails


def balance_stereo(audio, sample_rate):
    """Balance stereo audio - center vocals and remove left/right bias from mobile recordings"""
    try:
        # If mono, convert to stereo first
        if len(audio.shape) == 1:
            audio = np.column_stack([audio, audio])
            print(f"[STEREO BALANCE] Converted mono to stereo")
        
        # Ensure we have 2 channels
        if audio.shape[1] < 2:
            audio = np.column_stack([audio[:, 0], audio[:, 0]])
        
        # Get left and right channels
        left = audio[:, 0].copy()
        right = audio[:, 1].copy()
        
        # Calculate RMS levels for better balance detection
        left_rms = np.sqrt(np.mean(left**2))
        right_rms = np.sqrt(np.mean(right**2))
        
        # Calculate peak levels as well
        left_peak = np.abs(left).max()
        right_peak = np.abs(right).max()
        
        print(f"[STEREO BALANCE] Left RMS: {left_rms:.4f}, Right RMS: {right_rms:.4f}")
        print(f"[STEREO BALANCE] Left Peak: {left_peak:.4f}, Right Peak: {right_peak:.4f}")
        
        # Detect if audio is heavily left-biased (common in mobile recordings)
        if left_rms > 0 and right_rms > 0:
            level_ratio = left_rms / right_rms
            
            # If left is significantly louder (ratio > 1.2), balance it
            if level_ratio > 1.2:
                # Calculate balance factor to center the audio
                # We want to reduce left and boost right proportionally
                target_ratio = 1.0  # Perfect balance
                left_gain = target_ratio / level_ratio
                right_gain = level_ratio / target_ratio
                
                # Apply gains (but limit to prevent distortion)
                left_gain = min(left_gain, 1.0)  # Don't boost left
                right_gain = min(right_gain, 2.0)  # Can boost right up to 2x
                
                left = left * left_gain
                right = right * right_gain
                print(f"[STEREO BALANCE] Left-biased audio detected (ratio: {level_ratio:.2f}), balancing...")
                print(f"[STEREO BALANCE] Applied gains - Left: {left_gain:.2f}x, Right: {right_gain:.2f}x")
            # If right is significantly louder (ratio < 0.83), balance it
            elif level_ratio < 0.83:
                target_ratio = 1.0
                left_gain = level_ratio / target_ratio
                right_gain = target_ratio / level_ratio
                
                left_gain = min(left_gain, 2.0)  # Can boost left up to 2x
                right_gain = min(right_gain, 1.0)  # Don't boost right
                
                left = left * left_gain
                right = right * right_gain
                print(f"[STEREO BALANCE] Right-biased audio detected (ratio: {level_ratio:.2f}), balancing...")
                print(f"[STEREO BALANCE] Applied gains - Left: {left_gain:.2f}x, Right: {right_gain:.2f}x")
            else:
                print(f"[STEREO BALANCE] Audio is already balanced (ratio: {level_ratio:.2f})")
        else:
            # If one channel is silent or very quiet, duplicate the active channel
            if left_rms > 0 and right_rms < left_rms * 0.1:
                right = left.copy()
                print(f"[STEREO BALANCE] Right channel silent, duplicating left channel")
            elif right_rms > 0 and left_rms < right_rms * 0.1:
                left = right.copy()
                print(f"[STEREO BALANCE] Left channel silent, duplicating right channel")
            else:
                # Both channels are very quiet, keep as is
                print(f"[STEREO BALANCE] Both channels are quiet, keeping as is")
        
        # Normalize to prevent clipping while maintaining relative levels
        max_val = max(np.abs(left).max(), np.abs(right).max())
        if max_val > 0:
            # Normalize to 95% to prevent clipping
            left = left / max_val * 0.95
            right = right / max_val * 0.95
        
        # Verify final balance
        final_left_rms = np.sqrt(np.mean(left**2))
        final_right_rms = np.sqrt(np.mean(right**2))
        final_ratio = final_left_rms / final_right_rms if final_right_rms > 0 else 1.0
        print(f"[STEREO BALANCE] Final balance - Left RMS: {final_left_rms:.4f}, Right RMS: {final_right_rms:.4f}, Ratio: {final_ratio:.2f}")
        
        # Combine back to stereo
        balanced = np.column_stack([left, right])
        
        return balanced
    except Exception as e:
        print(f"Stereo balancing error: {e}")
        import traceback
        traceback.print_exc()
        return audio  # Return original if balancing fails


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
                      noise_reduction_level=None, sample_rate=44100, is_vocal_recording=False):
    """Process audio file with all effects, including automatic noise reduction and stereo balancing for vocal recordings"""
    try:
        # Load audio - keep stereo if available
        audio, sr = librosa.load(audio_path, sr=sample_rate, mono=False)
        
        # Check if audio is stereo
        is_stereo = len(audio.shape) > 1 and audio.shape[1] >= 2
        
        # For vocal recordings (mobile recordings), always apply noise reduction and stereo balancing
        if is_vocal_recording:
            print(f"[PROCESS] Vocal recording detected - applying automatic noise reduction and stereo balancing")
            
            # First, balance stereo to fix left/right channel issues (preserve stereo)
            if is_stereo:
                audio = balance_stereo(audio, sr)
                print(f"[PROCESS] Stereo balanced - audio is now centered")
            
            # Apply noise reduction while preserving stereo
            reduction_level = noise_reduction_level or 'aggressive'
            audio = apply_noise_reduction(audio, sr, reduction_level, preserve_stereo=True)
            print(f"[PROCESS] Applied noise reduction (level: {reduction_level}) while preserving stereo")
        else:
            # Apply noise reduction if requested
            if noise_reduction_level:
                audio = apply_noise_reduction(audio, sr, noise_reduction_level, preserve_stereo=is_stereo)
        
        # Get audio length for tone generation
        if is_stereo:
            audio_length = len(audio) / sr
            # Use left channel for length calculation
            audio_for_mixing = audio[:, 0]
        else:
            audio_length = len(audio) / sr
            audio_for_mixing = audio
        
        # Generate healing tone
        healing_tone = generate_healing_tone(frequency_hz, audio_length, sr)
        
        # Generate binaural beats if requested
        binaural = None
        if binaural_type != 'none':
            binaural = generate_binaural_beats(frequency_hz, binaural_type, audio_length, sr)
        
        # Mix audio layers - preserve stereo if original was stereo
        if is_stereo:
            # Process stereo audio
            left = audio[:, 0]
            right = audio[:, 1]
            
            # Base audio: 40%
            processed_left = left * 0.4
            processed_right = right * 0.4
            
            # Healing tone: 30% (mono, add to both channels)
            if len(healing_tone) > len(processed_left):
                healing_tone = healing_tone[:len(processed_left)]
            elif len(healing_tone) < len(processed_left):
                healing_tone = np.pad(healing_tone, (0, len(processed_left) - len(healing_tone)))
            processed_left += healing_tone * 0.3
            processed_right += healing_tone * 0.3
            
            # Binaural beats: 30% (if enabled) - use stereo binaural if available
            if binaural is not None:
                if len(binaural.shape) > 1 and binaural.shape[1] >= 2:
                    # Stereo binaural
                    binaural_left = binaural[:, 0]
                    binaural_right = binaural[:, 1]
                else:
                    # Mono binaural
                    binaural_mono = binaural if len(binaural.shape) == 1 else binaural[:, 0]
                    binaural_left = binaural_mono
                    binaural_right = binaural_mono
                
                if len(binaural_left) > len(processed_left):
                    binaural_left = binaural_left[:len(processed_left)]
                    binaural_right = binaural_right[:len(processed_right)]
                elif len(binaural_left) < len(processed_left):
                    pad_len = len(processed_left) - len(binaural_left)
                    binaural_left = np.pad(binaural_left, (0, pad_len))
                    binaural_right = np.pad(binaural_right, (0, pad_len))
                
                processed_left += binaural_left * 0.3
                processed_right += binaural_right * 0.3
            
            # Normalize stereo
            max_val = max(np.abs(processed_left).max(), np.abs(processed_right).max())
            if max_val > 0:
                processed_left = processed_left / max_val * 0.9
                processed_right = processed_right / max_val * 0.9
            
            # Combine back to stereo
            processed_stereo = np.column_stack([processed_left, processed_right])
            print(f"[PROCESS] Output is stereo - balanced and noise-reduced")
        else:
            # Process mono audio
            processed = audio_for_mixing * 0.4
            
            # Healing tone: 30%
            if len(healing_tone) > len(processed):
                healing_tone = healing_tone[:len(processed)]
            elif len(healing_tone) < len(processed):
                healing_tone = np.pad(healing_tone, (0, len(processed) - len(healing_tone)))
            processed += healing_tone * 0.3
            
            # Binaural beats: 30% (if enabled)
            if binaural is not None:
                binaural_mono = np.mean(binaural, axis=1) if len(binaural.shape) > 1 else binaural
                if len(binaural_mono) > len(processed):
                    binaural_mono = binaural_mono[:len(processed)]
                elif len(binaural_mono) < len(processed):
                    binaural_mono = np.pad(binaural_mono, (0, len(processed) - len(binaural_mono)))
                processed += binaural_mono * 0.3
            
            # Normalize
            processed = processed / np.max(np.abs(processed)) * 0.9
            
            # Convert to stereo for output
            processed_stereo = np.column_stack([processed, processed])
            print(f"[PROCESS] Output converted to stereo from mono")
        
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
    """Health check endpoint - responds quickly for cold-start detection"""
    return jsonify({'status': 'healthy', 'service': 'audio-worker', 'version': '2.0'}), 200


@app.route('/ping', methods=['GET'])
def ping():
    """Ultra-light ping for keepalive"""
    return 'pong', 200


def upload_to_supabase(file_path, job_id, supabase_url=None, supabase_key=None):
    """Upload processed file to Supabase storage"""
    try:
        if not supabase_url or not supabase_key:
            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            print(f"[UPLOAD] Supabase credentials not configured")
            return None
        
        # Read file
        with open(file_path, 'rb') as f:
            file_data = f.read()
        
        # Determine content type
        ext = Path(file_path).suffix.lower()
        content_types = {'.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.flac': 'audio/flac'}
        content_type = content_types.get(ext, 'audio/mpeg')
        
        # Upload to Supabase Storage
        storage_path = f"creative-soul-outputs/{job_id}{ext}"
        upload_url = f"{supabase_url}/storage/v1/object/creative-soul-library/{storage_path}"
        
        headers = {
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': content_type,
            'x-upsert': 'true',
        }
        
        response = requests.post(upload_url, headers=headers, data=file_data, timeout=120)
        
        if response.status_code in [200, 201]:
            # Return public URL
            public_url = f"{supabase_url}/storage/v1/object/public/creative-soul-library/{storage_path}"
            print(f"[UPLOAD] Success: {public_url}")
            return public_url
        else:
            print(f"[UPLOAD] Failed ({response.status_code}): {response.text[:200]}")
            return None
            
    except Exception as e:
        print(f"[UPLOAD] Exception: {e}")
        return None


@app.route('/process-audio', methods=['POST'])
def process_audio():
    """Main audio processing endpoint with improved reliability"""
    if not verify_api_key():
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.json
        job_id = data.get('job_id')
        callback_url = data.get('callback_url')
        callback_api_key = data.get('callback_api_key')
        
        if not job_id:
            return jsonify({'error': 'job_id required'}), 400
        
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
        is_vocal_recording = payload.get('is_vocal_recording', False)  # Flag for mobile/vocal recordings
        
        # Process in background thread
        def process_job():
            try:
                # Update status: processing
                send_callback(callback_url, callback_api_key, job_id, 'processing', 5)
                
                # Download audio
                audio_path = None
                if audio_url:
                    audio_path = download_audio(audio_url)
                elif youtube_urls:
                    audio_path = download_audio(youtube_urls[0])
                elif direct_urls:
                    audio_path = download_audio(direct_urls[0])
                
                if not audio_path:
                    raise Exception("No audio source provided or download failed")
                
                send_callback(callback_url, callback_api_key, job_id, 'processing', 25)
                
                # Process audio (with automatic noise reduction and stereo balancing for vocal recordings)
                processed_audio, sr = process_audio_file(
                    audio_path, frequency_hz, binaural or 'none', style, duration, 
                    noise_reduction_level, sample_rate=44100, is_vocal_recording=is_vocal_recording
                )
                
                send_callback(callback_url, callback_api_key, job_id, 'processing', 55)
                
                # Save locally first
                output_path = f"/tmp/{job_id}_output.wav"
                save_audio(processed_audio, sr, output_path)
                
                send_callback(callback_url, callback_api_key, job_id, 'processing', 70)
                
                # Upload to Supabase Storage
                result_url = upload_to_supabase(output_path, job_id)
                
                if not result_url:
                    # Fallback: just report the local path (worker storage)
                    result_url = output_path
                    print(f"[PROCESS] Storage upload failed, using local path")
                
                send_callback(callback_url, callback_api_key, job_id, 'processing', 90)
                
                # Cleanup temp files
                try:
                    if audio_path and os.path.exists(audio_path):
                        os.remove(audio_path)
                    if os.path.exists(output_path):
                        os.remove(output_path)
                except:
                    pass
                
                send_callback(callback_url, callback_api_key, job_id, 'completed', 100, 
                            result_url=result_url)
                
            except Exception as e:
                error_msg = str(e)
                print(f"[PROCESS] Error: {error_msg}")
                send_callback(callback_url, callback_api_key, job_id, 'failed', 0, 
                            error=error_msg[:500])
        
        # Start processing in background
        thread = threading.Thread(target=process_job, daemon=True)
        thread.start()
        
        # Respond immediately so edge function doesn't timeout
        return jsonify({
            'success': True,
            'accepted': True,
            'job_id': job_id,
            'message': 'Processing started'
        }), 202
        
    except Exception as e:
        print(f"[PROCESS] Exception: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print(f"[WORKER] Starting on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)

