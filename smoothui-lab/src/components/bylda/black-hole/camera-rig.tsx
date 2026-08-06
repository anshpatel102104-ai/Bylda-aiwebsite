import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type PerspectiveCamera } from 'three'

const TMP = new Vector3()

/**
 * The camera move.
 *
 * Two constraints shape this. First, the disk has to stay close to edge-on:
 * that is the angle where the far side is lensed up over the top of the shadow
 * and back under the bottom, and it is the whole reason to raytrace geodesics
 * instead of drawing a ring. Tip more than ~15° above the plane and the
 * silhouette turns into an ordinary disk with a dark dot in it.
 *
 * Second, this sits behind headline text, so the motion has to stay readable
 * without pulling the eye off the copy. The orbit comes round in about a
 * minute, and the elevation and distance drift on periods that do not divide
 * into it — so the framing never repeats exactly, and nothing in it ever
 * arrives on a beat.
 */
export default function CameraRig({
  fitRadius = 13,
  elevation = 0.16,
  /** Shifts the hole off-centre in the frame so copy can sit clear of it. */
  offsetX = 0,
  offsetY = 0,
  parallax = 0.22,
  paused = false,
}: {
  /** World radius that must stay inside the frame — the disk's outer edge. */
  fitRadius?: number
  elevation?: number
  offsetX?: number
  offsetY?: number
  parallax?: number
  paused?: boolean
}) {
  const look = useRef(new Vector3(0, 0, 0))
  const pointer = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const t = paused ? 12.0 : state.clock.elapsedTime

    // Damped pointer follow. Reading state.pointer directly would snap the
    // camera on every mouse move; this trails it with a time constant of about a
    // third of a second, which reads as weight.
    const k = paused ? 0 : 1 - Math.pow(0.02, delta)
    pointer.current.x += (state.pointer.x - pointer.current.x) * k
    pointer.current.y += (state.pointer.y - pointer.current.y) * k

    const az = t * 0.105 + pointer.current.x * parallax
    const el = elevation + Math.sin(t * 0.191) * 0.060 + pointer.current.y * parallax * 0.4

    // Frame to the viewport rather than to a fixed distance.
    //
    // The camera's fov is vertical, so on a tall narrow hero the horizontal
    // field collapses and a hard-coded distance puts the viewer inside the
    // disk. Solving for distance from the *horizontal* half-angle is what keeps
    // the composition intact from a phone to an ultrawide.
    const cam = state.camera as PerspectiveCamera
    const aspect = state.size.width / Math.max(state.size.height, 1)
    const hHalf = Math.atan(Math.tan((cam.fov * Math.PI) / 360) * aspect)

    // How much of the width the disk should occupy — deliberately more than all
    // of it. Fitting the disk inside the frame turns the hole into an object
    // sitting on a background; letting it run off both edges makes it the
    // environment the page is inside, which is the whole difference between a
    // decorative render and a hero. The cost is that the outer disk is cropped,
    // and the outer disk is the least interesting part of it.
    const w = Math.min(Math.max((aspect - 0.35) / 0.65, 0), 1)
    const fill = 1.10 + (0.78 - 1.10) * (w * w * (3 - 2 * w))

    // Proportional breathing, so the drift reads the same at every distance.
    const d = Math.max(fitRadius / (fill * Math.tan(hHalf)), 15) * (1 + Math.sin(t * 0.128) * 0.032)

    const ce = Math.cos(el)
    state.camera.position.set(Math.cos(az) * ce * d, Math.sin(el) * d, Math.sin(az) * ce * d)

    // Aim off-centre by pushing the look-at target, in units of frame height so
    // that the composition is identical at every distance and aspect ratio.
    // Raising the target aims the camera up, which moves the hole down the frame.
    const vTan = Math.tan((cam.fov * Math.PI) / 360)
    const frameH = 2 * d * vTan

    // Vertical placement has to flip sense between layouts. On a wide viewport
    // the hero is barely taller than the fold, so the canvas centre is roughly
    // where the eye is and the hole belongs below it, under the copy. On a phone
    // the same section is twice the height of the screen, so the canvas centre
    // is well below the fold and the hole has to sit *above* it to be seen at
    // all. Interpolating on the same aspect factor as the fill keeps the two
    // ends consistent.
    const autoY = -0.03 + 0.15 * (w * w * (3 - 2 * w))

    TMP.set(0, 0, 0)
    TMP.y += (autoY + offsetY) * frameH
    if (offsetX !== 0) {
      const right = new Vector3(-Math.sin(az), 0, Math.cos(az))
      TMP.addScaledVector(right, offsetX * frameH * aspect)
    }
    look.current.lerp(TMP, 0.1)
    state.camera.lookAt(look.current)
  })

  return null
}
