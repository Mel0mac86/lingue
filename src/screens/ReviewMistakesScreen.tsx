import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Button, Muted, SectionTitle } from '../components/ui';
import { ExerciseView } from '../components/ExerciseView';
import { getLesson } from '../services/lessonFactory';
import { lessonIdFor } from '../content/curriculum';
import { languageByCode } from '../content/languages';
import type { Exercise } from '../types';
import type { RootScreenProps } from '../navigation/types';

/**
 * End-of-topic error review: the exercises answered incorrectly are proposed
 * again until they are all solved (as per the learning-flow requirements).
 */
export function ReviewMistakesScreen({ route, navigation }: RootScreenProps<'ReviewMistakes'>) {
  const { language, level, unitIndex } = route.params;
  const t = useTheme();
  const { progress, clearWrongExercises } = useApp();
  const [queue, setQueue] = useState<Exercise[] | null>(null);
  const [done, setDone] = useState(false);

  const lessonId = lessonIdFor(language, level, unitIndex);
  const speechTag = languageByCode(language).speechTag;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const lesson = await getLesson(language, level, unitIndex);
      const wrongIds = progress.results[lessonId]?.wrongExerciseIds ?? [];
      if (mounted) {
        setQueue(lesson.exercises.filter((e) => wrongIds.includes(e.id)));
      }
    })().catch(() => { if (mounted) setQueue([]); });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDone = (correct: boolean) => {
    if (!queue) return;
    const [current, ...rest] = queue;
    // Wrong again → back to the end of the queue until solved.
    const next = correct ? rest : [...rest, current];
    if (next.length === 0) {
      clearWrongExercises(lessonId);
      setDone(true);
    } else {
      setQueue(next);
    }
  };

  if (queue === null) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={t.colors.primary} />
      </View>
    );
  }

  if (done || queue.length === 0) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: t.colors.background }}
        contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 48 }}
      >
        <Text style={{ fontSize: 52, textAlign: 'center', marginTop: 24 }}>🌟</Text>
        <SectionTitle style={{ textAlign: 'center' }}>Errori recuperati!</SectionTitle>
        <Muted style={{ textAlign: 'center', marginBottom: 20 }}>
          Hai corretto tutti gli esercizi sbagliati (+15 XP). Così si consolida davvero!
        </Muted>
        <Button title="Torna al percorso" onPress={() => navigation.popToTop()} />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <Muted style={{ paddingHorizontal: t.spacing.lg, paddingTop: 10, fontWeight: '700' }}>
        ✍️ Ancora {queue.length} da sistemare: se sbagli, l’esercizio torna in coda.
      </Muted>
      <ExerciseView
        key={`${queue[0].id}-${queue.length}`}
        exercise={queue[0]}
        speechTag={speechTag}
        onDone={onDone}
      />
    </View>
  );
}
