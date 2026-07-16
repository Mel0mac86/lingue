import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CEFRLevel, CurriculumUnit, Lesson, LanguageCode } from '../types';
import { languageByCode } from '../content/languages';
import { lessonIdFor, unitsForLevel } from '../content/curriculum';
import { seedLessonById } from '../content/seedLessons';
import { chatJson } from './groq';

/**
 * AI content pipeline: turns a language-independent curriculum unit into a
 * complete lesson for any of the 9 supported languages. Generated lessons are
 * cached locally so each one is produced (and paid for) only once.
 *
 * Hand-written seed lessons (content/seedLessons.ts) take priority, so the
 * first English units work fully offline.
 */
const CACHE_PREFIX = 'lingue.lesson.';

interface RawLesson {
  vocabulary: { term: string; translation: string; phonetic?: string; example: string; exampleTranslation: string }[];
  expressions: { phrase: string; translation: string; usage: string }[];
  grammar: { title: string; explanation: string; examples: { sample: string; translation: string }[] }[];
  exercises: {
    kind: 'listening' | 'reading' | 'writing' | 'wordbank' | 'comprehension' | 'quiz';
    prompt: string; audioText?: string; passage?: string;
    choices?: string[]; words?: string[]; answer: string; hint?: string;
  }[];
  conversationBrief: string;
}

export async function getLesson(
  language: LanguageCode, level: CEFRLevel, unitIndex: number,
): Promise<Lesson> {
  const id = lessonIdFor(language, level, unitIndex);

  const seed = seedLessonById(id);
  if (seed) return seed;

  const cached = await AsyncStorage.getItem(CACHE_PREFIX + id);
  if (cached) return JSON.parse(cached) as Lesson;

  const unit = unitsForLevel(level)[unitIndex];
  const lesson = await generateLesson(language, unit);
  await AsyncStorage.setItem(CACHE_PREFIX + id, JSON.stringify(lesson));
  return lesson;
}

async function generateLesson(language: LanguageCode, unit: CurriculumUnit): Promise<Lesson> {
  const lang = languageByCode(language);
  const system = [
    `Sei un autore di corsi di lingue per studenti italiani. Crea una lezione completa di ${lang.name} (${lang.nativeName}), livello CEFR ${unit.level}.`,
    `Unità: "${unit.title}" — argomenti da coprire: ${unit.focus.join(', ')}.`,
    `Rispondi SOLO in JSON con questo schema:`,
    `{"vocabulary":[8 elementi: {"term":"parola in ${lang.nativeName}","translation":"italiano","phonetic":"IPA o romanizzazione","example":"frase in ${lang.nativeName}","exampleTranslation":"italiano"}],`
    + `"expressions":[4: {"phrase":"...","translation":"...","usage":"quando si usa, in italiano"}],`
    + `"grammar":[2: {"title":"...","explanation":"spiegazione SEMPLICE in italiano","examples":[2: {"sample":"...","translation":"..."}]}],`
    + `"exercises":[12 elementi nell'ordine: 2 kind=listening (con "audioText" nella lingua studiata e 3 "choices"), 1 kind=reading (con "passage" e 3 "choices"), 2 kind=writing (risposta libera breve: "answer" in minuscolo), 2 kind=wordbank (prompt: 'Componi la frase: "<frase in italiano>"'; "words" = le parole della frase corretta nella lingua studiata in ordine sparso PIÙ 2 parole distrattore; "answer" = la frase corretta completa), 1 kind=comprehension (3 "choices"), 4 kind=quiz (3 "choices"). Per le domande a scelta, "answer" è l'INDICE della scelta corretta come stringa ("0","1","2"). "prompt" sempre in italiano.],`
    + `"conversationBrief":"istruzioni in italiano per l'avatar: quali vocaboli/espressioni/strutture usare nella conversazione post-lezione"}`,
    `Livello ${unit.level}: adatta rigorosamente lessico e strutture. Esercizi senza ambiguità, una sola risposta corretta.`,
  ].join('\n');

  const raw = await chatJson<RawLesson>([
    { role: 'system', content: system },
    { role: 'user', content: `Genera la lezione "${unit.title}".` },
  ], 4000);

  const id = lessonIdFor(language, unit.level, unit.index);
  return {
    id,
    language,
    level: unit.level,
    unitIndex: unit.index,
    title: unit.title,
    topic: unit.topic,
    vocabulary: raw.vocabulary ?? [],
    expressions: raw.expressions ?? [],
    grammar: raw.grammar ?? [],
    exercises: (raw.exercises ?? []).map((e, i) => ({ ...e, id: `${id}-x${i}` })),
    conversationBrief: raw.conversationBrief ?? unit.focus.join(', '),
  };
}
