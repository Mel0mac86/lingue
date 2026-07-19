import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Avatar3D, type AvatarMood, type BackdropKind } from '../components/Avatar3D';
import { ChatBubble } from '../components/ChatBubble';
import { Button, Muted } from '../components/ui';
import { avatarById, avatarForRole } from '../content/avatars';
import { languageByCode } from '../content/languages';
import { scenarioById } from '../content/scenarios';
import { getLesson } from '../services/lessonFactory';
import {
  evaluateConversation, freeConversationPrompt, lessonConversationPrompt,
  nextAvatarReply, suggestUserReply,
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
  const { height: windowHeight } = useWindowDimensions();
  const { profile, settings } = useApp();
  const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [mic, setMic] = useState<MicState>('idle');
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [suggestion, setSuggestion] = useState<{ reply: string; translation: string } | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const spokenTurns = useRef(0);
  const micLang = useRef<'target' | 'it'>('target');
  const startTime = useRef(Date.now());
  const scrollRef = useRef<ScrollView>(null);

  const language = params.mode === 'lesson' ? params.language : params.language;
  const langDef = languageByCode(language);
  const avatar = useMemo(() => {
    if (params.mode === 'free') return avatarById(params.avatarId);
    // Kids do the post-lesson talk with their chosen animal buddy.
    if (profile?.ageBand === 'kids') return avatarById(profile.favoriteAvatarId ?? 'foxy');
    if (profile?.favoriteAvatarId) return avatarById(profile.favoriteAvatarId);
    return avatarForRole('teacher');
  }, [params, profile?.ageBand, profile?.favoriteAvatarId]);

  const mood: AvatarMood = thinking ? 'thinking' : speaking ? 'happy' : 'encouraging';

  // Themed environment: the scenario's world, a chalkboard for lessons
  // (colourful bubbles for kids), a neutral wall for free chat.
  const backdrop: BackdropKind = useMemo(() => {
    if (params.mode === 'lesson') return profile?.ageBand === 'kids' ? 'social' : 'school';
    if (params.scenarioId) return scenarioById(params.scenarioId).category as BackdropKind;
    return 'plain';
  }, [params, profile?.ageBand]);
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
      // Each avatar has its own voice: squeaky fox, deep bear, calm doctor…
      pitch: avatar.voicePitch,
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
    });
  }, [settings.ttsEnabled, langDef.speechTag, ttsRate, avatar.voicePitch]);

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
    setSuggestion(null);
    const history: ConversationTurn[] = [...turns, { role: 'user', text: clean }];
    setTurns(history);
    setTyped('');
    requestReply(history);
  }, [turns, thinking, requestReply]);

  /** "💡 Aiutami": ask for a suggested reply when the learner is stuck. */
  const askSuggestion = useCallback(async () => {
    if (suggesting) return;
    setSuggesting(true);
    setError(null);
    try {
      const level = params.mode === 'lesson' ? params.level : params.difficulty;
      setSuggestion(await suggestUserReply(turns, langDef.name, level));
    } catch (e) {
      setError(e instanceof MissingApiKeyError
        ? e.message
        : `Suggerimento non riuscito: ${String((e as Error)?.message ?? e)}`);
    } finally {
      setSuggesting(false);
    }
  }, [suggesting, turns, langDef.name, params]);

  /**
   * Voice input. The main mic listens in the target language; the 🇮🇹 mic
   * listens in Italian — the escape hatch when the learner can't manage the
   * target language yet (the avatar then teaches how to say it).
   */
  const onMicPress = useCallback(async (lang: 'target' | 'it') => {
    if (mic === 'recording') {
      setMic('transcribing');
      try {
        const tag = micLang.current === 'it' ? 'it-IT' : langDef.speechTag;
        const text = await stopRecordingAndTranscribe(tag);
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
        micLang.current = lang;
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
      {/* Avatar stage: video-call style, the face fills the screen */}
      <Avatar3D
        def={avatar}
        speaking={speaking}
        mood={mood}
        variant="stage"
        height={Math.min(Math.round(windowHeight * 0.44), 460)}
        modelUrl={settings.realisticFaceUrl ?? undefined}
        backdrop={backdrop}
      />

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
        {suggestion ? (
          <View style={{
            backgroundColor: `${t.colors.gold}18`, borderWidth: 2, borderColor: t.colors.gold,
            borderRadius: 14, padding: 12, marginBottom: 10,
          }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.text, fontWeight: '900', fontSize: 15.5 * t.fontScale }}>
                  {suggestion.reply}
                </Text>
                <Muted style={{ marginTop: 2 }}>{suggestion.translation}</Muted>
              </View>
              <Pressable
                onPress={() => speak(suggestion.reply, { languageTag: langDef.speechTag, rate: 0.8 })}
                hitSlop={8}
                style={{ marginLeft: 10 }}
              >
                <Text style={{ fontSize: 22 }}>🔊</Text>
              </Pressable>
              <Pressable onPress={() => setSuggestion(null)} hitSlop={8} style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 18, color: t.colors.textMuted, fontWeight: '800' }}>✕</Text>
              </Pressable>
            </View>
            <Muted style={{ marginTop: 6, fontSize: 12 * t.fontScale }}>
              Leggila, ripetila al microfono 🎙️ oppure toccala per scriverla.
            </Muted>
            <Pressable
              onPress={() => { setTyped(suggestion.reply); setSuggestion(null); }}
              style={{ marginTop: 6 }}
            >
              <Text style={{ color: t.colors.blue, fontWeight: '800', fontSize: 13.5 * t.fontScale }}>
                ✍️ Usa questa frase
              </Text>
            </Pressable>
          </View>
        ) : turns.length > 0 && !ending ? (
          <Pressable
            onPress={askSuggestion}
            disabled={suggesting || thinking}
            style={{
              alignSelf: 'flex-start', marginBottom: 8,
              backgroundColor: `${t.colors.gold}22`,
              borderWidth: 1.5, borderColor: t.colors.gold,
              borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
              opacity: suggesting || thinking ? 0.6 : 1,
            }}
          >
            <Text style={{ color: t.colors.text, fontWeight: '800', fontSize: 13 * t.fontScale }}>
              {suggesting ? '💡 Ci penso…' : '💡 Aiutami: cosa posso dire?'}
            </Text>
          </Pressable>
        ) : null}
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
            onPress={() => onMicPress('target')}
            disabled={thinking || mic === 'transcribing' || (mic === 'recording' && micLang.current !== 'target')}
            style={{
              width: 58, height: 58, borderRadius: 29,
              backgroundColor: mic === 'recording' && micLang.current === 'target'
                ? t.colors.danger : t.colors.primary,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mic === 'transcribing' && micLang.current === 'target'
              ? <ActivityIndicator color={t.colors.onPrimary} />
              : (
                <Text style={{ fontSize: mic === 'recording' && micLang.current === 'target' ? 26 : 20, textAlign: 'center' }}>
                  {mic === 'recording' && micLang.current === 'target' ? '⏹' : `🎙️${langDef.flag}`}
                </Text>
              )}
          </Pressable>
          {language !== 'it' && (
            <Pressable
              onPress={() => onMicPress('it')}
              disabled={thinking || mic === 'transcribing' || (mic === 'recording' && micLang.current !== 'it')}
              style={{
                width: 58, height: 58, borderRadius: 29, marginLeft: 8,
                backgroundColor: mic === 'recording' && micLang.current === 'it'
                  ? t.colors.danger : t.colors.surfaceAlt,
                borderWidth: 2, borderColor: t.colors.border,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {mic === 'transcribing' && micLang.current === 'it'
                ? <ActivityIndicator color={t.colors.text} />
                : (
                  <Text style={{ fontSize: mic === 'recording' && micLang.current === 'it' ? 26 : 20, textAlign: 'center' }}>
                    {mic === 'recording' && micLang.current === 'it' ? '⏹' : '🎙️🇮🇹'}
                  </Text>
                )}
            </Pressable>
          )}
        </View>
        {mic === 'recording' ? (
          <Muted style={{ textAlign: 'center', marginBottom: 8, color: t.colors.danger }}>
            ● Ti ascolto in {micLang.current === 'it' ? 'italiano' : langDef.name}… tocca ⏹ quando hai finito.
          </Muted>
        ) : (
          language !== 'it' && turns.length <= 1 && (
            <Muted style={{ textAlign: 'center', marginBottom: 8 }}>
              Non riesci in {langDef.name}? Tocca 🎙️🇮🇹 e parla in italiano: {avatar.name} ti insegnerà come dirlo.
            </Muted>
          )
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
