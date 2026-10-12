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
 *
 * FREE TUTORING (children's information — keep access tight):
 *  6. Create a SEPARATE Google Sheet named "Tutoring registrations", shared only with the tutoring
 *     coordinator and one backup person. Copy its ID (the long code in its web address between
 *     /d/ and /edit) into TUTORING_SHEET_ID below.
 *  7. Create a Google Drive folder named "Tutoring uploads" (same restricted sharing) and put its
 *     ID (the code at the end of the folder's web address) into TUTORING_FOLDER_ID.
 *  8. Put the coordinator's email into TUTORING_COORDINATOR_EMAIL.
 *  9. In the Apps Script editor, choose the function setupTutoringTriggers and click Run (once).
 *     This turns on: confirmation emails when Status is changed, and automatic deletion of old photos.
 * 10. Redeploy (Deploy → Manage deployments → Edit → New version).
 *  To confirm or decline a request: in the "Tutoring" tab, change Status to Confirmed or Declined
 *  (optionally type a note in "Message to parent" first). The parent is emailed automatically.
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
    if (p.form === 'tutoring') return tutoring_(p);
    return receipt_(p);
  } catch (err) {
    return json_({ ok: false, error: 'Something went wrong. Please try again, or call the Islamic Centre.' });
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


// ---------- Free tutoring ----------
// Keep these in step with assets/tutoring.js on the website.
var TUTORING_SHEET_ID = '';          // separate, restricted Google Sheet for children's information
var TUTORING_FOLDER_ID = '';         // restricted Drive folder for photos of schoolwork
var TUTORING_COORDINATOR_EMAIL = ''; // gets an email for every new request
var TUTORING_BOOK_AHEAD_DAYS = 7;
var TUTORING_PER_MONTH = 1;
var TUTORING_PHOTO_DAYS = 120;       // photos are deleted after this many days
var TUTORING_SESSIONS = {            // id: [weekday 0=Sun..6=Sat, label, mode, spots]
  'sat-am': [6, '10:30 AM – 12:00 PM', 'in-person', 6],
  'wed-pm': [3, '6:00 PM – 7:00 PM', 'online', 4]
};
var TUT_HEAD = ['Received', 'Reference', 'Status', 'Message to parent', 'Email sent', 'Session date', 'Session', 'Session type',
  'Tutor preference', 'Child name', 'Date of birth', 'Grade', 'School', 'Child gender', 'Child pronouns', 'Subjects',
  'Where they are now', 'Help needed', 'Learning needs', 'Photos', 'Parent name', 'Relationship', 'Parent phone',
  'Parent email', 'Home address', 'Parent gender', 'Parent pronouns', 'Allergies', 'Medical', 'Emergency 1',
  'Emergency 2', 'Authorized pick-up', 'Custody notes', 'Notes', 'Camera consent', 'Consents', 'Signature',
  'Agreement version', 'Coordinator notes'];

function tutSheet_() {
  var ss = TUTORING_SHEET_ID ? SpreadsheetApp.openById(TUTORING_SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Tutoring') || ss.insertSheet('Tutoring');
  if (sh.getLastRow() === 0) {
    sh.appendRow(TUT_HEAD); sh.setFrozenRows(1);
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(['Pending', 'Confirmed', 'Declined', 'Cancelled', 'Attended', 'No-show'], true).build();
    sh.getRange(2, 3, 1000, 1).setDataValidation(rule);
  }
  return sh;
}

function tutoring_(p) {
  // session must be one of the next N days and a real weekly session
  var parts = String(p.slot || '').split('|'), date = parts[0], sid = parts[1], ses = TUTORING_SESSIONS[sid];
  var allowed = [];
  var noon = Utilities.parseDate(Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd') + ' 12:00', TZ, 'yyyy-MM-dd HH:mm');
  for (var k = 1; k <= TUTORING_BOOK_AHEAD_DAYS; k++) allowed.push(Utilities.formatDate(new Date(noon.getTime() + k * 864e5), TZ, 'yyyy-MM-dd'));
  if (!ses || allowed.indexOf(date) === -1) return json_({ ok: false, error: 'Please choose one of the sessions shown. Sessions can be booked up to ' + TUTORING_BOOK_AHEAD_DAYS + ' days ahead.' });
  var wd = Number(Utilities.formatDate(Utilities.parseDate(date + ' 12:00', TZ, 'yyyy-MM-dd HH:mm'), TZ, 'u')) % 7;
  if (wd !== ses[0]) return json_({ ok: false, error: 'That session is not offered on that day. Please choose again.' });
  var grade = Number(p.child_grade);
  if (!(grade >= 2 && grade <= 8)) return json_({ ok: false, error: 'The program is for Grades 2 to 8.' });
  var need = ['parent_name', 'parent_phone', 'parent_email', 'parent_address', 'child_name', 'child_dob', 'current_level', 'help_needed',
    'allergies', 'medical', 'emergency1_name', 'emergency1_phone', 'emergency2_name', 'emergency2_phone', 'signature', 'subjects'];
  for (var i = 0; i < need.length; i++) if (!clean_(p[need[i]])) return json_({ ok: false, error: 'Some required information is missing. Please check the form.' });
  var consents = ['c_guardian', 'c_agreement', 'c_onsite', 'c_respect', 'c_emergency', 'c_privacy'];
  for (i = 0; i < consents.length; i++) if (p[consents[i]] !== 'yes') return json_({ ok: false, error: 'Please tick all of the agreement boxes.' });
  if (ses[2] === 'in-person' && p.c_camera !== 'yes') return json_({ ok: false, error: 'In-person sessions need camera consent. Please tick that box or choose an online session.' });
  if (norm_(p.signature) !== norm_(p.parent_name)) return json_({ ok: false, error: 'Your signature must match the parent or guardian name.' });

  var sh = tutSheet_(), rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, TUT_HEAD.length).getValues() : [];
  var childKey = norm_(p.child_name) + '|' + clean_(p.child_dob), month = date.slice(0, 7), taken = 0, monthCount = 0;
  rows.forEach(function (r) {
    var st = String(r[2]); if (st === 'Declined' || st === 'Cancelled') return;
    var d = r[5] instanceof Date ? Utilities.formatDate(r[5], TZ, 'yyyy-MM-dd') : String(r[5]).replace(/^'/, '');
    var dob = r[10] instanceof Date ? Utilities.formatDate(r[10], TZ, 'yyyy-MM-dd') : String(r[10]).replace(/^'/, '');
    if (d === date && String(r[6]).indexOf(ses[1]) === 0) taken++;
    if (norm_(r[9]) + '|' + dob === childKey && d.slice(0, 7) === month) monthCount++;
  });
  if (monthCount >= TUTORING_PER_MONTH) return json_({ ok: false, error: 'This child already has a session booked this month. Each child can book ' + TUTORING_PER_MONTH + ' session per month.' });
  if (taken >= ses[3]) return json_({ ok: false, error: 'Sorry, that session is full. Please choose another date.' });

  var ref = 'T' + Utilities.formatDate(new Date(), TZ, 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
  var photoLink = savePhotos_(p, ref, clean_(p.child_name));
  var gender = function (a, b) { return clean_(p[a]) + (clean_(p[b]) ? ': ' + clean_(p[b]) : ''); };
  var given = consents.filter(function (c) { return p[c] === 'yes'; }).join(', ');
  sh.appendRow([new Date(), ref, 'Pending', '', '', "'" + date, ses[1] + ' (' + sid + ')', ses[2] === 'online' ? 'Online' : 'In person',
    clean_(p.tutor_preference), clean_(p.child_name), "'" + clean_(p.child_dob), grade, clean_(p.child_school),
    gender('child_gender', 'child_gender_describe'), clean_(p.child_pronouns), clean_(p.subjects), clean_(p.current_level),
    clean_(p.help_needed), clean_(p.learning_needs), photoLink, clean_(p.parent_name), clean_(p.parent_relationship),
    "'" + clean_(p.parent_phone), clean_(p.parent_email), clean_(p.parent_address), gender('parent_gender', 'parent_gender_describe'),
    clean_(p.parent_pronouns), clean_(p.allergies), clean_(p.medical),
    clean_(p.emergency1_name) + ' (' + clean_(p.emergency1_relationship) + ') ' + clean_(p.emergency1_phone),
    clean_(p.emergency2_name) + ' (' + clean_(p.emergency2_relationship) + ') ' + clean_(p.emergency2_phone),
    clean_(p.authorized_pickup), clean_(p.custody_notes), clean_(p.notes), p.c_camera === 'yes' ? 'Yes' : 'No', given,
    clean_(p.signature) + ' — signed ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss z'), clean_(p.terms_version), '']);

  var when = Utilities.formatDate(Utilities.parseDate(date + ' 12:00', TZ, 'yyyy-MM-dd HH:mm'), TZ, 'EEEE d MMMM yyyy') + ', ' + ses[1];
  try {
    MailApp.sendEmail(clean_(p.parent_email), 'Tutoring request received (' + ref + ') — Faizan e Madina Vancouver',
      'Assalamu alaikum ' + clean_(p.parent_name) + ',\n\nThank you for registering ' + clean_(p.child_name) + ' for free tutoring.\n\n' +
      'Requested session: ' + when + ' (' + (ses[2] === 'online' ? 'online' : 'in person at 7062 134 St, Surrey') + ')\nReference: ' + ref + '\n\n' +
      'This date is ON HOLD. Your session is NOT booked until you receive a confirmation email from us.\n\n' +
      'Questions? Reply to this email or call (778) 895-0886.\n\nFaizan e Madina Vancouver');
  } catch (err) {}
  if (TUTORING_COORDINATOR_EMAIL) MailApp.sendEmail(TUTORING_COORDINATOR_EMAIL, 'New tutoring request ' + ref + ' — ' + when,
    'Grade ' + grade + ', ' + clean_(p.subjects) + '\nTutor preference: ' + clean_(p.tutor_preference) + '\n\nOpen the Tutoring sheet to confirm or decline.');
  return json_({ ok: true, ref: ref });
}

function savePhotos_(p, ref, child) {
  var n = Math.min(5, Number(p.photo_count) || 0);
  if (!n || !TUTORING_FOLDER_ID) return n ? 'Photos not saved (no folder set)' : '';
  var root = DriveApp.getFolderById(TUTORING_FOLDER_ID), f = root.createFolder(ref + ' — ' + child);
  for (var i = 1; i <= n; i++) {
    var b64 = p['photo_' + i]; if (!b64) continue;
    var bytes = Utilities.base64Decode(b64);
    if (bytes.length > 6 * 1024 * 1024) continue;
    f.createFile(Utilities.newBlob(bytes, 'image/jpeg', ref + '-' + i + '.jpg'));
  }
  return f.getUrl();
}

// Runs when someone edits the Tutoring sheet: emails the parent when Status becomes Confirmed or Declined
function onTutoringEdit(e) {
  var sh = e.range.getSheet();
  if (sh.getName() !== 'Tutoring' || e.range.getColumn() !== 3 || e.range.getRow() < 2) return;
  var row = sh.getRange(e.range.getRow(), 1, 1, TUT_HEAD.length).getValues()[0];
  var status = String(row[2]); if (status !== 'Confirmed' && status !== 'Declined') return;
  if (String(row[4]).indexOf(status) === 0) return;                    // already emailed for this status
  var d = row[5] instanceof Date ? Utilities.formatDate(row[5], TZ, 'yyyy-MM-dd') : String(row[5]).replace(/^'/, '');
  var when = Utilities.formatDate(Utilities.parseDate(d + ' 12:00', TZ, 'yyyy-MM-dd HH:mm'), TZ, 'EEEE d MMMM yyyy') + ', ' + String(row[6]).replace(/ \(.*\)$/, '');
  var msg = row[3] ? '\n\n' + row[3] : '', body;
  if (status === 'Confirmed') {
    body = 'Assalamu alaikum ' + row[20] + ',\n\nYour tutoring session for ' + row[9] + ' is CONFIRMED.\n\nWhen: ' + when + '\nType: ' + row[7] +
      (row[7] === 'In person' ? '\nWhere: Faizan e Madina Vancouver, 7062 134 St, Surrey, BC\n\nPlease arrive 5 minutes early. A parent, guardian or authorized adult must stay on the premises and be reachable by phone for the whole session. Please dress modestly and keep noise low near the prayer areas.' :
        '\n\nWe will email the online link before the session. A parent or guardian must be in the room for the whole session.') +
      msg + '\n\nReference: ' + row[1] + '\nTo cancel or change, reply to this email or call (778) 895-0886.\n\nFaizan e Madina Vancouver';
  } else {
    body = 'Assalamu alaikum ' + row[20] + ',\n\nThank you for your request for ' + row[9] + '. Unfortunately we are not able to offer the requested session (' + when + ').' + msg +
      '\n\nYou are welcome to request another date on our website.\n\nReference: ' + row[1] + '\n\nFaizan e Madina Vancouver';
  }
  MailApp.sendEmail(String(row[23]), 'Tutoring ' + (status === 'Confirmed' ? 'confirmed' : 'request update') + ' (' + row[1] + ') — Faizan e Madina Vancouver', body);
  sh.getRange(e.range.getRow(), 5).setValue(status + ' email sent ' + Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm'));
}

// Deletes photo folders older than TUTORING_PHOTO_DAYS (runs daily once set up)
function deleteOldTutoringPhotos() {
  if (!TUTORING_FOLDER_ID) return;
  var cutoff = new Date(Date.now() - TUTORING_PHOTO_DAYS * 864e5), it = DriveApp.getFolderById(TUTORING_FOLDER_ID).getFolders();
  while (it.hasNext()) { var f = it.next(); if (f.getDateCreated() < cutoff) f.setTrashed(true); }
}

// Run once from the editor to switch on the two automatic tasks above
function setupTutoringTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['onTutoringEdit', 'deleteOldTutoringPhotos'].indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t);
  });
  var ss = TUTORING_SHEET_ID ? SpreadsheetApp.openById(TUTORING_SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.newTrigger('onTutoringEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('deleteOldTutoringPhotos').timeBased().everyDays(1).atHour(3).create();
  tutSheet_();
}

function norm_(v) { return String(v == null ? '' : v).trim().replace(/\s+/g, ' ').toLowerCase(); }
