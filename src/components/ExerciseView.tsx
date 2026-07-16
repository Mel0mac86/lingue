import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { Exercise } from '../types';
import { useTheme } from '../theme';
import { Body, Button, Card, Chip, Muted } from './ui';
import { speak } from '../services/speech';

export const KIND_LABELS: Record<Exercise['kind'], { label: string; emoji: string }> = {
  listening: { label: 'Ascolto', emoji: '🎧' },
  reading: { label: 'Lettura', emoji: '📖' },
  writing: { label: 'Scrittura', emoji: '✍️' },
  comprehension: { label: 'Comprensione', emoji: '🧩' },
  quiz: { label: 'Quiz', emoji: '🏁' },
};

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Renders one exercise, collects the answer, shows immediate feedback and
 * reports the outcome. Used by the lesson engine and by mistake review.
 */
export function ExerciseView({
  exercise, speechTag, onDone,
}: {
  exercise: Exercise;
  speechTag: string;
  onDone: (correct: boolean) => void;
}) {
  const t = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [checked, setChecked] = useState<null | boolean>(null);

  const isChoice = !!exercise.choices?.length;
  const kind = KIND_LABELS[exercise.kind];

  const check = () => {
    const correct = isChoice
      ? String(selected) === exercise.answer
      : normalizeAnswer(typed) === normalizeAnswer(exercise.answer);
    setChecked(correct);
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 18 }}>{kind.emoji}</Text>
        <Text style={{
          marginLeft: 6, fontWeight: '800', color: t.colors.teal, fontSize: 13 * t.fontScale,
          textTransform: 'uppercase', letterSpacing: 0.6,
        }}
        >
          {kind.label}
        </Text>
      </View>

      <Body style={{ fontWeight: '600', marginBottom: 10 }}>{exercise.prompt}</Body>

      {exercise.passage ? (
        <View style={{
          backgroundColor: t.colors.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 10,
        }}
        >
          <Body style={{ fontStyle: 'italic' }}>{exercise.passage}</Body>
        </View>
      ) : null}

      {exercise.audioText ? (
        <Button
          title="🔊 Riascolta"
          variant="secondary"
          onPress={() => speak(exercise.audioText!, { languageTag: speechTag, rate: 0.85 })}
          style={{ marginBottom: 12, alignSelf: 'flex-start', paddingVertical: 8 }}
        />
      ) : null}

      {isChoice ? (
        <View>
          {exercise.choices!.map((c, i) => {
            const showState = checked !== null;
            const isAnswer = String(i) === exercise.answer;
            const isPicked = selected === i;
            const bg = showState && isPicked
              ? (isAnswer ? `${t.colors.success}22` : `${t.colors.danger}22`)
              : showState && isAnswer ? `${t.colors.success}22`
                : isPicked ? `${t.colors.primary}18` : t.colors.surface;
            return (
              <View key={i} style={{ marginBottom: 8 }}>
                <Text
                  onPress={() => { if (checked === null) setSelected(i); }}
                  style={{
                    borderWidth: 1.5,
                    borderColor: isPicked ? t.colors.primary : t.colors.border,
                    backgroundColor: bg,
                    borderRadius: 12,
                    padding: 13,
                    color: t.colors.text,
                    fontSize: 15.5 * t.fontScale,
                    overflow: 'hidden',
                  }}
                >
                  {c}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <TextInput
          value={typed}
          onChangeText={setTyped}
          editable={checked === null}
          placeholder="Scrivi la risposta…"
          placeholderTextColor={t.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            borderWidth: 1.5,
            borderColor: t.colors.border,
            borderRadius: 12,
            padding: 13,
            color: t.colors.text,
            fontSize: 16 * t.fontScale,
            backgroundColor: t.colors.surface,
          }}
        />
      )}

      {exercise.hint && checked === null ? (
        <Muted style={{ marginTop: 8 }}>💡 Suggerimento: {exercise.hint}</Muted>
      ) : null}

      {checked === null ? (
        <Button
          title="Controlla"
          onPress={check}
          disabled={isChoice ? selected === null : typed.trim().length === 0}
          style={{ marginTop: 14 }}
        />
      ) : (
        <View style={{ marginTop: 14 }}>
          <Text style={{
            fontWeight: '800',
            fontSize: 16 * t.fontScale,
            color: checked ? t.colors.success : t.colors.danger,
            marginBottom: 8,
          }}
          >
            {checked ? '✅ Corretto! Ottimo lavoro!' : `❌ Non proprio. Risposta giusta: ${isChoice ? exercise.choices![Number(exercise.answer)] : exercise.answer}`}
          </Text>
          <Button title="Avanti" variant="secondary" onPress={() => onDone(checked)} />
        </View>
      )}
    </Card>
  );
}
