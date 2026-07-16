import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Body, Button, Card, Chip, Muted, SectionTitle } from '../components/ui';
import { AVATARS, ROLE_LABELS } from '../content/avatars';
import { LANGUAGES } from '../content/languages';
import { CATEGORY_LABELS, SCENARIOS } from '../content/scenarios';
import type { LanguageCode, ScenarioCategory, ScenarioDifficulty } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DIFFICULTIES: { code: ScenarioDifficulty; label: string }[] = [
  { code: 'beginner', label: '🌱 Beginner' },
  { code: 'intermediate', label: '🌿 Intermediate' },
  { code: 'advanced', label: '🌳 Advanced' },
];

/**
 * Free conversation mode: pick avatar, language, level, topic and scenario —
 * then talk about anything, without limits. Corrections arrive at the end
 * (or in real time, if enabled in settings).
 */
export function FreeTalkScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { profile, settings, updateSettings } = useApp();
  const [avatarId, setAvatarId] = useState(AVATARS[0].id);
  const [language, setLanguage] = useState<LanguageCode>(profile?.targetLanguage ?? 'en');
  const [difficulty, setDifficulty] = useState<ScenarioDifficulty>('beginner');
  const [category, setCategory] = useState<ScenarioCategory>('travel');
  const [scenarioId, setScenarioId] = useState<string | undefined>(undefined);
  const [topic, setTopic] = useState('');

  const scenarios = useMemo(
    () => SCENARIOS.filter((s) => s.category === category),
    [category],
  );

  const start = () => {
    nav.navigate('Conversation', {
      mode: 'free',
      language,
      difficulty,
      avatarId,
      scenarioId,
      topic: topic.trim() || undefined,
    });
  };

  const selectedScenario = SCENARIOS.find((s) => s.id === scenarioId);
  const locked = selectedScenario?.premium && !profile?.premium;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 48 }}
    >
      <SectionTitle style={{ marginTop: 8 }}>🗣️ Conversazione libera</SectionTitle>
      <Muted style={{ marginBottom: 16 }}>
        Scegli con chi parlare, di cosa e a che livello: l’avatar si adatta a te.
      </Muted>

      {/* Avatar */}
      <Body style={{ fontWeight: '800', marginBottom: 8 }}>Avatar</Body>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {AVATARS.map((a) => (
          <Pressable key={a.id} onPress={() => setAvatarId(a.id)}>
            <Card style={{
              marginRight: 10, alignItems: 'center', width: 118,
              borderColor: avatarId === a.id ? a.color : t.colors.border,
              borderWidth: avatarId === a.id ? 2 : 1,
            }}
            >
              <Text style={{ fontSize: 34 }}>{a.emoji}</Text>
              <Body style={{ fontWeight: '800' }}>{a.name}</Body>
              <Muted style={{ textAlign: 'center', fontSize: 11.5 }}>
                {ROLE_LABELS[a.role]} · {a.accent}
              </Muted>
            </Card>
          </Pressable>
        ))}
      </ScrollView>

      {/* Language */}
      <Body style={{ fontWeight: '800', marginBottom: 8 }}>Lingua</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
        {LANGUAGES.filter((l) => l.code !== profile?.nativeLanguage).map((l) => (
          <Chip
            key={l.code} label={l.name} emoji={l.flag}
            selected={language === l.code}
            onPress={() => setLanguage(l.code)}
          />
        ))}
      </View>

      {/* Difficulty */}
      <Body style={{ fontWeight: '800', marginBottom: 8 }}>Livello</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d.code} label={d.label}
            selected={difficulty === d.code}
            onPress={() => setDifficulty(d.code)}
          />
        ))}
      </View>

      {/* Scenario */}
      <Body style={{ fontWeight: '800', marginBottom: 8 }}>Scenario</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
        {(Object.keys(CATEGORY_LABELS) as ScenarioCategory[]).map((c) => (
          <Chip
            key={c}
            label={CATEGORY_LABELS[c].label}
            emoji={CATEGORY_LABELS[c].emoji}
            selected={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </View>
      {scenarios.map((s) => (
        <Pressable key={s.id} onPress={() => setScenarioId(scenarioId === s.id ? undefined : s.id)}>
          <Card style={{
            marginBottom: 8,
            borderColor: scenarioId === s.id ? t.colors.primary : t.colors.border,
            borderWidth: scenarioId === s.id ? 2 : 1,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          >
            <Text style={{ fontSize: 26, marginRight: 10 }}>{s.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '700' }}>
                {s.title}{s.premium ? '  👑' : ''}
              </Body>
              <Muted>{s.description}</Muted>
            </View>
          </Card>
        </Pressable>
      ))}

      {/* Free topic */}
      <Body style={{ fontWeight: '800', marginTop: 8, marginBottom: 8 }}>
        Oppure un argomento libero
      </Body>
      <TextInput
        value={topic}
        onChangeText={setTopic}
        placeholder="Es. il mio viaggio in Giappone, la Champions League…"
        placeholderTextColor={t.colors.textMuted}
        style={{
          borderWidth: 1.5, borderColor: t.colors.border, borderRadius: t.radius,
          padding: 13, color: t.colors.text, backgroundColor: t.colors.surface,
          fontSize: 15.5 * t.fontScale, marginBottom: 16,
        }}
      />

      {/* Real-time corrections toggle */}
      <Pressable
        onPress={() => updateSettings({ realTimeCorrections: !settings.realTimeCorrections })}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
      >
        <Text style={{ fontSize: 22, marginRight: 8 }}>
          {settings.realTimeCorrections ? '🔔' : '🔕'}
        </Text>
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '700' }}>
            Correzioni in tempo reale: {settings.realTimeCorrections ? 'attive' : 'disattivate'}
          </Body>
          <Muted>
            {settings.realTimeCorrections
              ? 'L’avatar ti corregge subito, con delicatezza.'
              : 'Parla senza interruzioni: le correzioni arrivano nel report finale.'}
          </Muted>
        </View>
      </Pressable>

      {locked ? (
        <Button title="👑 Scenario Premium — Sblocca" variant="secondary" onPress={() => nav.navigate('Premium')} />
      ) : (
        <Button title="🎬 Inizia la conversazione" onPress={start} />
      )}
    </ScrollView>
  );
}
