import { shaderMaterial } from '@react-three/drei'
import { extend, type ThreeElement } from '@react-three/fiber'
import { Color, Matrix4, Vector3 } from 'three'

/**
 * The black hole itself: a general-relativistic raytracer in one fragment
 * shader.
 *
 * Nothing here is a texture or a mesh. Every pixel fires a ray backwards from
 * the camera and integrates a photon geodesic through Schwarzschild spacetime
 * until it either falls through the horizon, crosses the accretion disk, or
 * escapes to the star field. That is what produces the lensing: the disk behind
 * the hole is bent up and over the top, the underside is bent into view beneath,
 * and the whole sky is dragged into an Einstein ring around the shadow. You
 * cannot fake those with a sprite, because they are the *same* disk seen along
 * three different paths.
 *
 * Physics approach adapted from oseiskar/black-hole and its fork
 * Adriwin06/black-hole (both MIT). This is a much smaller implementation —
 * Schwarzschild only, no Kerr spin, procedural sky instead of a survey texture —
 * sized for a hero section rather than a physics sandbox.
 *
 * Units: r_s = 1, G = c = 1, so M = r_s/2 = 0.5. The horizon is at r = 1, the
 * photon sphere at r = 1.5, and the ISCO at r = 3.
 */

/**
 * The integration is done in the plane of the ray rather than in 3D.
 *
 * Schwarzschild spacetime is spherically symmetric, so a photon never leaves the
 * plane spanned by its starting position and its direction. Inside that plane
 * the trajectory obeys the Binet equation for light,
 *
 *     d²u/dφ² = -u + (3/2) r_s u²,       u = 1/r
 *
 * which is two scalars of state instead of a 6-component position/momentum pair,
 * and is exact rather than a weak-field approximation. The `1.5 r_s u²` term is
 * the entire deviation from Newtonian straight-line motion — drop it and the
 * image collapses to an ordinary sphere on a starry background.
 */
const VERT = /* glsl */ `
uniform mat4 uProjInv;
varying vec3 vRayView;

void main() {
  // Reconstruct the view-space ray through this pixel by un-projecting a point
  // on the near plane. Interpolating that point across the quad is exact for a
  // pinhole camera, so the fragment shader only has to normalise it.
  vec4 v = uProjInv * vec4(position.xy, -1.0, 1.0);
  vRayView = v.xyz / v.w;

  // Fullscreen triangle/quad: bypass the model-view transform entirely and
  // emit clip coordinates directly, pinned to the far plane.
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`

const FRAG = /* glsl */ `
precision highp float;

varying vec3 vRayView;

uniform mat4  uViewInv;
uniform float uTime;
uniform int   uSteps;
uniform float uDphi;
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uDiskSpin;
uniform float uDiskH;
uniform float uDensity;
uniform float uBeam;
uniform float uExposure;
uniform vec3  uHot;
uniform vec3  uMid;
uniform vec3  uCool;
uniform float uStarBright;
uniform float uNebula;

#define RS 1.0
#define MAX_STEPS 400

// ─────────────────────────────────────────────────────────────────────
// hashes and noise
// ─────────────────────────────────────────────────────────────────────

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

float vnoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash13(vec3(i, 0.0));
  float b = hash13(vec3(i + vec2(1.0, 0.0), 0.0));
  float c = hash13(vec3(i + vec2(0.0, 1.0), 0.0));
  float d = hash13(vec3(i + vec2(1.0, 1.0), 0.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Four octaves is where the disk stops reading as noise and starts reading as
// gas. The rotation between octaves keeps the lobes from lining up on the axes,
// which otherwise shows as a visible crosshatch once the disk is in motion.
float fbm2(vec2 p) {
  const mat2 R = mat2(0.80, 0.60, -0.60, 0.80);
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * vnoise2(p);
    p = R * p * 2.07 + 13.7;
    a *= 0.5;
  }
  return s;
}

float vnoise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  );
}

// ─────────────────────────────────────────────────────────────────────
// colour
// ─────────────────────────────────────────────────────────────────────

// Stand-in for a Planck curve: red → amber → white → blue-white, which is the
// part of the blackbody locus the disk actually spans. A real spectral integral
// buys nothing here and costs a texture fetch, and this version leaves the two
// endpoints as uniforms so the disk can be pulled toward the brand palette.
vec3 temperatureColor(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c = mix(uCool, uMid, smoothstep(0.0, 0.45, t));
  c = mix(c, vec3(1.0, 0.94, 0.86), smoothstep(0.40, 0.80, t));
  c = mix(c, uHot, smoothstep(0.76, 1.0, t));
  return c;
}

// ─────────────────────────────────────────────────────────────────────
// sky
// ─────────────────────────────────────────────────────────────────────

// One cubic cell per star. Cheaper than the usual 3x3x3 neighbourhood scan, and
// the seams it would cause are avoided by keeping every star's core well inside
// its own cell.
vec3 starLayer(vec3 dir, float scale, float thr, float radius, float amp, float t) {
  vec3 p = dir * scale;
  vec3 id = floor(p);
  vec3 f = p - id;

  if (hash13(id + 3.71) < thr) return vec3(0.0);

  vec3 h = hash33(id + 1.23);
  float d = length(f - (0.32 + 0.36 * h));

  // Magnitudes: a steep power keeps most stars faint and lets a handful burn,
  // which is what a real sky looks like. A flat distribution reads as static.
  float mag = pow(hash11(dot(id, vec3(7.1, 113.7, 31.3))), 5.0);

  float core = smoothstep(radius, 0.0, d);
  float halo = smoothstep(radius * 6.0, 0.0, d);

  // Scintillation. Squaring biases each star toward its dim phase so the layer
  // sparkles instead of pulsing as a whole.
  float tw = 0.5 + 0.5 * sin(t * (0.7 + h.z * 2.3) + h.x * 6.2831);
  tw = 0.3 + 0.7 * tw * tw;

  vec3 tint = mix(vec3(0.60, 0.74, 1.0), vec3(1.0, 0.83, 0.64), h.y);
  return tint * amp * tw * (core * (0.5 + mag * 8.0) + halo * 0.05 * (0.3 + mag * 3.0));
}

vec3 starField(vec3 dir, float t) {
  vec3 c = vec3(0.0);
  c += starLayer(dir, 11.0, 0.84, 0.032, 1.00, t);
  c += starLayer(dir, 23.0, 0.85, 0.026, 0.66, t);
  c += starLayer(dir, 47.0, 0.87, 0.021, 0.40, t);
  c += starLayer(dir, 95.0, 0.90, 0.018, 0.22, t);
  return c;
}

// A faint dust lane so the background is not pure black between stars. It is
// sampled with the *bent* ray like everything else, so it warps around the
// shadow and gives the lensing something continuous to distort — stars alone
// are too sparse to show the effect.
vec3 nebula(vec3 dir) {
  float n = vnoise3(dir * 1.9);
  n = n * 0.65 + vnoise3(dir * 4.3 + 7.0) * 0.35;
  float band = pow(clamp(1.0 - abs(dot(dir, normalize(vec3(0.25, 0.9, -0.35)))), 0.0, 1.0), 2.5);
  float m = smoothstep(0.52, 0.98, n) * band;
  vec3 cool = vec3(0.035, 0.060, 0.150);
  vec3 warm = vec3(0.090, 0.045, 0.120);
  return mix(cool, warm, smoothstep(0.5, 0.9, n)) * m;
}

// ─────────────────────────────────────────────────────────────────────
// accretion disk
// ─────────────────────────────────────────────────────────────────────

// Gaussian scale height, flaring outward the way a real disk does because the
// gas is less tightly bound further out.
float diskHeight(float r) {
  float x = clamp((r - uDiskInner) / (uDiskOuter - uDiskInner), 0.0, 1.0);
  return uDiskH * (0.22 + 1.0 * x);
}

// Emission per unit path length at a point inside the disk volume.
//
// This is deliberately volumetric rather than a plane-crossing test. A disk of
// zero thickness seen nearly edge-on compresses an unbounded range of radii into
// each pixel, and one sample per crossing aliases that into concentric wire —
// the giveaway artefact of a naive implementation. Integrating through a slab
// instead means neighbouring pixels accumulate overlapping samples and the
// aliasing averages out, and it is also simply more correct: accretion disks
// have scale height.
//
// marchDir is the direction we are marching, which is the reverse of the
// photon's real travel: we trace backwards from the eye.
vec4 diskSample(vec3 pos, float r, vec3 marchDir, float t) {
  float x = (r - uDiskInner) / (uDiskOuter - uDiskInner);

  // Shakura-Sunyaev effective temperature for a thin disk with a no-torque
  // inner boundary: T ∝ r^-3/4 (1 - sqrt(r_in/r))^1/4. The bracket is what
  // darkens the very inner edge and puts the peak just outside the ISCO,
  // instead of running away to infinity at the centre.
  float f = max(1.0 - sqrt(uDiskInner / r), 0.0);
  float T = pow(uDiskInner / r, 0.75) * pow(f, 0.25);

  // Keplerian circular orbit, prograde about +Y.
  float speed = min(sqrt(0.5 * RS / r), 0.92);
  vec3 vel = normalize(cross(vec3(0.0, 1.0, 0.0), pos)) * speed;
  float gam = inversesqrt(max(1.0 - speed * speed, 1e-4));

  // Total frequency ratio g = ν_obs/ν_emit: gravitational climb out of the well
  // times the special-relativistic Doppler shift of the orbiting gas. This is
  // the single most important line in the shader for looking real — it is why
  // the side of the disk rotating toward the camera is blue-white and blinding
  // while the receding side sinks to dim orange.
  float grav = sqrt(max(1.0 - RS / r, 0.0));
  float g = grav / max(gam * (1.0 + dot(marchDir, vel)), 1e-3);

  // Turbulence sheared by the orbital profile, so the inner disk visibly winds
  // up faster than the outer disk. Sampling on (cos, sin) of the sheared angle
  // rather than on the angle itself avoids a seam at ±π.
  float ang = atan(pos.z, pos.x);
  float sang = ang - t * uDiskSpin * pow(uDiskInner / r, 1.5);
  // The radial coefficient is deliberately low. Shear winds every feature into a
  // ring, so a high radial frequency turns the disk into concentric wire — the
  // structure has to be coarse across r and fine along the flow to read as gas.
  vec2 q = vec2(cos(sang), sin(sang)) * (1.25 + r * 0.33);
  // Offsetting by height stops the slab from looking like one 2D texture
  // extruded vertically — the top and bottom faces get different structure.
  float dens = mix(fbm2(q + pos.y * 0.6), fbm2(q * 2.7 + 21.0), 0.4);
  // A wide remap leaves gas between the filaments instead of gaps.
  dens = smoothstep(0.16, 0.88, dens);

  // Gaussian in height, so the disk has soft faces rather than a hard edge.
  float h = diskHeight(r);
  float vert = exp(-(pos.y * pos.y) / (h * h));

  float env = smoothstep(0.0, 0.07, x) * (1.0 - smoothstep(0.45, 1.0, x));
  // Extinction per unit length, not an opacity: the caller multiplies by the
  // length of the segment it is integrating over.
  float sigma = env * vert * (0.35 + 1.5 * dens) * uDensity;

  vec3 col = temperatureColor(clamp(T * g * 1.30, 0.0, 1.0));

  // Relativistic beaming. The exact exponent for specific intensity is 3 (from
  // the invariance of I_ν/ν³); it is left as a uniform because the physical
  // value blows the highlight out past what a hero section can hold.
  float bright = pow(clamp(g, 0.2, 3.5), uBeam) * (0.30 + 2.1 * T * T) * (0.5 + 0.9 * dens);

  return vec4(col * bright, sigma);
}

// ─────────────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────────────

void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(mat3(uViewInv) * vRayView);

  float r0 = length(ro);
  vec3 e1 = ro / r0;
  vec3 tangent = rd - e1 * dot(rd, e1);
  float tl = length(tangent);

  // A perfectly radial ray has no orbital plane to integrate in. It also goes
  // straight down the throat, so there is nothing to compute.
  if (tl < 1e-5) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec3 e2 = tangent / tl;

  float u = 1.0 / r0;
  // du/dφ = -(1/r²)(dr/dφ), and dr/dφ = r·(v_r/v_t) for the initial direction.
  float du = -dot(rd, e1) / (r0 * tl);

  // A fixed step lets the in-plane basis advance by a rotation recurrence
  // instead of a sin/cos pair per iteration, which is a real saving across 400
  // steps. Accuracy does not suffer: the Binet equation varies on a scale of
  // order 1 in φ everywhere, so uniform dφ is uniformly accurate.
  float cd = cos(uDphi);
  float sd = sin(uDphi);
  vec3 a1 = e1;
  vec3 a2 = e2;

  float jitter = hash13(vec3(gl_FragCoord.xy, 1.0));

  vec3 prevP = ro;
  vec3 lastDir = rd;
  vec3 acc = vec3(0.0);
  float trans = 1.0;
  bool captured = false;
  bool escaped = false;

  // Far enough out that the sky is a fair approximation of infinity, and the
  // remaining deflection is below a pixel.
  float escR = uDiskOuter * 2.4;

  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= uSteps) break;

    // Kick-drift-kick on d²u/dφ² = -u + 1.5 r_s u². Symplectic, so a ray that
    // loops the photon sphere several times keeps its orbit instead of
    // spiralling from accumulated error the way plain Euler would.
    du += 0.5 * uDphi * (-u + 1.5 * RS * u * u);
    u += uDphi * du;
    du += 0.5 * uDphi * (-u + 1.5 * RS * u * u);

    if (u <= 0.0) {
      escaped = true;
      break;
    }

    float r = 1.0 / u;
    if (r <= RS * 1.0001) {
      captured = true;
      break;
    }

    vec3 n1 = a1 * cd + a2 * sd;
    a2 = a2 * cd - a1 * sd;
    a1 = n1;

    vec3 p = a1 * r;
    vec3 seg = p - prevP;
    float segLen = length(seg);
    lastDir = seg / max(segLen, 1e-6);

    // Volumetric accumulation through the disk slab. Two sub-samples per
    // segment: near the hole the steps are short and one would do, but a ray
    // grazing the outer disk covers a lot of ground per step, and a single
    // midpoint sample there produces exactly the banding this replaced.
    for (int k = 0; k < 2; k++) {
      // Jitter the sample position per pixel. Sampling at fixed fractions leaves
      // a residual moiré where the step pattern beats against the disk's radial
      // structure; decorrelating neighbouring pixels turns that banding into
      // fine grain, which bloom then smooths away. The offset is a function of
      // gl_FragCoord only, so it does not change between frames and reads as
      // texture rather than as flicker.
      // Stratified: sample k lands anywhere in the k-th half of the segment.
      // Full-width jitter decorrelates neighbouring pixels completely, while the
      // strata keep the two samples from clumping the way pure random offsets
      // would.
      vec3 m = prevP + seg * ((float(k) + jitter) * 0.5);
      float rm = length(m);
      if (rm > uDiskInner && rm < uDiskOuter && abs(m.y) < diskHeight(rm) * 2.5) {
        vec4 s = diskSample(m, rm, lastDir, uTime);
        // Beer-Lambert over half the segment, so optical depth scales with the
        // distance actually travelled rather than with the step count.
        float a = 1.0 - exp(-s.a * segLen * 0.5);
        // Front-to-back: we march away from the eye, so nearer gas occludes what
        // is behind it. This is what lets the near rim of the disk hide the
        // lensed image of its own far side.
        acc += trans * s.rgb * a;
        trans *= 1.0 - a;
      }
    }

    if (r > escR && du < 0.0) {
      escaped = true;
      break;
    }
    if (trans < 0.004) break;

    prevP = p;
  }

  vec3 col = acc;

  // A ray that neither escaped nor crossed the horizon inside the step budget is
  // one winding the photon sphere. Those belong to the photon ring and read
  // correctly as black, so running out of steps degrades gracefully.
  if (escaped && !captured) {
    col += trans * (starField(lastDir, uTime) * uStarBright + nebula(lastDir) * uNebula);
  }

  gl_FragColor = vec4(col * uExposure, 1.0);
}
`

export const BlackHoleMaterial = shaderMaterial(
  {
    uProjInv: new Matrix4(),
    uViewInv: new Matrix4(),
    uTime: 0,
    uSteps: 300,
    uDphi: 0.028,
    uDiskInner: 3.0,
    uDiskOuter: 13.0,
    uDiskSpin: 1.0,
    uDiskH: 0.30,
    uDensity: 1.5,
    uBeam: 2.6,
    uExposure: 1.0,
    uHot: new Color('#9ecbff'),
    uMid: new Color('#ff8a2b'),
    uCool: new Color('#5c1403'),
    uStarBright: 1.0,
    uNebula: 1.0,
  },
  VERT,
  FRAG
)

extend({ BlackHoleMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    blackHoleMaterial: ThreeElement<typeof BlackHoleMaterial>
  }
}

export type BlackHoleMaterialImpl = InstanceType<typeof BlackHoleMaterial> & {
  uProjInv: Matrix4
  uViewInv: Matrix4
  uTime: number
  uCamPos: Vector3
}
