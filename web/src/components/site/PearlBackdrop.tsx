/**
 * The page's pearl: a fixed nacre field behind every light section. Four soft
 * tints drift very slowly (transform only) and one specular band slides
 * across, so glass surfaces above it pick up a moving sheen. Static under
 * reduced motion, and on phones where it would cost battery.
 */
export function PearlBackdrop() {
  return (
    <div className="pearl" aria-hidden="true">
      <i className="pearl-tint pt-lilac" />
      <i className="pearl-tint pt-mint" />
      <i className="pearl-tint pt-peach" />
      <i className="pearl-tint pt-sky" />
      <i className="pearl-sheen" />
      <i className="pearl-grain" />
    </div>
  )
}
