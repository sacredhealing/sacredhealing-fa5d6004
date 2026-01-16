"""
Sacred Healing Audio Worker
Complete audio processing service for meditation audio generation.
Deploy to Railway, Render, or Fly.io

SIMPLIFIED ARCHITECTURE:
- Only requires WORKER_API_KEY environment variable
- Returns processed audio as base64 (no Supabase upload)
- Edge function handles storage upload
"""

import os
import uuid
import json
import logging
import tempfile
import threading
import base64
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration - Only API key required!
API_KEY = os.environ.get("WORKER_API_KEY", "your-secret-key")

# Job storage (in production, use Redis or database)
jobs = {}


def validate_api_key(req):
    """Validate API key from request headers"""
    key = (
        req.headers.get("X-Worker-Key") or
        req.headers.get("x-api-key") or
        req.headers.get("Authorization", "").replace("Bearer ", "")
    )
    return key == API_KEY


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})


@app.route("/", methods=["GET"])
def root():
    """Root endpoint"""
    return jsonify({
        "service": "Sacred Healing Audio Worker",
        "version": "2.1.0",
        "mode": "direct-response",
        "endpoints": ["/health", "/process", "/process-audio", "/render", "/jobs/<job_id>"]
    })


@app.route("/process", methods=["POST"])
@app.route("/process-audio", methods=["POST"])
def process_audio():
    """Main audio processing endpoint"""
    
    # Validate API key
    if not validate_api_key(request):
        return jsonify({"message": "Invalid API key"}), 401
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        job_id = data.get("job_id", str(uuid.uuid4()))
        user_id = data.get("user_id")
        mode = data.get("mode", "generate")
        payload = data.get("payload", {})
        respond_immediately = data.get("respond_immediately", True)
        callback_url = data.get("callback_url")
        callback_api_key = data.get("callback_api_key")
        
        logger.info(f"Received job {job_id} for user {user_id}, mode: {mode}")
        
        # Store job
        jobs[job_id] = {
            "id": job_id,
            "status": "processing",
            "progress": 0,
            "created_at": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "mode": mode,
            "payload": payload,
            "callback_url": callback_url,
            "callback_api_key": callback_api_key
        }
        
        if respond_immediately:
            # Process async in background thread
            thread = threading.Thread(
                target=process_job_async,
                args=(job_id, user_id, mode, payload, callback_url, callback_api_key)
            )
            thread.start()
            
            return jsonify({
                "accepted": True,
                "status": "accepted",
                "job_id": job_id,
                "message": "Job accepted for processing"
            })
        else:
            # Process synchronously and return audio data directly
            result = process_job_sync(job_id, user_id, mode, payload)
            return jsonify(result)
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/render", methods=["POST", "OPTIONS"])
def render_to_mp3():
    """
    Convert WAV to MP3 endpoint.
    Accepts: JSON with { audio_base64: string, format: 'wav', output_format: 'mp3', bitrate: 320 }
    Returns: { audio_base64: string (MP3 data) }
    """
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return jsonify({}), 200
    
    # Validate API key
    if not validate_api_key(request):
        return jsonify({"message": "Invalid API key"}), 401
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        audio_base64 = data.get("audio_base64")
        input_format = data.get("format", "wav")
        output_format = data.get("output_format", "mp3")
        bitrate = data.get("bitrate", 320)
        
        if not audio_base64:
            return jsonify({"error": "No audio_base64 provided"}), 400
        
        logger.info(f"Render request: {input_format} -> {output_format} at {bitrate}kbps")
        
        # Decode base64 input
        try:
            audio_bytes = base64.b64decode(audio_base64)
        except Exception as e:
            return jsonify({"error": f"Invalid base64 data: {str(e)}"}), 400
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(suffix=f".{input_format}", delete=False) as input_file:
            input_file.write(audio_bytes)
            input_path = input_file.name
        
        output_path = tempfile.mktemp(suffix=f".{output_format}")
        
        try:
            # Try using pydub for conversion (requires ffmpeg)
            try:
                from pydub import AudioSegment
                
                logger.info(f"Converting with pydub: {input_path} -> {output_path}")
                audio = AudioSegment.from_file(input_path, format=input_format)
                
                # Export as MP3
                audio.export(output_path, format=output_format, bitrate=f"{bitrate}k")
                
            except ImportError:
                # Fallback: try using ffmpeg directly
                import subprocess
                
                logger.info(f"Converting with ffmpeg: {input_path} -> {output_path}")
                result = subprocess.run([
                    "ffmpeg", "-y", "-i", input_path,
                    "-acodec", "libmp3lame",
                    "-b:a", f"{bitrate}k",
                    output_path
                ], capture_output=True, text=True)
                
                if result.returncode != 0:
                    raise Exception(f"FFmpeg error: {result.stderr}")
            
            # Read the converted file
            with open(output_path, "rb") as f:
                mp3_bytes = f.read()
            
            mp3_base64 = base64.b64encode(mp3_bytes).decode("utf-8")
            
            logger.info(f"Conversion successful: {len(audio_bytes)} bytes -> {len(mp3_bytes)} bytes")
            
            return jsonify({
                "success": True,
                "audio_base64": mp3_base64,
                "format": output_format,
                "size_bytes": len(mp3_bytes)
            })
            
        finally:
            # Clean up temp files
            if os.path.exists(input_path):
                os.remove(input_path)
            if os.path.exists(output_path):
                os.remove(output_path)
                
    except Exception as e:
        logger.error(f"Render error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/jobs/<job_id>", methods=["GET"])
def get_job_status(job_id):
    """Get job status"""
    if not validate_api_key(request):
        return jsonify({"message": "Invalid API key"}), 401
    
    job = jobs.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    return jsonify(job)


def process_job_async(job_id, user_id, mode, payload, callback_url=None, callback_api_key=None):
    """Process job asynchronously and send callback when done"""
    try:
        result = process_job_sync(job_id, user_id, mode, payload)
        jobs[job_id]["status"] = "done"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["outputs"] = result.get("outputs", {})
        
        # Send callback with audio data
        if callback_url:
            send_callback(callback_url, callback_api_key, job_id, "completed", result.get("outputs", {}))
        
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}")
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)
        
        if callback_url:
            send_callback(callback_url, callback_api_key, job_id, "failed", error=str(e))


def process_job_sync(job_id, user_id, mode, payload):
    """Process job synchronously and return audio as base64"""
    logger.info(f"Processing job {job_id}")
    
    outputs = {}
    
    try:
        # Import audio processing modules
        from audio_processor import AudioProcessor
        processor = AudioProcessor()
        
        # Update progress
        update_progress(job_id, 10, "Initializing...")
        
        # Get source audio
        source_url = payload.get("source_audio_url") or payload.get("source", {}).get("url")
        
        if source_url:
            update_progress(job_id, 20, "Downloading source audio...")
            audio_data, sr = processor.download_audio(source_url)
        else:
            update_progress(job_id, 20, "Generating base audio...")
            duration = payload.get("duration_seconds", payload.get("duration", 600))
            audio_data, sr = processor.generate_base_audio(duration)
        
        # Apply binaural beats if requested
        binaural = payload.get("binaural")
        if binaural and binaural.get("enabled"):
            update_progress(job_id, 30, "Applying binaural beats...")
            audio_data = processor.apply_binaural_beats(
                audio_data, sr,
                carrier_freq=binaural.get("carrier_hz", 200),
                beat_freq=binaural.get("beat_hz", 7),
                intensity=binaural.get("volume", 0.3)
            )
        
        # Apply healing frequency if requested
        healing_freq = payload.get("healing_frequency")
        if healing_freq and healing_freq.get("enabled"):
            update_progress(job_id, 40, "Adding healing frequency...")
            audio_data = processor.apply_healing_frequency(
                audio_data, sr,
                frequency=healing_freq.get("hz", 528),
                intensity=healing_freq.get("volume", 0.2)
            )
        
        # Apply noise removal if requested
        if payload.get("noise_reduction", {}).get("enabled"):
            update_progress(job_id, 50, "Removing noise...")
            audio_data = processor.remove_noise(audio_data, sr)
        
        # Apply meditation style effects
        style = payload.get("meditation_style") or payload.get("ambient", {}).get("sounds")
        if style:
            update_progress(job_id, 60, f"Applying meditation style...")
            style_name = style if isinstance(style, str) else "ambient"
            audio_data = processor.apply_meditation_style(audio_data, sr, style_name)
        
        # Apply mastering if requested
        mastering = payload.get("mastering")
        if mastering and mastering.get("enabled"):
            update_progress(job_id, 70, "Mastering audio...")
            preset = mastering.get("preset", "meditation_warm")
            audio_data = processor.apply_mastering(audio_data, sr, preset)
        
        # Generate variants if requested
        num_variants = payload.get("variants", 1)
        update_progress(job_id, 80, f"Generating {num_variants} variant(s)...")
        
        variants = []
        for i in range(num_variants):
            variant_audio = processor.create_variant(audio_data, sr, i)
            
            # Save to temp file
            temp_path = tempfile.mktemp(suffix=".mp3")
            processor.save_audio(variant_audio, sr, temp_path)
            
            # Read file and encode as base64
            with open(temp_path, "rb") as f:
                audio_bytes = f.read()
            
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            
            variants.append({
                "variant_index": i,
                "audio_base64": audio_base64,
                "duration_seconds": len(variant_audio) / sr,
                "content_type": "audio/mpeg"
            })
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
        update_progress(job_id, 100, "Complete!")
        
        outputs = {
            "variants": variants,
            "primary_audio_base64": variants[0]["audio_base64"] if variants else None,
            "duration_seconds": len(audio_data) / sr,
            "sample_rate": sr,
            "content_type": "audio/mpeg",
            "processing_applied": {
                "binaural_beats": binaural.get("enabled", False) if binaural else False,
                "healing_frequency": healing_freq.get("enabled", False) if healing_freq else False,
                "noise_removal": payload.get("noise_reduction", {}).get("enabled", False),
                "mastering": mastering.get("enabled", False) if mastering else False,
                "meditation_style": style if isinstance(style, str) else None
            }
        }
        
    except ImportError as e:
        logger.warning(f"Audio processor not available: {e}, using mock response")
        # Return mock data for testing
        outputs = generate_mock_outputs(payload)
    
    return {
        "success": True,
        "job_id": job_id,
        "status": "done",
        "outputs": outputs
    }


def generate_mock_outputs(payload):
    """Generate mock outputs for testing when audio libraries aren't available"""
    duration = payload.get("duration_seconds", payload.get("duration", 600))
    num_variants = payload.get("variants", 1)
    
    # Generate a tiny silent MP3 for testing (minimal base64)
    # This is a valid 1-second silent MP3
    mock_mp3_base64 = "//uQxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=="
    
    variants = []
    for i in range(num_variants):
        variants.append({
            "variant_index": i,
            "audio_base64": mock_mp3_base64,
            "duration_seconds": duration,
            "content_type": "audio/mpeg"
        })
    
    return {
        "variants": variants,
        "primary_audio_base64": mock_mp3_base64,
        "duration_seconds": duration,
        "sample_rate": 44100,
        "content_type": "audio/mpeg",
        "mock": True,
        "message": "Mock output - install audio libraries for real processing"
    }


def update_progress(job_id, progress, message=""):
    """Update job progress"""
    if job_id in jobs:
        jobs[job_id]["progress"] = progress
        jobs[job_id]["status_message"] = message
        logger.info(f"Job {job_id}: {progress}% - {message}")


def send_callback(callback_url, callback_api_key, job_id, status, outputs=None, error=None):
    """Send callback to notify job completion with audio data"""
    if not callback_url:
        return
    
    try:
        headers = {
            "Content-Type": "application/json",
            "x-worker-api-key": callback_api_key or API_KEY
        }
        
        data = {
            "job_id": job_id,
            "status": status,
            "outputs": outputs,
            "error": error
        }
        
        response = requests.post(callback_url, json=data, headers=headers, timeout=30)
        logger.info(f"Callback sent for job {job_id}: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send callback: {e}")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
