/**
 * Marketing copy and structure for the homepage.
 *
 * Claims are grounded in the app's own Product Architecture page (Figma
 * HWdVvVXWqJl4BFD9MZ5vgW, page 00): its architecture decisions, role map and
 * sitemap legend. Status tags follow that legend:
 *   v1       ships in the first release (green in the sitemap)
 *   roadmap  planned, not V1 (orange)
 *   concept  direction only (purple), or not in the app at all
 */

import { GROUP_BLURB, GROUPS, PRODUCT_PAGES, productHref } from './product-pages'

export type Status = 'v1' | 'roadmap' | 'concept'

export const CTA = 'Get early access'

export const AUDIENCES = ['sales managers', 'revenue leaders', 'enablement teams', 'sales reps'] as const

/** The Product menu: one group per column, one page per item (see product-pages.ts). */
export const NAV_PRODUCT = GROUPS.map(group => ({
  group,
  blurb: GROUP_BLURB[group],
  items: PRODUCT_PAGES.filter(p => p.group === group).map(p => ({
    slug: p.slug, label: p.label, detail: p.detail, href: productHref(p.slug), status: p.status, screen: p.screen,
  })),
}))

export const NAV_LINKS = {
  solutions: [
    { label: 'For sales managers', href: '/#roles' },
    { label: 'For reps', href: '/#roles' },
  ],
  resources: [
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Security', href: '/security' },
    { label: 'Changelog', href: '/changelog' },
  ],
} as const

/** Sources the app ingests (Product Architecture: "Inputs: CRM, dialer, recorder, upload"). */
export const SOURCES = ['Your CRM', 'Your dialer', 'Your call recorder', 'Manual upload'] as const

/** Proof points: the app's own architecture decisions, not marketing claims. */
export const PROOF = [
  { icon: 'gauge', text: 'Every insight shows its sample size and confidence — no hidden scores.' },
  { icon: 'target', text: 'Coaching is one behavior change per rep, backed by evidence. No courses, no quizzes.' },
  { icon: 'shield', text: 'Reps see their own brief and calls only. No peer rankings, ever.' },
  { icon: 'scales', text: 'Bylda says “associated with” unless the data supports cause, and tells you when it cannot judge.' },
] as const

export const LOOP = [
  { id: 'event', title: 'Events', line: 'What happened. Calls, talk turns, objections, stage moves.', tab: 0 },
  { id: 'behavior', title: 'Behaviors', line: 'How people acted. Discounting, discovery depth, objection handling.', tab: 1 },
  { id: 'pattern', title: 'Patterns', line: 'What repeats, for whom, and when.', tab: 2 },
  { id: 'outcome', title: 'Outcomes', line: 'What it produced. Next steps, stage moves, wins and losses.', tab: 4 },
] as const

export const TOUR = [
  { id: 'timeline', label: 'Call timeline', caption: 'Every call becomes stages, events, talk turns, control and sentiment on one line.' },
  { id: 'analysis', label: 'Analysis', caption: 'Bylda names where the call was lost, why, and what to do next time, with the quote.' },
  { id: 'profile', label: 'Behavior profile', caption: 'Thirty days of one rep against the team, with the trend behind each number.' },
  { id: 'focus', label: 'Daily focus', caption: 'The rep starts the day with one change, the reason for it, and the words to try.' },
  { id: 'results', label: 'Results', caption: 'Did the behavior change? Before and after, call by call, with what it cannot prove.' },
] as const

/** Role map from the Product Architecture page. */
export const ROLES = {
  manager: {
    tagline: 'For managers. See the pattern.',
    question: 'What should I coach today, and did it work?',
    points: ['Home feed: what needs attention and who to coach', 'Team, rep profiles and calls', 'Behavior detail and patterns', 'Assign coaching and measure the change', 'A two minute daily brief, in app and by email'],
  },
  rep: {
    tagline: 'For reps. Know the next change.',
    question: 'What do I change on my next call?',
    points: ['A 60 second brief with one focus', 'Your own calls and call review', 'Strengths, leaks and progress', 'Acknowledge and apply coaching', 'Never a peer ranking'],
  },
} as const

export const STATEMENT = 'Activities and outcomes are easy to count. The behaviors between them are where deals are decided.'

export const MANIFESTO = {
  lines: ['Less guessing.', 'More coaching.', 'Your team, understood.'],
  copy: 'Bylda reads every recorded call so you do not have to. It names the moment, shows the evidence and gives each rep one thing to change. Then it checks whether they did.',
}

/** Capabilities, grouped by the app's product loop. Status from the Figma sitemap legend. */
export const CAPABILITIES: ReadonlyArray<{ group: string; line: string; items: ReadonlyArray<{ label: string; detail: string; status: Status }> }> = [
  {
    group: 'Observe', line: 'Calls and CRM activity become events.',
    items: [
      { label: 'Call review', detail: 'Timeline of stages, events, talk, control and sentiment, with transcript.', status: 'v1' },
      { label: 'Manual upload', detail: 'Bring a recording in when it lives outside your tools.', status: 'v1' },
      { label: 'Calls index with saved views', detail: 'Every analyzed call, filtered the way you work.', status: 'v1' },
      { label: 'Call comparison', detail: 'Two calls side by side, moment against moment.', status: 'roadmap' },
    ],
  },
  {
    group: 'Understand', line: 'Events become behaviors, behaviors become patterns.',
    items: [
      { label: 'Where the call was lost', detail: 'Observation, interpretation, what to do next time, evidence and confidence.', status: 'v1' },
      { label: 'Behavior detail', detail: 'One behavior across the team, with its relationship to outcomes.', status: 'v1' },
      { label: 'Rep behavior profiles', detail: 'Rep against team median and against their own baseline.', status: 'v1' },
      { label: 'Emerging patterns and objection views', detail: 'New patterns surfaced as they form.', status: 'roadmap' },
      { label: 'Behavior by outcome matrix', detail: 'Which behaviors travel with which outcomes.', status: 'roadmap' },
    ],
  },
  {
    group: 'Recommend', line: 'One change, with the reason and the words.',
    items: [
      { label: 'Rep daily brief', detail: 'Sixty seconds and one focus.', status: 'v1' },
      { label: 'Manager daily brief', detail: 'Two minutes, in app and by email.', status: 'v1' },
      { label: 'Coach queue', detail: 'Who needs coaching today and why.', status: 'v1' },
      { label: 'Slack and Teams delivery', detail: 'Briefs where your team already talks.', status: 'roadmap' },
    ],
  },
  {
    group: 'Change', line: 'Coaching is four objects: focus, evidence, acknowledgement, result.',
    items: [
      { label: 'Assign coaching', detail: 'Pick the behavior, attach the moment, set the window.', status: 'v1' },
      { label: 'Rep coaching view', detail: 'The rep acknowledges the focus and sees the evidence.', status: 'v1' },
      { label: 'Coaching index', detail: 'Active, needs follow-up and completed.', status: 'roadmap' },
    ],
  },
  {
    group: 'Measure', line: 'Did the behavior change, and how sure are we?',
    items: [
      { label: 'Behavior change result', detail: 'Before and after per call, with confidence and caveats.', status: 'v1' },
      { label: 'Weekly and team reports', detail: 'Living reports by rep, team and behavior.', status: 'roadmap' },
      { label: 'Behavioral outcome graph', detail: 'Events, behaviors, patterns and outcomes as one explorable graph.', status: 'concept' },
      { label: 'Simulations and experiments', detail: 'Test an intervention, then run it as a controlled experiment.', status: 'concept' },
    ],
  },
]

export const FAQ: ReadonlyArray<{ q: string; a: string }> = [
  { q: 'What is Bylda?', a: 'Bylda is behavioral sales intelligence software. It turns recorded sales calls and CRM activity into behaviors, patterns and outcomes, gives each rep one change to make, and measures whether the behavior changed.' },
  { q: 'What does Bylda analyze?', a: 'Recorded sales calls, as transcript and audio with speakers split, alongside CRM activity. Calls can come from your recorder or dialer, or be uploaded by hand.' },
  { q: 'How is this different from conversation intelligence?', a: 'Conversation intelligence tells you what was said. Bylda names the behavior behind it, connects it to outcomes across calls, gives the rep one change and measures whether it happened.' },
  { q: 'How sure is Bylda about a pattern?', a: 'Every insight shows its sample size and a confidence level. Bylda says “associated with” unless the data supports cause, and it says so when there are too few closed deals to judge.' },
  { q: 'Will my reps feel watched?', a: 'Reps see their own brief, calls and progress. They never see peer leaderboards. Trust in the tool decides whether it gets used, so the product is built around it.' },
  { q: 'Is the coaching a course?', a: 'No. Coaching is one focus at a time, the evidence for it, the rep’s acknowledgement and the measured result. No courses and no quizzes.' },
  { q: 'What does it cost?', a: 'Core is $89 per rep per month and Team is $129. Enterprise is custom. Access is opening in waves, so request access and we will walk you through it. The pricing page lists what each plan includes.' },
]

export const FOOTER = [
  { title: 'Product', links: [{ label: 'Call review', href: '/product/call-review' }, { label: 'Behavior analysis', href: '/product/behavior-analysis' }, { label: 'Behavior profiles', href: '/product/behavior-profiles' }, { label: 'Daily brief', href: '/product/daily-brief' }, { label: 'Coaching focus', href: '/product/coaching-focus' }, { label: 'Behavior change results', href: '/product/behavior-change-results' }, { label: 'How it works', href: '/how-it-works' }, { label: 'Platform overview', href: '/product' }, { label: 'Integrations', href: '/integrations' }, { label: 'Pricing', href: '/pricing' }] },
  { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Vision', href: '/vision' }, { label: 'Careers', href: '/careers' }, { label: 'Contact', href: '/contact' }] },
  { title: 'Resources', links: [{ label: 'Blog', href: '/blog' }, { label: 'FAQ', href: '/faq' }, { label: 'Behavioral sales intelligence', href: '/behavioral-sales-intelligence' }, { label: 'Bylda vs Gong', href: '/gong-alternative' }, { label: 'Bylda vs Clari', href: '/clari-alternative' }, { label: 'Changelog', href: '/changelog' }, { label: 'Security', href: '/security' }] },
  { title: 'Legal', links: [{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Sitemap', href: '/sitemap' }] },
] as const

export const CONTACT_EMAIL = 'hello@usebylda.com'
export const TURNSTILE_SITEKEY = '0x4AAAAAAERXEFkIi37wgHVG'
export const INDUSTRIES = ['Software / SaaS', 'Professional services', 'Financial services', 'Healthcare', 'Manufacturing', 'Real estate', 'Other'] as const
