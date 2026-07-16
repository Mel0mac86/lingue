import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Groq API key resolution.
 *
 * SECURITY: the key is NEVER hardcoded in the repository. It is read from:
 *  1. the key saved by the user in Profilo → Impostazioni AI (AsyncStorage);
 *  2. otherwise the EXPO_PUBLIC_GROQ_API_KEY environment variable
 *     (set it in a local .env file — see .env.example — which is gitignored).
 */
const KEY_STORAGE = 'lingue.groqApiKey';

let cachedKey: string | null | undefined;

export async function getGroqApiKey(): Promise<string | null> {
  if (cachedKey !== undefined) return cachedKey;
  const stored = await AsyncStorage.getItem(KEY_STORAGE);
  const resolved = stored || process.env.EXPO_PUBLIC_GROQ_API_KEY || null;
  cachedKey = resolved;
  return resolved;
}

export async function setGroqApiKey(key: string | null): Promise<void> {
  cachedKey = key || process.env.EXPO_PUBLIC_GROQ_API_KEY || null;
  if (key) await AsyncStorage.setItem(KEY_STORAGE, key);
  else await AsyncStorage.removeItem(KEY_STORAGE);
}

export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
export const GROQ_CHAT_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_STT_MODEL = 'whisper-large-v3-turbo';
