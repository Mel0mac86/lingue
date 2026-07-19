import type {
  Exercise, Lesson, ProgressState, UserProfile, VocabItem,
} from '../types';
import { CEFR_ORDER } from '../types';
import { lessonIdFor, unitsForLevel } from '../content/curriculum';
import { getLesson } from './lessonFactory';

/**
 * Spaced-repetition Ripasso: builds a short mixed session from material the
 * user has ALREADY studied — the exercises they got wrong first (they need
 * them most), then a vocabulary matching game and a couple of exercises
 * sampled from past lessons. The sample changes every day (date-seeded), so
 * coming back tomorrow gives a different mix.
 *
 * Only passed lessons are loaded, so everything comes from the seed content
 * or the local cache: no AI call, works offline.
 */
/** All lessons the user has passed, loaded from seed content / local cache. */
async function loadPassedLessons(
  profile: UserProfile, progress: ProgressState,
): Promise<Lesson[]> {
  const lessons: Lesson[] = [];
  for (const level of CEFR_ORDER) {
    for (const unit of unitsForLevel(level)) {
      const id = lessonIdFor(profile.targetLanguage, level, unit.index);
      if (progress.results[id]?.passed) {
        try {
          lessons.push(await getLesson(profile.targetLanguage, level, unit.index));
        } catch {
          // cache evicted and offline: just skip this lesson
        }
      }
    }
  }
  return lessons;
}

/** Personal dictionary: every word studied in completed lessons. */
export async function learnedVocabulary(
  profile: UserProfile, progress: ProgressState,
): Promise<{ item: VocabItem; lessonTitle: string }[]> {
  const lessons = await loadPassedLessons(profile, progress);
  const seen = new Set<string>();
  const out: { item: VocabItem; lessonTitle: string }[] = [];
  for (const l of lessons) {
    for (const v of l.vocabulary) {
      const key = v.term.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ item: v, lessonTitle: l.title });
    }
  }
  return out;
}

export async function buildReviewSession(
  profile: UserProfile, progress: ProgressState,
): Promise<Exercise[]> {
  const lessons = await loadPassedLessons(profile, progress);
  if (lessons.length === 0) return [];

  const day = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (const c of day) seed = ((seed << 5) - seed + c.charCodeAt(0)) | 0;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) | 0;
    return Math.abs(seed) / 2147483647;
  };
  const pick = <T,>(arr: T[], n: number): T[] => {
    const copy = [...arr];
    const out: T[] = [];
    while (copy.length > 0 && out.length < n) {
      out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
    }
    return out;
  };

  const wrong: Exercise[] = [];
  for (const l of lessons) {
    const ids = progress.results[l.id]?.wrongExerciseIds ?? [];
    for (const e of l.exercises) if (ids.includes(e.id)) wrong.push(e);
  }
  const vocab: VocabItem[] = lessons.flatMap((l) => l.vocabulary);
  const pool: Exercise[] = lessons.flatMap(
    (l) => l.exercises.filter((e) => e.kind !== 'quiz' && e.kind !== 'speaking'),
  );

  const queue: Exercise[] = pick(wrong, 4);
  const pv = pick(vocab, 5);
  if (pv.length >= 3) {
    queue.push({
      id: `review-pairs-${day}`,
      kind: 'pairs',
      prompt: 'Ripassa il vocabolario: tocca una parola e la sua traduzione.',
      pairs: pv.map((v) => ({ left: v.term, right: v.translation })),
      answer: '',
    });
  }
  const fillers = pool.filter((e) => !queue.some((q) => q.id === e.id));
  queue.push(...pick(fillers, Math.max(0, 8 - queue.length)));
  return queue;
}
