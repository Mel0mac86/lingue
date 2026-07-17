import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Body, Button, Card, Muted, ProgressBar, SectionTitle } from '../components/ui';
import { ExerciseView } from '../components/ExerciseView';
import { getLesson } from '../services/lessonFactory';
import { lessonIdFor } from '../content/curriculum';
import { languageByCode } from '../content/languages';
import { speak } from '../services/speech';
import { playSfx } from '../services/sfx';
import { Confetti } from '../components/Confetti';
import type { Exercise, Lesson } from '../types';
import type { RootScreenProps } from '../navigation/types';

/**
 * Lesson engine, Duolingo-style. Every lesson always follows the same path:
 *   1 vocabulary → 2 expressions → 3 grammar → 4-8 exercises (listening,
 *   reading, writing, word bank, comprehension, final quiz) → 9-10 AI avatar
 *   conversation about what was just studied → 11 gated unlock.
 *
 * Like Duolingo, a wrongly answered exercise goes back to the end of the
 * queue and must be solved before the lesson can finish; mistakes also cost
 * a heart and are recorded for the end-of-topic review.
 */
type Phase = 'loading' | 'vocab' | 'expressions' | 'grammar' | 'exercises' | 'summary';

const MAX_HEARTS = 5;

/** Exercise kinds practised in each mini-step of the kids/beginner path. */
const STEP_KINDS: Exercise['kind'][][] = [
  ['listening'],
  ['writing', 'wordbank'],
  ['reading', 'comprehension'],
  ['quiz'],
];
const STEP_TITLES = ['📚 Parole', '💬 Frasi', '🧠 Grammatica', '🏁 Sfida finale'];

export function LessonScreen({ route, navigation }: RootScreenProps<'Lesson'>) {
  const { language, level, unitIndex, step } = route.params;
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { addStudyMinutes, recordStepDone } = useApp();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [queue, setQueue] = useState<Exercise[]>([]);
  const [solvedCount, setSolvedCount] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const wrongIds = useRef<Set<string>>(new Set());
  const attempted = useRef<Set<string>>(new Set());
  const quizTotal = useRef(0);
  const quizCorrect = useRef(0);
  const startTime = useRef(Date.now());

  const speechTag = languageByCode(language).speechTag;

  useEffect(() => {
    let mounted = true;
    getLesson(language, level, unitIndex)
      .then((l) => {
        if (!mounted) return;
        setLesson(l);
        if (step === undefined) {
          setQueue(l.exercises);
          setPhase('vocab');
        } else {
          // One topic at a time: only this step's exercises and theory.
          const wanted = l.exercises.filter((e) => STEP_KINDS[step].includes(e.kind));
          setQueue(wanted.length ? wanted : l.exercises.slice(0, 3));
          setPhase(step === 0 ? 'vocab' : step === 1 ? 'expressions' : step === 2 ? 'grammar' : 'exercises');
        }
      })
      .catch((e) => { if (mounted) setError(String(e?.message ?? e)); });
    return () => { mounted = false; };
  }, [language, level, unitIndex, step]);

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
        <Muted style={{ marginTop: 12, fontWeight: '700' }}>Preparo la tua lezione…</Muted>
      </View>
    );
  }

  const totalExercises = step === undefined
    ? lesson.exercises.length
    : Math.max(1, lesson.exercises.filter((e) => STEP_KINDS[step].includes(e.kind)).length || 3);
  const phaseBase: Record<Exclude<Phase, 'loading'>, number> = {
    vocab: 0, expressions: 8, grammar: 16, exercises: 24, summary: 100,
  };
  const progressPct = phase === 'exercises'
    ? 24 + (solvedCount / totalExercises) * 76
    : phaseBase[phase];

  const next = () => {
    if (step !== undefined) {
      setPhase('exercises');
      return;
    }
    if (phase === 'vocab') setPhase('expressions');
    else if (phase === 'expressions') setPhase('grammar');
    else if (phase === 'grammar') setPhase('exercises');
  };

  const onExerciseDone = (correct: boolean) => {
    const [current, ...rest] = queue;
    const firstAttempt = !attempted.current.has(current.id);
    attempted.current.add(current.id);
    if (firstAttempt && current.kind === 'quiz') {
      quizTotal.current += 1;
      if (correct) quizCorrect.current += 1;
    }
    if (correct) {
      setSolvedCount(solvedCount + 1);
      if (rest.length === 0) {
        addStudyMinutes(Math.max(1, Math.round((Date.now() - startTime.current) / 60000)));
        playSfx('fanfare');
        if (step !== undefined && step < 3) {
          recordStepDone(lessonIdFor(language, level, unitIndex), step);
        }
        setPhase('summary');
      } else {
        setQueue(rest);
      }
    } else {
      wrongIds.current.add(current.id);
      setHearts((h) => Math.max(0, h - 1));
      // Duolingo mechanic: the missed exercise returns at the end of the queue.
      setQueue([...rest, current]);
    }
  };

  const quizScore = quizTotal.current > 0
    ? Math.round((quizCorrect.current / quizTotal.current) * 100)
    : 100;

  const speakerButton = (text: string) => (
    <Pressable
      onPress={() => speak(text, { languageTag: speechTag, rate: 0.8 })}
      style={{
        backgroundColor: t.colors.blue,
        borderBottomWidth: 3,
        borderColor: t.colors.blueEdge,
        borderRadius: 12,
        padding: 8,
        marginLeft: 8,
      }}
    >
      <Text style={{ fontSize: 18 }}>🔊</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background, paddingTop: insets.top > 0 ? 0 : 4 }}>
      {/* Duolingo-style header: close, progress, hearts */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: t.spacing.lg, paddingVertical: 10,
      }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={{ fontSize: 22, color: t.colors.textMuted, fontWeight: '800' }}>✕</Text>
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <ProgressBar value={progressPct} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '800', color: t.colors.danger }}>
          ❤️ {hearts}
        </Text>
      </View>
      {step !== undefined && phase !== 'summary' && (
        <Text style={{
          textAlign: 'center', fontWeight: '900', color: t.colors.textMuted,
          fontSize: 13 * t.fontScale, letterSpacing: 0.5, marginBottom: 4,
        }}
        >
          {STEP_TITLES[step]} · {lesson.title}
        </Text>
      )}

      {phase === 'exercises' ? (
        <ExerciseView
          key={`${queue[0].id}-${solvedCount}-${queue.length}`}
          exercise={queue[0]}
          speechTag={speechTag}
          onDone={onExerciseDone}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 48 }}>
          {phase === 'vocab' && (
            <View>
              <SectionTitle>📚 Nuovo vocabolario</SectionTitle>
              <Muted style={{ marginBottom: 12 }}>Tocca 🔊 per ascoltare la pronuncia.</Muted>
              {lesson.vocabulary.map((v, i) => (
                <Card key={i} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontWeight: '900', fontSize: 18 * t.fontScale }}>{v.term}</Body>
                      {v.phonetic ? <Muted>{v.phonetic}</Muted> : null}
                      <Body style={{ color: t.colors.blue, fontWeight: '700' }}>{v.translation}</Body>
                      <Muted style={{ marginTop: 4, fontStyle: 'italic' }}>
                        {v.example} — {v.exampleTranslation}
                      </Muted>
                    </View>
                    {speakerButton(v.term)}
                  </View>
                </Card>
              ))}
              <Button title="Avanti" onPress={next} style={{ marginTop: 8 }} />
            </View>
          )}

          {phase === 'expressions' && (
            <View>
              <SectionTitle>💬 Nuove espressioni</SectionTitle>
              {lesson.expressions.map((e, i) => (
                <Card key={i} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Body style={{ fontWeight: '900' }}>{e.phrase}</Body>
                      <Body style={{ color: t.colors.blue, fontWeight: '700' }}>{e.translation}</Body>
                      <Muted style={{ marginTop: 4 }}>{e.usage}</Muted>
                    </View>
                    {speakerButton(e.phrase)}
                  </View>
                </Card>
              ))}
              <Button title="Avanti" onPress={next} style={{ marginTop: 8 }} />
            </View>
          )}

          {phase === 'grammar' && (
            <View>
              <SectionTitle>🧠 Grammatica, semplice semplice</SectionTitle>
              {lesson.grammar.map((g, i) => (
                <Card key={i} style={{ marginBottom: 10 }}>
                  <Body style={{ fontWeight: '900', marginBottom: 6 }}>{g.title}</Body>
                  <Body style={{ marginBottom: 8 }}>{g.explanation}</Body>
                  {g.examples.map((ex, j) => (
                    <View key={j} style={{
                      backgroundColor: t.colors.surfaceAlt, borderRadius: 12, padding: 10, marginBottom: 6,
                    }}
                    >
                      <Body style={{ fontWeight: '700' }}>{ex.sample}</Body>
                      <Muted>{ex.translation}</Muted>
                    </View>
                  ))}
                </Card>
              ))}
              <Button title="Iniziamo gli esercizi!" onPress={next} style={{ marginTop: 8 }} />
            </View>
          )}

          {phase === 'summary' && step !== undefined && step < 3 && (
            <View>
              <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 8 }}>🎉</Text>
              <SectionTitle style={{ textAlign: 'center' }}>
                {STEP_TITLES[step]} completato!
              </SectionTitle>
              <Body style={{ textAlign: 'center', marginBottom: 16 }}>
                +15 XP! Un argomento alla volta si arriva lontano. Prossima tappa:
                {' '}{STEP_TITLES[step + 1]}.
              </Body>
              <Button
                title="Torna al percorso"
                onPress={() => navigation.goBack()}
                style={{ marginTop: 8 }}
              />
            </View>
          )}

          {phase === 'summary' && (step === undefined || step === 3) && (
            <View>
              <Text style={{ fontSize: 60, textAlign: 'center', marginBottom: 8 }}>
                {quizScore >= 70 ? '🎉' : '💪'}
              </Text>
              <SectionTitle style={{ textAlign: 'center' }}>
                Esercizi completati!
              </SectionTitle>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
                <Card style={{ alignItems: 'center', paddingHorizontal: 18, borderColor: t.colors.gold }}>
                  <Muted style={{ fontWeight: '800' }}>QUIZ</Muted>
                  <Text style={{ fontSize: 22 * t.fontScale, fontWeight: '900', color: t.colors.text }}>
                    {quizScore}%
                  </Text>
                </Card>
                <Card style={{ alignItems: 'center', paddingHorizontal: 18, borderColor: t.colors.danger }}>
                  <Muted style={{ fontWeight: '800' }}>ERRORI</Muted>
                  <Text style={{ fontSize: 22 * t.fontScale, fontWeight: '900', color: t.colors.text }}>
                    {wrongIds.current.size}
                  </Text>
                </Card>
              </View>
              <Body style={{ textAlign: 'center', marginBottom: 8 }}>
                {quizScore >= 70
                  ? 'Ottimo! Ora mettiamo in pratica tutto con una conversazione vera.'
                  : 'Il punteggio minimo è 70%. Parla comunque con l’avatar per consolidare, poi rifai gli esercizi sbagliati!'}
              </Body>
              {wrongIds.current.size > 0 && (
                <Muted style={{ textAlign: 'center', marginBottom: 8 }}>
                  Hai già ricorretto tutto in questa lezione: gli esercizi sbagliati
                  restano nel percorso per un ripasso extra. 💪
                </Muted>
              )}
              <Button
                title="🗣️ Parla con l’avatar"
                onPress={() => navigation.replace('Conversation', {
                  mode: 'lesson',
                  language, level, unitIndex,
                  quizScore,
                  wrongExerciseIds: [...wrongIds.current],
                  newWords: lesson.vocabulary.length,
                })}
                style={{ marginTop: 12 }}
              />
            </View>
          )}
        </ScrollView>
      )}
      {phase === 'summary' && quizScore >= 70 && <Confetti />}
    </View>
  );
}
