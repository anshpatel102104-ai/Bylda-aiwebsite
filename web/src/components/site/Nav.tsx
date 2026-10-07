import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CaretDown, List, X } from '@phosphor-icons/react/dist/ssr'
import { Logo } from '../../brand/Logo'
import { CTA, NAV_LINKS, NAV_PRODUCT, type Status } from '../../data/site'
import { openAccess } from '../../lib/site-store'
import { ProductScreen } from '../product/ProductScreen'

type Menu = 'product' | 'solutions' | 'resources' | null

export function StatusTag({ status }: { status: Status }) {
  if (status === 'v1') return null
  return <span className="status-tag" data-status={status}>{status === 'roadmap' ? 'Roadmap' : 'Concept'}</span>
}

type NavItem = (typeof NAV_PRODUCT)[number]['items'][number]

/** The hovered item's real screen, scaled down, with what the page covers. */
function Preview({ item }: { item: NavItem }) {
  return (
    <a className="mm-preview" href={item.href} tabIndex={-1} aria-hidden="true">
      <div className="mm-preview-shot">
        <div className="mm-preview-scale"><ProductScreen key={item.slug} id={item.screen} /></div>
      </div>
      <div className="mm-preview-cap">
        <span className="mm-preview-label">{item.label} <StatusTag status={item.status} /></span>
        <span className="mm-preview-detail">{item.detail}</span>
        <span className="mm-preview-go">Open the page <ArrowRight size={12} weight="bold" /></span>
      </div>
    </a>
  )
}

export function Nav({ current }: { current?: string }) {
  const [open, setOpen] = useState<Menu>(null)
  const all = NAV_PRODUCT.flatMap(g => g.items)
  const [hovered, setHovered] = useState(() => all.find(i => i.slug === current) ?? all[0])
  const group = NAV_PRODUCT.findIndex(g => g.items.includes(hovered))
  const [drawer, setDrawer] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dark, setDark] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const timer = useRef<number>(0)

  // Hairline and blur once the page leaves the top. IntersectionObserver, not a scroll listener.
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Over a full-bleed black section the glass turns dark too: blurred black under pale glass reads as grey dirt.
  useEffect(() => {
    const els = document.querySelectorAll('[data-nav-dark]')
    if (!els.length) return
    const under = new Set<Element>()
    let io: IntersectionObserver | null = null
    const watch = () => {
      io?.disconnect()
      under.clear()
      io = new IntersectionObserver(entries => {
        for (const e of entries) e.isIntersecting ? under.add(e.target) : under.delete(e.target)
        setDark(under.size > 0)
      }, { rootMargin: `0px 0px ${-(window.innerHeight - 32)}px 0px` })
      els.forEach(el => io!.observe(el))
    }
    watch()
    window.addEventListener('resize', watch)
    return () => { io?.disconnect(); window.removeEventListener('resize', watch) }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(null); setDrawer(false) } }
    const onDown = (e: PointerEvent) => { if (!navRef.current?.contains(e.target as Node)) setOpen(null) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown) }
  }, [])

  // A closed drawer is inert: off-screen links stay out of the tab order.
  const drawerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    document.documentElement.toggleAttribute('data-drawer', drawer)
    if (drawerRef.current) drawerRef.current.inert = !drawer
  }, [drawer])

  const hover = (m: Menu) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOpen(m), m ? 60 : 160)
  }
  const trigger = (m: Exclude<Menu, null>, label: string) => (
    <button
      type="button" className="nav-link" aria-expanded={open === m} aria-controls={`menu-${m}`}
      onClick={() => setOpen(o => (o === m ? null : m))} onPointerEnter={() => hover(m)}
    >
      {label} <CaretDown size={12} weight="bold" aria-hidden="true" />
    </button>
  )

  return (
    <>
      <div ref={sentinel} className="nav-sentinel" aria-hidden="true" />
      <header ref={navRef} className="nav" data-scrolled={scrolled || undefined} data-tone={dark ? 'dark' : undefined} onPointerLeave={() => hover(null)}>
        <div className="wrap nav-bar">
          <a href="/" className="nav-logo" aria-label="Bylda home"><Logo height={15} tone={dark ? 'light' : 'dark'} /></a>
          <nav className="nav-links" aria-label="Main">
            {trigger('product', 'Product')}
            {trigger('solutions', 'Solutions')}
            {trigger('resources', 'Resources')}
            <a className="nav-link" href="/pricing" onPointerEnter={() => hover(null)}>Pricing</a>
          </nav>
          <div className="nav-right">
            <button type="button" className="btn btn-ink" onClick={() => openAccess('', 'nav')}>{CTA}</button>
            <button type="button" className="nav-burger" aria-label="Open menu" aria-expanded={drawer} onClick={() => setDrawer(true)}>
              <List size={22} />
            </button>
          </div>
        </div>

        <div id="menu-product" className="mm" data-open={open === 'product' || undefined} onPointerEnter={() => hover('product')}>
          <div className="wrap mm-inner">
            <div className="mm-groups">
              {NAV_PRODUCT.map((g, i) => (
                <div key={g.group} className="mm-group" data-active={group === i || undefined} data-next={g.group === 'Next' || undefined}>
                  <div className="mm-group-title">{g.group}</div>
                  <p className="mm-group-blurb">{g.blurb}</p>
                  <ul>
                    {g.items.map(it => (
                      <li key={it.label}>
                        <a href={it.href} onClick={() => setOpen(null)} onPointerEnter={() => setHovered(it)} onFocus={() => setHovered(it)}
                          aria-current={it.slug === current ? 'page' : undefined} data-hover={it === hovered || undefined}>
                          <span className="mm-item-label">{it.label} <StatusTag status={it.status} /></span>
                          <span className="mm-item-detail">{it.detail}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Preview item={hovered} />
          </div>
        </div>

        {(['solutions', 'resources'] as const).map(m => (
          <div key={m} id={`menu-${m}`} className="dd" data-menu={m} data-open={open === m || undefined} onPointerEnter={() => hover(m)}>
            <ul>
              {NAV_LINKS[m].map(l => <li key={l.label}><a href={l.href} onClick={() => setOpen(null)}>{l.label}</a></li>)}
            </ul>
          </div>
        ))}
      </header>

      <div className="drawer-scrim" data-open={drawer || undefined} onClick={() => setDrawer(false)} aria-hidden="true" />
      <aside ref={drawerRef} className="drawer" data-open={drawer || undefined} aria-label="Menu" aria-hidden={!drawer}>
        <div className="drawer-head">
          <Logo height={14} />
          <button type="button" className="nav-burger" aria-label="Close menu" onClick={() => setDrawer(false)}><X size={22} /></button>
        </div>
        {NAV_PRODUCT.map(g => (
          <div key={g.group} className="drawer-group">
            <div className="drawer-title">{g.group}</div>
            {g.items.map(it => (
              <a key={it.label} href={it.href} onClick={() => setDrawer(false)} aria-current={it.slug === current ? 'page' : undefined}>{it.label} <StatusTag status={it.status} /></a>
            ))}
          </div>
        ))}
        <div className="drawer-group">
          <div className="drawer-title">More</div>
          {[...NAV_LINKS.solutions, ...NAV_LINKS.resources, { label: 'Pricing', href: '/pricing' }].map(l => (
            <a key={l.label} href={l.href} onClick={() => setDrawer(false)}>{l.label}</a>
          ))}
        </div>
        <button type="button" className="btn btn-ink btn-block" onClick={() => { setDrawer(false); openAccess('', 'drawer') }}>{CTA}</button>
      </aside>
    </>
  )
}
