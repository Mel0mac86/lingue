import type { ProgressState, UserProfile } from '../types';
import { chatJson } from './groq';

export interface StudyPlan {
  focusAreas: string[];
  weeklyGoal: string;
  tips: string[];
  suggestedMinutesPerDay: number;
}

/**
 * Personalised study plan: the AI analyses recurring mistakes, average
 * scores, study pace and the user's goals/interests, then produces a
 * focused weekly plan.
 */
export async function buildStudyPlan(
  profile: UserProfile, progress: ProgressState,
): Promise<StudyPlan> {
  const topErrors = [...progress.errorLog]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((e) => `${e.note} (×${e.count})`);

  const system = [
    'Sei un coach linguistico. Analizza i dati dello studente e crea un piano di studio settimanale personalizzato, in italiano.',
    'Rispondi in JSON: {"focusAreas":["max 4 aree su cui concentrarsi"],"weeklyGoal":"obiettivo concreto della settimana","tips":["max 4 consigli pratici"],"suggestedMinutesPerDay":numero}',
  ].join('\n');

  const user = [
    `Studente: ${profile.name}, ${profile.age} anni, studia ${profile.targetLanguage} (livello ${profile.level}).`,
    `Interessi: ${profile.interests.join(', ') || 'non indicati'}.`,
    `Obiettivo giornaliero attuale: ${profile.dailyGoalMinutes} minuti.`,
    `Statistiche: ${progress.lessonsCompleted} lezioni, ${progress.conversationsHeld} conversazioni, ${progress.minutesSpoken} min parlati, streak ${progress.streak}.`,
    `Punteggi medi: pronuncia ${progress.avgPronunciation}, grammatica ${progress.avgGrammar}, fluidità ${progress.avgFluency}, vocabolario ${progress.avgVocabulary}.`,
    `Errori ricorrenti: ${topErrors.length ? topErrors.join('; ') : 'nessun dato ancora'}.`,
  ].join('\n');

  const plan = await chatJson<StudyPlan>([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ], 900);

  return {
    focusAreas: (plan.focusAreas ?? []).slice(0, 4),
    weeklyGoal: plan.weeklyGoal ?? 'Continua con costanza: 5 giorni di studio questa settimana.',
    tips: (plan.tips ?? []).slice(0, 4),
    suggestedMinutesPerDay: Math.max(5, Math.min(60, Math.round(plan.suggestedMinutesPerDay || profile.dailyGoalMinutes))),
  };
}
