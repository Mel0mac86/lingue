import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { Body, Button, Chip, Muted, SectionTitle } from '../components/ui';
import { LANGUAGES } from '../content/languages';
import { ageBandFor, useApp } from '../state/AppContext';
import type { AgeBand, CEFRLevel, LanguageCode } from '../types';

const BAND_INFO: Record<AgeBand, { title: string; emoji: string; blurb: string }> = {
  kids: { title: 'Percorso Bambini', emoji: '🦄', blurb: 'Giochi, premi frequenti, lezioni brevi e avatar divertenti!' },
  teens: { title: 'Percorso Ragazzi', emoji: '🎮', blurb: 'Scuola, videogiochi, sport, social, musica e viaggi.' },
  adults: { title: 'Percorso Adulti', emoji: '💼', blurb: 'Lavoro, business, viaggi, famiglia e tempo libero.' },
  seniors: { title: 'Percorso Senior', emoji: '🌷', blurb: 'Caratteri grandi, ritmo rilassato, ripassi frequenti e dialoghi pratici.' },
};

const INTERESTS = [
  'Viaggi', 'Lavoro', 'Sport', 'Musica', 'Videogiochi', 'Cinema',
  'Cucina', 'Scuola', 'Business', 'Cultura', 'Famiglia', 'Tecnologia',
];

const LEVELS: { code: CEFRLevel; label: string }[] = [
  { code: 'A1', label: 'A1 · Parto da zero' },
  { code: 'A2', label: 'A2 · Conosco le basi' },
  { code: 'B1', label: 'B1 · Me la cavo' },
  { code: 'B2', label: 'B2 · Converso bene' },
  { code: 'C1', label: 'C1 · Quasi madrelingua' },
  { code: 'C2', label: 'C2 · Padronanza' },
];

/**
 * First-run flow. As requested, the very first things asked are the user's
 * NAME (so every avatar addresses them personally) and AGE (the difficulty
 * and the whole learning path are tuned to the age band, then progress
 * gradually).
 */
export function OnboardingScreen() {
  const t = useTheme();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [ageText, setAgeText] = useState('');
  const [language, setLanguage] = useState<LanguageCode | null>(null);
  const [level, setLevel] = useState<CEFRLevel>('A1');
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState(10);

  const age = parseInt(ageText, 10);
  const validAge = !Number.isNaN(age) && age >= 4 && age <= 110;
  const band = validAge ? ageBandFor(age) : null;

  const finish = () => {
    if (!name.trim() || !validAge || !language || !band) return;
    completeOnboarding({
      name: name.trim(),
      age,
      ageBand: band,
      nativeLanguage: 'it',
      targetLanguage: language,
      level,
      dailyGoalMinutes: goal,
      interests,
      premium: false,
      createdAt: Date.now(),
    });
  };

  const steps = useMemo(() => [
    // Step 0: welcome + name
    <View key="name">
      <Text style={{ fontSize: 44, marginBottom: 8 }}>👋</Text>
      <SectionTitle>Benvenuto in Lingue!</SectionTitle>
      <Body style={{ marginBottom: 16 }}>
        Il tuo tutor personale, disponibile 24 ore su 24. Prima di iniziare… come ti chiami?
        Gli avatar ti chiameranno per nome!
      </Body>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Il tuo nome"
        placeholderTextColor={t.colors.textMuted}
        style={{
          borderWidth: 1.5, borderColor: t.colors.border, borderRadius: t.radius,
          padding: 14, fontSize: 18 * t.fontScale, color: t.colors.text,
          backgroundColor: t.colors.surface,
        }}
      />
      <Button title="Continua" onPress={() => setStep(1)} disabled={!name.trim()} style={{ marginTop: 20 }} />
    </View>,

    // Step 1: age → band
    <View key="age">
      <Text style={{ fontSize: 44, marginBottom: 8 }}>🎂</Text>
      <SectionTitle>Piacere, {name.trim()}! Quanti anni hai?</SectionTitle>
      <Body style={{ marginBottom: 16 }}>
        Adatterò la difficoltà, gli argomenti e il ritmo delle lezioni alla tua età,
        e aumenterò il livello man mano che migliori.
      </Body>
      <TextInput
        value={ageText}
        onChangeText={setAgeText}
        placeholder="La tua età"
        placeholderTextColor={t.colors.textMuted}
        keyboardType="number-pad"
        maxLength={3}
        style={{
          borderWidth: 1.5, borderColor: t.colors.border, borderRadius: t.radius,
          padding: 14, fontSize: 18 * t.fontScale, color: t.colors.text,
          backgroundColor: t.colors.surface,
        }}
      />
      {band && (
        <View style={{
          marginTop: 16, backgroundColor: t.colors.tealSoft, borderRadius: t.radius, padding: 14,
        }}
        >
          <Body style={{ fontWeight: '800' }}>{BAND_INFO[band].emoji} {BAND_INFO[band].title}</Body>
          <Muted style={{ marginTop: 4 }}>{BAND_INFO[band].blurb}</Muted>
        </View>
      )}
      <Button title="Continua" onPress={() => setStep(2)} disabled={!validAge} style={{ marginTop: 20 }} />
    </View>,

    // Step 2: language
    <View key="lang">
      <Text style={{ fontSize: 44, marginBottom: 8 }}>🌍</Text>
      <SectionTitle>Che lingua vuoi imparare?</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {LANGUAGES.filter((l) => l.code !== 'it').map((l) => (
          <Chip
            key={l.code}
            label={l.name}
            emoji={l.flag}
            selected={language === l.code}
            onPress={() => setLanguage(l.code)}
          />
        ))}
      </View>
      <Button title="Continua" onPress={() => setStep(3)} disabled={!language} style={{ marginTop: 20 }} />
    </View>,

    // Step 3: level
    <View key="level">
      <Text style={{ fontSize: 44, marginBottom: 8 }}>📊</Text>
      <SectionTitle>Qual è il tuo livello attuale?</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
        {LEVELS.map((l) => (
          <Chip key={l.code} label={l.label} selected={level === l.code} onPress={() => setLevel(l.code)} />
        ))}
      </View>
      <Muted style={{ marginTop: 8 }}>
        Il percorso parte da qui e cresce gradualmente fino al C2, senza salti improvvisi.
      </Muted>
      <Button title="Continua" onPress={() => setStep(4)} style={{ marginTop: 20 }} />
    </View>,

    // Step 4: interests + daily goal
    <View key="interests">
      <Text style={{ fontSize: 44, marginBottom: 8 }}>✨</Text>
      <SectionTitle>Cosa ti interessa?</SectionTitle>
      <Muted style={{ marginBottom: 8 }}>
        L’AI userà i tuoi interessi per personalizzare conversazioni e piano di studio.
      </Muted>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {INTERESTS.map((i) => (
          <Chip
            key={i}
            label={i}
            selected={interests.includes(i)}
            onPress={() => setInterests((prev) =>
              prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])}
          />
        ))}
      </View>
      <SectionTitle style={{ marginTop: 16 }}>Obiettivo giornaliero</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {[5, 10, 15, 30].map((m) => (
          <Chip key={m} label={`${m} min`} selected={goal === m} onPress={() => setGoal(m)} />
        ))}
      </View>
      <Button title="Inizia il viaggio! 🚀" onPress={finish} style={{ marginTop: 20 }} />
    </View>,
  ], [name, ageText, band, validAge, language, level, interests, goal, t, step]);

  return (
    <LinearGradient
      colors={t.dark ? ['#0B1220', '#12253F'] : ['#EAF3FF', '#F7FAFC']}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 80, flexGrow: 1 }}>
          {/* progress dots */}
          <View style={{ flexDirection: 'row', marginBottom: 28 }}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  marginRight: 6,
                  backgroundColor: i <= step ? t.colors.primary : t.colors.border,
                }}
              />
            ))}
          </View>
          {steps[step]}
          {step > 0 && (
            <Button title="← Indietro" variant="ghost" onPress={() => setStep(step - 1)} style={{ marginTop: 12 }} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
