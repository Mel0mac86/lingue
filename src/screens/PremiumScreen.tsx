import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';
import { useApp } from '../state/AppContext';
import { Body, Button, Card, Muted, SectionTitle } from '../components/ui';
import type { RootScreenProps } from '../navigation/types';

const PERKS = [
  ['💬', 'Conversazioni illimitate con gli avatar'],
  ['🧑‍🎤', 'Tutti gli avatar e tutte le personalità'],
  ['🌍', 'Tutte le 9 lingue, senza limiti'],
  ['🎭', 'Tutti gli scenari, anche quelli esclusivi'],
  ['🎙️', 'Analisi avanzata della pronuncia'],
  ['🤖', 'Piano di studio AI completo'],
  ['📊', 'Report dettagliati sui progressi'],
  ['✨', 'Contenuti esclusivi ogni mese'],
] as const;

/**
 * Premium paywall. Purchases are mocked for now: integrate RevenueCat or
 * StoreKit/Play Billing before shipping to the stores.
 */
export function PremiumScreen({ navigation }: RootScreenProps<'Premium'>) {
  const t = useTheme();
  const { profile, updateProfile } = useApp();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.background }}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      <LinearGradient
        colors={[t.colors.primary, t.colors.teal]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 28, alignItems: 'center' }}
      >
        <Text style={{ fontSize: 56 }}>👑</Text>
        <Text style={{
          fontSize: 26 * t.fontScale, fontWeight: '900', color: '#fff', marginTop: 4,
        }}
        >
          Lingue Premium
        </Text>
        <Text style={{ color: '#EAF6FF', textAlign: 'center', marginTop: 6, fontSize: 15 * t.fontScale }}>
          Il tuo tutor personale, senza limiti. Parla, sbaglia, migliora — ogni giorno.
        </Text>
      </LinearGradient>

      <View style={{ padding: t.spacing.lg }}>
        <Card style={{ marginBottom: 16 }}>
          {PERKS.map(([emoji, text]) => (
            <View key={text} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}>
              <Text style={{ fontSize: 20, marginRight: 10 }}>{emoji}</Text>
              <Body style={{ flex: 1 }}>{text}</Body>
            </View>
          ))}
        </Card>

        {profile?.premium ? (
          <Card style={{ alignItems: 'center' }}>
            <SectionTitle>Sei già Premium! 🎉</SectionTitle>
            <Button
              title="Disattiva (demo)"
              variant="ghost"
              onPress={() => { updateProfile({ premium: false }); navigation.goBack(); }}
            />
          </Card>
        ) : (
          <View>
            <Button
              title="Prova Premium (demo) — 9,99 €/mese"
              onPress={() => { updateProfile({ premium: true }); navigation.goBack(); }}
            />
            <Muted style={{ textAlign: 'center', marginTop: 10 }}>
              Versione dimostrativa: nessun pagamento reale. In produzione qui si
              integra l’acquisto in-app (RevenueCat / StoreKit / Play Billing).
            </Muted>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
