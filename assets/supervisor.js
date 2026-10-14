/*
 * Volunteer supervisor area — DEMO FRONT END
 *
 * Everything here is made-up demo data that lives only in this browser tab.
 * The demo logins below are NOT security: anyone can read them in this file.
 * In the real system, sign-in is done by Google (with 2-step verification) and
 * the Google Apps Script backend checks the user's role on EVERY request and only
 * returns the data that role is allowed to see. See google-apps-script/supervisor-backend.md.
 *
 * Security habits used even in the demo (OWASP Top 10):
 *  - A03 Injection / XSS: all data is written with textContent, never innerHTML.
 *  - A01 Access control: every view and action checks the role and the brothers/sisters scope.
 *  - A07 Auth: 5 failed logins lock the form for 60 s; idle sessions end after 15 minutes.
 *  - A02 Data exposure: nothing is saved in localStorage/cookies; a refresh logs you out.
 *  - A09 Logging: every action is written to an audit log (visible to admins).
 */
(function () {
  'use strict';
  var root = document.getElementById('sv');
  if (!root) return;

  // ---------- Demo accounts (demo only — never do this with real data) ----------
  var USERS = [
    { email: 'admin', pass: 'admin', name: 'Super admin (demo)', role: 'admin', scope: 'all', active: true },
    { email: 'brothers', pass: 'brothers', name: 'Br. Supervisor (demo)', role: 'supervisor', scope: 'Brother', active: true },
    { email: 'sisters', pass: 'sisters', name: 'Sr. Supervisor (demo)', role: 'supervisor', scope: 'Sister', active: true }
  ];

  // ---------- Demo data (fictional people) ----------
  var JOBS = {
    Brother: ['Moving chairs & equipment', 'Parking & traffic', 'Security', 'Greeting outside', 'Greeting inside', 'Kitchen & food', 'Transport', 'Photography', 'Videography'],
    Sister: ["Sisters' side setup", "Sisters' side cleaning", 'Serving food (sisters)', 'Collecting donations (sisters)', 'Book stand (sisters)', 'Greeting sisters']
  };
  var VOLS = [
    { id: 'V101', truck: 'Pickup truck (insured)', licence: 'Class 5', name: 'Yusuf Rahman', gender: 'Brother', age: '18+', status: 'Approved', jobs: ['Moving chairs & equipment', 'Parking & traffic'], lifting: 'Yes', interests: 'Moving chairs, Parking, Security, Greeting outside, Transport', phone: '604 555 0101', certs: 'First Aid (exp. 2027-05)', police: 'Criminal Record Check (2025-02)', ec: 'Amina Rahman (wife) 604 555 0901 · Bilal Rahman (brother) 604 555 0902', car: 'Yes, insured', notes: [] },
    { id: 'V102', truck: 'None', licence: 'Class 1', name: 'Hamza Qureshi', gender: 'Brother', age: '18+', status: 'Approved', jobs: ['Security', 'Greeting outside'], lifting: 'Yes', interests: 'Security, Greeting outside, Greeting inside, Parking, Moving chairs', phone: '604 555 0102', certs: 'BC Security licence (exp. 2026-12)', police: 'Criminal Record Check (2026-01)', ec: 'Sana Qureshi (mother) 604 555 0903 · Ali Qureshi (father) 604 555 0904', car: 'No', notes: [] },
    { id: 'V103', truck: 'None', licence: 'Class 7', name: 'Ibrahim Malik', gender: 'Brother', age: '16-17', status: 'Approved', jobs: ['Greeting inside', 'Moving chairs & equipment'], lifting: 'Yes', interests: 'Greeting inside, Moving chairs, Kitchen, Cleaning, Photography', phone: '604 555 0103', certs: '—', police: 'None', ec: 'Farah Malik (mother) 604 555 0905 · Omar Malik (father) 604 555 0906', car: '—', parentForm: false, notes: [] },
    { id: 'V104', truck: 'None', licence: 'Class 5', name: 'Zain Siddiqui', gender: 'Brother', age: '18+', status: 'Approved', jobs: ['Photography', 'Videography'], lifting: 'Light items only', interests: 'Photography, Videography, Video editing, Tech & livestream, Greeting inside', phone: '604 555 0104', certs: '—', police: 'None', ec: 'Hina Siddiqui (sister) 604 555 0907 · Tariq Siddiqui (father) 604 555 0908', car: 'Yes, insured', notes: [] },
    { id: 'V105', truck: 'Cargo van (insured)', licence: 'Class 4', name: 'Bilal Ahmed', gender: 'Brother', age: '18+', status: 'Approved', jobs: ['Kitchen & food', 'Moving chairs & equipment'], lifting: 'Yes', interests: 'Kitchen, Serving food, Moving chairs, Cleaning, Setup', phone: '604 555 0105', certs: 'FOODSAFE (exp. 2025-08) ⚠ expired', police: 'None', ec: 'Maryam Ahmed (wife) 604 555 0909 · Usman Ahmed (brother) 604 555 0910', car: 'No', notes: [] },
    { id: 'V106', name: 'Fatima Noor', gender: 'Sister', age: '18+', status: 'Approved', jobs: ['Serving food (sisters)', "Sisters' side setup"], lifting: 'Light items only', interests: "Serving food, Sisters' side setup, Collecting donations, Book stand, Greeting", phone: '604 555 0106', certs: 'FOODSAFE (exp. 2027-03)', police: 'None', ec: 'Khalid Noor (husband) 604 555 0911 · Ayesha Noor (mother) 604 555 0912', car: '—', notes: [] },
    { id: 'V107', name: 'Khadija Hussain', gender: 'Sister', age: '18+', status: 'Approved', jobs: ['Collecting donations (sisters)', 'Book stand (sisters)'], lifting: 'Yes', interests: "Collecting donations, Book stand, FOA stand, Greeting, Sisters' side cleaning", phone: '604 555 0107', certs: 'First Aid (exp. 2026-11)', police: 'Vulnerable Sector Check (2025-09)', ec: 'Imran Hussain (husband) 604 555 0913 · Zara Hussain (sister) 604 555 0914', car: '—', notes: [] },
    { id: 'V108', name: 'Maryam Javed', gender: 'Sister', age: '16-17', status: 'Approved', jobs: ['Greeting sisters'], lifting: 'Light items only', interests: "Greeting sisters, Decoration, Kids' activities, Serving food, Admin", phone: '604 555 0108', certs: '—', police: 'None', ec: 'Nadia Javed (mother) 604 555 0915 · Javed Iqbal (father) 604 555 0916', car: '—', parentForm: true, notes: [] },
    { id: 'V109', truck: 'Cube van or moving truck (insured)', licence: 'Class 3', name: 'Abdullah Khan', gender: 'Brother', age: '18+', status: 'Pending review', jobs: [], lifting: 'Yes', interests: 'Moving chairs, Parking, Electrical work, Setup, Security', phone: '604 555 0109', certs: 'Red Seal electrician', police: 'None', ec: 'Sadia Khan (wife) 604 555 0917 · Asad Khan (brother) 604 555 0918', car: 'Yes, insured', notes: [] },
    { id: 'V110', truck: 'None', licence: 'No licence', name: 'Usman Tariq', gender: 'Brother', age: '16-17', status: 'Pending review', jobs: [], lifting: 'No', interests: 'Greeting inside, Admin, Tech & livestream, Video editing, Photography', phone: '604 555 0110', certs: '—', police: 'None', ec: 'Rabia Tariq (mother) 604 555 0919 · Tariq Mehmood (father) 604 555 0920', car: '—', parentForm: false, notes: [] },
    { id: 'V111', name: 'Aisha Karim', gender: 'Sister', age: '18+', status: 'Pending review', jobs: [], lifting: 'Yes', interests: "Sisters' side setup, Sisters' side cleaning, Serving food, Kitchen, Decoration", phone: '604 555 0111', certs: 'FOODSAFE (exp. 2027-09)', police: 'None', ec: 'Karim Ali (father) 604 555 0921 · Huda Karim (sister) 604 555 0922', car: '—', notes: [] },
    { id: 'V112', name: 'Sumayya Patel', gender: 'Sister', age: '18+', status: 'Pending review', jobs: [], lifting: 'Light items only', interests: "Greeting sisters, Book stand, FOA stand, Collecting donations, Kids' activities", phone: '604 555 0112', certs: 'Teaching certificate', police: 'Vulnerable Sector Check (2026-03)', ec: 'Yasin Patel (husband) 604 555 0923 · Rehana Patel (mother) 604 555 0924', car: '—', notes: [] }
  ];
  var today = new Date(); var iso = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
  var EVENTS = [{
    id: 'E1', name: 'Mawlid gathering (demo)', date: iso, location: 'Example Banquet Hall, Surrey, BC',
    shifts: [
      { id: 'S1', start: '10:00', end: '13:00', jobs: [['Moving chairs & equipment', 3], ['Parking & traffic', 1], ["Sisters' side setup", 2]] },
      { id: 'S2', start: '13:00', end: '17:00', jobs: [['Security', 1], ['Greeting outside', 1], ['Greeting inside', 1], ['Serving food (sisters)', 1], ['Collecting donations (sisters)', 1]] },
      { id: 'S3', start: '17:00', end: '21:00', jobs: [['Moving chairs & equipment', 2], ['Kitchen & food', 1], ['Photography', 1], ['Greeting sisters', 1], ['Book stand (sisters)', 1]] }
    ]
  }, {
    id: 'E2', name: 'Weekly Ijtima (demo)', date: iso, location: 'Faizan e Madina Vancouver, 7062 134 St, Surrey',
    shifts: [{ id: 'S4', start: '18:30', end: '21:30', jobs: [['Parking & traffic', 2], ['Greeting inside', 1], ['Greeting sisters', 1]] }]
  }];
  var ASSIGN = [
    { ev: 'E1', shift: 'S1', job: 'Moving chairs & equipment', vol: 'V101', state: 'Booked' },
    { ev: 'E1', shift: 'S1', job: 'Moving chairs & equipment', vol: 'V105', state: 'Booked' },
    { ev: 'E1', shift: 'S1', job: "Sisters' side setup", vol: 'V106', state: 'Booked' },
    { ev: 'E1', shift: 'S2', job: 'Security', vol: 'V102', state: 'Booked' },
    { ev: 'E1', shift: 'S2', job: 'Greeting inside', vol: 'V103', state: 'Booked' },
    { ev: 'E1', shift: 'S2', job: 'Collecting donations (sisters)', vol: 'V107', state: 'Booked' },
    { ev: 'E1', shift: 'S3', job: 'Photography', vol: 'V104', state: 'Booked' },
    { ev: 'E1', shift: 'S3', job: 'Greeting sisters', vol: 'V108', state: 'Booked' },
    { ev: 'E2', shift: 'S4', job: 'Parking & traffic', vol: 'V101', state: 'Booked' }
  ];
  var AUDIT = [];

  // ---------- Session ----------
  var me = null, view = 'board', curEvent = 'E1', fails = 0, lockedUntil = 0, idleTimer = null;
  var IDLE_MS = 15 * 60 * 1000;
  function touch() { if (!me) return; clearTimeout(idleTimer); idleTimer = setTimeout(function () { logout('You were signed out after 15 minutes of no activity.'); }, IDLE_MS); }
  ['click', 'keydown', 'touchstart'].forEach(function (t) { document.addEventListener(t, touch, { passive: true }); });

  // ---------- Safe DOM helper: text only, never HTML ----------
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k]; if (v == null || v === false) return;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c == null) return; el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function now() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function t12(hm) { var p = hm.split(':'), x = +p[0]; return (x % 12 || 12) + (p[1] === '00' ? '' : ':' + p[1]) + (x < 12 ? ' AM' : ' PM'); }
  function vol(id) { return VOLS.filter(function (v) { return v.id === id; })[0]; }
  function isSisJob(j) { return /sister/i.test(j); }
  function canSee(gender) { return me.scope === 'all' || me.scope === gender; }
  function log(action) { AUDIT.unshift({ at: new Date().toLocaleString('en-CA'), who: me.name, action: action }); }
  function toast(msg) { var t = document.getElementById('svToast'); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(function () { t.hidden = true; }, 2600); }

  // ---------- Login ----------
  function renderLogin(msg) {
    clear(root);
    var err = h('p', { class: 'ferr', role: 'alert', text: msg || '' });
    var email = h('input', { id: 'svEmail', type: 'text', autocomplete: 'username', required: true, autocapitalize: 'none' });
    var pass = h('input', { id: 'svPass', type: 'password', autocomplete: 'current-password', required: true });
    var form = h('form', { class: 'sv-login rform', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      if (Date.now() < lockedUntil) { err.textContent = 'Too many attempts. Please wait ' + Math.ceil((lockedUntil - Date.now()) / 1000) + ' seconds.'; return; }
      var u = USERS.filter(function (x) { return x.email === email.value.trim().toLowerCase() && x.pass === pass.value && x.active; })[0];
      if (!u) {
        fails++; pass.value = '';
        if (fails >= 5) { lockedUntil = Date.now() + 60000; fails = 0; err.textContent = 'Too many attempts. The form is locked for 60 seconds.'; }
        else err.textContent = 'Email or password is not correct.'; // same message either way: don't reveal which one was wrong
        return;
      }
      fails = 0; me = u; log('Signed in'); touch(); view = 'board'; render();
    } }, [
      h('div', { class: 'sv-brand' }, [h('img', { src: 'assets/img/logo-vancouver.png', alt: 'Dawat-e-Islami Vancouver', width: '220' })]),
      h('h1', { text: 'Volunteer supervisors' }),
      h('p', { class: 'sv-demo', text: 'DEMO with made-up volunteers. Try admin / admin (super user), brothers / brothers or sisters / sisters (supervisors).' }),
      h('div', { class: 'field' }, [h('label', { for: 'svEmail', text: 'Email' }), email]),
      h('div', { class: 'field' }, [h('label', { for: 'svPass', text: 'Password' }), pass]),
      err,
      h('button', { class: 'btn btn-green', type: 'submit', text: 'Sign in' }),
      h('p', { class: 'fhint', text: 'In the real system this button is "Sign in with Google", and only supervisor accounts approved by an admin get in.' })
    ]);
    root.appendChild(h('div', { class: 'sv-login-wrap' }, [form]));
    email.focus();
  }
  function logout(msg) { if (me) log('Signed out'); me = null; clearTimeout(idleTimer); renderLogin(msg); }

  // ---------- Shell ----------
  function render() {
    if (!me) return renderLogin();
    clear(root);
    var tabs = [['board', 'Board'], ['apps', 'Approve'], ['checkin', 'Check-in'], ['people', 'People']];
    if (me.role === 'admin') tabs.push(['admin', 'Admin']);
    if (!tabs.some(function (t) { return t[0] === view; })) view = 'board';
    var pending = VOLS.filter(function (v) { return v.status === 'Pending review' && canSee(v.gender); }).length;
    root.appendChild(h('header', { class: 'sv-top' }, [
      h('div', { class: 'sv-who' }, [h('b', { text: me.name }), h('span', { class: 'sv-role sv-' + (me.scope === 'Sister' ? 'sis' : me.role), text: me.role === 'admin' ? 'Admin · all volunteers' : (me.scope === 'Sister' ? "Sisters' team" : "Brothers' team") })]),
      h('button', { class: 'sv-out', type: 'button', text: 'Sign out', onclick: function () { logout('You have signed out.'); } })
    ]));
    root.appendChild(h('p', { class: 'sv-demo-bar', text: 'Demo only · made-up data · changes are lost when you refresh' }));
    root.appendChild(h('nav', { class: 'sv-tabs', 'aria-label': 'Sections' }, tabs.map(function (t) {
      return h('button', { type: 'button', class: view === t[0] ? 'on' : '', 'aria-current': view === t[0] ? 'page' : null, onclick: function () { view = t[0]; render(); } },
        [t[1], t[0] === 'apps' && pending ? h('span', { class: 'sv-badge', text: String(pending) }) : null]);
    })));
    var main = h('main', { class: 'sv-main' }); root.appendChild(main);
    ({ board: board, apps: approvals, checkin: checkin, people: people, admin: admin })[view](main);
  }
  function eventPicker(main) {
    var sel = h('select', { class: 'sv-ev', 'aria-label': 'Event', onchange: function () { curEvent = sel.value; render(); } },
      EVENTS.map(function (e) { return h('option', { value: e.id, selected: e.id === curEvent, text: e.name + ' · ' + e.date }); }));
    var ev = EVENTS.filter(function (e) { return e.id === curEvent; })[0];
    main.appendChild(h('div', { class: 'sv-evhead' }, [sel, h('p', { class: 'sv-loc', text: '📍 ' + ev.location })]));
    return ev;
  }

  // ---------- Board: who's where ----------
  function board(main) {
    var ev = eventPicker(main);
    ev.shifts.forEach(function (s) {
      var cards = s.jobs.map(function (j) {
        var name = j[0], total = j[1], sis = isSisJob(name), mine = canSee(sis ? 'Sister' : 'Brother');
        var here = ASSIGN.filter(function (a) { return a.ev === ev.id && a.shift === s.id && a.job === name && a.state !== 'Removed'; });
        var slots = [];
        for (var i = 0; i < total; i++) {
          var a = here[i];
          if (a && mine) slots.push(h('button', { type: 'button', class: 'sv-chip st-' + a.state.replace(/\s/g, ''), title: 'Remove from this job', onclick: (function (a) { return function () {
            if (!confirm('Remove ' + vol(a.vol).name + ' from ' + a.job + '?')) return; a.state = 'Removed'; log('Removed ' + vol(a.vol).name + ' from ' + a.job + ' (' + ev.name + ' ' + s.start + ')'); render(); }; })(a) },
            [vol(a.vol).name, h('small', { text: a.state === 'Booked' ? '' : ' · ' + a.state })]));
          else if (a) slots.push(h('span', { class: 'sv-chip sv-hidden', text: 'Filled' }));
          else if (mine) slots.push(h('button', { type: 'button', class: 'sv-chip sv-open', text: '+ Assign', onclick: function () { assignDialog(ev, s, name); } }));
          else slots.push(h('span', { class: 'sv-chip sv-open sv-hidden', text: 'Open' }));
        }
        return h('div', { class: 'sv-job' + (sis ? ' sis' : '') }, [h('div', { class: 'sv-jobh' }, [h('b', { text: name }), h('span', { text: here.length + '/' + total })]), h('div', { class: 'sv-slots' }, slots)]);
      });
      var filled = ASSIGN.filter(function (a) { return a.ev === ev.id && a.shift === s.id && a.state !== 'Removed'; }).length, need = s.jobs.reduce(function (t, j) { return t + j[1]; }, 0);
      main.appendChild(h('section', { class: 'sv-shift' }, [
        h('div', { class: 'sv-shifth' }, [h('h2', { text: t12(s.start) + ' – ' + t12(s.end) }), h('span', { class: 'sv-fill' + (filled >= need ? ' ok' : ''), text: filled + ' of ' + need + ' filled' })]),
        h('div', { class: 'sv-jobs' }, cards)
      ]));
    });
    if (me.scope !== 'all') main.appendChild(h('p', { class: 'fhint', text: (me.scope === 'Sister' ? "Brothers'" : "Sisters'") + ' jobs show as Filled/Open only. Names are visible to their own supervisors and admins.' }));
  }
  function assignDialog(ev, s, job) {
    var g = isSisJob(job) ? 'Sister' : 'Brother';
    var busy = ASSIGN.filter(function (a) { return a.ev === ev.id && a.shift === s.id && a.state !== 'Removed'; }).map(function (a) { return a.vol; });
    var list = VOLS.filter(function (v) { return v.status === 'Approved' && v.gender === g && busy.indexOf(v.id) < 0; })
      .sort(function (a, b) { return (b.jobs.indexOf(job) > -1) - (a.jobs.indexOf(job) > -1); });
    var dlg = h('dialog', { class: 'sv-dlg' }, [
      h('h3', { text: 'Assign: ' + job }), h('p', { class: 'fhint', text: ev.name + ' · ' + t12(s.start) + ' – ' + t12(s.end) + ' · approved ' + (g === 'Sister' ? 'sisters' : 'brothers') + ' who are free' }),
      list.length ? h('div', { class: 'sv-pick' }, list.map(function (v) {
        var fit = v.jobs.indexOf(job) > -1, light = v.lifting !== 'Yes' && /Moving/.test(job);
        return h('button', { type: 'button', class: 'sv-pickrow', onclick: function () {
          ASSIGN.push({ ev: ev.id, shift: s.id, job: job, vol: v.id, state: 'Booked' }); log('Assigned ' + v.name + ' to ' + job + ' (' + ev.name + ' ' + s.start + ')');
          dlg.close(); dlg.remove(); toast(v.name + ' assigned. They will get an email.'); render(); } }, [
          h('b', { text: v.name }), h('span', { text: (fit ? '✓ Approved for this job' : 'Approved for: ' + v.jobs.join(', ')) + (light ? ' · ⚠ lifting: ' + v.lifting : '') + (v.age === '16-17' ? ' · under 18' : '') })
        ]);
      })) : h('p', { text: 'No approved volunteers are free for this shift.' }),
      h('button', { type: 'button', class: 'btn btn-line-green', text: 'Close', onclick: function () { dlg.close(); dlg.remove(); } })
    ]);
    document.body.appendChild(dlg); dlg.showModal();
  }

  // ---------- Approvals ----------
  function approvals(main) {
    var list = VOLS.filter(function (v) { return v.status === 'Pending review' && canSee(v.gender); });
    main.appendChild(h('h2', { class: 'sv-h', text: 'New applications (' + list.length + ')' }));
    if (!list.length) main.appendChild(h('p', { class: 'sv-empty', text: 'No applications waiting. JazakAllah khair!' }));
    list.forEach(function (v) {
      var chosen = [];
      var chips = h('div', { class: 'sv-jobpick' }, JOBS[v.gender].map(function (j) {
        return h('button', { type: 'button', class: 'sv-jp' + (v.gender === 'Sister' ? ' sis' : ''), 'aria-pressed': 'false', text: j, onclick: function (e) {
          var b = e.currentTarget, i = chosen.indexOf(j); if (i > -1) chosen.splice(i, 1); else chosen.push(j);
          b.setAttribute('aria-pressed', i > -1 ? 'false' : 'true'); b.classList.toggle('on', i < 0); } });
      }));
      main.appendChild(h('article', { class: 'sv-app' + (v.gender === 'Sister' ? ' sis' : '') }, [
        h('div', { class: 'sv-apph' }, [h('b', { text: v.name }), h('span', { text: v.gender + ' · ' + v.age })]),
        h('dl', { class: 'sv-dl' }, [
          h('dt', { text: 'Lifting' }), h('dd', { class: v.lifting === 'Yes' ? '' : 'warn', text: v.lifting }),
          h('dt', { text: 'Interests' }), h('dd', { text: v.interests }),
          h('dt', { text: 'Certificates' }), h('dd', { text: v.certs }),
          v.gender === 'Brother' ? h('dt', { text: 'Car' }) : null, v.gender === 'Brother' ? h('dd', { text: v.car }) : null,
          v.gender === 'Brother' ? h('dt', { text: 'Truck / van' }) : null, v.gender === 'Brother' ? h('dd', { text: v.truck || '—' }) : null,
          v.gender === 'Brother' ? h('dt', { text: 'Licence' }) : null, v.gender === 'Brother' ? h('dd', { text: v.licence || '—' }) : null,
          v.age === '16-17' ? h('dt', { text: 'Parent form' }) : null, v.age === '16-17' ? h('dd', { class: v.parentForm ? '' : 'warn', text: v.parentForm ? 'Received' : 'Not received yet — must bring to first shift' }) : null
        ]),
        h('p', { class: 'sv-lab', text: 'Approve for these jobs:' }), chips,
        h('div', { class: 'sv-actions' }, [
          h('button', { type: 'button', class: 'btn btn-green', text: 'Approve', onclick: function () {
            if (!chosen.length) { toast('Tap at least one job first.'); return; }
            v.status = 'Approved'; v.jobs = chosen.slice(); log('Approved ' + v.name + ' for ' + chosen.join(', ')); toast(v.name + ' approved. They will get an email.'); render(); } }),
          h('button', { type: 'button', class: 'btn btn-line-green', text: 'Decline', onclick: function () {
            if (!confirm('Decline ' + v.name + '? They will get a polite email.')) return; v.status = 'Declined'; log('Declined ' + v.name); render(); } })
        ])
      ]));
    });
  }

  // ---------- Event-day check-in ----------
  function checkin(main) {
    var ev = eventPicker(main);
    var list = ASSIGN.filter(function (a) { return a.ev === ev.id && a.state !== 'Removed' && canSee(vol(a.vol).gender); });
    var shiftOf = function (id) { return ev.shifts.filter(function (s) { return s.id === id; })[0]; };
    list.sort(function (a, b) { return shiftOf(a.shift).start < shiftOf(b.shift).start ? -1 : 1; });
    var counts = { 'Checked in': 0, 'Checked out': 0, 'No-show': 0 };
    list.forEach(function (a) { if (counts[a.state] != null) counts[a.state]++; });
    main.appendChild(h('div', { class: 'sv-stats' }, [
      h('span', { text: list.length + ' booked' }), h('span', { class: 'in', text: counts['Checked in'] + ' here now' }),
      h('span', { text: counts['Checked out'] + ' done' }), h('span', { class: 'no', text: counts['No-show'] + ' no-show' })
    ]));
    if (!list.length) main.appendChild(h('p', { class: 'sv-empty', text: 'Nobody is booked for this event yet.' }));
    list.forEach(function (a) {
      var v = vol(a.vol), s = shiftOf(a.shift);
      var note = h('input', { type: 'text', class: 'sv-note', placeholder: 'Work done / note (optional)', value: a.note || '', maxlength: '300', 'aria-label': 'Note for ' + v.name,
        onchange: function () { a.note = note.value.trim(); if (a.note) { v.notes.push(new Date().toLocaleDateString('en-CA') + ': ' + a.note); log('Note on ' + v.name + ': ' + a.note); } toast('Note saved'); } });
      var btns = [];
      if (a.state === 'Booked') {
        btns.push(h('button', { type: 'button', class: 'sv-big in', text: 'Check in', onclick: function () { a.state = 'Checked in'; a.in = now(); log('Checked in ' + v.name + ' at ' + a.in); render(); } }));
        btns.push(h('button', { type: 'button', class: 'sv-big no', text: 'No-show', onclick: function () { if (!confirm('Mark ' + v.name + ' as a no-show?')) return; a.state = 'No-show'; log('No-show: ' + v.name); render(); } }));
      } else if (a.state === 'Checked in') {
        btns.push(h('button', { type: 'button', class: 'sv-big out', text: 'Check out', onclick: function () { a.state = 'Checked out'; a.out = now(); log('Checked out ' + v.name + ' at ' + a.out); render(); } }));
      } else {
        btns.push(h('button', { type: 'button', class: 'sv-undo', text: 'Undo', onclick: function () { a.state = a.state === 'Checked out' ? 'Checked in' : 'Booked'; if (a.state === 'Booked') a.in = null; a.out = null; log('Undo for ' + v.name); render(); } }));
      }
      main.appendChild(h('article', { class: 'sv-ci st-' + a.state.replace(/\s/g, '') + (v.gender === 'Sister' ? ' sis' : '') }, [
        h('div', { class: 'sv-cih' }, [h('div', {}, [h('b', { text: v.name }), h('span', { text: a.job + ' · ' + t12(s.start) + '–' + t12(s.end) })]),
          h('span', { class: 'sv-state', text: a.state + (a.in ? ' ' + t12(a.in) : '') + (a.out ? ' → ' + t12(a.out) : '') })]),
        v.age === '16-17' && !v.parentForm ? h('p', { class: 'sv-warn', text: '⚠ Under 18: collect the signed parent consent form before they start.' }) : null,
        h('div', { class: 'sv-cib' }, btns), note
      ]));
    });
  }

  // ---------- Volunteer directory ----------
  function people(main) {
    var q = h('input', { type: 'search', class: 'sv-search', placeholder: 'Search name, job, truck or licence', 'aria-label': 'Search volunteers' });
    var wrap = h('div', { class: 'sv-people' });
    function draw() {
      clear(wrap);
      var s = q.value.trim().toLowerCase();
      VOLS.filter(function (v) { return canSee(v.gender) && v.status !== 'Declined' && (!s || (v.name + ' ' + v.jobs.join(' ') + ' ' + (v.truck || '') + ' ' + (v.licence || '')).toLowerCase().indexOf(s) > -1); }).forEach(function (v) {
        var rows = [h('dt', { text: 'Status' }), h('dd', { text: v.status }), h('dt', { text: 'Approved jobs' }), h('dd', { text: v.jobs.join(', ') || '—' }),
          h('dt', { text: 'Phone' }), h('dd', { text: v.phone }), h('dt', { text: 'Lifting' }), h('dd', { text: v.lifting })];
        if (v.gender === 'Brother') rows.push(h('dt', { text: 'Truck / van' }), h('dd', { text: v.truck || '—' }), h('dt', { text: 'Licence' }), h('dd', { text: v.licence || '—' }));
        if (v.notes.length) rows.push(h('dt', { text: 'Notes' }), h('dd', { text: v.notes.join(' · ') }));
        var sens = me.role === 'admin' ? h('div', { class: 'sv-sens' }, [h('p', { class: 'sv-lab', text: '🔒 Admins only' }), h('dl', { class: 'sv-dl' }, [
          h('dt', { text: 'Age group' }), h('dd', { text: v.age }), h('dt', { text: 'Emergency contacts' }), h('dd', { text: v.ec }),
          h('dt', { text: 'Police check' }), h('dd', { text: v.police }), h('dt', { text: 'Certificates' }), h('dd', { text: v.certs })])])
          : h('p', { class: 'fhint', text: '🔒 Emergency contacts, age and police checks are visible to admins only.' });
        wrap.appendChild(h('details', { class: 'sv-person' + (v.gender === 'Sister' ? ' sis' : '') }, [
          h('summary', {}, [h('b', { text: v.name }), h('span', { text: v.status === 'Approved' ? v.jobs[0] || '' : v.status })]),
          h('dl', { class: 'sv-dl' }, rows), sens
        ]));
      });
    }
    q.addEventListener('input', draw);
    main.appendChild(q); main.appendChild(wrap); draw();
  }

  // ---------- Admin (super user) ----------
  function admin(main) {
    if (me.role !== 'admin') { main.appendChild(h('p', { text: 'Not allowed.' })); return; } // access check on the view itself too
    main.appendChild(h('h2', { class: 'sv-h', text: 'Supervisor accounts' }));
    var tbl = h('div', { class: 'sv-users' });
    USERS.forEach(function (u) {
      tbl.appendChild(h('div', { class: 'sv-user' + (u.active ? '' : ' off') }, [
        h('div', {}, [h('b', { text: u.name }), h('span', { text: u.email + ' · ' + (u.role === 'admin' ? 'Admin' : (u.scope === 'Sister' ? "Sisters' supervisor" : "Brothers' supervisor")) })]),
        u === me ? h('span', { class: 'fhint', text: 'You' }) : h('button', { type: 'button', class: 'sv-undo', text: u.active ? 'Disable' : 'Enable', onclick: function () {
          u.active = !u.active; log((u.active ? 'Enabled ' : 'Disabled ') + 'account ' + u.email); render(); } })
      ]));
    });
    main.appendChild(tbl);
    var em = h('input', { type: 'email', placeholder: 'name@dawateislamivancouver.ca', 'aria-label': 'New supervisor email' });
    var role = h('select', { 'aria-label': 'Role' }, [h('option', { value: 'Brother', text: "Brothers' supervisor" }), h('option', { value: 'Sister', text: "Sisters' supervisor" }), h('option', { value: 'admin', text: 'Admin' })]);
    main.appendChild(h('form', { class: 'sv-add', onsubmit: function (e) {
      e.preventDefault(); var v = em.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { toast('Please enter a valid email.'); return; }
      if (USERS.some(function (u) { return u.email === v; })) { toast('That account already exists.'); return; }
      USERS.push({ email: v, pass: null, name: v, role: role.value === 'admin' ? 'admin' : 'supervisor', scope: role.value === 'admin' ? 'all' : role.value, active: true });
      log('Added ' + v + ' as ' + role.options[role.selectedIndex].text); toast('Added. They sign in with their Google account.'); render(); } },
      [h('b', { text: 'Add a supervisor' }), em, role, h('button', { class: 'btn btn-green', type: 'submit', text: 'Add' })]));
    main.appendChild(h('h2', { class: 'sv-h', text: 'Audit log' }));
    main.appendChild(h('p', { class: 'fhint', text: 'Every sign-in, approval, assignment, check-in and note is recorded here, and cannot be edited by supervisors.' }));
    main.appendChild(h('ol', { class: 'sv-audit' }, AUDIT.slice(0, 60).map(function (a) { return h('li', {}, [h('time', { text: a.at }), h('b', { text: a.who }), h('span', { text: a.action })]); })));
  }

  var toastEl = h('p', { id: 'svToast', class: 'sv-toast', role: 'status', hidden: true });
  document.body.appendChild(toastEl);
  renderLogin();
})();
