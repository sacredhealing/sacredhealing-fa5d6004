// src/features/music/selectTrackForMood.ts
export type MoodKey = "calm" | "comfort" | "energy" | "rest" | "background";

type AnyTrack = Record<string, any>;

type Opts = {
  seed?: string; // deterministic tie-break
  excludeIds?: string[];
};

function toStr(v: any) {
  return v == null ? "" : String(v);
}

function norm(v: any) {
  return toStr(v).trim().toLowerCase();
}

function splitTags(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(norm).filter(Boolean);
  if (typeof v === "string") return v.split(",").map(norm).filter(Boolean);
  return [];
}

function getTrackId(t: AnyTrack): string {
  return (
    toStr(t.id) ||
    toStr(t.trackId) ||
    toStr(t.slug) ||
    toStr(t.uuid) ||
    toStr(t._id) ||
    ""
  );
}

function isPlayable(t: AnyTrack): boolean {
  // Adapt if your audio url field differs:
  const url =
    t.url ||
    t.audioUrl ||
    t.audio_url ||
    t.full_audio_url ||
    t.preview_url ||
    t.fileUrl ||
    t.file_url ||
    t.streamUrl ||
    t.stream_url;
  return Boolean(getTrackId(t)) && Boolean(url);
}

function getMeta(t: AnyTrack) {
  const tags = splitTags(t.tags ?? t.metadata?.tags ?? t.moodTags ?? t.keywords);
  const mood = norm(t.mood ?? t.metadata?.mood ?? t.vibe);
  const genre = norm(t.genre ?? t.metadata?.genre);
  const path = norm(t.path ?? t.spiritualPath ?? t.metadata?.path);
  const bpm = Number(t.bpm ?? t.metadata?.bpm);
  const energy = Number(t.energy ?? t.metadata?.energy);

  // Optional booleans if present:
  const lyrical = Boolean(t.lyrical ?? t.hasLyrics ?? t.metadata?.lyrical);
  const beat = Boolean(t.isBeat ?? t.beat ?? t.metadata?.beat);

  return { tags, mood, genre, path, bpm, energy, lyrical, beat };
}

function hasAny(hay: string[], needles: string[]) {
  const set = new Set(hay);
  return needles.some((n) => set.has(n));
}

function containsAny(text: string, needles: string[]) {
  if (!text) return false;
  return needles.some((n) => text.includes(n));
}

function scoreTrackForMood(track: AnyTrack, moodKey: MoodKey): number {
  const m = getMeta(track);

  // IMPORTANT: adapt these tokens to match your real metadata vocabulary
  const TOK = {
    calm: ["calm", "ground", "grounding", "still", "peace", "meditative", "soft"],
    comfort: ["comfort", "healing", "heart", "warm", "tender", "soft", "safe"],
    energy: ["energy", "energize", "energizing", "uplift", "focus", "bright", "active"],
    rest: ["sleep", "night", "rest", "deep", "unwind", "dream"],
    background: ["background", "focus", "study", "work", "ambient", "loop"],
    beat: ["beat", "beats", "drum", "groove"],
    heavyBeatGenres: ["hip hop", "hiphop", "reggaeton", "trap", "edm"],
    ambientGenres: ["ambient", "meditation", "mantra", "soundscape"],
  };

  let s = 0;

  const tags = m.tags;
  const mood = m.mood;
  const genre = m.genre;

  const tagHas = (arr: string[]) => hasAny(tags, arr);
  const moodHas = (arr: string[]) => containsAny(mood, arr);
  const genreHas = (arr: string[]) => containsAny(genre, arr);

  const isBeatish = m.beat || tagHas(TOK.beat) || genreHas(TOK.heavyBeatGenres);

  if (moodKey === "calm") {
    if (moodHas(["calm", "meditative"])) s += 3;
    if (tagHas(["calm", "grounding", "ground", "still", "peace"])) s += 2;
    if (genreHas(TOK.ambientGenres)) s += 1;
    if (isBeatish) s -= 2;
  }

  if (moodKey === "comfort") {
    if (moodHas(["healing", "comfort"])) s += 3;
    if (tagHas(["healing", "heart", "warm", "soft", "tender", "safe"])) s += 2;
    if (genreHas(["ambient", "mantra"])) s += 1;
    if (isBeatish) s -= 2;
  }

  if (moodKey === "energy") {
    if (moodHas(["energ", "uplift", "focus"])) s += 3;
    if (tagHas(["energ", "energy", "beat", "uplift", "focus"])) s += 2;
    if (genreHas(["beats", "reggae", "hip hop", "hiphop"])) s += 1;
    if (moodHas(["sleep", "calm", "rest"])) s -= 2;
  }

  if (moodKey === "rest") {
    if (moodHas(["sleep", "rest", "night"])) s += 3;
    if (tagHas(["sleep", "night", "deep", "rest", "unwind"])) s += 2;
    if (genreHas(["ambient", "soundscape"])) s += 1;
    if (isBeatish) s -= 2;
  }

  if (moodKey === "background") {
    if (tagHas(["background", "focus", "study", "work", "loop"])) s += 3;
    if (moodHas(["focus", "ground"])) s += 2;
    if (genreHas(["ambient", "instrumental"])) s += 1;
    if (m.lyrical) s -= 2;
    if (isBeatish) s -= 1; // not as harsh as calm/rest
  }

  // Small nudges using bpm/energy if present
  if (Number.isFinite(m.bpm)) {
    if (moodKey === "rest" && m.bpm > 100) s -= 1;
    if (moodKey === "calm" && m.bpm > 110) s -= 1;
    if (moodKey === "energy" && m.bpm >= 90) s += 1;
  }
  if (Number.isFinite(m.energy)) {
    if (moodKey === "energy" && m.energy >= 6) s += 1;
    if (moodKey === "rest" && m.energy >= 6) s -= 1;
  }

  return s;
}

export function hashStringToInt(seed: string): number {
  // deterministic, no deps
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDeterministic<T>(arr: T[], seed: string): T {
  const idx = arr.length ? hashStringToInt(seed) % arr.length : 0;
  return arr[idx];
}

export function selectTrackForMood(
  tracks: AnyTrack[],
  mood: MoodKey,
  opts?: Opts
) {
  const exclude = new Set((opts?.excludeIds ?? []).filter(Boolean));
  const playable = tracks.filter(isPlayable).filter((t) => !exclude.has(getTrackId(t)));

  if (!playable.length) return null;

  let bestScore = -Infinity;
  let best: AnyTrack[] = [];

  for (const t of playable) {
    const s = scoreTrackForMood(t, mood);
    if (s > bestScore) {
      bestScore = s;
      best = [t];
    } else if (s === bestScore) {
      best.push(t);
    }
  }

  if (!best.length) return playable[0];

  // deterministic tie-breaker (stable per seed)
  const seed = opts?.seed ?? `seed:${mood}`;
  return best.length === 1 ? best[0] : pickDeterministic(best, seed);
}

export function getTrackLabel(track: AnyTrack): string {
  const title = toStr(track.title ?? track.name ?? "Untitled");
  const tags = splitTags(track.tags ?? track.metadata?.tags);
  const mood = norm(track.mood ?? track.metadata?.mood);
  const genre = norm(track.genre ?? track.metadata?.genre);

  const vibe = mood || genre || tags[0] || "";
  return vibe ? `${title} • ${vibe}` : title;
}

export function getTrackIdSafe(track: AnyTrack): string {
  return getTrackId(track);
}

