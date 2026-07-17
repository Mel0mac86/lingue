import React, { useEffect, useRef } from 'react';
import { Animated, Easing, useWindowDimensions, View } from 'react-native';

const COLORS = ['#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B', '#CE82FF', '#FFD900'];
const PIECES = 26;

/** One-shot celebration confetti burst falling over the whole screen. */
export function Confetti() {
  const { width, height } = useWindowDimensions();
  const pieces = useRef(
    Array.from({ length: PIECES }, (_, i) => ({
      x: Math.random() * width,
      delay: Math.random() * 500,
      duration: 1600 + Math.random() * 1400,
      size: 8 + Math.random() * 8,
      color: COLORS[i % COLORS.length],
      sway: (Math.random() - 0.5) * 120,
      rotate: Math.random() > 0.5 ? 1 : -1,
      progress: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    const anims = pieces.map((p) => Animated.timing(p.progress, {
      toValue: 1,
      duration: p.duration,
      delay: p.delay,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }));
    Animated.parallel(anims).start();
  }, [pieces]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: -20,
            width: p.size,
            height: p.size * 0.55,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.progress.interpolate({
              inputRange: [0, 0.75, 1], outputRange: [1, 1, 0],
            }),
            transform: [
              {
                translateY: p.progress.interpolate({
                  inputRange: [0, 1], outputRange: [0, height + 40],
                }),
              },
              {
                translateX: p.progress.interpolate({
                  inputRange: [0, 0.5, 1], outputRange: [0, p.sway, p.sway * 0.4],
                }),
              },
              {
                rotate: p.progress.interpolate({
                  inputRange: [0, 1], outputRange: ['0deg', `${p.rotate * 540}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
