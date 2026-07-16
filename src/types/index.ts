// ─── Domain models for Lingue ────────────────────────────────────────────────

export type LanguageCode =
  | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ko';

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export type AgeBand = 'kids' | 'teens' | 'adults' | 'seniors';

export interface UserProfile {
  name: string;
  age: number;
  ageBand: AgeBand;
  nativeLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  level: CEFRLevel;
  dailyGoalMinutes: number;
  interests: string[];
  premium: boolean;
  createdAt: number;
}

// ─── Lesson content ──────────────────────────────────────────────────────────

export interface VocabItem {
  term: string;
  translation: string;
  phonetic?: string;
  example: string;
  exampleTranslation: string;
}

export interface ExpressionItem {
  phrase: string;
  translation: string;
  usage: string;
}

export interface GrammarPoint {
  title: string;
  explanation: string;
  examples: { sample: string; translation: string }[];
}

export type ExerciseKind =
  | 'listening' | 'reading' | 'writing' | 'comprehension' | 'quiz';

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  /** Question shown to the user (in the native language when helpful). */
  prompt: string;
  /** Text spoken aloud for listening exercises. */
  audioText?: string;
  /** Reading passage for reading/comprehension exercises. */
  passage?: string;
  choices?: string[];
  /** Expected answer: index into choices (as string) or free text. */
  answer: string;
  hint?: string;
}

export interface Lesson {
  id: string;
  language: LanguageCode;
  level: CEFRLevel;
  unitIndex: number;
  title: string;
  topic: string;
  vocabulary: VocabItem[];
  expressions: ExpressionItem[];
  grammar: GrammarPoint[];
  exercises: Exercise[];
  /** Instructions handed to the avatar for the post-lesson conversation. */
  conversationBrief: string;
}

export interface CurriculumUnit {
  index: number;
  level: CEFRLevel;
  title: string;
  topic: string;
  /** Concepts the unit must cover; used to generate lesson content. */
  focus: string[];
}

// ─── Conversation & feedback ─────────────────────────────────────────────────

export type SegmentStatus = 'ok' | 'warn' | 'error';

export interface CorrectionSegment {
  text: string;
  status: SegmentStatus;
  fix?: string;
  note?: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface CorrectedTurn {
  original: string;
  segments: CorrectionSegment[];
  better?: string;
}

export interface ConversationFeedback {
  pronunciation: number;
  grammar: number;
  fluency: number;
  vocabulary: number;
  overall: number;
  suggestions: string[];
  correctedTurns: CorrectedTurn[];
  encouragement: string;
}

// ─── Progress, gamification ──────────────────────────────────────────────────

export interface LessonResult {
  lessonId: string;
  quizScore: number;
  wrongExerciseIds: string[];
  conversationFeedback?: ConversationFeedback;
  passed: boolean;
  completedAt: number;
  xpEarned: number;
}

export interface DailyStat {
  day: string; // YYYY-MM-DD
  minutesSpoken: number;
  minutesStudied: number;
  xp: number;
  pronunciation: number;
  grammar: number;
}

export interface Mission {
  id: string;
  title: string;
  kind: 'lessons' | 'minutes' | 'words' | 'conversation';
  target: number;
  progress: number;
  xp: number;
  done: boolean;
}

export interface BadgeDef {
  id: string;
  title: string;
  emoji: string;
  description: string;
}

export interface ProgressState {
  results: Record<string, LessonResult>;
  xp: number;
  streak: number;
  lastStudyDay: string | null;
  minutesSpoken: number;
  minutesStudied: number;
  wordsLearned: number;
  lessonsCompleted: number;
  conversationsHeld: number;
  badges: string[];
  missions: Mission[];
  missionsDay: string | null;
  weeklyGoalXp: number;
  history: DailyStat[];
  /** Aggregated recurring mistakes, fed to the personalised study plan. */
  errorLog: { note: string; count: number }[];
  avgPronunciation: number;
  avgGrammar: number;
  avgFluency: number;
  avgVocabulary: number;
}

// ─── Avatars & scenarios ─────────────────────────────────────────────────────

export type AvatarRole =
  | 'teacher' | 'friend' | 'colleague' | 'receptionist'
  | 'customer' | 'employer' | 'tour_guide' | 'doctor';

export interface AvatarDef {
  id: string;
  name: string;
  gender: 'female' | 'male';
  ageLook: number;
  role: AvatarRole;
  personality: string;
  accent: string;
  color: string;
  skin: string;
  hair: string;
  emoji: string;
}

export type ScenarioCategory =
  | 'travel' | 'work' | 'school' | 'daily' | 'social' | 'culture';

export interface Scenario {
  id: string;
  category: ScenarioCategory;
  title: string;
  emoji: string;
  description: string;
  avatarRole: AvatarRole;
  userRole: string;
  premium?: boolean;
}

export type ScenarioDifficulty = 'beginner' | 'intermediate' | 'advanced';

// ─── App settings ────────────────────────────────────────────────────────────

export interface AppSettings {
  themeMode: 'light' | 'dark' | 'system';
  realTimeCorrections: boolean;
  ttsEnabled: boolean;
  ttsRate: number;
  groqApiKey: string | null;
}
