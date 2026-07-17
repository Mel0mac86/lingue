import { Audio } from 'expo-av';

/**
 * Tiny sound-effects layer. The WAVs are synthesized by
 * scripts/make-sounds.js (no licensed audio assets).
 *
 * AppProvider mirrors the user's "effetti sonori" setting into this module
 * so call sites can just fire and forget.
 */
export type SfxName = 'correct' | 'wrong' | 'fanfare';

/* eslint-disable @typescript-eslint/no-var-requires, global-require */
const SOURCES: Record<SfxName, number> = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  fanfare: require('../../assets/sounds/fanfare.wav'),
};

let enabled = true;
const cache = new Map<SfxName, Audio.Sound>();

export function setSfxEnabled(value: boolean): void {
  enabled = value;
}

export async function playSfx(name: SfxName): Promise<void> {
  if (!enabled) return;
  try {
    let sound = cache.get(name);
    if (!sound) {
      const created = await Audio.Sound.createAsync(SOURCES[name], { volume: 0.8 });
      sound = created.sound;
      cache.set(name, sound);
    }
    await sound.replayAsync();
  } catch {
    // Sound is decoration: never let it break the flow.
  }
}
