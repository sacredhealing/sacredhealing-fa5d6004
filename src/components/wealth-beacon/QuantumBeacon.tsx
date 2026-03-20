import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, Stars, Text } from "@react-three/drei";
import * as THREE from "three";

function SriYantra() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
      groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[0.05, 32, 32]}>
        <meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={2} />
      </Sphere>

      <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#D4AF37"
          wireframe
          transparent
          opacity={0.6}
          emissive="#D4AF37"
          emissiveIntensity={0.5}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 4, 0, -Math.PI / 4]}>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color="#9D50BB"
          wireframe
          transparent
          opacity={0.4}
          emissive="#9D50BB"
          emissiveIntensity={0.5}
        />
      </mesh>

      {[1.5, 1.8, 2.1].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.02, 64]} />
          <meshStandardMaterial color="#D4AF37" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function FlowerOfLife() {
  return (
    <group>
      <Sphere args={[4, 64, 64]}>
        <meshStandardMaterial color="#D4AF37" wireframe transparent opacity={0.05} />
      </Sphere>
    </group>
  );
}

const CODES = ["SHREEM", "BRZEE", "OM", "LAKSHMI"];

function LightCodes() {
  return (
    <group>
      {CODES.map((code, i) => (
        <Float key={code} speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <Text
            position={[
              Math.cos((i / CODES.length) * Math.PI * 2) * 3,
              Math.sin((i / CODES.length) * Math.PI * 2) * 3,
              0,
            ]}
            fontSize={0.4}
            color="#D4AF37"
            anchorX="center"
            anchorY="middle"
          >
            {code}
          </Text>
        </Float>
      ))}
    </group>
  );
}

export function QuantumBeacon() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 h-full w-full">
      <Canvas camera={{ position: [-2, 0, 8], fov: 45 }} gl={{ alpha: false }}>
        <color attach="background" args={["#050505"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#D4AF37" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#9D50BB" />

        <group position={[-2, 0, 0]}>
          <SriYantra />
          <FlowerOfLife />
          <LightCodes />
        </group>

        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <fog attach="fog" args={["#050505", 5, 15]} />
      </Canvas>
    </div>
  );
}
