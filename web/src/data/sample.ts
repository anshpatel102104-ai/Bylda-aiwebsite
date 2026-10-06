/**
 * Sample data for every rebuilt app fragment on the site.
 *
 * Source of truth: the app prototypes in Figma
 * (file HWdVvVXWqJl4BFD9MZ5vgW, page "19 Prototypes"), exported to
 * /reference/figma-export. Each block names the screen it comes from.
 *
 * Copy rule for the site: no em dashes. Where the app copy uses one, the
 * rebuilt fragment uses a comma or colon instead. Meaning is unchanged.
 *
 * Anything not read off a screen is flagged ILLUSTRATIVE and renders with a label.
 */

export type Tone = 'improve' | 'regress' | 'attention' | 'info' | 'neutral'

/* ------------------------------------------------------------------ */
/* Call Review: Acme Logistics (20:1802)                               */
/* ------------------------------------------------------------------ */

const sec = (mmss: string) => {
  const [m, s] = mmss.split(':').map(Number)
  return m * 60 + s
}

export const CALL = {
  title: 'Acme Logistics, pricing follow-up',
  rep: 'Jordan Reyes',
  date: 'Mon Sep 28',
  duration: '38:12',
  durationSec: sec('38:12'),
  kind: 'Negotiation call',
  status: 'Stalled',
  marker: { time: '18:42', sec: sec('18:42'), label: 'pricing objection' },
  /** Summary metrics column. */
  talk: 61,
  listen: 39,
  interruptions: '5 (3 in pricing)',
  monologue: '1:42 at 19:02',
  questions: '14 · 9 in discovery',
  nextStep: 'None set',
} as const

export type EventKind = 'objection' | 'interruption' | 'monologue' | 'question' | 'positive'

/** Event lane. Positions read off the Call Review timeline. */
export const CALL_EVENTS: ReadonlyArray<{ sec: number; kind: EventKind }> = [
  { sec: sec('4:30'), kind: 'question' },
  { sec: sec('6:00'), kind: 'question' },
  { sec: sec('7:13'), kind: 'question' },
  { sec: sec('8:06'), kind: 'question' },
  { sec: sec('9:24'), kind: 'question' },
  { sec: sec('10:10'), kind: 'positive' },
  { sec: sec('10:59'), kind: 'question' },
  { sec: sec('12:36'), kind: 'question' },
  { sec: sec('13:17'), kind: 'question' },
  { sec: sec('15:07'), kind: 'question' },
  { sec: sec('18:42'), kind: 'objection' },
  { sec: sec('18:44'), kind: 'interruption' },
  { sec: sec('27:06'), kind: 'objection' },
  { sec: sec('29:27'), kind: 'interruption' },
  { sec: sec('31:04'), kind: 'interruption' },
]

/** Stage lane. Discovery 3:30 to 17:00 is stated in the call analysis. */
export const CALL_STAGES: ReadonlyArray<{ from: number; to: number; label: string; hot?: boolean }> = [
  { from: 0, to: sec('3:30'), label: 'Opening' },
  { from: sec('3:30'), to: sec('17:00'), label: 'Discovery' },
  { from: sec('17:00'), to: sec('18:42'), label: '' },
  { from: sec('18:42'), to: sec('33:00'), label: 'Pricing', hot: true },
  { from: sec('33:00'), to: sec('38:12'), label: 'Close (no next step)' },
]

/* ------------------------------------------------------------------ */
/* Call Review: Analysis tab, "Where the call was lost" (20:1802)       */
/* ------------------------------------------------------------------ */

export const WHERE_LOST = {
  observation: 'You responded to the pricing objection 0.4s after the CFO started it, and offered 12% off within 5 seconds.',
  interpretation: 'He hadn’t finished. His concern was rollout (“whether my team will actually” adopt it), not price. The discount answered a question he didn’t ask.',
  doNext: 'Pause. Ask: “Whether your team will actually…what?” Then handle adoption risk with the Brightline rollout story.',
  evidence: { time: '18:42', quote: '“Honestly the number isn’t the problem, it’s whether my team will actually–”' },
  confidence: 'High',
  pattern: 'Pattern seen in 4 of Jordan’s last 6 price objections',
} as const

/** "Behaviors on this call". */
export const CALL_BEHAVIORS: ReadonlyArray<{ label: string; value: string; tag: string; tone: Tone }> = [
  { label: 'Question quality', value: '9 discovery Qs, 4 follow-ups', tag: 'Strong', tone: 'improve' },
  { label: 'Talk / listen', value: '61 / 39, 78 / 22 after 18:42', tag: 'Shifted', tone: 'attention' },
  { label: 'Interruptions', value: '5 · 3 during pricing', tag: 'Leak', tone: 'regress' },
  { label: 'Objection handling', value: 'Answered before diagnosing', tag: 'Leak', tone: 'regress' },
  { label: 'Pacing', value: '168 to 201 wpm after objection', tag: 'Rushed', tone: 'attention' },
]
export const CALL_BEHAVIOR_HIGHLIGHT = 2

/* ------------------------------------------------------------------ */
/* Rep Profile: Jordan Reyes, Behavior profile 30 days (20:1633)        */
/* ------------------------------------------------------------------ */

export interface ProfileRow {
  label: string
  rep: string
  /** Numeric part of rep, for count-up. */
  repNum: number
  repDecimals?: number
  /** Text after the counted number. */
  repSuffix?: string
  /** Text before the counted number (talk/listen). */
  team: string
  tag: 'Strength' | 'Watch' | 'Leak' | 'Rushed'
  tone: Tone
  /** 8-week sparkline, shape read off the screen, 0..1. */
  spark: ReadonlyArray<number>
}

export const PROFILE: ReadonlyArray<ProfileRow> = [
  { label: 'Discovery depth', rep: '2.9 follow-ups', repNum: 2.9, repDecimals: 1, repSuffix: ' follow-ups', team: '2.4', tag: 'Strength', tone: 'improve', spark: [0.2, 0.3, 0.35, 0.4, 0.45, 0.45, 0.6, 0.7] },
  { label: 'Clarifying questions', rep: '2.8 / topic', repNum: 2.8, repDecimals: 1, repSuffix: ' / topic', team: '2.4', tag: 'Strength', tone: 'improve', spark: [0.2, 0.25, 0.3, 0.3, 0.75, 0.8, 0.8, 0.8] },
  { label: 'Next-step setting', rep: '86%', repNum: 86, repSuffix: '%', team: '74%', tag: 'Strength', tone: 'improve', spark: [0.2, 0.3, 0.5, 0.65, 0.55, 0.6, 0.75, 0.75] },
  { label: 'Talk / listen', rep: '58 / 42', repNum: 58, repSuffix: ' / 42', team: '52 / 48', tag: 'Watch', tone: 'neutral', spark: [0.3, 0.35, 0.5, 0.6, 0.6, 0.62, 0.7, 0.7] },
  { label: 'Held control in objections', rep: '3 of 9', repNum: 3, repSuffix: ' of 9', team: '58%', tag: 'Leak', tone: 'regress', spark: [0.8, 0.75, 0.72, 0.65, 0.58, 0.5, 0.42, 0.3] },
  { label: 'Interruptions / objection', rep: '1.5', repNum: 1.5, repDecimals: 1, team: '0.6', tag: 'Leak', tone: 'regress', spark: [0.2, 0.22, 0.25, 0.3, 0.38, 0.5, 0.6, 0.75] },
  { label: 'Early discounting', rep: '4 of 6 price talks', repNum: 4, repSuffix: ' of 6 price talks', team: '1 of 6', tag: 'Leak', tone: 'regress', spark: [0.2, 0.2, 0.35, 0.5, 0.6, 0.62, 0.65, 0.8] },
  { label: 'Pacing after objection', rep: '201 wpm', repNum: 201, repSuffix: ' wpm', team: '172', tag: 'Rushed', tone: 'attention', spark: [0.2, 0.25, 0.4, 0.45, 0.5, 0.5, 0.55, 0.65] },
]
export const PROFILE_META = 'Account Executive · Mid-Market · 38 calls analyzed (30d)'

/* ------------------------------------------------------------------ */
/* Rep Home: Daily Brief, Today's focus (20:2362)                      */
/* ------------------------------------------------------------------ */

export const BRIEF = {
  date: 'Tuesday · September 29 · 60-second brief',
  greeting: 'Morning, Jordan.',
  summary: 'Yesterday you ran strong discovery on 3 of 4 calls. Your follow-up questions on Brightline were the best on the team. But you lost control during pricing on Acme Logistics and Kestrel Labs. Same moment both times.',
} as const

export const FOCUS = {
  text: 'After an objection, pause before you respond.',
  assigned: 'Assigned by Dana W. · Day 2 of 10',
  why: 'On your calls, answering in under a second came right before the prospect repeated the objection: 5 of 6 times. When you paused, they told you the real concern.',
  tryNext: 'One breath. Then: “When you say price, what’s behind that?” Don’t mention discount until they answer.',
  pause: { from: 0.4, to: 1.5 },
  primary: 'Got it, I’ll try this today',
  secondary: 'Hear the 18:42 moment',
} as const

/* ------------------------------------------------------------------ */
/* Behavior Change Result: Alex Morgan (20:2279)                       */
/* ------------------------------------------------------------------ */

export const RESULT = {
  rep: 'Alex Morgan',
  headline: 'The coaching worked. Alex talks less when prospects push back.',
  held: 'Held · 3 weeks',
  focus: 'Focus: “When a prospect objects, ask before you explain.” Assigned Sep 1 by Dana',
  chartLabel: 'Rep talk share during objections · per call',
  assigned: 'Focus assigned · Sep 1',
  /** Per-call talk share, read off the dot plot. */
  before: [68, 63, 71, 66, 62, 64, 70, 61, 65, 63],
  after: [58, 55, 56, 52, 51, 50, 49, 52, 47, 48, 49],
  medianBefore: 65,
  medianAfter: 51,
  caption: 'Each dot is one call with at least one objection. 10 calls before, 11 after.',
  rows: [
    { label: 'Talk share in objections', from: '65%', to: '51%' },
    { label: 'Asked before explaining', from: '2 of 10', to: '9 of 11' },
    { label: 'Objection repeated later', from: '60%', to: '27%' },
    { label: 'Next step booked', from: '60%', to: '73%' },
  ],
  confidence: 'n = 21 calls. Same team, same pricing. Bylda can’t rule out other factors, but the change started the week of the focus.',
} as const

/* ------------------------------------------------------------------ */
/* Behavior Detail: Interrupting during objections (20:2128)           */
/* ------------------------------------------------------------------ */

export const PATTERN = {
  behavior: 'Interrupting during objections',
  headline: 'Calls where reps interrupted during an objection were less likely to end with a next step.',
  footnote: 'An association across 142 calls, not proof the interruption caused it.',
  confidence: 'Medium',
  withN: 38,
  withoutN: 104,
  rows: [
    { label: 'Next step booked', with: 41, without: 72, read: 'Strong signal' },
    { label: 'Advanced a stage (14d)', with: 22, without: 47, read: 'Strong signal' },
    { label: 'Objection repeated later', with: 63, without: 24, read: 'Strong signal' },
  ],
  closedWon: { with: '3 of 7', without: '8 of 12', read: 'Too few closed' },
} as const

/* ------------------------------------------------------------------ */
/* Manager Home: Feed, Coach today (41:17331)                          */
/* ------------------------------------------------------------------ */

export const MANAGER = {
  greeting: 'Good morning, Dana.',
  insight: 'Jordan lost control during 4 of 6 price objections this week.',
  insightBody: 'He answers in ~0.4s, before the prospect finishes, then defends price. Reps who hold these calls pause ~1.8s and ask one question first.',
  insightMeta: 'Confidence high · n = 6 objections · 4 calls',
  coachToday: [
    { initials: 'JR', name: 'Jordan', focus: 'objection handling', why: '4 of 6 price objections' },
    { initials: 'AM', name: 'Alex', focus: 'call control', why: 'Monologues > 2 min in 5 calls' },
    { initials: 'MK', name: 'Mia', focus: 'discovery depth', why: '1.1 follow-ups / topic' },
  ],
} as const
