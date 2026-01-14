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
                "warmth": 0.3,
                "ambient_type": "temple"
            },
            "shamanic": {
                "reverb": 0.7,
                "low_pass": 6000,
                "warmth": 0.4,
                "ambient_type": "nature"
            },
            "tibetan": {
                "reverb": 0.8,
                "low_pass": 7000,
                "warmth": 0.35,
                "ambient_type": "singing_bowls"
            },
            "nature": {
                "reverb": 0.4,
                "low_pass": 10000,
                "warmth": 0.2,
                "ambient_type": "forest"
            },
            "ocean": {
                "reverb": 0.5,
                "low_pass": 9000,
                "warmth": 0.25,
                "ambient_type": "waves"
            },
            "forest": {
                "reverb": 0.45,
                "low_pass": 9500,
                "warmth": 0.22,
                "ambient_type": "birds"
            },
        }
        
        # Mastering presets
        self.mastering_presets = {
            "meditation_warm": {
                "compression_ratio": 2.0,
                "eq_low_boost": 2,
                "eq_high_cut": -3,
                "limiter_threshold": -3,
                "warmth": 0.3
            },
            "balanced": {
                "compression_ratio": 3.0,
                "eq_low_boost": 0,
                "eq_high_cut": 0,
                "limiter_threshold": -1,
                "warmth": 0.1
            },
            "warm": {
                "compression_ratio": 2.5,
                "eq_low_boost": 3,
                "eq_high_cut": -2,
                "limiter_threshold": -2,
                "warmth": 0.4
            },
            "bright": {
                "compression_ratio": 2.5,
                "eq_low_boost": -1,
                "eq_high_cut": 3,
                "limiter_threshold": -2,
                "warmth": 0.05
            },
            "loud": {
                "compression_ratio": 4.0,
                "eq_low_boost": 1,
                "eq_high_cut": 1,
                "limiter_threshold": -0.5,
                "warmth": 0.15
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
        
        # Apply warmth (subtle low frequency boost)
        if config["warmth"] > 0:
            audio = self._apply_warmth(audio, sr, config["warmth"])
        
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
        
        # Apply warmth
        if config["warmth"] > 0:
            audio = self._apply_warmth(audio, sr, config["warmth"])
        
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
                sound.export(output_path, format="mp3", bitrate="192k")
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
