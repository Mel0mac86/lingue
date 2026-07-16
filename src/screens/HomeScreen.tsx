import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Body, Card, Muted, ProgressBar, SectionTitle } from '../components/ui';
import { unitsForLevel, lessonIdFor } from '../content/curriculum';
import { languageByCode } from '../content/languages';
import { levelForXp } from '../services/gamification';
import { CEFR_ORDER, type CEFRLevel } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Learning path: units per CEFR level, unlocked progressively. */
export function HomeScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { profile, progress, isLessonUnlocked } = useApp();
  if (!profile) return null;

  const lang = languageByCode(profile.targetLanguage);
  const startIdx = CEFR_ORDER.indexOf(profile.level);
  const visibleLevels = CEFR_ORDER.slice(startIdx);
  const lvl = levelForXp(progress.xp);

  const levelProgress = (level: CEFRLevel) => {
    const units = unitsForLevel(level);
    const done = units.filter(
      (u) => progress.results[lessonIdFor(profile.targetLanguage, level, u.index)]?.passed,
    ).length;
    return { done, total: units.length };
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 40 }}
    >
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 24 * t.fontScale, fontWeight: '900', color: t.colors.text }}>
            Ciao {profile.name}! {lang.flag}
          </Text>
          <Muted>Corso di {lang.name} · Livello {lvl.level} · {progress.xp} XP</Muted>
        </View>
        <View style={{
          backgroundColor: t.colors.surfaceAlt, borderRadius: 999,
          paddingHorizontal: 14, paddingVertical: 8,
        }}
        >
          <Text style={{ fontWeight: '800', color: t.colors.text, fontSize: 15 * t.fontScale }}>
            🔥 {progress.streak}
          </Text>
        </View>
      </View>

      {/* daily missions teaser */}
      <Card style={{ marginBottom: 20, backgroundColor: t.colors.surfaceAlt, borderColor: 'transparent' }}>
        <Body style={{ fontWeight: '800', marginBottom: 6 }}>🎯 Missioni di oggi</Body>
        {progress.missions.map((m) => (
          <View key={m.id} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Muted style={{ color: t.colors.text }}>
                {m.done ? '✅ ' : ''}{m.title}
              </Muted>
              <Muted>+{m.xp} XP</Muted>
            </View>
            <ProgressBar value={(m.progress / m.target) * 100} color={m.done ? t.colors.success : t.colors.teal} />
          </View>
        ))}
      </Card>

      {/* path */}
      {visibleLevels.map((level) => {
        const units = unitsForLevel(level);
        const { done, total } = levelProgress(level);
        return (
          <View key={level} style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={{
                backgroundColor: t.colors.primary, borderRadius: 10,
                paddingHorizontal: 10, paddingVertical: 4, marginRight: 10,
              }}
              >
                <Text style={{ color: t.colors.onPrimary, fontWeight: '900', fontSize: 15 * t.fontScale }}>
                  {level}
                </Text>
              </View>
              <SectionTitle style={{ marginBottom: 0, flex: 1 }}>
                {done}/{total} lezioni
              </SectionTitle>
            </View>

            {units.map((unit) => {
              const id = lessonIdFor(profile.targetLanguage, level, unit.index);
              const result = progress.results[id];
              const unlocked = isLessonUnlocked(level, unit.index);
              const hasMistakes = result?.passed && (result?.wrongExerciseIds?.length ?? 0) > 0;
              return (
                <Pressable
                  key={id}
                  disabled={!unlocked}
                  onPress={() => nav.navigate('Lesson', {
                    language: profile.targetLanguage, level, unitIndex: unit.index,
                  })}
                >
                  <Card style={{
                    marginBottom: 10,
                    opacity: unlocked ? 1 : 0.5,
                    borderColor: result?.passed ? t.colors.success : t.colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  >
                    <Text style={{ fontSize: 30, marginRight: 12 }}>
                      {result?.passed ? '⭐' : unlocked ? '📘' : '🔒'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontWeight: '700' }}>
                        {unit.index + 1}. {unit.title}
                      </Body>
                      <Muted>{unit.focus.slice(0, 3).join(' · ')}</Muted>
                      {result?.passed ? (
                        <Muted style={{ color: t.colors.success, marginTop: 2 }}>
                          Quiz {result.quizScore}%
                          {result.conversationFeedback ? ` · Conversazione ${result.conversationFeedback.overall}/100` : ''}
                        </Muted>
                      ) : !unlocked ? (
                        <Muted style={{ marginTop: 2 }}>Completa la lezione precedente per sbloccare</Muted>
                      ) : null}
                      {hasMistakes ? (
                        <Pressable onPress={() => nav.navigate('ReviewMistakes', {
                          language: profile.targetLanguage, level, unitIndex: unit.index,
                        })}
                        >
                          <Text style={{
                            color: t.colors.warning, fontWeight: '700',
                            fontSize: 13.5 * t.fontScale, marginTop: 4,
                          }}
                          >
                            ⚠️ Rifai {result!.wrongExerciseIds.length} esercizi sbagliati →
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}
