// supabase/functions/social-post/index.ts
// SQI 2050 — Sovereign Social Posting Engine
// Handles: AI caption generation, Instagram posting, post queue

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const IG_TOKEN = Deno.env.get("INSTAGRAM_ACCESS_TOKEN") || "";
const IG_USER_ID = Deno.env.get("INSTAGRAM_USER_ID") || "";
const R2_PUBLIC_URL = "https://pub-7a2cf16596fd425ab1717b8c0c3e567d.r2.dev";
const R2_ACCOUNT_ID = "79dae6f785e6758a441aa69dd3f7b2af";
const R2_BUCKET = "siddhaquantumnexus";
const R2_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID") || "";
const R2_SECRET = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";

// ── Supabase client (for queue)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// ── AWS Signature V4 for R2 upload
async function hmacSHA256(key: ArrayBuffer | string, data: string): Promise<ArrayBuffer> {
  const k = typeof key === "string"
    ? new TextEncoder().encode(key)
    : new Uint8Array(key);
  const cryptoKey = await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

async function uploadToR2(key: string, data: Uint8Array, contentType: string): Promise<string> {
  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${R2_BUCKET}/${key}`;
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzDate = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const payloadHash = await sha256Hex(data);
  const canonicalHeaders = `content-type:${contentType}\nhost:${R2_ACCOUNT_ID}.r2.cloudflarestorage.com\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n/${R2_BUCKET}/${key}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credScope = `${dateStamp}/auto/s3/aws4_request`;
  const strToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credScope}\n${toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalRequest)))}`;
  const kDate = await hmacSHA256(`AWS4${R2_SECRET}`, dateStamp);
  const kRegion = await hmacSHA256(kDate, "auto");
  const kService = await hmacSHA256(kRegion, "s3");
  const kSigning = await hmacSHA256(kService, "aws4_request");
  const sig = toHex(await hmacSHA256(kSigning, strToSign));
  const authorization = `AWS4-HMAC-SHA256 Credential=${R2_KEY_ID}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
    body: data,
  });
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`);
  return `${R2_PUBLIC_URL}/${key}`;
}

async function presignR2PutUrl(key: string, expirySeconds = 3600): Promise<string> {
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzDate = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const credScope = `${dateStamp}/auto/s3/aws4_request`;
  const credential = `${R2_KEY_ID}/${credScope}`;

  const queryParams: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", credential],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(expirySeconds)],
    ["X-Amz-SignedHeaders", "host"],
  ];
  queryParams.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const canonicalQuery = queryParams.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");

  const canonicalRequest = `PUT\n/${R2_BUCKET}/${key}\n${canonicalQuery}\nhost:${host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const strToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credScope}\n${toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalRequest)))}`;
  const kDate = await hmacSHA256(`AWS4${R2_SECRET}`, dateStamp);
  const kRegion = await hmacSHA256(kDate, "auto");
  const kService = await hmacSHA256(kRegion, "s3");
  const kSigning = await hmacSHA256(kService, "aws4_request");
  const sig = toHex(await hmacSHA256(kSigning, strToSign));

  return `https://${host}/${R2_BUCKET}/${key}?${canonicalQuery}&X-Amz-Signature=${sig}`;
}


async function setupR2Cors(): Promise<string> {
  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const corsXml = `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <CORSRule>
    <AllowedOrigin>https://sacredhealing.lovable.app</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>`;
  const bodyBytes = new TextEncoder().encode(corsXml);
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzDate = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const payloadHash = await sha256Hex(bodyBytes);
  const canonicalHeaders = `content-type:application/xml\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n/${R2_BUCKET}\ncors=\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credScope = `${dateStamp}/auto/s3/aws4_request`;
  const strToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credScope}\n${toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalRequest)))}`;
  const kDate = await hmacSHA256(`AWS4${R2_SECRET}`, dateStamp);
  const kRegion = await hmacSHA256(kDate, "auto");
  const kService = await hmacSHA256(kRegion, "s3");
  const kSigning = await hmacSHA256(kService, "aws4_request");
  const sig = toHex(await hmacSHA256(kSigning, strToSign));
  const authorization = `AWS4-HMAC-SHA256 Credential=${R2_KEY_ID}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;
  const res = await fetch(`https://${host}/${R2_BUCKET}?cors`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/xml",
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
    body: bodyBytes,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`CORS setup failed: ${res.status} ${text}`);
  return "CORS policy applied";
}

async function postToInstagram(mediaUrl: string, caption: string, isVideo: boolean): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (!IG_TOKEN || !IG_USER_ID) return { success: false, error: "INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_USER_ID not set" };
  try {
    // Step 1: Create media container
    const containerParams = new URLSearchParams({
      caption,
      access_token: IG_TOKEN,
      ...(isVideo
        ? { media_type: "REELS", video_url: mediaUrl, share_to_feed: "true" }
        : { image_url: mediaUrl }),
    });
    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${IG_USER_ID}/media`,
      { method: "POST", body: containerParams }
    );
    const containerData = await containerRes.json();
    if (!containerData.id) return { success: false, error: containerData.error?.message || "Container creation failed" };

    // For videos, wait for processing
    if (isVideo) {
      let attempts = 0;
      while (attempts < 10) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch(
          `https://graph.facebook.com/v19.0/${containerData.id}?fields=status_code&access_token=${IG_TOKEN}`
        );
        const status = await statusRes.json();
        if (status.status_code === "FINISHED") break;
        if (status.status_code === "ERROR") return { success: false, error: "Video processing failed" };
        attempts++;
      }
    }

    // Step 2: Publish
    const publishParams = new URLSearchParams({ creation_id: containerData.id, access_token: IG_TOKEN });
    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish`,
      { method: "POST", body: publishParams }
    );
    const publishData = await publishRes.json();
    if (publishData.id) return { success: true, postId: publishData.id };
    return { success: false, error: publishData.error?.message || "Publish failed" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Gemini caption generation
async function generateCaption(context: string, platforms: string[], mediaType: string | null) {
  const platformGuide = {
    instagram: "emotional hooks, line breaks, 3-5 sentences, storytelling",
    tiktok: "punchy first line, viral hook, 1-3 sentences",
    youtube: "searchable title-style opener, clear value proposition",
    facebook: "warm personal tone, question at end",
  };
  const platformNotes = platforms.map((p) => `${p}: ${(platformGuide as any)[p] || ""}`).join("\n");

  const prompt = `You are the SQI social media transmission expert for Siddha Quantum Nexus — a spiritual healing platform blending ancient Siddha wisdom with quantum consciousness technology.

Generate a viral social media caption for this content: "${context}"
Platforms: ${platforms.join(", ")}
Media type: ${mediaType || "text only"}

Platform-specific style:
${platformNotes}

Write ONE universal caption that adapts best across these platforms. Make it deeply spiritual but accessible. Use the brand voice: Vedic Light-Codes, Siddha-Quantum consciousness, healing transmissions.

Also generate 15-20 powerful hashtags mixing: spiritual/healing niche (high engagement), brand (#SiddhaQuantumNexus #KritagyadDas), trending spiritual tags.

Respond ONLY with valid JSON (no markdown):
{"caption": "your caption here", "hashtags": ["tag1","tag2",...]}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 800, temperature: 0.85 },
      }),
    }
  );
  const geminiData = await geminiRes.json();
  const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ── Post to all requested platforms, given an already-uploaded media URL
async function postToPlatforms(platforms: string[], mediaUrl: string | null, caption: string, mediaType: string | null) {
  const results: Record<string, any> = {};

  if (platforms?.includes("instagram")) {
    if (mediaUrl) {
      results.instagram = await postToInstagram(mediaUrl, caption || "", mediaType === "video");
    } else {
      results.instagram = { success: false, reason: "No media URL available for Instagram post" };
    }
  }
  if (platforms?.includes("youtube")) {
    results.youtube = { success: false, reason: "YouTube API OAuth pending Google review — resubmit at console.cloud.google.com" };
  }
  if (platforms?.includes("tiktok")) {
    results.tiktok = { success: false, reason: "TikTok app under review — approval expected 2–4 weeks" };
  }
  if (platforms?.includes("facebook")) {
    results.facebook = { success: false, reason: "Facebook personal profile posting blocked by Meta API — business page pending" };
  }
  return results;
}

// ── Save post to queue in Supabase
async function saveToQueue(payload: any, results: any, mediaUrl: string | null, status: string) {
  const { data, error } = await supabase.from("social_post_queue").insert({
    caption: payload.caption,
    platforms: payload.platforms,
    media_type: payload.mediaType || null,
    media_url: mediaUrl,
    scheduled_for: payload.scheduledTime || null,
    profile: payload.profile || "kritagya",
    results,
    status,
    created_at: new Date().toISOString(),
  }).select("id").single();
  if (error) console.error("Queue save error:", error.message);
  return data?.id;
}

// ── Main handler
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);

  // ── Raw binary upload — used by the frontend for videos/images to avoid
  // base64-encoding large files (which freezes mobile browsers on big videos).
  // Called as: POST ?action=upload_binary&mediaType=video|image&ext=mp4
  if (url.searchParams.get("action") === "upload_binary") {
    try {
      if (!R2_KEY_ID || !R2_SECRET) {
        return new Response(JSON.stringify({ success: false, error: "R2 credentials not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const mediaType = url.searchParams.get("mediaType") || "video";
      const ext = url.searchParams.get("ext") || (mediaType === "video" ? "mp4" : "jpg");
      const contentType = req.headers.get("content-type") || (mediaType === "video" ? "video/mp4" : "image/jpeg");
      const buf = new Uint8Array(await req.arrayBuffer());
      const key = `pipeline/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const fileUrl = await uploadToR2(key, buf, contentType);
      return new Response(JSON.stringify({ success: true, url: fileUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const body = await req.json();
    const { action, context, caption, platforms, mediaBase64, mediaUrl: preUploadedUrl, mediaMimeType, mediaType, scheduledTime, profile } = body;

    // ── ACTION: Generate caption + hashtags
    if (action === "generate_caption") {
      const result = await generateCaption(context || caption || "Siddha healing meditation", platforms || ["instagram"], mediaType);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: Generate content-aware hook from clip audio (for thumbnail text + caption)
    if (action === "generate_hook") {
      const { audioBase64, audioMimeType } = body;
      if (!audioBase64) {
        return new Response(JSON.stringify({ success: false, error: "audioBase64 required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const prompt = `Listen to this audio clip from Kritagya Das's spiritual healing / Siddha Quantum consciousness teaching. Write a caption a real person would post — warm, personal, first-person, like Kritagya talking directly to his community, not corporate copy. Respond ONLY with valid JSON (no markdown):
{
  "hook": "3-6 word punchy thumbnail title capturing the SPECIFIC topic discussed (not generic)",
  "caption": "3-5 sentence caption in first person, reflecting what was actually said in this clip. Personal and warm — like a real message, not an ad. End with one genuine, specific line inviting people who want to go deeper to DM the word 'AWAKEN' or send a DM to join Sacred Healing / Siddha Quantum Nexus — make this feel like an invitation, not a sales pitch.",
  "hashtags": ["...12-18 tags mixing niche spiritual/healing tags, brand tags (SiddhaQuantumNexus, KritagyaDas), and broader trending spiritual tags — no duplicates, no # symbol in the array items"]
}`;
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: audioMimeType || "audio/mp3", data: audioBase64 } },
                  { text: prompt },
                ],
              }],
              generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
            }),
          }
        );
        const geminiData = await geminiRes.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        return new Response(JSON.stringify({ success: true, ...parsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── ACTION: One-time R2 CORS setup — run once so direct browser-to-R2 uploads are allowed
    if (action === "setup_r2_cors") {
      try {
        const result = await setupR2Cors();
        return new Response(JSON.stringify({ success: true, message: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── ACTION: Presign a direct-to-R2 upload URL — for large files (videos) that shouldn't
    // pass through this function's body at all. Browser PUTs straight to R2 with this URL.
    if (action === "presign_upload") {
      if (!R2_KEY_ID || !R2_SECRET) {
        return new Response(JSON.stringify({ success: false, error: "R2 credentials not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const { ext } = body;
        const key = `pipeline/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || "mp4"}`;
        const uploadUrl = await presignR2PutUrl(key, 3600);
        const publicUrl = `${R2_PUBLIC_URL}/${key}`;
        return new Response(JSON.stringify({ success: true, uploadUrl, publicUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── ACTION: Upload only (no posting) — used by Auto-Pipeline for clips/thumbnails
    if (action === "upload_asset") {
      if (!mediaBase64) {
        return new Response(JSON.stringify({ success: false, error: "mediaBase64 required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!R2_KEY_ID || !R2_SECRET) {
        return new Response(JSON.stringify({ success: false, error: "R2 credentials not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const bytes = Uint8Array.from(atob(mediaBase64), (c) => c.charCodeAt(0));
        const ext = mediaType === "video" ? "mp4" : "jpg";
        const key = `pipeline/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const url = await uploadToR2(key, bytes, mediaMimeType || (mediaType === "video" ? "video/mp4" : "image/jpeg"));
        return new Response(JSON.stringify({ success: true, url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── ACTION: Publish (immediate) or Schedule (hold for cron)
    if (action === "publish") {
      // Prefer an already-uploaded URL (from upload_binary) — avoids re-encoding large files as base64.
      let mediaUrl: string | null = preUploadedUrl || null;
      const uploadResult: Record<string, any> = {};
      if (!mediaUrl && mediaBase64 && R2_KEY_ID && R2_SECRET) {
        try {
          const bytes = Uint8Array.from(atob(mediaBase64), (c) => c.charCodeAt(0));
          const ext = mediaType === "video" ? "mp4" : "jpg";
          const key = `social/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          mediaUrl = await uploadToR2(key, bytes, mediaMimeType || (mediaType === "video" ? "video/mp4" : "image/jpeg"));
        } catch (uploadErr: any) {
          console.error("R2 upload error:", uploadErr.message);
          uploadResult._mediaUpload = { success: false, error: uploadErr.message };
        }
      }

      const isFuture = scheduledTime && new Date(scheduledTime).getTime() > Date.now();

      // Scheduled for later — hold. Do NOT post now. Cron (process_scheduled) fires it when due.
      if (isFuture) {
        const queueId = await saveToQueue(body, uploadResult, mediaUrl, "scheduled");
        return new Response(
          JSON.stringify({ success: true, scheduled: true, scheduledFor: scheduledTime, queueId, mediaUrl }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Otherwise post immediately
      const results = await postToPlatforms(platforms || [], mediaUrl, caption || "", mediaType);
      Object.assign(results, uploadResult);
      const queueId = await saveToQueue(body, results, mediaUrl, "published");

      const anySuccess = Object.values(results).some((r: any) => r.success);
      return new Response(
        JSON.stringify({ success: anySuccess, results, queueId, mediaUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ACTION: Trigger Hetzner video worker — server does the heavy lifting, not the phone
    if (action === "trigger_worker") {
      const { videoUrl, clipLength, cadenceHours, caption: workerCaption } = body;
      if (!videoUrl) {
        return new Response(JSON.stringify({ success: false, error: "videoUrl required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const workerRes = await fetch("http://178.105.183.74:3002/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl,
            clipLength: clipLength || 60,
            cadenceHours: cadenceHours || 24,
            caption: workerCaption || "",
            functionUrl: "https://ssygukfdbtehvtndandn.supabase.co/functions/v1/social-post",
          }),
        });
        const workerJson = await workerRes.json();
        return new Response(JSON.stringify(workerJson), {
          status: workerRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: `Could not reach video worker on Hetzner: ${err.message}` }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── ACTION: Poll Hetzner worker job status (proxied — browser never talks to Hetzner directly)
    if (action === "worker_status") {
      const { jobId } = body;
      if (!jobId) {
        return new Response(JSON.stringify({ success: false, error: "jobId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const statusRes = await fetch(`http://178.105.183.74:3002/status/${jobId}`);
        const statusJson = await statusRes.json();
        return new Response(JSON.stringify(statusJson), {
          status: statusRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: `Could not reach video worker on Hetzner: ${err.message}` }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── ACTION: Process scheduled queue — called by cron every 15 min
    if (action === "process_scheduled") {
      const nowIso = new Date().toISOString();
      const { data: due, error: dueErr } = await supabase
        .from("social_post_queue")
        .select("id, caption, platforms, media_type, media_url")
        .eq("status", "scheduled")
        .lte("scheduled_for", nowIso)
        .limit(20);

      if (dueErr) {
        return new Response(JSON.stringify({ success: false, error: dueErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const processed: any[] = [];
      for (const row of due || []) {
        const results = await postToPlatforms(row.platforms || [], row.media_url, row.caption || "", row.media_type);
        const anySuccess = Object.values(results).some((r: any) => r.success);
        await supabase.from("social_post_queue").update({
          status: anySuccess ? "published" : "failed",
          results,
        }).eq("id", row.id);
        processed.push({ id: row.id, anySuccess, results });
      }

      return new Response(JSON.stringify({ success: true, processedCount: processed.length, processed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("social-post error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
