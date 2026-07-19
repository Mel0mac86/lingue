import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  CEFRLevel, ConversationFeedback, LanguageCode, ScenarioDifficulty,
} from '../types';

/** Params for the shared conversation screen (post-lesson or free talk). */
export type ConversationParams =
  | {
    mode: 'lesson';
    language: LanguageCode;
    level: CEFRLevel;
    unitIndex: number;
    quizScore: number;
    wrongExerciseIds: string[];
    newWords: number;
  }
  | {
    mode: 'free';
    language: LanguageCode;
    difficulty: ScenarioDifficulty;
    avatarId: string;
    scenarioId?: string;
    topic?: string;
  };

export type FeedbackParams = {
  feedback: ConversationFeedback;
  minutes: number;
  lesson?: {
    language: LanguageCode;
    level: CEFRLevel;
    unitIndex: number;
    quizScore: number;
    wrongExerciseIds: string[];
    newWords: number;
  };
};

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  /**
   * `step` (kids/beginner path): one topic at a time —
   * 0 = vocabulary, 1 = expressions, 2 = grammar, 3 = final challenge
   * (quiz + avatar conversation). Omitted = full lesson in one go.
   */
  Lesson: { language: LanguageCode; level: CEFRLevel; unitIndex: number; step?: number };
  Conversation: ConversationParams;
  Feedback: FeedbackParams;
  ReviewMistakes: { language: LanguageCode; level: CEFRLevel; unitIndex: number };
  /** Daily spaced-repetition session built from already-studied material. */
  Review: undefined;
  Premium: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
