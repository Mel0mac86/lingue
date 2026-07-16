import {
  getGroqApiKey, GROQ_BASE_URL, GROQ_CHAT_MODEL, GROQ_STT_MODEL,
} from './config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('Chiave API Groq mancante. Inseriscila in Profilo → Impostazioni AI.');
    this.name = 'MissingApiKeyError';
  }
}

async function requireKey(): Promise<string> {
  const key = await getGroqApiKey();
  if (!key) throw new MissingApiKeyError();
  return key;
}

/** Plain chat completion. */
export async function chat(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number; json?: boolean } = {},
): Promise<string> {
  const key = await requireKey();
  const res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_CHAT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
      ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Chat completion that must return JSON. Retries once on parse failure and
 * tolerates markdown code fences around the payload.
 */
export async function chatJson<T>(messages: ChatMessage[], maxTokens = 2048): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const raw = await chat(messages, { temperature: attempt === 0 ? 0.4 : 0.2, maxTokens, json: true });
    try {
      return JSON.parse(extractJson(raw)) as T;
    } catch {
      if (attempt === 1) throw new Error('Risposta AI non valida (JSON malformato).');
    }
  }
  throw new Error('unreachable');
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

/**
 * Transcribe a recorded audio file with Groq Whisper.
 * @param fileUri local file uri produced by expo-av recording
 * @param languageTag BCP-47 tag, e.g. "en-US" → "en" is sent to Whisper
 */
export async function transcribeAudio(fileUri: string, languageTag: string): Promise<string> {
  const key = await requireKey();
  const form = new FormData();
  if (typeof document !== 'undefined') {
    // Web (incl. iPhone Safari/PWA): the recording URI is a blob: URL.
    const blob = await (await fetch(fileUri)).blob();
    const mime = blob.type || 'audio/webm';
    const ext = mime.includes('mp4') ? 'mp4' : mime.includes('webm') ? 'webm' : 'wav';
    form.append('file', new File([blob], `speech.${ext}`, { type: mime }));
  } else {
    // React Native FormData accepts {uri, name, type} file descriptors.
    const ext = fileUri.split('.').pop() || 'm4a';
    form.append('file', {
      uri: fileUri,
      name: `speech.${ext}`,
      type: `audio/${ext === 'caf' ? 'x-caf' : ext}`,
    } as unknown as Blob);
  }
  form.append('model', GROQ_STT_MODEL);
  form.append('language', languageTag.split('-')[0]);
  form.append('response_format', 'json');

  const res = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq STT ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.text ?? '').trim();
}
