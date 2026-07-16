import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Exercise } from '../types';
import { useTheme } from '../theme';
import { Body, Button, FeedbackBanner, Muted } from './ui';
import { speak } from '../services/speech';

export const KIND_LABELS: Record<Exercise['kind'], { label: string; emoji: string }> = {
  listening: { label: 'Ascolta e rispondi', emoji: '🎧' },
  reading: { label: 'Leggi e rispondi', emoji: '📖' },
  writing: { label: 'Scrivi la risposta', emoji: '✍️' },
  wordbank: { label: 'Componi la frase', emoji: '🧩' },
  comprehension: { label: 'Comprensione', emoji: '💡' },
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

/** Deterministic shuffle so the same exercise always shows the same order. */
function shuffled(words: string[], seed: string): string[] {
  let h = 0;
  for (const c of seed) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  const arr = words.map((w, i) => ({ w, k: Math.abs((h = (h * 1103515245 + 12345) | 0)) + i }));
  return arr.sort((a, b) => (a.k % 997) - (b.k % 997)).map((x) => x.w);
}

/**
 * Renders one exercise Duolingo-style: chunky option cards / word bank,
 * a CHECK button, then a green/red bottom banner before moving on.
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
  const [picked, setPicked] = useState<number[]>([]); // indexes into bank
  const [checked, setChecked] = useState<null | boolean>(null);

  const isChoice = !!exercise.choices?.length;
  const isBank = exercise.kind === 'wordbank' && !!exercise.words?.length;
  const kind = KIND_LABELS[exercise.kind];

  const bank = useMemo(
    () => (isBank ? shuffled(exercise.words!, exercise.id) : []),
    [isBank, exercise.words, exercise.id],
  );

  const composed = picked.map((i) => bank[i]).join(' ');

  const check = () => {
    const correct = isChoice
      ? String(selected) === exercise.answer
      : normalizeAnswer(isBank ? composed : typed) === normalizeAnswer(exercise.answer);
    setChecked(correct);
  };

  const canCheck = isChoice
    ? selected !== null
    : isBank ? picked.length > 0 : typed.trim().length > 0;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: t.spacing.lg }}>
        <Text style={{
          fontWeight: '900', color: t.colors.text, fontSize: 21 * t.fontScale, marginBottom: 12,
        }}
        >
          {kind.emoji} {kind.label}
        </Text>

        <Body style={{ fontWeight: '700', marginBottom: 12, fontSize: 17 * t.fontScale }}>
          {exercise.prompt}
        </Body>

        {exercise.passage ? (
          <View style={{
            backgroundColor: t.colors.surfaceAlt, borderRadius: 14, padding: 12, marginBottom: 12,
            borderWidth: 2, borderColor: t.colors.border,
          }}
          >
            <Body style={{ fontStyle: 'italic' }}>{exercise.passage}</Body>
          </View>
        ) : null}

        {exercise.audioText ? (
          <Pressable
            onPress={() => speak(exercise.audioText!, { languageTag: speechTag, rate: 0.85 })}
            style={{
              alignSelf: 'flex-start',
              backgroundColor: t.colors.blue,
              borderBottomWidth: 4,
              borderColor: t.colors.blueEdge,
              borderRadius: 16,
              paddingVertical: 12,
              paddingHorizontal: 22,
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 24 }}>🔊</Text>
          </Pressable>
        ) : null}

        {/* Multiple choice: chunky cards */}
        {isChoice && (
          <View>
            {exercise.choices!.map((c, i) => {
              const showState = checked !== null;
              const isAnswer = String(i) === exercise.answer;
              const isPicked = selected === i;
              const borderColor = showState && isAnswer ? t.colors.success
                : showState && isPicked && !isAnswer ? t.colors.danger
                  : isPicked ? t.colors.blue : t.colors.border;
              const bg = showState && isAnswer ? t.colors.successSoft
                : showState && isPicked && !isAnswer ? t.colors.dangerSoft
                  : isPicked ? `${t.colors.blue}18` : t.colors.surface;
              return (
                <Pressable
                  key={i}
                  disabled={checked !== null}
                  onPress={() => setSelected(i)}
                  style={{
                    borderWidth: 2,
                    borderBottomWidth: 4,
                    borderColor,
                    backgroundColor: bg,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{
                    color: isPicked || (showState && isAnswer) ? t.colors.text : t.colors.text,
                    fontSize: 16 * t.fontScale,
                    fontWeight: isPicked ? '800' : '600',
                  }}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Word bank: compose the sentence */}
        {isBank && (
          <View>
            {/* composition line */}
            <View style={{
              minHeight: 56,
              borderBottomWidth: 2,
              borderColor: t.colors.border,
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingBottom: 8,
              marginBottom: 18,
            }}
            >
              {picked.map((bankIdx, pos) => (
                <Pressable
                  key={`${bankIdx}-${pos}`}
                  disabled={checked !== null}
                  onPress={() => setPicked(picked.filter((_, j) => j !== pos))}
                  style={{
                    backgroundColor: t.colors.surface,
                    borderWidth: 2,
                    borderBottomWidth: 4,
                    borderColor: t.colors.border,
                    borderRadius: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    marginRight: 6,
                    marginBottom: 6,
                  }}
                >
                  <Text style={{ color: t.colors.text, fontWeight: '700', fontSize: 16 * t.fontScale }}>
                    {bank[bankIdx]}
                  </Text>
                </Pressable>
              ))}
            </View>
            {/* bank */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {bank.map((w, i) => {
                const used = picked.includes(i);
                return (
                  <Pressable
                    key={i}
                    disabled={used || checked !== null}
                    onPress={() => setPicked([...picked, i])}
                    style={{
                      backgroundColor: used ? t.colors.surfaceAlt : t.colors.surface,
                      borderWidth: 2,
                      borderBottomWidth: used ? 2 : 4,
                      borderColor: t.colors.border,
                      borderRadius: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      margin: 4,
                    }}
                  >
                    <Text style={{
                      color: used ? 'transparent' : t.colors.text,
                      fontWeight: '700',
                      fontSize: 16 * t.fontScale,
                    }}
                    >
                      {w}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Free writing */}
        {!isChoice && !isBank && (
          <TextInput
            value={typed}
            onChangeText={setTyped}
            editable={checked === null}
            placeholder="Scrivi la risposta…"
            placeholderTextColor={t.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            style={{
              borderWidth: 2,
              borderColor: t.colors.border,
              borderRadius: 14,
              padding: 14,
              minHeight: 90,
              textAlignVertical: 'top',
              color: t.colors.text,
              fontSize: 17 * t.fontScale,
              backgroundColor: t.colors.surfaceAlt,
            }}
          />
        )}

        {exercise.hint && checked === null ? (
          <Muted style={{ marginTop: 10 }}>💡 {exercise.hint}</Muted>
        ) : null}
      </View>

      {/* Bottom bar: CHECK or feedback banner */}
      {checked === null ? (
        <View style={{ padding: t.spacing.lg }}>
          <Button title="Controlla" onPress={check} disabled={!canCheck} />
        </View>
      ) : (
        <FeedbackBanner
          correct={checked}
          correctAnswer={isChoice ? exercise.choices![Number(exercise.answer)] : exercise.answer}
          onContinue={() => onDone(checked)}
        />
      )}
    </View>
  );
}
