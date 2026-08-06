import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import type { Camera } from 'three'
import { BlackHoleMaterial, type BlackHoleMaterialImpl } from './black-hole-material'
import AccretionParticles from './accretion-particles'
import CameraRig from './camera-rig'
import Bloom from './bloom'
import PerfGovernor from './perf-governor'
import type { Quality } from './quality'

const DISK_INNER = 3.0
const DISK_OUTER = 13.0
const DISK_SPIN = 2.4

/**
 * The raymarched hole, drawn as a fullscreen quad.
 *
 * The geometry is a formality — the vertex shader throws away the model-view
 * transform and emits clip coordinates directly, so this is really "run the
 * fragment shader once per pixel". The camera reaches the shader through
 * uniforms instead, which is why the rig can fly around a scene that contains no
 * actual black hole object.
 */
function BlackHole({ quality, paused, ghost }: { quality: Quality; paused: boolean; ghost: number }) {
  const mat = useRef<BlackHoleMaterialImpl>(null)

  useFrame((state) => {
    if (mat.current) mat.current.uTime = paused ? 12.0 : state.clock.elapsedTime
  })

  // The camera matrices have to be read after the rig has moved the camera and
  // before the draw. onBeforeRender is the only hook that is guaranteed to sit
  // between the two; doing it in useFrame would make correctness depend on the
  // order components happen to mount in, and would show up as a one-frame lag
  // smeared across the whole image whenever the camera accelerates.
  const onBeforeRender = (
    _r: unknown,
    _s: unknown,
    camera: Camera
  ) => {
    const m = mat.current
    if (!m) return
    m.uProjInv.copy(camera.projectionMatrixInverse)
    m.uViewInv.copy(camera.matrixWorld)
  }

  return (
    <mesh frustumCulled={false} renderOrder={-1000} onBeforeRender={onBeforeRender}>
      <planeGeometry args={[2, 2]} />
      <blackHoleMaterial
        ref={mat}
        key={BlackHoleMaterial.key}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        uSteps={quality.steps}
        uDphi={quality.dphi}
        uDiskInner={DISK_INNER}
        uDiskOuter={DISK_OUTER}
        uDiskSpin={DISK_SPIN}
        uBeam={2.5}
        uExposure={2.45}
        uStarBright={1.5}
        uNebula={0.5}
        uMono={1}
        uChurn={0.075}
        uGhostAmt={ghost}
        uGhostSize={0.042}
      />
    </mesh>
  )
}

export default function Scene({
  quality,
  paused,
  offsetX,
  offsetY,
  tier,
  lastTier,
  onDemote,
  ghost,
}: {
  quality: Quality
  paused: boolean
  offsetX: number
  offsetY: number
  tier: number
  lastTier: number
  onDemote: () => void
  ghost: number
}) {
  const dpr = useThree((s) => s.viewport.dpr)

  return (
    <>
      {!paused && <PerfGovernor tier={tier} lastTier={lastTier} onDemote={onDemote} />}

      <CameraRig fitRadius={DISK_OUTER} elevation={0.155} offsetX={offsetX} offsetY={offsetY} paused={paused} />

      <BlackHole quality={quality} paused={paused} ghost={ghost} />

      {quality.particles > 0 && (
        <AccretionParticles
          count={quality.particles}
          diskInner={DISK_INNER}
          spin={DISK_SPIN * 0.42}
          intensity={0.2}
          size={1.9}
          pixelRatio={dpr}
        />
      )}

      {/*
        Near-field glitter. The star field in the shader sits at infinity and is
        lensed with the rest of the sky; this is the opposite — a handful of
        motes close to the camera that slide across the frame as it orbits. Two
        depths of sparkle is what stops the background from feeling like a
        painted backdrop.
      */}
      {quality.sparkles > 0 && (
        <Sparkles
          count={quality.sparkles}
          scale={[46, 26, 46]}
          size={2.4}
          speed={paused ? 0 : 0.35}
          opacity={0.34}
          color="#e8e8e8"
          noise={0.7}
        />
      )}

      {/*
        A high threshold on purpose. The disk covers a lot of the frame, so a
        low one blooms the whole thing into an orange fog and the shadow loses
        its edge — the only pixels that should glare are the beamed inner rim.
      */}
      <Bloom strength={quality.bloom} radius={0.55} threshold={1.1} />

    </>
  )
}
