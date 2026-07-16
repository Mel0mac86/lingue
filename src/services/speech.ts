import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { transcribeAudio } from './groq';

/**
 * Voice layer:
 *  - TTS via the device speech engine (expo-speech), tuned per language/age;
 *  - STT by recording with expo-av and transcribing with Groq Whisper.
 */

export interface SpeakOptions {
  languageTag: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onDone?: () => void;
}

export function speak(text: string, opts: SpeakOptions): void {
  Speech.stop();
  Speech.speak(text, {
    language: opts.languageTag,
    rate: opts.rate ?? 0.95,
    pitch: opts.pitch ?? 1.0,
    onStart: opts.onStart,
    onDone: opts.onDone,
    onStopped: opts.onDone,
    onError: opts.onDone,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

let recording: Audio.Recording | null = null;

export async function startRecording(): Promise<void> {
  const perm = await Audio.requestPermissionsAsync();
  if (!perm.granted) throw new Error('Permesso microfono negato.');
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
  if (recording) {
    try { await recording.stopAndUnloadAsync(); } catch { /* already stopped */ }
    recording = null;
  }
  const { recording: rec } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY,
  );
  recording = rec;
}

/** Stops recording and returns the transcript (Groq Whisper). */
export async function stopRecordingAndTranscribe(languageTag: string): Promise<string> {
  if (!recording) throw new Error('Nessuna registrazione in corso.');
  const rec = recording;
  recording = null;
  await rec.stopAndUnloadAsync();
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  const uri = rec.getURI();
  if (!uri) throw new Error('Registrazione non disponibile.');
  return transcribeAudio(uri, languageTag);
}

export async function cancelRecording(): Promise<void> {
  if (!recording) return;
  const rec = recording;
  recording = null;
  try { await rec.stopAndUnloadAsync(); } catch { /* noop */ }
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
}
