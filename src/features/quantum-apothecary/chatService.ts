import type { Message } from './types';

const CHAT_URL = 'https://tdiqrngivbrwkhwcejvv.supabase.co/functions/v1/bright-service';
const AUTH_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkaXFybmdpdmJyd2tod2NlanZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTY0NDEsImV4cCI6MjA4MzYzMjQ0MX0.ErxtdRS1pDj06gF7-dDvNtjm-ENDSZpRO-FKT_9DiB8';

export async function streamChatWithSQI(
  messages: Message[],
  onDelta: (chunk: string) => void,
  onDone: () => void,
) {
  const apiMessages = messages.map(m => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.text,
  }));
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_KEY}`,
    },
    body: JSON.stringify({ messages: apiMessages }),
  });
  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error('Rate limited — please try again shortly.');
    if (resp.status === 402) throw new Error('Credits exhausted — please top up.');
    throw new Error('Failed to start stream');
  }
  const reader = resp.body.getReader();
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
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buf = line + '\n' + buf;
        break;
      }
    }
  }
  if (buf.trim()) {
    for (let raw of buf.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const json = raw.slice(6).trim();
      if (json === '[DONE]') continue;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {}
    }
  }
  onDone();
}
