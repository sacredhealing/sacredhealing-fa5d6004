// SQI Video Worker — runs on Hetzner
// Does the heavy lifting that used to freeze phones: downloads the source video,
// chops it, generates content-aware thumbnails, and calls back through the
// social-post edge function for everything that needs a secret (R2, Gemini, Instagram).
// This service holds no credentials of its own — all secrets stay in Supabase.
const express = require("express");
const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const execAsync = promisify(exec);
const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3002;
const TMP_DIR = "/root/sqi-app/video-worker/tmp";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

const jobs = {};

const THUMB_SPECS = [
  { id: "instagram", label: "Instagram (4:5)", w: 1080, h: 1350 },
  { id: "tiktok", label: "TikTok (9:16)", w: 1080, h: 1920 },
  { id: "youtube", label: "YouTube (16:9)", w: 1280, h: 720 },
  { id: "facebook", label: "Facebook (1.91:1)", w: 1200, h: 630 },
];

function log(job, msg) {
  console.log(`[${job.id}] ${msg}`);
  job.log.push(msg);
  if (job.log.length > 300) job.log.shift();
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function ffprobeDuration(file) {
  const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${file}"`);
  return parseFloat(stdout.trim());
}

async function uploadBinary(functionUrl, filePath, mediaType, mime, ext) {
  const buf = fs.readFileSync(filePath);
  const res = await fetch(`${functionUrl}?action=upload_binary&mediaType=${mediaType}&ext=${ext}`, {
    method: "POST",
    headers: { "Content-Type": mime },
    body: buf,
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || `Upload failed (HTTP ${res.status})`);
  return json.url;
}

async function generateHook(functionUrl, audioPath) {
  const audioBase64 = fs.readFileSync(audioPath).toString("base64");
  const res = await fetch(functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "generate_hook", audioBase64, audioMimeType: "audio/mp3" }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Hook generation failed");
  return json;
}

async function publishClip(functionUrl, mediaUrl, caption, scheduledTime) {
  const res = await fetch(functionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "publish",
      caption,
      platforms: ["instagram", "youtube", "tiktok", "facebook"],
      mediaUrl,
      mediaType: "video",
      profile: "kritagya",
      scheduledTime,
    }),
  });
  return res.json();
}

async function overlayTitle(thumbPath, w, h, title, outPath) {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="55%" stop-color="rgba(5,5,5,0)"/>
        <stop offset="100%" stop-color="rgba(5,5,5,0.85)"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${h * 0.55}" width="${w}" height="${h * 0.45}" fill="url(#g)"/>
    <text x="50%" y="${h * 0.92}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900"
      font-size="${Math.round(w * 0.075)}" fill="#D4AF37" stroke="rgba(0,0,0,0.6)" stroke-width="${Math.max(1, Math.round(w * 0.006))}">
      ${escapeXml(title.toUpperCase())}
    </text>
  </svg>`;
  await sharp(thumbPath)
    .resize(w, h, { fit: "cover" })
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toFile(outPath);
}

async function processJob(job) {
  const { videoUrl, clipLength, cadenceHours, caption, functionUrl } = job.params;
  try {
    log(job, "Downloading source video from R2…");
    const srcPath = path.join(job.dir, "src.mp4");
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) throw new Error(`Could not download source video (HTTP ${videoRes.status})`);
    const videoBuf = Buffer.from(await videoRes.arrayBuffer());
    fs.writeFileSync(srcPath, videoBuf);
    log(job, `Downloaded (${(videoBuf.length / 1e6).toFixed(1)}MB).`);

    const duration = await ffprobeDuration(srcPath);
    log(job, `Duration: ${duration.toFixed(0)}s`);

    const segments = [];
    for (let t = 0; t < duration; t += clipLength) {
      segments.push({ start: t, end: Math.min(t + clipLength, duration) });
    }
    log(job, `${segments.length} clip(s) planned. Spaced ${cadenceHours}h apart.`);
    job.clips = segments.map((s, i) => ({ index: i, start: s.start, end: s.end, status: "pending", thumbs: {} }));

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const clip = job.clips[i];
      clip.status = "processing";
      log(job, `Cutting clip ${i + 1}/${segments.length} (${seg.start.toFixed(0)}s–${seg.end.toFixed(0)}s)…`);

      const clipPath = path.join(job.dir, `clip_${i}.mp4`);
      await execAsync(
        `ffmpeg -y -i "${srcPath}" -ss ${seg.start} -to ${seg.end} -c:v libx264 -preset veryfast -crf 23 -c:a aac -movflags +faststart "${clipPath}"`
      );

      const audioPath = path.join(job.dir, `audio_${i}.mp3`);
      let hook = `Sacred Transmission — Part ${i + 1}`;
      let clipCaption = caption;
      let hashtags = [];
      clip.status = "transcribing";
      try {
        await execAsync(`ffmpeg -y -i "${clipPath}" -vn -acodec libmp3lame -b:a 64k "${audioPath}"`);
        const h = await generateHook(functionUrl, audioPath);
        hook = h.hook || hook;
        if (!caption) clipCaption = h.caption;
        hashtags = h.hashtags || [];
        log(job, `✓ Topic detected: "${hook}"`);
      } catch (e) {
        log(job, `✗ Hook generation failed, using generic title: ${e.message}`);
      }

      clip.status = "uploading";
      clip.hook = hook;
      const thumbs = {};
      for (const spec of THUMB_SPECS) {
        try {
          const rawPath = path.join(job.dir, `raw_${i}_${spec.id}.jpg`);
          const finalPath = path.join(job.dir, `thumb_${i}_${spec.id}.jpg`);
          await execAsync(
            `ffmpeg -y -i "${clipPath}" -ss 1 -vframes 1 -vf "scale=${spec.w}:${spec.h}:force_original_aspect_ratio=increase,crop=${spec.w}:${spec.h}" "${rawPath}"`
          );
          await overlayTitle(rawPath, spec.w, spec.h, hook, finalPath);
          const url = await uploadBinary(functionUrl, finalPath, "image", "image/jpeg", "jpg");
          thumbs[spec.id] = url;
          log(job, `✓ ${spec.label} thumbnail generated.`);
        } catch (e) {
          log(job, `✗ ${spec.label} thumbnail failed: ${e.message}`);
        }
      }
      clip.thumbs = thumbs;

      const clipUrl = await uploadBinary(functionUrl, clipPath, "video", "video/mp4", "mp4");
      const watchMore = `\n\n🎬 Watch the full teaching → ${videoUrl}`;
      const finalCaption = `${clipCaption || hook}${watchMore}${hashtags.length ? "\n\n" + hashtags.map((h) => `#${String(h).replace(/^#/, "")}`).join(" ") : ""}`;

      const scheduledDate = new Date(Date.now() + i * cadenceHours * 60 * 60 * 1000);
      const scheduledTime = i === 0 ? undefined : scheduledDate.toISOString();

      clip.status = scheduledTime ? "scheduled" : "posting";
      log(job, scheduledTime
        ? `Clip ${i + 1} queued for ${scheduledDate.toLocaleString()} — Instagram live, others held until API-approved.`
        : `Posting clip ${i + 1} now — live to Instagram, queued for YouTube/TikTok/Facebook…`);

      try {
        const res = await publishClip(functionUrl, clipUrl, finalCaption, scheduledTime);
        clip.postResults = res.results;
      } catch (e) {
        log(job, `✗ Publish failed for clip ${i + 1}: ${e.message}`);
      }

      clip.videoUrl = clipUrl;
      clip.scheduledFor = scheduledTime;
      clip.status = scheduledTime ? "scheduled" : "done";

      [clipPath, audioPath].forEach((p) => { try { fs.existsSync(p) && fs.unlinkSync(p); } catch {} });
    }

    log(job, "Pipeline complete.");
    job.status = "done";
  } catch (e) {
    log(job, `✗ Job failed: ${e.message}`);
    job.status = "error";
  } finally {
    try { fs.rmSync(job.dir, { recursive: true, force: true }); } catch {}
  }
}

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/process", (req, res) => {
  const { videoUrl, clipLength, cadenceHours, caption, functionUrl } = req.body || {};
  if (!videoUrl || !functionUrl) {
    return res.status(400).json({ success: false, error: "videoUrl and functionUrl required" });
  }
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const dir = path.join(TMP_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  const job = {
    id, dir, status: "processing", log: [], clips: [],
    params: { videoUrl, clipLength: clipLength || 60, cadenceHours: cadenceHours || 24, caption: caption || "", functionUrl },
  };
  jobs[id] = job;
  processJob(job); // fire and forget — client polls /status/:id
  res.status(202).json({ success: true, jobId: id });
});

app.get("/status/:id", (req, res) => {
  const job = jobs[req.params.id];
  if (!job) return res.status(404).json({ success: false, error: "Job not found (worker may have restarted)" });
  res.json({ success: true, status: job.status, log: job.log, clips: job.clips });
});

app.listen(PORT, () => console.log(`[SQI Video Worker] listening on :${PORT}`));
