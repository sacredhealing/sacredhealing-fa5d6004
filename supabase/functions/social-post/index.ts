// supabase/functions/social-post/index.ts
// SQI 2050 — Sovereign Social Posting Engine
// Handles: AI caption generation, Instagram posting, post queue

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// ── Instagram Graph API posting
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

// ── Save post to queue in Supabase
async function saveToQueue(payload: any, results: any) {
  const { data, error } = await supabase.from("social_post_queue").insert({
    caption: payload.caption,
    platforms: payload.platforms,
    media_type: payload.mediaType || null,
    scheduled_for: payload.scheduledTime || null,
    profile: payload.profile || "kritagya",
    results,
    status: payload.scheduledTime ? "scheduled" : "published",
    created_at: new Date().toISOString(),
  }).select("id").single();
  if (error) console.error("Queue save error:", error.message);
  return data?.id;
}

// ── Main handler
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, context, caption, platforms, mediaBase64, mediaMimeType, mediaType, scheduledTime, profile } = body;

    // ── ACTION: Generate caption + hashtags
    if (action === "generate_caption") {
      const result = await generateCaption(context || caption || "Siddha healing meditation", platforms || ["instagram"], mediaType);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: Publish
    if (action === "publish") {
      const results: Record<string, any> = {};

      // Upload media to R2 if provided
      let mediaUrl: string | null = null;
      if (mediaBase64 && R2_KEY_ID && R2_SECRET) {
        try {
          const bytes = Uint8Array.from(atob(mediaBase64), (c) => c.charCodeAt(0));
          const ext = mediaType === "video" ? "mp4" : "jpg";
          const key = `social/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          mediaUrl = await uploadToR2(key, bytes, mediaMimeType || (mediaType === "video" ? "video/mp4" : "image/jpeg"));
        } catch (uploadErr: any) {
          console.error("R2 upload error:", uploadErr.message);
          results._mediaUpload = { success: false, error: uploadErr.message };
        }
      }

      // Instagram (live — token connected)
      if (platforms?.includes("instagram")) {
        if (!mediaUrl && mediaBase64) {
          results.instagram = { success: false, reason: "Media upload to R2 failed — set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY" };
        } else if (mediaUrl) {
          results.instagram = await postToInstagram(mediaUrl, caption || "", mediaType === "video");
        } else {
          // Text-only post (carousel with placeholder or skip)
          results.instagram = { success: false, reason: "Instagram requires media — text-only posts not supported by Graph API" };
        }
      }

      // YouTube — API pending Google review
      if (platforms?.includes("youtube")) {
        results.youtube = { success: false, reason: "YouTube API OAuth pending Google review — resubmit at console.cloud.google.com" };
      }

      // TikTok — app under review
      if (platforms?.includes("tiktok")) {
        results.tiktok = { success: false, reason: "TikTok app under review — approval expected 2–4 weeks" };
      }

      // Facebook — personal profile posting blocked by Meta API, page pending
      if (platforms?.includes("facebook")) {
        results.facebook = { success: false, reason: "Facebook personal profile posting blocked by Meta API — business page pending" };
      }

      // Save to queue regardless
      const queueId = await saveToQueue(body, results);

      const anySuccess = Object.values(results).some((r: any) => r.success);
      return new Response(
        JSON.stringify({ success: anySuccess, results, queueId, mediaUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
