# Bylda SEO Strategy & Optimization Playbook

**Version:** 1.0 — September 2026
**Scope:** usebylda.com organic search + AI answer engines (Google AI Overviews, ChatGPT Search, Perplexity)
**Owner:** Growth / Founder

---

## 0. Executive Summary (read this first)

Bylda's on-page and technical baseline is already better than 90% of seed-stage SaaS sites:
canonical tags, full JSON-LD graphs (Organization, SoftwareApplication, Product+Offers,
FAQPage on 8 pages, BlogPosting+Breadcrumb), `llms.txt`, AI-crawler-friendly `robots.txt`,
two comparison pages, an ROI calculator, and noindexed legacy content. **The constraint is no
longer hygiene. It is (a) page count against the keyword universe, (b) domain authority, and
(c) conversion surface (a waitlist, not a demo).**

Three honest, devil's-advocate calls before the playbook:

1. **"AI sales operating system" is a category-creation term, not a demand-capture term.**
   Search volume today is near zero — nobody types it. Ranking #1 for it is table stakes
   (we should own our own category name for AI answer engines), but it will not produce
   pipeline in the next 12 months. The pipeline is in **problem keywords** ("automatic CRM
   updates", "stop manual CRM data entry") and **competitor/alternative keywords** ("Gong
   alternatives", "Clari vs Gong"). Weight investment accordingly: ~15% category, ~45%
   problem/commercial, ~40% competitor.

2. **Do not do classic programmatic SEO yet.** With a 5-post blog and a young domain,
   spinning up 200 thin templated pages ("AI sales tools for [industry] in [city]") is the
   fastest way to earn a helpful-content classifier demotion that suppresses the *whole*
   site. The "programmatic" motion that fits Bylda is a **finite, high-quality matrix**:
   ~4 CRM integration pages × ~6 use-case pages × ~10 comparison/alternative pages ×
   ~8 role/solution pages ≈ **30–40 hand-finished pages from a shared template**. Every one
   must contain something a competitor page doesn't (real field-mapping tables, real
   workflow specs, real numbers).

3. **A waitlist caps SEO ROI.** High-intent visitors from "Gong alternative" queries want a
   demo or a trial *now*; a waitlist converts a fraction of them and the rest bounce back to
   the SERP (a negative engagement signal). Until self-serve opens, every commercial page
   needs a secondary conversion (ROI calculator result via email, comparison PDF, "book a
   walkthrough") so high-intent traffic isn't wasted.

Priority scores for the overall program:
**Impact 9 / Difficulty 5 / Revenue Impact 8 / Nova-fit 9** — SEO compounds, competitors'
CPCs in this space are $30–80/click, and the category is being defined *right now* in AI
answer engines.

---

## 1. Keyword Strategy & Opportunity Matrix

### 1.1 How to read this matrix

- **Intent:** T = Transactional, C = Commercial investigation, I = Informational
- **Persona:** AE = account exec, SM = sales manager, VP = VP Sales/CRO, RO = RevOps/SalesOps
- **Status:** ✅ page exists · 🔧 page exists but under-optimized for this term · 🆕 build
- Volumes in this space are modest (most terms 50–2,000/mo) but CPCs of $30–80 tell you the
  real story: every click is worth fighting for. Verify volumes in GSC/Ahrefs before
  sequencing; treat the tiers below as priors, not facts.

### 1.2 Tier 1 — High-intent commercial/transactional (build & win first)

| Keyword cluster | Intent | Persona | Target page | Status |
| --- | --- | --- | --- | --- |
| AI sales operating system / AI sales OS | C | VP, RO | `/` + `/blog/ai-sales-operating-system` | ✅ (defend) |
| Gong alternative(s) / Gong competitors | T | VP, SM | `/gong-alternative` | ✅ (needs links) |
| Clari alternative(s) / Clari competitors | T | VP, RO | `/clari-alternative` | ✅ (needs links) |
| automatic CRM updates / automated CRM update tool | T | RO, SM | `/crm-automation` | 🔧 retitle for "automatic" variants |
| Salesforce AI / AI for Salesforce / Salesforce automation tool | T | RO | 🆕 `/integrations/salesforce` | 🆕 |
| HubSpot AI sales automation | T | RO, SM | 🆕 `/integrations/hubspot` | 🆕 |
| Pipedrive automation / Pipedrive AI | T | SM | 🆕 `/integrations/pipedrive` | 🆕 |
| AI sales agent / AI sales assistant for reps | C | VP, SM | `/ai-sales-agent` | ✅ |
| conversation intelligence software | C | SM, RO | `/conversation-intelligence` | ✅ |
| AI CRM data entry / eliminate manual CRM data entry | T | RO, SM | 🆕 `/use-cases/automatic-crm-data-entry` | 🆕 |
| sales follow-up automation software | T | SM, AE | 🆕 `/use-cases/follow-up-automation` | 🆕 |
| AI sales forecasting software (conversation-based) | C | VP, RO | 🆕 `/use-cases/deal-risk-and-forecasting` | 🆕 |

### 1.3 Tier 2 — Competitor & alternative capture (highest revenue per visit)

| Keyword cluster | Intent | Persona | Target page | Status |
| --- | --- | --- | --- | --- |
| Gong vs Clari (comparison of two competitors) | C | VP, RO | 🆕 `/compare/gong-vs-clari` | 🆕 — the "arms dealer" play: rank for their head-to-head, present Bylda as the third option |
| Gong vs Chorus / Chorus alternative | C | SM | 🆕 `/compare/chorus-alternative` | 🆕 |
| Fireflies alternative / Otter alternative (for sales teams) | T | SM, AE | 🆕 `/compare/ai-notetaker-alternative` | 🆕 — huge volume, catch "notetaker graduates" |
| Salesforce Einstein alternative / Einstein Copilot review | C | RO | 🆕 fold into `/integrations/salesforce` | 🆕 |
| HubSpot Breeze / ChatSpot alternative | C | SM | 🆕 fold into `/integrations/hubspot` | 🆕 |
| Momentum.io / Attention.com / Rox / Day.ai alternative | C | RO | 🆕 one page per credible emerging rival, only when they have search volume | later |
| Gong pricing / Clari pricing (they hide it; we don't) | C | VP | address inside existing alternative pages | 🔧 |

**Rule for competitor pages:** be factually scrupulous and generous about what the
incumbent does well (this is also what earns AI-answer-engine citations); win on the
structural difference — *insight tools stop at insight, Bylda executes*. Never publish a
claim about a competitor you can't source to their own docs/pricing page.

### 1.4 Tier 3 — Problem/informational (TOFU/MOFU, feeds the machine)

| Keyword cluster | Intent | Persona | Target asset | Status |
| --- | --- | --- | --- | --- |
| how much time do sales reps spend on CRM / data entry statistics | I | VP, RO | 🆕 data study (see §5 — this is the link magnet) | 🆕 |
| CRM data hygiene / pipeline hygiene best practices | I | RO | 🆕 blog: definitive pipeline-hygiene guide | 🆕 |
| CRM adoption problems / reps not updating CRM | I | SM, VP | `/blog/crm-adoption-was-never-a-training-problem` | ✅ (expand + retitle H1 to match query) |
| how to automate sales follow up emails | I | AE, SM | `/blog/how-to-automate-follow-ups` | ✅ |
| CRM automation workflows / examples | I | RO | `/blog/crm-automation-workflows` | ✅ |
| what is conversation intelligence | I | SM | `/conversation-intelligence` + blog | 🔧 add definitional block for AI Overviews |
| what is an AI sales agent / agent vs copilot | I | VP | `/ai-sales-agent` | ✅ |
| MEDDIC / BANT fields auto-populated / sales methodology in CRM | I | RO, SM | 🆕 blog: "Auto-scoring MEDDIC from calls" | 🆕 — low competition, exactly-our-buyer |
| sales forecast accuracy / why forecasts miss | I | VP | 🆕 blog: conversation-based forecasting essay | 🆕 |
| AI note taker vs AI sales agent | I | SM | 🆕 blog, links to notetaker comparison page | 🆕 |

### 1.5 Anti-targets (deliberately do NOT chase)

- "best CRM", "CRM for small business" — wrong product, wrong buyer, brutal SERP. (The
  legacy site chased these; it's correctly noindexed. Don't resurrect it.)
- "AI SDR", "AI cold outreach", "lead generation" — adjacent category (outbound), attracts
  the wrong intent and dilutes the topical cluster Google is building for us
  (post-call execution, not prospecting).
- Local/industry spam patterns ("AI for dentists") — already retired with the legacy site.

---

## 2. Programmatic & Content Hub Architecture

### 2.1 Pillar-and-cluster map

Four hubs. Every cluster page links **up** to its pillar, **across** to 2–3 siblings, and
**down** (pillars link to every child). Blog posts are the outer ring and always link into a
commercial page.

```
PILLAR 1: /crm-automation  (money pillar)
  ├── /integrations/salesforce        ├── /integrations/hubspot
  ├── /integrations/pipedrive         ├── /integrations/dynamics
  ├── /use-cases/automatic-crm-data-entry
  ├── /use-cases/pipeline-hygiene
  └── blog: crm-automation-workflows, crm-adoption, pipeline-hygiene guide, MEDDIC post

PILLAR 2: /conversation-intelligence
  ├── /compare/gong-alternative (existing /gong-alternative)
  ├── /compare/chorus-alternative
  ├── /compare/ai-notetaker-alternative (Fireflies/Otter graduates)
  └── blog: conversation-intelligence-is-not-the-product, notetaker-vs-agent

PILLAR 3: /ai-sales-agent  (category pillar)
  ├── /blog/ai-sales-operating-system (category manifesto)
  ├── /solutions/* (by role: AE, manager, RevOps, leadership)
  └── blog: agent-vs-copilot essays, Morning Brief explainers

PILLAR 4: /use-cases/deal-risk-and-forecasting
  ├── /clari-alternative, /compare/gong-vs-clari
  └── blog: forecast-accuracy essay
```

### 2.2 Page types to build (in priority order)

1. **Integration pages** (`/integrations/{crm}`) — the highest-leverage build. Each must
   include: the real ~14-field mapping table for that CRM (object → field → source signal →
   example), custom-field support, write traceability/rollback, a 3-step setup, that CRM's
   native-AI comparison (Einstein, Breeze), and an integration-specific FAQ. This substance
   is what separates it from every competitor's thin logo-grid page. Keep `/integrations`
   as the hub listing everything else (calendar, conferencing, email).
2. **Use-case pages** (`/use-cases/{job-to-be-done}`) — one per Tier-1 job: automatic CRM
   data entry, follow-up automation, deal risk & forecasting, pipeline hygiene, manager
   coaching. Structure: problem cost → how Bylda executes it → proof number → FAQ.
3. **Comparison pages** (`/compare/{x}`) — extend the two existing pages with
   Gong-vs-Clari (third-option play), Chorus, and the notetaker-graduation page. Migrate
   existing `/gong-alternative` and `/clari-alternative` into `/compare/` **only via 301s
   and only if restructuring anyway** — they hold equity; don't churn URLs for tidiness.
   (Counter-argument to our own plan: URL churn costs 2–8 weeks of rank flux. If the flat
   URLs are ranking, leave them and just adopt `/compare/` for *new* pages.)
4. **Solutions split** — break `/solutions` into `/solutions/account-executives`,
   `/solutions/sales-managers`, `/solutions/revops`, `/solutions/sales-leaders`. Each
   targets persona-modified queries ("sales manager coaching software", "RevOps automation
   tools") and speaks in that persona's KPIs.
5. **Interactive assets** — the pricing-page ROI calculator should get its own indexable
   URL (`/roi-calculator`, "sales rep time savings calculator") with email-me-my-results
   capture; later, a "CRM data quality grader".

### 2.3 URL & internal-linking rules

- Flat, hyphenated, no dates, no parameters: `/use-cases/automatic-crm-data-entry`.
- One page = one primary keyword cluster. If two pages could rank for the same term,
  merge them (we're too small to afford cannibalization).
- Every new page gets ≥3 internal links from existing indexed pages within a week of
  publishing (edit the pillar, one sibling, and one blog post).
- Descriptive anchor text with the target's keyword ("automatic CRM updates for
  Salesforce"), never "learn more".
- Blog posts must link to exactly 1–2 commercial pages in-body (not just nav/footer).
- Nav stays lean; the footer carries the full hub map (pillars + children) sitewide.
- Keep `sitemap.xml` and `llms.txt` updated in the same commit as any new page —
  `llms.txt` is our AI-answer-engine index and is already unusually good.

---

## 3. On-Page SEO & Messaging Framework

### 3.1 Metadata templates (engineered for CTR)

| Element | Template | Rules |
| --- | --- | --- |
| Title | `{Primary Keyword} — {Differentiated Claim} \| Bylda` | ≤60 chars. Claim = mechanism or number, not adjective. Ex: `Salesforce AI Automation — 14 Fields Written Per Call \| Bylda` |
| Meta description | `{Pain, named}. {Mechanism in one clause}. {Proof number}. {Soft CTA}.` | ≤155 chars. Ex: `Reps type 41% of required fields. Bylda writes ~14 per call into Salesforce automatically, traceable to the transcript. See the field map.` |
| H1 | Conversational restatement of the query, exactly one per page | Ex: `Salesforce updates itself when the call ends` — keyword-adjacent, human-first |
| H2s | Written as the questions buyers actually ask | `How Bylda writes Salesforce fields`, `What about Einstein?`, `Is it safe to let AI write my CRM?` — question-form H2s are snippet/AI-Overview bait |
| OG title/desc | May differ from title tag — optimize for social CTR (bolder claim) | Already implemented sitewide; keep |

CTR levers that work in this SERP: numbers ("14 fields", "6.5 hrs/week"), the word
"automatically", naming the incumbent ("without leaving Salesforce"), and honesty markers
("where Bylda is not a fit" — unusual, earns clicks and AI citations).

### 3.2 Capturing AI Overviews / SGE and featured snippets

Google's AI Overviews and ChatGPT/Perplexity answers are assembled from **extractable,
self-contained passages**. Per target query, include:

1. **A 40–60 word definitional block immediately after the H1 or relevant H2**, written to
   stand alone: "An AI sales operating system is software that listens to customer
   conversations, updates the CRM automatically, and executes follow-up work — unlike
   conversation intelligence, which only reports what happened." One bolded term, no
   pronouns referring outside the block.
2. **Tables for anything comparative** (field maps, Bylda-vs-Gong capability grids) —
   tables are disproportionately lifted into snippets and AI answers.
3. **Question-form H2s answered in the first sentence beneath them**, then elaboration.
4. **Named, sourced statistics** — AI engines cite pages that give them a number with a
   source. Our own data study (§5) exists partly to make us the citable source.
5. **Entity consistency**: "Bylda", "AI Sales Operating System", and "Phantom" phrased
   identically across site, llms.txt, LinkedIn, Crunchbase, G2 — answer engines resolve
   entities across sources; inconsistency costs citations.
6. Keep serving **fully static HTML** (current architecture). Every AI crawler reads us
   with zero JS execution — this is a real advantage over JS-heavy competitors; don't
   trade it away for a framework migration.

Realism check: AI Overviews will *reduce* clicks on pure-informational terms. That's fine —
our informational tier exists to earn citations and topical authority, not clicks. The
click-bearing terms (alternatives, integrations, pricing) still resolve to site visits
because the answer requires vendor evaluation.

### 3.3 Messaging spine (consistent across every page)

- Problem language: "reps spend X hrs/week typing what they already said out loud."
- Mechanism: listens → understands → **writes the CRM** → drafts → briefs.
- Differentiator: *insight tools tell you; Bylda does it.* (vs Gong/Clari/notetakers)
- Trust: traceable, logged, reversible writes; SOC 2; never trains shared models.
- Proof: ~14 fields/call, 41%→95% completeness, ~6.5 hrs/rep/week.

---

## 4. Technical SEO & Schema Requirements

### 4.1 Schema — current state and additions

Already live (verified in source): `Organization`, `WebSite`, `SoftwareApplication` w/
`Offer`, `Product` + `Brand` + `Offer` (pricing), `FAQPage` on 8 pages, `BlogPosting` +
`BreadcrumbList` on posts. **Do not add more schema to pages that have it — add these:**

| Schema | Where | Why |
| --- | --- | --- |
| `SoftwareApplication` w/ `aggregateRating` | homepage + pricing | Star-rating rich results — **only once ≥5 real G2/Capterra reviews exist**; fabricated ratings risk a manual action |
| `HowTo` | how-it-works, integration setup sections | Step rich results + AI-answer extraction |
| `FAQPage` | each new integration & use-case page (3–5 Qs, on-page visible) | Already the house pattern; carry it forward |
| `Article` w/ `author` → `Person` (with `sameAs` → LinkedIn) | all blog posts | E-E-A-T: named authors with verifiable profiles; anonymous essays are a genuine current weakness |
| `WebPage` `speakable` | category definitional blocks | Cheap, forward-looking for voice/AI surfaces |
| `VideoObject` | when demo video exists | Video rich results for "Bylda demo" branded queries |

### 4.2 Technical priority checks (static site on Vercel — most classic SaaS issues don't apply)

1. **Core Web Vitals:** self-host the three Google Fonts (currently 2 extra origins +
   render-blocking CSS; `preconnect` helps but self-hosting + `font-display: swap` is
   better for LCP/CLS). Compress `og-image.png` (252 KB) and audit hero assets. Budget:
   LCP <2.0s mobile, CLS <0.05.
2. **Canonical discipline on new templates:** every `/integrations/*`, `/use-cases/*`,
   `/compare/*` page ships with self-referencing canonical + og + twitter + JSON-LD from
   day one (extend the existing audit script to enforce on new dirs).
3. **Legacy containment:** the `X-Robots-Tag: noindex` approach on `/legacy/*` is correct
   (and correctly *not* robots-blocked). Quarterly: check GSC that legacy URLs are
   actually dropping out; once fully deindexed, consider 410s to reclaim crawl budget.
4. **Sitemap hygiene:** keep `lastmod` truthful (only bump on real content change —
   Google ignores sitemaps with fake lastmod); add new pages in the publishing commit.
5. **Redirects:** all 301s live in `vercel.json` — keep chains ≤1 hop; any future URL
   moves (e.g. `/compare/` migration) get direct 301s + sitemap + internal-link updates
   in the same deploy.
6. **Monitoring:** GSC property + weekly crawl (the existing daily audit script covers
   on-page; add an Indexing API/GSC inspection pass for new pages), and track AI-engine
   referrals (`utm`-less referrers from perplexity.ai, chat.openai.com, google AIO) in
   analytics as a first-class channel.
7. **Don't over-engineer:** no SSR migration, no infinite-scroll blog, no client-side
   routing. The static architecture is an SEO asset. (Devil's advocate vs. the usual
   agency advice: a "headless CMS + Next.js replatform" would burn a quarter and gain
   nothing Google cares about here.)

---

## 5. Off-Page Authority & Digital PR

Cold truth: with a young domain, sections 1–4 get us into the game; **links decide whether
we win the competitor SERPs** ("Gong alternative" is a page-authority fight). Budget ~40%
of total SEO effort here.

### 5.1 The link magnet: an annual data study

**"The State of CRM Data Entry"** — survey 300–500 AEs/managers (Wynter, SurveyMonkey
Audience, or partner with a sales community) + anonymized aggregate product data once
customer volume allows. Headline stats engineered for citation: *hours/week reps spend
updating CRM; % of CRM fields that are stale/wrong; % of forecast calls based on known-bad
data; what reps would do with the time back.* Publish as a hub page with charts,
downloadable PDF, and a press summary. Every stat page ("CRM statistics", "sales
productivity statistics") and every journalist covering RevOps needs a current source —
2026 sources are scarce. This single asset can out-earn a year of guest posts, and it makes
*us* the number AI Overviews cite (§3.2).

### 5.2 Target link ecosystems (in order of value)

1. **Software directories with review equity:** G2, Capterra/Gartner Digital Markets,
   TrustRadius, Product Hunt launch. Not glamorous; these rank #1–3 for every
   "alternatives" query we care about — being listed *in* the "Gong alternatives" G2
   category page is itself a ranking on someone else's authority.
2. **RevOps community & media:** RevGenius, Pavilion, Sales Hacker/GTMnow, RevOps Co-op,
   Wizard of Ops — guest essays (the CRM-adoption essay repurposed), podcast circuit
   (30+ active sales/RevOps podcasts take founder guests; each yields a show-notes link).
3. **Integration-partner ecosystems:** Salesforce AppExchange, HubSpot App Marketplace,
   Pipedrive Marketplace listings (DR90+ followed profiles + co-marketing eligibility);
   Zoom/Teams app directories.
4. **AI-tool roundups & newsletters:** the long tail of "best AI sales tools 2026"
   listicles actively looks for new entrants — pitch with the data study, not the product.
5. **Founder-led PR hooks:** contrarian bylines that match our essays ("CRM adoption was
   never a training problem", "Conversation intelligence is a commodity"), commentary on
   Gong/Clari/Salesforce AI announcements (newsjacking within 24h), and category-creation
   op-eds in sales publications.

### 5.3 What NOT to do

- No paid link packages, no PBNs, no mass guest-post marketplaces — a young domain caught
  in a link scheme doesn't recover; an old one does.
- No broad-topic content marketing ("productivity tips") for links — links must land on or
  flow to the four hubs to move the rankings that pay.
- Don't buy the "DR60+ guaranteed" outreach agencies. One data-study link from GTMnow is
  worth fifty of theirs.

---

## 6. 90-Day Execution Sequence

**Days 1–30 — capture what's closest to money**
- Ship `/integrations/salesforce` and `/integrations/hubspot` (field-map tables included).
- Retitle/expand `/crm-automation` for "automatic CRM updates" variants; add definitional
  blocks (§3.2) to all four pillars.
- Add named authors + `Person` schema to blog posts. Self-host fonts. G2/Capterra listings live.
- Stand up `/roi-calculator` as an indexable page.

**Days 31–60 — widen the competitor net**
- Ship `/compare/gong-vs-clari` and `/compare/ai-notetaker-alternative`.
- Ship `/use-cases/automatic-crm-data-entry` + `/use-cases/follow-up-automation`.
- Field the data-study survey. Book 4 podcasts. Publish MEDDIC auto-scoring post.

**Days 61–90 — authority push**
- Publish "State of CRM Data Entry 2026" + PR outreach wave.
- Split `/solutions` into role pages. Ship `/integrations/pipedrive` + `/dynamics`.
- Review GSC: kill/merge anything with impressions-but-no-clicks after retitling once.

**KPIs:** non-brand clicks/week (primary), top-10 rankings for Tier-1 terms, referring
domains to hub pages, waitlist signups from organic (secondary conversions counted), AI
answer-engine citations (manual monthly spot-check of ~20 queries in ChatGPT/Perplexity/AIO).

---

*Maintenance rule: any new page ships with — self-canonical, title/desc per §3.1 template,
one JSON-LD graph, entry in `sitemap.xml`, entry in `llms.txt`, ≥3 inbound internal links,
and question-form H2s. The daily audit script enforces the first five; the last two are
editorial discipline.*
