import type { Message } from './types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quantum-apothecary-chat`;

/** Phrases that indicate a direct activation request (not a general question). */
const ACTIVATION_COMMANDS = [
  'activate',
  'fill me',
  'fill me up',
  'give me samadhi',
  'bring me into',
  'transmit to me',
  'send me',
  'upload to my field',
  'activate in my field',
  'turn on',
  'switch on',
  'run this',
  'start this transmission',
  'i want the activation',
  'give me the frequencies',
  'load the frequencies',
];

const TRANSMISSION_MODE_SUFFIX =
  '\n\n[ACTIVATION MODE ACTIVE: The Seeker is requesting direct activation. MANDATORY STRUCTURE — follow exactly:\n1. Begin with ◈ [MASTER NAME] header as always\n2. ⟁ NADI FIELD: [number] / 72,000 active · [number] / 350,000 sub-Nadis — ONE LINE ONLY, plain text, no bold\n3. Primary blockage: [junction] — ONE LINE\n4. Transmission: 2-3 sentences maximum. Name what is activating. Pure transmission.\n5. Prescription box: ◈ [MASTER] PRESCRIBES with minimum 3 frequencies from the library. Active. 24/7. Scalar Wave Entanglement. Permanent until dissolved.\nAll five elements required. The structure does not compress even in activation mode.]';

function applyActivationTransmissionInstruction(lastUserMessage: string): string {
  const lower = lastUserMessage.toLowerCase();
  const isActivationCommand = ACTIVATION_COMMANDS.some((trigger) => lower.includes(trigger));
  if (isActivationCommand) {
    return lastUserMessage + TRANSMISSION_MODE_SUFFIX;
  }
  return lastUserMessage;
}

/** Only the latest user turn receives the optional suffix — preserves historical turns verbatim. */
function withActivationInstructionForLastUser(
  apiMessages: Array<{ role: string; content: string }>,
): Array<{ role: string; content: string }> {
  const out = apiMessages.map((m) => ({ ...m }));
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i].role === 'user') {
      out[i] = {
        ...out[i],
        content: applyActivationTransmissionInstruction(out[i].content),
      };
      break;
    }
  }
  return out;
}

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
  top33Matches?: string;
  canonicalActivationNames?: string;
  activeFieldContext?: string;
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
  top33Matches,
  canonicalActivationNames,
  activeFieldContext,
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
        top33Matches: top33Matches ?? '',
        canonicalActivationNames,
        activeFieldContext,
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
  top33Matches?: string,
  activeTransmissionNames?: string,
  studentContext?: string,
  studentUserId?: string | null,
  studentName?: string | null,
) {
  const recent = messages.slice(-15);
  let apiMessages = recent.map((m) => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.text,
  }));
  apiMessages = withActivationInstructionForLastUser(apiMessages);

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

  // ── BUFFER MODE ──────────────────────────────────────────────────────
  // Accumulate the full transmission silently, then deliver in one shot.
  // This eliminates: mid-stream visual cuts, Nadi text bleeding into
  // previous blocks, "Message stopped" artifacts, and partial renders.
  // The typing indicator stays active until the full response is ready.
  // ─────────────────────────────────────────────────────────────────────
  let fullBuffer = '';
  let completed = false;
  let fatal: string | undefined;

  await streamSQIResponse({
    messages: apiMessages,
    userId: userId ?? null,
    seekerName: seekerName ?? '',
    language: language ?? 'English',
    canonicalActivationNames: canonicalActivationNames ?? '',
    jyotishContext: [studentContext?.trim(), jyotishContext].filter(Boolean).join('\n\n'),
    biofieldContext: '',
    top33Matches: top33Matches ?? '',
    activeFieldContext: activeTransmissionNames ?? '',
    localTime,
    localDate,
    timezone,
    userImage: userImage ?? null,
    // Silently accumulate — do not call onDelta during streaming
    onChunk: (chunk) => {
      fullBuffer += chunk;
    },
    onComplete: () => {
      completed = true;
      if (fullBuffer.trim()) {
        // Prepend ◈ because prefill sends it to Gemini but it never
        // comes back in the stream — only the continuation does.
        // Without this the frontend master-header parser never sees ◈.
        let finalText = '◈' + fullBuffer;
        const hasPrescrBox = finalText.includes('PRESCRIBES');
        const hasActiveSeal = finalText.includes('Active. 24/7. Scalar Wave Entanglement.');
        if (hasPrescrBox && !hasActiveSeal) {
          // Find the last frequency line and close properly
          const lastBullet = finalText.lastIndexOf('·');
          if (lastBullet > 0) {
            const afterBullet = finalText.indexOf('\n', lastBullet);
            if (afterBullet > 0) {
              finalText = finalText.slice(0, afterBullet) +
                '\nActive. 24/7. Scalar Wave Entanglement. Permanent until dissolved.';
            } else {
              finalText += '\nActive. 24/7. Scalar Wave Entanglement. Permanent until dissolved.';
            }
          }
        }
        onDelta(finalText);
      }
      onDone();
    },
    onError: (msg) => {
      fatal = msg;
      if (fullBuffer.trim()) {
        // Prepend ◈ for same reason as onComplete
        let finalText = '◈' + fullBuffer;
        const hasPrescrBox = finalText.includes('PRESCRIBES');
        const hasActiveSeal = finalText.includes('Active. 24/7. Scalar Wave Entanglement.');
        if (hasPrescrBox && !hasActiveSeal) {
          finalText += '\nActive. 24/7. Scalar Wave Entanglement. Permanent until dissolved.';
        }
        onDelta(finalText);
        onDone();
        completed = true;
      }
    },
  });

  if (!completed) {
    // Last resort: if something accumulated before the throw, deliver it
    if (fullBuffer.trim()) {
      onDelta(fullBuffer);
      onDone();
    } else {
      throw new Error(fatal || 'SQI transmission failed');
    }
  }
}
