import { shaderMaterial } from '@react-three/drei'
import { extend, type ThreeElement } from '@react-three/fiber'
import { Color, Matrix4 } from 'three'

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
uniform float uBeam;
uniform float uExposure;
uniform vec3  uHot;
uniform vec3  uMid;
uniform vec3  uCool;
uniform float uStarBright;
uniform float uNebula;
uniform float uMono;
uniform float uGhostAmt;
uniform float uGhostSize;
uniform float uGhostYaw;
uniform float uGhostPitch;
uniform float uChurn;

#define RS 1.0
#define MAX_STEPS 560

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

// Ordered dither, built by nesting a 2x2 cell three times — an 8x8 Bayer
// matrix without a lookup table.
//
// This replaces white noise as the sample offset. Both break the banding that
// fixed sample positions produce, but white noise pays for it in variance: with
// only two or three samples per step, neighbouring pixels land on genuinely
// different offsets and the disk comes out speckled. A Bayer pattern is
// low-discrepancy — adjacent pixels get maximally *spread* offsets rather than
// independent ones — so it decorrelates the sampling just as well while the
// residual reads as fine texture instead of grain.
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x * 0.5 + a.y * a.y * 0.75);
}
#define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
#define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))

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

// Five octaves. The fifth is what puts fine filament structure inside the
// broad bands — below that the gas reads as soft blur once it is moving. The
// rotation between octaves keeps the lobes from lining up on the axes, which
// otherwise shows as a visible crosshatch.
float fbm2(vec2 p) {
  const mat2 R = mat2(0.80, 0.60, -0.60, 0.80);
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
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

  // Monochrome takes temperature to *luminance* rather than desaturating the
  // colour ramp. Taking the luma of the ramp would collapse the image into a
  // narrow mid-grey band, because amber and blue-white sit at nearly the same
  // brightness — the thing that separates them is hue, which is exactly what
  // is being thrown away. Re-deriving the value from temperature keeps the
  // radial gradient legible with no colour at all.
  // The exponent matters more here than it would in colour. The colour ramp
  // spends its low end in dark reds that are dim as well as red, so temperature
  // and brightness fall together; a gentle mono curve breaks that link and
  // pushes the whole disk into a blown-out mid grey with no structure left in
  // it. Going steeper than linear restores the falloff the hue was carrying.
  float g = mix(0.02, 1.0, pow(t, 0.95));
  return mix(c, vec3(g), uMono);
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

  // Magnitudes: a power keeps most stars modest and lets a handful burn, which
  // is what a real sky looks like. Shallower than a true magnitude distribution
  // so the faint majority stays visible rather than sitting at the threshold of
  // perception.
  float mag = pow(hash11(dot(id, vec3(7.1, 113.7, 31.3))), 3.2);

  float core = smoothstep(radius, 0.0, d);
  float halo = smoothstep(radius * 6.0, 0.0, d);

  // Scintillation. Every star stays lit — the twinkle rides on a floor rather
  // than fading to nothing, so the field is constant and only its brightness
  // breathes. Dropping stars to zero makes the sky feel like it is flickering
  // out, which is the opposite of what twinkling should read as.
  //
  // Two incommensurate rates per star, so the pulse never settles into an
  // obvious loop.
  float tw = 0.5 + 0.5 * sin(t * (0.9 + h.z * 2.6) + h.x * 6.2831);
  float tw2 = 0.5 + 0.5 * sin(t * (1.7 + h.y * 3.1) + h.z * 6.2831);
  tw = 0.60 + 0.40 * (tw * 0.65 + tw2 * 0.35);

  // Stars keep their spectral colour. uMono governs the *hole* — the disk, its
  // beaming, its debris — not the sky behind it. Draining the colour out of
  // deep space as well would just make the frame flat; the point of a greyscale
  // black hole is that it sits against something that is not greyscale.
  vec3 tint = mix(vec3(0.60, 0.74, 1.0), vec3(1.0, 0.83, 0.64), h.y);
  return tint * amp * tw * (core * (0.5 + mag * 8.0) + halo * 0.05 * (0.3 + mag * 3.0));
}

vec3 starField(vec3 dir, float t) {
  vec3 c = vec3(0.0);
  c += starLayer(dir, 11.0, 0.84, 0.032, 1.00, t);
  c += starLayer(dir, 23.0, 0.85, 0.026, 0.66, t);
  c += starLayer(dir, 47.0, 0.87, 0.021, 0.40, t);
  c += starLayer(dir, 95.0, 0.90, 0.018, 0.22, t);
  c += starLayer(dir, 185.0, 0.92, 0.015, 0.13, t);
  return c;
}

// A faint dust lane so the background is not pure black between stars. It is
// sampled with the *bent* ray like everything else, so it warps around the
// shadow and gives the lensing something continuous to distort — stars alone
// are too sparse to show the effect.
vec3 nebula(vec3 dir) {
  float n = vnoise3(dir * 1.6);
  float n2 = vnoise3(dir * 3.7 + 7.0);
  float n3 = vnoise3(dir * 8.3 - 3.0);
  float f = n * 0.55 + n2 * 0.30 + n3 * 0.15;

  // A broad wash rather than a tight lane. A narrow band reads as a stripe
  // across the frame; deep space in a wide shot is mostly a slow gradient with
  // structure inside it, and the exponent here is what keeps it a gradient.
  float band = pow(clamp(1.0 - abs(dot(dir, normalize(vec3(0.28, 0.86, -0.42)))), 0.0, 1.0), 1.3);

  vec3 indigo = vec3(0.070, 0.085, 0.290);
  vec3 violet = vec3(0.215, 0.095, 0.360);
  vec3 teal = vec3(0.045, 0.175, 0.280);

  vec3 c = mix(indigo, violet, smoothstep(0.32, 0.86, f));
  c = mix(c, teal, smoothstep(0.55, 0.95, n3) * 0.45);

  // Deliberately not desaturated by uMono, for the same reason as the stars.
  float m = smoothstep(0.42, 0.98, f) * (0.55 + 0.45 * band);
  return c * m;
}

// ── the mark ─────────────────────────────────────────────────────────
//
// Drawn from distance fields rather than sampled from the logo PNG.
//
// The artwork is a glassy 3D render: it carries its own baked highlights,
// gradients and specular, all lit from a light source that does not exist in
// this scene. Pasted into a black hole it reads exactly as what it is — a
// sticker on the glass — because every other pixel in the frame is lit by
// physics and that one is not. Rebuilt as signed distance fields, the mark can
// instead be made of the same emission as everything else: self-lit, soft at
// the edges, semi-transparent, with the sky visible through it.
//
// It is still sampled with the *bent* ray, like the stars, so the hole lenses
// it and throws a second warped image of it around the far side of the disk.

// Rounded dome over a slab, cut off by a travelling wave.
float sdGhostBody(vec2 p, float t) {
  // max(p.y - top, 0) collapses to a circle above the shoulder line and to a
  // vertical slab below it, which is the whole silhouette in one expression.
  float d = length(vec2(p.x, max(p.y - 0.26, 0.0))) - 0.54;
  // The hem. Three humps, drifting, so the tail stirs like something suspended
  // rather than sitting still.
  float hem = -0.62 + 0.085 * sin(p.x * 8.5 + t * 1.3) + 0.03 * sin(p.x * 17.0 - t * 0.9);
  return max(d, hem - p.y);
}

float sdHexRing(vec2 p, float r, float w) {
  const vec3 k = vec3(-0.8660254, 0.5, 0.5773503);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return abs(length(p) * sign(p.y)) - w;
}

vec3 ghost(vec3 dir, float t) {
  if (uGhostAmt <= 0.0) return vec3(0.0);

  // Anchored to the hole rather than to the sky. A fixed celestial position
  // would swing out of frame within seconds of the orbit starting and spend
  // most of each revolution behind the camera; keeping it just off the shadow
  // means it is always in the one place where the lensing is strong enough to
  // do something to it. It still drifts, on two slow incommensurate rates, so
  // it swims around the hole instead of being pinned there.
  float yaw = uGhostYaw + 0.085 * sin(t * 0.083);
  float pitch = uGhostPitch + 0.038 * sin(t * 0.114 + 1.7);

  vec3 back = normalize(-cameraPosition);
  float cy = cos(yaw);
  float sy = sin(yaw);
  vec3 f = normalize(vec3(back.x * cy - back.z * sy, back.y + pitch, back.x * sy + back.z * cy));
  float z = dot(dir, f);
  // Behind the observer, or outside the patch the mark occupies.
  if (z <= 0.15) return vec3(0.0);

  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), f));
  vec3 up = cross(f, rt);

  // Gnomonic projection onto the tangent plane at uGhostDir. Dividing through
  // by z is what makes the mark sit *in* the sky rather than on a billboard —
  // it foreshortens correctly as the lensing sweeps it off-axis.
  vec2 uv = vec2(dot(dir, rt), dot(dir, up)) / (z * uGhostSize);
  // Generous bound: the glow and the ring both reach past the body.
  if (dot(uv, uv) > 4.0) return vec3(0.0);

  float body = sdGhostBody(uv, t);

  // Eyes, carved out. Two voids read as a face at any size, where drawn pupils
  // turn to mush the moment the mark is small or the lensing stretches it.
  float eyes = min(
    length((uv - vec2(-0.185, 0.30)) / vec2(0.075, 0.115)) - 1.0,
    length((uv - vec2( 0.185, 0.30)) / vec2(0.075, 0.115)) - 1.0
  );
  float d = max(body, -eyes);

  // Vaporous, not solid. The interior is thin and unevenly dense, so stars stay
  // visible through it — the single strongest cue that this is an apparition and
  // not a decal, since a decal is opaque by construction.
  float wisp = fbm2(uv * 2.6 + vec2(0.0, -t * 0.22));
  float fill = smoothstep(0.045, -0.06, d) * (0.16 + 0.30 * wisp);

  // Edges carry the light. Real apparitions read as a bright contour with a soft
  // interior, which is also what keeps the silhouette legible once lensing has
  // pulled the shape around.
  float rim = exp(-abs(d) * 22.0) * 0.85;
  float halo = exp(-max(d, 0.0) * 7.0) * 0.22;

  // The hexagonal frame, as a thin luminous contour rather than the artwork's
  // glassy ribbon. It turns slowly against the body's drift.
  float ha = t * 0.05;
  float hc = cos(ha);
  float hs = sin(ha);
  vec2 hp = vec2(uv.x * hc - uv.y * hs, uv.x * hs + uv.y * hc);
  float hex = sdHexRing(hp, 1.06, 0.012);
  float ring = exp(-max(abs(hex), 0.0) * 34.0) * 0.5 + exp(-max(abs(hex), 0.0) * 9.0) * 0.08;

  // A slow breath, so it reads as an apparition rather than a pasted logo.
  float breath = 0.80 + 0.20 * sin(t * 0.45);

  return vec3(1.0) * (fill + rim + halo + ring) * uGhostAmt * breath;
}

// ─────────────────────────────────────────────────────────────────────
// accretion disk
// ─────────────────────────────────────────────────────────────────────

// The disk is geometrically thin, and is sampled only where a ray actually
// crosses the equatorial plane.
//
// An earlier version integrated volumetrically through a flared slab. That is
// the more physical model and it removes the moiré a zero-thickness disk
// produces edge-on — but averaging each ray over a column of gas is also what
// destroys the thin bright filaments, and those filaments are the look. The
// beating between the step pattern and the disk's radial structure is not an
// artefact to be suppressed here; at this shear it reads as the gas being drawn
// out into threads, which is what an accretion disk actually does.
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
  // times the special-relativistic Doppler shift of the orbiting gas. It is why
  // the side rotating toward the camera is blinding while the receding side
  // sinks away — in monochrome that asymmetry is carried entirely by brightness.
  float grav = sqrt(max(1.0 - RS / r, 0.0));
  float g = grav / max(gam * (1.0 + dot(marchDir, vel)), 1e-3);

  // Turbulence sheared by the orbital profile, so the inner disk visibly winds
  // up faster than the outer. Sampling on (cos, sin) of the sheared angle rather
  // than on the angle itself avoids a seam at ±π.
  float ang = atan(pos.z, pos.x);
  float sang = ang - t * uDiskSpin * pow(uDiskInner / r, 1.5);
  vec2 q = vec2(cos(sang), sin(sang)) * (2.0 + r * 0.62);
  // Drift on top of the shear, so filaments form and tear instead of riding
  // round as a fixed pattern.
  vec2 drift = vec2(t * uChurn, -t * uChurn * 0.63);
  float dens = mix(fbm2(q + drift), fbm2(q * 3.3 + 21.0 - drift * 1.7), 0.35);
  dens = smoothstep(0.25, 0.92, dens);

  float env = smoothstep(0.0, 0.08, x) * (1.0 - smoothstep(0.45, 1.0, x));
  float alpha = clamp(env * (0.25 + 0.9 * dens), 0.0, 1.0);

  vec3 col = temperatureColor(clamp(T * g * 1.30, 0.0, 1.0));

  // Relativistic beaming. The exact exponent for specific intensity is 3 (from
  // the invariance of I_ν/ν³); it is a uniform because the physical value blows
  // the highlight past what a hero section can hold.
  float bright = pow(clamp(g, 0.25, 3.0), uBeam) * (0.30 + 2.4 * T * T) * (0.4 + 1.0 * dens);

  return vec4(col * bright, alpha);
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
    lastDir = normalize(p - prevP);

    // Equatorial plane crossing, refined by linear interpolation. The disk has
    // zero thickness, so a sign change in y is an exact hit test and the
    // interpolation only has to place it along the segment.
    if (prevP.y * p.y < 0.0) {
      vec3 c = mix(prevP, p, prevP.y / (prevP.y - p.y));
      float rc = length(c);
      if (rc > uDiskInner && rc < uDiskOuter) {
        vec4 s = diskSample(c, rc, lastDir, uTime);
        // Front-to-back: we march away from the eye, so the first crossing
        // occludes later ones. This is what lets the near rim of the disk hide
        // the lensed image of its own far side.
        acc += trans * s.rgb * s.a;
        trans *= 1.0 - s.a;
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
    col += trans * (
      starField(lastDir, uTime) * uStarBright +
      nebula(lastDir) * uNebula +
      ghost(lastDir, uTime)
    );
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
    uBeam: 2.6,
    uExposure: 1.0,
    uHot: new Color('#9ecbff'),
    uMid: new Color('#ff8a2b'),
    uCool: new Color('#5c1403'),
    uStarBright: 1.0,
    uNebula: 1.0,
    uMono: 1.0,
    uGhostAmt: 0.0,
    uGhostSize: 0.09,
    uGhostYaw: 0.400,
    uGhostPitch: 0.265,
    uChurn: 0.05,
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
}
