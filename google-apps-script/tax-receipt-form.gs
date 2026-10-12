/**
 * Faizan e Madina Vancouver — tax receipt requests
 *
 * Receives the "Request a tax receipt" form from dawateislamivancouver.ca
 * and adds each request as a new row in this Google Sheet.
 *
 * Setup (once):
 *  1. In the masjid's Google account, create a Google Sheet named "Tax receipt requests".
 *  2. In the sheet: Extensions → Apps Script. Delete what's there and paste this whole file.
 *  3. Optional: put the masjid email in NOTIFY_EMAIL below to get an email for every request.
 *  4. Click Deploy → New deployment → type "Web app".
 *       Execute as: Me      Who has access: Anyone
 *     Click Deploy, approve the permissions, and copy the Web app URL.
 *  5. Send that URL to whoever updates the website. It goes into RECEIPT_ENDPOINT in build.py.
 */

var NOTIFY_EMAIL = '';   // e.g. 'Surrey@dawateislamicanada.net' — leave empty for no emails

var FIELDS = [
  ['donor_type', 'Receipt for'],
  ['name', 'Name or business name'],
  ['address', 'Mailing address'],
  ['amount', 'Amount (CAD)'],
  ['date', 'Donation date'],
  ['donation_type', 'Type of donation'],
  ['method', 'How they donated'],
  ['email', 'Email'],
  ['phone', 'Phone'],
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var p = (e && e.parameter) || {};
    if (p.website) return ok_();                       // spam trap filled in
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Received'].concat(FIELDS.map(function (f) { return f[1]; }), ['Receipt sent?', 'Notes']));
      sheet.setFrozenRows(1);
    }
    var row = [new Date()].concat(FIELDS.map(function (f) { return clean_(p[f[0]]); }), ['', '']);
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      var body = FIELDS.map(function (f) { return f[1] + ': ' + clean_(p[f[0]]); }).join('\n');
      MailApp.sendEmail(NOTIFY_EMAIL, 'New tax receipt request: ' + clean_(p.name), body);
    }
    return ok_();
  } finally {
    lock.releaseLock();
  }
}

// Keep text plain: trim, limit length, and stop spreadsheet formulas from running
function clean_(v) {
  v = String(v == null ? '' : v).trim().slice(0, 500);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function ok_() {
  return ContentService.createTextOutput('ok');
}
