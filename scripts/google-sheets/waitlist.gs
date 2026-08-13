/**
 * Bylda waitlist -> Google Sheet
 *
 * Paste this into the Apps Script editor of the Google Sheet that should hold
 * the waitlist (Extensions -> Apps Script), then deploy it as a web app.
 * Full setup steps: scripts/google-sheets/README.md
 *
 * Every POST from the waitlist form appends one row. The header row is written
 * automatically on the first submission, and new fields added to the form later
 * get their own column appended on the right — no schema edits needed here.
 */

/** Tab the rows are written to. Created automatically if missing. */
const SHEET_NAME = 'Waitlist';

/**
 * Columns in the order they should appear. Anything the form sends that is not
 * listed here is appended as a new column the first time it shows up.
 */
const COLUMNS = [
  'submittedAt',
  'name',
  'email',
  'company',
  'size',
  'crm',
  'note',
  'page',
  'referrer',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];

/** Email address to notify on each signup. Leave '' for no notifications. */
const NOTIFY_EMAIL = '';

function doPost(e) {
  try {
    const payload = parseBody_(e);
    if (!payload || !payload.email) {
      return json_({ ok: false, error: 'missing email' });
    }

    appendRow_(payload);
    notify_(payload);
    return json_({ ok: true });
  } catch (err) {
    // Surfaced in the Apps Script execution log under "Executions".
    console.error(err);
    return json_({ ok: false, error: String(err) });
  }
}

/** Lets you open the /exec URL in a browser to confirm the deployment is live. */
function doGet() {
  return json_({ ok: true, service: 'bylda-waitlist' });
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) return null;
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    // Fallback for form-encoded posts (e.g. a manual curl test).
    return e.parameter || null;
  }
}

function appendRow_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000); // serialises concurrent submissions
  try {
    const sheet = getSheet_();
    let headers = readHeaders_(sheet);

    if (!headers.length) {
      headers = COLUMNS.slice();
      writeHeaders_(sheet, headers);
    }

    // Any field the form starts sending later becomes a new column.
    const extras = Object.keys(payload).filter(k => headers.indexOf(k) === -1);
    if (extras.length) {
      headers = headers.concat(extras);
      writeHeaders_(sheet, headers);
    }

    if (isDuplicate_(sheet, headers, payload)) return;

    const row = headers.map(key => {
      const value = payload[key];
      return value === undefined || value === null ? '' : String(value);
    });
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

/**
 * True if this exact submission is already in the sheet.
 *
 * If the browser cannot read our reply — a CORS hiccup, a dropped connection —
 * the form retries the post, which can reach us twice. `submittedAt` is stamped
 * once per submission, so email + submittedAt identifies the retry and the
 * second copy is dropped. Only recent rows are scanned; a retry lands seconds
 * after the original.
 */
function isDuplicate_(sheet, headers, payload) {
  const emailCol = headers.indexOf('email');
  const stampCol = headers.indexOf('submittedAt');
  if (emailCol === -1 || stampCol === -1 || !payload.submittedAt) return false;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  const span = Math.min(25, lastRow - 1);
  const rows = sheet.getRange(lastRow - span + 1, 1, span, headers.length).getValues();
  return rows.some(row =>
    String(row[emailCol]) === String(payload.email) &&
    stamp_(row[stampCol]) === stamp_(payload.submittedAt)
  );
}

/** Sheets may hand an ISO timestamp back as a Date; compare like for like. */
function stamp_(value) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function getSheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  return book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
}

function readHeaders_(sheet) {
  if (sheet.getLastRow() === 0) return [];
  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(String)
    .filter(String);
}

function writeHeaders_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Keep timestamps as the exact ISO string we were sent, so they stay
  // sortable as text and comparable for the duplicate check.
  const stampCol = headers.indexOf('submittedAt');
  if (stampCol !== -1) {
    sheet.getRange(2, stampCol + 1, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
  }
}

function notify_(payload) {
  if (!NOTIFY_EMAIL) return;
  const lines = Object.keys(payload).map(k => k + ': ' + payload[k]);
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Waitlist signup — ' + (payload.company || payload.email),
    body: lines.join('\n'),
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
