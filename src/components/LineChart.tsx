import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useTheme } from '../theme';

/** Minimal dependency-free line chart used in the dashboard. */
export function LineChart({
  data, width = 300, height = 120, color, label,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}) {
  const t = useTheme();
  const stroke = color ?? t.colors.primary;
  const pad = 8;
  const max = Math.max(1, ...data);
  const points = data.length >= 2
    ? data.map((v, i) => ({
      x: pad + (i * (width - pad * 2)) / (data.length - 1),
      y: height - pad - (v / max) * (height - pad * 2),
    }))
    : [];
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <View>
      {label ? (
        <Text style={{ color: t.colors.textMuted, fontSize: 12.5 * t.fontScale, marginBottom: 4, fontWeight: '600' }}>
          {label}
        </Text>
      ) : null}
      <Svg width={width} height={height}>
        <Line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke={t.colors.border} strokeWidth={1} />
        {points.length >= 2 ? (
          <>
            <Path d={path} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
            {points.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={3} fill={stroke} />
            ))}
          </>
        ) : (
          <Circle cx={width / 2} cy={height / 2} r={0} fill="none" />
        )}
      </Svg>
      {points.length < 2 && (
        <Text style={{
          color: t.colors.textMuted, fontSize: 12 * t.fontScale, textAlign: 'center', marginTop: -height / 2 - 8, marginBottom: height / 2,
        }}
        >
          Ancora pochi dati: continua a studiare! 📈
        </Text>
      )}
    </View>
  );
}
