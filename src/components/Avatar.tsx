import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text } from 'react-native';
import Svg, {
  Circle, Ellipse, Path, Rect, Defs, RadialGradient, Stop,
} from 'react-native-svg';
import type { AvatarDef } from '../types';
import { useTheme } from '../theme';

export type AvatarMood = 'neutral' | 'happy' | 'thinking' | 'encouraging';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * Animated talking avatar.
 *
 * Rendered as a stylised vector face with idle motion (breathing, blinking),
 * lip-sync animation while `speaking` is true and mood-based expressions.
 * The renderer is deliberately isolated behind this component so it can be
 * swapped for a full 3D avatar (Three.js / Ready Player Me) without touching
 * any screen code.
 */
export function Avatar({
  def, speaking, mood = 'neutral', size = 220,
}: {
  def: AvatarDef;
  speaking: boolean;
  mood?: AvatarMood;
  size?: number;
}) {
  const t = useTheme();
  const mouth = useRef(new Animated.Value(2)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  // Idle breathing/float loop.
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [float]);

  // Blink every few seconds.
  useEffect(() => {
    let mounted = true;
    const doBlink = () => {
      if (!mounted) return;
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.08, duration: 70, useNativeDriver: false }),
        Animated.timing(blink, { toValue: 1, duration: 90, useNativeDriver: false }),
      ]).start(() => {
        setTimeout(doBlink, 1800 + Math.random() * 2600);
      });
    };
    const timer = setTimeout(doBlink, 1200);
    return () => { mounted = false; clearTimeout(timer); };
  }, [blink]);

  // Lip sync: random mouth openness while speaking.
  useEffect(() => {
    let mounted = true;
    if (!speaking) {
      Animated.timing(mouth, { toValue: 2, duration: 140, useNativeDriver: false }).start();
      return () => { mounted = false; };
    }
    const move = () => {
      if (!mounted) return;
      Animated.timing(mouth, {
        toValue: 3 + Math.random() * 11,
        duration: 90 + Math.random() * 80,
        useNativeDriver: false,
      }).start(() => move());
    };
    move();
    return () => { mounted = false; };
  }, [speaking, mouth]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const eyeRy = blink.interpolate({ inputRange: [0, 1], outputRange: [0.5, 6] });

  const browLift = mood === 'happy' || mood === 'encouraging' ? -3 : mood === 'thinking' ? 2 : 0;
  const smile = mood === 'happy' || mood === 'encouraging';

  return (
    <Animated.View style={{ transform: [{ translateY }], alignItems: 'center' }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: t.colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: def.color,
        overflow: 'hidden',
      }}
      >
        <Svg width={size * 0.92} height={size * 0.92} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="35%" r="70%">
              <Stop offset="0%" stopColor={def.color} stopOpacity="0.25" />
              <Stop offset="100%" stopColor={def.color} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#glow)" />
          {/* shoulders */}
          <Path d="M 18 100 Q 50 76 82 100 Z" fill={def.color} />
          {/* neck */}
          <Rect x="44" y="66" width="12" height="14" rx="5" fill={def.skin} />
          {/* head */}
          <Ellipse cx="50" cy="44" rx="24" ry="27" fill={def.skin} />
          {/* hair */}
          <Path
            d={def.gender === 'female'
              ? 'M 26 44 Q 22 10 50 12 Q 78 10 74 44 Q 76 24 62 22 Q 50 18 38 22 Q 24 24 26 44 Z M 26 40 Q 24 62 30 66 L 30 44 Z M 74 40 Q 76 62 70 66 L 70 44 Z'
              : 'M 27 38 Q 26 14 50 13 Q 74 14 73 38 Q 70 22 50 21 Q 30 22 27 38 Z'}
            fill={def.hair}
          />
          {/* eyebrows */}
          <Path d={`M 34 ${33 + browLift} Q 39 ${30.5 + browLift} 44 ${33 + browLift}`} stroke={def.hair} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <Path d={`M 56 ${33 + browLift} Q 61 ${30.5 + browLift} 66 ${33 + browLift}`} stroke={def.hair} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* eyes (blinking) */}
          <AnimatedEllipse cx={39} cy={40} rx={3.4} ry={eyeRy as unknown as number} fill="#1F2937" />
          <AnimatedEllipse cx={61} cy={40} rx={3.4} ry={eyeRy as unknown as number} fill="#1F2937" />
          {/* cheeks */}
          {smile && (
            <>
              <Circle cx="32" cy="49" r="3.4" fill="#F87171" opacity={0.35} />
              <Circle cx="68" cy="49" r="3.4" fill="#F87171" opacity={0.35} />
            </>
          )}
          {/* nose */}
          <Path d="M 50 44 Q 52 50 49 52" stroke="#00000022" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {/* mouth (lip sync) */}
          <AnimatedRect
            x={42}
            y={smile ? 56 : 58}
            width={16}
            height={mouth as unknown as number}
            rx={4}
            fill="#B4453B"
          />
          {smile && !speaking && (
            <Path d="M 40 58 Q 50 66 60 58" stroke="#B4453B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          )}
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <Text style={{ fontSize: 17 * t.fontScale, fontWeight: '800', color: t.colors.text }}>
          {def.emoji} {def.name}
        </Text>
      </View>
      {speaking && (
        <Text style={{ color: def.color, fontWeight: '700', fontSize: 12 * t.fontScale, marginTop: 2 }}>
          ● sta parlando…
        </Text>
      )}
    </Animated.View>
  );
}
