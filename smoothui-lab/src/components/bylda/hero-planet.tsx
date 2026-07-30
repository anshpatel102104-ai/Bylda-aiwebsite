import { useEffect, useRef } from 'react'

/**
 * HeroPlanet — a photographic Earth limb with the sun rising behind it.
 *
 * This raytraces an actual sphere in the fragment shader and samples NASA
 * Blue Marble imagery (public domain) for the surface and cloud deck, rather
 * than generating terrain procedurally. Procedural noise cannot reach
 * photoreal; real imagery can, and it is also far cheaper — two texture
 * fetches per pixel instead of ~40 noise samples.
 *
 *   /earth-day.jpg    land_shallow_topo_2048  (NASA Visible Earth)
 *   /earth-clouds.jpg cloud_combined_2048     (NASA Visible Earth)
 *
 * The planet is backlit — the sun sits almost directly behind it — which is
 * what produces the thin lit crescent and the bright atmospheric rim.
 * Ties to the "Ground → Sky" brand theme: dark ground, brand-blue atmosphere,
 * sunrise breaking over the curve.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;

uniform vec2      uRes;
uniform float     uTime;
uniform vec2      uMouse;
uniform float     uCrest;   // horizon height, screen fraction from the bottom
uniform sampler2D uDay;
uniform sampler2D uClouds;

#define PI 3.14159265359

const float R    = 1.0;    // planet radius
const float DIST = 1.235;  // camera distance from planet centre (low orbit)
const float HFOV = 0.52;   // vertical half-FOV, radians (~30 degrees)

// Bylda sky ramp — the atmosphere carries the brand.
const vec3 SKY_PALE   = vec3(0.490, 0.827, 0.988);
const vec3 SKY_HIGH   = vec3(0.220, 0.741, 0.973);
const vec3 SKY_BRIGHT = vec3(0.055, 0.647, 0.914);
const vec3 SKY_MID    = vec3(0.008, 0.518, 0.780);
const vec3 GROUND     = vec3(0.043, 0.071, 0.125);

const vec3 SUN_CORE = vec3(1.000, 0.968, 0.920);
const vec3 SUN_WARM = vec3(1.000, 0.735, 0.430);

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Starfield keyed off the ray direction so it sits at infinity.
float stars(vec3 rd, float t) {
  vec2 g = vec2(atan(rd.z, rd.x) * 420.0, asin(clamp(rd.y, -1.0, 1.0)) * 420.0);
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id);
  float present = step(0.975, h);
  float tw = 0.55 + 0.45 * sin(t * 1.6 + h * 130.0);
  float mag = 0.35 + 0.65 * hash(id + 7.3);
  return present * smoothstep(0.34, 0.0, length(f)) * tw * mag;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  float t = uTime;

  vec2 par = (uMouse - 0.5) * vec2(0.020, 0.012);

  // Camera at the origin looking down -z.
  vec2 ndc = (uv - 0.5) * 2.0 + par;
  float tanH = tan(HFOV);
  vec3 rd = normalize(vec3(ndc.x * aspect * tanH, ndc.y * tanH, -1.0));

  // Tilt the planet centre below the view axis so the limb crests at uCrest.
  float angRad = asin(R / DIST);                     // angular radius of planet
  float off = ((1.0 - uCrest) - 0.5) * 2.0;          // crest offset from centre
  float tilt = angRad + atan(off * tanH);
  vec3 sc = DIST * vec3(0.0, -sin(tilt), -cos(tilt));

  // The sun is aimed at a target *screen* position rather than a fixed world
  // vector, so the flare lands in the same place at every aspect ratio.
  // Centred, and a touch BELOW the crest so the body occludes its lower half
  // and it reads as rising from behind the planet.
  vec2 sunNdc = vec2(0.0, (uCrest - 0.5) * 2.0 + 0.010);
  vec3 sunDir = normalize(vec3(sunNdc.x * aspect * tanH, sunNdc.y * tanH, -1.0));

  // ── ray/sphere ───────────────────────────────────────────────────────
  vec3 oc = -sc;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - R * R;
  float disc = b * b - c;

  bool hit = false;
  float tHit = 0.0;
  if (disc > 0.0) {
    tHit = -b - sqrt(disc);
    hit = tHit > 0.0;
  }

  // Perpendicular distance from the planet centre to the ray — drives the
  // atmosphere shell for rays that miss the body.
  float perp = length(oc - rd * dot(oc, rd));

  vec3 col = GROUND * 0.30;

  // ── background: stars + the sun ──────────────────────────────────────
  if (!hit) {
    col += vec3(0.80, 0.87, 1.0) * stars(rd, t) * 0.95;

    float sa = clamp(dot(rd, sunDir), 0.0, 1.0);
    float coreD = smoothstep(0.999880, 0.999975, sa);
    float bloom = pow(sa, 5200.0);
    float halo  = pow(sa, 420.0);
    // Tight: at a low exponent the rays reach the headline and grey it out.
    float glow  = pow(sa, 85.0);

    // Radiating spikes. Stacked harmonics in the screen-space angle around
    // the sun give uneven ray lengths, which is what sells a real flare.
    vec2 dv = (ndc - sunNdc) * vec2(aspect, 1.0);
    float ra = atan(dv.y, dv.x);
    float spikes = 0.5
                 + 0.34 * sin(ra * 7.0 + 1.3 + t * 0.05)
                 + 0.24 * sin(ra * 13.0 - 0.7 - t * 0.03)
                 + 0.15 * sin(ra * 23.0 + 2.1);
    spikes = pow(clamp(spikes, 0.0, 1.0), 2.6);

    vec3 sunCol = mix(SUN_WARM, SUN_CORE, coreD);
    col += sunCol * (coreD * 3.4 + bloom * 1.6 + halo * 0.50);
    // Rays ride the mid-falloff glow so they fan out from the disc.
    col += mix(SUN_WARM, SUN_CORE, 0.25) * glow * (0.06 + spikes * 0.45);
  }

  // ── planet ───────────────────────────────────────────────────────────
  if (hit) {
    vec3 ph = rd * tHit;
    vec3 n = normalize(ph - sc);

    // Equirectangular lookup. Longitude scrolls with time = planet rotation.
    float lon = atan(n.z, n.x);
    float lat = asin(clamp(n.y, -1.0, 1.0));
    vec2 tuv = vec2(lon / (2.0 * PI) + 0.5 + t * 0.0065, 0.5 - lat / PI);

    vec3 day = texture2D(uDay, tuv).rgb;

    // Cloud deck rotates slightly faster than the surface.
    vec2 cuv = vec2(lon / (2.0 * PI) + 0.5 + t * 0.0090, 0.5 - lat / PI);
    float cloud = texture2D(uClouds, cuv).r;

    float ndl = dot(n, sunDir);
    // Soft terminator — a hard step reads as CGI.
    float lightAmt = smoothstep(-0.12, 0.28, ndl);

    // Squared for contrast, then held down — the planet should sit dark so the
    // sunrise is the only bright thing in frame.
    vec3 surf = day * day * 0.85;
    surf = mix(surf, vec3(0.82), smoothstep(0.10, 0.75, cloud) * 0.72);

    vec3 lit = surf * lightAmt;

    // Warm the light as it grazes the terminator, like real sunrise.
    float graze = smoothstep(0.45, -0.02, ndl) * lightAmt;
    lit *= mix(vec3(1.0), SUN_WARM * 1.25, graze * 0.75);

    // Rim: atmosphere seen through a long slant path at the edge of the disc.
    float ndv = clamp(dot(n, -rd), 0.0, 1.0);
    float rim = pow(1.0 - ndv, 3.4);
    float rimLit = smoothstep(-0.35, 0.55, ndl);
    lit += mix(SKY_MID, SKY_PALE, rimLit) * rim * (0.28 + 2.4 * rimLit);

    // Night side: earthshine off the surface itself, not a flat fill, so the
    // continents stay faintly readable now the sun sits mostly behind.
    lit += surf * 0.07 * (1.0 - lightAmt);
    lit += GROUND * 0.16 * (1.0 - lightAmt);

    // Forward-scattered sunlight spilling across the surface below the sun.
    // With the sun directly behind, this is what lights the planet at all —
    // and it is the warm pool under the sun in the reference shot.
    float spill = pow(clamp(dot(rd, sunDir), 0.0, 1.0), 70.0);
    lit += mix(SUN_WARM, SUN_CORE, 0.30) * spill * (0.22 + surf.r * 0.55);

    col = lit;
  }

  // ── atmosphere shell for rays that miss the body ─────────────────────
  float outside = max(perp - R, 0.0);
  float shell = exp(-outside / 0.012);
  float haze  = exp(-outside / 0.055);

  // Forward scattering: brightest where we look through atmosphere toward
  // the sun, which is what makes the sunrise arc.
  vec3 limbPoint = normalize(oc - rd * dot(oc, rd)) * -1.0;
  float scat = clamp(dot(normalize(limbPoint - sc + sc), sunDir), 0.0, 1.0);
  float fwd = pow(clamp(dot(rd, sunDir) * 0.5 + 0.5, 0.0, 1.0), 3.0);

  float behind = hit ? 0.0 : 1.0;
  // Blue at the edges of the arc, warming to sunrise directly over the sun —
  // the two-tone rim is the thing that reads as real in the reference.
  float warmth = pow(fwd, 6.0);
  vec3 shellCol = mix(mix(SKY_MID, SKY_PALE, fwd), SUN_WARM, warmth * 0.85);
  vec3 hazeCol  = mix(mix(SKY_BRIGHT, SKY_HIGH, fwd), SUN_WARM, warmth * 0.7);

  col += shellCol * shell * behind * (0.35 + 3.4 * fwd);
  col += hazeCol * haze * behind * (0.06 + 1.1 * fwd);

  // ── grade ────────────────────────────────────────────────────────────
  col = mix(GROUND * 0.45, col, smoothstep(0.0, 0.18, uv.y));
  float vig = 1.0 - 0.28 * pow(length(vec2((uv.x - 0.5) * 1.1, uv.y - 0.62)), 2.0);
  col *= vig;

  col = col / (col + vec3(1.05)) * 1.60;

  gl_FragColor = vec4(col, 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)
  if (!sh) return null
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('HeroPlanet shader failed:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

function loadTexture(gl: WebGLRenderingContext, url: string, onReady: () => void) {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  // 1px placeholder so the first frames render rather than sampling nothing.
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([10, 18, 32, 255])
  )
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img)
    // 2048x1024 is power-of-two, so REPEAT + mipmaps are both legal in WebGL1.
    // Mipmaps matter here: the limb compresses the texture hard.
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    onReady()
  }
  img.onerror = () => console.warn('HeroPlanet: texture failed to load', url)
  img.src = url
  return tex
}

export default function HeroPlanet({
  className = '',
  /** Selector for the element the horizon should sit above (the product card). */
  anchor,
  /** Gap in px between the horizon and the top of that element. */
  anchorGap = 110,
}: {
  className?: string
  anchor?: string
  anchorGap?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'high-performance',
    }) as WebGLRenderingContext | null
    if (!gl) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const prog = gl.createProgram()
    if (!prog) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('HeroPlanet link failed:', gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uMouse = gl.getUniformLocation(prog, 'uMouse')
    const uCrest = gl.getUniformLocation(prog, 'uCrest')
    const uDay = gl.getUniformLocation(prog, 'uDay')
    const uClouds = gl.getUniformLocation(prog, 'uClouds')

    const noop = () => {}
    const texDay = loadTexture(gl, '/earth-day.jpg', noop)
    const texClouds = loadTexture(gl, '/earth-clouds.jpg', noop)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texDay)
    gl.uniform1i(uDay, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, texClouds)
    gl.uniform1i(uClouds, 1)

    gl.disable(gl.BLEND)
    gl.clearColor(0, 0, 0, 1)

    let scale = 1.0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.round(rect.width * dpr * scale))
      const h = Math.max(1, Math.round(rect.height * dpr * scale))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)

      let crest = 0.55
      const el = anchor ? document.querySelector(anchor) : null
      if (el && rect.height > 0) {
        const top = el.getBoundingClientRect().top - rect.top
        crest = 1 - (top - anchorGap) / rect.height
      }
      gl.uniform1f(uCrest, Math.min(0.85, Math.max(0.25, crest)))
    }

    const target = { x: 0.5, y: 0.5 }
    const cur = { x: 0.5, y: 0.5 }
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      target.x = (e.clientX - rect.left) / Math.max(1, rect.width)
      target.y = 1 - (e.clientY - rect.top) / Math.max(1, rect.height)
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    let raf = 0
    const start = performance.now()
    let last = start
    let acc = 0
    let frames = 0
    let settled = false

    const frame = (now: number) => {
      // Short sample: if we're not holding ~45fps, drop internal resolution
      // once rather than stuttering. 20 frames so it reacts in well under a
      // second even on slow hardware.
      if (!settled) {
        acc += now - last
        frames++
        if (frames >= 20) {
          if (acc / frames > 22) {
            scale = 0.65
            resize()
          }
          settled = true
        }
      }
      last = now

      cur.x += (target.x - cur.x) * 0.04
      cur.y += (target.y - cur.y) * 0.04
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(uTime, reduced ? 60 : (now - start) / 1000)
      gl.uniform2f(uMouse, cur.x, cur.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!reduced) raf = requestAnimationFrame(frame)
    }

    resize()
    raf = requestAnimationFrame(frame)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
      // Never call WEBGL_lose_context here: StrictMode runs effects
      // mount → cleanup → mount and getContext() returns the same context
      // object, so the remount would inherit a dead one.
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
      gl.deleteTexture(texDay)
      gl.deleteTexture(texClouds)
    }
  }, [anchor, anchorGap])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 size-full ${className}`}
    />
  )
}
