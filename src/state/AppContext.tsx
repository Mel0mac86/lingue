import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AgeBand, AppSettings, CEFRLevel, ConversationFeedback, LessonResult,
  ProgressState, UserProfile,
} from '../types';
import { CEFR_ORDER } from '../types';
import { unitsForLevel, lessonIdFor } from '../content/curriculum';
import {
  XP_RULES, bumpMissions, earnedBadges, missionsForToday, todayKey,
} from '../services/gamification';
import { syncProgress } from '../services/firebase';
import { setSfxEnabled } from '../services/sfx';

const PROFILE_KEY = 'lingue.profile';
const PROGRESS_KEY = 'lingue.progress';
const SETTINGS_KEY = 'lingue.settings';

export function ageBandFor(age: number): AgeBand {
  if (age <= 10) return 'kids';
  if (age <= 17) return 'teens';
  if (age <= 59) return 'adults';
  return 'seniors';
}

/** Sensible starting difficulty by age; the path then progresses gradually. */
export function suggestedLevelFor(age: number): CEFRLevel {
  return age <= 12 ? 'A1' : 'A1';
}

const emptyProgress = (): ProgressState => ({
  results: {},
  stepsDone: {},
  xp: 0,
  streak: 0,
  lastStudyDay: null,
  minutesSpoken: 0,
  minutesStudied: 0,
  wordsLearned: 0,
  lessonsCompleted: 0,
  conversationsHeld: 0,
  badges: [],
  missions: missionsForToday(),
  missionsDay: todayKey(),
  weeklyGoalXp: 300,
  history: [],
  errorLog: [],
  avgPronunciation: 0,
  avgGrammar: 0,
  avgFluency: 0,
  avgVocabulary: 0,
});

const defaultSettings = (): AppSettings => ({
  themeMode: 'system',
  realTimeCorrections: false,
  ttsEnabled: true,
  ttsRate: 0.95,
  groqApiKey: null,
  sfxEnabled: true,
  realisticFaceUrl: null,
  photoAvatar: null,
});

interface AppState {
  ready: boolean;
  profile: UserProfile | null;
  progress: ProgressState;
  settings: AppSettings;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  recordLessonResult: (result: LessonResult, newWords: number) => void;
  recordStepDone: (lessonId: string, step: number) => void;
  recordConversation: (feedback: ConversationFeedback, minutes: number) => void;
  addStudyMinutes: (minutes: number) => void;
  clearWrongExercises: (lessonId: string) => void;
  isLessonUnlocked: (level: CEFRLevel, unitIndex: number) => boolean;
  resetAll: () => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<ProgressState>(emptyProgress);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, pr, s] = await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          AsyncStorage.getItem(PROGRESS_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (p) setProfile(JSON.parse(p));
        if (pr) setProgress({ ...emptyProgress(), ...JSON.parse(pr) });
        if (s) setSettings({ ...defaultSettings(), ...JSON.parse(s) });
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  // Persist on change (after initial load).
  useEffect(() => {
    if (!loaded.current) return;
    if (profile) AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    if (profile) syncProgress(profile, progress);
  }, [progress, profile]);
  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);
  // Mirror the sound setting into the fire-and-forget sfx module.
  useEffect(() => { setSfxEnabled(settings.sfxEnabled); }, [settings.sfxEnabled]);

  /** Refresh daily missions and streak when a new day starts. */
  const withDailyRefresh = useCallback((p: ProgressState): ProgressState => {
    const today = todayKey();
    if (p.missionsDay === today) return p;
    return { ...p, missions: missionsForToday(), missionsDay: today };
  }, []);

  const touchStreak = useCallback((p: ProgressState): ProgressState => {
    const today = todayKey();
    if (p.lastStudyDay === today) return p;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak = p.lastStudyDay === yesterday ? p.streak + 1 : 1;
    return { ...p, streak, lastStudyDay: today, xp: p.xp + XP_RULES.streakDay };
  }, []);

  const bumpHistory = useCallback((
    p: ProgressState,
    patch: Partial<Omit<import('../types').DailyStat, 'day'>>,
  ): ProgressState => {
    const today = todayKey();
    const history = [...p.history];
    let entry = history.find((h) => h.day === today);
    if (!entry) {
      entry = { day: today, minutesSpoken: 0, minutesStudied: 0, xp: 0, pronunciation: 0, grammar: 0 };
      history.push(entry);
    }
    Object.assign(entry, {
      minutesSpoken: entry.minutesSpoken + (patch.minutesSpoken ?? 0),
      minutesStudied: entry.minutesStudied + (patch.minutesStudied ?? 0),
      xp: entry.xp + (patch.xp ?? 0),
      pronunciation: patch.pronunciation ?? entry.pronunciation,
      grammar: patch.grammar ?? entry.grammar,
    });
    return { ...p, history: history.slice(-60) };
  }, []);

  const completeOnboarding = useCallback((newProfile: UserProfile) => {
    setProfile(newProfile);
    setProgress(emptyProgress());
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const recordLessonResult = useCallback((result: LessonResult, newWords: number) => {
    setProgress((prev) => {
      let p = withDailyRefresh(prev);
      p = touchStreak(p);
      const firstCompletion = !p.results[result.lessonId]?.passed;
      let xp = result.xpEarned;
      p = {
        ...p,
        results: { ...p.results, [result.lessonId]: result },
        wordsLearned: p.wordsLearned + (firstCompletion && result.passed ? newWords : 0),
        lessonsCompleted: p.lessonsCompleted + (firstCompletion && result.passed ? 1 : 0),
      };
      if (result.passed && firstCompletion) {
        const m1 = bumpMissions(p.missions, 'lessons', 1);
        const m2 = bumpMissions(m1.missions, 'words', newWords);
        xp += m1.xpGained + m2.xpGained;
        p = { ...p, missions: m2.missions };
      }
      p = { ...p, xp: p.xp + xp };
      const badges = earnedBadges(p, result.quizScore >= 100);
      if (badges.length) p = { ...p, badges: [...p.badges, ...badges] };
      return bumpHistory(p, { xp, minutesStudied: 0 });
    });
  }, [withDailyRefresh, touchStreak, bumpHistory]);

  const recordConversation = useCallback((feedback: ConversationFeedback, minutes: number) => {
    setProgress((prev) => {
      let p = withDailyRefresh(prev);
      p = touchStreak(p);
      let xp = XP_RULES.conversationHeld
        + (feedback.overall >= 85 ? XP_RULES.conversationGreat : 0);
      const m1 = bumpMissions(p.missions, 'conversation', 1);
      const m2 = bumpMissions(m1.missions, 'minutes', minutes);
      xp += m1.xpGained + m2.xpGained;

      // Rolling average of scores + recurring-error log for the study plan.
      const n = p.conversationsHeld;
      const roll = (avg: number, v: number) => Math.round((avg * n + v) / (n + 1));
      const errorLog = [...p.errorLog];
      for (const turn of feedback.correctedTurns) {
        for (const seg of turn.segments) {
          if (seg.status !== 'error' || !seg.note) continue;
          const existing = errorLog.find((e) => e.note === seg.note);
          if (existing) existing.count += 1;
          else errorLog.push({ note: seg.note, count: 1 });
        }
      }
      p = {
        ...p,
        missions: m2.missions,
        conversationsHeld: p.conversationsHeld + 1,
        minutesSpoken: p.minutesSpoken + minutes,
        xp: p.xp + xp,
        errorLog: errorLog.sort((a, b) => b.count - a.count).slice(0, 40),
        avgPronunciation: roll(p.avgPronunciation, feedback.pronunciation),
        avgGrammar: roll(p.avgGrammar, feedback.grammar),
        avgFluency: roll(p.avgFluency, feedback.fluency),
        avgVocabulary: roll(p.avgVocabulary, feedback.vocabulary),
      };
      const badges = earnedBadges(p, false);
      if (badges.length) p = { ...p, badges: [...p.badges, ...badges] };
      return bumpHistory(p, {
        xp,
        minutesSpoken: minutes,
        pronunciation: feedback.pronunciation,
        grammar: feedback.grammar,
      });
    });
  }, [withDailyRefresh, touchStreak, bumpHistory]);

  const addStudyMinutes = useCallback((minutes: number) => {
    setProgress((prev) => {
      let p = withDailyRefresh(prev);
      p = touchStreak(p);
      p = { ...p, minutesStudied: p.minutesStudied + minutes };
      return bumpHistory(p, { minutesStudied: minutes });
    });
  }, [withDailyRefresh, touchStreak, bumpHistory]);

  /** Kids/beginner path: one mini-step (single topic) completed. */
  const recordStepDone = useCallback((lessonId: string, step: number) => {
    setProgress((prev) => {
      let p = withDailyRefresh(prev);
      p = touchStreak(p);
      const already = p.stepsDone[lessonId] ?? 0;
      if (step + 1 <= already) return p;
      p = {
        ...p,
        stepsDone: { ...p.stepsDone, [lessonId]: step + 1 },
        xp: p.xp + 15,
      };
      return bumpHistory(p, { xp: 15 });
    });
  }, [withDailyRefresh, touchStreak, bumpHistory]);

  const clearWrongExercises = useCallback((lessonId: string) => {
    setProgress((prev) => {
      const result = prev.results[lessonId];
      if (!result) return prev;
      return {
        ...prev,
        xp: prev.xp + XP_RULES.reviewMistakes,
        results: { ...prev.results, [lessonId]: { ...result, wrongExerciseIds: [] } },
      };
    });
  }, []);

  /**
   * A lesson is unlocked when every previous lesson in the path (across
   * levels) has been passed. The first lesson of the user's starting level
   * is always available.
   */
  const isLessonUnlocked = useCallback((level: CEFRLevel, unitIndex: number): boolean => {
    if (!profile) return false;
    const startIdx = CEFR_ORDER.indexOf(profile.level);
    const levelIdx = CEFR_ORDER.indexOf(level);
    if (levelIdx < startIdx) return true; // earlier levels are review material
    // Walk the path from the starting level up to the requested lesson.
    for (let li = startIdx; li <= levelIdx; li += 1) {
      const lvl = CEFR_ORDER[li];
      const units = unitsForLevel(lvl);
      const lastUnit = li === levelIdx ? unitIndex : units.length;
      for (let u = 0; u < lastUnit; u += 1) {
        const id = lessonIdFor(profile.targetLanguage, lvl, u);
        if (!progress.results[id]?.passed) return false;
      }
    }
    return true;
  }, [profile, progress.results]);

  const resetAll = useCallback(() => {
    setProfile(null);
    setProgress(emptyProgress());
    setSettings(defaultSettings());
    AsyncStorage.multiRemove([PROFILE_KEY, PROGRESS_KEY, SETTINGS_KEY]);
  }, []);

  const value = useMemo<AppState>(() => ({
    ready, profile, progress, settings,
    completeOnboarding, updateProfile, updateSettings,
    recordLessonResult, recordStepDone, recordConversation, addStudyMinutes,
    clearWrongExercises, isLessonUnlocked, resetAll,
  }), [
    ready, profile, progress, settings,
    completeOnboarding, updateProfile, updateSettings,
    recordLessonResult, recordStepDone, recordConversation, addStudyMinutes,
    clearWrongExercises, isLessonUnlocked, resetAll,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
