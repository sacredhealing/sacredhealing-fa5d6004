import type { Message } from './types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quantum-apothecary-chat`;

// Dedicated palm scan — uses the edge function's scanMode path which does independent
// image-based analysis without the SQI chat personality (no user self-diagnosis risk).
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

export interface UserImagePayload {
  base64: string;
  mimeType: string;
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
  jyotishContext?: string,       // ← Jyotish birth chart data for accurate life readings
  /** BCP 47 locale for localTime/localDate (must match client “LIVE SYSTEM TIME” line). */
  localeTag?: string,
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

  const body: {
    messages: typeof apiMessages;
    userImage?: UserImagePayload;
    userId?: string | null;
    language?: string;
    seekerName?: string;
    canonicalActivationNames?: string;
    localTime?: string;
    localDate?: string;
    jyotishContext?: string;
    timezone?: string;
  } = { messages: apiMessages, localTime, localDate, timezone };

  if (userImage?.base64 && userImage?.mimeType) body.userImage = userImage;
  if (userId)                                    body.userId = userId;
  if (language)                                  body.language = language;
  if (seekerName?.trim())                        body.seekerName = seekerName.trim();
  if (canonicalActivationNames?.trim())          body.canonicalActivationNames = canonicalActivationNames.trim();
  if (jyotishContext?.trim())                    body.jyotishContext = jyotishContext.trim();

  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error('Rate limited — please try again shortly.');
    if (resp.status === 402) throw new Error('Credits exhausted — please top up.');
    throw new Error('Failed to start stream');
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.replace(/\r$/, '').trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (!trimmed.startsWith('data: ')) continue;
      const jsonStr = trimmed.slice(6).trim();
      if (jsonStr === '[DONE]') {
        streamDone = true;
        break;
      }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        /* incomplete JSON across chunks — wait for more */
      }
    }
  }

  if (buffer.trim()) {
    const trimmed = buffer.replace(/\r$/, '').trim();
    if (trimmed.startsWith('data: ')) {
      const jsonStr = trimmed.slice(6).trim();
      if (jsonStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore trailing garbage */
        }
      }
    }
  }

  onDone();
}
