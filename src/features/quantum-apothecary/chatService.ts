import type { Message } from './types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quantum-apothecary-chat`;

export interface UserImagePayload {
  base64: string;
  mimeType: string;
}

// Dedicated palm scan — uses the edge function's scanMode path.
export async function scanNadiFromPalm(options: {
  imageBase64: string;
  imageMimeType: string;
  userId?: string | null;
  planetaryAlign?: string;
  herbOfToday?: string;
  jyotishContext?: string;
  activeTransmissions?: { name?: string; title?: string }[];
}): Promise<Record<string, unknown>> {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      scanMode: true,
      imageBase64: options.imageBase64,
      imageMimeType: options.imageMimeType,
      userId: options.userId ?? null,
      planetaryAlign: options.planetaryAlign ?? '',
      herbOfToday: options.herbOfToday ?? '',
      jyotishContext: options.jyotishContext ?? '',
      activeTransmissions: options.activeTransmissions ?? [],
    }),
  });
  if (!resp.ok) throw new Error(`Scan failed: ${resp.status}`);
  return resp.json();
}

export async function streamChatWithSQI(
  messages: Message[],
  onDelta: (chunk: string) => void,
  onDone: () => void,
  userImage?: UserImagePayload,
  userId?: string | null,
  language?: string,
  seekerName?: string,
  canonicalActivationNames?: string,
  jyotishContext?: string,
  localeTag?: string,
  /** Voice Top 33 / active-field intelligence — edge may merge into system prompt */
  biofieldContext?: string,
  /** Comma-separated names currently in the seeker's field */
  activeTransmissionNames?: string,
) {
  const recent = messages.slice(-15);
  const apiMessages = recent.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.text,
  }));

  const now = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const loc = localeTag?.trim() || 'en-GB';
  const localTime = now.toLocaleTimeString(loc, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  });
  const localDate = now.toLocaleDateString(loc, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  });

  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: apiMessages,
      userId: userId ?? null,
      language: language ?? 'English',
      seekerName: seekerName ?? '',
      canonicalActivationNames: canonicalActivationNames ?? '',
      jyotishContext: jyotishContext ?? '',
      biofieldContext: biofieldContext ?? '',
      activeTransmissionNames: activeTransmissionNames ?? '',
      localTime,
      localDate,
      timezone,
      userImage: userImage ?? null,
    }),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`SQI transmission failed (${resp.status}): ${errText.slice(0, 200)}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;

  while (!done) {
    const { done: rDone, value } = await reader.read();
    if (rDone) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line || line.startsWith(':')) continue;
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }

  onDone();
}
