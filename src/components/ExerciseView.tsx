import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Exercise } from '../types';
import { useTheme } from '../theme';
import { Body, Button, FeedbackBanner, Muted } from './ui';
import {
  cancelRecording, speak, startRecording, stopRecordingAndTranscribe,
} from '../services/speech';
import { getGroqApiKey } from '../services/config';
import { playSfx } from '../services/sfx';

export const KIND_LABELS: Record<Exercise['kind'], { label: string; emoji: string }> = {
  listening: { label: 'Ascolta e rispondi', emoji: '🎧' },
  reading: { label: 'Leggi e rispondi', emoji: '📖' },
  writing: { label: 'Scrivi la risposta', emoji: '✍️' },
  wordbank: { label: 'Componi la frase', emoji: '🧩' },
  comprehension: { label: 'Comprensione', emoji: '💡' },
  quiz: { label: 'Quiz', emoji: '🏁' },
  speaking: { label: 'Ascolta e ripeti', emoji: '🎤' },
  pairs: { label: 'Abbina le coppie', emoji: '🃏' },
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

/** Word-by-word comparison between the target phrase and the transcript. */
export function compareSpoken(target: string, said: string): {
  words: { w: string; ok: boolean }[]; ratio: number;
} {
  const targetWords = normalizeAnswer(target).split(' ').filter(Boolean);
  const pool = normalizeAnswer(said).split(' ').filter(Boolean);
  const words = targetWords.map((w) => {
    const i = pool.indexOf(w);
    if (i >= 0) { pool.splice(i, 1); return { w, ok: true }; }
    return { w, ok: false };
  });
  const okCount = words.filter((x) => x.ok).length;
  return { words, ratio: targetWords.length ? okCount / targetWords.length : 0 };
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
  const isPairs = exercise.kind === 'pairs' && !!exercise.pairs?.length;
  const isSpeaking = exercise.kind === 'speaking';
  const kind = KIND_LABELS[exercise.kind];

  const bank = useMemo(
    () => (isBank ? shuffled(exercise.words!, exercise.id) : []),
    [isBank, exercise.words, exercise.id],
  );

  // ── Pairs (matching) state ─────────────────────────────────────────────
  const pairCount = exercise.pairs?.length ?? 0;
  const leftOrder = useMemo(
    () => (isPairs
      ? shuffled(exercise.pairs!.map((_, i) => String(i)), exercise.id + 'L').map(Number)
      : []),
    [isPairs, exercise.pairs, exercise.id],
  );
  const rightOrder = useMemo(
    () => (isPairs
      ? shuffled(exercise.pairs!.map((_, i) => String(i)), exercise.id + 'R').map(Number)
      : []),
    [isPairs, exercise.pairs, exercise.id],
  );
  const [leftSel, setLeftSel] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [wrongFlash, setWrongFlash] = useState<[number, number] | null>(null);

  const onPairTap = (side: 'left' | 'right', pairIdx: number) => {
    if (matchedPairs.includes(pairIdx) || checked !== null) return;
    if (side === 'left') { setLeftSel(pairIdx); return; }
    if (leftSel === null) return;
    if (leftSel === pairIdx) {
      const next = [...matchedPairs, pairIdx];
      setMatchedPairs(next);
      setLeftSel(null);
      playSfx('correct');
      if (next.length === pairCount) setChecked(true);
    } else {
      playSfx('wrong');
      setWrongFlash([leftSel, pairIdx]);
      setLeftSel(null);
      setTimeout(() => setWrongFlash(null), 550);
    }
  };

  // ── Speaking (pronunciation) state ─────────────────────────────────────
  const [recState, setRecState] = useState<'idle' | 'rec' | 'busy'>('idle');
  const [attempt, setAttempt] = useState<null | {
    said: string; words: { w: string; ok: boolean }[]; ratio: number;
  }>(null);
  const [sttError, setSttError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const recRef = useRef(false);

  useEffect(() => {
    if (isSpeaking) getGroqApiKey().then((k) => setHasKey(!!k)).catch(() => setHasKey(false));
    return () => { if (recRef.current) { cancelRecording(); recRef.current = false; } };
  }, [isSpeaking]);

  const onMicPress = async () => {
    setSttError(null);
    if (recState === 'idle') {
      try {
        await startRecording();
        recRef.current = true;
        setRecState('rec');
      } catch {
        setSttError('Microfono non disponibile: controlla i permessi del browser.');
      }
      return;
    }
    if (recState !== 'rec') return;
    setRecState('busy');
    try {
      const said = await stopRecordingAndTranscribe(speechTag);
      recRef.current = false;
      const { words, ratio } = compareSpoken(exercise.answer, said);
      setAttempt({ said, words, ratio });
      if (ratio >= 0.7) {
        playSfx('correct');
        setChecked(true);
      } else {
        playSfx('wrong');
      }
    } catch (e) {
      recRef.current = false;
      setSttError(String((e as Error)?.message ?? e));
    } finally {
      setRecState('idle');
    }
  };

  const composed = picked.map((i) => bank[i]).join(' ');

  const check = () => {
    const correct = isChoice
      ? String(selected) === exercise.answer
      : normalizeAnswer(isBank ? composed : typed) === normalizeAnswer(exercise.answer);
    playSfx(correct ? 'correct' : 'wrong');
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

        {isSpeaking ? (
          <View style={{
            backgroundColor: t.colors.surfaceAlt, borderRadius: 14, padding: 14, marginBottom: 12,
            borderWidth: 2, borderColor: t.colors.border,
          }}
          >
            <Body style={{ fontWeight: '900', fontSize: 18 * t.fontScale }}>
              {exercise.answer}
            </Body>
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

        {/* Pairs: tap a word, then its translation */}
        {isPairs && (
          <View style={{ flexDirection: 'row' }}>
            {([['left', leftOrder], ['right', rightOrder]] as const).map(([side, order]) => (
              <View key={side} style={{ flex: 1, marginHorizontal: 4 }}>
                {order.map((pairIdx) => {
                  const label = side === 'left'
                    ? exercise.pairs![pairIdx].left
                    : exercise.pairs![pairIdx].right;
                  const done = matchedPairs.includes(pairIdx);
                  const isSel = side === 'left' && leftSel === pairIdx;
                  const isWrong = wrongFlash !== null
                    && ((side === 'left' && wrongFlash[0] === pairIdx)
                      || (side === 'right' && wrongFlash[1] === pairIdx));
                  return (
                    <Pressable
                      key={`${side}-${pairIdx}`}
                      disabled={done || checked !== null}
                      onPress={() => onPairTap(side, pairIdx)}
                      style={{
                        borderWidth: 2,
                        borderBottomWidth: done ? 2 : 4,
                        borderColor: isWrong ? t.colors.danger
                          : done ? t.colors.success
                            : isSel ? t.colors.blue : t.colors.border,
                        backgroundColor: isWrong ? t.colors.dangerSoft
                          : done ? t.colors.successSoft
                            : isSel ? `${t.colors.blue}18` : t.colors.surface,
                        borderRadius: 14,
                        padding: 13,
                        marginBottom: 10,
                        opacity: done ? 0.55 : 1,
                      }}
                    >
                      <Text style={{
                        color: t.colors.text,
                        fontWeight: isSel ? '900' : '700',
                        fontSize: 15 * t.fontScale,
                        textAlign: 'center',
                      }}
                      >
                        {done ? '✓ ' : ''}{label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Speaking: record, transcribe, per-word colour feedback */}
        {isSpeaking && (
          <View style={{ alignItems: 'center' }}>
            {hasKey === false ? (
              <Muted style={{ textAlign: 'center', marginTop: 8 }}>
                ⚠️ Per l’esercizio di pronuncia serve la chiave API Groq
                (Profilo → Impostazioni AI). Puoi saltarlo senza penalità.
              </Muted>
            ) : (
              <Pressable
                disabled={recState === 'busy' || checked !== null}
                onPress={onMicPress}
                style={{
                  marginTop: 10,
                  width: 92,
                  height: 92,
                  borderRadius: 46,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: recState === 'rec' ? t.colors.danger : t.colors.primary,
                  borderBottomWidth: 6,
                  borderColor: recState === 'rec' ? '#C93A3A' : t.colors.primaryEdge,
                  opacity: recState === 'busy' ? 0.6 : 1,
                }}
              >
                <Text style={{ fontSize: 38 }}>
                  {recState === 'rec' ? '⏹' : recState === 'busy' ? '⏳' : '🎤'}
                </Text>
              </Pressable>
            )}
            <Muted style={{ marginTop: 8, textAlign: 'center' }}>
              {recState === 'rec' ? 'Sto ascoltando… tocca ⏹ quando hai finito.'
                : recState === 'busy' ? 'Sto controllando la tua pronuncia…'
                  : 'Tocca 🎤, leggi la frase ad alta voce, poi tocca ⏹.'}
            </Muted>
            {sttError ? (
              <Muted style={{ color: t.colors.danger, marginTop: 8, textAlign: 'center' }}>
                {sttError}
              </Muted>
            ) : null}
            {attempt && checked === null ? (
              <View style={{
                marginTop: 14, alignSelf: 'stretch',
                backgroundColor: t.colors.surfaceAlt, borderRadius: 14, padding: 12,
                borderWidth: 2, borderColor: t.colors.border,
              }}
              >
                <Muted style={{ fontWeight: '800', marginBottom: 6 }}>
                  Ho capito: “{attempt.said.trim() || '…'}” — {Math.round(attempt.ratio * 100)}%
                </Muted>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {attempt.words.map((x, i) => (
                    <Text
                      key={i}
                      style={{
                        color: x.ok ? t.colors.success : t.colors.danger,
                        fontWeight: '800',
                        fontSize: 16 * t.fontScale,
                        marginRight: 6,
                      }}
                    >
                      {x.w}
                    </Text>
                  ))}
                </View>
                <Muted style={{ marginTop: 6 }}>
                  Le parole rosse non si sono sentite bene: riprova con calma! 💪
                </Muted>
              </View>
            ) : null}
          </View>
        )}

        {/* Free writing */}
        {!isChoice && !isBank && !isPairs && !isSpeaking && (
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

      {/* Bottom bar: CHECK (or skip for speaking) or feedback banner */}
      {checked === null ? (
        isPairs ? null : (
          <View style={{ padding: t.spacing.lg }}>
            {isSpeaking ? (
              <Button
                title="Salta: non posso parlare ora"
                variant="ghost"
                onPress={() => onDone(true)}
              />
            ) : (
              <Button title="Controlla" onPress={check} disabled={!canCheck} />
            )}
          </View>
        )
      ) : (
        <FeedbackBanner
          correct={checked}
          correctAnswer={isPairs ? undefined
            : isChoice ? exercise.choices![Number(exercise.answer)] : exercise.answer}
          onContinue={() => onDone(checked)}
        />
      )}
    </View>
  );
}
