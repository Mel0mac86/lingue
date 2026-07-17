import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AvatarDef, AvatarSpecies } from '../types';
import { useTheme } from '../theme';
import { RealisticHead } from './RealisticHead';
import { PhotoAvatar, type PhotoAvatarConfig } from './PhotoAvatar';

export type AvatarMood = 'neutral' | 'happy' | 'thinking' | 'encouraging';

interface AnimState {
  speaking: boolean;
  mood: AvatarMood;
}

// ─── Shared head rig ─────────────────────────────────────────────────────────
// One animation rig drives every head (human or animal): breathing, gaze
// drift, real eyelid blinks, an articulated jaw for lip sync and mood-driven
// eyebrows. Components attach the refs to their own geometry.

interface Rig {
  group: React.RefObject<THREE.Group | null>;
  head: React.RefObject<THREE.Group | null>;
  jaw: React.RefObject<THREE.Group | null>;
  lidL: React.RefObject<THREE.Mesh | null>;
  lidR: React.RefObject<THREE.Mesh | null>;
  pupils: React.RefObject<THREE.Group | null>;
  browL: React.RefObject<THREE.Mesh | null>;
  browR: React.RefObject<THREE.Mesh | null>;
  smile: React.RefObject<THREE.Mesh | null>;
}

const LID_OPEN = -1.5;
const LID_CLOSED = -0.12;

function useHeadRig(anim: React.MutableRefObject<AnimState>, bouncy = false): Rig {
  const rig: Rig = {
    group: useRef<THREE.Group>(null),
    head: useRef<THREE.Group>(null),
    jaw: useRef<THREE.Group>(null),
    lidL: useRef<THREE.Mesh>(null),
    lidR: useRef<THREE.Mesh>(null),
    pupils: useRef<THREE.Group>(null),
    browL: useRef<THREE.Mesh>(null),
    browR: useRef<THREE.Mesh>(null),
    smile: useRef<THREE.Mesh>(null),
  };
  const nextBlink = useRef(1.5 + Math.random() * 3);
  const blinkPhase = useRef(0);
  const jawTarget = useRef(0);
  const jawValue = useRef(0);
  const nextJawChange = useRef(0);
  const gazeSeed = useRef(Math.random() * 100);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime + gazeSeed.current;
    const { speaking, mood } = anim.current;

    if (rig.group.current) {
      rig.group.current.position.y = Math.sin(t * 1.3) * 0.04 - 0.12;
      // Animals do a playful little bounce while they talk.
      const squash = bouncy && speaking ? 1 + Math.sin(t * 11) * 0.018 : 1;
      rig.group.current.scale.y = squash;
    }
    if (rig.head.current) {
      rig.head.current.rotation.y = Math.sin(t * 0.4) * 0.17 + (speaking ? Math.sin(t * 2.1) * 0.03 : 0);
      rig.head.current.rotation.x = Math.sin(t * 0.65) * 0.05
        + (speaking ? Math.sin(t * 3.2) * 0.04 : 0)
        + (mood === 'thinking' ? 0.09 : 0);
      rig.head.current.rotation.z = mood === 'thinking' ? 0.09 : Math.sin(t * 0.28) * 0.02;
    }

    // Blink with real eyelids.
    nextBlink.current -= delta;
    if (nextBlink.current <= 0) {
      blinkPhase.current = 1;
      nextBlink.current = 1.8 + Math.random() * 3.4;
    }
    if (blinkPhase.current > 0) blinkPhase.current = Math.max(0, blinkPhase.current - delta * 8);
    const closed = Math.sin(blinkPhase.current * Math.PI); // 0→1→0
    const lidRot = LID_OPEN + (LID_CLOSED - LID_OPEN) * closed;
    if (rig.lidL.current) rig.lidL.current.rotation.x = lidRot;
    if (rig.lidR.current) rig.lidR.current.rotation.x = lidRot;

    // Gaze micro-movement.
    if (rig.pupils.current) {
      rig.pupils.current.position.x = Math.sin(t * 0.7) * 0.018;
      rig.pupils.current.position.y = Math.sin(t * 0.53 + 1.7) * 0.012;
    }

    // Eyebrows by mood.
    const browLift = mood === 'happy' || mood === 'encouraging' ? 0.045 : mood === 'thinking' ? -0.02 : 0;
    if (rig.browL.current) rig.browL.current.position.y = rig.browL.current.userData.baseY + browLift;
    if (rig.browR.current) rig.browR.current.position.y = rig.browR.current.userData.baseY + browLift;

    // Articulated jaw lip sync.
    nextJawChange.current -= delta;
    if (speaking && nextJawChange.current <= 0) {
      jawTarget.current = 0.08 + Math.random() * 0.3;
      nextJawChange.current = 0.06 + Math.random() * 0.11;
    }
    if (!speaking) jawTarget.current = 0;
    jawValue.current += (jawTarget.current - jawValue.current) * Math.min(1, delta * 20);
    if (rig.jaw.current) rig.jaw.current.rotation.x = jawValue.current;

    if (rig.smile.current) {
      rig.smile.current.visible = (mood === 'happy' || mood === 'encouraging') && jawValue.current < 0.05;
    }
  });

  return rig;
}

const irisColorFor = (id: string): string => {
  const palette = ['#33475F', '#3B2A1E', '#26221E', '#2E4632', '#4A3220', '#333C4A'];
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return palette[h % palette.length];
};

/** Eye with white, iris, pupil, highlight and a skin/fur eyelid on the rig. */
function Eye({
  x, y, z, rig, side, lidColor, irisColor, size = 1, lashes = false,
}: {
  x: number; y: number; z: number; rig: Rig; side: 'L' | 'R';
  lidColor: string; irisColor: string; size?: number; lashes?: boolean;
}) {
  const r = 0.088 * size;
  return (
    <group position={[x, y, z]}>
      {/* Toy-style eye: big glossy dark iris with double light catch. */}
      <mesh>
        <sphereGeometry args={[r, 24, 24]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.12} />
      </mesh>
      <group>
        <mesh position={[0, 0, r * 0.34]}>
          <sphereGeometry args={[r * 0.8, 24, 24]} />
          <meshStandardMaterial color={irisColor} roughness={0.08} />
        </mesh>
        <mesh position={[r * 0.3, r * 0.32, r * 0.98]}>
          <sphereGeometry args={[r * 0.22, 10, 10]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[-r * 0.22, -r * 0.26, r * 1.02]}>
          <sphereGeometry args={[r * 0.09, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
      {/* upper eyelid: rotates down over the eye to blink */}
      <mesh ref={side === 'L' ? rig.lidL : rig.lidR} rotation={[LID_OPEN, 0, 0]}>
        <sphereGeometry args={[r * 1.12, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial color={lidColor} roughness={0.55} />
      </mesh>
      {/* upper lash line */}
      {lashes && (
        <mesh position={[0, 0.012, r * 0.68]} rotation={[0.35, 0, 0]} scale={[1.02, 0.85, 0.55]}>
          <torusGeometry args={[r * 0.92, 0.011, 6, 20, Math.PI]} />
          <meshStandardMaterial color="#241610" roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}

// ─── Realistic-styled human head ─────────────────────────────────────────────

function HumanHead({ def, anim }: { def: AvatarDef; anim: React.MutableRefObject<AnimState> }) {
  const rig = useHeadRig(anim);
  const skin = def.skin;
  const hair = def.hair;
  const iris = irisColorFor(def.id);
  const isFemale = def.gender === 'female';
  const older = def.ageLook >= 45;
  const bearded = def.gender === 'male' && (older || def.id === 'jack');

  return (
    <group ref={rig.group}>
      {/* bust */}
      <mesh position={[0, -1.32, 0]}>
        <cylinderGeometry args={[0.5, 0.92, 0.95, 32]} />
        <meshStandardMaterial color={def.color} roughness={0.75} />
      </mesh>
      <mesh position={[0, -0.92, 0.02]} rotation={[0.25, 0, 0]}>
        <torusGeometry args={[0.24, 0.055, 12, 28, Math.PI]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
      </mesh>
      {/* neck */}
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[0.145, 0.175, 0.4, 24]} />
        <meshStandardMaterial color={skin} roughness={0.5} />
      </mesh>

      <group ref={rig.head}>
        {/* skull: oval, slightly narrower jawline */}
        <mesh scale={[0.88, 1.06, 0.92]}>
          <sphereGeometry args={[0.6, 48, 48]} />
          <meshStandardMaterial color={skin} roughness={0.45} />
        </mesh>
        {/* cheek/jaw volume */}
        <mesh position={[0, -0.26, 0.05]} scale={[0.78, 0.62, 0.78]}>
          <sphereGeometry args={[0.52, 32, 32]} />
          <meshStandardMaterial color={skin} roughness={0.45} />
        </mesh>
        {/* ears */}
        <mesh position={[-0.52, -0.02, 0.02]} scale={[0.45, 1, 0.7]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.5} />
        </mesh>
        <mesh position={[0.52, -0.02, 0.02]} scale={[0.45, 1, 0.7]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.5} />
        </mesh>

        {/* hair */}
        {isFemale ? (
          <>
            <mesh position={[0, 0.2, -0.05]} scale={[0.95, 0.85, 0.98]}>
              <sphereGeometry args={[0.62, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial color={hair} roughness={0.8} />
            </mesh>
            <mesh position={[-0.42, -0.28, -0.1]} rotation={[0, 0, 0.12]}>
              <capsuleGeometry args={[0.15, 0.75, 8, 16]} />
              <meshStandardMaterial color={hair} roughness={0.8} />
            </mesh>
            <mesh position={[0.42, -0.28, -0.1]} rotation={[0, 0, -0.12]}>
              <capsuleGeometry args={[0.15, 0.75, 8, 16]} />
              <meshStandardMaterial color={hair} roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.1, -0.42]} scale={[0.8, 1.1, 0.5]}>
              <sphereGeometry args={[0.5, 24, 24]} />
              <meshStandardMaterial color={hair} roughness={0.8} />
            </mesh>
            {/* side-swept fringe */}
            <mesh position={[-0.12, 0.4, 0.42]} rotation={[0.5, 0, 0.35]} scale={[1.6, 0.5, 0.6]}>
              <sphereGeometry args={[0.22, 20, 20]} />
              <meshStandardMaterial color={hair} roughness={0.8} />
            </mesh>
          </>
        ) : (
          <>
            <mesh position={[0, older ? 0.3 : 0.22, -0.06]} scale={[0.92, older ? 0.6 : 0.78, 0.95]}>
              <sphereGeometry args={[0.62, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color={hair} roughness={0.85} />
            </mesh>
            {!older && (
              <mesh position={[0, 0.34, 0.4]} rotation={[0.9, 0, 0]} scale={[1.5, 0.4, 0.7]}>
                <sphereGeometry args={[0.2, 20, 20]} />
                <meshStandardMaterial color={hair} roughness={0.85} />
              </mesh>
            )}
          </>
        )}

        {/* eyebrows */}
        <mesh ref={rig.browL} position={[-0.2, 0.27, 0.46]} rotation={[0.15, 0, 0.1]} scale={[1, 0.52, 0.45]} userData={{ baseY: 0.27 }}>
          <capsuleGeometry args={[0.035, 0.13, 6, 10]} />
          <meshStandardMaterial color={hair} roughness={0.8} />
        </mesh>
        <mesh ref={rig.browR} position={[0.2, 0.27, 0.46]} rotation={[0.15, 0, -0.1]} scale={[1, 0.52, 0.45]} userData={{ baseY: 0.27 }}>
          <capsuleGeometry args={[0.035, 0.13, 6, 10]} />
          <meshStandardMaterial color={hair} roughness={0.8} />
        </mesh>

        {/* eyes + roaming pupils */}
        <group ref={rig.pupils}>
          <Eye x={-0.2} y={0.12} z={0.5} rig={rig} side="L" lidColor={skin} irisColor={iris} lashes={isFemale} size={1.22} />
          <Eye x={0.2} y={0.12} z={0.5} rig={rig} side="R" lidColor={skin} irisColor={iris} lashes={isFemale} size={1.22} />
        </group>

        {/* cheeks blush */}
        <mesh position={[-0.3, -0.12, 0.4]} scale={[1, 0.7, 0.4]}>
          <sphereGeometry args={[0.105, 14, 14]} />
          <meshStandardMaterial color="#F0938A" transparent opacity={isFemale ? 0.5 : 0.32} roughness={1} />
        </mesh>
        <mesh position={[0.3, -0.12, 0.4]} scale={[1, 0.7, 0.4]}>
          <sphereGeometry args={[0.105, 14, 14]} />
          <meshStandardMaterial color="#F0938A" transparent opacity={isFemale ? 0.5 : 0.32} roughness={1} />
        </mesh>

        {/* nose */}
        <mesh position={[0, -0.05, 0.55]} scale={[0.55, 0.95, 0.7]}>
          <sphereGeometry args={[0.09, 18, 18]} />
          <meshStandardMaterial color={skin} roughness={0.42} />
        </mesh>
        <mesh position={[0, -0.11, 0.56]} scale={[1.25, 0.5, 0.7]}>
          <sphereGeometry args={[0.055, 14, 14]} />
          <meshStandardMaterial color={skin} roughness={0.42} />
        </mesh>
        {/* nostrils */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.033 * s, -0.135, 0.585]} scale={[1, 0.7, 0.6]}>
            <sphereGeometry args={[0.013, 8, 8]} />
            <meshStandardMaterial color="#6E4634" roughness={0.8} />
          </mesh>
        ))}

        {/* mouth cavity, tucked inside the head: visible only when the jaw opens */}
        <mesh position={[0, -0.32, 0.33]} scale={[1, 0.65, 0.6]}>
          <sphereGeometry args={[0.105, 18, 18]} />
          <meshStandardMaterial color="#4A1712" roughness={0.6} />
        </mesh>
        {/* upper lip: thin horizontal capsule */}
        <mesh position={[0, -0.262, 0.465]} rotation={[0, 0, Math.PI / 2]} scale={[0.4, 0.95, 0.45]}>
          <capsuleGeometry args={[0.05, 0.15, 8, 14]} />
          <meshStandardMaterial color={isFemale ? '#B4433C' : '#A06355'} roughness={0.55} />
        </mesh>
        {/* idle smile: soft arc under the lips */}
        <mesh ref={rig.smile} position={[0, -0.265, 0.46]} rotation={[0.12, 0, Math.PI]} scale={[0.95, 0.6, 0.4]}>
          <torusGeometry args={[0.105, 0.02, 8, 22, Math.PI * 0.9]} />
          <meshStandardMaterial color={isFemale ? '#B4433C' : '#A06355'} roughness={0.55} />
        </mesh>
        {/* mustache (bearded men) */}
        {bearded && (
          <mesh position={[0, -0.235, 0.5]} rotation={[0, 0, Math.PI / 2]} scale={[0.5, 1.05, 0.5]}>
            <capsuleGeometry args={[0.05, 0.17, 8, 14]} />
            <meshStandardMaterial color={hair} roughness={0.85} />
          </mesh>
        )}
        {/* articulated jaw: chin + lower lip */}
        <group ref={rig.jaw} position={[0, -0.2, 0.05]}>
          <mesh position={[0, -0.18, 0.24]} scale={[0.66, 0.45, 0.52]}>
            <sphereGeometry args={[0.35, 24, 24]} />
            <meshStandardMaterial color={skin} roughness={0.45} />
          </mesh>
          {bearded && (
            <>
              <mesh position={[0, -0.26, 0.22]} scale={[0.72, 0.5, 0.55]}>
                <sphereGeometry args={[0.38, 24, 24]} />
                <meshStandardMaterial color={hair} roughness={0.9} />
              </mesh>
              {[-1, 1].map((sgn) => (
                <mesh key={`beard${sgn}`} position={[0.28 * sgn, -0.17, 0.28]} scale={[0.45, 0.7, 0.45]}>
                  <sphereGeometry args={[0.22, 18, 18]} />
                  <meshStandardMaterial color={hair} roughness={0.9} />
                </mesh>
              ))}
            </>
          )}
          <mesh position={[0, -0.115, 0.4]} rotation={[0, 0, Math.PI / 2]} scale={[0.34, 0.8, 0.4]}>
            <capsuleGeometry args={[0.05, 0.14, 8, 14]} />
            <meshStandardMaterial color={isFemale ? '#B4433C' : '#A06355'} roughness={0.55} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ─── Animal heads (kids path) ────────────────────────────────────────────────

interface AnimalCfg {
  ear: 'pointy' | 'round' | 'floppy' | 'long' | 'none';
  eyePatch?: string;
  mane?: boolean;
  beak?: boolean;
  whiskers?: boolean;
  earInner?: string;
  headScale: [number, number, number];
}

const ANIMAL_CFG: Record<Exclude<AvatarSpecies, 'human'>, AnimalCfg> = {
  fox: { ear: 'pointy', whiskers: true, earInner: '#F6BCC9', headScale: [1, 0.95, 0.95] },
  bear: { ear: 'round', headScale: [1.02, 1, 0.98] },
  cat: { ear: 'pointy', whiskers: true, earInner: '#F6BCC9', headScale: [1, 0.92, 0.95] },
  dog: { ear: 'floppy', headScale: [1, 0.98, 0.98] },
  rabbit: { ear: 'long', whiskers: true, earInner: '#F6C9D8', headScale: [0.95, 1, 0.95] },
  panda: { ear: 'round', eyePatch: '#2B2B2B', headScale: [1.02, 0.98, 0.98] },
  lion: { ear: 'round', mane: true, headScale: [1, 0.98, 0.98] },
  penguin: { ear: 'none', beak: true, headScale: [0.96, 1.02, 0.96] },
};

function AnimalHead({ def, anim }: { def: AvatarDef; anim: React.MutableRefObject<AnimState> }) {
  const rig = useHeadRig(anim, true);
  const cfg = ANIMAL_CFG[def.species as Exclude<AvatarSpecies, 'human'>];
  const fur = def.hair;
  const muzzle = def.skin;
  const R = 0.62;

  const whisker = (x: number, y: number, rot: number, key: string) => (
    <mesh key={key} position={[x, y, 0.5]} rotation={[0, 0, rot]}>
      <cylinderGeometry args={[0.006, 0.006, 0.34, 6]} />
      <meshStandardMaterial color="#EDEDED" roughness={0.8} />
    </mesh>
  );

  return (
    <group ref={rig.group}>
      {/* round body */}
      <mesh position={[0, -1.28, 0]} scale={[1, 1.15, 0.95]}>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial color={def.species === 'penguin' ? fur : def.color} roughness={0.8} />
      </mesh>
      {/* belly */}
      <mesh position={[0, -1.22, 0.4]} scale={[0.75, 0.95, 0.5]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color={muzzle} roughness={0.85} />
      </mesh>

      <group ref={rig.head}>
        {/* head */}
        <mesh scale={cfg.headScale}>
          <sphereGeometry args={[R, 48, 48]} />
          <meshStandardMaterial color={fur} roughness={0.8} />
        </mesh>

        {/* ears */}
        {cfg.ear === 'pointy' && (
          <>
            {[-1, 1].map((s) => (
              <group key={s} position={[0.36 * s, 0.55, -0.05]} rotation={[0, 0, -0.3 * s]}>
                <mesh>
                  <coneGeometry args={[0.17, 0.4, 4]} />
                  <meshStandardMaterial color={fur} roughness={0.8} />
                </mesh>
                <mesh position={[0, -0.04, 0.06]}>
                  <coneGeometry args={[0.1, 0.26, 4]} />
                  <meshStandardMaterial color={cfg.earInner ?? muzzle} roughness={0.9} />
                </mesh>
              </group>
            ))}
          </>
        )}
        {cfg.ear === 'round' && [-1, 1].map((s) => (
          <mesh key={s} position={[0.42 * s, 0.5, -0.05]}>
            <sphereGeometry args={[0.19, 20, 20]} />
            <meshStandardMaterial color={cfg.eyePatch ?? fur} roughness={0.85} />
          </mesh>
        ))}
        {cfg.ear === 'floppy' && [-1, 1].map((s) => (
          <mesh key={s} position={[0.5 * s, 0.25, -0.02]} rotation={[0, 0, 0.9 * s]}>
            <capsuleGeometry args={[0.13, 0.4, 8, 14]} />
            <meshStandardMaterial color={fur} roughness={0.85} />
          </mesh>
        ))}
        {cfg.ear === 'long' && [-1, 1].map((s) => (
          <group key={s} position={[0.24 * s, 0.72, -0.05]} rotation={[0, 0, -0.12 * s]}>
            <mesh>
              <capsuleGeometry args={[0.11, 0.55, 8, 14]} />
              <meshStandardMaterial color={fur} roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.02, 0.07]} scale={[0.55, 0.8, 0.5]}>
              <capsuleGeometry args={[0.09, 0.42, 8, 12]} />
              <meshStandardMaterial color={cfg.earInner ?? muzzle} roughness={0.9} />
            </mesh>
          </group>
        ))}

        {/* lion mane */}
        {cfg.mane && (
          <mesh position={[0, 0, -0.12]} scale={[1.25, 1.25, 0.7]}>
            <sphereGeometry args={[R, 32, 32]} />
            <meshStandardMaterial color="#8C4A12" roughness={0.9} />
          </mesh>
        )}

        {/* panda eye patches */}
        {cfg.eyePatch && [-1, 1].map((s) => (
          <mesh key={s} position={[0.22 * s, 0.14, 0.44]} rotation={[0, 0, 0.5 * s]} scale={[0.8, 1.1, 0.5]}>
            <sphereGeometry args={[0.14, 18, 18]} />
            <meshStandardMaterial color={cfg.eyePatch} roughness={0.85} />
          </mesh>
        ))}

        {/* penguin face patch */}
        {def.species === 'penguin' && (
          <mesh position={[0, 0.02, 0.3]} scale={[0.82, 0.85, 0.55]}>
            <sphereGeometry args={[R * 0.82, 32, 32]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
          </mesh>
        )}

        {/* big cute eyes */}
        <group ref={rig.pupils}>
          <Eye x={-0.21} y={0.15} z={0.52} rig={rig} side="L" lidColor={cfg.eyePatch ?? fur} irisColor="#2E1D12" size={1.5} lashes={def.gender === 'female'} />
          <Eye x={0.21} y={0.15} z={0.52} rig={rig} side="R" lidColor={cfg.eyePatch ?? fur} irisColor="#2E1D12" size={1.5} lashes={def.gender === 'female'} />
        </group>

        {/* brows (subtle fur tufts) */}
        <mesh ref={rig.browL} position={[-0.21, 0.34, 0.48]} rotation={[0.1, 0, 0.12]} scale={[1, 0.3, 0.3]} userData={{ baseY: 0.34 }}>
          <capsuleGeometry args={[0.03, 0.1, 6, 8]} />
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>
        <mesh ref={rig.browR} position={[0.21, 0.34, 0.48]} rotation={[0.1, 0, -0.12]} scale={[1, 0.3, 0.3]} userData={{ baseY: 0.34 }}>
          <capsuleGeometry args={[0.03, 0.1, 6, 8]} />
          <meshStandardMaterial color={fur} roughness={0.9} />
        </mesh>

        {/* muzzle + nose / beak */}
        {cfg.beak ? (
          <group ref={rig.jaw} position={[0, -0.12, 0.2]}>
            <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.12, 0.3, 18]} />
              <meshStandardMaterial color="#F59E0B" roughness={0.5} />
            </mesh>
          </group>
        ) : (
          <>
            <mesh position={[0, -0.18, 0.44]} scale={[1, 0.78, 0.62]}>
              <sphereGeometry args={[0.24, 24, 24]} />
              <meshStandardMaterial color={muzzle} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.08, 0.62]} scale={[1.2, 0.85, 0.8]}>
              <sphereGeometry args={[0.047, 14, 14]} />
              <meshStandardMaterial color="#3B2B22" roughness={0.4} />
            </mesh>
            {/* mouth cavity + idle smile */}
            <mesh position={[0, -0.28, 0.48]} scale={[1, 0.6, 0.5]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial color="#5E1F19" roughness={0.6} />
            </mesh>
            <mesh ref={rig.smile} position={[0, -0.24, 0.55]} rotation={[-0.15, 0, Math.PI]} scale={[1, 0.8, 0.5]}>
              <torusGeometry args={[0.09, 0.02, 8, 20, Math.PI * 0.9]} />
              <meshStandardMaterial color="#3B2B22" roughness={0.6} />
            </mesh>
            {/* jaw: lower muzzle for lip sync */}
            <group ref={rig.jaw} position={[0, -0.22, 0.1]}>
              <mesh position={[0, -0.08, 0.34]} scale={[0.8, 0.45, 0.55]}>
                <sphereGeometry args={[0.2, 20, 20]} />
                <meshStandardMaterial color={muzzle} roughness={0.85} />
              </mesh>
            </group>
          </>
        )}

        {/* toy blush */}
        {[-1, 1].map((sgn) => (
          <mesh key={`blush${sgn}`} position={[0.33 * sgn, -0.05, 0.5]} scale={[1, 0.72, 0.35]}>
            <sphereGeometry args={[0.085, 14, 14]} />
            <meshStandardMaterial color="#F58EA0" transparent opacity={0.55} roughness={1} />
          </mesh>
        ))}

        {/* whiskers */}
        {cfg.whiskers && (
          <>
            {whisker(-0.4, -0.16, 1.35, 'w1')}
            {whisker(-0.4, -0.22, 1.6, 'w2')}
            {whisker(0.4, -0.16, -1.35, 'w3')}
            {whisker(0.4, -0.22, -1.6, 'w4')}
          </>
        )}
      </group>
    </group>
  );
}

// ─── Scenario backdrops ──────────────────────────────────────────────────────

export type BackdropKind =
  | 'travel' | 'work' | 'school' | 'daily' | 'social' | 'culture' | 'plain';

/**
 * Themed 3D environment behind the avatar, so an airport chat happens under
 * a blue sky with drifting clouds, a lesson in front of a chalkboard, an
 * office meeting against a window wall, and so on.
 */
function Backdrop({ kind }: { kind: BackdropKind }) {
  const drift = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (drift.current) {
      drift.current.position.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.5;
    }
  });

  const wall = (color: string) => (
    <mesh position={[0, 0, -3.2]}>
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
  const cloud = (x: number, y: number, s: number, key: string) => (
    <group key={key} position={[x, y, -2.6]} scale={s}>
      {[[-0.3, 0, 0.26], [0, 0.12, 0.34], [0.32, 0, 0.28], [0.05, -0.08, 0.3]].map(([cx, cy, r], i) => (
        <mesh key={i} position={[cx, cy, 0]}>
          <sphereGeometry args={[r, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={1} />
        </mesh>
      ))}
    </group>
  );

  switch (kind) {
    case 'travel':
      return (
        <group>
          {wall('#8EC9F2')}
          <mesh position={[1.9, 1.6, -3.1]}>
            <circleGeometry args={[0.55, 24]} />
            <meshBasicMaterial color="#FFE9A8" />
          </mesh>
          <group ref={drift}>
            {cloud(-1.6, 1.3, 1.1, 'c1')}
            {cloud(1.2, 0.6, 0.8, 'c2')}
            {cloud(-0.4, 2, 0.7, 'c3')}
          </group>
        </group>
      );
    case 'work':
      return (
        <group>
          {wall('#3D4E63')}
          {[[-1.5, 0.9], [0, 0.9], [1.5, 0.9]].map(([x, y], i) => (
            <mesh key={i} position={[x, y, -3.1]}>
              <planeGeometry args={[1.05, 1.5]} />
              <meshStandardMaterial color="#9FC4E8" roughness={0.6} />
            </mesh>
          ))}
        </group>
      );
    case 'school':
      return (
        <group>
          {wall('#D9C6A5')}
          <mesh position={[0, 0.7, -3.1]}>
            <planeGeometry args={[4.4, 2.4]} />
            <meshStandardMaterial color="#2F6B4F" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.7, -3.12]}>
            <planeGeometry args={[4.7, 2.7]} />
            <meshStandardMaterial color="#8A5A2B" roughness={0.9} />
          </mesh>
          {[[-1.4, 1.35, 1.3], [-0.2, 1.05, 0.9], [-1.1, 0.75, 1.6], [0.6, 0.35, 1.1]].map(([x, y, w], i) => (
            <mesh key={i} position={[x, y, -3.05]}>
              <planeGeometry args={[w, 0.06]} />
              <meshBasicMaterial color="#F3F1E7" />
            </mesh>
          ))}
        </group>
      );
    case 'daily':
      return (
        <group>
          {wall('#EAD9C2')}
          <mesh position={[-1.6, 0.9, -3.12]}>
            <planeGeometry args={[1.3, 1]} />
            <meshStandardMaterial color="#8A5A2B" roughness={0.9} />
          </mesh>
          <mesh position={[-1.6, 0.9, -3.08]}>
            <planeGeometry args={[1.1, 0.8]} />
            <meshStandardMaterial color="#A8D8B9" roughness={0.8} />
          </mesh>
          <mesh position={[1.7, 0.4, -3.05]}>
            <planeGeometry args={[0.9, 2.2]} />
            <meshStandardMaterial color="#C9A56A" roughness={0.9} />
          </mesh>
        </group>
      );
    case 'social':
      return (
        <group>
          {wall('#3B2E5A')}
          <group ref={drift}>
            {['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#CE82FF', '#FF9600'].map((c, i) => (
              <mesh key={c} position={[-2 + i * 0.8, 0.4 + Math.sin(i * 2.1) * 1.1, -2.7]}>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial color={c} roughness={0.4} />
              </mesh>
            ))}
          </group>
        </group>
      );
    case 'culture':
      return (
        <group>
          {wall('#141C33')}
          {Array.from({ length: 18 }, (_, i) => (
            <mesh
              key={i}
              position={[((i * 37) % 100) / 12 - 4, ((i * 53) % 80) / 12 - 1.4, -3.1]}
            >
              <sphereGeometry args={[0.035 + (i % 3) * 0.015, 8, 8]} />
              <meshBasicMaterial color="#FFF7CF" />
            </mesh>
          ))}
        </group>
      );
    default:
      return wall('#DCE8F5');
  }
}

/** Falls back to the procedural head if the GLB fails to load. */
class ModelBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// ─── Public component ────────────────────────────────────────────────────────

/**
 * 3D talking avatar (Three.js via react-three-fiber): realistic-styled human
 * heads, or animal buddies for the kids path. Works on iOS/Android (expo-gl)
 * and on web (WebGL) — Metro picks the right fiber entry automatically.
 *
 * Two presentations:
 *  - 'bubble' (default): the classic circular avatar with the name below;
 *  - 'stage': a full-width video-call view — the face fills the frame and a
 *    call-style name tag sits in the corner, for a "real person" feeling.
 */
export function Avatar3D({
  def, speaking, mood = 'neutral', size = 220, modelUrl, variant = 'bubble', height, backdrop, photo,
}: {
  def: AvatarDef;
  speaking: boolean;
  mood?: AvatarMood;
  size?: number;
  /** Optional photorealistic GLB (Ready Player Me / ARKit blendshapes). */
  modelUrl?: string;
  variant?: 'bubble' | 'stage';
  /** Stage height (stage variant only). */
  height?: number;
  /** Themed 3D environment behind the avatar (stage variant only). */
  backdrop?: BackdropKind;
  /** "Talking photo" override: animate this user image instead of 3D. */
  photo?: PhotoAvatarConfig | null;
}) {
  const t = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const anim = useRef<AnimState>({ speaking, mood });
  useEffect(() => { anim.current = { speaking, mood }; }, [speaking, mood]);
  const isHuman = def.species === 'human';
  // GLB loading relies on web APIs (fetch/Image): native uses the procedural head.
  const useRealistic = isHuman && !!modelUrl && Platform.OS === 'web';
  const isStage = variant === 'stage';

  const scene = (
    <Canvas
      // Stage: the camera sits much closer, like a video call. Procedural
      // heads are bigger than the GLB scan, so they get a bit more distance.
      camera={isStage
        ? (useRealistic
          ? { position: [0, 0.06, 1.85], fov: 34 }
          : { position: [0, 0.02, 2.6], fov: 36 })
        : { position: [0, 0.02, 3.05], fov: 40 }}
      gl={{ antialias: true }}
      style={isStage ? { width: '100%', height: '100%' } : { width: size, height: size }}
    >
      <hemisphereLight args={['#FFFFFF', '#B8C4D6', 0.75]} />
      <directionalLight position={[2.2, 2.8, 3.6]} intensity={1.25} />
      <directionalLight position={[-2.6, 0.6, 2.2]} intensity={0.35} />
      <directionalLight position={[0, 1.5, -3]} intensity={0.5} color={def.color} />
      {isStage && <Backdrop kind={backdrop ?? 'plain'} />}
      {useRealistic ? (
        <ModelBoundary fallback={<HumanHead def={def} anim={anim} />}>
          <Suspense fallback={<HumanHead def={def} anim={anim} />}>
            <RealisticHead url={modelUrl!} anim={anim} />
          </Suspense>
        </ModelBoundary>
      ) : isHuman
        ? <HumanHead def={def} anim={anim} />
        : <AnimalHead def={def} anim={anim} />}
    </Canvas>
  );

  if (isStage) {
    return (
      <View style={{
        width: '100%',
        height: height ?? 340,
        backgroundColor: t.dark ? '#101826' : '#E8EFF8',
        overflow: 'hidden',
      }}
      >
        {photo
          ? <PhotoAvatar config={photo} speaking={speaking} width={windowWidth} height={height ?? 340} />
          : scene}
        {/* video-call style name tag */}
        <View style={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(10, 16, 28, 0.62)',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 7,
        }}
        >
          <View style={{
            width: 9, height: 9, borderRadius: 5, marginRight: 7,
            backgroundColor: speaking ? '#4ADE80' : 'rgba(255,255,255,0.45)',
          }}
          />
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14.5 * t.fontScale }}>
            {def.emoji} {def.name}{speaking ? ' · sta parlando…' : ''}
          </Text>
        </View>
      </View>
    );
  }

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
        {scene}
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
