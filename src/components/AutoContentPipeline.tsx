// AutoContentPipeline — SQI 2050
// One upload → chop into clips → 4 platform thumbnails → auto-post (IG live, others queued)
import { useState, useRef } from "react";
import { Upload, Scissors, Send, CheckCircle2, XCircle, Clock, RefreshCw, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const C = {
  gold: "#D4AF37",
  cyan: "#22D3EE",
  green: "#22C55E",
  amber: "#F59E0B",
  red: "#EF4444",
  muted: "rgba(255,255,255,0.45)",
  border: "rgba(255,255,255,0.06)",
};

// Platform thumbnail specs: [width, height, label]
const THUMB_SPECS: { id: string; label: string; w: number; h: number }[] = [
  { id: "instagram", label: "Instagram (4:5)", w: 1080, h: 1350 },
  { id: "tiktok", label: "TikTok (9:16)", w: 1080, h: 1920 },
  { id: "youtube", label: "YouTube (16:9)", w: 1280, h: 720 },
  { id: "facebook", label: "Facebook (1.91:1)", w: 1200, h: 630 },
];

let ffmpegInstance: any = null;
async function loadFFmpeg(): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance;
  if (!(window as any).FFmpegWASM) {
    await new Promise<void>((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js";
      s.onload = () => res();
      s.onerror = rej;
      document.head.appendChild(s);
    });
    await new Promise<void>((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/umd/index.js";
      s.onload = () => res();
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const { FFmpeg } = (window as any).FFmpegWASM || (window as any);
  const ff = new FFmpeg();
  await ff.load({ coreURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js" });
  ffmpegInstance = ff;
  return ff;
}

function u8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

interface ClipResult {
  index: number;
  start: number;
  end: number;
  hook?: string;
  scheduledFor?: string;
  videoUrl?: string;
  thumbs: Record<string, string>; // platform -> R2 url
  postResults?: Record<string, { success: boolean; reason?: string; postId?: string }>;
  status: "pending" | "processing" | "transcribing" | "uploading" | "posting" | "scheduled" | "done" | "error";
  error?: string;
}

// Draw a title overlay onto a base image (canvas), return JPEG bytes
async function overlayTextOnImage(imgBytes: Uint8Array, w: number, h: number, title: string): Promise<Uint8Array> {
  const blob = new Blob([imgBytes.buffer as ArrayBuffer], { type: "image/jpeg" });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);

  // Bottom gradient for legibility
  const grad = ctx.createLinearGradient(0, h * 0.55, 0, h);
  grad.addColorStop(0, "rgba(5,5,5,0)");
  grad.addColorStop(1, "rgba(5,5,5,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  const fontSize = Math.round(w * 0.075);
  ctx.font = `900 ${fontSize}px Inter, Arial, sans-serif`;
  ctx.fillStyle = "#D4AF37";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  // Simple word-wrap
  const words = title.toUpperCase().split(" ");
  const maxWidth = w * 0.86;
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const lineHeight = fontSize * 1.15;
  let y = h - h * 0.08;
  for (let i = lines.length - 1; i >= 0; i--) {
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = fontSize * 0.08;
    ctx.strokeText(lines[i], w / 2, y);
    ctx.fillText(lines[i], w / 2, y);
    y -= lineHeight;
  }

  const outBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.9));
  return new Uint8Array(await outBlob.arrayBuffer());
}

export const AutoContentPipeline = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [clipLength, setClipLength] = useState(60);
  const [caption, setCaption] = useState("");
  const [cadenceHours, setCadenceHours] = useState(24); // default: 1/day — safest against spam suppression
  const [clips, setClips] = useState<ClipResult[]>([]);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const addLog = (m: string) => setLog((p) => [...p.slice(-10), m]);

  const handleFile = (file: File) => {
    setVideoFile(file);
    setClips([]);
    setLog([]);
    const v = document.createElement("video");
    v.src = URL.createObjectURL(file);
    v.onloadedmetadata = () => setDuration(v.duration);
  };

  const uploadAsset = async (base64: string, mediaType: "video" | "image", mime: string) => {
    const { data, error } = await supabase.functions.invoke("social-post", {
      body: { action: "upload_asset", mediaBase64: base64, mediaType, mediaMimeType: mime },
    });
    if (error || !data?.success) throw new Error(data?.error || error?.message || "Upload failed");
    return data.url as string;
  };

  const generateHook = async (audioBase64: string) => {
    const { data, error } = await supabase.functions.invoke("social-post", {
      body: { action: "generate_hook", audioBase64, audioMimeType: "audio/mp3" },
    });
    if (error || !data?.success) throw new Error(data?.error || error?.message || "Hook generation failed");
    return data as { hook: string; caption: string; hashtags: string[] };
  };

  const publishClip = async (base64: string, thumbCaption: string, scheduledTime?: string) => {
    const { data, error } = await supabase.functions.invoke("social-post", {
      body: {
        action: "publish",
        caption: thumbCaption,
        platforms: ["instagram", "youtube", "tiktok", "facebook"],
        mediaBase64: base64,
        mediaType: "video",
        mediaMimeType: "video/mp4",
        profile: "kritagya",
        scheduledTime,
      },
    });
    if (error) throw new Error(error.message);
    return data;
  };

  const run = async () => {
    if (!videoFile || !duration) return;
    setRunning(true);
    addLog("Loading FFmpeg WebAssembly engine…");
    const ff = await loadFFmpeg();

    const { fetchFile } = (window as any).FFmpegUtil || {};
    const inputBuf = fetchFile ? await fetchFile(videoFile) : new Uint8Array(await videoFile.arrayBuffer());
    await ff.writeFile("src.mp4", inputBuf);
    addLog("Video loaded into browser engine.");

    const segments: { start: number; end: number }[] = [];
    for (let t = 0; t < duration; t += clipLength) {
      segments.push({ start: t, end: Math.min(t + clipLength, duration) });
    }
    const initialClips: ClipResult[] = segments.map((s, i) => ({
      index: i, start: s.start, end: s.end, thumbs: {}, status: "pending",
    }));
    setClips(initialClips);
    addLog(`${segments.length} clip(s) will be created. Spaced ${cadenceHours}h apart starting now.`);

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const outName = `clip_${i}.mp4`;
      setClips((prev) => prev.map((c) => (c.index === i ? { ...c, status: "processing" } : c)));
      addLog(`Cutting clip ${i + 1}/${segments.length} (${seg.start.toFixed(0)}s–${seg.end.toFixed(0)}s)…`);

      await ff.exec([
        "-i", "src.mp4",
        "-ss", String(seg.start),
        "-to", String(seg.end),
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-movflags", "+faststart",
        outName,
      ]);
      const clipData = (await ff.readFile(outName)) as Uint8Array;
      const clipBase64 = u8ToBase64(clipData);

      // Extract audio and get a content-derived hook/caption/hashtags — thumbnail has to reflect what's actually said
      setClips((prev) => prev.map((c) => (c.index === i ? { ...c, status: "transcribing" } : c)));
      let hook = `Sacred Transmission — Part ${i + 1}`;
      let clipCaption = caption;
      let hashtags: string[] = [];
      try {
        addLog(`Transcribing clip ${i + 1} audio to find its real topic…`);
        await ff.exec(["-i", outName, "-vn", "-acodec", "libmp3lame", "-b:a", "64k", `audio_${i}.mp3`]);
        const audioData = (await ff.readFile(`audio_${i}.mp3`)) as Uint8Array;
        const h = await generateHook(u8ToBase64(audioData));
        hook = h.hook || hook;
        if (!caption) clipCaption = h.caption;
        hashtags = h.hashtags || [];
        addLog(`✓ Topic detected: "${hook}"`);
      } catch (e: any) {
        addLog(`✗ Hook generation failed, using generic title: ${e.message}`);
      }
      const finalCaption = `${clipCaption || hook}${hashtags.length ? "\n\n" + hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ") : ""}`;

      // Generate 4 platform thumbnails from a frame 1s in, with the real topic burned onto each
      const thumbs: Record<string, string> = {};
      setClips((prev) => prev.map((c) => (c.index === i ? { ...c, status: "uploading", hook } : c)));
      for (const spec of THUMB_SPECS) {
        const thumbName = `thumb_${i}_${spec.id}.jpg`;
        try {
          await ff.exec([
            "-i", outName,
            "-ss", "1",
            "-vframes", "1",
            "-vf", `scale=${spec.w}:${spec.h}:force_original_aspect_ratio=increase,crop=${spec.w}:${spec.h}`,
            thumbName,
          ]);
          const rawThumb = (await ff.readFile(thumbName)) as Uint8Array;
          const overlaid = await overlayTextOnImage(rawThumb, spec.w, spec.h, hook);
          const url = await uploadAsset(u8ToBase64(overlaid), "image", "image/jpeg");
          thumbs[spec.id] = url;
          addLog(`✓ ${spec.label} thumbnail generated with topic overlay.`);
        } catch (e: any) {
          addLog(`✗ ${spec.label} thumbnail failed: ${e.message}`);
        }
      }

      // Schedule: clip 0 can post immediately, each subsequent clip spaced cadenceHours apart
      const scheduledDate = new Date(Date.now() + i * cadenceHours * 60 * 60 * 1000);
      const scheduledTime = i === 0 ? undefined : scheduledDate.toISOString();

      setClips((prev) => prev.map((c) => (c.index === i ? { ...c, status: scheduledTime ? "scheduled" : "posting" } : c)));
      addLog(
        scheduledTime
          ? `Clip ${i + 1} queued for ${scheduledDate.toLocaleString()} — Instagram live, others held until API-approved.`
          : `Posting clip ${i + 1} now — live to Instagram, queued for YouTube/TikTok/Facebook…`
      );

      let postResults: ClipResult["postResults"] | undefined;
      try {
        const res = await publishClip(clipBase64, finalCaption, scheduledTime);
        postResults = res.results;
      } catch (e: any) {
        addLog(`✗ Publish/schedule failed for clip ${i + 1}: ${e.message}`);
      }

      const videoUrl = await uploadAsset(clipBase64, "video", "video/mp4").catch(() => undefined);

      setClips((prev) =>
        prev.map((c) => (c.index === i
          ? { ...c, thumbs, postResults, videoUrl, hook, scheduledFor: scheduledTime, status: scheduledTime ? "scheduled" : "done" }
          : c))
      );
    }

    addLog("Pipeline complete.");
    setRunning(false);
  };

  return (
    <div>
      <div style={{ background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 16, padding: "18px 20px", marginBottom: 20 }}>
        <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, marginBottom: 10 }}>
          How Auto-Pipeline Works
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
          Upload one video. It's chopped into clips in your browser (nothing uploaded until you run it),
          each clip gets 4 platform-specific thumbnails, and clips auto-post to Instagram (only platform
          currently authorized). YouTube, TikTok and Facebook posts are queued — those three are blocked
          on API approval, not code. Once approved, queued posts fire automatically.
        </p>
      </div>

      <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {!videoFile ? (
        <div
          onClick={() => fileRef.current?.click()}
          style={{ border: "2px dashed rgba(212,175,55,0.3)", borderRadius: 20, padding: "36px 24px", textAlign: "center", cursor: "pointer", background: "rgba(212,175,55,0.02)" }}
        >
          <Upload size={28} color={C.gold} style={{ marginBottom: 10 }} />
          <p style={{ fontWeight: 800, fontSize: 14, color: "#fff", margin: "0 0 6px" }}>Upload Video</p>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>MP4 or MOV — processed locally, then clips upload for posting</p>
        </div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
          <p style={{ fontWeight: 800, fontSize: 13, color: "#fff", margin: "0 0 12px" }}>{videoFile.name}</p>

          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Clip length (seconds)</label>
          <input
            type="number" value={clipLength} min={10} max={600}
            onChange={(e) => setClipLength(Number(e.target.value))}
            style={{ width: 120, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, marginBottom: 14 }}
          />

          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>Caption (optional — auto-generated per clip from its actual audio if left blank)</label>
          <textarea
            value={caption} onChange={(e) => setCaption(e.target.value)} rows={2}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, marginBottom: 14, boxSizing: "border-box", fontFamily: "inherit" }}
          />

          <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 6 }}>
            Posting cadence — first clip posts now, rest are spaced out and fire automatically via scheduled queue
          </label>
          <select
            value={cadenceHours} onChange={(e) => setCadenceHours(Number(e.target.value))}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13, marginBottom: 6, fontFamily: "inherit" }}
          >
            <option value={24}>1 per day (recommended — safest against spam suppression)</option>
            <option value={12}>2 per day</option>
            <option value={8}>3 per day</option>
            <option value={168}>1 per week (evergreen drip)</option>
          </select>
          <p style={{ fontSize: 11, color: C.muted, margin: "0 0 14px", lineHeight: 1.5 }}>
            Posting many near-identical clips from one source in a short window reads as spam to Instagram's
            distribution system and suppresses reach — the opposite of viral. 1/day is the defensible default.
          </p>

          <button
            onClick={run} disabled={running}
            style={{
              background: "linear-gradient(135deg, #D4AF37, #B8960C)", border: "none", borderRadius: 12,
              color: "#050505", fontWeight: 700, fontSize: 13, padding: "11px 22px", cursor: running ? "not-allowed" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 8, opacity: running ? 0.6 : 1,
            }}
          >
            {running ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Scissors size={14} />}
            {running ? "Processing…" : "Chop, Thumbnail & Schedule"}
          </button>
        </div>
      )}

      {log.length > 0 && (
        <div style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 11, color: C.muted, fontFamily: "monospace", maxHeight: 140, overflowY: "auto" }}>
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {clips.map((c) => (
        <div key={c.index} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <p style={{ fontWeight: 800, fontSize: 13, color: "#fff", margin: 0 }}>
              Clip {c.index + 1} — {c.start.toFixed(0)}s to {c.end.toFixed(0)}s
            </p>
            <StatusBadge status={c.status} />
          </div>
          {c.hook && <p style={{ fontSize: 12, color: C.gold, margin: "0 0 4px", fontWeight: 700 }}>"{c.hook}"</p>}
          {c.scheduledFor && <p style={{ fontSize: 11, color: C.muted, margin: "0 0 10px" }}>Scheduled: {new Date(c.scheduledFor).toLocaleString()}</p>}

          {Object.keys(c.thumbs).length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {THUMB_SPECS.map((s) => c.thumbs[s.id] && (
                <a key={s.id} href={c.thumbs[s.id]} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 8, padding: "6px 10px", fontSize: 10, color: C.gold }}>
                    <Download size={11} /> {s.label}
                  </div>
                </a>
              ))}
            </div>
          )}

          {c.postResults && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(c.postResults).map(([platform, r]: [string, any]) => (
                <div key={platform} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: r.success ? C.green : C.amber }}>
                  {r.success ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {platform}: {r.success ? "posted" : r.reason || "queued"}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const StatusBadge = ({ status }: { status: ClipResult["status"] }) => {
  const map: Record<string, { color: string; label: string }> = {
    pending: { color: C.muted, label: "Pending" },
    processing: { color: C.cyan, label: "Cutting…" },
    transcribing: { color: C.cyan, label: "Detecting topic…" },
    uploading: { color: C.cyan, label: "Uploading…" },
    posting: { color: C.amber, label: "Posting…" },
    scheduled: { color: C.gold, label: "Scheduled" },
    done: { color: C.green, label: "Done" },
    error: { color: C.red, label: "Error" },
  };
  const m = map[status];
  return (
    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: m.color, background: `${m.color}18`, border: `1px solid ${m.color}30`, borderRadius: 6, padding: "3px 8px" }}>
      {m.label}
    </span>
  );
};
