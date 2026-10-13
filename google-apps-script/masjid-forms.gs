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
 *
 * VOLUNTEERS (includes some under-18 information — keep access tight):
 * 11. Create a SEPARATE Google Sheet named "Volunteers", shared only with the volunteer coordinators.
 *     Put its ID into VOLUNTEER_SHEET_ID, and the coordinator's email into VOLUNTEER_COORDINATOR_EMAIL.
 * 12. Hours letters: create a Google Doc on Islamic Centre letterhead with the Imam's signature image,
 *     using these placeholders anywhere in the text:
 *       {{NAME}} {{SCHOOL}} {{GRADE}} {{HOURS}} {{SHIFTS}} {{FIRST_DATE}} {{LAST_DATE}} {{ADDRESSED_TO}} {{DATE}}
 *     Put its ID into VOLUNTEER_LETTER_TEMPLATE_ID. Create a restricted Drive folder "Volunteer letters"
 *     and put its ID into VOLUNTEER_LETTER_FOLDER_ID.
 * 13. In the Apps Script editor, run setupVolunteers once. It creates the tabs (Events, Volunteers,
 *     Sign-ups, Hours letters) and turns on: reminder emails (checked every hour) and letter sending.
 * 14. Redeploy (Deploy → Manage deployments → Edit → New version).
 *  To add an event: fill in a row in the "Events" tab and set "Show on website" to Yes.
 *     Example: Mawlid gathering | 2026-11-14 | 10:00 | 21:00 | 2 | 3 | Setup:1, Kitchen:1, Parking:1 | Wear comfortable shoes | Yes
 *     Shifts are made automatically (10–12, 12–2, ...). Jobs with "sister" in the name are for sisters only.
 *  After an event: tick "Attended" in the "Sign-ups" tab for everyone who came. Hours are counted from those.
 *  Hours letters: in the "Hours letters" tab, change Status to Approved. The PDF is made and emailed automatically.
 *  Email limits: a free Gmail account sends about 100 emails a day; Google Workspace for Nonprofits about 1,500.
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
    if (p.form === 'volunteer') return volunteer_(p);
    if (p.form === 'hours_letter') return hoursLetter_(p);
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


// ---------- Volunteers ----------
var VOLUNTEER_SHEET_ID = '';            // separate, restricted Google Sheet (leave empty to use this sheet)
var VOLUNTEER_COORDINATOR_EMAIL = '';   // gets an email for each new sign-up and letter request
var VOLUNTEER_LETTER_TEMPLATE_ID = '';  // Google Doc letter template (see setup step 12)
var VOLUNTEER_LETTER_FOLDER_ID = '';    // Drive folder for the PDF letters
var VOLUNTEER_MIN_AGE_GROUPS = ['13-15', '16-17', '18+'];
var VOLUNTEER_AGREEMENT_DAYS = 365;     // agreement and parent approval are renewed yearly
var SITE_NAME = 'Faizan e Madina Vancouver';
var SITE_ADDRESS = '7062 134 St, Surrey, BC';
var SITE_PHONE = '(778) 895-0886';

var VOL_EVENTS_HEAD = ['Event name', 'Date (YYYY-MM-DD)', 'Start (e.g. 10:00)', 'End (e.g. 21:00)', 'Shift length (hours)',
  'Volunteers per shift', 'Jobs (optional, e.g. Setup:1, Kitchen:1, Parking:1)', 'Notes for volunteers', 'Show on website (Yes/No)'];
var VOL_HEAD = ['Joined', 'Volunteer ID', 'Full name', 'Email', 'Phone', 'City', 'Age group', 'Gender', 'Emergency contact',
  'Education', 'Field', 'Experience', 'Certificates', 'Languages', 'Interests', 'Availability', 'Police check', 'Comfort notes',
  'Student', 'School', 'Grade', 'Parent/guardian', 'Parent email', 'Parent phone', 'Parent approved', 'Photo consent',
  'Agreement version', 'Signature', 'Agreement signed', 'Last activity', 'Token', 'Parent token'];
var SIGN_HEAD = ['Received', 'Reference', 'Volunteer ID', 'Name', 'Email', 'Event', 'Date', 'Start', 'End', 'Job', 'Shift ID',
  'Status', 'Attended', 'Reminder sent'];
var LETTER_HEAD = ['Received', 'Reference', 'Volunteer ID', 'Name', 'Email', 'Addressed to', 'School', 'Verified hours',
  'Shifts', 'Status', 'Note', 'Letter (PDF)'];
var V = {}; VOL_HEAD.forEach(function (h, i) { V[h] = i; });
var S = {}; SIGN_HEAD.forEach(function (h, i) { S[h] = i; });

function volBook_() { return VOLUNTEER_SHEET_ID ? SpreadsheetApp.openById(VOLUNTEER_SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet(); }
function volTab_(name, head) {
  var ss = volBook_(), sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(head); sh.setFrozenRows(1); }
  return sh;
}
function rows_(sh, n) { return sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, n).getValues() : []; }
function ymd_(v) { return v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v || '').replace(/^'/, '').trim(); }
function hm_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'HH:mm');
  var m = String(v || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return '';
  var h = +m[1], mi = m[2] || '00', ap = (m[3] || '').toLowerCase();
  if (ap === 'pm' && h < 12) h += 12; if (ap === 'am' && h === 12) h = 0;
  return ('0' + h).slice(-2) + ':' + mi;
}
function mins_(hm) { var p = hm.split(':'); return +p[0] * 60 + +p[1]; }
function fromMins_(n) { return ('0' + Math.floor(n / 60)).slice(-2) + ':' + ('0' + n % 60).slice(-2); }
function t12_(hm) { var p = hm.split(':'), h = +p[0]; return (h % 12 || 12) + (p[1] === '00' ? '' : ':' + p[1]) + (h < 12 ? ' AM' : ' PM'); }
function when_(date) { return Utilities.formatDate(Utilities.parseDate(date + ' 12:00', TZ, 'yyyy-MM-dd HH:mm'), TZ, 'EEEE d MMMM yyyy'); }
function at_(date, hm) { return Utilities.parseDate(date + ' ' + hm, TZ, 'yyyy-MM-dd HH:mm'); }
function eventKey_(name, date) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, norm_(name) + '|' + date);
  return Utilities.base64EncodeWebSafe(raw).replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
}
function webUrl_() { try { return ScriptApp.getService().getUrl(); } catch (e) { return ''; } }
function html_(title, msg) {
  return HtmlService.createHtmlOutput('<meta name="viewport" content="width=device-width,initial-scale=1"><div style="font-family:system-ui,sans-serif;max-width:520px;margin:48px auto;padding:24px;border-radius:14px;background:#f4f8f6;color:#0a3d34"><h2 style="margin-top:0">' +
    title + '</h2><p style="font-size:17px;line-height:1.5">' + msg + '</p><p style="color:#55605b">' + SITE_NAME + ' · ' + SITE_PHONE + '</p></div>').setTitle(title);
}

// All upcoming shifts, with how many places are left in each job
function volShifts_() {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'), events = [], index = {};
  var taken = {};
  rows_(volTab_('Sign-ups', SIGN_HEAD), SIGN_HEAD.length).forEach(function (r) {
    var st = String(r[S['Status']]); if (st !== 'Booked' && st !== 'Awaiting parent') return;
    var k = r[S['Shift ID']] + '|' + r[S['Job']]; taken[k] = (taken[k] || 0) + 1;
  });
  rows_(volTab_('Events', VOL_EVENTS_HEAD), VOL_EVENTS_HEAD.length).forEach(function (r) {
    var name = clean_(r[0]), date = ymd_(r[1]), start = hm_(r[2]), end = hm_(r[3]), len = Number(r[4]) || 2, per = Number(r[5]) || 1;
    if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !start || !end || date < today || !/^y/i.test(String(r[8]))) return;
    var jobs = String(r[6] || '').split(',').map(function (j) { var m = j.split(':'); return { name: clean_(m[0]), total: Number(m[1]) || 1 }; })
      .filter(function (j) { return j.name; });
    if (!jobs.length) jobs = [{ name: '', total: per }];
    var key = eventKey_(name, date), ev = { id: key, name: name, date: date, notes: clean_(r[7]), shifts: [] };
    for (var t = mins_(start); t < mins_(end); t += Math.round(len * 60)) {
      var s0 = fromMins_(t), s1 = fromMins_(Math.min(t + Math.round(len * 60), mins_(end))), id = key + '-' + s0.replace(':', '');
      if (date === today && at_(date, s0) < new Date()) continue;
      var js = jobs.map(function (j) { var used = taken[id + '|' + j.name] || 0; return { name: j.name, total: j.total, left: Math.max(0, j.total - used) }; });
      var sh = { id: id, start: s0, end: s1, total: js.reduce(function (a, j) { return a + j.total; }, 0), left: js.reduce(function (a, j) { return a + j.left; }, 0), jobs: js };
      ev.shifts.push(sh); index[id] = { ev: ev, shift: sh };
    }
    if (ev.shifts.length) events.push(ev);
  });
  events.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  return { events: events, index: index };
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'shifts') { var d = volShifts_(); return json_({ events: d.events }); }
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    if (p.action === 'cancel') return volCancel_(p);
    if (p.action === 'approve') return volApprove_(p);
  } finally { lock.releaseLock(); }
  return html_('Faizan e Madina Vancouver', 'Nothing to see here.');
}

function findVolunteer_(email) {
  var sh = volTab_('Volunteers', VOL_HEAD), rs = rows_(sh, VOL_HEAD.length), em = norm_(email);
  for (var i = 0; i < rs.length; i++) if (norm_(rs[i][V['Email']]) === em) return { sh: sh, row: i + 2, r: rs[i] };
  return null;
}
function isMinor_(r) { return String(r[V['Age group']]).replace(/^'/, '') !== '18+'; }
function fresh_(v) { return v instanceof Date && (new Date() - v) < VOLUNTEER_AGREEMENT_DAYS * 864e5; }

function volunteer_(p) {
  var consents = ['c_agreement', 'c_tasks', 'c_conduct', 'c_privacy'];
  for (var i = 0; i < consents.length; i++) if (p[consents[i]] !== 'yes') return json_({ ok: false, error: 'Please tick all of the agreement boxes.' });
  var now = new Date(), stamp = clean_(p.signature) + ' — signed ' + Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm:ss z');
  var found, vrow, parentEmailNeeded = false;

  if (p.returning === 'yes') {
    found = findVolunteer_(p.returning_email);
    if (!found) return json_({ ok: false, error: 'We couldn\'t find a volunteer with that email. Please choose "No, this is my first time" and fill in the form.' });
    if (norm_(p.signature) !== norm_(found.r[V['Full name']])) return json_({ ok: false, error: 'Your signature must match the name you signed up with (' + found.r[V['Full name']] + ').' });
    vrow = found.r;
    vrow[V['Agreement version']] = clean_(p.terms_version); vrow[V['Signature']] = stamp; vrow[V['Agreement signed']] = now;
    vrow[V['Photo consent']] = p.photo_consent === 'Yes' ? 'Yes' : 'No'; vrow[V['Last activity']] = now;
  } else {
    var need = ['name', 'phone', 'email', 'city', 'age_group', 'emergency_name', 'emergency_phone', 'emergency_relationship', 'education', 'interests', 'signature'];
    for (i = 0; i < need.length; i++) if (!clean_(p[need[i]])) return json_({ ok: false, error: 'Some required information is missing. Please check the form.' });
    if (VOLUNTEER_MIN_AGE_GROUPS.indexOf(p.age_group) === -1) return json_({ ok: false, error: 'Volunteers must be at least 13 years old.' });
    if (!/\S+@\S+\.\S+/.test(p.email)) return json_({ ok: false, error: 'Please check your email address.' });
    if (norm_(p.signature) !== norm_(p.name)) return json_({ ok: false, error: 'Your signature must match your full name.' });
    var minor = p.age_group !== '18+';
    if (minor) {
      if (!clean_(p.parent_name) || !clean_(p.parent_phone) || !/\S+@\S+\.\S+/.test(p.parent_email || '')) return json_({ ok: false, error: 'Please give your parent or guardian\'s name, phone and email.' });
      if (norm_(p.parent_email) === norm_(p.email)) return json_({ ok: false, error: 'Your parent or guardian\'s email must be different from yours.' });
    }
    if (p.is_student === 'yes' && (!clean_(p.school) || !clean_(p.grade))) return json_({ ok: false, error: 'Please give your school and grade.' });
    if (/Kids|Tutoring/.test(p.interests || '') && !clean_(p.police_check)) return json_({ ok: false, error: 'Please answer the police check question.' });
    found = findVolunteer_(p.email);
    vrow = found ? found.r : VOL_HEAD.map(function () { return ''; });
    if (!found) { vrow[V['Joined']] = now; vrow[V['Volunteer ID']] = 'V' + Utilities.formatDate(now, TZ, 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000); vrow[V['Token']] = Utilities.getUuid(); }
    var prevParent = norm_(vrow[V['Parent email']]);
    var set = function (h, v) { vrow[V[h]] = v; };
    set('Full name', clean_(p.name)); set('Email', clean_(p.email).toLowerCase()); set('Phone', "'" + clean_(p.phone)); set('City', clean_(p.city));
    set('Age group', "'" + p.age_group); set('Gender', clean_(p.gender) || 'Prefer not to say');
    set('Emergency contact', clean_(p.emergency_name) + ' (' + clean_(p.emergency_relationship) + ') ' + clean_(p.emergency_phone));
    set('Education', clean_(p.education)); set('Field', clean_(p.field)); set('Experience', clean_(p.experience));
    set('Certificates', [clean_(p.certs), clean_(p.certs_other)].filter(String).join(', ')); set('Languages', clean_(p.languages));
    set('Interests', clean_(p.interests)); set('Availability', clean_(p.availability)); set('Police check', clean_(p.police_check));
    set('Comfort notes', clean_(p.comfort)); set('Student', p.is_student === 'yes' ? 'Yes' : 'No'); set('School', clean_(p.school)); set('Grade', clean_(p.grade));
    set('Parent/guardian', minor ? clean_(p.parent_name) : ''); set('Parent email', minor ? clean_(p.parent_email).toLowerCase() : '');
    set('Parent phone', minor ? "'" + clean_(p.parent_phone) : '');
    if (!minor || prevParent !== norm_(p.parent_email)) set('Parent approved', '');
    set('Photo consent', p.photo_consent === 'Yes' ? 'Yes' : 'No'); set('Agreement version', clean_(p.terms_version));
    set('Signature', stamp); set('Agreement signed', now); set('Last activity', now);
  }
  var minorNow = isMinor_(vrow), approved = !minorNow || fresh_(vrow[V['Parent approved']]);
  if (minorNow && !approved) { if (!vrow[V['Parent token']]) vrow[V['Parent token']] = Utilities.getUuid(); parentEmailNeeded = true; }
  if (!vrow[V['Token']]) vrow[V['Token']] = Utilities.getUuid();
  var vsh = volTab_('Volunteers', VOL_HEAD);
  if (found) vsh.getRange(found.row, 1, 1, VOL_HEAD.length).setValues([vrow]); else vsh.appendRow(vrow);

  // shifts
  var wanted = []; try { wanted = JSON.parse(p.shifts || '[]'); } catch (x) { wanted = []; }
  var d = volShifts_(), signs = volTab_('Sign-ups', SIGN_HEAD), existing = rows_(signs, SIGN_HEAD.length);
  var booked = [], problems = [], status = approved ? 'Booked' : 'Awaiting parent';
  wanted.slice(0, 12).forEach(function (w) {
    var hit = d.index[w.shift]; if (!hit) { problems.push('One shift is no longer available.'); return; }
    var job = (hit.shift.jobs.filter(function (j) { return j.name === String(w.job || ''); })[0]);
    var label = hit.ev.name + ', ' + when_(hit.ev.date) + ', ' + t12_(hit.shift.start) + ' – ' + t12_(hit.shift.end) + (job && job.name ? ' (' + job.name + ')' : '');
    if (!job) { problems.push(label + ': that job is no longer available.'); return; }
    if (/sister/i.test(job.name) && vrow[V['Gender']] !== 'Sister') { problems.push(label + ': this job is for sisters only.'); return; }
    var dup = existing.some(function (r) { return r[S['Volunteer ID']] === vrow[V['Volunteer ID']] && r[S['Shift ID']] === w.shift && /Booked|Awaiting/.test(r[S['Status']]); });
    if (dup) { problems.push(label + ': you are already signed up for this shift.'); return; }
    if (job.left <= 0) { problems.push(label + ': sorry, this shift just filled up.'); return; }
    job.left--;
    var ref = 'S' + Utilities.formatDate(new Date(), TZ, 'yyMMdd') + '-' + Math.floor(10000 + Math.random() * 90000);
    signs.appendRow([new Date(), ref, vrow[V['Volunteer ID']], vrow[V['Full name']], vrow[V['Email']], hit.ev.name, "'" + hit.ev.date,
      "'" + hit.shift.start, "'" + hit.shift.end, job.name, w.shift, status, false, '']);
    booked.push({ ref: ref, label: label, date: hit.ev.date, start: hit.shift.start, end: hit.shift.end, event: hit.ev.name, job: job.name });
  });

  var first = String(vrow[V['Full name']]).split(' ')[0];
  var base = webUrl_(), tok = vrow[V['Token']];
  var lines = booked.map(function (b) { return '• ' + b.label + '\n  Can\'t make it? Cancel here: ' + base + '?action=cancel&ref=' + b.ref + '&t=' + tok; }).join('\n\n');
  var body = 'Assalamu alaikum ' + first + ',\n\nJazakAllah khair for volunteering with ' + SITE_NAME + '.\n\n';
  if (booked.length) body += (approved ? 'You signed up to volunteer at ' + SITE_NAME + ':\n\n' : 'These shifts are ON HOLD until your parent or guardian approves (we have emailed them):\n\n') + lines + '\n\n';
  else body += 'You\'re on our volunteer list. We\'ll email you when we need help at upcoming events.\n\n';
  if (problems.length) body += 'Please note:\n' + problems.map(function (x) { return '• ' + x; }).join('\n') + '\n\n';
  body += 'Where: ' + SITE_ADDRESS + '\nWe will send you a reminder the day before.\n\nQuestions? Reply to this email or call ' + SITE_PHONE + '.\n\n' + SITE_NAME;
  var opts = {}; if (booked.length && approved) opts.attachments = [ics_(booked)];
  try { MailApp.sendEmail(vrow[V['Email']], booked.length ? 'Your volunteer shifts — ' + SITE_NAME : 'Welcome to the volunteer team — ' + SITE_NAME, body, opts); } catch (x) {}
  if (parentEmailNeeded) {
    try {
      MailApp.sendEmail(vrow[V['Parent email']], 'Please approve ' + vrow[V['Full name']] + '\'s volunteering — ' + SITE_NAME,
        'Assalamu alaikum ' + vrow[V['Parent/guardian']] + ',\n\n' + vrow[V['Full name']] + ' has signed up to volunteer at ' + SITE_NAME + ' and named you as their parent or guardian.\n\n' +
        (booked.length ? 'Shifts requested:\n' + booked.map(function (b) { return '• ' + b.label; }).join('\n') + '\n\n' : '') +
        'Please read the volunteer agreement: https://dawateislamivancouver.ca/volunteer-terms.html\n\n' +
        'To give your permission and agree to it, open this link:\n' + base + '?action=approve&id=' + vrow[V['Volunteer ID']] + '&t=' + vrow[V['Parent token']] + '\n\n' +
        'If you did not expect this email, you can ignore it and nothing will be booked.\n\n' + SITE_NAME + ' · ' + SITE_PHONE);
    } catch (x) {}
  }
  if (VOLUNTEER_COORDINATOR_EMAIL) MailApp.sendEmail(VOLUNTEER_COORDINATOR_EMAIL, 'Volunteer sign-up: ' + vrow[V['Full name']] + (booked.length ? ' (' + booked.length + ' shifts)' : ''),
    (booked.map(function (b) { return '• ' + b.label; }).join('\n') || 'Joined the volunteer list.') + '\n\nInterests: ' + vrow[V['Interests']] + '\nSkills: ' + vrow[V['Certificates']]);

  var msg = booked.length ? (approved ? 'You\'re booked for ' + booked.length + (booked.length === 1 ? ' shift' : ' shifts') + '. Check your email for the details and a calendar invite.'
    : 'Your ' + (booked.length === 1 ? 'shift is' : 'shifts are') + ' on hold. We\'ve emailed your parent or guardian to approve.')
    : (parentEmailNeeded ? 'You\'re on our volunteer list. We\'ve emailed your parent or guardian to approve.' : 'You\'re on our volunteer list. We\'ll email you when we need help.');
  if (problems.length) msg = booked.length ? msg + ' Note: ' + problems.join(' ') : 'We couldn\'t book your shift: ' + problems.join(' ') + ' Please choose another shift. You\'re still on our volunteer list.';
  return json_({ ok: true, message: msg, booked: booked.length });
}

function ics_(list) {
  var z = function (d, hm) { return Utilities.formatDate(at_(d, hm), 'UTC', "yyyyMMdd'T'HHmmss'Z'"); };
  var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Faizan e Madina Vancouver//Volunteers//EN', 'METHOD:PUBLISH'];
  list.forEach(function (b) {
    lines.push('BEGIN:VEVENT', 'UID:' + b.ref + '@dawateislamivancouver.ca', 'DTSTAMP:' + Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'"),
      'DTSTART:' + z(b.date, b.start), 'DTEND:' + z(b.date, b.end), 'SUMMARY:Volunteer: ' + b.event + (b.job ? ' (' + b.job + ')' : ''),
      'LOCATION:' + SITE_NAME + '\\, ' + SITE_ADDRESS.replace(/,/g, '\\,'), 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Volunteer shift', 'END:VALARM', 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return Utilities.newBlob(lines.join('\r\n'), 'text/calendar', 'volunteer-shifts.ics');
}

function volCancel_(p) {
  var signs = volTab_('Sign-ups', SIGN_HEAD), rs = rows_(signs, SIGN_HEAD.length);
  for (var i = 0; i < rs.length; i++) {
    if (rs[i][S['Reference']] !== p.ref) continue;
    var v = findVolunteer_(rs[i][S['Email']]);
    if (!v || v.r[V['Token']] !== p.t) break;
    if (rs[i][S['Status']] === 'Cancelled') return html_('Already cancelled', 'This shift was already cancelled. JazakAllah khair for letting us know.');
    signs.getRange(i + 2, S['Status'] + 1).setValue('Cancelled');
    if (VOLUNTEER_COORDINATOR_EMAIL) MailApp.sendEmail(VOLUNTEER_COORDINATOR_EMAIL, 'Volunteer cancelled: ' + rs[i][S['Name']],
      rs[i][S['Event']] + ', ' + ymd_(rs[i][S['Date']]) + ' ' + String(rs[i][S['Start']]).replace(/^'/, '') + (rs[i][S['Job']] ? ' (' + rs[i][S['Job']] + ')' : ''));
    return html_('Shift cancelled', 'Your shift has been cancelled and the spot is open for someone else. JazakAllah khair for letting us know.');
  }
  return html_('Link not recognized', 'We couldn\'t find that shift. Please call us if you need help.');
}

function volApprove_(p) {
  var sh = volTab_('Volunteers', VOL_HEAD), rs = rows_(sh, VOL_HEAD.length);
  for (var i = 0; i < rs.length; i++) {
    if (rs[i][V['Volunteer ID']] !== p.id || !p.t || rs[i][V['Parent token']] !== p.t) continue;
    sh.getRange(i + 2, V['Parent approved'] + 1).setValue(new Date());
    var signs = volTab_('Sign-ups', SIGN_HEAD), ss = rows_(signs, SIGN_HEAD.length), now = [];
    ss.forEach(function (r, j) {
      if (r[S['Volunteer ID']] === p.id && r[S['Status']] === 'Awaiting parent') {
        signs.getRange(j + 2, S['Status'] + 1).setValue('Booked');
        now.push({ ref: r[S['Reference']], date: ymd_(r[S['Date']]), start: String(r[S['Start']]).replace(/^'/, ''), end: String(r[S['End']]).replace(/^'/, ''), event: r[S['Event']], job: r[S['Job']] });
      }
    });
    var name = rs[i][V['Full name']], base = webUrl_();
    try {
      MailApp.sendEmail(rs[i][V['Email']], 'You\'re approved to volunteer — ' + SITE_NAME,
        'Assalamu alaikum ' + String(name).split(' ')[0] + ',\n\nYour parent or guardian has approved your volunteering.' +
        (now.length ? ' Your shifts are now booked:\n\n' + now.map(function (b) { return '• ' + b.event + ', ' + when_(b.date) + ', ' + t12_(b.start) + ' – ' + t12_(b.end) +
          (b.job ? ' (' + b.job + ')' : '') + '\n  Can\'t make it? Cancel here: ' + base + '?action=cancel&ref=' + b.ref + '&t=' + rs[i][V['Token']]; }).join('\n\n') : '') +
        '\n\nWe will send you a reminder the day before.\n\n' + SITE_NAME + ' · ' + SITE_PHONE, now.length ? { attachments: [ics_(now)] } : {});
    } catch (x) {}
    return html_('Thank you', 'You have approved ' + name + ' to volunteer with ' + SITE_NAME + ' and agreed to the volunteer agreement.' + (now.length ? ' Their shifts are now booked.' : ''));
  }
  return html_('Link not recognized', 'This approval link is not valid. Please call us if you need help.');
}

// Runs every hour (see setupVolunteers): reminder about 1 day before each shift
function sendVolunteerReminders() {
  var signs = volTab_('Sign-ups', SIGN_HEAD), rs = rows_(signs, SIGN_HEAD.length), now = new Date();
  rs.forEach(function (r, i) {
    if (r[S['Status']] !== 'Booked' || r[S['Reminder sent']]) return;
    var start = at_(ymd_(r[S['Date']]), String(r[S['Start']]).replace(/^'/, '')), hrs = (start - now) / 36e5;
    if (hrs <= 0 || hrs > 30) return;
    var v = findVolunteer_(r[S['Email']]), tok = v ? v.r[V['Token']] : '';
    try {
      MailApp.sendEmail(r[S['Email']], 'Reminder: you\'re volunteering ' + (hrs < 12 ? 'today' : 'tomorrow') + ' — ' + SITE_NAME,
        'Assalamu alaikum ' + String(r[S['Name']]).split(' ')[0] + ',\n\nA reminder that you signed up to volunteer at ' + SITE_NAME + ':\n\n' +
        r[S['Event']] + '\n' + when_(ymd_(r[S['Date']])) + ', ' + t12_(String(r[S['Start']]).replace(/^'/, '')) + ' – ' + t12_(String(r[S['End']]).replace(/^'/, '')) +
        (r[S['Job']] ? '\nJob: ' + r[S['Job']] : '') + '\nWhere: ' + SITE_ADDRESS + '\n\nPlease arrive 10 minutes early and check in with the coordinator.\n\n' +
        'Can\'t make it? Please cancel so someone else can help: ' + webUrl_() + '?action=cancel&ref=' + r[S['Reference']] + '&t=' + tok + '\n\nJazakAllah khair!\n' + SITE_NAME);
      signs.getRange(i + 2, S['Reminder sent'] + 1).setValue(new Date());
    } catch (x) {}
  });
}

// ---------- Volunteer hours letters ----------
function attended_(volId) {
  var list = [], total = 0;
  rows_(volTab_('Sign-ups', SIGN_HEAD), SIGN_HEAD.length).forEach(function (r) {
    if (r[S['Volunteer ID']] !== volId || r[S['Attended']] !== true) return;
    var d = ymd_(r[S['Date']]), a = String(r[S['Start']]).replace(/^'/, ''), b = String(r[S['End']]).replace(/^'/, '');
    var h = (mins_(b) - mins_(a)) / 60; total += h;
    list.push({ date: d, text: when_(d) + ': ' + r[S['Event']] + (r[S['Job']] ? ' (' + r[S['Job']] + ')' : '') + ', ' + h + (h === 1 ? ' hour' : ' hours') });
  });
  list.sort(function (x, y) { return x.date < y.date ? -1 : 1; });
  return { total: total, list: list };
}

function hoursLetter_(p) {
  var v = findVolunteer_(p.email);
  if (!v || norm_(p.name) !== norm_(v.r[V['Full name']])) return json_({ ok: false, error: 'We couldn\'t find a volunteer with that name and email. Please use the same details you signed up with.' });
  var a = attended_(v.r[V['Volunteer ID']]);
  if (!a.total) return json_({ ok: false, error: 'We don\'t have any recorded hours for you yet. Hours are added after each event once the coordinator confirms attendance.' });
  var ref = 'L' + Utilities.formatDate(new Date(), TZ, 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
  volTab_('Hours letters', LETTER_HEAD).appendRow([new Date(), ref, v.r[V['Volunteer ID']], v.r[V['Full name']], v.r[V['Email']], clean_(p.addressed_to),
    v.r[V['School']], a.total, a.list.map(function (x) { return x.text; }).join('\n'), 'Pending', '', '']);
  if (VOLUNTEER_COORDINATOR_EMAIL) MailApp.sendEmail(VOLUNTEER_COORDINATOR_EMAIL, 'Hours letter request: ' + v.r[V['Full name']] + ' (' + a.total + ' hours)',
    'Open the "Hours letters" tab and change Status to Approved to send the signed letter.');
  return json_({ ok: true, message: 'Request received for ' + a.total + ' verified hours. We\'ll email your signed letter once the Imam approves it.' });
}

// Installable "on edit" trigger: Status → Approved makes and emails the PDF letter
function onVolunteerEdit(e) {
  var sh = e.range.getSheet();
  if (sh.getName() !== 'Hours letters' || e.range.getColumn() !== 10 || e.range.getRow() < 2) return;
  var row = e.range.getRow(), r = sh.getRange(row, 1, 1, LETTER_HEAD.length).getValues()[0];
  if (String(r[9]) !== 'Approved' || r[11]) return;
  if (!VOLUNTEER_LETTER_TEMPLATE_ID) { sh.getRange(row, 11).setValue('Set VOLUNTEER_LETTER_TEMPLATE_ID in the script first.'); return; }
  var v = findVolunteer_(r[4]), a = attended_(r[2]);
  var folder = VOLUNTEER_LETTER_FOLDER_ID ? DriveApp.getFolderById(VOLUNTEER_LETTER_FOLDER_ID) : DriveApp.getRootFolder();
  var copy = DriveApp.getFileById(VOLUNTEER_LETTER_TEMPLATE_ID).makeCopy('Volunteer letter ' + r[1] + ' ' + r[3], folder);
  var doc = DocumentApp.openById(copy.getId()), body = doc.getBody();
  var map = { NAME: r[3], SCHOOL: r[6] || '', GRADE: v ? v.r[V['Grade']] : '', HOURS: String(a.total), SHIFTS: a.list.map(function (x) { return x.text; }).join('\n'),
    FIRST_DATE: a.list.length ? when_(a.list[0].date) : '', LAST_DATE: a.list.length ? when_(a.list[a.list.length - 1].date) : '',
    ADDRESSED_TO: r[5] || 'To whom it may concern', DATE: Utilities.formatDate(new Date(), TZ, 'd MMMM yyyy') };
  Object.keys(map).forEach(function (k) { body.replaceText('\\{\\{' + k + '\\}\\}', String(map[k])); });
  doc.saveAndClose();
  var pdf = folder.createFile(copy.getAs('application/pdf').setName('Volunteer hours letter - ' + r[3] + '.pdf'));
  copy.setTrashed(true);
  var cc = v && isMinor_(v.r) && v.r[V['Parent email']] ? { cc: v.r[V['Parent email']], attachments: [pdf.getBlob()] } : { attachments: [pdf.getBlob()] };
  MailApp.sendEmail(r[4], 'Your volunteer hours letter — ' + SITE_NAME,
    'Assalamu alaikum ' + String(r[3]).split(' ')[0] + ',\n\nPlease find attached your signed letter confirming ' + a.total + ' hours of volunteering with ' + SITE_NAME + '.\n\nJazakAllah khair for your service!\n' + SITE_NAME + ' · ' + SITE_PHONE, cc);
  sh.getRange(row, 12).setValue(pdf.getUrl());
  sh.getRange(row, 10).setValue('Sent');
}

// Run once from the Apps Script editor
function setupVolunteers() {
  var ev = volTab_('Events', VOL_EVENTS_HEAD); volTab_('Volunteers', VOL_HEAD);
  var signs = volTab_('Sign-ups', SIGN_HEAD), letters = volTab_('Hours letters', LETTER_HEAD);
  signs.getRange(2, S['Attended'] + 1, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
  signs.getRange(2, S['Status'] + 1, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Booked', 'Awaiting parent', 'Cancelled', 'No-show']).build());
  letters.getRange(2, 10, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Pending', 'Approved', 'Declined', 'Sent']).build());
  ev.getRange(2, 9, 200, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No']).build());
  ScriptApp.getProjectTriggers().forEach(function (t) { if (['sendVolunteerReminders', 'onVolunteerEdit'].indexOf(t.getHandlerFunction()) > -1) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendVolunteerReminders').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('onVolunteerEdit').forSpreadsheet(volBook_()).onEdit().create();
}
