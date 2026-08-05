import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { HalfFloatType, Vector2, WebGLRenderTarget } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

/**
 * Bloom, using three's own post-processing passes rather than a fourth package.
 *
 * This is the difference between "a bright orange ring" and "a light source".
 * The disk shader deliberately emits values well above 1.0 where the approaching
 * side is beamed, and those would simply clip to white on their own; bloom is
 * what spreads that energy into the surrounding pixels and makes it read as
 * glare. The chain runs at half-float precision end to end so the overbright
 * values survive to the bloom pass, and only the final OutputPass tonemaps back
 * into display range.
 *
 * Taking over the render loop (priority 1) disables R3F's own render call, so
 * the scene is drawn exactly once per frame, through the composer.
 */
export default function Bloom({
  strength = 0.9,
  radius = 0.65,
  threshold = 0.55,
}: {
  strength?: number
  radius?: number
  threshold?: number
}) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const dpr = useThree((s) => s.viewport.dpr)

  const { composer, bloomPass } = useMemo(() => {
    // An explicit half-float target: the default would be fine on most builds,
    // but an 8-bit chain silently clamps the beamed highlights to 1.0 before
    // bloom ever sees them, which quietly removes the entire effect.
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 0 })
    const c = new EffectComposer(gl, target)
    c.addPass(new RenderPass(scene, camera))
    const b = new UnrealBloomPass(new Vector2(1, 1), strength, radius, threshold)
    c.addPass(b)
    // Applies the renderer's tone mapping and the sRGB conversion that the
    // composer's intermediate targets skipped.
    c.addPass(new OutputPass())
    return { composer: c, bloomPass: b }
  }, [gl, scene, camera, strength, radius, threshold])

  useEffect(() => {
    composer.setPixelRatio(dpr)
    composer.setSize(size.width, size.height)
  }, [composer, size.width, size.height, dpr])

  useEffect(() => {
    bloomPass.strength = strength
    bloomPass.radius = radius
    bloomPass.threshold = threshold
  }, [bloomPass, strength, radius, threshold])

  useEffect(() => () => composer.dispose(), [composer])

  useFrame(() => {
    composer.render()
  }, 1)

  return null
}
