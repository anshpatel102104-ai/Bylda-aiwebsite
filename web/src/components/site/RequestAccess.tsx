import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircle, Question, X } from '@phosphor-icons/react/dist/ssr'
import { CONTACT_EMAIL, CTA, INDUSTRIES, TURNSTILE_SITEKEY } from '../../data/site'
import { closeAccess, showToast, useSite } from '../../lib/site-store'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; 'expired-callback'?: () => void; appearance?: string }) => string
      reset: (id?: string) => void
      remove: (id: string) => void
    }
  }
}

/** Loads Cloudflare Turnstile once, on first open. The existing CSP already allows it. */
let turnstileLoading: Promise<void> | null = null
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve()
  turnstileLoading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('turnstile'))
    document.head.appendChild(s)
  })
  return turnstileLoading
}

/**
 * Request access. Posts to the existing /api/waitlist endpoint, which checks
 * a honeypot, the field shapes and the Turnstile token before writing a row.
 */
export function RequestAccess() {
  const { access } = useSite()
  const dialog = useRef<HTMLDivElement>(null)
  const widget = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!access.open) return
    setError('')
    const prev = document.activeElement as HTMLElement | null
    dialog.current?.querySelector<HTMLInputElement>('input[name="email"]')?.focus()
    let cancelled = false
    loadTurnstile().then(() => {
      if (cancelled || !widget.current || !window.turnstile || widgetId.current) return
      widgetId.current = window.turnstile.render(widget.current, {
        sitekey: TURNSTILE_SITEKEY,
        appearance: 'interaction-only',
        callback: t => setToken(t),
        'expired-callback': () => setToken(''),
      })
    }).catch(() => setError('The verification check could not load. You can also email ' + CONTACT_EMAIL + '.'))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAccess()
      if (e.key === 'Tab' && dialog.current) {
        // Keep focus inside the dialog.
        const f = dialog.current.querySelectorAll<HTMLElement>('input, select, button, a[href]')
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    document.documentElement.setAttribute('data-modal', '')
    return () => {
      cancelled = true
      window.removeEventListener('keydown', onKey)
      document.documentElement.removeAttribute('data-modal')
      if (widgetId.current && window.turnstile) { window.turnstile.remove(widgetId.current); widgetId.current = null }
      setToken('')
      prev?.focus?.()
    }
  }, [access.open])

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    const body: Record<string, string> = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]))
    const params = new URLSearchParams(window.location.search)
    Object.assign(body, {
      source: access.source,
      landingPath: window.location.pathname,
      referrer: document.referrer.slice(0, 500),
      utmSource: params.get('utm_source') ?? '',
      utmMedium: params.get('utm_medium') ?? '',
      utmCampaign: params.get('utm_campaign') ?? '',
      'cf-turnstile-response': token,
    })
    if (!token) { setError('Still verifying your browser. Give it a moment and try again.'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error || 'Something went wrong on our end. Please try again.')
        if (widgetId.current) window.turnstile?.reset(widgetId.current)
        return
      }
      closeAccess()
      showToast('You are on the list. We will be in touch.')
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal" data-open={access.open || undefined} aria-hidden={!access.open}>
      <div className="modal-scrim" onClick={closeAccess} />
      <div ref={dialog} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="ra-title">
        <button type="button" className="icon-btn modal-close" aria-label="Close" onClick={closeAccess}><X size={18} /></button>
        <h2 id="ra-title" className="modal-title">{CTA}</h2>
        <p className="modal-lede">Tell us where you sell. We will reach out with a walkthrough on your own calls.</p>
        {access.open && (
          <form className="form" onSubmit={submit} noValidate={false}>
            <label className="field">
              <span>Work email</span>
              <input name="email" type="email" required autoComplete="email" defaultValue={access.email} />
            </label>
            <label className="field">
              <span>Company</span>
              <input name="company" type="text" required autoComplete="organization" maxLength={160} />
            </label>
            <label className="field">
              <span>Industry</span>
              <select name="industry" required defaultValue="">
                <option value="" disabled>Select your industry</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
            <label className="field">
              <span>CRM <em>optional</em></span>
              <input name="crm" type="text" maxLength={60} />
            </label>
            {/* Honeypot: off-screen, only an autofilling bot fills it. */}
            <label className="hp" aria-hidden="true">Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
            <div ref={widget} className="turnstile" />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-ink btn-block" disabled={busy}>{busy ? 'Sending' : CTA}</button>
            <p className="form-note">Or email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
          </form>
        )}
      </div>
    </div>
  )
}

export function Toast() {
  const { toast } = useSite()
  return (
    <div className="toast" role="status" aria-live="polite" data-open={toast ? true : undefined}>
      {toast && <><CheckCircle size={18} weight="fill" aria-hidden="true" /> {toast.text}</>}
    </div>
  )
}

/** Floating help: a compact popover rather than a new page. */
export function HelpButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])
  return (
    <div ref={ref} className="help">
      <div className="help-pop" data-open={open || undefined} role="dialog" aria-label="Help" aria-hidden={!open}>
        <p className="help-title">Questions?</p>
        <a href="#faq" onClick={() => setOpen(false)}>Read the FAQ</a>
        <a href="/security">Security and data handling</a>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </div>
      <button type="button" className="help-btn" aria-label="Help" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Question size={22} weight="bold" />
      </button>
    </div>
  )
}
