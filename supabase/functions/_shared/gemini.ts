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
  const url = `${GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
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

  // Aggressive cleanup before parsing
  const cleaned = sanitizeJsonResponse(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch (firstErr) {
    console.warn(`[gemini] first parse failed (${String(firstErr).slice(0, 120)}). Length=${cleaned.length}, finishReason=${finishReason}. Attempting repair.`);
    // Try escape-fix first (control chars inside strings)
    try {
      return JSON.parse(escapeControlChars(cleaned)) as T;
    } catch {}
    // Then try truncation repair
    try {
      return JSON.parse(repairTruncatedJson(cleaned)) as T;
    } catch {}
    // Then try both combined
    try {
      return JSON.parse(repairTruncatedJson(escapeControlChars(cleaned))) as T;
    } catch (finalErr) {
      console.error(`[gemini] unrecoverable JSON. Raw start: ${cleaned.slice(0, 200).replace(/[\x00-\x1f]/g, (c) => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`)}`);
      throw new Error(`generateJson: response could not be parsed even after repair. finishReason=${finishReason}, length=${cleaned.length}, firstErr=${String(firstErr).slice(0, 200)}`);
    }
  }
}

// Strip BOMs, leading/trailing whitespace, code-fence markers, and any text outside the outermost JSON object/array.
function sanitizeJsonResponse(s: string): string {
  let out = s;
  // Remove UTF-8 BOM
  if (out.charCodeAt(0) === 0xfeff) out = out.slice(1);
  // Strip code fences
  out = out.replace(/```json/gi, "").replace(/```/g, "");
  // Trim outer whitespace and any leading/trailing control characters
  out = out.replace(/^[\s\x00-\x1f]+/, "").replace(/[\s\x00-\x1f]+$/, "");
  // If there's any prose before the JSON, slice from the first { or [
  const firstObj = out.indexOf("{");
  const firstArr = out.indexOf("[");
  const start = (firstObj === -1) ? firstArr : (firstArr === -1 ? firstObj : Math.min(firstObj, firstArr));
  if (start > 0) out = out.slice(start);
  return out.trim();
}

// Escape unescaped control characters that appear INSIDE string literals.
// Gemini sometimes emits raw \n / \t / \r inside JSON string values, which is invalid JSON.
function escapeControlChars(s: string): string {
  let out = "";
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const code = s.charCodeAt(i);
    if (escape) { out += ch; escape = false; continue; }
    if (ch === "\\") { out += ch; escape = true; continue; }
    if (ch === '"') { inString = !inString; out += ch; continue; }
    if (inString && code < 0x20) {
      if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else if (ch === "\b") out += "\\b";
      else if (ch === "\f") out += "\\f";
      else out += "\\u" + code.toString(16).padStart(4, "0");
      continue;
    }
    out += ch;
  }
  return out;
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
