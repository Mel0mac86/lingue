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
                const id = lessonIdFor(profile.targetLanguage, level, unit.index);
                const result = progress.results[id];
                const unlocked = isLessonUnlocked(level, unit.index);
                const isCurrent = id === currentId;
                const color = UNIT_COLORS[globalUnitIndex % UNIT_COLORS.length];
                const offset = WAVE[unit.index % WAVE.length];
                const hasMistakes = result?.passed && (result?.wrongExerciseIds?.length ?? 0) > 0;

                return (
                  <View key={id} style={{ alignItems: 'center', marginVertical: 10 }}>
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
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
