import React from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle, type TextStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

// ─── Buttons ─────────────────────────────────────────────────────────────────

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
  const bg = variant === 'primary' ? t.colors.primary
    : variant === 'secondary' ? t.colors.teal
      : variant === 'danger' ? t.colors.danger
        : 'transparent';
  const fg = variant === 'ghost' ? t.colors.primary : t.colors.onPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [{
        backgroundColor: bg,
        borderRadius: t.radius,
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        borderWidth: variant === 'ghost' ? 1.5 : 0,
        borderColor: t.colors.primary,
      }, style]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <Text style={{ color: fg, fontWeight: '700', fontSize: 16 * t.fontScale }}>
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
      borderWidth: 1,
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
        backgroundColor: selected ? t.colors.primary : t.colors.surfaceAlt,
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: selected ? t.colors.primary : t.colors.border,
      }}
    >
      <Text style={{
        color: selected ? t.colors.onPrimary : t.colors.text,
        fontWeight: '600',
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
      fontSize: 19 * t.fontScale,
      fontWeight: '800',
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
      height: 10, borderRadius: 5, backgroundColor: t.colors.surfaceAlt, overflow: 'hidden',
    }}
    >
      <View style={{
        width: `${Math.max(0, Math.min(100, value))}%`,
        height: '100%',
        borderRadius: 5,
        backgroundColor: color ?? t.colors.teal,
      }}
      />
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
        marginTop: 4, fontSize: 12 * t.fontScale, color: t.colors.textMuted, fontWeight: '600',
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
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: t.spacing.md }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text style={{ fontSize: 20 * t.fontScale, fontWeight: '800', color: t.colors.text, marginTop: 2 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11.5 * t.fontScale, color: t.colors.textMuted, textAlign: 'center' }}>
        {label}
      </Text>
    </Card>
  );
}
