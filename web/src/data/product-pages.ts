/**
 * One page per item in the Product menu, served at /product/<slug>.
 *
 * Copy follows the same rules as site.ts: claims come from the Product
 * Architecture page and the sample data in sample.ts, status follows the
 * sitemap legend, and roadmap or concept pages say so before anything else.
 * No em dashes.
 */
import type { Status } from './site'

export type Group = 'Understand' | 'Coach' | 'Measure' | 'Next'
export type ScreenId =
  | 'timeline' | 'analysis' | 'profile' | 'focus' | 'results'
  | 'coaching' | 'queue' | 'report' | 'trends' | 'graph' | 'buyers' | 'experiment'
export type LoopStep = 'event' | 'behavior' | 'pattern' | 'outcome' | 'change'

export interface ProductPage {
  slug: string
  group: Group
  label: string
  /** One line for the menu. */
  detail: string
  status: Status
  screen: ScreenId
  /** True when the screen is not read off an app prototype. */
  illustrative?: boolean
  title: string
  lede: string
  question: string
  metaTitle: string
  metaDescription: string
  steps: ReadonlyArray<{ title: string; text: string }>
  anatomy: ReadonlyArray<{ label: string; text: string }>
  uses: ReadonlyArray<{ role: 'Managers' | 'Reps'; text: string }>
  limits: ReadonlyArray<string>
  loop: LoopStep
  /** Optional longer read on the static site. */
  more?: { label: string; href: string }
}

export const GROUP_BLURB: Record<Group, string> = {
  Understand: 'What happened on the call, named as behavior.',
  Coach: 'One change per rep, delivered where they start the day.',
  Measure: 'Whether the behavior changed, with the confidence stated.',
  Next: 'Where the system goes after V1. Not in the product yet.',
}

export const LOOP_STEPS: ReadonlyArray<{ id: LoopStep; label: string; line: string }> = [
  { id: 'event', label: 'Events', line: 'What happened on the call' },
  { id: 'behavior', label: 'Behaviors', line: 'How the rep acted' },
  { id: 'pattern', label: 'Patterns', line: 'What repeats, for whom' },
  { id: 'outcome', label: 'Outcomes', line: 'What it travels with' },
  { id: 'change', label: 'Change', line: 'One focus, then measured' },
]

export const STATUS_NOTE: Record<Exclude<Status, 'v1'>, { title: string; text: string }> = {
  roadmap: { title: 'Roadmap', text: 'Planned, not in the first release. The screen below is an illustrative layout built from the same sample data as the rest of the site.' },
  concept: { title: 'Concept', text: 'Direction only. This is not in the product and has no release date. It is here so you can see where the system is going and tell us if it matters to you.' },
}

export const PRODUCT_PAGES: ReadonlyArray<ProductPage> = [
  /* ---------------------------------------------------------------- Understand */
  {
    slug: 'call-review', group: 'Understand', label: 'Call review', status: 'v1', screen: 'timeline', loop: 'event',
    detail: 'Stages, events, talk and control on one timeline',
    title: 'Every call on one timeline.',
    lede: 'Call review lays a recorded call out as stages, events, talk turns and control, with the transcript underneath. You see where it turned without listening to all 38 minutes.',
    question: 'What happened on this call?',
    metaTitle: 'Call review: every sales call on one timeline | Bylda',
    metaDescription: 'Bylda call review lays each recorded sales call out as stages, events, talk turns and control on one timeline, with the transcript and the moment that mattered.',
    steps: [
      { title: 'The call comes in', text: 'From your call recorder or dialer, or uploaded by hand. Transcript and audio, with speakers split.' },
      { title: 'Bylda marks the moments', text: 'Stages, questions, objections, interruptions and monologues are placed on the call’s own timeline.' },
      { title: 'You open the one that matters', text: 'Jump to the moment, read the quote, hear it. The summary column carries talk share, interruptions and the next step.' },
    ],
    anatomy: [
      { label: 'Stage lane', text: 'Opening, discovery, pricing, close. On the Acme Logistics call, pricing is marked hot and the close has no next step.' },
      { label: 'Event lane', text: 'Every question, objection and interruption as a mark. The diamond at 18:42 is the pricing objection.' },
      { label: 'Summary column', text: 'Talk 61 / 39, five interruptions with three in pricing, a 1:42 monologue at 19:02, and no next step set.' },
      { label: 'Status', text: 'Each call carries its state, like Stalled, so a manager knows which reviews need attention first.' },
    ],
    uses: [
      { role: 'Managers', text: 'Review a stalled deal in minutes and know which moment to coach before the one-on-one.' },
      { role: 'Reps', text: 'Go back to your own calls at the moments that mattered, not from the top.' },
    ],
    limits: [
      'One call is one data point. Bylda waits for a pattern before it calls something a habit.',
      'Call review shows what happened. Why it happened is the job of behavior analysis, with its evidence and confidence.',
    ],
  },
  {
    slug: 'behavior-analysis', group: 'Understand', label: 'Behavior analysis', status: 'v1', screen: 'analysis', loop: 'behavior',
    detail: 'Where the call was lost, with the quote as evidence',
    title: 'Where the call was lost, with the quote.',
    lede: 'Bylda names the moment the call turned, how the rep acted, and what to do next time. Every claim carries its evidence and a confidence level.',
    question: 'Why did this call stall?',
    metaTitle: 'Behavior analysis: where the sales call was lost | Bylda',
    metaDescription: 'Bylda behavior analysis names the moment a sales call turned, the behavior behind it and what to do next time, with the quote as evidence and the confidence stated.',
    steps: [
      { title: 'Observation', text: 'What the rep did, measured. Jordan answered 0.4s after the CFO started, and offered 12% off within 5 seconds.' },
      { title: 'Interpretation', text: 'What it meant. The CFO had not finished. His concern was rollout, not price.' },
      { title: 'Do this next time', text: 'One move with the words to try: pause, ask what is behind it, then handle adoption risk.' },
    ],
    anatomy: [
      { label: 'Where the call was lost', text: 'Observation, interpretation and next move in one box, written in plain language.' },
      { label: 'Evidence', text: 'The timestamp and the quote: “Honestly the number isn’t the problem, it’s whether my team will actually…”' },
      { label: 'Confidence', text: 'A three-step meter and the pattern behind it: seen in 4 of Jordan’s last 6 price objections.' },
      { label: 'Behaviors on this call', text: 'Question quality, talk and listen, interruptions, objection handling and pacing, each tagged Strong, Shifted, Leak or Rushed.' },
    ],
    uses: [
      { role: 'Managers', text: 'Coach from the moment and the quote, not from a hunch about the call.' },
      { role: 'Reps', text: 'See what you did and what to try next, in words you can use on the next call.' },
    ],
    limits: [
      'Confidence is shown on every analysis. A link to a pattern appears only when the pattern is there.',
      'The analysis describes behavior. It does not grade the rep as a person or rank them against peers.',
    ],
  },
  {
    slug: 'behavior-profiles', group: 'Understand', label: 'Behavior profiles', status: 'v1', screen: 'profile', loop: 'pattern',
    detail: 'Each rep against the team, over 30 days',
    title: 'Each rep against the team, over 30 days.',
    lede: 'A behavior profile sets one rep’s habits against the team median and against their own baseline, with the eight-week trend behind every number.',
    question: 'What are this rep’s strengths and leaks?',
    metaTitle: 'Rep behavior profiles: strengths and leaks over 30 days | Bylda',
    metaDescription: 'Bylda behavior profiles compare each sales rep with the team median and their own baseline across 30 days of calls, tagging strengths, leaks and the trend behind them.',
    steps: [
      { title: 'Calls add up', text: 'Every analyzed call adds to the rep’s behaviors. Jordan’s profile draws on 38 calls in 30 days.' },
      { title: 'Compared two ways', text: 'Against the team median, and against the rep’s own baseline, so a change shows even when the whole team moves.' },
      { title: 'Tagged plainly', text: 'Strength, Watch, Leak or Rushed, with the sparkline that earned the tag.' },
    ],
    anatomy: [
      { label: 'Strengths', text: 'Discovery depth at 2.9 follow-ups against a team median of 2.4. Next-step setting at 86% against 74%.' },
      { label: 'Leaks', text: 'Held control in 3 of 9 objections against 58% for the team. Early discounting in 4 of 6 price talks against 1 of 6.' },
      { label: 'Trend', text: 'An eight-week sparkline on every row, so you can tell a slip from a habit.' },
      { label: 'Sample size', text: 'The header says how many calls the profile rests on. Thin data is labeled thin.' },
    ],
    uses: [
      { role: 'Managers', text: 'Know who to coach on what before a one-on-one, with the calls behind each number.' },
      { role: 'Reps', text: 'See your own strengths and leaks over time. Never a peer ranking.' },
    ],
    limits: [
      'Profiles compare a rep with the team median, not with named colleagues. Reps never see leaderboards.',
      'A tag is a starting point for a conversation, not a performance rating.',
    ],
  },

  /* ---------------------------------------------------------------- Coach */
  {
    slug: 'daily-brief', group: 'Coach', label: 'Daily brief', status: 'v1', screen: 'focus', loop: 'change',
    detail: '60 seconds for reps, 2 minutes for managers',
    title: 'The day starts with one change.',
    lede: 'Reps get a 60 second brief: yesterday in a few lines and one focus for today. Managers get a two minute brief, in the app and by email.',
    question: 'What do I change on my next call?',
    metaTitle: 'Daily brief: one coaching focus for every sales rep | Bylda',
    metaDescription: 'The Bylda daily brief gives each sales rep a 60 second summary and one focus for the day, and gives managers a two minute brief in the app and by email.',
    steps: [
      { title: 'Yesterday’s calls are read', text: 'Every recorded call from the day before is analyzed before the rep starts.' },
      { title: 'The brief is written', text: 'What went well, what slipped, and whether it was the same moment again.' },
      { title: 'One focus leads', text: 'The rep sees one change, why it matters on their own calls, and the words to try.' },
    ],
    anatomy: [
      { label: 'Summary', text: '“Yesterday you ran strong discovery on 3 of 4 calls… But you lost control during pricing on Acme Logistics and Kestrel Labs. Same moment both times.”' },
      { label: 'Today’s focus', text: 'After an objection, pause before you respond. Assigned by Dana W., day 2 of 10.' },
      { label: 'Why it matters', text: 'Answering in under a second came right before the prospect repeated the objection, 5 of 6 times.' },
      { label: 'Try this next time', text: 'One breath. Then: “When you say price, what’s behind that?”' },
    ],
    uses: [
      { role: 'Reps', text: 'Sixty seconds before the first call. One thing to do, and the reason it is worth doing.' },
      { role: 'Managers', text: 'Two minutes: what needs attention today and who to coach, in the app and by email.' },
    ],
    limits: [
      'One focus at a time. No courses, no quizzes, no list of twelve things to fix.',
      'Briefs arrive in the app and by email in the first release. Slack and Teams delivery is on the roadmap.',
    ],
  },
  {
    slug: 'coaching-focus', group: 'Coach', label: 'Coaching focus', status: 'v1', screen: 'coaching', loop: 'change', illustrative: true,
    detail: 'Assign, acknowledge, practice',
    title: 'Assign it, acknowledge it, practice it.',
    lede: 'Coaching in Bylda is four objects: the focus, the evidence, the rep’s acknowledgement and the result. The manager assigns it; the rep sees it every morning until it holds.',
    question: 'What should this rep practice, and for how long?',
    metaTitle: 'Coaching focus: assign one behavior and measure it | Bylda',
    metaDescription: 'Assign one coaching focus per sales rep with the call moment attached, let the rep acknowledge and practice it, and measure whether the behavior changed.',
    steps: [
      { title: 'Pick the behavior', text: 'Start from a pattern or a call, and attach the moment that shows it. Here, the 18:42 pricing objection.' },
      { title: 'Set the window', text: 'Dana gave Jordan ten days. His card reads day 2 of 10, with a target: pause 0.4s now, 1.5s next.' },
      { title: 'The rep acknowledges', text: '“Got it, I’ll try this today.” Then hears the moment the focus came from.' },
      { title: 'Bylda measures', text: 'Every call in the window is checked for the behavior, and the result is reported with its confidence.' },
    ],
    anatomy: [
      { label: 'Focus', text: 'One sentence a rep can carry into a call: after an objection, pause before you respond.' },
      { label: 'Evidence', text: 'The call and timestamp that started it, one click away for both manager and rep.' },
      { label: 'Acknowledgement', text: 'The rep confirms they have read it, so the manager knows the coaching landed.' },
      { label: 'Target', text: 'A measurable line to move: pause after objections, from 0.4s toward 1.5s.' },
    ],
    uses: [
      { role: 'Managers', text: 'Assign coaching with the evidence attached, and see who has acknowledged it.' },
      { role: 'Reps', text: 'Know exactly what you are practicing, why, and watch the target move.' },
    ],
    limits: [
      'Coaching is one focus at a time per rep. Stacking five assignments helps nobody change.',
      'The assign panel shown is an illustrative layout. The rep card is rebuilt from the app prototype.',
    ],
  },
  {
    slug: 'coach-queue', group: 'Coach', label: 'Coach queue', status: 'v1', screen: 'queue', loop: 'pattern',
    detail: 'Who needs coaching today, and why',
    title: 'Who needs coaching today, and why.',
    lede: 'The manager home leads with what changed overnight and a short queue of reps to coach, each with the behavior and the evidence behind it.',
    question: 'Who should I coach today?',
    metaTitle: 'Coach queue: who needs sales coaching today | Bylda',
    metaDescription: 'The Bylda coach queue shows sales managers who to coach today and why, with the behavior, the evidence and the confidence behind each suggestion.',
    steps: [
      { title: 'A pattern surfaces', text: '“Jordan lost control during 4 of 6 price objections this week.” Confidence high, n = 6 objections across 4 calls.' },
      { title: 'Each rep comes with a reason', text: 'Jordan: objection handling. Alex: call control, monologues over 2 minutes in 5 calls. Mia: discovery depth.' },
      { title: 'Act from the card', text: 'View the pattern, or assign coaching with the moment already attached.' },
    ],
    anatomy: [
      { label: 'Overnight insight', text: 'One sentence on what changed, with what reps who hold these calls do instead: pause about 1.8s and ask one question first.' },
      { label: 'Confidence line', text: 'Every insight states its confidence and sample size under the headline.' },
      { label: 'Coach today', text: 'A short list, not a dashboard. Each row has the rep, the behavior and the reason.' },
      { label: 'Relationship with outcomes', text: 'Open the pattern to see how the behavior travels with next steps and stage moves.' },
    ],
    uses: [
      { role: 'Managers', text: 'Start the day knowing where an hour of coaching will matter most.' },
      { role: 'Reps', text: 'Reps do not see the queue. They see their own brief and their own focus.' },
    ],
    limits: [
      'The queue suggests who to coach. The manager decides what gets assigned.',
      'Patterns say “associated with” unless the data supports cause.',
    ],
  },

  /* ---------------------------------------------------------------- Measure */
  {
    slug: 'behavior-change-results', group: 'Measure', label: 'Behavior change results', status: 'v1', screen: 'results', loop: 'outcome',
    detail: 'Before and after, per call',
    title: 'Did the coaching work? Before and after, call by call.',
    lede: 'Once a focus is assigned, Bylda tracks the behavior on every call that follows and reports the change, with the sample size and what it cannot rule out.',
    question: 'Did the behavior actually change?',
    metaTitle: 'Behavior change results: did sales coaching work? | Bylda',
    metaDescription: 'Bylda measures whether coaching changed a rep’s behavior, call by call, before and after the focus, with the sample size and confidence stated.',
    steps: [
      { title: 'Baseline', text: 'The calls before the focus. Alex talked 65% of the time during objections, median across 10 calls.' },
      { title: 'Window', text: 'The focus starts Sep 1. Every call with an objection after it is measured the same way.' },
      { title: 'Result', text: 'Median talk share fell to 51% and held for three weeks. n = 21 calls, caveats stated.' },
    ],
    anatomy: [
      { label: 'Dot plot', text: 'Each dot is one call with at least one objection. Ten before the focus, eleven after.' },
      { label: 'Medians', text: 'The before and after medians are drawn across the plot so the shift reads at a glance.' },
      { label: 'Related behaviors', text: 'Asked before explaining went from 2 of 10 to 9 of 11. Objection repeated later fell from 60% to 27%.' },
      { label: 'What it cannot prove', text: 'Same team, same pricing. Bylda cannot rule out other factors, but the change started the week of the focus.' },
    ],
    uses: [
      { role: 'Managers', text: 'Know which coaching held, and stop repeating what did not.' },
      { role: 'Reps', text: 'See your progress as numbers on your own calls, not as an opinion.' },
    ],
    limits: [
      'Bylda says “associated with” unless the data supports cause, and it says when there are too few calls to judge.',
      'Results are about behavior on calls. Revenue impact is shown only when there are enough closed deals to say anything.',
    ],
  },
  {
    slug: 'weekly-reports', group: 'Measure', label: 'Weekly reports', status: 'roadmap', screen: 'report', loop: 'outcome', illustrative: true,
    detail: 'Team, rep and behavior reports',
    title: 'The week, by team, rep and behavior.',
    lede: 'Living reports that roll the week’s calls into what held, what slipped and who to coach next. Planned after the first release.',
    question: 'What changed on my team this week?',
    metaTitle: 'Weekly sales behavior reports (roadmap) | Bylda',
    metaDescription: 'Planned for Bylda: weekly reports by team, rep and behavior that show what coaching held, what slipped and who to coach next. Roadmap, not in the first release.',
    steps: [
      { title: 'Rolled up from the same calls', text: 'No new data entry. Reports would read from the behaviors and results Bylda already tracks.' },
      { title: 'Three cuts', text: 'By team, by rep and by behavior, each with the sample size behind it.' },
      { title: 'One page to share', text: 'Something a revenue leader can read in a minute, with links back to the calls.' },
    ],
    anatomy: [
      { label: 'What held', text: 'Coaching that changed behavior and stayed changed, like Alex’s talk share in objections, 65% to 51%.' },
      { label: 'What slipped', text: 'Behaviors moving the wrong way, like Jordan’s control in objections, 3 of 9.' },
      { label: 'Coach next', text: 'The queue for the week ahead, carried over from the manager home.' },
    ],
    uses: [
      { role: 'Managers', text: 'Walk into the weekly team meeting with the behaviors, not just the pipeline.' },
      { role: 'Reps', text: 'A weekly view of your own progress, never a team ranking.' },
    ],
    limits: [
      'Roadmap. Not in the first release, and the layout may change.',
      'Today, the manager daily brief and behavior change results cover the same ground one day and one rep at a time.',
    ],
  },
  {
    slug: 'team-trends', group: 'Measure', label: 'Team trends', status: 'roadmap', screen: 'trends', loop: 'pattern', illustrative: true,
    detail: 'Behaviors heatmap across reps',
    title: 'Behaviors across the team, at a glance.',
    lede: 'A heatmap of behaviors by rep shows whether a habit belongs to one person or to the whole team. Planned after the first release.',
    question: 'Is this a rep problem or a team problem?',
    metaTitle: 'Team behavior trends heatmap (roadmap) | Bylda',
    metaDescription: 'Planned for Bylda: a heatmap of sales behaviors across reps that shows whether a habit belongs to one rep or the whole team. Roadmap, not in the first release.',
    steps: [
      { title: 'Every rep, every behavior', text: 'Rows are behaviors, columns are reps, cells come from the same profiles managers already use.' },
      { title: 'Colored by tag, not rank', text: 'Strength, Watch or Leak against the team median. No scores, no order of merit.' },
      { title: 'Open a cell', text: 'A cell would open the behavior detail and the calls behind it.' },
    ],
    anatomy: [
      { label: 'A row of red', text: 'When a leak runs across the row, it is a team habit. Coach the team, or look at the playbook.' },
      { label: 'A column of red', text: 'When it runs down one rep, it is one person’s focus for the next ten days.' },
      { label: 'Trend arrows', text: 'Direction over the last four weeks, so a cell that is improving reads differently from one that is stuck.' },
    ],
    uses: [
      { role: 'Managers', text: 'Decide between a team session and a one-on-one in a glance.' },
      { role: 'Reps', text: 'Reps would not see the team grid. They see their own profile.' },
    ],
    limits: [
      'Roadmap. Not in the first release. Only Jordan’s column is read off the app; the rest is illustrative.',
      'Managers only. Reps never see peer comparisons.',
    ],
  },

  /* ---------------------------------------------------------------- Next */
  {
    slug: 'outcome-graph', group: 'Next', label: 'Behavioral outcome graph', status: 'concept', screen: 'graph', loop: 'outcome', illustrative: true,
    detail: 'Events to behaviors to patterns to outcomes',
    title: 'Events to behaviors to patterns to outcomes.',
    lede: 'The behavioral outcome graph would join every event, behavior, pattern and outcome Bylda sees into one map you can explore. It is direction, not product.',
    question: 'Which behaviors travel with which outcomes, across everything?',
    metaTitle: 'Behavioral outcome graph (concept) | Bylda',
    metaDescription: 'A concept for Bylda: one explorable graph linking call events, rep behaviors, patterns and outcomes, each link carrying its sample size and confidence. Not in the product.',
    steps: [
      { title: 'Nodes', text: 'An event on a call, the behaviors it reveals, the pattern they belong to, and the outcomes that follow.' },
      { title: 'Edges', text: 'Each link would carry its sample size and confidence, under the same rules as today’s product.' },
      { title: 'Walk it backwards', text: 'Start from an outcome, like next step booked, and walk back to the behaviors that travel with it.' },
    ],
    anatomy: [
      { label: 'Event', text: '18:42 pricing objection on the Acme Logistics call.' },
      { label: 'Behaviors', text: 'Answered in 0.4s. Offered 12% off.' },
      { label: 'Pattern', text: '4 of 6 price objections for Jordan in 30 days.' },
      { label: 'Outcomes', text: 'Next step booked 41% with an interruption against 72% without. The objection came back later.' },
    ],
    uses: [
      { role: 'Managers', text: 'See the whole chain behind a number instead of one call at a time.' },
      { role: 'Reps', text: 'Understand why one habit matters more than another on your calls.' },
    ],
    limits: [
      'Concept. Not in the product and no release date.',
      'Today’s product already builds the pieces: call review for events, analysis for behaviors, profiles for patterns, results for outcomes.',
    ],
    more: { label: 'Read the longer essay on the Behavior Graph', href: '/behavior-graph' },
  },
  {
    slug: 'buyer-models', group: 'Next', label: 'Buyer models', status: 'concept', screen: 'buyers', loop: 'behavior', illustrative: true,
    detail: 'How your buyers actually behave',
    title: 'How your buyers actually behave.',
    lede: 'Today Bylda models the seller. Buyer models would do the same for the other side of the call: what each kind of buyer raises, when, and what they mean by it.',
    question: 'What does this kind of buyer mean when they say price?',
    metaTitle: 'Buyer models: how your buyers behave on calls (concept) | Bylda',
    metaDescription: 'A concept for Bylda: buyer models that turn the buyer side of every sales call into patterns, so coaching accounts for who is on the other end. Not in the product.',
    steps: [
      { title: 'Buyer events', text: 'Objections, questions and hesitations from the buyer’s side of the call, timed like the rep’s.' },
      { title: 'Grouped by buyer', text: 'Role, segment and stage, so a CFO at a mid-market logistics company is compared with similar buyers.' },
      { title: 'Back into coaching', text: 'A rep’s focus would account for who is on the other end of the next call.' },
    ],
    anatomy: [
      { label: 'Said price, meant adoption', text: 'On the Acme call the CFO said “the number isn’t the problem”. His concern was whether his team would use it.' },
      { label: 'What they raise first', text: 'The order buyers bring things up, across calls with similar buyers.' },
      { label: 'What works with them', text: 'The rep behaviors that travel with a next step for this kind of buyer.' },
    ],
    uses: [
      { role: 'Managers', text: 'Coach for the buyers your team actually meets, not a generic persona.' },
      { role: 'Reps', text: 'Walk into a call knowing what this kind of buyer tends to mean.' },
    ],
    limits: [
      'Concept. Not in the product and no release date.',
      'The buyer card shown is illustrative. Its quote and context come from the same sample call as the rest of the site.',
    ],
  },
  {
    slug: 'simulations', group: 'Next', label: 'Simulations and experiments', status: 'concept', screen: 'experiment', loop: 'change', illustrative: true,
    detail: 'Test a change before your buyers do',
    title: 'Test a change before your buyers do.',
    lede: 'Simulations would estimate what a behavior change is worth before you coach it. Experiments would then run it on real calls with a comparison group, so the result is evidence and not a guess.',
    question: 'If my team paused before answering objections, what would change?',
    metaTitle: 'Sales coaching simulations and experiments (concept) | Bylda',
    metaDescription: 'A concept for Bylda: simulate a behavior change from patterns already observed, then run it as a controlled experiment on real sales calls. Not in the product.',
    steps: [
      { title: 'Pick a change', text: 'Pause before you respond. Ask before you explain. A behavior Bylda already measures.' },
      { title: 'Simulate', text: 'Estimate the effect from patterns already observed, with the uncertainty shown as a range.' },
      { title: 'Run it', text: 'Coach one group, hold another, measure both the same way, and read the difference.' },
    ],
    anatomy: [
      { label: 'Hypothesis', text: 'After an objection, pausing before responding is associated with more next steps booked.' },
      { label: 'Groups', text: 'A coached group and a comparison group, matched on segment and stage.' },
      { label: 'Readout', text: 'The same measures as behavior change results, with the confidence stated.' },
    ],
    uses: [
      { role: 'Managers', text: 'Know which coaching is worth the team’s time before rolling it out.' },
      { role: 'Reps', text: 'Practice changes that have been shown to matter, not the flavor of the month.' },
    ],
    limits: [
      'Concept. Not in the product and no release date.',
      'Simulations would show ranges, not promises. Today the product measures change after coaching and labels association as association.',
    ],
  },
]

export const productHref = (slug: string) => `/product/${slug}`
export const findPage = (slug: string) => PRODUCT_PAGES.find(p => p.slug === slug)
export const GROUPS: ReadonlyArray<Group> = ['Understand', 'Coach', 'Measure', 'Next']
