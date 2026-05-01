// ============================================================
// Gemini API helpers — Embeddings · Generation · Imagen 3
// Used by the entire Akashic Codex curator stack.
// ============================================================

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

if (!GEMINI_API_KEY) {
  console.warn("[codex/gemini] GEMINI_API_KEY missing — calls will fail");
}

// ---- Embeddings (gemini-embedding-001, 3072 dims default) -------------
export async function embedText(text: string): Promise<number[]> {
  const url = `${GEMINI_API_BASE}/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;
  const body = {
    model: "models/gemini-embedding-001",
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
      maxOutputTokens: opts.maxOutputTokens ?? 32768,
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
  const finishReason = data.candidates?.[0]?.finishReason;
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (firstErr) {
    if (finishReason === "MAX_TOKENS" || /Unterminated/.test(String(firstErr))) {
      console.warn(`[gemini] response truncated (finishReason=${finishReason}), attempting repair`);
      const repaired = repairTruncatedJson(cleaned);
      try {
        return JSON.parse(repaired) as T;
      } catch {
        throw new Error(`generateJson: response truncated by Gemini and could not be repaired. finishReason=${finishReason}, length=${cleaned.length}`);
      }
    }
    throw firstErr;
  }
}

// Best-effort repair for truncated JSON: close any open strings and brackets.
function repairTruncatedJson(s: string): string {
  let out = s.trimEnd();
  out = out.replace(/,\s*$/, "");
  const quoteCount = (out.match(/(?<!\\)"/g) ?? []).length;
  if (quoteCount % 2 === 1) out += '"';
  const stack: string[] = [];
  let inString = false, escape = false;
  for (const ch of out) {
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" && stack[stack.length - 1] === "{") stack.pop();
    else if (ch === "]" && stack[stack.length - 1] === "[") stack.pop();
  }
  while (stack.length) {
    const open = stack.pop();
    out += open === "{" ? "}" : "]";
  }
  return out;
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
