import type { BadgeDef, Mission, ProgressState } from '../types';

// ─── XP & levels ─────────────────────────────────────────────────────────────

export const XP_RULES = {
  lessonCompleted: 50,
  lessonPerfectQuiz: 25,
  conversationHeld: 40,
  conversationGreat: 30, // overall ≥ 85
  missionDone: 20,
  streakDay: 10,
  reviewMistakes: 15,
};

/** Level curve: each level requires progressively more XP. */
export function levelForXp(xp: number): { level: number; intoLevel: number; needed: number } {
  let level = 1;
  let threshold = 100;
  let remaining = xp;
  while (remaining >= threshold) {
    remaining -= threshold;
    level += 1;
    threshold = Math.round(threshold * 1.25);
  }
  return { level, intoLevel: remaining, needed: threshold };
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export const BADGES: BadgeDef[] = [
  { id: 'first-lesson', title: 'Primo passo', emoji: '🌱', description: 'Completa la prima lezione' },
  { id: 'first-talk', title: 'Rompighiaccio', emoji: '🗣️', description: 'Prima conversazione con un avatar' },
  { id: 'streak-3', title: 'Costanza', emoji: '🔥', description: '3 giorni di streak' },
  { id: 'streak-7', title: 'Settimana di fuoco', emoji: '🚀', description: '7 giorni di streak' },
  { id: 'streak-30', title: 'Inarrestabile', emoji: '💎', description: '30 giorni di streak' },
  { id: 'words-100', title: 'Collezionista', emoji: '📚', description: '100 parole imparate' },
  { id: 'words-500', title: 'Dizionario vivente', emoji: '🧠', description: '500 parole imparate' },
  { id: 'talk-10', title: 'Chiacchierone', emoji: '💬', description: '10 conversazioni completate' },
  { id: 'minutes-60', title: 'Ora di gloria', emoji: '⏱️', description: '60 minuti parlati in totale' },
  { id: 'perfect-quiz', title: 'Perfezionista', emoji: '🎯', description: 'Quiz completato al 100%' },
  { id: 'lessons-10', title: 'Studente modello', emoji: '🎓', description: '10 lezioni completate' },
  { id: 'level-5', title: 'Veterano', emoji: '🏆', description: 'Raggiungi il livello 5' },
];

export function earnedBadges(p: ProgressState, perfectQuiz: boolean): string[] {
  const has = new Set(p.badges);
  const earned: string[] = [];
  const grant = (id: string, cond: boolean) => {
    if (cond && !has.has(id)) earned.push(id);
  };
  grant('first-lesson', p.lessonsCompleted >= 1);
  grant('first-talk', p.conversationsHeld >= 1);
  grant('streak-3', p.streak >= 3);
  grant('streak-7', p.streak >= 7);
  grant('streak-30', p.streak >= 30);
  grant('words-100', p.wordsLearned >= 100);
  grant('words-500', p.wordsLearned >= 500);
  grant('talk-10', p.conversationsHeld >= 10);
  grant('minutes-60', p.minutesSpoken >= 60);
  grant('perfect-quiz', perfectQuiz);
  grant('lessons-10', p.lessonsCompleted >= 10);
  grant('level-5', levelForXp(p.xp).level >= 5);
  return earned;
}

// ─── Daily missions ──────────────────────────────────────────────────────────

const MISSION_POOL: Omit<Mission, 'progress' | 'done'>[] = [
  { id: 'm-lesson-1', title: 'Completa 1 lezione', kind: 'lessons', target: 1, xp: 20 },
  { id: 'm-lesson-2', title: 'Completa 2 lezioni', kind: 'lessons', target: 2, xp: 40 },
  { id: 'm-minutes-5', title: 'Parla per 5 minuti', kind: 'minutes', target: 5, xp: 20 },
  { id: 'm-minutes-10', title: 'Parla per 10 minuti', kind: 'minutes', target: 10, xp: 35 },
  { id: 'm-words-8', title: 'Impara 8 parole nuove', kind: 'words', target: 8, xp: 20 },
  { id: 'm-talk-1', title: 'Fai 1 conversazione con un avatar', kind: 'conversation', target: 1, xp: 25 },
  { id: 'm-talk-2', title: 'Fai 2 conversazioni con un avatar', kind: 'conversation', target: 2, xp: 45 },
];

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Deterministic per-day selection of 3 missions. */
export function missionsForToday(): Mission[] {
  const day = todayKey();
  let seed = 0;
  for (const c of day) seed = (seed * 31 + c.charCodeAt(0)) % 100000;
  const pool = [...MISSION_POOL];
  const chosen: Mission[] = [];
  for (let i = 0; i < 3 && pool.length > 0; i += 1) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const idx = seed % pool.length;
    chosen.push({ ...pool.splice(idx, 1)[0], progress: 0, done: false });
  }
  return chosen;
}

export function bumpMissions(
  missions: Mission[], kind: Mission['kind'], amount: number,
): { missions: Mission[]; xpGained: number } {
  let xpGained = 0;
  const updated = missions.map((m) => {
    if (m.kind !== kind || m.done) return m;
    const progress = Math.min(m.target, m.progress + amount);
    const done = progress >= m.target;
    if (done) xpGained += m.xp;
    return { ...m, progress, done };
  });
  return { missions: updated, xpGained };
}
