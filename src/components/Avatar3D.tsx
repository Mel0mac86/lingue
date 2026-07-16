import React, { useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AvatarDef } from '../types';
import { useTheme } from '../theme';

export type AvatarMood = 'neutral' | 'happy' | 'thinking' | 'encouraging';

/**
 * 3D talking avatar (Three.js via react-three-fiber).
 *
 * Works on iOS/Android (expo-gl) AND on web (WebGL) — Metro picks the right
 * fiber entry automatically. The head is procedural: idle breathing, gaze
 * drift, eye blinking, mood-driven eyebrows/smile and audio-style lip sync
 * while `speaking` is true.
 */
interface AnimState {
  speaking: boolean;
  mood: AvatarMood;
}

function Head({ def, anim }: { def: AvatarDef; anim: React.MutableRefObject<AnimState> }) {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const lowerLipRef = useRef<THREE.Mesh>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const browL = useRef<THREE.Mesh>(null);
  const browR = useRef<THREE.Mesh>(null);
  const smileRef = useRef<THREE.Mesh>(null);

  const nextBlink = useRef(2 + Math.random() * 3);
  const blinkPhase = useRef(0); // 0 = open
  const mouthTarget = useRef(0.05);
  const mouthValue = useRef(0.05);
  const nextMouthChange = useRef(0);

  const skin = useMemo(() => new THREE.Color(def.skin), [def.skin]);
  const hair = useMemo(() => new THREE.Color(def.hair), [def.hair]);
  const shirt = useMemo(() => new THREE.Color(def.color), [def.color]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const { speaking, mood } = anim.current;

    // Idle breathing / floating.
    if (group.current) {
      group.current.position.y = Math.sin(t * 1.4) * 0.045 - 0.15;
    }
    // Natural head motion: slow gaze drift + tiny nods while talking.
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.45) * 0.16 + (speaking ? Math.sin(t * 2.2) * 0.03 : 0);
      headRef.current.rotation.x = Math.sin(t * 0.7) * 0.05
        + (speaking ? Math.sin(t * 3.1) * 0.035 : 0)
        + (mood === 'thinking' ? 0.1 : 0);
      headRef.current.rotation.z = mood === 'thinking' ? 0.08 : Math.sin(t * 0.3) * 0.02;
    }

    // Blinking.
    nextBlink.current -= delta;
    if (nextBlink.current <= 0) {
      blinkPhase.current = 1;
      nextBlink.current = 2 + Math.random() * 3.5;
    }
    if (blinkPhase.current > 0) {
      blinkPhase.current = Math.max(0, blinkPhase.current - delta * 9);
    }
    const eyeScale = 0.12 + Math.abs(Math.cos(blinkPhase.current * Math.PI)) * 0.88;
    if (eyeL.current) eyeL.current.scale.y = eyeScale;
    if (eyeR.current) eyeR.current.scale.y = eyeScale;

    // Eyebrows follow the mood.
    const browY = mood === 'happy' || mood === 'encouraging' ? 0.06 : mood === 'thinking' ? -0.02 : 0;
    if (browL.current) browL.current.position.y = 0.32 + browY;
    if (browR.current) browR.current.position.y = 0.32 + browY;

    // Lip sync: random-walk target while speaking, closed otherwise.
    nextMouthChange.current -= delta;
    if (speaking && nextMouthChange.current <= 0) {
      mouthTarget.current = 0.15 + Math.random() * 0.85;
      nextMouthChange.current = 0.06 + Math.random() * 0.1;
    }
    if (!speaking) mouthTarget.current = 0.05;
    mouthValue.current += (mouthTarget.current - mouthValue.current) * Math.min(1, delta * 18);
    const open = mouthValue.current;
    if (mouthRef.current) {
      mouthRef.current.scale.set(1 - open * 0.25, 0.2 + open * 1.15, 1);
      mouthRef.current.position.y = -0.34 - open * 0.06;
    }
    if (lowerLipRef.current) {
      lowerLipRef.current.position.y = -0.42 - open * 0.12;
    }
    if (smileRef.current) {
      const showSmile = (mood === 'happy' || mood === 'encouraging') && !speaking;
      smileRef.current.visible = showSmile;
    }
  });

  const isFemale = def.gender === 'female';

  return (
    <group ref={group}>
      {/* shoulders / bust */}
      <mesh position={[0, -1.25, 0]}>
        <cylinderGeometry args={[0.55, 0.85, 0.9, 32]} />
        <meshStandardMaterial color={shirt} roughness={0.7} />
      </mesh>
      {/* neck */}
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[0.16, 0.19, 0.35, 24]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>

      <group ref={headRef}>
        {/* head */}
        <mesh>
          <sphereGeometry args={[0.62, 48, 48]} />
          <meshStandardMaterial color={skin} roughness={0.55} />
        </mesh>
        {/* ears */}
        <mesh position={[-0.6, -0.02, 0]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        <mesh position={[0.6, -0.02, 0]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        {/* hair cap */}
        <mesh position={[0, 0.16, -0.04]}>
          <sphereGeometry args={[0.64, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshStandardMaterial color={hair} roughness={0.85} />
        </mesh>
        {isFemale && (
          <>
            {/* long side hair */}
            <mesh position={[-0.5, -0.25, -0.12]} rotation={[0, 0, 0.15]}>
              <capsuleGeometry args={[0.16, 0.7, 8, 16]} />
              <meshStandardMaterial color={hair} roughness={0.85} />
            </mesh>
            <mesh position={[0.5, -0.25, -0.12]} rotation={[0, 0, -0.15]}>
              <capsuleGeometry args={[0.16, 0.7, 8, 16]} />
              <meshStandardMaterial color={hair} roughness={0.85} />
            </mesh>
          </>
        )}
        {/* eyebrows */}
        <mesh ref={browL} position={[-0.22, 0.32, 0.52]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.2, 0.045, 0.04]} />
          <meshStandardMaterial color={hair} />
        </mesh>
        <mesh ref={browR} position={[0.22, 0.32, 0.52]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[0.2, 0.045, 0.04]} />
          <meshStandardMaterial color={hair} />
        </mesh>
        {/* eyes */}
        <mesh position={[-0.22, 0.18, 0.5]}>
          <sphereGeometry args={[0.11, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0.22, 0.18, 0.5]}>
          <sphereGeometry args={[0.11, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        {/* pupils (blink by scaling) */}
        <mesh ref={eyeL} position={[-0.22, 0.18, 0.585]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#1F2937" roughness={0.1} />
        </mesh>
        <mesh ref={eyeR} position={[0.22, 0.18, 0.585]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#1F2937" roughness={0.1} />
        </mesh>
        {/* nose */}
        <mesh position={[0, 0.0, 0.6]}>
          <coneGeometry args={[0.07, 0.18, 16]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        {/* mouth cavity (lip-synced) */}
        <mesh ref={mouthRef} position={[0, -0.34, 0.54]}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#7F2B22" roughness={0.4} />
        </mesh>
        {/* lower lip */}
        <mesh ref={lowerLipRef} position={[0, -0.42, 0.55]}>
          <boxGeometry args={[0.3, 0.05, 0.06]} />
          <meshStandardMaterial color="#C4685E" roughness={0.5} />
        </mesh>
        {/* smile (idle happy) */}
        <mesh ref={smileRef} position={[0, -0.3, 0.55]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.16, 0.028, 12, 24, Math.PI * 0.9]} />
          <meshStandardMaterial color="#B4453B" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

export function Avatar3D({
  def, speaking, mood = 'neutral', size = 220,
}: {
  def: AvatarDef;
  speaking: boolean;
  mood?: AvatarMood;
  size?: number;
}) {
  const t = useTheme();
  const anim = useRef<AnimState>({ speaking, mood });
  useEffect(() => { anim.current = { speaking, mood }; }, [speaking, mood]);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: def.color,
        backgroundColor: t.colors.surfaceAlt,
      }}
      >
        <Canvas
          camera={{ position: [0, 0, 3.1], fov: 42 }}
          gl={{ antialias: true }}
          style={{ width: size, height: size }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[2, 3, 4]} intensity={1.1} />
          <directionalLight position={[-3, -1, 2]} intensity={0.3} color={def.color} />
          <Head def={def} anim={anim} />
        </Canvas>
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
    </View>
  );
}
