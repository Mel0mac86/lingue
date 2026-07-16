import React, { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Body, Button, Card, Muted, ScoreRing, SectionTitle } from '../components/ui';
import { ChatBubble, CorrectionLegend } from '../components/ChatBubble';
import { XP_RULES } from '../services/gamification';
import { lessonIdFor } from '../content/curriculum';
import type { RootScreenProps } from '../navigation/types';

const PASS_QUIZ = 70;
const PASS_CONVERSATION = 60;

/**
 * Detailed post-conversation report: the four scores, colour-coded
 * corrections, suggestions — and, after a lesson, the pass/fail verdict that
 * unlocks (or not) the next lesson.
 */
export function FeedbackScreen({ route, navigation }: RootScreenProps<'Feedback'>) {
  const { feedback, minutes, lesson } = route.params;
  const t = useTheme();
  const { recordConversation, recordLessonResult } = useApp();
  const recorded = useRef(false);

  const passed = lesson
    ? lesson.quizScore >= PASS_QUIZ && feedback.overall >= PASS_CONVERSATION
    : true;

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordConversation(feedback, minutes);
    if (lesson) {
      recordLessonResult({
        lessonId: lessonIdFor(lesson.language, lesson.level, lesson.unitIndex),
        quizScore: lesson.quizScore,
        wrongExerciseIds: lesson.wrongExerciseIds,
        conversationFeedback: feedback,
        passed,
        completedAt: Date.now(),
        xpEarned: passed
          ? XP_RULES.lessonCompleted + (lesson.quizScore >= 100 ? XP_RULES.lessonPerfectQuiz : 0)
          : 0,
      }, lesson.newWords);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 48 }}
    >
      <Text style={{ fontSize: 52, textAlign: 'center', marginTop: 8 }}>
        {feedback.overall >= 85 ? '🏆' : feedback.overall >= PASS_CONVERSATION ? '🎉' : '💪'}
      </Text>
      <SectionTitle style={{ textAlign: 'center' }}>
        Punteggio complessivo: {feedback.overall}/100
      </SectionTitle>
      <Body style={{ textAlign: 'center', marginBottom: 16 }}>{feedback.encouragement}</Body>

      {/* Scores */}
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap' }}>
          <ScoreRing value={feedback.pronunciation} label="Pronuncia" />
          <ScoreRing value={feedback.grammar} label="Grammatica" />
          <ScoreRing value={feedback.fluency} label="Fluidità" />
          <ScoreRing value={feedback.vocabulary} label="Vocabolario" />
        </View>
      </Card>

      {/* Lesson verdict */}
      {lesson && (
        <Card style={{
          marginBottom: 16,
          borderColor: passed ? t.colors.success : t.colors.warning,
          backgroundColor: passed ? `${t.colors.success}12` : `${t.colors.warning}12`,
        }}
        >
          <Body style={{ fontWeight: '800', marginBottom: 4 }}>
            {passed ? '🔓 Lezione superata!' : '🔒 Lezione non ancora superata'}
          </Body>
          <Muted>
            Quiz: {lesson.quizScore}% (minimo {PASS_QUIZ}%) · Conversazione: {feedback.overall}/100 (minimo {PASS_CONVERSATION}).
            {passed
              ? ' La prossima lezione è sbloccata!'
              : ' Ripassa gli argomenti e riprova: consolidare davvero è l’unico modo per progredire.'}
          </Muted>
          {lesson.wrongExerciseIds.length > 0 && (
            <Button
              title={`✍️ Rifai i ${lesson.wrongExerciseIds.length} esercizi sbagliati`}
              variant="secondary"
              onPress={() => navigation.replace('ReviewMistakes', {
                language: lesson.language, level: lesson.level, unitIndex: lesson.unitIndex,
              })}
              style={{ marginTop: 12 }}
            />
          )}
        </Card>
      )}

      {/* Corrections */}
      {feedback.correctedTurns.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <SectionTitle>Le tue frasi, corrette</SectionTitle>
          <CorrectionLegend />
          {feedback.correctedTurns.map((turn, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <ChatBubble
                role="user"
                text={turn.original}
                segments={turn.segments}
                better={turn.better}
              />
              {turn.segments.filter((s) => s.note).map((s, j) => (
                <Muted key={j} style={{ alignSelf: 'flex-end', maxWidth: '86%', marginTop: 2 }}>
                  {s.status === 'error' ? '🔴' : '🟡'} “{s.text}” → {s.fix ?? ''} {s.note ? `(${s.note})` : ''}
                </Muted>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Suggestions */}
      {feedback.suggestions.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Body style={{ fontWeight: '800', marginBottom: 8 }}>💡 Suggerimenti per migliorare</Body>
          {feedback.suggestions.map((s, i) => (
            <Body key={i} style={{ marginBottom: 6 }}>•  {s}</Body>
          ))}
        </Card>
      )}

      <Button
        title="Torna al percorso"
        onPress={() => navigation.popToTop()}
      />
    </ScrollView>
  );
}
