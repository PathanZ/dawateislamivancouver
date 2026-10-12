/**
 * Faizan e Madina Vancouver — website forms
 *
 * Receives two forms from dawateislamivancouver.ca and saves each submission
 * as a row in this Google Sheet:
 *   - "Tax receipts"     : tax receipt requests
 *   - "Dua-e-Maghfirah"  : names for the collective dua at the Thursday Ijtima
 *
 * Dua-e-Maghfirah rules enforced here (so they can't be bypassed):
 *   - up to MAX_NAMES_PER_WEEK names per family (same phone number) for each Thursday
 *   - only this Thursday or the next one (never more than 2 weeks ahead)
 *   - names for a Thursday close at CUTOFF_HOUR on that day
 *
 * Setup (once):
 *  1. In the masjid's Google account, create a Google Sheet named "Website forms".
 *  2. In the sheet: Extensions → Apps Script. Delete what's there and paste this whole file.
 *  3. Optional: put the masjid email in NOTIFY_EMAIL to get an email for every submission.
 *  4. Click Deploy → New deployment → type "Web app".
 *       Execute as: Me      Who has access: Anyone
 *     Click Deploy, approve the permissions, and copy the Web app URL.
 *  5. Send that URL to whoever updates the website. It goes into FORMS_ENDPOINT in build.py.
 *  If you edit this script later: Deploy → Manage deployments → Edit → Version: New version.
 */

var NOTIFY_EMAIL = '';          // e.g. 'Surrey@dawateislamicanada.net' — leave empty for no emails
var MAX_NAMES_PER_WEEK = 3;
var MAX_WEEKS_AHEAD = 2;
var CUTOFF_HOUR = 17;           // 5 PM on Thursday
var TZ = 'America/Vancouver';

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.website) return json_({ ok: true });            // spam trap filled in
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (p.form === 'maghfirah') return maghfirah_(p);
    return receipt_(p);
  } catch (err) {
    return json_({ ok: false, error: 'Something went wrong. Please try again, or call the masjid.' });
  } finally {
    lock.releaseLock();
  }
}

// ---------- Tax receipt requests ----------
var RECEIPT_FIELDS = [
  ['donor_type', 'Receipt for'], ['name', 'Name or business name'], ['address', 'Mailing address'],
  ['amount', 'Amount (CAD)'], ['date', 'Donation date'], ['donation_type', 'Type of donation'],
  ['method', 'How they donated'], ['email', 'Email'], ['phone', 'Phone'],
];

function receipt_(p) {
  var sh = tab_('Tax receipts', ['Received'].concat(RECEIPT_FIELDS.map(function (f) { return f[1]; }), ['Receipt sent?', 'Notes']));
  sh.appendRow([new Date()].concat(RECEIPT_FIELDS.map(function (f) { return clean_(p[f[0]]); }), ['', '']));
  notify_('New tax receipt request: ' + clean_(p.name), RECEIPT_FIELDS.map(function (f) { return f[1] + ': ' + clean_(p[f[0]]); }).join('\n'));
  return json_({ ok: true });
}

// ---------- Dua-e-Maghfirah ----------
function maghfirah_(p) {
  var allowed = allowedThursdays_();
  var week = clean_(p.week);
  if (allowed.indexOf(week) === -1) {
    return json_({ ok: false, error: 'Please choose this Thursday or next Thursday. Names can be booked up to 2 weeks ahead.' });
  }
  var names = [];
  for (var i = 1; i <= 3; i++) {
    var n = clean_(p['deceased_' + i]);
    if (n) names.push([n, clean_(p['relation_' + i])]);
  }
  if (!names.length) return json_({ ok: false, error: 'Please enter at least one name.' });
  var phone = String(p.phone || '').replace(/\D/g, '').slice(-10);
  if (phone.length < 10) return json_({ ok: false, error: 'Please enter a phone number with area code.' });

  var sh = tab_('Dua-e-Maghfirah', ['Received', 'Thursday', 'Name of the deceased', 'Relation', 'Submitted by', 'Phone', 'Email', 'Read at Ijtima?']);
  var already = 0;
  if (sh.getLastRow() > 1) {
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();
    rows.forEach(function (r) {
      var w = r[1] instanceof Date ? Utilities.formatDate(r[1], TZ, 'yyyy-MM-dd') : String(r[1]);
      if (w === week && String(r[5]).replace(/\D/g, '').slice(-10) === phone) already++;
    });
  }
  var left = MAX_NAMES_PER_WEEK - already;
  if (names.length > left) {
    return json_({ ok: false, error: left <= 0
      ? 'This phone number already has ' + MAX_NAMES_PER_WEEK + ' names for that Thursday. Please choose next Thursday.'
      : 'This phone number can add ' + left + ' more name' + (left === 1 ? '' : 's') + ' for that Thursday (limit ' + MAX_NAMES_PER_WEEK + ' per week).' });
  }
  var who = clean_(p.submitter), email = clean_(p.email);
  names.forEach(function (n) { sh.appendRow([new Date(), "'" + week, n[0], n[1], who, "'" + phone, email, '']); });
  notify_('Dua-e-Maghfirah names for ' + week, names.map(function (n) { return n[0] + (n[1] ? ' (' + n[1] + ')' : ''); }).join('\n') + '\n\nSubmitted by ' + who + ', ' + phone);
  return json_({ ok: true });
}

// The Thursdays people may book: this Thursday (until the cutoff) and the one after
function allowedThursdays_() {
  var now = new Date();
  var dow = Number(Utilities.formatDate(now, TZ, 'u')) % 7;   // 1=Mon … 7=Sun → Sun=0
  var hour = Number(Utilities.formatDate(now, TZ, 'H'));
  var add = (4 - dow + 7) % 7;
  if (add === 0 && hour >= CUTOFF_HOUR) add = 7;
  // count days from noon today, so daylight-saving changes can't shift the date
  var noon = Utilities.parseDate(Utilities.formatDate(now, TZ, 'yyyy-MM-dd') + ' 12:00', TZ, 'yyyy-MM-dd HH:mm');
  var out = [];
  for (var k = 0; k < MAX_WEEKS_AHEAD; k++) {
    out.push(Utilities.formatDate(new Date(noon.getTime() + (add + 7 * k) * 864e5), TZ, 'yyyy-MM-dd'));
  }
  return out;
}

// ---------- helpers ----------
function tab_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(header); sh.setFrozenRows(1); }
  return sh;
}

// Keep text plain: trim, limit length, and stop spreadsheet formulas from running
function clean_(v) {
  v = String(v == null ? '' : v).trim().slice(0, 500);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function notify_(subject, body) {
  if (NOTIFY_EMAIL) MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
