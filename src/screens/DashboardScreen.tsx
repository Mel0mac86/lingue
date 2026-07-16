import React, { useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import {
  Body, Button, Card, Muted, ProgressBar, ScoreRing, SectionTitle, StatTile,
} from '../components/ui';
import { LineChart } from '../components/LineChart';
import { BADGES, levelForXp } from '../services/gamification';
import { buildStudyPlan, type StudyPlan } from '../services/studyPlan';

/** Progress dashboard: stats, CEFR level, charts, badges and the AI plan. */
export function DashboardScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { profile, progress } = useApp();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  if (!profile) return null;
  const lvl = levelForXp(progress.xp);
  const chartWidth = Math.min(width, 500) - t.spacing.lg * 2 - t.spacing.lg * 2;

  const last14 = progress.history.slice(-14);
  const weekXp = progress.history.slice(-7).reduce((acc, h) => acc + h.xp, 0);

  const loadPlan = async () => {
    setPlanLoading(true);
    setPlanError(null);
    try {
      setPlan(await buildStudyPlan(profile, progress));
    } catch (e) {
      setPlanError(String((e as Error)?.message ?? e));
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 48 }}
    >
      <SectionTitle style={{ marginTop: 8 }}>📊 I tuoi progressi</SectionTitle>

      {/* User level + weekly goal */}
      <Card style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Body style={{ fontWeight: '800' }}>Livello {lvl.level}</Body>
          <Muted>{lvl.intoLevel}/{lvl.needed} XP al prossimo</Muted>
        </View>
        <ProgressBar value={(lvl.intoLevel / lvl.needed) * 100} color={t.colors.primary} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 6 }}>
          <Body style={{ fontWeight: '800' }}>Obiettivo settimanale</Body>
          <Muted>{weekXp}/{progress.weeklyGoalXp} XP</Muted>
        </View>
        <ProgressBar value={(weekXp / progress.weeklyGoalXp) * 100} color={t.colors.teal} />
      </Card>

      {/* Stat tiles */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <StatTile emoji="🗣️" value={`${progress.minutesSpoken}`} label="Minuti parlati" />
        <StatTile emoji="📚" value={`${progress.wordsLearned}`} label="Parole imparate" />
        <StatTile emoji="🔥" value={`${progress.streak}`} label="Streak giorni" />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <StatTile emoji="🎓" value={`${progress.lessonsCompleted}`} label="Lezioni completate" />
        <StatTile emoji="💬" value={`${progress.conversationsHeld}`} label="Conversazioni" />
        <StatTile emoji="🏅" value={profile.level} label="Livello CEFR" />
      </View>

      {/* Averages */}
      <Card style={{ marginBottom: 12 }}>
        <Body style={{ fontWeight: '800', marginBottom: 10 }}>Precisione media</Body>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' }}>
          <ScoreRing value={progress.avgPronunciation} label="Pronuncia" size={72} />
          <ScoreRing value={progress.avgGrammar} label="Grammatica" size={72} />
          <ScoreRing value={progress.avgFluency} label="Fluidità" size={72} />
          <ScoreRing value={progress.avgVocabulary} label="Vocabolario" size={72} />
        </View>
      </Card>

      {/* Charts */}
      <Card style={{ marginBottom: 12 }}>
        <Body style={{ fontWeight: '800', marginBottom: 10 }}>📈 Miglioramenti (ultimi 14 giorni)</Body>
        <LineChart
          data={last14.map((h) => h.xp)}
          width={chartWidth}
          label="XP guadagnati"
          color={t.colors.primary}
        />
        <LineChart
          data={last14.map((h) => h.minutesSpoken)}
          width={chartWidth}
          label="Minuti parlati"
          color={t.colors.teal}
        />
      </Card>

      {/* AI study plan */}
      <Card style={{ marginBottom: 12 }}>
        <Body style={{ fontWeight: '800', marginBottom: 6 }}>🤖 Piano di studio AI</Body>
        <Muted style={{ marginBottom: 10 }}>
          L’AI analizza errori ricorrenti, pronuncia, ritmo di studio e obiettivi
          per costruire il tuo piano personalizzato.
        </Muted>
        {plan && (
          <View style={{ marginBottom: 10 }}>
            <Body style={{ fontWeight: '700', marginBottom: 4 }}>🎯 {plan.weeklyGoal}</Body>
            {plan.focusAreas.map((f, i) => <Body key={i}>•  {f}</Body>)}
            <Muted style={{ marginTop: 8, fontWeight: '700' }}>Consigli:</Muted>
            {plan.tips.map((tip, i) => <Muted key={i}>–  {tip}</Muted>)}
            <Muted style={{ marginTop: 6 }}>
              Ritmo consigliato: {plan.suggestedMinutesPerDay} min/giorno
            </Muted>
          </View>
        )}
        {planError && <Muted style={{ color: t.colors.danger, marginBottom: 8 }}>{planError}</Muted>}
        <Button
          title={plan ? 'Rigenera il piano' : 'Genera il mio piano'}
          variant="secondary"
          loading={planLoading}
          onPress={loadPlan}
        />
      </Card>

      {/* Badges */}
      <SectionTitle>🏆 Badge</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {BADGES.map((b) => {
          const owned = progress.badges.includes(b.id);
          return (
            <Card
              key={b.id}
              style={{
                width: '31%', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
                opacity: owned ? 1 : 0.38,
              }}
            >
              <Text style={{ fontSize: 26 }}>{b.emoji}</Text>
              <Text style={{
                fontWeight: '800', color: t.colors.text, fontSize: 12 * t.fontScale, textAlign: 'center',
              }}
              >
                {b.title}
              </Text>
              <Muted style={{ fontSize: 10 * t.fontScale, textAlign: 'center' }}>{b.description}</Muted>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}
