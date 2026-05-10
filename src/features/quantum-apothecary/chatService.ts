import type { Message } from './types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quantum-apothecary-chat`;

function supabaseAnonHeader(): string {
  return (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    import.meta.env.VITE_SUPABASE_ANON_KEY ??
    ''
  );
}

export interface UserImagePayload {
  base64: string;
  mimeType: string;
}

export interface StreamSQIParams {
  messages: Array<{ role: string; content: string }>;
  userId?: string | null;
  seekerName?: string;
  language?: string;
  jyotishContext?: string;
  biofieldContext?: string;
  canonicalActivationNames?: string;
  activeTransmissionNames?: string;
  localTime?: string;
  localDate?: string;
  timezone?: string;
  userImage?: UserImagePayload | null;
  onChunk?: (chunk: string, fullText: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

/** Streams SQI from quantum-apothecary-chat — resilient SSE parsing, no fetch timeout (mobile-friendly). */
export async function streamSQIResponse({
  messages,
  userId,
  seekerName,
  language,
  jyotishContext,
  biofieldContext,
  canonicalActivationNames,
  activeTransmissionNames,
  localTime,
  localDate,
  timezone,
  userImage,
  onChunk,
  onComplete,
  onError,
}: StreamSQIParams): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = supabaseAnonHeader();

  const controller = new AbortController();

  let response: Response;
  try {
    response = await fetch(`${supabaseUrl}/functions/v1/quantum-apothecary-chat`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        messages,
        userId,
        seekerName,
        language,
        jyotishContext,
        biofieldContext,
        canonicalActivationNames,
        activeTransmissionNames,
        localTime,
        localDate,
        timezone,
        userImage: userImage ?? null,
      }),
    });
  } catch (err) {
    onError?.(String(err));
    return;
  }

  if (!response.ok) {
    onError?.(`HTTP ${response.status}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError?.('No stream body');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const chunk =
            parsed?.choices?.[0]?.delta?.content ??
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text ??
            '';
          if (chunk) {
            fullText += chunk;
            onChunk?.(chunk, fullText);
          }
        } catch {
          /* malformed chunk — skip, do not abort */
        }
      }
    }

    if (buffer.startsWith('data: ')) {
      const jsonStr = buffer.slice(6).trim();
      if (jsonStr && jsonStr !== '[DONE]') {
        try {
          const parsed = JSON.parse(jsonStr);
          const chunk =
            parsed?.choices?.[0]?.delta?.content ??
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text ??
            '';
          if (chunk) {
            fullText += chunk;
            onChunk?.(chunk, fullText);
          }
        } catch {
          /* ignore trailing parse errors */
        }
      }
    }

    onComplete?.(fullText);
  } catch (err) {
    if (fullText.length > 0) {
      onComplete?.(fullText);
    } else {
      onError?.(String(err));
    }
  } finally {
    reader.cancel().catch(() => {});
  }
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
      Authorization: `Bearer ${supabaseAnonHeader()}`,
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
  biofieldContext?: string,
  activeTransmissionNames?: string,
) {
  const recent = messages.slice(-15);
  const apiMessages = recent.map((m) => ({
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

  let completed = false;
  let fatal: string | undefined;

  await streamSQIResponse({
    messages: apiMessages,
    userId: userId ?? null,
    seekerName: seekerName ?? '',
    language: language ?? 'English',
    canonicalActivationNames: canonicalActivationNames ?? '',
    jyotishContext: jyotishContext ?? '',
    biofieldContext: biofieldContext ?? '',
    activeTransmissionNames: activeTransmissionNames ?? '',
    localTime,
    localDate,
    timezone,
    userImage: userImage ?? null,
    onChunk: (chunk) => onDelta(chunk),
    onComplete: () => {
      completed = true;
      onDone();
    },
    onError: (msg) => {
      fatal = msg;
    },
  });

  if (!completed) {
    throw new Error(fatal || 'SQI transmission failed');
  }
}
