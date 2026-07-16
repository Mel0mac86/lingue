import React from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle, type TextStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

// ─── Buttons ─────────────────────────────────────────────────────────────────

/**
 * Duolingo-style "3D" button: flat colour with a darker bottom edge that
 * collapses when pressed. Labels are uppercase and chunky.
 */
export function Button({
  title, onPress, variant = 'primary', disabled, loading, style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const t = useTheme();
  const palette = {
    primary: { bg: t.colors.primary, edge: t.colors.primaryEdge, fg: t.colors.onPrimary },
    secondary: { bg: t.colors.blue, edge: t.colors.blueEdge, fg: t.colors.onPrimary },
    danger: { bg: t.colors.danger, edge: '#C93A3A', fg: t.colors.onPrimary },
    ghost: { bg: 'transparent', edge: 'transparent', fg: t.colors.blue },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [{
        backgroundColor: disabled ? t.colors.locked : palette.bg,
        borderRadius: t.radius,
        paddingVertical: 13,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: variant === 'ghost' ? 2 : pressed || disabled ? 0 : 4,
        borderColor: variant === 'ghost' ? t.colors.border : disabled ? t.colors.locked : palette.edge,
        borderWidth: variant === 'ghost' ? 2 : undefined,
        marginTop: pressed && variant !== 'ghost' ? 4 : 0,
      }, style]}
    >
      {loading ? <ActivityIndicator color={palette.fg} /> : (
        <Text style={{
          color: disabled ? t.colors.textMuted : palette.fg,
          fontWeight: '800',
          fontSize: 15 * t.fontScale,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

// ─── Layout primitives ───────────────────────────────────────────────────────

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return (
    <View style={[{
      backgroundColor: t.colors.surface,
      borderRadius: t.radius,
      padding: t.spacing.lg,
      borderWidth: 2,
      borderColor: t.colors.border,
    }, style]}
    >
      {children}
    </View>
  );
}

export function Chip({
  label, selected, onPress, emoji,
}: {
  label: string; selected?: boolean; onPress?: () => void; emoji?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: selected ? `${t.colors.blue}22` : t.colors.surface,
        borderRadius: 14,
        paddingVertical: 9,
        paddingHorizontal: 14,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 2,
        borderBottomWidth: 3,
        borderColor: selected ? t.colors.blue : t.colors.border,
      }}
    >
      <Text style={{
        color: selected ? t.colors.blue : t.colors.text,
        fontWeight: '700',
        fontSize: 14 * t.fontScale,
      }}
      >
        {emoji ? `${emoji} ` : ''}{label}
      </Text>
    </Pressable>
  );
}

export function SectionTitle({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const t = useTheme();
  return (
    <Text style={[{
      fontSize: 20 * t.fontScale,
      fontWeight: '900',
      color: t.colors.text,
      marginBottom: t.spacing.md,
    }, style]}
    >
      {children}
    </Text>
  );
}

export function Muted({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const t = useTheme();
  return (
    <Text style={[{ color: t.colors.textMuted, fontSize: 14 * t.fontScale, lineHeight: 20 * t.fontScale }, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const t = useTheme();
  return (
    <Text style={[{ color: t.colors.text, fontSize: 16 * t.fontScale, lineHeight: 23 * t.fontScale }, style]}>
      {children}
    </Text>
  );
}

// ─── Progress indicators ─────────────────────────────────────────────────────

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const t = useTheme();
  return (
    <View style={{
      height: 14, borderRadius: 7, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden',
      borderWidth: t.dark ? 0 : 1, borderColor: t.colors.border,
    }}
    >
      <View style={{
        width: `${Math.max(0, Math.min(100, value))}%`,
        height: '100%',
        borderRadius: 7,
        backgroundColor: color ?? t.colors.primary,
      }}
      >
        {/* Duolingo-style glossy stripe */}
        <View style={{
          position: 'absolute', top: 3, left: 6, right: 6, height: 3,
          borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)',
        }}
        />
      </View>
    </View>
  );
}

/** Circular score gauge (0-100). */
export function ScoreRing({
  value, label, size = 84, color,
}: {
  value: number; label: string; size?: number; color?: string;
}) {
  const t = useTheme();
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const ringColor = color ?? (pct >= 75 ? t.colors.success : pct >= 50 ? t.colors.warning : t.colors.danger);
  return (
    <View style={{ alignItems: 'center', width: size + 8 }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={t.colors.surfaceAlt} strokeWidth={stroke} fill="none"
          />
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={ringColor} strokeWidth={stroke} fill="none"
            strokeDasharray={`${(c * pct) / 100} ${c}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill as ViewStyle, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontWeight: '800', fontSize: size / 4, color: t.colors.text }}>
            {Math.round(pct)}
          </Text>
        </View>
      </View>
      <Text style={{
        marginTop: 4, fontSize: 12 * t.fontScale, color: t.colors.textMuted, fontWeight: '700',
      }}
      >
        {label}
      </Text>
    </View>
  );
}

export function StatTile({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  const t = useTheme();
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: t.spacing.md, paddingHorizontal: 4 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{ fontSize: 20 * t.fontScale, fontWeight: '900', color: t.colors.text, marginTop: 2 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11.5 * t.fontScale, color: t.colors.textMuted, textAlign: 'center', fontWeight: '600' }}>
        {label}
      </Text>
    </Card>
  );
}

// ─── Duolingo-style bottom feedback banner ──────────────────────────────────

export function FeedbackBanner({
  correct, correctAnswer, onContinue,
}: {
  correct: boolean;
  correctAnswer?: string;
  onContinue: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{
      backgroundColor: correct ? t.colors.successSoft : t.colors.dangerSoft,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: t.spacing.lg,
      paddingBottom: t.spacing.xl,
    }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <View style={{
          width: 34, height: 34, borderRadius: 17, marginRight: 10,
          backgroundColor: correct ? t.colors.success : t.colors.danger,
          alignItems: 'center', justifyContent: 'center',
        }}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>
            {correct ? '✓' : '✗'}
          </Text>
        </View>
        <Text style={{
          fontSize: 19 * t.fontScale, fontWeight: '900',
          color: correct ? (t.dark ? t.colors.success : '#58A700') : (t.dark ? t.colors.danger : '#EA2B2B'),
        }}
        >
          {correct ? 'Fantastico!' : 'Non proprio…'}
        </Text>
      </View>
      {!correct && correctAnswer ? (
        <Text style={{
          color: t.dark ? t.colors.text : '#EA2B2B',
          fontSize: 15 * t.fontScale,
          marginBottom: 10,
          marginLeft: 44,
        }}
        >
          Risposta corretta: <Text style={{ fontWeight: '800' }}>{correctAnswer}</Text>
        </Text>
      ) : null}
      <Button
        title="Continua"
        variant={correct ? 'primary' : 'danger'}
        onPress={onContinue}
        style={{ marginTop: 8 }}
      />
    </View>
  );
}
