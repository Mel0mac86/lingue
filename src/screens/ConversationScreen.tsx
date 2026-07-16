import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  Text, TextInput, View,
} from 'react-native';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Avatar, type AvatarMood } from '../components/Avatar';
import { ChatBubble } from '../components/ChatBubble';
import { Button, Muted } from '../components/ui';
import { avatarById, avatarForRole, AVATARS } from '../content/avatars';
import { languageByCode } from '../content/languages';
import { scenarioById } from '../content/scenarios';
import { getLesson } from '../services/lessonFactory';
import {
  evaluateConversation, freeConversationPrompt, lessonConversationPrompt,
  nextAvatarReply,
} from '../services/tutor';
import {
  cancelRecording, speak, startRecording, stopRecordingAndTranscribe, stopSpeaking,
} from '../services/speech';
import { MissingApiKeyError } from '../services/groq';
import type { ConversationTurn } from '../types';
import type { RootScreenProps } from '../navigation/types';

type MicState = 'idle' | 'recording' | 'transcribing';

/**
 * Voice conversation with the AI avatar — used both for the post-lesson
 * conversation (step 9-10 of each lesson) and for free-talk / scenarios.
 * The avatar speaks (TTS + lip sync), listens (recording → Whisper) and
 * replies like a real person via Groq.
 */
export function ConversationScreen({ route, navigation }: RootScreenProps<'Conversation'>) {
  const params = route.params;
  const t = useTheme();
  const { profile, settings } = useApp();
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [mic, setMic] = useState<MicState>('idle');
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const spokenTurns = useRef(0);
  const startTime = useRef(Date.now());
  const scrollRef = useRef<ScrollView>(null);

  const language = params.mode === 'lesson' ? params.language : params.language;
  const langDef = languageByCode(language);
  const avatar = useMemo(() => {
    if (params.mode === 'free') return avatarById(params.avatarId);
    if (profile?.ageBand === 'kids') return AVATARS.find((a) => a.id === 'lia') ?? AVATARS[0];
    return avatarForRole('teacher');
  }, [params, profile?.ageBand]);

  const mood: AvatarMood = thinking ? 'thinking' : speaking ? 'happy' : 'encouraging';
  const ttsRate = profile?.ageBand === 'seniors' || profile?.ageBand === 'kids'
    ? Math.min(settings.ttsRate, 0.82) : settings.ttsRate;

  // Build the system prompt (loads the lesson when in lesson mode).
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!profile) return;
      try {
        if (params.mode === 'lesson') {
          const lesson = await getLesson(params.language, params.level, params.unitIndex);
          if (mounted) setSystemPrompt(lessonConversationPrompt(lesson, avatar, profile));
        } else {
          const scenario = params.scenarioId ? scenarioById(params.scenarioId) : undefined;
          if (mounted) {
            setSystemPrompt(freeConversationPrompt(avatar, profile, {
              language: langDef.name,
              difficulty: params.difficulty,
              scenario,
              topic: params.topic,
              realTimeCorrections: settings.realTimeCorrections,
            }));
          }
        }
      } catch (e) {
        if (mounted) setError(String((e as Error)?.message ?? e));
      }
    })();
    return () => { mounted = false; stopSpeaking(); cancelRecording(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sayAloud = useCallback((text: string) => {
    if (!settings.ttsEnabled) return;
    // Strip Italian asides in parentheses from the spoken output.
    const clean = text.replace(/\([^)]*\)/g, '').trim();
    if (!clean) return;
    speak(clean, {
      languageTag: langDef.speechTag,
      rate: ttsRate,
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
    });
  }, [settings.ttsEnabled, langDef.speechTag, ttsRate]);

  const requestReply = useCallback(async (history: ConversationTurn[]) => {
    if (!systemPrompt) return;
    setThinking(true);
    setError(null);
    try {
      const reply = await nextAvatarReply(systemPrompt, history);
      setTurns([...history, { role: 'assistant', text: reply }]);
      sayAloud(reply);
    } catch (e) {
      setError(e instanceof MissingApiKeyError
        ? e.message
        : `Errore di connessione: ${String((e as Error)?.message ?? e)}`);
    } finally {
      setThinking(false);
    }
  }, [systemPrompt, sayAloud]);

  // Avatar opens the conversation.
  useEffect(() => {
    if (systemPrompt && turns.length === 0) requestReply([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemPrompt]);

  const sendUserText = useCallback((text: string) => {
    const clean = text.trim();
    if (!clean || thinking) return;
    stopSpeaking();
    const history: ConversationTurn[] = [...turns, { role: 'user', text: clean }];
    setTurns(history);
    setTyped('');
    requestReply(history);
  }, [turns, thinking, requestReply]);

  const onMicPress = useCallback(async () => {
    if (mic === 'recording') {
      setMic('transcribing');
      try {
        const text = await stopRecordingAndTranscribe(langDef.speechTag);
        if (text) {
          spokenTurns.current += 1;
          sendUserText(text);
        } else {
          setError('Non ho sentito nulla: riprova parlando più vicino al microfono.');
        }
      } catch (e) {
        setError(String((e as Error)?.message ?? e));
      } finally {
        setMic('idle');
      }
    } else if (mic === 'idle') {
      try {
        stopSpeaking();
        await startRecording();
        setMic('recording');
        setError(null);
      } catch (e) {
        setError(String((e as Error)?.message ?? e));
      }
    }
  }, [mic, langDef.speechTag, sendUserText]);

  const endConversation = useCallback(async () => {
    stopSpeaking();
    await cancelRecording();
    setEnding(true);
    const minutes = Math.max(1, Math.round((Date.now() - startTime.current) / 60000));
    const level = params.mode === 'lesson' ? params.level : params.difficulty;
    try {
      const feedback = await evaluateConversation(turns, langDef.name, level, spokenTurns.current);
      navigation.replace('Feedback', {
        feedback,
        minutes,
        lesson: params.mode === 'lesson' ? {
          language: params.language,
          level: params.level,
          unitIndex: params.unitIndex,
          quizScore: params.quizScore,
          wrongExerciseIds: params.wrongExerciseIds,
          newWords: params.newWords,
        } : undefined,
      });
    } catch (e) {
      setEnding(false);
      setError(`Valutazione non riuscita: ${String((e as Error)?.message ?? e)}`);
    }
  }, [turns, params, langDef.name, navigation]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [turns.length, thinking]);

  if (!profile) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: t.colors.background }}
    >
      {/* Avatar stage */}
      <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
        <Avatar def={avatar} speaking={speaking} mood={mood} size={150} />
      </View>

      {/* Transcript */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: t.spacing.lg }}
      >
        {turns.map((turn, i) => (
          <ChatBubble key={i} role={turn.role} text={turn.text} />
        ))}
        {thinking && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <ActivityIndicator size="small" color={t.colors.primary} />
            <Muted style={{ marginLeft: 8 }}>{avatar.name} sta pensando…</Muted>
          </View>
        )}
        {error && (
          <View style={{
            backgroundColor: `${t.colors.danger}18`, borderRadius: 12, padding: 12, marginTop: 8,
          }}
          >
            <Muted style={{ color: t.colors.danger }}>{error}</Muted>
          </View>
        )}
      </ScrollView>

      {/* Controls */}
      <View style={{
        padding: t.spacing.lg, paddingTop: t.spacing.sm,
        borderTopWidth: 1, borderTopColor: t.colors.border,
      }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TextInput
            value={typed}
            onChangeText={setTyped}
            placeholder={`Scrivi in ${langDef.name}…`}
            placeholderTextColor={t.colors.textMuted}
            editable={!thinking && mic === 'idle'}
            onSubmitEditing={() => sendUserText(typed)}
            style={{
              flex: 1,
              borderWidth: 1.5,
              borderColor: t.colors.border,
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: t.colors.text,
              backgroundColor: t.colors.surface,
              fontSize: 15.5 * t.fontScale,
              marginRight: 10,
            }}
          />
          <Pressable
            onPress={onMicPress}
            disabled={thinking || mic === 'transcribing'}
            style={{
              width: 58, height: 58, borderRadius: 29,
              backgroundColor: mic === 'recording' ? t.colors.danger : t.colors.primary,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mic === 'transcribing'
              ? <ActivityIndicator color={t.colors.onPrimary} />
              : <Text style={{ fontSize: 26 }}>{mic === 'recording' ? '⏹' : '🎙️'}</Text>}
          </Pressable>
        </View>
        {mic === 'recording' && (
          <Muted style={{ textAlign: 'center', marginBottom: 8, color: t.colors.danger }}>
            ● Sto ascoltando… tocca ⏹ quando hai finito di parlare.
          </Muted>
        )}
        <View style={{ flexDirection: 'row' }}>
          {typed.trim().length > 0 && (
            <Button
              title="Invia"
              variant="secondary"
              onPress={() => sendUserText(typed)}
              style={{ flex: 1, marginRight: 8, paddingVertical: 11 }}
            />
          )}
          <Button
            title={ending ? 'Preparo il tuo report…' : '🏁 Termina e ricevi il feedback'}
            variant="ghost"
            loading={ending}
            onPress={endConversation}
            disabled={turns.filter((x) => x.role === 'user').length === 0 && !ending}
            style={{ flex: 2, paddingVertical: 11 }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
