import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, type ShaderMaterial } from 'three'

/**
 * Debris orbiting the hole: real geometry in front of the raymarched shader,
 * there to give the frame parallax.
 *
 * The shader behind this is a background — it has no depth, so every pixel of it
 * sits at infinity and nothing in it moves relative to anything else in it. A
 * few thousand actual points in actual 3D space are what make the camera move
 * read as a camera move rather than a slowly warping image.
 *
 * All motion is computed in the vertex shader from a per-particle seed, so the
 * CPU never touches the buffer after upload and the orbits stay smooth
 * regardless of frame rate.
 */

const VERT = /* glsl */ `
uniform float uTime;
uniform float uDiskInner;
uniform float uSpin;
uniform float uSize;
uniform float uPixelRatio;

// x: orbital radius, y: phase, z: inclination, w: size/brightness jitter
attribute vec4 aSeed;

varying float vAlpha;
varying vec3 vTint;

void main() {
  float r = aSeed.x;

  // Keplerian: Ω ∝ r^-3/2. Differential rotation is the point — a rigidly
  // rotating cloud looks like a turntable, this looks like it is falling in.
  float omega = uSpin * pow(uDiskInner / r, 1.5);
  float ang = aSeed.y + uTime * omega;

  // Inclined orbits, so the cloud has thickness near the plane and thins out
  // above and below it rather than ending on a hard edge.
  float incl = aSeed.z;
  vec3 pos = vec3(cos(ang) * r, sin(ang) * r * sin(incl), sin(ang) * r * cos(incl));

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // Hide anything sitting inside the shadow. These points are ordinary geometry
  // and know nothing about lensing, so a particle behind the hole would
  // otherwise draw straight over the one part of the frame that must stay black.
  // Approximate but sufficient: is it further away than the hole, and within the
  // shadow's angular radius?
  vec3 toBH = -cameraPosition;
  float dBH = length(toBH);
  // sqrt(27)/2 ≈ 2.6 r_s is the apparent radius of the shadow to a distant
  // observer, which is larger than the horizon because of the lensing.
  float shadowAng = asin(clamp(2.65 / max(dBH, 3.0), 0.0, 1.0));
  vec3 dP = pos - cameraPosition;
  float ang2 = acos(clamp(dot(normalize(dP), toBH / dBH), -1.0, 1.0));
  float behind = step(dBH, length(dP));
  float occ = 1.0 - behind * (1.0 - smoothstep(shadowAng * 0.8, shadowAng * 1.25, ang2));

  // Fade at both ends of the radial range so the cloud has no visible border.
  float radial = smoothstep(0.0, 0.15, (r - uDiskInner) / uDiskInner) *
                 (1.0 - smoothstep(0.55, 1.0, (r - uDiskInner) / (14.0 - uDiskInner)));

  vAlpha = occ * radial * (0.25 + 0.75 * aSeed.w);
  // Hotter closer in, matching the disk's temperature gradient.
  vTint = mix(vec3(1.0, 0.46, 0.13), vec3(0.78, 0.88, 1.0), smoothstep(3.0, 7.0, r));

  gl_PointSize = uSize * uPixelRatio * (0.4 + aSeed.w) * (30.0 / -mv.z);
}
`

const FRAG = /* glsl */ `
precision highp float;

uniform float uIntensity;

varying float vAlpha;
varying vec3 vTint;

void main() {
  // Round, soft-edged sprite. Squaring the falloff gives a small hot core with a
  // wide skirt, which is what the bloom pass needs to bloom off of.
  vec2 d = gl_PointCoord - 0.5;
  float f = max(1.0 - dot(d, d) * 4.0, 0.0);
  f = f * f;
  if (f < 0.002) discard;

  // Additive, so no alpha is written — brightness carries it.
  gl_FragColor = vec4(vTint * f * vAlpha * uIntensity, 1.0);
}
`

export default function AccretionParticles({
  count = 2600,
  diskInner = 3.0,
  spin = 1.0,
  intensity = 1.0,
  size = 2.0,
  pixelRatio = 1,
}: {
  count?: number
  diskInner?: number
  spin?: number
  intensity?: number
  size?: number
  pixelRatio?: number
}) {
  const mat = useRef<ShaderMaterial>(null)

  const seeds = useMemo(() => {
    const a = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      // Concentrated inward but with a long tail, so the cloud is dense where
      // the disk is bright and sparse where it fades out.
      const t = Math.pow(Math.random(), 1.7)
      a[i * 4 + 0] = diskInner * 1.05 + t * 10.5
      a[i * 4 + 1] = Math.random() * Math.PI * 2
      // Mostly near the plane. Cubing keeps the tail thin instead of producing a
      // spherical halo, which would not look like an accretion flow.
      a[i * 4 + 2] = Math.pow(Math.random(), 3) * 0.28 * (Math.random() < 0.5 ? -1 : 1)
      a[i * 4 + 3] = Math.random()
    }
    return a
  }, [count, diskInner])

  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDiskInner: { value: diskInner },
      uSpin: { value: spin },
      uSize: { value: size },
      uPixelRatio: { value: pixelRatio },
      uIntensity: { value: intensity },
    }),
    [diskInner, spin, size, pixelRatio, intensity]
  )

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <primitive attach="attributes-position" object={new BufferAttribute(new Float32Array(count * 3), 3)} />
        <primitive attach="attributes-aSeed" object={new BufferAttribute(seeds, 4)} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
