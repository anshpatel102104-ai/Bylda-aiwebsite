/**
 * Waitlist intake — the only path a signup can take into the sheet.
 *
 * A CAPTCHA is only worth anything on the server. The browser hands us a
 * Cloudflare Turnstile token; we hand that token to Cloudflare along with our
 * secret, and only a token Cloudflare vouches for buys a row in the sheet.
 * Nothing here trusts the client: a bot that skips os.js and POSTs directly
 * gets the same checks, and without a valid token it gets a 403.
 *
 * Three gates, cheapest first:
 *   1. Honeypot  — a hidden field only an autofilling bot would touch.
 *   2. Shape     — required fields, plausible email, length caps.
 *   3. Turnstile — Cloudflare's verdict on the token.
 *
 * Env (Vercel project settings, see WAITLIST-SETUP.md):
 *   TURNSTILE_SECRET_KEY  secret half of the Turnstile keypair. Required.
 *   SHEET_WEBHOOK_URL     Apps Script web-app URL that appends the row.
 *   SHEET_WEBHOOK_TOKEN   shared secret the Apps Script checks, so the
 *                         web-app URL alone is not enough to write rows.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** Longest value we will accept per field, keyed by field name. */
const LIMITS = { name: 120, email: 200, company: 160, size: 40, crm: 60, note: 2000 }

/** Deliberately loose — real address validation is the confirmation email. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default async function handler(req, res) {
  // TEMPORARY — remove once the env vars are confirmed working.
  // GET /api/waitlist?diagnostic=1 reports which variables this deployment can
  // actually see, and which commit it is running. Names, lengths and booleans
  // only: no value is ever echoed back, so nothing secret leaves the function.
  if (req.method === 'GET' && req.query?.diagnostic) {
    return res.status(200).json({
      diagnostic: true,
      runningCommit: process.env.VERCEL_GIT_COMMIT_SHA || '(unknown)',
      vercelEnv: process.env.VERCEL_ENV || '(unknown)',
      env: {
        TURNSTILE_SECRET_KEY: describeEnv('TURNSTILE_SECRET_KEY'),
        SHEET_WEBHOOK_URL: describeEnv('SHEET_WEBHOOK_URL'),
        SHEET_WEBHOOK_TOKEN: describeEnv('SHEET_WEBHOOK_TOKEN')
      }
    })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed.' })
  }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.error('[waitlist] TURNSTILE_SECRET_KEY is not set; refusing to accept signups')
    return res.status(503).json({ ok: false, error: 'The waitlist is not accepting signups right now.' })
  }

  const body = parseBody(req.body)
  if (!body) return res.status(400).json({ ok: false, error: 'Malformed request.' })

  // 1. Honeypot. The field is off-screen and aria-hidden, so a human never
  //    fills it. Answer 200 so the bot books it as a success and moves on.
  if (str(body.website)) return res.status(200).json({ ok: true })

  // 2. Shape.
  const fields = {}
  for (const [key, max] of Object.entries(LIMITS)) {
    const value = str(body[key])
    if (value.length > max) {
      return res.status(400).json({ ok: false, error: `That ${key} is too long.` })
    }
    fields[key] = value
  }
  if (!fields.name || !fields.company) {
    return res.status(400).json({ ok: false, error: 'Please fill in your name and company.' })
  }
  if (!EMAIL.test(fields.email)) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid work email.' })
  }

  // 3. Turnstile.
  const token = str(body['cf-turnstile-response'])
  if (!token) {
    return res.status(400).json({ ok: false, error: 'Please complete the verification check.' })
  }

  let verdict
  try {
    verdict = await verifyTurnstile(token, secret, clientIp(req))
  } catch (cause) {
    console.error('[waitlist] Turnstile verification failed to complete', cause)
    return res.status(502).json({ ok: false, error: 'We could not verify that request. Please try again.' })
  }

  if (!verdict.success) {
    // Cloudflare's own guidance: a stale or reused token is a retry, not an
    // attack, so say something a real person can act on.
    const codes = verdict['error-codes'] || []
    const stale = codes.includes('timeout-or-duplicate')
    console.warn('[waitlist] Turnstile rejected a submission', codes)
    return res.status(403).json({
      ok: false,
      error: stale
        ? 'That verification expired. Please try again.'
        : 'Verification failed. Please reload the page and try again.'
    })
  }

  // Verified. Record it.
  const row = {
    submittedAt: new Date().toISOString(),
    name: fields.name,
    email: fields.email,
    company: fields.company,
    size: fields.size,
    crm: fields.crm,
    note: fields.note
  }

  try {
    await appendToSheet(row)
  } catch (cause) {
    // The signup is real and verified; losing it to a sheet outage would be
    // worse than a duplicate. Log the whole row so it can be replayed by hand.
    console.error('[waitlist] could not append to sheet', JSON.stringify(row), cause)
    return res.status(502).json({ ok: false, error: 'We could not save your spot. Please try again in a minute.' })
  }

  return res.status(200).json({ ok: true })
}

/**
 * Describes an env var without disclosing it. Length separates "saved blank"
 * from "saved fine"; the whitespace flag catches the newline a paste drags
 * along, which is invisible in the dashboard and breaks the value silently.
 */
function describeEnv(name) {
  const raw = process.env[name]
  if (raw === undefined) return { present: false, note: 'not set at all' }
  if (raw === '') return { present: false, note: 'set but empty' }
  return {
    present: true,
    length: raw.length,
    hasSurroundingWhitespace: raw !== raw.trim()
  }
}

/** Vercel parses JSON bodies for us, but not when the content-type is off. */
function parseBody(raw) {
  if (raw && typeof raw === 'object') return raw
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw)
  } catch {
    return Object.fromEntries(new URLSearchParams(raw))
  }
}

function str(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/** Passed to Cloudflare for its own scoring only — never stored. */
function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  return forwarded ? String(forwarded).split(',')[0].trim() : ''
}

async function verifyTurnstile(token, secret, remoteip) {
  const form = new URLSearchParams({ secret, response: token })
  if (remoteip) form.set('remoteip', remoteip)

  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
    signal: AbortSignal.timeout(10_000)
  })
  if (!res.ok) throw new Error(`siteverify returned ${res.status}`)
  return res.json()
}

/**
 * Appends the row via the Apps Script web app bound to the sheet. Apps Script
 * answers the POST with a 302 to a googleusercontent.com URL that carries the
 * real response, which fetch follows by default.
 */
async function appendToSheet(row) {
  const url = process.env.SHEET_WEBHOOK_URL
  if (!url) throw new Error('SHEET_WEBHOOK_URL is not set')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: process.env.SHEET_WEBHOOK_TOKEN || '', row }),
    signal: AbortSignal.timeout(10_000)
  })
  if (!res.ok) throw new Error(`Apps Script returned ${res.status}`)

  const result = await res.json().catch(() => null)
  if (!result?.ok) throw new Error(`Apps Script rejected the row: ${result?.error || 'no reason given'}`)
}
