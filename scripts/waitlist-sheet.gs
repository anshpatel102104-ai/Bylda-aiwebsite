/**
 * Google Apps Script — appends verified waitlist signups to the bound sheet.
 *
 * This is not part of the site build. Paste it into Extensions > Apps Script
 * on the Google Sheet itself, then deploy it as a web app. Full walkthrough in
 * WAITLIST-SETUP.md.
 *
 * Deploying "anyone" means the URL is the only thing standing between the
 * internet and your sheet, so the shared token below is checked on every
 * request. Set it under Project Settings > Script Properties as SHARED_TOKEN,
 * matching SHEET_WEBHOOK_TOKEN in Vercel.
 */

var HEADERS = ['Submitted at', 'Name', 'Email', 'Company', 'Team size', 'CRM', 'Note'];

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var expected = PropertiesService.getScriptProperties().getProperty('SHARED_TOKEN');

    if (!expected || payload.token !== expected) {
      return json({ ok: false, error: 'unauthorized' });
    }

    var row = payload.row || {};
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // First write of a fresh sheet lays down the header row.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([
      row.submittedAt || new Date().toISOString(),
      row.name || '',
      row.email || '',
      row.company || '',
      row.size || '',
      row.crm || '',
      row.note || ''
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
