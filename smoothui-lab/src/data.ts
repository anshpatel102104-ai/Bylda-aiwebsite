/** Copy lifted verbatim from the live index.html so the preview shows the real site. */

export const stages = {
  launch: {
    n: '01 — Launch',
    h: 'Turn the idea into something you can sell',
    p: 'Describe your idea once. Bylda shapes it into an offer, a brand, a landing page, and a plan you can act on today.',
    seq: [
      'Drafts your offer and pricing',
      'Generates your brand and landing page',
      'Writes the launch plan, step by step',
    ],
    bar: 'app.usebylda.com · launch',
    rows: [
      'Offer & pricing drafted',
      'Brand kit generated',
      'Landing page built',
      'Launch plan ready — 9 steps',
    ],
    result: 'Offer published — your page is live',
  },
  convert: {
    n: '02 — Find & convert customers',
    h: 'Leads come in. Every one gets followed up.',
    p: 'Launch a campaign and the built-in AI CRM takes it from there — replying in minutes, qualifying prospects, and booking them on your calendar.',
    seq: [
      'Launches the campaign',
      'Replies to new leads within minutes',
      'Qualifies and books calls for you',
    ],
    bar: 'app.usebylda.com · crm',
    rows: [
      'Jordan M. — new lead · via launch campaign · 2m ago',
      'AI follow-up sent for you',
      'Booked — Thu · 2:00 PM',
      'Logged to your pipeline',
    ],
    result: '12 leads captured this week — every one followed up',
  },
  grow: {
    n: '03 — Run & grow',
    h: 'Keep everything moving from one place',
    p: 'Your pipeline, campaigns, and next steps live on one dashboard, so you always know what to do next.',
    seq: [
      'Tracks every lead and deal',
      'Suggests the next best action',
      'Keeps campaigns running',
    ],
    bar: 'app.usebylda.com · dashboard',
    rows: [
      'Week 1 — 12 leads, 2 booked',
      'Next action: follow up with 3 leads',
      'Campaign running · next send in 2h',
      'Revenue tracked automatically',
    ],
    result: 'First customer acquired — momentum building',
  },
} as const

export type StageKey = keyof typeof stages

export const proofItems = [
  'Free to start',
  'No code required',
  'AI CRM included',
  'Built for first-time founders',
  'From idea to launch in one platform',
]

export const useCases = [
  {
    tag: 'Sell a product',
    t: 'From idea to first orders',
    d: 'A creator turns an idea into a product page, launches a campaign, and follows up with every interested buyer until the order lands.',
  },
  {
    tag: 'Sell your expertise',
    t: 'From expertise to booked calls',
    d: 'A coach, consultant, or freelancer packages a service, generates leads, qualifies them, and lets the AI CRM book the calls and manage clients.',
  },
  {
    tag: 'Grow a business',
    t: 'From missed leads to steady growth',
    d: 'A business brings its customers in, automates follow-ups and missed-call text-back, launches campaigns, and sees where growth is coming from.',
  },
]

export const compareRows: {
  what: string
  tools: string
  bylda: string
  soon?: boolean
}[] = [
  {
    what: 'Business planning',
    tools: 'A course, a template, and guesswork',
    bylda: 'A living plan built from your idea',
  },
  {
    what: 'Website & landing pages',
    tools: 'A builder subscription, designed by you',
    bylda: 'Generated with your brand, hosted for you',
  },
  {
    what: 'Lead generation',
    tools: 'An ads manager in another tab',
    bylda: 'Campaigns launched from the same screen',
  },
  {
    what: 'Follow-up & CRM',
    tools: 'You chase every lead yourself',
    bylda: 'AI CRM replies, nurtures, and logs it all',
  },
  {
    what: 'Booking',
    tools: 'Calendar links pasted into chats',
    bylda: 'Qualified leads land on your calendar',
  },
  {
    what: 'Payments',
    tools: 'A separate processor to wire up',
    bylda: 'One place to get paid',
    soon: true,
  },
  {
    what: 'Analytics',
    tools: 'Spreadsheets stitched together',
    bylda: 'One dashboard for the whole business',
    soon: true,
  },
  {
    what: 'Next actions',
    tools: 'You figure it out alone',
    bylda: 'Your plan updates with the recommended step',
  },
]

export const todayCols = [
  {
    label: 'Live now',
    dot: 'bg-emerald-400',
    items: [
      'Idea → offer, brand & landing page',
      'Step-by-step launch plan',
      'Campaigns & lead capture',
      'AI CRM: follow-up, qualifying & booking',
      'Missed-call text-back',
    ],
  },
  {
    label: 'In beta',
    dot: 'bg-sky-high',
    sub: 'Being tested with early builders',
    items: ['Performance (KPI) dashboard', 'Team accounts & permissions', 'API access'],
  },
  {
    label: 'Coming next',
    dot: 'bg-black/25',
    items: [
      'Storefront & payments',
      'Operations automation',
      'SMS broadcast campaigns',
      'AI phone agent',
    ],
  },
]

export const footerCols = [
  {
    h: 'Product',
    links: ['How It Works', 'Why Bylda', "What's Live", 'Pricing', 'Start Building'],
  },
  {
    h: 'Use Cases',
    links: ['Sell a Product', 'Sell Your Expertise', 'Grow a Business', 'Industries', 'Roadmap'],
  },
  { h: 'Company', links: ['About', 'Blog', 'Careers', 'Contact', 'Press'] },
]
