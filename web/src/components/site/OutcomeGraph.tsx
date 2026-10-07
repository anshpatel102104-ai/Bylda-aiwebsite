import { ease, seg } from '../../lib/motion'

/**
 * The behavioral outcome graph, as a concept. The app lists it as
 * "direction only", so it always renders ghosted with a Concept label.
 * Node labels reuse the sample data shown elsewhere on the page.
 */
const NODES = [
  { x: 70, y: 150, kind: 'Event', label: '18:42 pricing objection' },
  { x: 290, y: 80, kind: 'Behavior', label: 'Answered in 0.4s' },
  { x: 290, y: 220, kind: 'Behavior', label: 'Offered 12% off' },
  { x: 520, y: 150, kind: 'Pattern', label: '4 of 6 price objections' },
  { x: 750, y: 90, kind: 'Outcome', label: 'Next step 41% vs 72%' },
  { x: 750, y: 215, kind: 'Outcome', label: 'Objection repeated later' },
]
const EDGES: ReadonlyArray<[number, number]> = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5]]

/** p (0..1) reveals the chain left to right: nodes by column, each edge after its source. */
export function OutcomeGraph({ className = '', p = 1 }: { className?: string; p?: number }) {
  const col = (x: number) => (x - 70) / 680 // 0..1 across the columns
  const node = (x: number) => ease(seg(p, col(x) * 0.75, col(x) * 0.75 + 0.2))
  return (
    <figure className={`og ${className}`} aria-label="Concept: the behavioral outcome graph links an event to behaviors, a pattern and outcomes. Not in the product yet.">
      <span className="status-tag og-tag" data-status="concept">Concept</span>
      <svg viewBox="0 0 900 300" role="presentation">
        {EDGES.map(([a, b], i) => (
          <path key={i} d={`M${NODES[a].x + 60} ${NODES[a].y} C ${(NODES[a].x + NODES[b].x) / 2 + 40} ${NODES[a].y}, ${(NODES[a].x + NODES[b].x) / 2 + 20} ${NODES[b].y}, ${NODES[b].x - 60} ${NODES[b].y}`}
            fill="none" stroke="var(--silver-300)" strokeWidth="1.2" strokeDasharray="4 5" style={{ opacity: node(NODES[b].x) }} />
        ))}
        {NODES.map((n, i) => (
          <g key={i} transform={`translate(${n.x - 80} ${n.y - 26})`} style={{ opacity: node(n.x) }}>
            <rect width="160" height="52" rx="10" fill="#fff" stroke="var(--silver-200)" />
            <text x="12" y="20" fontFamily="var(--font-data)" fontSize="9.5" letterSpacing="0.06em" fill="var(--silver-600)">{n.kind.toUpperCase()}</text>
            <text x="12" y="38" fontFamily="var(--font-product)" fontSize="12.5" fill="var(--ink)">{n.label}</text>
          </g>
        ))}
      </svg>
    </figure>
  )
}
