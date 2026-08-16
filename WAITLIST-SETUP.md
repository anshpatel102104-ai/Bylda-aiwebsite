# Waitlist setup — Turnstile + Google Sheet

The waitlist form posts to `/api/waitlist`, which verifies a Cloudflare
Turnstile token before appending a row to a Google Sheet. Until the four steps
below are done the form falls back to its old behaviour: it shows the success
panel locally and stores nothing. Nothing on the live site breaks while the
setup is half-finished.

## What each piece does

| File | Role |
| --- | --- |
| `waitlist.html` | Renders the Turnstile widget and the hidden honeypot field. |
| `os.js` | Posts the form as JSON, shows errors, resets the widget on failure. |
| `api/waitlist.js` | Vercel function. Verifies the token with Cloudflare, then writes the row. **This is the gate** — everything else is UI. |
| `scripts/waitlist-sheet.gs` | Apps Script pasted into the Sheet; appends the row. |
| `vercel.json` | CSP allows `challenges.cloudflare.com` for script, frame, and connect. |

The reason the check lives in `api/waitlist.js` and not in the browser: a bot
does not run `os.js`. It POSTs to `/api/waitlist` directly. Only Cloudflare's
verdict on the token, checked server-side with your secret key, stops it.

## 1. Create the Turnstile keypair

1. Cloudflare dashboard → **Turnstile** → **Add widget**.
2. Name it `bylda-waitlist`. Add hostnames `usebylda.com` and `localhost`.
3. Widget mode **Managed** is right here — most real visitors pass with no
   interaction at all.
4. Copy the **site key** (public) and the **secret key** (private).

## 2. Paste the site key into the page

In `waitlist.html`, replace the placeholder:

```html
<div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY" ...>
```

The site key is public and belongs in the HTML — it is the secret key that must
never be committed. `os.js` treats any value still starting with `YOUR_` as
unconfigured and falls back to the old behaviour, so this swap is what arms the
form.

## 3. Set up the Google Sheet

1. Create a sheet named something like **Bylda Waitlist**.
2. **Extensions → Apps Script**. Delete the stub and paste all of
   `scripts/waitlist-sheet.gs`.
3. **Project Settings → Script Properties → Add**: name `SHARED_TOKEN`, value a
   long random string. Generate one with `openssl rand -hex 32`. Keep it handy
   for step 4.
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Copy the resulting `/exec` URL.

"Anyone" is required — Vercel calls it unauthenticated. The `SHARED_TOKEN`
check is what keeps the URL alone from being enough to write rows, which is why
step 3.3 is not optional.

## 4. Add the environment variables in Vercel

Project → **Settings → Environment Variables**, for Production and Preview:

| Name | Value |
| --- | --- |
| `TURNSTILE_SECRET_KEY` | Secret key from step 1 |
| `SHEET_WEBHOOK_URL` | The `/exec` URL from step 3.4 |
| `SHEET_WEBHOOK_TOKEN` | The same random string as `SHARED_TOKEN` |

Redeploy so the function picks them up. If `TURNSTILE_SECRET_KEY` is missing
the endpoint returns 503 and refuses every signup rather than accepting
unverified ones.

## Testing

Cloudflare publishes keys that force a known outcome — useful before going
live:

| Site key | Secret key | Result |
| --- | --- | --- |
| `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` | always passes |
| `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` | always fails |

Set the failing pair and confirm the form shows an error rather than a success
panel. That is the check that proves verification is actually wired up — a
green form tells you nothing on its own.

To confirm the endpoint rejects a direct POST, the way a bot would send it:

```bash
curl -i -X POST https://usebylda.com/api/waitlist \
  -H 'content-type: application/json' \
  -d '{"name":"Bot","email":"bot@example.com","company":"Bots Inc"}'
```

Expect `400` with `Please complete the verification check.`

## Known limits

- **No-JS visitors cannot sign up.** Turnstile needs JavaScript to mint a
  token, so this is inherent to any CAPTCHA, not a bug in this wiring.
- **No rate limit.** Turnstile is the only gate. A solver farm that pays for
  real tokens gets through. If that ever happens, add Vercel Firewall rate
  limiting on `/api/waitlist` — that is the cheaper fix than a harder CAPTCHA.
- **The contact form on `contact.html` is still local-only**, exactly as the
  waitlist form was. It needs the same treatment when you want it real.
- **Signup loss on a sheet outage** is logged, not retried. The full row is
  written to the Vercel function log so it can be replayed by hand.
