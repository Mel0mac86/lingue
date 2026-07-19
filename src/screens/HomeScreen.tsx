import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UNIT_COLORS, useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Body, Card, Muted, ProgressBar } from '../components/ui';
import { unitsForLevel, lessonIdFor } from '../content/curriculum';
import { languageByCode } from '../content/languages';
import { levelForXp } from '../services/gamification';
import { CEFR_ORDER, type CEFRLevel } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Serpentine horizontal offsets, Duolingo-style. */
const WAVE = [0, 45, 70, 45, 0, -45, -70, -45];

const NODE = 74;
const STEP_NODE = 58;

/** One topic per node on the kids/beginner path. */
const STEP_META = [
  { emoji: '📚', label: 'Parole' },
  { emoji: '💬', label: 'Frasi' },
  { emoji: '🧠', label: 'Grammatica' },
  { emoji: '🏁', label: 'Sfida' },
] as const;

/**
 * Duolingo-style learning path: one coloured section banner per unit, then
 * big circular lesson nodes winding down the screen. Completed = star,
 * current = highlighted with a START bubble, locked = grey padlock.
 */
export function HomeScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { profile, progress, isLessonUnlocked } = useApp();
  if (!profile) return null;

  const lang = languageByCode(profile.targetLanguage);
  const startIdx = CEFR_ORDER.indexOf(profile.level);
  const visibleLevels = CEFR_ORDER.slice(startIdx);
  const lvl = levelForXp(progress.xp);

  // Find the "current" node: first unlocked-but-not-passed lesson.
  let currentId: string | null = null;
  outer:
  for (const level of visibleLevels) {
    for (const unit of unitsForLevel(level)) {
      const id = lessonIdFor(profile.targetLanguage, level, unit.index);
      if (!progress.results[id]?.passed && isLessonUnlocked(level, unit.index)) {
        currentId = id;
        break outer;
      }
    }
  }

  let globalUnitIndex = -1;
  const anyPassed = Object.values(progress.results).some((r) => r?.passed);

  // Spaced-repetition entry point, repeated along the path every 3 units.
  const reviewNode = () => (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Pressable
        onPress={() => nav.navigate('Review')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#CE82FF',
          borderBottomWidth: pressed ? 2 : 5,
          borderColor: '#A568CC',
          borderRadius: 18,
          paddingHorizontal: 20,
          paddingVertical: 11,
        })}
      >
        <Text style={{ fontSize: 22, marginRight: 8 }}>💪</Text>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 * t.fontScale }}>
          Ripasso
        </Text>
      </Pressable>
      <Muted style={{ marginTop: 4, fontSize: 11.5 * t.fontScale }}>
        Errori e parole già studiate
      </Muted>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {/* Duolingo-style top stat bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: t.spacing.xl, paddingVertical: 12,
        borderBottomWidth: 2, borderColor: t.colors.border,
      }}
      >
        <Text style={{ fontSize: 24 }}>{lang.flag}</Text>
        <Text style={{ fontWeight: '900', fontSize: 17 * t.fontScale, color: '#FF9600' }}>
          🔥 {progress.streak}
        </Text>
        <Text style={{ fontWeight: '900', fontSize: 17 * t.fontScale, color: t.colors.blue }}>
          ⚡ {progress.xp} XP
        </Text>
        <Text style={{ fontWeight: '900', fontSize: 17 * t.fontScale, color: t.colors.primary }}>
          🏅 Liv. {lvl.level}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Daily quests */}
        <View style={{ padding: t.spacing.lg, paddingBottom: 4 }}>
          <Card style={{ borderColor: t.colors.gold }}>
            <Body style={{ fontWeight: '900', marginBottom: 8 }}>🎯 Missioni del giorno</Body>
            {progress.missions.map((m) => (
              <View key={m.id} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Muted style={{ color: t.colors.text, fontWeight: '700' }}>
                    {m.done ? '✅ ' : ''}{m.title}
                  </Muted>
                  <Muted style={{ fontWeight: '800', color: '#FF9600' }}>+{m.xp} XP</Muted>
                </View>
                <ProgressBar
                  value={(m.progress / m.target) * 100}
                  color={m.done ? t.colors.primary : t.colors.gold}
                />
              </View>
            ))}
          </Card>
        </View>

        {/* Path */}
        {visibleLevels.map((level: CEFRLevel) => {
          const units = unitsForLevel(level);
          const done = units.filter(
            (u) => progress.results[lessonIdFor(profile.targetLanguage, level, u.index)]?.passed,
          ).length;
          return (
            <View key={level}>
              {/* Section banner */}
              <View style={{ paddingHorizontal: t.spacing.lg, marginTop: 18, marginBottom: 8 }}>
                <View style={{
                  backgroundColor: UNIT_COLORS[CEFR_ORDER.indexOf(level) % UNIT_COLORS.length].main,
                  borderBottomWidth: 5,
                  borderColor: UNIT_COLORS[CEFR_ORDER.indexOf(level) % UNIT_COLORS.length].edge,
                  borderRadius: 18,
                  padding: t.spacing.lg,
                }}
                >
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 * t.fontScale, opacity: 0.9, letterSpacing: 1 }}>
                    SEZIONE {level}
                  </Text>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 * t.fontScale, marginTop: 2 }}>
                    {done}/{units.length} unità completate
                  </Text>
                </View>
              </View>

              {units.map((unit) => {
                globalUnitIndex += 1;
                const showReviewAfter = anyPassed && (globalUnitIndex + 1) % 3 === 0;
                const id = lessonIdFor(profile.targetLanguage, level, unit.index);
                const result = progress.results[id];
                const unlocked = isLessonUnlocked(level, unit.index);
                const isCurrent = id === currentId;
                const color = UNIT_COLORS[globalUnitIndex % UNIT_COLORS.length];
                const offset = WAVE[unit.index % WAVE.length];
                const hasMistakes = result?.passed && (result?.wrongExerciseIds?.length ?? 0) > 0;

                // Kids and beginners (A1) walk the path one topic at a time:
                // four mini-nodes per unit instead of one big lesson.
                if (profile.ageBand === 'kids' || level === 'A1') {
                  const stepsDone = progress.stepsDone[id] ?? 0;
                  const currentStep = Math.min(stepsDone, 3);
                  return (
                    <React.Fragment key={id}>
                    <View style={{ alignItems: 'center', marginVertical: 8 }}>
                      <Text style={{
                        marginTop: 8,
                        fontWeight: '900',
                        fontSize: 15 * t.fontScale,
                        color: unlocked ? t.colors.text : t.colors.textMuted,
                      }}
                      >
                        {unit.title}
                      </Text>
                      {STEP_META.map((meta, s) => {
                        const done = result?.passed || stepsDone > s;
                        const locked = !unlocked || (!done && stepsDone < s);
                        const isHere = isCurrent && s === currentStep && !result?.passed;
                        const stepOffset = WAVE[(unit.index * 2 + s + 1) % WAVE.length];
                        return (
                          <View key={meta.label} style={{ alignItems: 'center', marginVertical: 7 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ translateX: stepOffset }] }}>
                              <Pressable
                                disabled={locked}
                                onPress={() => nav.navigate('Lesson', {
                                  language: profile.targetLanguage, level, unitIndex: unit.index, step: s,
                                })}
                                style={({ pressed }) => ({
                                  width: STEP_NODE,
                                  height: STEP_NODE,
                                  borderRadius: STEP_NODE / 2,
                                  backgroundColor: locked ? t.colors.locked
                                    : done ? t.colors.gold : color.main,
                                  borderBottomWidth: pressed ? 2 : 6,
                                  borderColor: locked ? (t.dark ? '#22343d' : '#CFCFCF')
                                    : done ? '#D6A800' : color.edge,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                })}
                              >
                                <Text style={{ fontSize: 24 }}>
                                  {done ? '⭐' : locked ? '🔒' : meta.emoji}
                                </Text>
                              </Pressable>
                              {isHere && <Text style={{ fontSize: 28, marginLeft: 8 }}>🦉</Text>}
                            </View>
                            <Text style={{
                              transform: [{ translateX: stepOffset }],
                              marginTop: 3,
                              fontWeight: '800',
                              fontSize: 11.5 * t.fontScale,
                              color: locked ? t.colors.textMuted : t.colors.text,
                            }}
                            >
                              {meta.label}
                            </Text>
                          </View>
                        );
                      })}
                      {result?.passed && (
                        <Muted style={{ fontSize: 11.5 * t.fontScale }}>
                          Quiz {result.quizScore}%
                          {result.conversationFeedback ? ` · 🗣 ${result.conversationFeedback.overall}` : ''}
                        </Muted>
                      )}
                      {hasMistakes && (
                        <Pressable
                          onPress={() => nav.navigate('ReviewMistakes', {
                            language: profile.targetLanguage, level, unitIndex: unit.index,
                          })}
                          style={{
                            marginTop: 4,
                            backgroundColor: t.colors.dangerSoft,
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                          }}
                        >
                          <Text style={{ color: t.colors.danger, fontWeight: '800', fontSize: 12 * t.fontScale }}>
                            ⚠️ Rifai {result!.wrongExerciseIds.length} errori
                          </Text>
                        </Pressable>
                      )}
                    </View>
                    {showReviewAfter && reviewNode()}
                    </React.Fragment>
                  );
                }

                return (
                  <React.Fragment key={id}>
                  <View style={{ alignItems: 'center', marginVertical: 10 }}>
                    {isCurrent && (
                      <View style={{
                        transform: [{ translateX: offset }],
                        backgroundColor: t.colors.surface,
                        borderWidth: 2,
                        borderColor: color.main,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        marginBottom: 6,
                      }}
                      >
                        <Text style={{ color: color.main, fontWeight: '900', fontSize: 13 * t.fontScale, letterSpacing: 1 }}>
                          INIZIA
                        </Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ translateX: offset }] }}>
                      <Pressable
                        disabled={!unlocked}
                        onPress={() => nav.navigate('Lesson', {
                          language: profile.targetLanguage, level, unitIndex: unit.index,
                        })}
                        style={({ pressed }) => ({
                          width: NODE,
                          height: NODE,
                          borderRadius: NODE / 2,
                          backgroundColor: !unlocked ? t.colors.locked
                            : result?.passed ? t.colors.gold : color.main,
                          borderBottomWidth: pressed ? 2 : 7,
                          borderColor: !unlocked ? (t.dark ? '#22343d' : '#CFCFCF')
                            : result?.passed ? '#D6A800' : color.edge,
                          alignItems: 'center',
                          justifyContent: 'center',
                          ...(isCurrent ? {
                            borderWidth: 4,
                            borderTopColor: `${color.main}55`,
                            borderLeftColor: `${color.main}55`,
                            borderRightColor: `${color.main}55`,
                          } : {}),
                        })}
                      >
                        <Text style={{ fontSize: 30 }}>
                          {result?.passed ? '⭐' : unlocked ? '📖' : '🔒'}
                        </Text>
                      </Pressable>
                      {isCurrent && <Text style={{ fontSize: 34, marginLeft: 10 }}>🦉</Text>}
                    </View>
                    <Text style={{
                      transform: [{ translateX: offset }],
                      marginTop: 6,
                      maxWidth: 190,
                      textAlign: 'center',
                      fontWeight: '800',
                      fontSize: 13.5 * t.fontScale,
                      color: unlocked ? t.colors.text : t.colors.textMuted,
                    }}
                    >
                      {unit.title}
                    </Text>
                    {result?.passed && (
                      <Muted style={{ transform: [{ translateX: offset }], fontSize: 11.5 * t.fontScale }}>
                        Quiz {result.quizScore}%
                        {result.conversationFeedback ? ` · 🗣 ${result.conversationFeedback.overall}` : ''}
                      </Muted>
                    )}
                    {hasMistakes && (
                      <Pressable
                        onPress={() => nav.navigate('ReviewMistakes', {
                          language: profile.targetLanguage, level, unitIndex: unit.index,
                        })}
                        style={{
                          transform: [{ translateX: offset }],
                          marginTop: 4,
                          backgroundColor: t.colors.dangerSoft,
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ color: t.colors.danger, fontWeight: '800', fontSize: 12 * t.fontScale }}>
                          ⚠️ Rifai {result!.wrongExerciseIds.length} errori
                        </Text>
                      </Pressable>
                    )}
                  </View>
                  {showReviewAfter && reviewNode()}
                  </React.Fragment>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
