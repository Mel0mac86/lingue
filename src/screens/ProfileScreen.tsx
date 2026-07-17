import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Body, Button, Card, Chip, Muted, SectionTitle } from '../components/ui';
import { getGroqApiKey, setGroqApiKey } from '../services/config';
import { languageByCode } from '../content/languages';
import { rosterForAgeBand } from '../content/avatars';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Self-hosted realistic demo head with ARKit blendshapes (Face Cap, CC-BY). */
const DEMO_FACE_URL = '/lingue/models/demo-face.glb';

export function ProfileScreen() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { profile, settings, updateSettings, updateProfile, resetAll } = useApp();
  const [keyInput, setKeyInput] = useState('');
  const [keySet, setKeySet] = useState(false);
  const [faceUrlInput, setFaceUrlInput] = useState('');
  useEffect(() => {
    getGroqApiKey().then((k) => setKeySet(!!k));
  }, []);

  if (!profile) return null;
  const lang = languageByCode(profile.targetLanguage);

  const saveKey = async () => {
    const k = keyInput.trim();
    await setGroqApiKey(k || null);
    setKeySet(!!k || !!process.env.EXPO_PUBLIC_GROQ_API_KEY);
    setKeyInput('');
    Alert.alert('Fatto', k ? 'Chiave API salvata sul dispositivo.' : 'Chiave API rimossa.');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ padding: t.spacing.lg, paddingBottom: 48 }}
    >
      <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
        <Text style={{ fontSize: 56 }}>🙋</Text>
        <SectionTitle style={{ marginBottom: 0 }}>{profile.name}</SectionTitle>
        <Muted>
          {profile.age} anni · studia {lang.name} {lang.flag} · livello {profile.level}
        </Muted>
      </View>

      {/* Premium */}
      <Pressable onPress={() => nav.navigate('Premium')}>
        <Card style={{
          marginBottom: 12, backgroundColor: profile.premium ? `${t.colors.gold}18` : t.colors.surfaceAlt,
          borderColor: t.colors.gold,
        }}
        >
          <Body style={{ fontWeight: '800' }}>
            {profile.premium ? '👑 Sei Premium!' : '👑 Passa a Premium'}
          </Body>
          <Muted>
            {profile.premium
              ? 'Conversazioni illimitate, tutti gli avatar, tutte le lingue e tutti gli scenari.'
              : 'Conversazioni illimitate, tutti gli scenari, analisi avanzata della pronuncia e report dettagliati.'}
          </Muted>
        </Card>
      </Pressable>

      {/* Companion avatar (kids: their animal buddy) */}
      <Card style={{ marginBottom: 12 }}>
        <Body style={{ fontWeight: '800', marginBottom: 4 }}>
          {profile.ageBand === 'kids' ? '🐾 Il tuo amico animale' : '🧑‍🏫 Il tuo tutor per le lezioni'}
        </Body>
        <Muted style={{ marginBottom: 8 }}>
          {profile.ageBand === 'kids'
            ? 'Parla con te dopo ogni lezione: cambialo quando vuoi!'
            : 'L’avatar che ti fa praticare dopo ogni lezione.'}
        </Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {rosterForAgeBand(profile.ageBand).map((a) => (
            <Chip
              key={a.id}
              label={a.name}
              emoji={a.emoji}
              selected={(profile.favoriteAvatarId ?? (profile.ageBand === 'kids' ? 'foxy' : 'emma')) === a.id}
              onPress={() => updateProfile({ favoriteAvatarId: a.id })}
            />
          ))}
        </View>
      </Card>

      {/* Photorealistic face (web) */}
      <Card style={{ marginBottom: 12 }}>
        <Body style={{ fontWeight: '800', marginBottom: 4 }}>🎭 Volto realistico (beta)</Body>
        <Muted style={{ marginBottom: 10 }}>
          Sostituisce il viso 3D stilizzato degli avatar umani con un volto
          fotorealistico animato (lip-sync e battito di ciglia compresi).
          Puoi usare il volto demo oppure creare GRATIS il tuo avatar su
          readyplayer.me e incollare qui il link .glb.
        </Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
          <Chip
            label="Stilizzato"
            emoji="🧑‍🎨"
            selected={!settings.realisticFaceUrl}
            onPress={() => updateSettings({ realisticFaceUrl: null })}
          />
          <Chip
            label="Volto demo"
            emoji="🎭"
            selected={settings.realisticFaceUrl === DEMO_FACE_URL}
            onPress={() => updateSettings({ realisticFaceUrl: DEMO_FACE_URL })}
          />
        </View>
        <TextInput
          value={faceUrlInput}
          onChangeText={setFaceUrlInput}
          placeholder="https://models.readyplayer.me/….glb"
          placeholderTextColor={t.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            borderWidth: 1.5, borderColor: t.colors.border, borderRadius: 12,
            padding: 12, color: t.colors.text, backgroundColor: t.colors.surface,
            fontSize: 14 * t.fontScale, marginBottom: 8,
          }}
        />
        <Button
          title="Usa il mio avatar Ready Player Me"
          variant="secondary"
          onPress={() => {
            const url = faceUrlInput.trim();
            if (!url.endsWith('.glb') && !url.includes('.glb?')) {
              Alert.alert('Link non valido', 'Incolla il link del file .glb del tuo avatar (da readyplayer.me).');
              return;
            }
            updateSettings({ realisticFaceUrl: url });
            setFaceUrlInput('');
            Alert.alert('Fatto', 'Volto realistico attivato! Se il modello non si carica, torneremo automaticamente al viso stilizzato.');
          }}
        />
        <Muted style={{ marginTop: 8, fontSize: 11 * t.fontScale }}>
          Volto demo: “facecap” dagli esempi three.js (© Face Cap, CC-BY). Su
          app native il viso resta stilizzato.
        </Muted>
      </Card>

      {/* Theme */}
      <Card style={{ marginBottom: 12 }}>
        <Body style={{ fontWeight: '800', marginBottom: 8 }}>🎨 Tema</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([['light', '☀️ Chiaro'], ['dark', '🌙 Scuro'], ['system', '📱 Sistema']] as const).map(([mode, label]) => (
            <Chip
              key={mode}
              label={label}
              selected={settings.themeMode === mode}
              onPress={() => updateSettings({ themeMode: mode })}
            />
          ))}
        </View>
      </Card>

      {/* Voice */}
      <Card style={{ marginBottom: 12 }}>
        <Body style={{ fontWeight: '800', marginBottom: 8 }}>🔊 Voce dell’avatar</Body>
        <Pressable onPress={() => updateSettings({ ttsEnabled: !settings.ttsEnabled })}>
          <Body>{settings.ttsEnabled ? '✅ Voce attiva' : '⬜ Voce disattivata'}</Body>
        </Pressable>
        <Pressable onPress={() => updateSettings({ sfxEnabled: !settings.sfxEnabled })} style={{ marginTop: 6 }}>
          <Body>{settings.sfxEnabled ? '✅ Effetti sonori attivi' : '⬜ Effetti sonori disattivati'}</Body>
        </Pressable>
        <Muted style={{ marginTop: 8, marginBottom: 4 }}>Velocità di lettura</Muted>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([[0.75, '🐢 Lenta'], [0.95, '🚶 Normale'], [1.1, '🏃 Veloce']] as const).map(([rate, label]) => (
            <Chip
              key={rate}
              label={label}
              selected={Math.abs(settings.ttsRate - rate) < 0.01}
              onPress={() => updateSettings({ ttsRate: rate })}
            />
          ))}
        </View>
      </Card>

      {/* AI settings */}
      <Card style={{ marginBottom: 12 }}>
        <Body style={{ fontWeight: '800', marginBottom: 4 }}>🤖 Impostazioni AI</Body>
        <Muted style={{ marginBottom: 10 }}>
          Le conversazioni usano Groq (chat + riconoscimento vocale). Inserisci la tua
          chiave API personale: viene salvata SOLO su questo dispositivo.
          {keySet ? '\n\n✅ Chiave configurata.' : '\n\n⚠️ Nessuna chiave configurata: le funzioni AI sono disattivate.'}
        </Muted>
        <TextInput
          value={keyInput}
          onChangeText={setKeyInput}
          placeholder="gsk_…"
          placeholderTextColor={t.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          style={{
            borderWidth: 1.5, borderColor: t.colors.border, borderRadius: 12,
            padding: 12, color: t.colors.text, backgroundColor: t.colors.surface,
            fontSize: 15 * t.fontScale, marginBottom: 10,
          }}
        />
        <Button title="Salva chiave" variant="secondary" onPress={saveKey} />
      </Card>

      {/* Daily goal */}
      <Card style={{ marginBottom: 12 }}>
        <Body style={{ fontWeight: '800', marginBottom: 8 }}>🎯 Obiettivo giornaliero</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {[5, 10, 15, 30].map((m) => (
            <Chip
              key={m}
              label={`${m} min`}
              selected={profile.dailyGoalMinutes === m}
              onPress={() => updateProfile({ dailyGoalMinutes: m })}
            />
          ))}
        </View>
      </Card>

      <Button
        title="Ricomincia da zero"
        variant="danger"
        onPress={() => Alert.alert(
          'Ricominciare?',
          'Perderai profilo e progressi salvati su questo dispositivo.',
          [
            { text: 'Annulla', style: 'cancel' },
            { text: 'Sì, cancella tutto', style: 'destructive', onPress: resetAll },
          ],
        )}
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}
