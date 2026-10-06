/** The film's chapter map. Times in seconds. */

export type Env = 'black' | 'pearl'

export interface Chapter {
  id: string
  /** Loop word: Observe, Understand, ... */
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
    id: 'observe', label: 'Observe', caption: 'Bylda maps the call', start: 0, end: 6, env: 'black', ribbon: 0, still: 4.5,
    describe: 'A 38 minute call becomes a timeline of stages, events, talk turns, control and sentiment. A pricing objection is marked at 18:42.',
  },
  {
    id: 'understand', label: 'Understand', caption: 'It explains the moment', start: 6, end: 13, env: 'black', ribbon: 1, still: 12.2,
    describe: 'Bylda explains where the call was lost: the rep answered 0.4 seconds into the objection and offered a discount. Interruptions are flagged as a leak.',
  },
  {
    id: 'profile', label: 'Profile', caption: 'You see the rep\u2019s pattern', start: 13, end: 19, env: 'pearl', ribbon: 2, still: 18,
    describe: 'The rep’s 30 day behavior profile against the team: strong discovery, but held control in only 3 of 9 objections and 1.5 interruptions per objection.',
  },
  {
    id: 'recommend', label: 'Recommend', caption: 'The rep gets one change', start: 19, end: 25, env: 'pearl', ribbon: 3, still: 23.6,
    describe: 'The rep’s morning brief gives one focus: after an objection, pause before you respond. Current pause 0.4 seconds, target 1.5.',
  },
  {
    id: 'measure', label: 'Measure', caption: 'You measure what changed', start: 25, end: 32, env: 'black', ribbon: 1, still: 31.2,
    describe: 'A completed focus for another rep: talk share during objections fell from a median of 65% to 51% across 21 calls. Association, not proof.',
  },
  {
    id: 'pattern', label: 'Coach', caption: 'You coach who needs it', start: 32, end: 38, env: 'pearl', ribbon: 0, still: 35.6,
    describe: 'Across the team, calls with an interruption during an objection booked a next step 41% of the time versus 72% without. The manager sees who to coach today and why.',
  },
]

export const DURATION = 38

export const chapterAt = (t: number) => {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (t >= CHAPTERS[i].start) return i
  return 0
}
