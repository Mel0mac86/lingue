import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Button, Muted, ProgressBar, SectionTitle } from '../components/ui';
import { ExerciseView } from '../components/ExerciseView';
import { buildReviewSession } from '../services/review';
import { languageByCode } from '../content/languages';
import { playSfx } from '../services/sfx';
import { Confetti } from '../components/Confetti';
import type { Exercise } from '../types';
import type { RootScreenProps } from '../navigation/types';

const REVIEW_XP = 20;

/**
 * Ripasso node (spaced repetition): a short daily mix of past mistakes and
 * already-studied vocabulary/exercises. Wrong answers go back to the end of
 * the queue; completing the session awards XP.
 */
export function ReviewScreen({ navigation }: RootScreenProps<'Review'>) {
  const t = useTheme();
  const { profile, progress, awardXp } = useApp();
  const [queue, setQueue] = useState<Exercise[] | null>(null);
  const [total, setTotal] = useState(0);
  const [solved, setSolved] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!profile) return undefined;
    buildReviewSession(profile, progress)
      .then((q) => {
        if (mounted) { setQueue(q); setTotal(q.length); }
      })
      .catch(() => { if (mounted) setQueue([]); });
    return () => { mounted = false; };
    // Build once on mount: the session must not change mid-way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile) return null;
  const speechTag = languageByCode(profile.targetLanguage).speechTag;

  const onDone = (correct: boolean) => {
    if (!queue) return;
    const [current, ...rest] = queue;
    const next = correct ? rest : [...rest, current];
    if (correct) setSolved((s) => s + 1);
    if (next.length === 0) {
      awardXp(REVIEW_XP);
      playSfx('fanfare');
      setDone(true);
    }
    setQueue(next);
  };

  if (queue === null) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={t.colors.primary} />
        <Muted style={{ marginTop: 12, fontWeight: '700' }}>Preparo il tuo ripasso…</Muted>
      </View>
    );
  }

  if (done || queue.length === 0) {
    const finished = done || total > 0;
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: t.colors.background }}
        contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 48 }}
      >
        <Text style={{ fontSize: 56, textAlign: 'center', marginTop: 24 }}>
          {finished ? '🌟' : '📚'}
        </Text>
        <SectionTitle style={{ textAlign: 'center' }}>
          {finished ? 'Ripasso completato!' : 'Niente da ripassare (per ora)'}
        </SectionTitle>
        <Muted style={{ textAlign: 'center', marginBottom: 20 }}>
          {finished
            ? `+${REVIEW_XP} XP! Ripassare gli errori è il modo più veloce per fissare la lingua. Torna domani: il mix cambia ogni giorno.`
            : 'Completa almeno una lezione e poi torna qui: il ripasso pesca dalle parole e dagli errori delle lezioni già fatte.'}
        </Muted>
        <Button title="Torna al percorso" onPress={() => navigation.goBack()} />
        {finished && <Confetti />}
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ paddingHorizontal: t.spacing.lg, paddingTop: 10 }}>
        <ProgressBar value={total > 0 ? (solved / total) * 100 : 0} />
        <Muted style={{ marginTop: 6, fontWeight: '700' }}>
          💪 Ripasso intelligente · ancora {queue.length}
          {queue.length === 1 ? ' esercizio' : ' esercizi'}
        </Muted>
      </View>
      <ExerciseView
        key={`${queue[0].id}-${queue.length}-${solved}`}
        exercise={queue[0]}
        speechTag={speechTag}
        onDone={onDone}
      />
    </View>
  );
}
