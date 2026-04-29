// ============================================================
// Gemini API helpers — Embeddings · Generation · Imagen 3
// Used by the entire Akashic Codex curator stack.
// ============================================================

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

if (!GEMINI_API_KEY) {
  console.warn("[codex/gemini] GEMINI_API_KEY missing — calls will fail");
}

// ---- Embeddings (text-embedding-004, 768 dims) -------------
export async function embedText(text: string): Promise<number[]> {
  const url = `${GEMINI_API_BASE}/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
  const body = {
    model: "models/text-embedding-004",
    content: { parts: [{ text: text.slice(0, 8000) }] },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`embedText failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.embedding?.values ?? [];
}

// ---- Structured JSON generation (Gemini 2.5 Flash) ---------
export async function generateJson<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<T> {
  const url =
    `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxOutputTokens ?? 8192,
      responseMimeType: "application/json",
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`generateJson failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned) as T;
}

// ---- Plain text generation (Gemini 2.5 Flash) --------------
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<string> {
  const url =
    `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 4096,
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`generateText failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ---- Imagen 3 — sacred geometry chapter images -------------
export async function generateImage(prompt: string): Promise<Uint8Array> {
  const url =
    `${GEMINI_API_BASE}/models/imagen-3.0-generate-002:predict?key=${GEMINI_API_KEY}`;
  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "1:1",
      personGeneration: "DONT_ALLOW",
      safetySetting: "block_only_high",
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`generateImage failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const b64 = data.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error("generateImage: no image returned");
  // Decode base64 → bytes
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ---- Cosine similarity helper ------------------------------
export function cosineSim(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

export function avgEmbeddings(embs: number[][]): number[] {
  if (!embs.length) return [];
  const out = new Array(embs[0].length).fill(0);
  for (const e of embs) for (let i = 0; i < e.length; i++) out[i] += e[i];
  for (let i = 0; i < out.length; i++) out[i] /= embs.length;
  return out;
}
