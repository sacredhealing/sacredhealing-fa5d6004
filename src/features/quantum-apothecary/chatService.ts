import type { Message } from './types';
import { supabase } from '@/integrations/supabase/client';

function chatUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) throw new Error('VITE_SUPABASE_URL is not set — cannot reach quantum-apothecary-chat.');
  return `${String(base).replace(/\/$/, '')}/functions/v1/quantum-apothecary-chat`;
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
) {
  const recent = messages.slice(-15);
  const apiMessages = recent.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.text,
  }));

  const body: {
    messages: typeof apiMessages;
    userImage?: UserImagePayload;
    userId?: string | null;
    language?: string;
    seekerName?: string;
    canonicalActivationNames?: string;
  } = { messages: apiMessages };

  if (userImage?.base64 && userImage?.mimeType) body.userImage = userImage;
  if (userId) body.userId = userId;
  if (language) body.language = language;
  if (seekerName?.trim()) body.seekerName = seekerName.trim();
  if (canonicalActivationNames?.trim()) body.canonicalActivationNames = canonicalActivationNames.trim();

  const apikey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    '';
  const { data: sess } = await supabase.auth.getSession();
  const bearer = sess.session?.access_token || apikey;
  if (!bearer) {
    throw new Error('Not signed in and no Supabase anon key configured.');
  }

  let resp: Response;
  try {
    resp = await fetch(chatUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer}`,
        ...(apikey ? { apikey } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : 'Network error';
    throw new Error(
      `${m} — check connection, disable blockers, and deploy quantum-apothecary-chat on Supabase.`,
    );
  }

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error('Rate limited — please try again shortly.');
    if (resp.status === 402) throw new Error('Credits exhausted — please top up.');
    const errSnippet = await resp.text().catch(() => '');
    throw new Error(
      errSnippet ? `Chat connect failed (${resp.status}): ${errSnippet.slice(0, 160)}` : `Failed to start stream (${resp.status})`,
    );
  }

  const reader  = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { streamDone = true; break; }
      try {
        const parsed  = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { buf = line + '\n' + buf; break; }
    }
  }

  // flush
  if (buf.trim()) {
    for (let raw of buf.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const json = raw.slice(6).trim();
      if (json === '[DONE]') continue;
      try {
        const parsed  = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
