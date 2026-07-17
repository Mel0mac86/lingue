import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, View } from 'react-native';

export interface PhotoAvatarConfig {
  uri: string;
  w: number;
  h: number;
  /** Mouth centre as fractions of the image (0-1). */
  mouthX: number;
  mouthY: number;
}

/**
 * "Talking photo": animates any user-provided picture like a puppet —
 * gentle breathing, sway, a speaking pulse and a lip-synced mouth overlay
 * drawn at the position the user calibrated with a tap.
 *
 * The image is rendered with `contain` inside the stage so the calibrated
 * mouth position maps exactly onto the displayed pixels.
 */
export function PhotoAvatar({
  config, speaking, width, height,
}: {
  config: PhotoAvatarConfig;
  speaking: boolean;
  width: number;
  height: number;
}) {
  const sway = useRef(new Animated.Value(0)).current;
  const mouth = useRef(new Animated.Value(2)).current;

  // Idle breathing/sway loop.
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(sway, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(sway, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [sway]);

  // Lip sync: random mouth openness while speaking.
  useEffect(() => {
    let mounted = true;
    if (!speaking) {
      Animated.timing(mouth, { toValue: 2, duration: 120, useNativeDriver: false }).start();
      return () => { mounted = false; };
    }
    const move = () => {
      if (!mounted) return;
      Animated.timing(mouth, {
        toValue: 4 + Math.random() * 18,
        duration: 85 + Math.random() * 85,
        useNativeDriver: false,
      }).start(() => move());
    };
    move();
    return () => { mounted = false; };
  }, [speaking, mouth]);

  // Contain-fit rect of the image inside the stage.
  const rect = useMemo(() => {
    const scale = Math.min(width / config.w, height / config.h);
    const dw = config.w * scale;
    const dh = config.h * scale;
    return { x: (width - dw) / 2, y: (height - dh) / 2, w: dw, h: dh };
  }, [config, width, height]);

  const mouthW = Math.max(26, rect.w * 0.14);
  const translateY = sway.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-1.2deg', '1.2deg'] });

  return (
    <Animated.View style={{
      width, height, transform: [{ translateY }, { rotate }],
    }}
    >
      <Image
        source={{ uri: config.uri }}
        style={{ width, height }}
        resizeMode="contain"
      />
      {/* lip-synced mouth overlay */}
      <Animated.View style={{
        position: 'absolute',
        left: rect.x + rect.w * config.mouthX - mouthW / 2,
        top: rect.y + rect.h * config.mouthY,
        width: mouthW,
        height: mouth,
        marginTop: Animated.multiply(mouth, -0.5),
        borderRadius: 60,
        backgroundColor: '#43140F',
        borderBottomWidth: 3,
        borderBottomColor: '#B65F58',
        opacity: speaking ? 0.92 : 0,
      }}
      />
    </Animated.View>
  );
}
