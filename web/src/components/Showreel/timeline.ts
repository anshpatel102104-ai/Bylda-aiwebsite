/**
 * The film's chapter map. Times in seconds.
 *
 * The order teaches Bylda's theory: Events become Behaviors, Behaviors form
 * Patterns, Patterns explain Outcomes. Then the loop closes: Change, Measure.
 */

export type Env = 'black' | 'pearl'

export interface Chapter {
  id: string
  /** Theory word: Event, Behavior, Pattern, Outcome, Change, Measure. */
  label: string
  /** What happens, as an action. Shown in the chapter rail and the stage pill. */
  caption: string
  start: number
  end: number
  env: Env
  /** Ribbon arc variant for the chapter background. */
  ribbon: number
  /** End state of the chapter, used for reduced-motion stills and screenshots. */
  still: number
  /** One sentence for screen readers. */
  describe: string
}

export const CHAPTERS: ReadonlyArray<Chapter> = [
  {
    id: 'event', label: 'Event', caption: 'A call becomes a timeline', start: 0, end: 6, env: 'black', ribbon: 0, still: 4.5,
    describe: 'A 38 minute call becomes a timeline of stages, events, talk turns, control and sentiment. A pricing objection is marked at 18:42.',
  },
  {
    id: 'behavior', label: 'Behavior', caption: 'Bylda names what happened', start: 6, end: 12.5, env: 'black', ribbon: 1, still: 11.6,
    describe: 'Bylda explains where the call was lost: the rep answered 0.4 seconds into the objection and offered a discount. Interruptions are flagged as a leak.',
  },
  {
    id: 'pattern', label: 'Pattern', caption: 'It repeats across calls', start: 12.5, end: 18, env: 'black', ribbon: 2, still: 16.6,
    describe: 'The rep’s 30 day behavior profile: strong discovery, but held control in only 3 of 9 objections and 1.5 interruptions per objection, rising for eight weeks.',
  },
  {
    id: 'outcome', label: 'Outcome', caption: 'It is tied to fewer next steps', start: 18, end: 24.5, env: 'black', ribbon: 3, still: 22.9,
    describe: 'Across 142 calls, calls with an interruption during an objection booked a next step 41% of the time versus 72% without. An association, not proof. The manager assigns coaching to Jordan.',
  },
  {
    id: 'change', label: 'Change', caption: 'The rep gets one change', start: 24.5, end: 30.5, env: 'black', ribbon: 1, still: 29.1,
    describe: 'The rep’s morning brief gives one focus: after an objection, pause before you respond. Current pause 0.4 seconds, target 1.5.',
  },
  {
    id: 'measure', label: 'Measure', caption: 'You measure what changed', start: 30.5, end: 38, env: 'black', ribbon: 0, still: 35.4,
    describe: 'A completed focus for another rep: talk share during objections fell from a median of 65% to 51% across 21 calls. Association, not proof.',
  },
]

export const DURATION = 38

export const chapterAt = (t: number) => {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (t >= CHAPTERS[i].start) return i
  return 0
}
