# Waitlist → Google Sheet

Submissions from `/waitlist` are posted to a Google Apps Script web app, which
appends one row per signup to a Google Sheet you own. No server, no API keys in
the repo, and the sheet is the only place the data lives.

**The form does not record anything until step 5 is done.** Until then it shows
the confirmation and logs a warning to the browser console.

## 1. Create the sheet

Make a new Google Sheet (e.g. "Bylda Waitlist"). The script creates the
`Waitlist` tab and its header row on the first submission, so leave it empty.

## 2. Add the script

In that sheet: **Extensions → Apps Script**. Delete the placeholder
`function myFunction() {}` and paste the contents of
[`waitlist.gs`](./waitlist.gs). Save.

Optional: set `NOTIFY_EMAIL` at the top of the script to your address to get an
email on every signup.

## 3. Deploy it as a web app

**Deploy → New deployment → gear icon → Web app**, then:

| Field | Value |
| --- | --- |
| Description | `waitlist` |
| Execute as | **Me** |
| Who has access | **Anyone** |

"Anyone" is required — the visitor's browser posts to it while signed out. It
only ever appends rows; it never reads the sheet back.

Click **Deploy** and authorise the script when prompted (it needs permission to
edit the sheet, and to send mail if you set `NOTIFY_EMAIL`). Google will warn
that the app is unverified — that is expected for your own script: **Advanced →
Go to <project> (unsafe)**.

Copy the **Web app URL**. It looks like:

```
https://script.google.com/macros/s/AKfycb.../exec
```

Open that URL in a browser to check it is live — it should return
`{"ok":true,"service":"bylda-waitlist"}`.

## 4. Test it

```bash
curl -sS -L -X POST 'PASTE_YOUR_EXEC_URL' \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -d '{"name":"Test Person","email":"test@example.com","company":"Test Co","submittedAt":"2026-01-01T00:00:00Z"}'
```

Expect `{"ok":true}` and a new row in the sheet. Delete the test row afterwards.

## 5. Wire it into the site

Paste the URL into `data-endpoint` on the form in `waitlist.html`:

```html
<form class="js-waitlist-form form-stack" data-endpoint="https://script.google.com/macros/s/AKfycb.../exec">
```

Commit and deploy. Submit the live form once and confirm the row lands.

## What gets recorded

`submittedAt`, `name`, `email`, `company`, `size` (reps on the team), `crm`,
`note`, plus `page`, `referrer`, and any `utm_*` parameters that were on the
URL. Fields added to the form later get a new column automatically — the script
does not need editing.

The form also carries a hidden `website` honeypot field. Bots fill it, people
never see it; those submissions are silently dropped in the browser and never
reach the sheet.

## If you redeploy the script

Editing the script does **not** change the live web app on its own. Use
**Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy**
to keep the same URL. Creating a *new deployment* instead mints a new URL, which
would need updating in `waitlist.html`.

## Notes

- `script.google.com` and `script.googleusercontent.com` are allowlisted in the
  `connect-src` CSP directive in `vercel.json`. Removing them breaks the form.
- The web app URL is public by design. Anyone who finds it can append rows, so
  treat the sheet as unvalidated input and skim for junk before importing.
