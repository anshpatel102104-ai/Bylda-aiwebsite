# API functions

Vercel builds every file in this directory into a serverless function, straight
from the repo root — `scripts/assemble-site.mjs` deliberately keeps `api/` out
of `dist/` so the source is never also served as a static file.

## `waitlist.js` → `POST /api/waitlist`

Takes the waitlist form on `/waitlist`, emails the person a welcome, and copies
their answers to the team inbox. Mail goes through [Resend](https://resend.com)
over plain REST, so there are no dependencies to install.

### Setup

1. Create a Resend account and verify **usebylda.com** as a sending domain
   (add the DKIM/SPF records Resend gives you to the DNS for the domain).
2. Create an API key in Resend.
3. Add these environment variables to the Vercel project
   (Settings → Environment Variables), for Production *and* Preview:

   | Variable | Required | Default | Notes |
   | --- | --- | --- | --- |
   | `RESEND_API_KEY` | yes | — | Without it no mail sends; the form still succeeds and the miss is logged. |
   | `WAITLIST_FROM` | no | `Bylda <hello@usebylda.com>` | Must be on a domain verified in Resend. |
   | `WAITLIST_NOTIFY_TO` | no | `hello@usebylda.com` | Comma-separated. Set to an empty string to turn the internal copy off. |

4. Redeploy — environment variables are read at cold start.

### Behaviour

| Response | When |
| --- | --- |
| `200 {ok:true, emailed:true}` | Welcome email accepted by Resend. |
| `200 {ok:true, emailed:false}` | `RESEND_API_KEY` is unset (preview deploys). |
| `400 {error}` | Missing or malformed email address. |
| `405` | Anything other than `POST`. |
| `502 {error}` | Resend rejected the send — the front end asks the visitor to retry. |

The confirmation panel on `/waitlist` only appears on a 2xx, so nobody is told
they are on the list when the email never went out. The internal notification is
best effort: if it fails, the signup is still a success and the error is logged.
