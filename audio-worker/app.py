"""
Sacred Healing Audio Worker
Complete audio processing service for meditation audio generation.
Deploy to Railway, Render, or Fly.io
"""

import os
import uuid
import json
import logging
import tempfile
import threading
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

# Configuration
API_KEY = os.environ.get("WORKER_API_KEY", "your-secret-key")
CALLBACK_URL = os.environ.get("CALLBACK_URL", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

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
        "version": "1.0.0",
        "endpoints": ["/health", "/process", "/process-audio", "/jobs/<job_id>"]
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
        
        logger.info(f"Received job {job_id} for user {user_id}, mode: {mode}")
        
        # Store job
        jobs[job_id] = {
            "id": job_id,
            "status": "processing",
            "progress": 0,
            "created_at": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "mode": mode,
            "payload": payload
        }
        
        if respond_immediately:
            # Process async in background thread
            thread = threading.Thread(
                target=process_job_async,
                args=(job_id, user_id, mode, payload)
            )
            thread.start()
            
            return jsonify({
                "accepted": True,
                "status": "accepted",
                "job_id": job_id,
                "message": "Job accepted for processing"
            })
        else:
            # Process synchronously
            result = process_job_sync(job_id, user_id, mode, payload)
            return jsonify(result)
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
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


def process_job_async(job_id, user_id, mode, payload):
    """Process job asynchronously and update status"""
    try:
        result = process_job_sync(job_id, user_id, mode, payload)
        jobs[job_id]["status"] = "done"
        jobs[job_id]["progress"] = 100
        jobs[job_id]["outputs"] = result.get("outputs", {})
        
        # Send callback if configured
        send_callback(job_id, "completed", result.get("outputs", {}))
        
        # Update Supabase if configured
        update_supabase_job(job_id, "done", result.get("outputs", {}))
        
    except Exception as e:
        logger.error(f"Error processing job {job_id}: {str(e)}")
        jobs[job_id]["status"] = "error"
        jobs[job_id]["error"] = str(e)
        send_callback(job_id, "failed", error=str(e))
        update_supabase_job(job_id, "error", error=str(e))


def process_job_sync(job_id, user_id, mode, payload):
    """Process job synchronously"""
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
            duration = payload.get("duration_seconds", 600)
            audio_data, sr = processor.generate_base_audio(duration)
        
        # Apply binaural beats if requested
        binaural = payload.get("binaural")
        if binaural and binaural.get("enabled"):
            update_progress(job_id, 30, "Applying binaural beats...")
            audio_data = processor.apply_binaural_beats(
                audio_data, sr,
                carrier_freq=binaural.get("carrier_hz", 200),
                beat_freq=binaural.get("beat_hz", 7),
                intensity=binaural.get("intensity", 0.3)
            )
        
        # Apply healing frequency if requested
        healing_freq = payload.get("healing_frequency")
        if healing_freq and healing_freq.get("enabled"):
            update_progress(job_id, 40, "Adding healing frequency...")
            audio_data = processor.apply_healing_frequency(
                audio_data, sr,
                frequency=healing_freq.get("hz", 528),
                intensity=healing_freq.get("intensity", 0.2)
            )
        
        # Apply noise removal if requested
        if payload.get("noise_removal", {}).get("enabled"):
            update_progress(job_id, 50, "Removing noise...")
            audio_data = processor.remove_noise(audio_data, sr)
        
        # Apply meditation style effects
        style = payload.get("meditation_style") or payload.get("ambient")
        if style:
            update_progress(job_id, 60, f"Applying {style} style...")
            audio_data = processor.apply_meditation_style(audio_data, sr, style)
        
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
            
            # Upload to storage (implement based on your storage)
            url = upload_to_storage(temp_path, job_id, f"variant_{i}")
            variants.append({
                "variant_index": i,
                "url": url,
                "duration_seconds": len(variant_audio) / sr
            })
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
        update_progress(job_id, 100, "Complete!")
        
        outputs = {
            "variants": variants,
            "primary_url": variants[0]["url"] if variants else None,
            "duration_seconds": len(audio_data) / sr,
            "sample_rate": sr,
            "processing_applied": {
                "binaural_beats": binaural.get("enabled", False) if binaural else False,
                "healing_frequency": healing_freq.get("enabled", False) if healing_freq else False,
                "noise_removal": payload.get("noise_removal", {}).get("enabled", False),
                "mastering": mastering.get("enabled", False) if mastering else False,
                "meditation_style": style
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
    duration = payload.get("duration_seconds", 600)
    num_variants = payload.get("variants", 1)
    
    variants = []
    for i in range(num_variants):
        variants.append({
            "variant_index": i,
            "url": f"https://example.com/mock-audio-{i}.mp3",
            "duration_seconds": duration
        })
    
    return {
        "variants": variants,
        "primary_url": variants[0]["url"] if variants else None,
        "duration_seconds": duration,
        "sample_rate": 44100,
        "mock": True,
        "message": "Mock output - install audio libraries for real processing"
    }


def update_progress(job_id, progress, message=""):
    """Update job progress"""
    if job_id in jobs:
        jobs[job_id]["progress"] = progress
        jobs[job_id]["status_message"] = message
        logger.info(f"Job {job_id}: {progress}% - {message}")


def send_callback(job_id, status, outputs=None, error=None):
    """Send callback to notify job completion"""
    if not CALLBACK_URL:
        return
    
    try:
        data = {
            "job_id": job_id,
            "status": status,
            "outputs": outputs,
            "error": error
        }
        requests.post(CALLBACK_URL, json=data, timeout=10)
    except Exception as e:
        logger.error(f"Failed to send callback: {e}")


def update_supabase_job(job_id, status, outputs=None, error=None):
    """Update job status in Supabase"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return
    
    try:
        url = f"{SUPABASE_URL}/rest/v1/creative_soul_jobs"
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        data = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if outputs:
            data["result_url"] = outputs.get("primary_url")
            data["payload"] = {"outputs": outputs}
        
        if error:
            data["error_message"] = error
        
        requests.patch(
            f"{url}?job_id=eq.{job_id}",
            headers=headers,
            json=data,
            timeout=10
        )
    except Exception as e:
        logger.error(f"Failed to update Supabase: {e}")


def upload_to_storage(file_path, job_id, filename):
    """Upload file to storage and return URL"""
    # For now, return a placeholder URL
    # In production, upload to S3, Supabase Storage, or other cloud storage
    
    if SUPABASE_URL and SUPABASE_SERVICE_KEY:
        try:
            # Upload to Supabase Storage
            with open(file_path, "rb") as f:
                file_data = f.read()
            
            storage_path = f"meditation-outputs/{job_id}/{filename}.mp3"
            url = f"{SUPABASE_URL}/storage/v1/object/audio/{storage_path}"
            
            headers = {
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "audio/mpeg"
            }
            
            response = requests.post(url, headers=headers, data=file_data, timeout=60)
            
            if response.status_code in [200, 201]:
                return f"{SUPABASE_URL}/storage/v1/object/public/audio/{storage_path}"
        except Exception as e:
            logger.error(f"Failed to upload to Supabase Storage: {e}")
    
    # Return placeholder if upload fails
    return f"https://placeholder.com/audio/{job_id}/{filename}.mp3"


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
