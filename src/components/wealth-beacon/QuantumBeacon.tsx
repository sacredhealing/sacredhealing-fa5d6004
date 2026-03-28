/**
 * QuantumBeacon — SQI 2050
 * Transparent WebGL (alpha) over page #050505.
 * Scene is intentionally “alive”: pulsing core, orbital rings, sparkles,
 * gentle camera sway — so the beacon reads as active, not inert floaters.
 */
import { useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, Stars, Text, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const BEACON_X = -2;

function CameraRig() {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    camera.position.x = BEACON_X + Math.sin(t * 0.14) * 1.1;
    camera.position.y = Math.sin(t * 0.19) * 0.45;
    camera.position.z = 7.2 + Math.cos(t * 0.11) * 0.55;
    camera.lookAt(BEACON_X, 0, 0);
  });
  return null;
}

function SriYantra() {
  const groupRef = useRef<THREE.Group>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);
  const ringMeshes = useRef<THREE.Mesh[]>([]);
  const octaPurpleRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.35;
      groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.08;
      groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.12;
    }
    if (octaPurpleRef.current) {
      octaPurpleRef.current.rotation.y = t * 0.4;
    }
    if (coreMat.current) {
      coreMat.current.emissiveIntensity = 1.4 + Math.sin(t * 2.2) * 0.9;
    }
    ringMeshes.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.rotation.z = t * (0.25 + i * 0.12);
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (m?.opacity !== undefined) {
        m.opacity = 0.22 + Math.sin(t * 1.8 + i) * 0.12;
      }
    });
  });

  return (
    <group ref={groupRef}>
      <pointLight position={[0, 0, 0.5]} intensity={2.5} color="#D4AF37" distance={4} decay={2} />

      <Sphere args={[0.12, 32, 32]}>
        <meshStandardMaterial
          ref={coreMat}
          color="#D4AF37"
          emissive="#FFD700"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </Sphere>

      <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#D4AF37"
          wireframe
          transparent
          opacity={0.65}
          emissive="#D4AF37"
          emissiveIntensity={0.65}
        />
      </mesh>

      <mesh ref={octaPurpleRef} rotation={[-Math.PI / 4, 0, -Math.PI / 4]}>
        <octahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial
          color="#9D50BB"
          wireframe
          transparent
          opacity={0.45}
          emissive="#9D50BB"
          emissiveIntensity={0.75}
        />
      </mesh>

      {[1.35, 1.65, 1.95].map((radius, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) ringMeshes.current[i] = el;
          }}
          rotation={[Math.PI / 2, 0, i * 0.4]}
        >
          <ringGeometry args={[radius, radius + 0.035, 96]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#D4AF37" : "#9D50BB"}
            transparent
            opacity={0.32}
            emissive={i % 2 === 0 ? "#D4AF37" : "#9D50BB"}
            emissiveIntensity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function FlowerOfLife() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.06;
  });
  return (
    <group ref={ref}>
      <Sphere args={[4, 64, 64]}>
        <meshStandardMaterial color="#D4AF37" wireframe transparent opacity={0.06} />
      </Sphere>
    </group>
  );
}

const CODE_INDEXES = [0, 1, 2, 3];

function LightCodes() {
  const { t } = useTranslation();
  const codes = useMemo(
    () => CODE_INDEXES.map((idx) => t(`wealthBeacon.quantumCodes.${idx}`)),
    [t]
  );
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = clock.getElapsedTime() * 0.08;
    }
  });
  return (
    <group ref={groupRef}>
      {codes.map((code, i) => {
        const a = (i / codes.length) * Math.PI * 2;
        return (
          <Float key={`${code}-${i}`} speed={3.5} rotationIntensity={0.85} floatIntensity={1.4}>
            <Text
              position={[Math.cos(a) * 2.85, Math.sin(a) * 2.85, 0.15]}
              fontSize={0.38}
              color="#D4AF37"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#1a0a00"
            >
              {code}
            </Text>
          </Float>
        );
      })}
    </group>
  );
}

export function QuantumBeacon() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 h-full w-full">
      <Canvas
        camera={{ position: [-2, 0, 8], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <CameraRig />
        <ambientLight intensity={0.45} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#D4AF37" />
        <pointLight position={[-10, -6, -8]} intensity={1.2} color="#9D50BB" />
        <pointLight position={[0, 8, 4]} intensity={0.6} color="#22D3EE" />

        <group position={[BEACON_X, 0, 0]}>
          <SriYantra />
          <FlowerOfLife />
          <LightCodes />
          <Sparkles
            count={120}
            scale={[7, 7, 4]}
            size={2.5}
            speed={0.65}
            opacity={0.55}
            color="#D4AF37"
          />
          <Sparkles
            count={80}
            scale={[5, 5, 3]}
            size={2}
            speed={0.4}
            opacity={0.35}
            color="#9D50BB"
          />
        </group>

        <Stars radius={120} depth={60} count={4500} factor={3.5} saturation={0.15} fade speed={1.8} />
        <fog attach="fog" args={["#050505", 6, 22]} />
      </Canvas>
    </div>
  );
}
