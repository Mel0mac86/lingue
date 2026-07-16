import React from 'react';
import { Text, View } from 'react-native';
import type { CorrectionSegment } from '../types';
import { useTheme } from '../theme';

/**
 * Chat bubble. When `segments` are provided (post-conversation review) the
 * sentence is colour-coded: green = correct, yellow = improvable, red = wrong.
 */
export function ChatBubble({
  role, text, segments, better,
}: {
  role: 'user' | 'assistant';
  text: string;
  segments?: CorrectionSegment[];
  better?: string;
}) {
  const t = useTheme();
  const isUser = role === 'user';
  const statusColor = (s: CorrectionSegment['status']) =>
    s === 'error' ? t.colors.danger : s === 'warn' ? t.colors.warning : t.colors.success;

  return (
    <View style={{
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      maxWidth: '86%',
      backgroundColor: isUser ? t.colors.primary : t.colors.surface,
      borderColor: t.colors.border,
      borderWidth: isUser ? 0 : 1,
      borderRadius: t.radius,
      borderBottomRightRadius: isUser ? 4 : t.radius,
      borderBottomLeftRadius: isUser ? t.radius : 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginVertical: 4,
    }}
    >
      {segments && segments.length > 0 ? (
        <Text style={{ fontSize: 16 * t.fontScale, lineHeight: 24 * t.fontScale }}>
          {segments.map((seg, i) => (
            <Text
              key={i}
              style={{
                color: isUser ? t.colors.onPrimary : t.colors.text,
                backgroundColor: `${statusColor(seg.status)}33`,
                textDecorationLine: seg.status === 'error' ? 'line-through' : 'none',
                fontWeight: seg.status === 'ok' ? '400' : '700',
              }}
            >
              {seg.text}{' '}
            </Text>
          ))}
        </Text>
      ) : (
        <Text style={{
          color: isUser ? t.colors.onPrimary : t.colors.text,
          fontSize: 16 * t.fontScale,
          lineHeight: 23 * t.fontScale,
        }}
        >
          {text}
        </Text>
      )}
      {better ? (
        <Text style={{
          marginTop: 6,
          color: isUser ? '#D6F5EC' : t.colors.teal,
          fontSize: 13.5 * t.fontScale,
          fontStyle: 'italic',
        }}
        >
          💡 {better}
        </Text>
      ) : null}
    </View>
  );
}

/** Legend for the correction colours. */
export function CorrectionLegend() {
  const t = useTheme();
  const Item = ({ color, label }: { color: string; label: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 5 }} />
      <Text style={{ color: t.colors.textMuted, fontSize: 12.5 * t.fontScale }}>{label}</Text>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 }}>
      <Item color={t.colors.success} label="Corretto" />
      <Item color={t.colors.warning} label="Migliorabile" />
      <Item color={t.colors.danger} label="Errore" />
    </View>
  );
}
