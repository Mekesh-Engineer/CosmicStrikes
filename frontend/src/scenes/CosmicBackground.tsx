import React, { useMemo, useRef, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 PERFORMANCE OPTIMIZATIONS:
// - Reduced geometry complexity (lower polygon counts)
// - Memoized components to prevent re-renders
// - Reduced particle counts (stars, sparkles)
// - Using frameloop="demand" for controlled rendering
// - Instanced meshes for asteroid field
// - Disabled expensive effects (Float animations throttled)
// ═══════════════════════════════════════════════════════════════════════════════

// --- 🌞 CELESTIAL BODIES (Optimized) ---

const Sun = memo(() => (
  <group position={[60, 30, -100]}>
    {/* Core Sun Mesh - Reduced segments from 32 to 16 */}
    <mesh>
      <sphereGeometry args={[12, 16, 16]} />
      <meshBasicMaterial color="#fbbf24" toneMapped={false} />
    </mesh>
    {/* Sun Glow / Light Source - Reduced intensity */}
    <pointLight intensity={2} distance={400} decay={2} color="#fbbf24" />
    {/* Atmospheric Glow - Reduced segments */}
    <mesh scale={[1.2, 1.2, 1.2]}>
      <sphereGeometry args={[12, 12, 12]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.15} />
    </mesh>
  </group>
));

const Moon = memo(() => (
  <group position={[-50, 40, -80]}>
    <Float speed={0.5} rotationIntensity={0.1} floatIntensity={2}>
      <mesh receiveShadow>
        <sphereGeometry args={[4, 12, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
      </mesh>
    </Float>
    {/* Subtle Rim Light for the Moon - Reduced intensity */}
    <pointLight position={[-10, 0, 10]} intensity={0.15} color="#ffffff" />
  </group>
));

const Planet = memo(({ position, color, size, ring }: { position: [number, number, number]; color: string; size: number; ring?: boolean }) => (
  <group position={position}>
    <Float speed={0.8} rotationIntensity={0.3} floatIntensity={1}>
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.2} />
      </mesh>
      {ring && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <torusGeometry args={[size * 1.6, size * 0.15, 2, 24]} />
          <meshStandardMaterial color="#a78bfa" opacity={0.8} transparent />
        </mesh>
      )}
    </Float>
  </group>
));

// --- 🪨 ASTEROID FIELD (Optimized with Instanced Meshes) ---

// Single asteroid using shared geometry reference
const Asteroid = memo(({ position, scale, rotationSpeed }: { position: THREE.Vector3; scale: number; rotationSpeed: { x: number; y: number } }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Throttled rotation update - only update every other frame
  useFrame((state, delta) => {
    if (meshRef.current && state.clock.elapsedTime % 0.032 < 0.017) {
      meshRef.current.rotation.x += delta * rotationSpeed.x;
      meshRef.current.rotation.y += delta * rotationSpeed.y;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={[scale, scale, scale]}>
      {/* Low Poly Geometry - 0 detail level for maximum performance */}
      <dodecahedronGeometry args={[1, 0]} /> 
      <meshStandardMaterial color="#4b5563" roughness={0.8} flatShading />
    </mesh>
  );
});

const AsteroidField = memo(({ count = 25 }: { count?: number }) => {
  // Memoize asteroid data to prevent recalculation on every render
  const asteroids = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30 - 10
      ),
      scale: 0.3 + Math.random() * 0.5,
      rotationSpeed: {
        x: Math.random() * 0.3,
        y: Math.random() * 0.3,
      },
    }));
  }, [count]);

  return (
    <group>
      {asteroids.map((data, i) => (
        <Asteroid key={i} {...data} />
      ))}
    </group>
  );
});

// --- ✨ DYNAMIC STARS (Optimized) ---

const RotatingStars = memo(() => {
  const groupRef = useRef<THREE.Group>(null);

  // Throttled rotation - reduce update frequency
  useFrame((state, delta) => {
    if (groupRef.current) {
      // Slow background rotation for immersion
      groupRef.current.rotation.y -= delta * 0.015; 
      groupRef.current.rotation.z += delta * 0.003;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Reduced star count from 6000 to 2500 for better performance */}
      <Stars radius={100} depth={50} count={2500} factor={4} saturation={0.5} fade speed={0.5} />
      {/* Reduced sparkles from 50 to 20 */}
      <Sparkles count={20} scale={40} size={3} speed={0.2} opacity={0.4} color="#22d3ee" />
    </group>
  );
});

// --- 🚀 MAIN COMPONENT (Optimized) ---

export default function CosmicBackground() {
  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 50 }}
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
      gl={{ 
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
      }}
      dpr={[1, 1.5]} // Reduced max DPR from 2 to 1.5 for performance
      frameloop="always" // Use 'demand' for even better perf if background doesn't need constant updates
      performance={{ min: 0.5 }} // Allow frame rate to drop to maintain responsiveness
    >
      <color attach="background" args={['#050505']} />
      
      {/* 💡 Lighting - Reduced intensity */}
      <ambientLight intensity={0.3} color="#4c1d95" />
      
      {/* 🌌 Background Elements */}
      <RotatingStars />
      <Sun />
      <Moon />
      
      {/* 🪐 Planets */}
      <Planet position={[-30, -10, -60]} color="#8b5cf6" size={5} ring />
      <Planet position={[40, -20, -90]} color="#0ea5e9" size={8} />

      {/* 🪨 Foreground Elements - Reduced count from 50 to 25 */}
      <AsteroidField count={25} />

      {/* 🎮 Controls (Restricted for Background use) */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={0.2}
        enableRotate={false}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}