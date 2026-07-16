import type { LanguageCode } from '../types';

export interface LanguageDef {
  code: LanguageCode;
  name: string;       // Italian display name (app UI is Italian-first)
  nativeName: string;
  flag: string;
  /** BCP-47 tag used for TTS and speech recognition. */
  speechTag: string;
}

/**
 * Supported languages. Adding a new language = adding one entry here:
 * lesson content is generated per-language by the AI content pipeline
 * (see services/lessonFactory.ts) so no other code changes are required.
 */
export const LANGUAGES: LanguageDef[] = [
  { code: 'en', name: 'Inglese', nativeName: 'English', flag: '🇬🇧', speechTag: 'en-US' },
  { code: 'es', name: 'Spagnolo', nativeName: 'Español', flag: '🇪🇸', speechTag: 'es-ES' },
  { code: 'fr', name: 'Francese', nativeName: 'Français', flag: '🇫🇷', speechTag: 'fr-FR' },
  { code: 'de', name: 'Tedesco', nativeName: 'Deutsch', flag: '🇩🇪', speechTag: 'de-DE' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹', speechTag: 'it-IT' },
  { code: 'pt', name: 'Portoghese', nativeName: 'Português', flag: '🇵🇹', speechTag: 'pt-PT' },
  { code: 'ja', name: 'Giapponese', nativeName: '日本語', flag: '🇯🇵', speechTag: 'ja-JP' },
  { code: 'zh', name: 'Cinese', nativeName: '中文', flag: '🇨🇳', speechTag: 'zh-CN' },
  { code: 'ko', name: 'Coreano', nativeName: '한국어', flag: '🇰🇷', speechTag: 'ko-KR' },
];

export const languageByCode = (code: LanguageCode): LanguageDef =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

export const languageName = (code: LanguageCode): string =>
  languageByCode(code).name;
