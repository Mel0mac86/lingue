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
  Lesson: { language: LanguageCode; level: CEFRLevel; unitIndex: number };
  Conversation: ConversationParams;
  Feedback: FeedbackParams;
  ReviewMistakes: { language: LanguageCode; level: CEFRLevel; unitIndex: number };
  Premium: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
