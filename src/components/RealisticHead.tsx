import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/** Self-hosted Basis transcoder (copied from three into public/basis/). */
const BASIS_PATH = '/lingue/basis/';

export interface RealisticAnim {
  speaking: boolean;
  mood: 'neutral' | 'happy' | 'thinking' | 'encouraging';
}

/**
 * Photorealistic head: loads a GLB with ARKit-style facial blendshapes
 * (Ready Player Me avatars, the three.js "facecap" demo head, or any
 * compatible model) and drives it with the same behaviour as the procedural
 * heads — blinking, lip sync while speaking, mood smiles and gaze drift.
 *
 * The model is auto-framed on the face regardless of whether the GLB is a
 * full body (RPM) or a bare head. Web-only: native falls back to the
 * procedural renderer (see Avatar3D).
 */
export function RealisticHead({
  url, anim,
}: {
  url: string;
  anim: React.MutableRefObject<RealisticAnim>;
}) {
  const { gl } = useThree();
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    // Support compressed models (the demo head uses KTX2 textures + meshopt).
    const ktx2 = new KTX2Loader().setTranscoderPath(BASIS_PATH).detectSupport(gl);
    loader.setKTX2Loader(ktx2);
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  const group = useRef<THREE.Group>(null);

  const rigged = useMemo(() => {
    const scene = gltf.scene;
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    // Frame the head, whatever the model's units: a tall, narrow model is a
    // full body (head ≈ top ~14.5% of the height, e.g. Ready Player Me),
    // anything else is a head/bust scan.
    const isFullBody = size.y > 1.6 * Math.max(size.x, size.z);
    const headSize = isFullBody ? size.y * 0.145 : size.y;
    const scale = 1.15 / headSize;
    const headCenterY = isFullBody ? box.max.y - headSize / 2 : center.y;

    const morphMeshes: THREE.Mesh[] = [];
    let headBone: THREE.Object3D | null = null;
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        morphMeshes.push(mesh);
      }
      if (!headBone && (o as THREE.Bone).isBone && /head/i.test(o.name)) headBone = o;
      o.frustumCulled = false;
    });
    return { scene, scale, headCenterY, center, morphMeshes, headBone };
  }, [gltf]);

  // Animation state machine (mirrors the procedural rig).
  const nextBlink = useRef(1.5 + Math.random() * 3);
  const blinkPhase = useRef(0);
  const jawTarget = useRef(0);
  const jawValue = useRef(0);
  const nextJawChange = useRef(0);

  const setMorph = (names: string[], value: number) => {
    for (const mesh of rigged.morphMeshes) {
      for (const name of names) {
        const idx = mesh.morphTargetDictionary![name];
        if (idx !== undefined) mesh.morphTargetInfluences![idx] = value;
      }
    }
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const { speaking, mood } = anim.current;

    // Breathing float + gentle head motion.
    if (group.current) {
      group.current.position.y = -rigged.headCenterY * rigged.scale + 0.06
        + Math.sin(t * 1.3) * 0.03;
      const target: THREE.Object3D = rigged.headBone ?? group.current;
      target.rotation.y = Math.sin(t * 0.4) * 0.14 + (speaking ? Math.sin(t * 2.1) * 0.03 : 0);
      target.rotation.x = Math.sin(t * 0.65) * 0.04
        + (speaking ? Math.sin(t * 3.2) * 0.03 : 0)
        + (mood === 'thinking' ? 0.07 : 0);
      target.rotation.z = mood === 'thinking' ? 0.06 : 0;
    }

    // Blink.
    nextBlink.current -= delta;
    if (nextBlink.current <= 0) {
      blinkPhase.current = 1;
      nextBlink.current = 1.8 + Math.random() * 3.4;
    }
    if (blinkPhase.current > 0) blinkPhase.current = Math.max(0, blinkPhase.current - delta * 8);
    const blink = Math.sin(blinkPhase.current * Math.PI);
    setMorph(['eyeBlinkLeft', 'eyeBlink_L'], blink);
    setMorph(['eyeBlinkRight', 'eyeBlink_R'], blink);

    // Lip sync on the jaw/mouth blendshapes.
    nextJawChange.current -= delta;
    if (speaking && nextJawChange.current <= 0) {
      jawTarget.current = 0.15 + Math.random() * 0.55;
      nextJawChange.current = 0.06 + Math.random() * 0.11;
    }
    if (!speaking) jawTarget.current = 0;
    jawValue.current += (jawTarget.current - jawValue.current) * Math.min(1, delta * 20);
    setMorph(['jawOpen', 'mouthOpen', 'viseme_aa'], jawValue.current);
    setMorph(['mouthFunnel'], jawValue.current * 0.25);

    // Mood.
    const smiling = (mood === 'happy' || mood === 'encouraging') ? 0.45 : 0.12;
    setMorph(['mouthSmileLeft', 'mouthSmile_L'], smiling);
    setMorph(['mouthSmileRight', 'mouthSmile_R'], smiling);
    setMorph(['browInnerUp'], mood === 'thinking' ? 0.5 : mood === 'neutral' ? 0.1 : 0.25);
    setMorph(['eyeSquintLeft', 'eyeSquint_L'], smiling * 0.35);
    setMorph(['eyeSquintRight', 'eyeSquint_R'], smiling * 0.35);
  });

  return (
    <group
      ref={group}
      scale={rigged.scale}
      position={[
        -rigged.center.x * rigged.scale,
        -rigged.headCenterY * rigged.scale + 0.06,
        -rigged.center.z * rigged.scale,
      ]}
    >
      <primitive object={rigged.scene} />
    </group>
  );
}
