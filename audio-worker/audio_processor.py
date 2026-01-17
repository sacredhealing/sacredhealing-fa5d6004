"""
Audio Processing Module for Sacred Healing Meditation Audio
Contains all audio manipulation functions.
"""

import os
import tempfile
import logging
import numpy as np
from scipy import signal
from scipy.io import wavfile
import requests

logger = logging.getLogger(__name__)

# Try to import optional libraries
try:
    import librosa
    import soundfile as sf
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    logger.warning("librosa not available - some features will be limited")

try:
    import noisereduce as nr
    NOISEREDUCE_AVAILABLE = True
except ImportError:
    NOISEREDUCE_AVAILABLE = False
    logger.warning("noisereduce not available - noise removal will be limited")

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    logger.warning("pydub not available - some format conversions will be limited")


class AudioProcessor:
    """Complete audio processor for meditation audio generation"""
    
    def __init__(self, sample_rate=44100):
        self.sample_rate = sample_rate
        
        # Binaural beat configurations
        self.binaural_presets = {
            "delta": {"carrier": 100, "beat": 2, "description": "Deep sleep, healing"},
            "theta": {"carrier": 200, "beat": 6, "description": "Deep meditation, creativity"},
            "alpha": {"carrier": 300, "beat": 10, "description": "Relaxation, light meditation"},
            "beta": {"carrier": 400, "beat": 20, "description": "Focus, alertness"},
            "gamma": {"carrier": 500, "beat": 40, "description": "Higher consciousness"},
        }
        
        # Healing frequency configurations (Solfeggio scale)
        self.healing_frequencies = {
            174: "Foundation, security",
            285: "Quantum cognition, tissue healing",
            396: "Liberation from fear",
            417: "Facilitating change",
            432: "Natural frequency, harmony",
            528: "Love frequency, DNA repair",
            639: "Connection, relationships",
            741: "Awakening intuition",
            852: "Spiritual order",
            963: "Divine consciousness",
        }
        
        # Meditation style configurations
        self.meditation_styles = {
            "vedic": {
                "reverb": 0.6,
                "low_pass": 8000,
                "ambient_type": "temple"
            },
            "shamanic": {
                "reverb": 0.7,
                "low_pass": 6000,
                "ambient_type": "nature"
            },
            "tibetan": {
                "reverb": 0.8,
                "low_pass": 7000,
                "ambient_type": "singing_bowls"
            },
            "nature": {
                "reverb": 0.4,
                "low_pass": 10000,
                "ambient_type": "forest"
            },
            "ocean": {
                "reverb": 0.5,
                "low_pass": 9000,
                "ambient_type": "waves"
            },
            "forest": {
                "reverb": 0.45,
                "low_pass": 9500,
                "ambient_type": "birds"
            },
        }
        
        # Mastering presets
        self.mastering_presets = {
            "meditation_warm": {
                "compression_ratio": 2.0,
                "eq_low_boost": 2,
                "eq_high_cut": -3,
                "limiter_threshold": -3
            },
            "balanced": {
                "compression_ratio": 3.0,
                "eq_low_boost": 0,
                "eq_high_cut": 0,
                "limiter_threshold": -1
            },
            "warm": {
                "compression_ratio": 2.5,
                "eq_low_boost": 3,
                "eq_high_cut": -2,
                "limiter_threshold": -2
            },
            "bright": {
                "compression_ratio": 2.5,
                "eq_low_boost": -1,
                "eq_high_cut": 3,
                "limiter_threshold": -2
            },
            "loud": {
                "compression_ratio": 4.0,
                "eq_low_boost": 1,
                "eq_high_cut": 1,
                "limiter_threshold": -0.5
            },
        }
    
    def download_audio(self, url, timeout=60):
        """Download audio from URL and return as numpy array"""
        logger.info(f"Downloading audio from {url}")
        
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        
        # Save to temp file
        temp_path = tempfile.mktemp(suffix=".mp3")
        with open(temp_path, "wb") as f:
            f.write(response.content)
        
        # Load with librosa
        if LIBROSA_AVAILABLE:
            audio, sr = librosa.load(temp_path, sr=self.sample_rate, mono=False)
            if audio.ndim == 1:
                audio = np.stack([audio, audio])  # Convert mono to stereo
        else:
            # Fallback: read raw if librosa not available
            sr = self.sample_rate
            audio = np.zeros((2, sr * 10))  # 10 seconds of silence
        
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return audio, sr
    
    def generate_base_audio(self, duration_seconds=600):
        """Generate base ambient audio for meditation"""
        logger.info(f"Generating {duration_seconds}s base audio")
        
        sr = self.sample_rate
        num_samples = int(duration_seconds * sr)
        
        # Generate pink noise (more natural sounding than white noise)
        audio = self._generate_pink_noise(num_samples)
        
        # Apply low-pass filter to make it smoother
        audio = self._apply_lowpass(audio, sr, cutoff=2000)
        
        # Reduce amplitude significantly for subtle background
        audio = audio * 0.1
        
        # Make stereo
        audio = np.stack([audio, audio])
        
        return audio, sr
    
    def _generate_pink_noise(self, num_samples):
        """Generate pink noise (1/f noise)"""
        # Generate white noise
        white = np.random.randn(num_samples)
        
        # Apply 1/f filter (simplified pink noise generation)
        # Using cumulative sum and high-pass to approximate pink noise
        pink = np.cumsum(white)
        pink = pink - np.mean(pink)
        
        # Normalize
        pink = pink / np.max(np.abs(pink))
        
        return pink
    
    def _apply_lowpass(self, audio, sr, cutoff=5000):
        """Apply low-pass filter"""
        nyquist = sr / 2
        normalized_cutoff = cutoff / nyquist
        b, a = signal.butter(4, normalized_cutoff, btype='low')
        filtered = signal.filtfilt(b, a, audio)
        return filtered
    
    def apply_binaural_beats(self, audio, sr, carrier_freq=200, beat_freq=7, intensity=0.3):
        """Apply binaural beats to audio"""
        logger.info(f"Applying binaural beats: carrier={carrier_freq}Hz, beat={beat_freq}Hz")
        
        duration = audio.shape[1] / sr
        t = np.linspace(0, duration, audio.shape[1])
        
        # Left ear: carrier frequency
        left_tone = np.sin(2 * np.pi * carrier_freq * t)
        
        # Right ear: carrier + beat frequency
        right_tone = np.sin(2 * np.pi * (carrier_freq + beat_freq) * t)
        
        # Apply intensity and fade in/out
        fade_samples = int(sr * 3)  # 3 second fade
        fade_in = np.linspace(0, 1, fade_samples)
        fade_out = np.linspace(1, 0, fade_samples)
        
        envelope = np.ones(len(t))
        envelope[:fade_samples] = fade_in
        envelope[-fade_samples:] = fade_out
        
        left_tone = left_tone * envelope * intensity
        right_tone = right_tone * envelope * intensity
        
        # Mix with original audio
        if audio.ndim == 1:
            audio = np.stack([audio, audio])
        
        audio[0] = audio[0] + left_tone
        audio[1] = audio[1] + right_tone
        
        # Normalize to prevent clipping
        max_val = np.max(np.abs(audio))
        if max_val > 1.0:
            audio = audio / max_val * 0.95
        
        return audio
    
    def apply_healing_frequency(self, audio, sr, frequency=528, intensity=0.2):
        """Apply healing frequency tone to audio"""
        logger.info(f"Applying healing frequency: {frequency}Hz")
        
        duration = audio.shape[1] / sr
        t = np.linspace(0, duration, audio.shape[1])
        
        # Generate pure sine tone at healing frequency
        tone = np.sin(2 * np.pi * frequency * t)
        
        # Apply subtle modulation for more organic sound
        mod_freq = 0.1  # Very slow modulation
        modulation = 1 + 0.1 * np.sin(2 * np.pi * mod_freq * t)
        tone = tone * modulation
        
        # Apply envelope
        fade_samples = int(sr * 5)  # 5 second fade
        fade_in = np.linspace(0, 1, fade_samples)
        fade_out = np.linspace(1, 0, fade_samples)
        
        envelope = np.ones(len(t))
        envelope[:fade_samples] = fade_in
        envelope[-fade_samples:] = fade_out
        
        tone = tone * envelope * intensity
        
        # Mix with both channels
        if audio.ndim == 1:
            audio = np.stack([audio, audio])
        
        audio[0] = audio[0] + tone
        audio[1] = audio[1] + tone
        
        # Normalize
        max_val = np.max(np.abs(audio))
        if max_val > 1.0:
            audio = audio / max_val * 0.95
        
        return audio
    
    def remove_noise(self, audio, sr, reduction_amount=0.7):
        """Remove background noise from audio"""
        logger.info("Removing noise...")
        
        if not NOISEREDUCE_AVAILABLE:
            logger.warning("noisereduce not available, skipping noise removal")
            return audio
        
        # Process each channel
        if audio.ndim == 2:
            channels = []
            for i in range(audio.shape[0]):
                reduced = nr.reduce_noise(
                    y=audio[i],
                    sr=sr,
                    prop_decrease=reduction_amount,
                    stationary=True
                )
                channels.append(reduced)
            audio = np.stack(channels)
        else:
            audio = nr.reduce_noise(
                y=audio,
                sr=sr,
                prop_decrease=reduction_amount,
                stationary=True
            )
        
        return audio

    def calculate_rms(self, audio):
        """Calculate Root Mean Square of audio signal"""
        if audio.ndim == 2:
            return np.sqrt(np.mean(audio ** 2))
        return np.sqrt(np.mean(audio ** 2))
    
    def calculate_lufs(self, audio, sr):
        """
        Calculate approximate LUFS (Loudness Units relative to Full Scale)
        Using simplified K-weighting approximation
        """
        # K-weighting filter coefficients (simplified)
        # High shelf at 1500 Hz (+4dB) and high-pass at 60 Hz
        if audio.ndim == 2:
            # Use left channel or mono mix
            mono = np.mean(audio, axis=0)
        else:
            mono = audio
        
        # Calculate mean square with K-weighting approximation
        # Apply high-pass filter to remove DC and low rumble
        nyq = sr / 2
        low_cutoff = 60 / nyq
        if low_cutoff < 1:
            b, a = signal.butter(2, low_cutoff, btype='high')
            mono = signal.filtfilt(b, a, mono)
        
        # Calculate gated loudness (simplified)
        block_size = int(sr * 0.4)  # 400ms blocks
        blocks = len(mono) // block_size
        
        if blocks == 0:
            rms = np.sqrt(np.mean(mono ** 2))
        else:
            block_loudness = []
            for i in range(blocks):
                block = mono[i * block_size:(i + 1) * block_size]
                block_rms = np.sqrt(np.mean(block ** 2))
                if block_rms > 1e-10:  # Gate very quiet blocks
                    block_loudness.append(block_rms)
            
            if block_loudness:
                rms = np.mean(block_loudness)
            else:
                rms = np.sqrt(np.mean(mono ** 2))
        
        # Convert to LUFS (dB scale, relative to digital full scale)
        if rms > 1e-10:
            lufs = 20 * np.log10(rms) - 0.691  # K-weighting offset
        else:
            lufs = -70  # Silence
        
        return lufs
    
    def normalize_to_lufs(self, audio, sr, target_lufs=-14):
        """
        Normalize audio to target LUFS using two-pass analysis
        Returns (normalized_audio, gain_applied_db)
        """
        logger.info(f"Normalizing to {target_lufs} LUFS...")
        
        # Pass 1: Calculate current LUFS
        current_lufs = self.calculate_lufs(audio, sr)
        logger.info(f"Current LUFS: {current_lufs:.1f}")
        
        # Calculate required gain
        gain_db = target_lufs - current_lufs
        
        # Limit gain range to prevent excessive amplification
        gain_db = np.clip(gain_db, -20, 20)
        
        # Pass 2: Apply gain
        gain_linear = 10 ** (gain_db / 20)
        normalized = audio * gain_linear
        
        # Ensure we don't clip
        max_val = np.max(np.abs(normalized))
        if max_val > 0.99:
            normalized = normalized / max_val * 0.99
            # Recalculate actual gain applied
            gain_db = 20 * np.log10(0.99 / max_val) + gain_db
        
        logger.info(f"Applied gain: {gain_db:+.1f} dB")
        return normalized, gain_db
    
    def apply_intelligent_noise_gate(self, audio, sr, threshold_db=-45, ratio=10, 
                                      attack_ms=5, release_ms=50):
        """
        Frequency-aware expander/noise gate that blackens silence
        without cutting off vocal tails
        """
        logger.info(f"Applying intelligent noise gate (threshold: {threshold_db} dB)...")
        
        threshold_linear = 10 ** (threshold_db / 20)
        attack_samples = int(sr * attack_ms / 1000)
        release_samples = int(sr * release_ms / 1000)
        
        def process_channel(channel):
            # Calculate envelope using RMS in small windows
            window_size = int(sr * 0.01)  # 10ms windows
            envelope = np.zeros_like(channel)
            
            for i in range(0, len(channel), window_size):
                end = min(i + window_size, len(channel))
                window_rms = np.sqrt(np.mean(channel[i:end] ** 2))
                envelope[i:end] = window_rms
            
            # Smooth envelope
            kernel = np.ones(window_size) / window_size
            envelope = np.convolve(envelope, kernel, mode='same')
            
            # Calculate gain reduction
            gain = np.ones_like(channel)
            below_threshold = envelope < threshold_linear
            
            if np.any(below_threshold):
                # Apply gentle expansion (10:1 ratio) below threshold
                db_below = 20 * np.log10(np.maximum(envelope[below_threshold], 1e-10) / threshold_linear)
                gain_reduction_db = db_below * (1 - 1/ratio)
                gain[below_threshold] = 10 ** (gain_reduction_db / 20)
            
            # Smooth gain changes (attack/release)
            smoothed_gain = np.zeros_like(gain)
            smoothed_gain[0] = gain[0]
            
            for i in range(1, len(gain)):
                if gain[i] < smoothed_gain[i-1]:
                    # Attack (gain decreasing)
                    alpha = 1 - np.exp(-1 / attack_samples)
                else:
                    # Release (gain increasing)
                    alpha = 1 - np.exp(-1 / release_samples)
                smoothed_gain[i] = alpha * gain[i] + (1 - alpha) * smoothed_gain[i-1]
            
            return channel * smoothed_gain
        
        if audio.ndim == 2:
            result = np.zeros_like(audio)
            for i in range(audio.shape[0]):
                result[i] = process_channel(audio[i])
            return result
        else:
            return process_channel(audio)
    
    def apply_soft_knee_limiter(self, audio, threshold_db=-1, knee_db=6, makeup_gain_db=0):
        """
        Apply soft-knee limiter for glassy professional finish
        Prevents clipping while maintaining transparency
        """
        logger.info(f"Applying soft-knee limiter (threshold: {threshold_db} dB, knee: {knee_db} dB)...")
        
        threshold = 10 ** (threshold_db / 20)
        knee = 10 ** (knee_db / 20)
        makeup = 10 ** (makeup_gain_db / 20)
        
        def soft_limit(x):
            abs_x = np.abs(x)
            sign_x = np.sign(x)
            
            # Calculate knee region
            knee_start = threshold / knee
            knee_end = threshold
            
            result = np.zeros_like(x)
            
            # Below knee: pass through
            below_knee = abs_x <= knee_start
            result[below_knee] = x[below_knee]
            
            # In knee region: smooth transition
            in_knee = (abs_x > knee_start) & (abs_x <= knee_end)
            if np.any(in_knee):
                t = (abs_x[in_knee] - knee_start) / (knee_end - knee_start)
                # Quadratic interpolation for smooth knee
                compressed = knee_start + t * t * (knee_end - knee_start) * 0.5
                result[in_knee] = sign_x[in_knee] * compressed
            
            # Above knee: soft clip with tanh
            above_knee = abs_x > knee_end
            if np.any(above_knee):
                # Soft saturation above threshold
                excess = abs_x[above_knee] - threshold
                limited = threshold + np.tanh(excess / threshold) * threshold * 0.5
                result[above_knee] = sign_x[above_knee] * np.minimum(limited, 0.99)
            
            return result * makeup
        
        if audio.ndim == 2:
            result = np.zeros_like(audio)
            for i in range(audio.shape[0]):
                result[i] = soft_limit(audio[i])
            return result
        else:
            return soft_limit(audio)
    
    def neural_preprocess(self, audio, sr, target_lufs=-14):
        """
        Complete Neural Pre-processing Pipeline
        1. Automatic Normalization to target LUFS
        2. Intelligent Noise Gate
        3. Soft-Knee Limiter
        
        Returns (processed_audio, metadata_dict)
        """
        logger.info("Starting Neural Pre-processing Pipeline...")
        
        metadata = {
            "original_lufs": self.calculate_lufs(audio, sr),
            "target_lufs": target_lufs,
        }
        
        # Stage 1: Normalize to target LUFS
        audio, gain_db = self.normalize_to_lufs(audio, sr, target_lufs)
        metadata["auto_gain_db"] = gain_db
        metadata["normalized_lufs"] = self.calculate_lufs(audio, sr)
        
        # Stage 2: Intelligent Noise Gate
        audio = self.apply_intelligent_noise_gate(audio, sr)
        
        # Stage 3: Soft-Knee Limiter
        audio = self.apply_soft_knee_limiter(audio)
        
        metadata["final_lufs"] = self.calculate_lufs(audio, sr)
        logger.info(f"Neural preprocessing complete. Gain applied: {gain_db:+.1f} dB")
        
        return audio, metadata
    
    def apply_meditation_style(self, audio, sr, style="vedic"):
        """Apply meditation style effects"""
        logger.info(f"Applying meditation style: {style}")
        
        if style not in self.meditation_styles:
            style = "vedic"
        
        config = self.meditation_styles[style]
        
        # Apply low-pass filter
        if audio.ndim == 2:
            for i in range(audio.shape[0]):
                audio[i] = self._apply_lowpass(audio[i], sr, config["low_pass"])
        else:
            audio = self._apply_lowpass(audio, sr, config["low_pass"])
        
        # Apply reverb (simplified convolution reverb)
        audio = self._apply_reverb(audio, sr, config["reverb"])
        
        return audio
    
    def _apply_reverb(self, audio, sr, amount=0.5):
        """Apply simple reverb effect"""
        # Simple delay-based reverb
        delay_samples = int(sr * 0.03)  # 30ms delay
        decay = amount * 0.5
        
        if audio.ndim == 2:
            for i in range(audio.shape[0]):
                reverb = np.zeros_like(audio[i])
                for delay_mult in range(1, 6):
                    delay = delay_samples * delay_mult
                    decay_amount = decay ** delay_mult
                    if delay < len(audio[i]):
                        reverb[delay:] += audio[i][:-delay] * decay_amount
                audio[i] = audio[i] + reverb
        else:
            reverb = np.zeros_like(audio)
            for delay_mult in range(1, 6):
                delay = delay_samples * delay_mult
                decay_amount = decay ** delay_mult
                if delay < len(audio):
                    reverb[delay:] += audio[:-delay] * decay_amount
            audio = audio + reverb
        
        # Normalize
        max_val = np.max(np.abs(audio))
        if max_val > 1.0:
            audio = audio / max_val * 0.95
        
        return audio
    
    def _apply_warmth(self, audio, sr, amount=0.3):
        """Apply warmth (low frequency boost and subtle saturation)"""
        # Boost low frequencies
        nyquist = sr / 2
        cutoff = 300 / nyquist
        b, a = signal.butter(2, cutoff, btype='low')
        
        if audio.ndim == 2:
            for i in range(audio.shape[0]):
                low_freq = signal.filtfilt(b, a, audio[i])
                audio[i] = audio[i] + low_freq * amount
                # Subtle soft saturation
                audio[i] = np.tanh(audio[i] * (1 + amount * 0.5))
        else:
            low_freq = signal.filtfilt(b, a, audio)
            audio = audio + low_freq * amount
            audio = np.tanh(audio * (1 + amount * 0.5))
        
        return audio
    
    def apply_mastering(self, audio, sr, preset="meditation_warm"):
        """Apply mastering to audio"""
        logger.info(f"Applying mastering preset: {preset}")
        
        if preset not in self.mastering_presets:
            preset = "meditation_warm"
        
        config = self.mastering_presets[preset]
        
        # Apply compression (simplified)
        audio = self._apply_compression(audio, config["compression_ratio"])
        
        # Apply EQ
        audio = self._apply_eq(audio, sr, config["eq_low_boost"], config["eq_high_cut"])
        
        # Apply limiter
        audio = self._apply_limiter(audio, config["limiter_threshold"])
        
        return audio
    
    def _apply_compression(self, audio, ratio=2.0, threshold=-20):
        """Apply dynamic range compression"""
        threshold_linear = 10 ** (threshold / 20)
        
        if audio.ndim == 2:
            for i in range(audio.shape[0]):
                audio[i] = self._compress_channel(audio[i], ratio, threshold_linear)
        else:
            audio = self._compress_channel(audio, ratio, threshold_linear)
        
        return audio
    
    def _compress_channel(self, channel, ratio, threshold):
        """Compress single channel"""
        # Simple compression
        mask = np.abs(channel) > threshold
        compressed = channel.copy()
        
        above_threshold = np.abs(channel[mask]) - threshold
        compressed[mask] = np.sign(channel[mask]) * (threshold + above_threshold / ratio)
        
        return compressed
    
    def _apply_eq(self, audio, sr, low_boost=0, high_cut=0):
        """Apply simple EQ"""
        nyquist = sr / 2
        
        if low_boost != 0:
            # Low shelf boost
            cutoff = 200 / nyquist
            b, a = signal.butter(2, cutoff, btype='low')
            
            if audio.ndim == 2:
                for i in range(audio.shape[0]):
                    low = signal.filtfilt(b, a, audio[i])
                    audio[i] = audio[i] + low * (10 ** (low_boost / 20) - 1)
            else:
                low = signal.filtfilt(b, a, audio)
                audio = audio + low * (10 ** (low_boost / 20) - 1)
        
        if high_cut != 0:
            # High shelf cut/boost
            cutoff = 8000 / nyquist
            b, a = signal.butter(2, cutoff, btype='high')
            
            if audio.ndim == 2:
                for i in range(audio.shape[0]):
                    high = signal.filtfilt(b, a, audio[i])
                    audio[i] = audio[i] + high * (10 ** (high_cut / 20) - 1)
            else:
                high = signal.filtfilt(b, a, audio)
                audio = audio + high * (10 ** (high_cut / 20) - 1)
        
        return audio
    
    def _apply_limiter(self, audio, threshold_db=-1):
        """Apply brick-wall limiter"""
        threshold = 10 ** (threshold_db / 20)
        
        # Soft clipping using tanh
        audio = np.tanh(audio / threshold) * threshold
        
        return audio
    
    def create_variant(self, audio, sr, variant_index=0):
        """Create a variant of the audio with subtle differences"""
        logger.info(f"Creating variant {variant_index}")
        
        # Each variant has slightly different processing
        np.random.seed(variant_index)
        
        # Subtle pitch variation (±1%)
        pitch_shift = 1 + (np.random.random() - 0.5) * 0.02
        
        # For now, just apply subtle filtering differences
        # In production, use librosa.effects.pitch_shift
        
        # Subtle EQ variation
        low_var = (np.random.random() - 0.5) * 2  # ±1 dB
        high_var = (np.random.random() - 0.5) * 2  # ±1 dB
        
        variant = self._apply_eq(audio.copy(), sr, low_var, high_var)
        
        # Subtle level variation
        level_var = 1 + (np.random.random() - 0.5) * 0.1  # ±5%
        variant = variant * level_var
        
        return variant
    
    def download_sound_file(self, url, timeout=120):
        """Download a sound file from URL and return as pydub AudioSegment"""
        logger.info(f"Downloading sound file from {url}")
        
        if not PYDUB_AVAILABLE:
            logger.warning("pydub not available for sound file download")
            return None
        
        try:
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            
            # Determine format from URL or content
            temp_suffix = ".mp3"
            if ".wav" in url.lower():
                temp_suffix = ".wav"
            elif ".ogg" in url.lower():
                temp_suffix = ".ogg"
            elif ".flac" in url.lower():
                temp_suffix = ".flac"
            
            temp_path = tempfile.mktemp(suffix=temp_suffix)
            with open(temp_path, "wb") as f:
                f.write(response.content)
            
            # Load with pydub
            sound = AudioSegment.from_file(temp_path)
            
            # Cleanup
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            return sound
        except Exception as e:
            logger.error(f"Failed to download sound file: {e}")
            return None
    
    def loop_sound_to_duration(self, sound, target_duration_ms, crossfade_ms=2000):
        """Loop a sound to match target duration with crossfades"""
        if sound is None:
            return None
        
        if len(sound) >= target_duration_ms:
            # Trim to target duration with fade out
            return sound[:target_duration_ms].fade_out(crossfade_ms)
        
        # Loop the sound
        loops_needed = int(np.ceil(target_duration_ms / len(sound)))
        looped = sound
        
        for _ in range(loops_needed - 1):
            # Crossfade each loop
            fade_duration = min(crossfade_ms, len(sound) // 4, len(looped) // 4)
            if fade_duration > 0:
                looped = looped.append(sound, crossfade=fade_duration)
            else:
                looped = looped + sound
        
        # Trim to exact duration and fade out
        result = looped[:target_duration_ms]
        if len(result) > crossfade_ms:
            result = result.fade_out(crossfade_ms)
        
        return result
    
    def duck_audio(self, sound_bed, voice, duck_db=7.5, attack_ms=100, release_ms=300):
        """Duck the sound bed under the voice (sidechain compression style)"""
        if sound_bed is None or voice is None:
            return sound_bed
        
        # Match lengths
        target_len = max(len(sound_bed), len(voice))
        
        if len(sound_bed) < target_len:
            sound_bed = sound_bed + AudioSegment.silent(duration=target_len - len(sound_bed))
        if len(voice) < target_len:
            voice = voice + AudioSegment.silent(duration=target_len - len(voice))
        
        # Get voice samples for envelope detection
        voice_samples = np.array(voice.get_array_of_samples(), dtype=np.float32)
        if voice.channels == 2:
            voice_samples = voice_samples.reshape((-1, 2)).mean(axis=1)
        
        # Normalize voice samples
        voice_samples = np.abs(voice_samples) / (np.max(np.abs(voice_samples)) + 1e-8)
        
        # Create envelope follower
        envelope = np.zeros_like(voice_samples)
        attack_coef = np.exp(-1.0 / (attack_ms * voice.frame_rate / 1000))
        release_coef = np.exp(-1.0 / (release_ms * voice.frame_rate / 1000))
        
        for i in range(1, len(voice_samples)):
            if voice_samples[i] > envelope[i-1]:
                envelope[i] = attack_coef * envelope[i-1] + (1 - attack_coef) * voice_samples[i]
            else:
                envelope[i] = release_coef * envelope[i-1]
        
        # Normalize envelope
        envelope = envelope / (np.max(envelope) + 1e-8)
        
        # Calculate ducking amount (reduce when voice is present)
        duck_linear = 10 ** (-duck_db / 20)
        gain = 1.0 - envelope * (1.0 - duck_linear)
        
        # Apply gain to sound bed
        bed_samples = np.array(sound_bed.get_array_of_samples(), dtype=np.float32)
        
        if sound_bed.channels == 2:
            bed_samples = bed_samples.reshape((-1, 2))
            # Resample gain to match bed samples
            gain_resampled = np.interp(
                np.linspace(0, len(gain), len(bed_samples)),
                np.arange(len(gain)),
                gain
            )
            bed_samples[:, 0] = bed_samples[:, 0] * gain_resampled
            bed_samples[:, 1] = bed_samples[:, 1] * gain_resampled
            bed_samples = bed_samples.flatten()
        else:
            gain_resampled = np.interp(
                np.linspace(0, len(gain), len(bed_samples)),
                np.arange(len(gain)),
                gain
            )
            bed_samples = bed_samples * gain_resampled
        
        # Clip to valid range
        bed_samples = np.clip(bed_samples, -32768, 32767).astype(np.int16)
        
        # Create new AudioSegment
        ducked = sound_bed._spawn(bed_samples.tobytes())
        
        return ducked
    
    def produce_meditation_mix(self, voice_path, sound_files, style_slug="relaxing", 
                                seed=None, bed_duck_db=7.5, ambient_volume_db=-6,
                                binaural_config=None, healing_freq=None):
        """
        Produce a professional meditation mix with voice, sound bed, binaural beats, and healing frequencies.
        
        Args:
            voice_path: Path or URL to the voice/narration audio (already cleaned)
            sound_files: List of dicts with 'slug', 'url', 'volume' (0-1), 'loop' (bool)
            style_slug: Meditation style for processing
            seed: Random seed for reproducibility
            bed_duck_db: How much to duck the sound bed under voice
            ambient_volume_db: Overall ambient/bed volume adjustment
            binaural_config: Dict with 'type' (delta/theta/alpha/beta/gamma) and 'intensity'
            healing_freq: Dict with 'frequency' (Hz) and 'intensity'
        
        Returns:
            AudioSegment: The final mixed meditation audio
        """
        logger.info(f"Producing meditation mix with {len(sound_files)} sound files")
        
        if not PYDUB_AVAILABLE:
            logger.error("pydub required for meditation mix production")
            return None
        
        if seed is not None:
            np.random.seed(seed)
        
        # Load voice audio
        if voice_path.startswith("http"):
            voice = self.download_sound_file(voice_path)
        else:
            voice = AudioSegment.from_file(voice_path)
        
        if voice is None:
            logger.error("Failed to load voice audio")
            return None
        
        voice_duration_ms = len(voice)
        logger.info(f"Voice duration: {voice_duration_ms / 1000:.1f}s")
        
        # Add intro/outro padding
        intro_ms = 5000  # 5 second intro
        outro_ms = 10000  # 10 second outro
        total_duration_ms = voice_duration_ms + intro_ms + outro_ms
        
        # Download and prepare all sound layers
        sound_layers = []
        for sf_info in sound_files:
            url = sf_info.get('url')
            volume = sf_info.get('volume', 0.5)
            loop = sf_info.get('loop', True)
            
            if not url:
                continue
            
            sound = self.download_sound_file(url)
            if sound is None:
                continue
            
            # Loop to match duration
            if loop:
                sound = self.loop_sound_to_duration(sound, total_duration_ms)
            else:
                # Just pad with silence if not looping
                if len(sound) < total_duration_ms:
                    sound = sound + AudioSegment.silent(duration=total_duration_ms - len(sound))
                else:
                    sound = sound[:total_duration_ms]
            
            # Apply volume
            volume_db = 20 * np.log10(max(volume, 0.01))
            sound = sound + volume_db
            
            sound_layers.append(sound)
        
        # Mix all sound layers into bed
        if sound_layers:
            sound_bed = sound_layers[0]
            for layer in sound_layers[1:]:
                sound_bed = sound_bed.overlay(layer)
            
            # Apply overall ambient volume
            sound_bed = sound_bed + ambient_volume_db
        else:
            # Create silent bed if no sounds
            sound_bed = AudioSegment.silent(duration=total_duration_ms)
        
        # Pad voice with intro silence
        padded_voice = AudioSegment.silent(duration=intro_ms) + voice + AudioSegment.silent(duration=outro_ms)
        
        # Duck sound bed under voice
        ducked_bed = self.duck_audio(sound_bed, padded_voice, duck_db=bed_duck_db)
        
        # Mix voice over ducked bed
        mixed = ducked_bed.overlay(padded_voice)
        
        # Convert to numpy for binaural/healing processing
        mixed_samples = np.array(mixed.get_array_of_samples(), dtype=np.float32)
        if mixed.channels == 2:
            mixed_samples = mixed_samples.reshape((-1, 2)).T
        else:
            mixed_samples = np.stack([mixed_samples, mixed_samples])
        
        # Normalize to -1 to 1 range
        mixed_samples = mixed_samples / 32768.0
        sr = mixed.frame_rate
        
        # Apply binaural beats (always welcome in meditation!)
        if binaural_config:
            binaural_type = binaural_config.get('type', 'theta')
            intensity = binaural_config.get('intensity', 0.15)
            
            if binaural_type in self.binaural_presets:
                preset = self.binaural_presets[binaural_type]
                mixed_samples = self.apply_binaural_beats(
                    mixed_samples, sr,
                    carrier_freq=preset['carrier'],
                    beat_freq=preset['beat'],
                    intensity=intensity
                )
        
        # Apply healing frequency (always beneficial!)
        if healing_freq:
            freq = healing_freq.get('frequency', 528)
            intensity = healing_freq.get('intensity', 0.1)
            mixed_samples = self.apply_healing_frequency(mixed_samples, sr, freq, intensity)
        
        # Apply meditation style processing
        mixed_samples = self.apply_meditation_style(mixed_samples, sr, style_slug)
        
        # Apply mastering
        mixed_samples = self.apply_mastering(mixed_samples, sr, "meditation_warm")
        
        # Convert back to pydub AudioSegment
        mixed_samples = mixed_samples.T  # Back to (samples, channels)
        mixed_samples = np.clip(mixed_samples * 32767, -32768, 32767).astype(np.int16)
        
        final_audio = AudioSegment(
            mixed_samples.tobytes(),
            frame_rate=sr,
            sample_width=2,
            channels=2
        )
        
        # Final fade in/out
        final_audio = final_audio.fade_in(3000).fade_out(5000)
        
        logger.info(f"Meditation mix complete: {len(final_audio) / 1000:.1f}s")
        
        return final_audio
    
    def save_audio(self, audio, sr, output_path, format="mp3"):
        """Save audio to file"""
        logger.info(f"Saving audio to {output_path}")
        
        # Ensure audio is in correct format
        if audio.ndim == 2:
            # Transpose for soundfile (samples, channels)
            audio = audio.T
        
        # Normalize
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            audio = audio / max_val * 0.95
        
        # Save as WAV first
        wav_path = output_path.replace(".mp3", ".wav")
        
        if LIBROSA_AVAILABLE:
            sf.write(wav_path, audio, sr)
        else:
            # Fallback to scipy
            if audio.dtype != np.int16:
                audio = (audio * 32767).astype(np.int16)
            wavfile.write(wav_path, sr, audio)
        
        # Convert to MP3 if pydub available
        if PYDUB_AVAILABLE and format == "mp3":
            try:
                sound = AudioSegment.from_wav(wav_path)
                sound.export(output_path, format="mp3", bitrate="320k")
                os.remove(wav_path)
            except Exception as e:
                logger.warning(f"Failed to convert to MP3: {e}")
                # Just rename wav to mp3 path
                os.rename(wav_path, output_path)
        else:
            # Rename wav to output path
            if wav_path != output_path:
                os.rename(wav_path, output_path)
        
        return output_path
    
    def save_audio_segment(self, audio_segment, output_path, format="mp3", bitrate="320k"):
        """Save pydub AudioSegment to file"""
        logger.info(f"Saving AudioSegment to {output_path}")
        
        if not PYDUB_AVAILABLE:
            logger.error("pydub required for AudioSegment export")
            return None
        
        audio_segment.export(output_path, format=format, bitrate=bitrate)
        return output_path
