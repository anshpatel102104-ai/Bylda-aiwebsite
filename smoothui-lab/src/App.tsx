import { useEffect, useRef, useState } from 'react'
import SiriOrb from '@/components/smoothui/siri-orb'
import MagneticButton from '@/components/smoothui/magnetic-button'
import MaskRevealUp from '@/components/smoothui/mask-reveal-up'
import ScrollRevealParagraph from '@/components/smoothui/scroll-reveal-paragraph'
import AnimatedTabs from '@/components/smoothui/animated-tabs'
import ShineText from '@/components/smoothui/shine-text'
import PerCharacterRise from '@/components/smoothui/per-character-rise'
import TypewriterText from '@/components/smoothui/typewriter-text'
import InfiniteSlider from '@/components/smoothui/infinite-slider'
import BlackHoleHero from '@/components/bylda/black-hole'
import Reveal from '@/components/bylda/reveal'
import {
  compareRows,
  footerCols,
  proofItems,
  stages,
  todayCols,
  useCases,
  type StageKey,
} from '@/data'

const orbSky = {
  bg: 'oklch(13% 0.02 264)',
  c1: 'oklch(54% 0.18 264)',
  c2: 'oklch(64% 0.16 259)',
  c3: 'oklch(76% 0.12 253)',
}

// At small sizes the orb's mask shrinks and `bg` fills the centre, so a dark
// bg reads as a hole. The chip variant lifts bg into mid-blue to stay legible.
const orbChip = {
  bg: 'oklch(62% 0.13 250)',
  c1: 'oklch(72% 0.17 258)',
  c2: 'oklch(82% 0.14 248)',
  c3: 'oklch(90% 0.09 242)',
}

const Check = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <path
      d="M3 7.5L6 10.5L12 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const Logo = ({ className = '' }: { className?: string }) => (
  <img src="/bylda-mark.svg" alt="" width={28} height={28} className={className} />
)

/** Mark + wordmark with the "Bylda Business" descriptor beneath. */
const BrandLockup = ({ onLight = false }: { onLight?: boolean }) => (
  <a
    href="/"
    className={`flex items-center gap-2.5 transition-colors ${
      onLight ? 'text-[#0A0A14]' : 'text-white'
    }`}
  >
    <Logo />
    <span className="flex flex-col leading-none">
      <span className="text-[17px] font-semibold">Bylda</span>
      <span
        className={`mt-[3px] text-[8.5px] font-medium tracking-[0.2em] uppercase ${
          onLight ? 'text-black/45' : 'text-white/45'
        }`}
      >
        Bylda Business
      </span>
    </span>
  </a>
)

const Eyebrow = ({ children, dark = false }: { children: string; dark?: boolean }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
      dark
        ? 'border-sky-pale/25 bg-sky-pale/10 text-sky-pale'
        : 'border-sky-mid/20 bg-sky-mid/5 text-sky-deep'
    }`}
  >
    <span className={`size-1.5 rounded-full ${dark ? 'bg-sky-high' : 'bg-sky-mid'}`} />
    {children}
  </span>
)

/** Anchors point at on-page sections; paths match the existing static pages. */
const navLinks = [
  { label: 'How It Works', href: '#how' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'Why Bylda', href: '#compare' },
  { label: 'Product', href: '#product' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Resources', href: '/blog' },
]

/** Every call to action on the page funnels to the same place. */
const CTA_HREF = '/waitlist'

const NEWSLETTER_ENDPOINT =
  'https://launchpad-api.ansh-patel102104.workers.dev/api/form-submit'

function App() {
  const [stage, setStage] = useState<StageKey>('launch')
  const s = stages[stage]
  const [menuOpen, setMenuOpen] = useState(false)

  const heroRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLElement>(null)
  const [onLight, setOnLight] = useState(false)

  // Footer newsletter — same endpoint and payload the static pages post to.
  const [subscribe, setSubscribe] = useState<{
    state: 'idle' | 'sending' | 'done' | 'error'
    msg: string
  }>({ state: 'idle', msg: '' })

  const onSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = new FormData(form).get('email')
    setSubscribe({ state: 'sending', msg: 'Subscribing…' })
    try {
      const res = await fetch(NEWSLETTER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', email, role: '', formType: 'newsletter' }),
      })
      if (!res.ok) throw new Error('Server error')
      form.reset()
      setSubscribe({ state: 'done', msg: "You're in — check your inbox." })
    } catch {
      setSubscribe({ state: 'error', msg: 'Something went wrong. Please try again.' })
    }
  }

  // Hero and final CTA are dark; everything between is light. Flip the nav so
  // it never sits as a dark slab over a white section.
  useEffect(() => {
    const NAV_H = 64
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0
      const ctaTop = ctaRef.current?.getBoundingClientRect().top ?? Infinity
      setOnLight(heroBottom <= NAV_H && ctaTop > NAV_H)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="min-h-svh bg-white text-[#0A0A14] antialiased">
      {/* ═══════════════ NAV ═══════════════ */}
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${
          onLight ? 'border-black/8 bg-white/80' : 'border-white/10 bg-[#0B1220]/70'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <BrandLockup onLight={onLight} />
          <nav
            className={`hidden items-center gap-7 text-sm transition-colors lg:flex ${
              onLight ? 'text-black/60' : 'text-white/70'
            }`}
          >
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`transition-colors ${
                  onLight ? 'hover:text-[#0A0A14]' : 'hover:text-white'
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href={CTA_HREF}
              className={`hidden text-sm transition-colors sm:block ${
                onLight ? 'text-black/60 hover:text-[#0A0A14]' : 'text-white/70 hover:text-white'
              }`}
            >
              Sign in
            </a>
            <a
              href={CTA_HREF}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all hover:scale-[1.03] ${
                onLight
                  ? 'bg-gradient-to-b from-sky-bright to-sky-mid text-white'
                  : 'bg-white text-[#0B1220]'
              }`}
            >
              Start Building
            </a>
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className={`grid size-9 place-items-center rounded-lg border transition-colors lg:hidden ${
                onLight ? 'border-black/10 text-[#0A0A14]' : 'border-white/15 text-white'
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {menuOpen ? (
                  <>
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </>
                ) : (
                  <>
                    <path d="M3 7h18" />
                    <path d="M3 17h18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            aria-label="Mobile"
            className={`border-t px-6 pb-5 lg:hidden ${
              onLight ? 'border-black/8 bg-white/95' : 'border-white/10 bg-[#0B1220]/95'
            }`}
          >
            {[...navLinks, { label: 'Sign in', href: CTA_HREF }].map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block border-b py-3 text-sm last:border-0 ${
                  onLight ? 'border-black/5 text-black/70' : 'border-white/5 text-white/70'
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* ═══════════════ LEDE / HERO ═══════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-[#04060C] pt-32 pb-24 text-white"
      >
        {/* Raytraced black hole. offsetY aims the camera above the hole so the
            shadow and disk sit in the lower half of the section, under the
            headline rather than behind it. */}
        <BlackHoleHero />
        {/* Keeps the headline legible where it crosses the disk's glare. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 62% 32% at 50% 24%, rgba(4,6,12,0.78), transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center text-center">
            <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-sky-pale/25 bg-sky-pale/10 px-3.5 py-1.5 text-xs font-medium tracking-wide">
              <span className="size-1.5 animate-pulse rounded-full bg-sky-high" />
              <ShineText baseColor="#7DD3FC" shineColor="#FFFFFF" duration={4}>
                The AI growth platform
              </ShineText>
            </span>

            <h1 className="max-w-4xl text-[2.15rem] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-5xl sm:leading-[1.05] md:text-7xl">
              <MaskRevealUp
                lines={['From “I have an idea”', 'to “I have customers.”']}
                stagger={110}
              />
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/60 text-pretty">
              Describe what you want to build. Bylda creates the plan, launches your
              business, brings in leads, follows them up, and helps run everything from
              one place.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <MagneticButton
                asChild
                strength={0.45}
                radius={130}
                className="h-13 rounded-full bg-gradient-to-b from-sky-bright to-sky-mid px-8 text-base font-medium text-white shadow-[0_8px_30px_-6px] shadow-sky-mid/60 hover:brightness-110"
              >
                <a href={CTA_HREF}>Start Building — Free</a>
              </MagneticButton>
              <MagneticButton
                asChild
                strength={0.35}
                radius={110}
                variant="ghost"
                className="h-13 rounded-full border border-white/15 px-7 text-base font-medium text-white hover:bg-white/10 hover:text-white"
              >
                <a href="/demo">Watch Bylda Work</a>
              </MagneticButton>
            </div>

            <ul className="mt-9 flex flex-wrap justify-center gap-x-7 gap-y-3 text-sm text-white/50">
              {['Free to start', 'No code', 'AI leads & CRM built in'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <span className="text-sky-high">
                    <Check />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* product demo */}
          {/* Zero-height marker the shader measures against. Kept outside the
              Reveal because that wrapper is transformed while animating in. */}
          <div data-horizon-anchor className="mt-40" aria-hidden="true" />
          <Reveal delay={120} className="[perspective:1600px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-2xl backdrop-blur-sm [transform:rotateX(6deg)]">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0E1626]">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                  <i className="size-2.5 rounded-full bg-white/15" />
                  <i className="size-2.5 rounded-full bg-white/15" />
                  <i className="size-2.5 rounded-full bg-white/15" />
                  <span className="ml-3 font-mono text-[11px] text-white/35">
                    app.usebylda.com
                  </span>
                </div>
                <div className="grid gap-6 p-7 md:grid-cols-[1.1fr_1fr]">
                  <div>
                    <div className="flex items-start gap-4">
                      <SiriOrb
                        size="56px"
                        colors={orbChip}
                        animationDuration={8}
                        className="mt-0.5 shrink-0 shadow-[0_0_28px_-4px] shadow-sky-bright/70"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] tracking-wider text-white/40 uppercase">
                          Your idea
                        </span>
                        <p className="mt-1 text-lg text-white/90">
                          <TypewriterText speed={55} loop>
                            Meal-prep for busy professionals
                          </TypewriterText>
                        </p>
                      </div>
                    </div>
                    <ol className="mt-6 space-y-2.5">
                      {[
                        'Offer created',
                        'Brand & landing page generated',
                        'Campaign launched',
                        '12 new leads captured',
                        'AI follow-up sent',
                        '2 consultations booked',
                        'First customer acquired',
                      ].map((t, i) => (
                        <Reveal as="li" key={t} delay={200 + i * 70}>
                          <span className="flex items-center gap-2.5 text-sm text-white/70">
                            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-sky-mid/25 text-sky-high">
                              <Check size={11} />
                            </span>
                            {t}
                          </span>
                        </Reveal>
                      ))}
                    </ol>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] tracking-wider text-white/40 uppercase">
                          Your business · Week 1
                        </span>
                        <p className="mt-1 font-medium">Meal-prep for professionals</p>
                      </div>
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300">
                        <i className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Live
                      </span>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2.5">
                      {[
                        ['12', 'Leads'],
                        ['2', 'Booked'],
                        ['1', 'Customer'],
                      ].map(([n, l], i) => (
                        <Reveal key={l} delay={300 + i * 90}>
                          <div className="rounded-lg bg-white/5 p-3 text-center">
                            <div className="text-2xl font-semibold text-sky-pale">{n}</div>
                            <div className="mt-0.5 text-[11px] text-white/40">{l}</div>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                    <div className="mt-5 flex h-24 items-end gap-1.5">
                      {[22, 34, 30, 48, 58, 74, 92].map((h, i) => (
                        <Reveal key={i} delay={420 + i * 60} blur={false} className="flex-1">
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-sky-deep to-sky-high"
                            style={{ height: `${(h / 100) * 96}px` }}
                          />
                        </Reveal>
                      ))}
                    </div>
                    <p className="mt-4 text-[11px] text-white/40">
                      AI follow-up running · next send in 2h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ PROOF STRIP ═══════════════ */}
      <section
        aria-label="What you get with Bylda"
        className="border-y border-black/5 bg-[#F7F9FC] py-6"
      >
        <InfiniteSlider gap={44} speed={38} speedOnHover={12}>
          {proofItems.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-sm whitespace-nowrap text-black/55">
              <span className="text-sky-mid">
                <Check />
              </span>
              {t}
            </span>
          ))}
        </InfiniteSlider>
      </section>

      {/* ═══════════════ FROM IDEA TO FIRST CUSTOMER ═══════════════ */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            From idea to{' '}
            <span className="bg-gradient-to-r from-sky-mid to-sky-high bg-clip-text text-transparent">
              first customer.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-black/55 text-pretty">
            Three stages, one screen. Here's what Bylda actually does at each one.
          </p>
        </Reveal>

        <Reveal delay={100} className="mt-12 flex justify-center">
          <AnimatedTabs
            variant="pill"
            defaultTab="launch"
            onChange={(id) => setStage(id as StageKey)}
            tabs={[
              { id: 'launch', label: 'Launch' },
              { id: 'convert', label: 'Find & convert' },
              { id: 'grow', label: 'Run & grow' },
            ]}
          />
        </Reveal>

        <div className="mt-12 grid items-center gap-12 md:grid-cols-2">
          <div key={`copy-${stage}`} className="animate-[fadeUp_.5s_cubic-bezier(.22,1,.36,1)]">
            <span className="font-mono text-xs tracking-wider text-sky-mid uppercase">{s.n}</span>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-balance">{s.h}</h3>
            <p className="mt-4 leading-relaxed text-black/60 text-pretty">{s.p}</p>
            <ul className="mt-6 space-y-3">
              {s.seq.map((t) => (
                <li key={t} className="flex items-center gap-3 text-[15px] text-black/70">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-sky-mid/12 text-sky-mid">
                    <Check size={12} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div
            key={`vis-${stage}`}
            className="animate-[fadeUp_.5s_cubic-bezier(.22,1,.36,1)] overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_20px_60px_-20px_rgba(2,132,199,0.28)]"
          >
            <div className="flex items-center gap-2 border-b border-black/6 bg-[#FAFBFD] px-4 py-3">
              <i className="size-2.5 rounded-full bg-black/10" />
              <i className="size-2.5 rounded-full bg-black/10" />
              <i className="size-2.5 rounded-full bg-black/10" />
              <span className="ml-3 font-mono text-[11px] text-black/35">{s.bar}</span>
            </div>
            <div className="space-y-2.5 p-6">
              {s.rows.map((r, i) => (
                <div
                  key={r}
                  className="flex items-center gap-3 rounded-lg border border-black/5 bg-[#FAFBFD] px-4 py-3 text-sm text-black/70"
                  style={{
                    animation: `fadeUp .5s cubic-bezier(.22,1,.36,1) ${i * 80}ms both`,
                  }}
                >
                  <span className="grid size-4 shrink-0 place-items-center rounded-full bg-sky-mid/20 text-sky-mid">
                    <Check size={11} />
                  </span>
                  {r}
                </div>
              ))}
              <div
                className="mt-4 rounded-lg bg-gradient-to-r from-sky-mid to-sky-bright px-4 py-3 text-sm font-medium text-white"
                style={{ animation: 'fadeUp .5s cubic-bezier(.22,1,.36,1) 360ms both' }}
              >
                {s.result}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ EARLY BUILDERS ═══════════════ */}
      <section id="builders" className="border-y border-black/5 bg-[#F7F9FC] py-24">
        <Reveal from="scale" className="mx-auto max-w-3xl px-6 text-center">
          <Eyebrow>Early access</Eyebrow>
          <h2 className="mt-5 text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            <PerCharacterRise triggerOnView stagger={12}>
              Built in the open, with the first builders
            </PerCharacterRise>
          </h2>
          <p className="mt-5 leading-relaxed text-black/55 text-pretty">
            Bylda is in early access. First-time founders and small businesses are using it
            to launch offers and run their first campaigns — and what they hit shapes what
            we ship next. Real launch stories will live here as builders approve them. No
            invented numbers, no stock testimonials.
          </p>
          <a
            href={CTA_HREF}
            className="group mt-7 inline-flex items-center gap-2 text-sm font-medium text-sky-deep"
          >
            Become an early builder
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </Reveal>
      </section>

      {/* ═══════════════ STATEMENT ═══════════════ */}
      <section className="py-28">
        <div className="mx-auto max-w-3xl px-6 text-center text-2xl leading-snug font-medium tracking-[-0.02em] md:text-4xl">
          <ScrollRevealParagraph paragraph="Most ideas die in a folder. Bylda is the platform that takes yours from a sentence to a real business with real customers." />
        </div>
      </section>

      {/* ═══════════════ USE CASES ═══════════════ */}
      <section id="use-cases" className="mx-auto max-w-6xl px-6 pb-28">
        <Reveal className="text-center">
          <Eyebrow>Use cases</Eyebrow>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            Three ways builders{' '}
            <span className="bg-gradient-to-r from-sky-mid to-sky-high bg-clip-text text-transparent">
              use Bylda.
            </span>
          </h2>
          <p className="mt-4 text-black/55">
            Different starting points, same connected journey.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {useCases.map((c, i) => (
            // Each card enters from its own side so the row assembles inward
            // rather than three identical fades firing in sequence.
            <Reveal
              as="article"
              key={c.t}
              delay={i * 130}
              from={i === 0 ? 'left' : i === 1 ? 'scale' : 'right'}
            >
              <div className="group relative h-full overflow-hidden rounded-2xl border border-black/8 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-sky-mid/30 hover:shadow-[0_20px_50px_-20px_rgba(2,132,199,0.35)]">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-sky-high to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="inline-block rounded-full bg-sky-mid/8 px-2.5 py-1 text-[11px] font-medium text-sky-deep">
                  {c.tag}
                </span>
                <h3 className="mt-4 text-xl font-semibold tracking-[-0.01em] text-balance">
                  {c.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-black/55 text-pretty">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ COMPARISON ═══════════════ */}
      <section id="compare" className="border-y border-black/5 bg-[#F7F9FC] py-28">
        <div className="mx-auto max-w-5xl px-6">
          <Reveal className="text-center">
            <Eyebrow>Why Bylda</Eyebrow>
            <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.02em] text-balance md:text-5xl">
              <PerCharacterRise triggerOnView stagger={14}>
                Not another tool to add.
              </PerCharacterRise>{' '}
              <span className="bg-gradient-to-r from-sky-mid to-sky-high bg-clip-text text-transparent">
                The system that connects the work.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-black/55 text-pretty">
              Stitching a business together from separate tools means separate logins,
              separate data, and you in the middle. Bylda keeps the whole journey in one
              context.
            </p>
          </Reveal>

          <Reveal
            delay={120}
            from="flip"
            blur={false}
            className="mt-12 overflow-hidden rounded-2xl border border-black/8 bg-white"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-black/8 bg-[#FAFBFD]">
                    <th className="px-5 py-4 font-medium text-black/45">The work</th>
                    <th className="px-5 py-4 font-medium text-black/45">Separate tools</th>
                    <th className="bg-sky-mid/5 px-5 py-4 font-semibold text-sky-deep">Bylda</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((r, i) => (
                    // Rows cascade individually so the table builds itself.
                    <Reveal
                      as="tr"
                      key={r.what}
                      delay={260 + i * 70}
                      from="left"
                      blur={false}
                      className="border-b border-black/5 last:border-0"
                    >
                      <th scope="row" className="px-5 py-4 font-medium text-black/75">
                        {r.what}
                      </th>
                      <td className="px-5 py-4 text-black/45">{r.tools}</td>
                      <td className="bg-sky-mid/5 px-5 py-4 text-black/75">
                        <span className="flex items-start gap-2">
                          {r.soon ? (
                            <span className="mt-px shrink-0 rounded-full bg-black/8 px-2 py-0.5 text-[10px] font-medium text-black/50">
                              Coming next
                            </span>
                          ) : (
                            <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-sky-mid/20 text-sky-mid">
                              <Check size={11} />
                            </span>
                          )}
                          {r.bylda}
                        </span>
                      </td>
                    </Reveal>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-6 text-center text-sm text-black/45 text-pretty">
              One login, shared context — what happens in your CRM feeds your plan, and your
              plan drives what runs next.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ TODAY vs NEXT ═══════════════ */}
      <section id="product" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal className="text-center">
          <Eyebrow>The platform today</Eyebrow>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
            What you can do with Bylda{' '}
            <span className="bg-gradient-to-r from-sky-mid to-sky-high bg-clip-text text-transparent">
              today.
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-black/55 text-pretty">
            We ship in the open. Here's what's live, what early builders are testing, and
            what's next.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {todayCols.map((col, i) => (
            <Reveal key={col.label} delay={i * 140} from="tilt">
              <div className="h-full rounded-2xl border border-black/8 bg-white p-7 transition-shadow duration-300 hover:shadow-[0_18px_44px_-24px_rgba(2,132,199,0.45)]">
                <h3 className="flex items-center gap-2.5 text-lg font-semibold">
                  <span className={`size-2 rounded-full ${col.dot} ${i === 0 ? 'animate-pulse' : ''}`} />
                  {col.label}
                </h3>
                {col.sub && <p className="mt-1.5 text-xs text-black/40">{col.sub}</p>}
                <ul className="mt-5 space-y-3">
                  {col.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-sm text-black/65">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-sky-mid/50" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={330}>
          <p className="mt-8 text-center text-sm text-black/45">
            The detailed long-term picture lives on the{' '}
            <a href="/roadmap" className="text-sky-deep underline underline-offset-4">
              live roadmap
            </a>
            .
          </p>
        </Reveal>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section ref={ctaRef} className="relative overflow-hidden bg-[#0B1220] py-28 text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 55% at 50% 105%, rgba(14,165,233,0.28), transparent 70%),' +
              'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(2,132,199,0.16), transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mb-10 flex justify-center">
            <SiriOrb
              size="104px"
              colors={orbSky}
              animationDuration={18}
              className="shadow-[0_0_60px_-8px] shadow-sky-bright/70"
            />
          </div>
          <h2 className="text-4xl font-semibold tracking-[-0.025em] text-balance md:text-5xl">
            <MaskRevealUp
              lines={['Your idea deserves more than', 'another unfinished project.']}
              triggerOnView
              stagger={100}
            />
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-white/55 text-pretty">
            Start with an idea. Bylda helps you launch it, find customers, follow them up,
            and keep moving forward.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <MagneticButton
              asChild
              strength={0.5}
              radius={150}
              className="h-14 rounded-full bg-white px-9 text-base font-semibold text-[#0B1220] hover:bg-sky-cloud"
            >
              <a href={CTA_HREF}>Start Building — Free</a>
            </MagneticButton>
            <MagneticButton
              asChild
              strength={0.35}
              radius={120}
              variant="ghost"
              className="h-14 rounded-full border border-white/15 px-8 text-base font-medium text-white hover:bg-white/10 hover:text-white"
            >
              <a href="/how-it-works">See How It Works</a>
            </MagneticButton>
          </div>
          <p className="mt-6 text-xs text-white/35">Free to start · No code required</p>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-[#080D17] pt-16 pb-8 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <BrandLockup />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45 text-pretty">
                The business operating system. Enterprise-grade capabilities to build,
                launch, operate, and scale — accessible to everyone.
              </p>
              <div className="mt-5 flex gap-3">
                {[
                  {
                    l: 'Twitter / X',
                    href: 'https://twitter.com/byldaai',
                    d: 'M18.9 2h3.3l-7.2 8.2L23.5 22h-6.6l-5.2-6.8L5.7 22H2.4l7.7-8.8L1.8 2h6.8l4.7 6.2L18.9 2zm-1.2 18h1.8L7.1 3.9H5.2L17.7 20z',
                  },
                  {
                    l: 'LinkedIn',
                    href: 'https://linkedin.com/company/bylda-ai',
                    d: 'M20.4 20.4h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.2V9h3.4v1.6h.1c.5-.9 1.7-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM7.1 20.4H3.5V9h3.6v11.4zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 .9.8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z',
                  },
                  {
                    l: 'Instagram',
                    href: 'https://instagram.com/usebylda',
                    d: 'M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.9c-.1 3.2-1.6 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9C2.4 3.9 3.9 2.4 7.1 2.3 8.4 2.2 8.8 2.2 12 2.2zm0 3.2A6.6 6.6 0 1 0 12 18.6 6.6 6.6 0 0 0 12 5.4zm0 10.9A4.3 4.3 0 1 1 12 7.7a4.3 4.3 0 0 1 0 8.6',
                  },
                ].map((s) => (
                  <a
                    key={s.l}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.l}
                    className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-sky-mid/40 hover:text-sky-pale"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d={s.d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {footerCols.map((c) => (
              <div key={c.h}>
                <h5 className="text-xs font-semibold tracking-wider text-white/80 uppercase">
                  {c.h}
                </h5>
                <div className="mt-4 flex flex-col gap-2.5">
                  {c.links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      className="text-sm text-white/45 transition-colors hover:text-white"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/8 pt-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h5 className="text-sm font-medium">Get the playbook</h5>
              <p className="mt-1 text-sm text-white/45">
                Building an online business — straight to your inbox.
              </p>
            </div>
            <div className="w-full max-w-sm">
              <form className="flex gap-2" onSubmit={onSubscribe}>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@email.com"
                  aria-label="Email address"
                  className="min-w-0 flex-1 rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-sky-mid/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={subscribe.state === 'sending'}
                  aria-label="Subscribe"
                  className="shrink-0 rounded-full bg-gradient-to-b from-sky-bright to-sky-mid px-5 text-sm font-medium text-white transition-transform hover:scale-[1.04] disabled:opacity-60"
                >
                  {subscribe.state === 'sending' ? '…' : subscribe.state === 'done' ? '✓' : '→'}
                </button>
              </form>
              {subscribe.msg && (
                <p
                  role="status"
                  className={`mt-2 text-xs ${
                    subscribe.state === 'error' ? 'text-red-300' : 'text-sky-pale'
                  }`}
                >
                  {subscribe.msg}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Bylda. All rights reserved.</span>
            <div className="flex gap-5">
              {[
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'Sitemap', href: '/sitemap' },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="transition-colors hover:text-white/60"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
