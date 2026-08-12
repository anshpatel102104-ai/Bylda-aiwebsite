/**
 * POST /api/waitlist — waitlist signup.
 *
 * Sends the new signup a welcome email and drops a copy of their answers in
 * the team inbox so nothing is lost. Mail goes out through Resend over plain
 * REST, so this function has no dependencies to install.
 *
 * Environment (set in the Vercel project):
 *   RESEND_API_KEY     required for mail to actually send
 *   WAITLIST_FROM      sender, must be on a domain verified in Resend
 *                      (default "Bylda <hello@usebylda.com>")
 *   WAITLIST_NOTIFY_TO where the internal copy lands
 *                      (default "hello@usebylda.com", empty disables it)
 *
 * Without RESEND_API_KEY the signup still returns 200 so preview deploys keep
 * a working form — the response carries emailed:false and the miss is logged.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = process.env.WAITLIST_FROM || "Bylda <hello@usebylda.com>";
const NOTIFY_TO =
  process.env.WAITLIST_NOTIFY_TO === undefined
    ? "hello@usebylda.com"
    : process.env.WAITLIST_NOTIFY_TO;

const MAX_FIELD = 400;
const MAX_NOTE = 2000;

const clean = (value, limit = MAX_FIELD) =>
  typeof value === "string" ? value.trim().slice(0, limit) : "";

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const firstName = (name) => name.split(/\s+/)[0] || "";

/* ---------- the welcome email ---------- */

function welcomeSubject(name) {
  const first = firstName(name);
  return first ? `You're on the Bylda waitlist, ${first}` : "You're on the Bylda waitlist";
}

function welcomeText({ name, crm }) {
  const first = firstName(name);
  return [
    first ? `${first},` : "Hi,",
    "",
    "Thank you for joining the waitlist at Bylda. We're genuinely excited to show you what we've been building.",
    "",
    "Bylda is the AI Sales Operating System. Every salesperson gets an AI Sales Operator — a teammate that listens to every customer conversation, understands what was actually said, and then does the work: writing the CRM record, drafting the follow-up, flagging the deal that went quiet.",
    "",
    "What happens next",
    "",
    `1. Your spot is saved. We have you down${crm ? ` on ${crm}` : ""}.`,
    "2. We open access in waves, grouped by CRM, so every workspace gets set up properly instead of all at once.",
    "3. Your invite arrives by email with a setup link. Connecting your CRM takes minutes.",
    "4. From day one, Bylda reads your conversations and writes the record for you.",
    "",
    "One thing we want to be clear about: there is no sequence and no drip. The next email you get from us is the one that says your wave is open.",
    "",
    "If you need the security review first, just reply here and we'll send the SOC 2 report and DPA ahead of your invite. Replies come to a real person.",
    "",
    "Glad to have you,",
    "The Bylda team",
    "",
    "https://usebylda.com",
  ].join("\n");
}

function welcomeHtml({ name, crm }) {
  const first = escapeHtml(firstName(name));
  const onCrm = crm ? ` on ${escapeHtml(crm)}` : "";

  const step = (label, copy) => `
    <tr>
      <td style="padding:0 0 18px 0;vertical-align:top;width:78px">
        <span style="font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#6b7180">${label}</span>
      </td>
      <td style="padding:0 0 18px 0;vertical-align:top;font-size:15px;line-height:1.6;color:#2a2e38">${copy}</td>
    </tr>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Welcome to the Bylda waitlist</title>
</head>
<body style="margin:0;padding:0;background:#fbfbfd">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Your spot is saved. Here is what happens next — and what we will not send you.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbfbfd;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(11,12,16,.075);border-radius:20px;box-shadow:0 10px 24px -8px rgba(16,24,48,.10)">
          <tr>
            <td style="padding:34px 34px 0 34px">
              <a href="https://usebylda.com" style="text-decoration:none;color:#0b0c10;font-family:Georgia,'Times New Roman',serif;font-size:19px;letter-spacing:-.01em">Bylda</a>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 34px 0 34px">
              <p style="margin:0 0 10px 0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#4358d8">You're on the list</p>
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:1.15;letter-spacing:-.02em;color:#0b0c10">
                ${first ? `Thank you, ${first}.` : "Thank you for joining."}<br>
                <em style="color:#4358d8">Your spot is saved.</em>
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 34px 0 34px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.65;color:#2a2e38">
                Thank you for joining the waitlist at Bylda. We're genuinely excited to show you what we've been building.
              </p>
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.65;color:#2a2e38">
                Bylda is the AI Sales Operating System. Every salesperson gets an AI Sales Operator — a teammate that listens to every customer conversation, understands what was actually said, and then does the work: writing the CRM record, drafting the follow-up, flagging the deal that went quiet.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 34px 0 34px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f8;border-radius:16px;padding:22px 22px 6px 22px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
                <tr><td colspan="2" style="padding:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:19px;color:#0b0c10">What happens next</td></tr>
                ${step("Step 1", `Your spot is saved. We have you down${onCrm}.`)}
                ${step("Step 2", "We open access in waves, grouped by CRM, so every workspace gets set up properly instead of all at once.")}
                ${step("Step 3", "Your invite arrives by email with a setup link. Connecting your CRM takes minutes.")}
                ${step("Step 4", "From day one, Bylda reads your conversations and writes the record for you.")}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 34px 0 34px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
              <p style="margin:0 0 16px 0;font-size:16px;line-height:1.65;color:#2a2e38">
                One thing we want to be clear about: there is no sequence and no drip. The next email you get from us is the one that says your wave is open.
              </p>
              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.65;color:#2a2e38">
                Need the security review first? Reply to this email and we'll send the SOC 2 report and DPA ahead of your invite. Replies come to a real person.
              </p>
              <a href="https://usebylda.com/how-it-works" style="display:inline-block;background:#0b0c10;color:#ffffff;text-decoration:none;font-size:15px;font-weight:500;padding:13px 22px;border-radius:12px">See how it works &rarr;</a>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 34px 34px 34px">
              <div style="border-top:1px solid rgba(11,12,16,.075);padding-top:18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
                <p style="margin:0 0 6px 0;font-size:14px;line-height:1.6;color:#565c6b">Glad to have you,<br>The Bylda team</p>
                <p style="margin:12px 0 0 0;font-size:12px;line-height:1.6;color:#6b7180">
                  You're getting this because you joined the waitlist at <a href="https://usebylda.com/waitlist" style="color:#4358d8;text-decoration:none">usebylda.com</a>.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function notifyHtml(signup) {
  const row = (label, value) =>
    value
      ? `<tr><td style="padding:4px 14px 4px 0;color:#6b7180;font-size:13px">${label}</td><td style="padding:4px 0;color:#0b0c10;font-size:14px">${escapeHtml(value)}</td></tr>`
      : "";
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <h2 style="font-size:16px;margin:0 0 12px 0;color:#0b0c10">New waitlist signup</h2>
  <table cellpadding="0" cellspacing="0">
    ${row("Name", signup.name)}
    ${row("Email", signup.email)}
    ${row("Company", signup.company)}
    ${row("Reps", signup.size)}
    ${row("CRM", signup.crm)}
    ${row("Note", signup.note)}
    ${row("Received", new Date().toISOString())}
  </table>
</div>`;
}

/* ---------- transport ---------- */

async function sendEmail(payload) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/* ---------- handler ---------- */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Malformed request." });
    }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Malformed request." });
  }

  const signup = {
    name: clean(body.name),
    email: clean(body.email).toLowerCase(),
    company: clean(body.company),
    size: clean(body.size),
    crm: clean(body.crm),
    note: clean(body.note, MAX_NOTE),
  };

  if (!isEmail(signup.email)) {
    return res.status(400).json({ error: "Please enter a valid work email." });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[waitlist] RESEND_API_KEY is not set — no mail sent for", signup.email);
    return res.status(200).json({ ok: true, emailed: false });
  }

  try {
    await sendEmail({
      from: FROM,
      to: [signup.email],
      reply_to: "hello@usebylda.com",
      subject: welcomeSubject(signup.name),
      html: welcomeHtml(signup),
      text: welcomeText(signup),
      tags: [{ name: "type", value: "waitlist_welcome" }],
    });
  } catch (err) {
    console.error("[waitlist] welcome email failed:", err.message);
    return res.status(502).json({ error: "We could not send your confirmation. Please try again." });
  }

  // Best effort — the signup is already confirmed, so a failed internal copy
  // must not turn into an error for the person who just joined.
  if (NOTIFY_TO) {
    try {
      await sendEmail({
        from: FROM,
        to: NOTIFY_TO.split(",").map((a) => a.trim()).filter(Boolean),
        reply_to: signup.email,
        subject: `Waitlist: ${signup.name || signup.email}${signup.company ? ` · ${signup.company}` : ""}`,
        html: notifyHtml(signup),
      });
    } catch (err) {
      console.error("[waitlist] internal notification failed:", err.message);
    }
  }

  return res.status(200).json({ ok: true, emailed: true });
}
