import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Body, Button, Card, Muted, ProgressBar, SectionTitle } from '../components/ui';
import { ExerciseView } from '../components/ExerciseView';
import { getLesson } from '../services/lessonFactory';
import { languageByCode } from '../content/languages';
import { speak } from '../services/speech';
import type { Lesson } from '../types';
import type { RootScreenProps } from '../navigation/types';

/**
 * Lesson engine. Every lesson always follows the same path:
 *   1 vocabulary → 2 expressions → 3 grammar → 4-8 exercises
 *   (listening, reading, writing, comprehension, final quiz) →
 *   9-10 AI avatar conversation with detailed correction (next screen) →
 *   11 the next lesson unlocks only above the minimum score.
 */
type Phase = 'loading' | 'vocab' | 'expressions' | 'grammar' | 'exercises' | 'summary';

export function LessonScreen({ route, navigation }: RootScreenProps<'Lesson'>) {
  const { language, level, unitIndex } = route.params;
  const t = useTheme();
  const { addStudyMinutes } = useApp();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [exIndex, setExIndex] = useState(0);
  const wrongIds = useRef<string[]>([]);
  const quizTotal = useRef(0);
  const quizCorrect = useRef(0);
  const startTime = useRef(Date.now());

  const speechTag = languageByCode(language).speechTag;

  useEffect(() => {
    let mounted = true;
    getLesson(language, level, unitIndex)
      .then((l) => { if (mounted) { setLesson(l); setPhase('vocab'); } })
      .catch((e) => { if (mounted) setError(String(e?.message ?? e)); });
    return () => { mounted = false; };
  }, [language, level, unitIndex]);

  const progressPct = useMemo(() => {
    if (!lesson) return 0;
    const phases: Phase[] = ['vocab', 'expressions', 'grammar', 'exercises', 'summary'];
    const base = phases.indexOf(phase);
    if (phase === 'exercises') {
      return ((3 + exIndex / lesson.exercises.length) / 5) * 100;
    }
    return (Math.max(0, base) / 5) * 100 + (phase === 'summary' ? 20 : 0);
  }, [phase, exIndex, lesson]);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background, padding: 24, justifyContent: 'center' }}>
        <Card>
          <SectionTitle>😕 Ops</SectionTitle>
          <Body style={{ marginBottom: 12 }}>{error}</Body>
          <Muted style={{ marginBottom: 12 }}>
            Questa lezione viene generata dall’AI: serve la chiave API Groq
            (Profilo → Impostazioni AI) e una connessione a internet.
          </Muted>
          <Button title="Torna indietro" onPress={() => navigation.goBack()} />
        </Card>
      </View>
    );
  }

  if (!lesson || phase === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={t.colors.primary} />
        <Muted style={{ marginTop: 12 }}>Preparo la tua lezione…</Muted>
      </View>
    );
  }

  const next = () => {
    if (phase === 'vocab') setPhase('expressions');
    else if (phase === 'expressions') setPhase('grammar');
    else if (phase === 'grammar') setPhase('exercises');
  };

  const onExerciseDone = (correct: boolean) => {
    const ex = lesson.exercises[exIndex];
    if (ex.kind === 'quiz') {
      quizTotal.current += 1;
      if (correct) quizCorrect.current += 1;
    }
    if (!correct) wrongIds.current.push(ex.id);
    if (exIndex + 1 < lesson.exercises.length) setExIndex(exIndex + 1);
    else {
      addStudyMinutes(Math.max(1, Math.round((Date.now() - startTime.current) / 60000)));
      setPhase('summary');
    }
  };

  const quizScore = quizTotal.current > 0
    ? Math.round((quizCorrect.current / quizTotal.current) * 100)
    : 100;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <View style={{ padding: t.spacing.lg, paddingBottom: 0 }}>
        <ProgressBar value={progressPct} color={t.colors.primary} />
      </View>
      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 48 }}>
        {phase === 'vocab' && (
          <View>
            <SectionTitle>📚 Nuovo vocabolario</SectionTitle>
            <Muted style={{ marginBottom: 12 }}>Tocca 🔊 per ascoltare la pronuncia.</Muted>
            {lesson.vocabulary.map((v, i) => (
              <Card key={i} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Body style={{ fontWeight: '800', fontSize: 18 * t.fontScale }}>{v.term}</Body>
                    {v.phonetic ? <Muted>{v.phonetic}</Muted> : null}
                    <Body style={{ color: t.colors.teal, fontWeight: '600' }}>{v.translation}</Body>
                    <Muted style={{ marginTop: 4, fontStyle: 'italic' }}>
                      {v.example} — {v.exampleTranslation}
                    </Muted>
                  </View>
                  <Text
                    onPress={() => speak(v.term, { languageTag: speechTag, rate: 0.8 })}
                    style={{ fontSize: 28, padding: 6 }}
                  >
                    🔊
                  </Text>
                </View>
              </Card>
            ))}
            <Button title="Avanti: espressioni →" onPress={next} style={{ marginTop: 8 }} />
          </View>
        )}

        {phase === 'expressions' && (
          <View>
            <SectionTitle>💬 Nuove espressioni</SectionTitle>
            {lesson.expressions.map((e, i) => (
              <Card key={i} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Body style={{ fontWeight: '800' }}>{e.phrase}</Body>
                    <Body style={{ color: t.colors.teal, fontWeight: '600' }}>{e.translation}</Body>
                    <Muted style={{ marginTop: 4 }}>{e.usage}</Muted>
                  </View>
                  <Text
                    onPress={() => speak(e.phrase, { languageTag: speechTag, rate: 0.8 })}
                    style={{ fontSize: 28, padding: 6 }}
                  >
                    🔊
                  </Text>
                </View>
              </Card>
            ))}
            <Button title="Avanti: grammatica →" onPress={next} style={{ marginTop: 8 }} />
          </View>
        )}

        {phase === 'grammar' && (
          <View>
            <SectionTitle>🧠 Grammatica, semplice semplice</SectionTitle>
            {lesson.grammar.map((g, i) => (
              <Card key={i} style={{ marginBottom: 10 }}>
                <Body style={{ fontWeight: '800', marginBottom: 6 }}>{g.title}</Body>
                <Body style={{ marginBottom: 8 }}>{g.explanation}</Body>
                {g.examples.map((ex, j) => (
                  <View key={j} style={{
                    backgroundColor: t.colors.surfaceAlt, borderRadius: 10, padding: 10, marginBottom: 6,
                  }}
                  >
                    <Body style={{ fontWeight: '600' }}>{ex.sample}</Body>
                    <Muted>{ex.translation}</Muted>
                  </View>
                ))}
              </Card>
            ))}
            <Button title="Avanti: esercizi →" onPress={next} style={{ marginTop: 8 }} />
          </View>
        )}

        {phase === 'exercises' && (
          <View>
            <Muted style={{ marginBottom: 10 }}>
              Esercizio {exIndex + 1} di {lesson.exercises.length}
            </Muted>
            <ExerciseView
              key={lesson.exercises[exIndex].id}
              exercise={lesson.exercises[exIndex]}
              speechTag={speechTag}
              onDone={onExerciseDone}
            />
          </View>
        )}

        {phase === 'summary' && (
          <View>
            <Text style={{ fontSize: 52, textAlign: 'center', marginBottom: 8 }}>
              {quizScore >= 70 ? '🎉' : '💪'}
            </Text>
            <SectionTitle style={{ textAlign: 'center' }}>
              Quiz finale: {quizScore}%
            </SectionTitle>
            <Body style={{ textAlign: 'center', marginBottom: 8 }}>
              {quizScore >= 70
                ? 'Ottimo! Ora mettiamo in pratica tutto con una conversazione vera.'
                : 'Il punteggio minimo è 70%. Parla comunque con l’avatar per consolidare, poi rifai gli esercizi sbagliati!'}
            </Body>
            {wrongIds.current.length > 0 && (
              <Muted style={{ textAlign: 'center', marginBottom: 8 }}>
                Esercizi da rivedere: {wrongIds.current.length} (li ritroverai nel percorso).
              </Muted>
            )}
            <Button
              title="🗣️ Parla con l’avatar"
              onPress={() => navigation.replace('Conversation', {
                mode: 'lesson',
                language, level, unitIndex,
                quizScore,
                wrongExerciseIds: wrongIds.current,
                newWords: lesson.vocabulary.length,
              })}
              style={{ marginTop: 12 }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
