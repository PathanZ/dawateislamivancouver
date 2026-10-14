/*
 * Student attendance for teachers — DEMO FRONT END
 *
 * Everything here is made-up demo data that lives only in this browser tab.
 * The demo logins below are NOT security: anyone can read them in this file.
 * In the real system, teachers sign in with their Islamic Centre Google account
 * (2-step verification) and the Google Apps Script backend checks, on EVERY request,
 * which classes that teacher is allowed to see. See google-apps-script/attendance-backend.md.
 *
 * Security habits used even in the demo (OWASP Top 10):
 *  - A03 Injection / XSS: all data is written with textContent, never innerHTML.
 *  - A01 Access control: a teacher only ever sees the classes assigned to them
 *    (brothers' teachers never see the girls' class and the other way round).
 *  - A07 Auth: 5 failed logins lock the form for 60 s; idle sessions end after 15 minutes.
 *  - A02 Data exposure: nothing is saved in localStorage/cookies; a refresh signs you out.
 *  - A09 Logging: every save and change is written to an audit log (visible to admins).
 */
(function () {
  'use strict';
  var root = document.getElementById('at');
  if (!root) return;

  // ---------- Demo accounts (demo only — never do this with real data) ----------
  var USERS = [
    { user: 'admin', pass: 'admin', name: 'Admin (demo)', role: 'admin', classes: 'all', active: true },
    { user: 'mohsin', pass: 'mohsin', name: 'Mohsin Bhai (demo)', role: 'teacher', side: 'Brothers', classes: ['MB', 'WB'], active: true },
    { user: 'zaid', pass: 'zaid', name: 'Zaid (demo)', role: 'teacher', side: 'Brothers', classes: ['MA', 'WB'], active: true },
    { user: 'sister', pass: 'sister', name: 'Sister teacher (demo)', role: 'teacher', side: 'Sisters', classes: ['WG'], active: true }
  ];

  // ---------- Classes (days: 0 = Sunday ... 6 = Saturday) ----------
  // Times and the adults' online days are placeholders: change them to the real schedule.
  var CLASSES = [
    { id: 'MB', name: 'Madrasa-tul-Madina · Boys', short: 'Madrasa Boys', side: 'Brothers', days: [1, 2, 3, 4, 5], time: 'Mon–Fri · 5:00–7:00 PM', mode: 'In person' },
    { id: 'MA', name: 'Madrasa-tul-Madina · Adults', short: 'Madrasa Adults', side: 'Brothers', days: [1, 3, 5], time: 'Mon, Wed, Fri · 8:30 PM online · 1st Sunday of the month in person', mode: 'Hybrid', monthlyInPerson: 'first-sunday' },
    { id: 'WB', name: 'Weekend Islamic School · Boys', short: 'Weekend Boys', side: 'Brothers', days: [0], time: 'Sundays · 11:00 AM–1:00 PM', mode: 'In person' },
    { id: 'WG', name: 'Weekend Islamic School · Girls', short: 'Weekend Girls', side: 'Sisters', days: [0], time: 'Sundays · 11:00 AM–1:00 PM', mode: 'In person' }
  ];

  // ---------- Demo students (fictional) ----------
  var S = [];
  function add(cls, list, adult) {
    list.forEach(function (x, i) {
      S.push({ id: cls + (i + 1), cls: cls, name: x[0], level: x[1], contact: x[2], phone: x[3], adult: !!adult, active: true });
    });
  }
  add('MB', [['Ahmad Raza', 'Nazira · Para 12', 'Father: Imran Raza', '604 555 0201'], ['Bilal Hussain', 'Qaida', 'Mother: Sana Hussain', '604 555 0202'],
    ['Hamza Qadri', 'Hifz · Para 3', 'Father: Usman Qadri', '604 555 0203'], ['Ibrahim Siddiqui', 'Nazira · Para 7', 'Father: Tariq Siddiqui', '604 555 0204'],
    ['Musa Attari', 'Qaida', 'Mother: Amina Attari', '604 555 0205'], ['Yusuf Malik', 'Nazira · Para 20', 'Father: Kamran Malik', '604 555 0206'],
    ['Zakariya Khan', 'Hifz · Para 1', 'Father: Asad Khan', '604 555 0207'], ['Umar Farooq', 'Qaida', 'Mother: Hina Farooq', '604 555 0208'],
    ['Ali Mustafa', 'Nazira · Para 2', 'Father: Rizwan Mustafa', '604 555 0209'], ['Abdullah Noor', 'Nazira · Para 15', 'Father: Faisal Noor', '604 555 0210']]);
  add('MA', [['Adnan Sheikh', 'Tajweed level 2', 'Self', '604 555 0301'], ['Kashif Mehmood', 'Tajweed level 1', 'Self', '604 555 0302'],
    ['Naveed Akhtar', 'Tajweed level 2', 'Self', '604 555 0303'], ['Salman Javed', 'Tajweed level 1', 'Self', '604 555 0304'],
    ['Waqas Iqbal', 'Tajweed level 3', 'Self', '604 555 0305'], ['Junaid Aslam', 'Tajweed level 1', 'Self', '604 555 0306'],
    ['Fahad Rasheed', 'Tajweed level 2', 'Self', '604 555 0307']], true);
  add('WB', [['Ayaan Patel', 'Age 7 · Group A', 'Mother: Ruksana Patel', '604 555 0401'], ['Rayyan Shah', 'Age 9 · Group B', 'Father: Nadeem Shah', '604 555 0402'],
    ['Zayd Ansari', 'Age 6 · Group A', 'Father: Shoaib Ansari', '604 555 0403'], ['Idris Chaudhry', 'Age 11 · Group C', 'Mother: Saima Chaudhry', '604 555 0404'],
    ['Haris Butt', 'Age 8 · Group B', 'Father: Imtiaz Butt', '604 555 0405'], ['Taha Mirza', 'Age 10 · Group C', 'Father: Arif Mirza', '604 555 0406'],
    ['Sami Ahmed', 'Age 7 · Group A', 'Mother: Nadia Ahmed', '604 555 0407'], ['Danyal Raza', 'Age 12 · Group C', 'Father: Imran Raza', '604 555 0408']]);
  add('WG', [['Aisha Rahman', 'Age 8 · Group B', 'Mother: Farah Rahman', '604 555 0501'], ['Fatima Zahra', 'Age 6 · Group A', 'Father: Bilal Zahra', '604 555 0502'],
    ['Maryam Qureshi', 'Age 10 · Group C', 'Mother: Sadia Qureshi', '604 555 0503'], ['Khadija Noor', 'Age 7 · Group A', 'Father: Faisal Noor', '604 555 0504'],
    ['Zainab Hassan', 'Age 11 · Group C', 'Mother: Huma Hassan', '604 555 0505'], ['Hafsa Iqbal', 'Age 9 · Group B', 'Mother: Saba Iqbal', '604 555 0506'],
    ['Ruqayya Ali', 'Age 12 · Group C', 'Father: Shahid Ali', '604 555 0507'], ['Safiya Mirza', 'Age 8 · Group B', 'Mother: Nida Mirza', '604 555 0508']]);

  var STATUS = { P: 'Present', L: 'Late', A: 'Absent', E: 'Excused' };
  var ORDER = ['P', 'L', 'A', 'E'];

  // ---------- Dates (Vancouver time) ----------
  var TZ = 'America/Vancouver';
  function ymd(d) { return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ }).format(d); }
  function parse(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)); }
  function shift(s, n) { return ymd(new Date(parse(s).getTime() + n * 864e5)); }
  function dow(s) { return parse(s).getUTCDay(); }
  function nice(s, long) { return new Intl.DateTimeFormat('en-GB', { weekday: long ? 'long' : 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(parse(s)); }
  var TODAY = ymd(new Date());
  function isFirstSunday(s) { return dow(s) === 0 && +s.slice(8) <= 7; }
  function cls(id) { return CLASSES.filter(function (c) { return c.id === id; })[0]; }
  function hasClass(c, s) { return c.days.indexOf(dow(s)) > -1 || (c.monthlyInPerson === 'first-sunday' && isFirstSunday(s)); }
  function defaultMode(c, s) { return c.mode === 'Hybrid' ? (isFirstSunday(s) ? 'In person' : 'Online') : 'In person'; }
  function nextClassDay(c, s) { for (var i = 1; i < 15; i++) { var d = shift(s, i); if (hasClass(c, d)) return d; } return null; }
  function sessions(c, from, to) { var out = [], d = from; while (d <= to) { if (hasClass(c, d)) out.push(d); d = shift(d, 1); } return out; }

  // ---------- Demo attendance history (made up, about 6 weeks) ----------
  var REC = {}; // REC[classId][date] = { st: {studentId: 'P'}, note: {}, mode, cancelled, by, at }
  (function seed() {
    var r = 7;
    function rnd() { r = (r * 9301 + 49297) % 233280; return r / 233280; }
    CLASSES.forEach(function (c) {
      REC[c.id] = {};
      sessions(c, shift(TODAY, -42), shift(TODAY, -1)).forEach(function (d) {
        var st = {}, note = {};
        S.filter(function (s) { return s.cls === c.id; }).forEach(function (s, i) {
          var x = rnd(), weak = (s.id === 'MB5' || s.id === 'WG4' || s.id === 'MA6');
          st[s.id] = weak ? (x < .45 ? 'A' : x < .6 ? 'L' : 'P') : (x < .05 ? 'A' : x < .1 ? 'L' : x < .13 ? 'E' : 'P');
          if (st[s.id] === 'E') note[s.id] = 'Family trip';
        });
        // the weak students missed the most recent classes in a row, so the warning shows
        if (d >= shift(TODAY, -8)) ['MB5', 'WG4', 'MA6'].forEach(function (id) { if (id in st) st[id] = 'A'; });
        REC[c.id][d] = { st: st, note: note, mode: defaultMode(c, d), cancelled: false, by: 'Demo teacher', at: '' };
      });
    });
  })();
  var AUDIT = [];

  // ---------- Session ----------
  var me = null, view = 'take', curCls = null, curDate = TODAY, curMonth = TODAY.slice(0, 7), fails = 0, lockedUntil = 0, idleTimer = null, draft = null, dirty = false;
  var IDLE_MS = 15 * 60 * 1000;
  function touch() { if (!me) return; clearTimeout(idleTimer); idleTimer = setTimeout(function () { logout('You were signed out after 15 minutes of no activity.'); }, IDLE_MS); }
  ['click', 'keydown', 'touchstart'].forEach(function (t) { document.addEventListener(t, touch, { passive: true }); });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

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
  function clock() { return new Intl.DateTimeFormat('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: TZ }).format(new Date()); }
  function log(action) { AUDIT.unshift({ at: new Date().toLocaleString('en-CA', { timeZone: TZ }), who: me.name, action: action }); }
  function toast(msg) { var t = document.getElementById('atToast'); t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(function () { t.hidden = true; }, 2600); }
  function myClasses() { return CLASSES.filter(function (c) { return me.classes === 'all' || me.classes.indexOf(c.id) > -1; }); }
  function canSee(id) { return myClasses().some(function (c) { return c.id === id; }); } // checked before every read/write
  function students(id, all) { return S.filter(function (s) { return s.cls === id && (all || s.active); }); }

  // attendance numbers for a student over the last N days
  function stats(s, days) {
    var from = shift(TODAY, -(days || 42)), rec = REC[s.cls], n = 0, here = 0, abs = 0, streak = 0, counting = true;
    Object.keys(rec).sort().reverse().forEach(function (d) {
      var r = rec[d]; if (d < from || r.cancelled || !(s.id in r.st)) return;
      var v = r.st[s.id]; n++;
      if (v === 'P' || v === 'L') here++;
      if (v === 'A') abs++;
      if (counting) { if (v === 'A') streak++; else counting = false; }
    });
    var pct = n ? Math.round(here * 100 / n) : null;
    return { n: n, pct: pct, abs: abs, streak: streak, flag: (streak >= 3) || (pct != null && pct < 75) };
  }

  // ---------- Login ----------
  function renderLogin(msg) {
    clear(root);
    var err = h('p', { class: 'ferr', role: 'alert', text: msg || '' });
    var user = h('input', { id: 'atUser', type: 'text', autocomplete: 'username', required: true, autocapitalize: 'none' });
    var pass = h('input', { id: 'atPass', type: 'password', autocomplete: 'current-password', required: true });
    var form = h('form', { class: 'sv-login rform', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      if (Date.now() < lockedUntil) { err.textContent = 'Too many attempts. Please wait ' + Math.ceil((lockedUntil - Date.now()) / 1000) + ' seconds.'; return; }
      var u = USERS.filter(function (x) { return x.user === user.value.trim().toLowerCase() && x.pass === pass.value && x.active; })[0];
      if (!u) {
        fails++; pass.value = '';
        if (fails >= 5) { lockedUntil = Date.now() + 60000; fails = 0; err.textContent = 'Too many attempts. The form is locked for 60 seconds.'; }
        else err.textContent = 'Username or password is not correct.';
        return;
      }
      fails = 0; me = u; log('Signed in'); touch(); view = 'take';
      var mine = myClasses(); curCls = (mine.filter(function (c) { return hasClass(c, TODAY); })[0] || mine[0]).id; curDate = TODAY; draft = null;
      render();
    } }, [
      h('div', { class: 'sv-brand' }, [h('img', { src: 'assets/img/logo-vancouver.png', alt: 'Dawat-e-Islami Vancouver', width: '220' })]),
      h('h1', { text: 'Teacher attendance' }),
      h('p', { class: 'sv-demo', text: 'DEMO with made-up students. Try mohsin / mohsin or zaid / zaid (brothers\' teachers), sister / sister (sisters\' teacher), or admin / admin.' }),
      h('div', { class: 'field' }, [h('label', { for: 'atUser', text: 'Username' }), user]),
      h('div', { class: 'field' }, [h('label', { for: 'atPass', text: 'Password' }), pass]),
      err,
      h('button', { class: 'btn btn-green', type: 'submit', text: 'Sign in' }),
      h('p', { class: 'fhint', text: 'In the real system this is "Sign in with Google", using the teacher\'s Islamic Centre account.' })
    ]);
    root.appendChild(h('div', { class: 'sv-login-wrap' }, [form]));
    user.focus();
  }
  function logout(msg) {
    if (dirty && !confirm('You have attendance that is not saved. Sign out anyway?')) return;
    if (me) log('Signed out'); me = null; dirty = false; draft = null; clearTimeout(idleTimer); renderLogin(msg);
  }

  // ---------- Shell ----------
  function render() {
    if (!me) return renderLogin();
    clear(root);
    var tabs = [['take', 'Attendance'], ['register', 'Register'], ['students', 'Students']];
    if (me.role === 'admin') tabs.push(['admin', 'Admin']);
    var sideTxt = me.role === 'admin' ? 'Admin · all classes' : me.side === 'Sisters' ? "Sisters' classes" : "Brothers' classes";
    root.appendChild(h('header', { class: 'sv-top' }, [
      h('div', { class: 'sv-who' }, [h('b', { text: me.name }), h('span', { class: 'sv-role' + (me.side === 'Sisters' ? ' sv-sis' : ''), text: sideTxt })]),
      h('button', { class: 'sv-out', type: 'button', text: 'Sign out', onclick: function () { logout('You have signed out.'); } })
    ]));
    root.appendChild(h('p', { class: 'sv-demo-bar', text: 'Demo only · made-up students · changes are lost when you refresh' }));
    root.appendChild(h('nav', { class: 'sv-tabs', 'aria-label': 'Sections' }, tabs.map(function (t) {
      return h('button', { type: 'button', class: view === t[0] ? 'on' : '', 'aria-current': view === t[0] ? 'page' : null, onclick: function () { go(t[0]); } }, [t[1]]);
    })));
    // class chips (only the teacher's own classes)
    var mine = myClasses();
    if (view !== 'admin') root.appendChild(h('div', { class: 'at-classes', role: 'group', 'aria-label': 'Class' }, mine.map(function (c) {
      return h('button', { type: 'button', class: 'at-cls' + (c.id === curCls ? ' on' : '') + (c.side === 'Sisters' ? ' sis' : ''), 'aria-pressed': c.id === curCls ? 'true' : 'false',
        onclick: function () { if (c.id === curCls) return; if (dirty && !confirm('Leave without saving this attendance?')) return; dirty = false; draft = null; curCls = c.id; render(); } }, [h('b', { text: c.short }), h('span', { text: c.mode })]);
    })));
    var main = h('main', { class: 'sv-main' }); root.appendChild(main);
    if (view !== 'admin' && !canSee(curCls)) { main.appendChild(h('p', { class: 'sv-empty', text: 'You do not have access to this class.' })); return; }
    ({ take: take, register: register, students: studentsView, admin: admin })[view](main);
    root.appendChild(h('div', { id: 'atToast', class: 'sv-toast', role: 'status', hidden: true }));
  }
  function go(v) { if (v === view) return; if (dirty && !confirm('Leave without saving this attendance?')) return; dirty = false; draft = null; view = v; render(); window.scrollTo(0, 0); }

  // ---------- Take attendance ----------
  function take(main) {
    var c = cls(curCls), rec = REC[c.id][curDate], list = students(c.id);
    if (!draft || draft.cls !== c.id || draft.date !== curDate) {
      draft = { cls: c.id, date: curDate, st: rec ? Object.assign({}, rec.st) : {}, note: rec ? Object.assign({}, rec.note) : {}, mode: rec ? rec.mode : defaultMode(c, curDate), cancelled: rec ? rec.cancelled : false };
    }
    // date row
    var dateIn = h('input', { type: 'date', class: 'at-date', value: curDate, max: TODAY, 'aria-label': 'Class date', onchange: function () {
      if (!dateIn.value) return; if (dirty && !confirm('Leave without saving this attendance?')) { dateIn.value = curDate; return; }
      dirty = false; draft = null; curDate = dateIn.value > TODAY ? TODAY : dateIn.value; render(); } });
    main.appendChild(h('div', { class: 'at-dayrow' }, [
      h('button', { type: 'button', class: 'at-step', 'aria-label': 'Previous class day', text: '‹', onclick: function () { stepDay(c, -1); } }),
      h('div', { class: 'at-dayinfo' }, [h('b', { text: (curDate === TODAY ? 'Today · ' : '') + nice(curDate, true) }), dateIn]),
      h('button', { type: 'button', class: 'at-step', 'aria-label': 'Next class day', text: '›', disabled: curDate >= TODAY ? true : null, onclick: function () { stepDay(c, 1); } })
    ]));
    main.appendChild(h('p', { class: 'at-time', text: c.name + ' · ' + c.time }));

    if (!hasClass(c, curDate) && !rec && !draft.extra) {
      var nx = nextClassDay(c, curDate);
      main.appendChild(h('div', { class: 'sv-empty at-noclass' }, [
        h('p', { text: 'No ' + c.short + ' class is scheduled on ' + nice(curDate, true) + '.' }),
        nx ? h('p', { class: 'fhint', text: 'Next class: ' + nice(nx, true) }) : null,
        h('button', { type: 'button', class: 'btn btn-line-green', text: 'Take attendance for an extra class', onclick: function () { draft.extra = true; render(); } })
      ]));
      return;
    }
    // hybrid: online / in person
    if (c.mode === 'Hybrid') main.appendChild(h('div', { class: 'at-mode', role: 'group', 'aria-label': 'This class was' }, ['Online', 'In person'].map(function (m) {
      return h('button', { type: 'button', class: draft.mode === m ? 'on' : '', 'aria-pressed': draft.mode === m ? 'true' : 'false', text: (m === 'Online' ? '💻 ' : '🕌 ') + m, onclick: function () { draft.mode = m; dirty = true; render(); } });
    })));
    // cancelled class
    var cancelBox = h('label', { class: 'at-cancel' }, [h('input', { type: 'checkbox', checked: draft.cancelled ? true : null, onchange: function (e) { draft.cancelled = e.target.checked; dirty = true; render(); } }), ' No class this day (holiday or cancelled)']);
    main.appendChild(cancelBox);
    if (draft.cancelled) { main.appendChild(saveBar(c, list)); return; }

    // counts + quick actions
    var count = { P: 0, L: 0, A: 0, E: 0 }, unmarked = 0;
    list.forEach(function (s) { var v = draft.st[s.id]; if (v) count[v]++; else unmarked++; });
    main.appendChild(h('div', { class: 'at-sum' }, ORDER.map(function (k) { return h('span', { class: 'k-' + k, text: count[k] + ' ' + STATUS[k] }); })
      .concat([unmarked ? h('span', { class: 'k-none', text: unmarked + ' not marked' }) : null])));
    main.appendChild(h('div', { class: 'at-quick' }, [
      h('button', { type: 'button', class: 'btn btn-green', text: unmarked === list.length ? '✓ Mark everyone present' : '✓ Mark the rest present', disabled: unmarked ? null : true, onclick: function () {
        list.forEach(function (s) { if (!draft.st[s.id]) draft.st[s.id] = 'P'; }); dirty = true; render(); } }),
      h('button', { type: 'button', class: 'btn btn-line-green', text: 'Clear', onclick: function () { draft.st = {}; draft.note = {}; dirty = true; render(); } })
    ]));
    // students
    var ul = h('ol', { class: 'at-list' });
    list.forEach(function (s, i) {
      var v = draft.st[s.id], st = stats(s);
      var noteIn = h('input', { type: 'text', class: 'at-note', maxlength: '120', placeholder: v === 'E' ? 'Reason (e.g. sick, family trip)' : 'Note (optional)', value: draft.note[s.id] || '', 'aria-label': 'Note for ' + s.name,
        oninput: function () { draft.note[s.id] = noteIn.value.slice(0, 120); dirty = true; } });
      ul.appendChild(h('li', { class: 'at-row' + (v ? ' is-' + v : '') }, [
        h('div', { class: 'at-name' }, [
          h('span', { class: 'at-num', text: String(i + 1) }),
          h('div', null, [h('b', { text: s.name }), h('span', { text: s.level }), st.flag ? h('span', { class: 'at-flag', text: st.streak >= 3 ? '⚠ Absent ' + st.streak + ' classes in a row' : '⚠ Attendance ' + st.pct + '%' }) : null])
        ]),
        h('div', { class: 'at-btns', role: 'radiogroup', 'aria-label': 'Attendance for ' + s.name }, ORDER.map(function (k) {
          return h('button', { type: 'button', role: 'radio', class: 'at-b b-' + k + (v === k ? ' on' : ''), 'aria-checked': v === k ? 'true' : 'false', title: STATUS[k],
            onclick: function () { draft.st[s.id] = v === k ? undefined : k; if (!draft.st[s.id]) delete draft.st[s.id]; dirty = true; render(); } }, [h('b', { text: k }), h('span', { text: STATUS[k] })]);
        })),
        (v === 'A' || v === 'L' || v === 'E' || draft.note[s.id]) ? h('div', { class: 'at-extra' }, [noteIn,
          v === 'A' ? h('a', { class: 'at-call', href: 'tel:' + s.phone.replace(/\D/g, ''), text: '📞 Call ' + (s.adult ? 'student' : s.contact.split(':')[0].toLowerCase()) }) : null]) : null
      ]));
    });
    main.appendChild(ul);
    main.appendChild(saveBar(c, list));
  }
  function stepDay(c, dir) {
    if (dirty && !confirm('Leave without saving this attendance?')) return;
    var d = curDate;
    for (var i = 0; i < 31; i++) { d = shift(d, dir); if (d > TODAY) return; if (hasClass(c, d) || REC[c.id][d]) { dirty = false; draft = null; curDate = d; render(); return; } }
  }
  function saveBar(c, list) {
    var rec = REC[c.id][curDate];
    var info = rec && rec.at ? 'Saved ' + rec.at + ' by ' + rec.by : rec ? 'Saved earlier' : 'Not saved yet';
    return h('div', { class: 'at-save' }, [
      h('span', { class: 'at-saved' + (dirty ? ' unsaved' : ''), text: dirty ? 'Changes not saved' : info }),
      h('button', { type: 'button', class: 'btn btn-gold', text: rec ? 'Save changes' : 'Save attendance', onclick: function () {
        if (!canSee(c.id)) return toast('You do not have access to this class.');
        var missing = draft.cancelled ? [] : list.filter(function (s) { return !draft.st[s.id]; });
        if (missing.length && !confirm(missing.length + ' student(s) are not marked: ' + missing.map(function (s) { return s.name; }).join(', ') + '.\n\nMark them as Absent and save?')) return;
        missing.forEach(function (s) { draft.st[s.id] = 'A'; });
        REC[c.id][curDate] = { st: Object.assign({}, draft.st), note: Object.assign({}, draft.note), mode: draft.mode, cancelled: draft.cancelled, by: me.name.replace(' (demo)', ''), at: clock() };
        log((rec ? 'Changed' : 'Saved') + ' attendance · ' + c.short + ' · ' + nice(curDate) + (draft.cancelled ? ' (no class)' : ''));
        dirty = false; draft = null; render(); toast('Attendance saved ✓');
      } })
    ]);
  }

  // ---------- Register (month grid) ----------
  function register(main) {
    var c = cls(curCls), list = students(c.id, true);
    var y = +curMonth.slice(0, 4), m = +curMonth.slice(5, 7);
    var first = curMonth + '-01', last = ymd(new Date(Date.UTC(y, m, 0, 12)));
    var days = Object.keys(REC[c.id]).filter(function (d) { return d >= first && d <= last; }).sort();
    var label = new Intl.DateTimeFormat('en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parse(first));
    function mv(n) { var d = new Date(Date.UTC(y, m - 1 + n, 1, 12)); curMonth = ymd(d).slice(0, 7); render(); }
    main.appendChild(h('div', { class: 'at-dayrow' }, [
      h('button', { type: 'button', class: 'at-step', 'aria-label': 'Previous month', text: '‹', onclick: function () { mv(-1); } }),
      h('div', { class: 'at-dayinfo' }, [h('b', { text: label }), h('span', { class: 'fhint', text: c.name })]),
      h('button', { type: 'button', class: 'at-step', 'aria-label': 'Next month', text: '›', disabled: curMonth >= TODAY.slice(0, 7) ? true : null, onclick: function () { mv(1); } })
    ]));
    if (!days.length) { main.appendChild(h('p', { class: 'sv-empty', text: 'No attendance saved for ' + label + ' yet.' })); return; }
    main.appendChild(h('p', { class: 'at-legend' }, ORDER.map(function (k) { return h('span', { class: 'g-' + k }, [h('i', { text: k }), ' ' + STATUS[k]]); })
      .concat([h('span', { class: 'g-X' }, [h('i', { text: '–' }), ' No class'])])));
    var head = h('tr', null, [h('th', { class: 'at-sn', scope: 'col', text: 'Student' })].concat(days.map(function (d) {
      var r = REC[c.id][d];
      return h('th', { scope: 'col' }, [h('button', { type: 'button', class: 'at-dbtn', title: 'Open ' + nice(d), onclick: function () { curDate = d; draft = null; view = 'take'; render(); window.scrollTo(0, 0); } },
        [h('b', { text: String(+d.slice(8)) }), h('span', { text: nice(d).split(',')[0] }), c.mode === 'Hybrid' && r.mode === 'In person' ? h('span', { class: 'at-ip', text: '🕌' }) : null])]);
    })).concat([h('th', { scope: 'col', text: '%' })]));
    var body = list.map(function (s) {
      var here = 0, n = 0;
      var cells = days.map(function (d) {
        var r = REC[c.id][d]; if (r.cancelled) return h('td', { class: 'g-X', text: '–' });
        var v = r.st[s.id]; if (!v) return h('td', { text: '' });
        n++; if (v === 'P' || v === 'L') here++;
        return h('td', { class: 'g-' + v, title: STATUS[v] + (r.note[s.id] ? ': ' + r.note[s.id] : ''), text: v });
      });
      var pct = n ? Math.round(here * 100 / n) : null;
      return h('tr', { class: s.active ? '' : 'at-inactive' }, [h('th', { class: 'at-sn', scope: 'row', text: s.name })].concat(cells)
        .concat([h('td', { class: 'at-pct' + (pct != null && pct < 75 ? ' low' : ''), text: pct == null ? '' : pct + '%' })]));
    });
    var gw = h('div', { class: 'at-gridwrap' }, [h('table', { class: 'at-grid' }, [h('thead', null, [head]), h('tbody', null, body)])]);
    main.appendChild(gw);
    requestAnimationFrame(function () { gw.scrollLeft = gw.scrollWidth; }); // open on the latest classes
    main.appendChild(h('p', { class: 'fhint', text: 'Tap a date at the top to open or correct that day. Present and Late count as attended.' }));
    main.appendChild(h('div', { class: 'sv-actions' }, [h('button', { type: 'button', class: 'btn btn-line-green', text: '⬇ Download ' + label + ' (spreadsheet)', onclick: function () { csv(c, days, list, label); } })]));
  }
  function csv(c, days, list, label) {
    function q(x) { x = String(x == null ? '' : x); if (/^[=+\-@]/.test(x)) x = "'" + x; return '"' + x.replace(/"/g, '""') + '"'; } // stops formula injection in Excel/Sheets
    var rows = [['Student', 'Level'].concat(days).concat(['Attended %'])];
    list.forEach(function (s) {
      var here = 0, n = 0;
      var cells = days.map(function (d) { var r = REC[c.id][d]; if (r.cancelled) return 'No class'; var v = r.st[s.id]; if (!v) return ''; n++; if (v === 'P' || v === 'L') here++; return STATUS[v] + (r.note[s.id] ? ' (' + r.note[s.id] + ')' : ''); });
      rows.push([s.name, s.level].concat(cells).concat([n ? Math.round(here * 100 / n) + '%' : '']));
    });
    var blob = new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = h('a', { href: URL.createObjectURL(blob), download: c.short.replace(/\s+/g, '-') + '-attendance-' + label.replace(/\s+/g, '-') + '.csv' });
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    log('Downloaded register · ' + c.short + ' · ' + label);
  }

  // ---------- Students ----------
  function studentsView(main) {
    var c = cls(curCls), list = students(c.id, true);
    var flagged = list.filter(function (s) { return s.active && stats(s).flag; });
    if (flagged.length) main.appendChild(h('div', { class: 'at-alert' }, [h('b', { text: '⚠ ' + flagged.length + ' student(s) need a follow-up' }),
      h('ul', null, flagged.map(function (s) { var st = stats(s); return h('li', { text: s.name + ' · ' + (st.streak >= 3 ? 'absent ' + st.streak + ' classes in a row' : 'attendance ' + st.pct + '%') }); }))]));
    var q = h('input', { type: 'search', class: 'sv-search', placeholder: 'Search students', 'aria-label': 'Search students' });
    var wrap = h('div', { class: 'at-people' });
    function draw() {
      clear(wrap); var t = q.value.trim().toLowerCase();
      list.filter(function (s) { return !t || (s.name + ' ' + s.level).toLowerCase().indexOf(t) > -1; }).forEach(function (s) {
        var st = stats(s);
        wrap.appendChild(h('details', { class: 'sv-person at-person' + (s.active ? '' : ' at-inactive') + (c.side === 'Sisters' ? ' sis' : '') }, [
          h('summary', null, [h('b', { text: s.name }), h('span', { class: 'at-pill' + (st.flag ? ' low' : ''), text: st.pct == null ? 'New' : st.pct + '%' })]),
          h('dl', { class: 'sv-dl' }, [
            h('dt', { text: 'Level' }), h('dd', { text: s.level }),
            h('dt', { text: s.adult ? 'Phone' : 'Parent' }), h('dd', { text: s.adult ? s.phone : s.contact + ' · ' + s.phone }),
            h('dt', { text: 'Last 6 weeks' }), h('dd', { text: st.n + ' classes · ' + st.abs + ' absent' + (st.streak ? ' · ' + st.streak + ' in a row' : '') }),
            h('dt', { text: 'Status' }), h('dd', { text: s.active ? 'Enrolled' : 'Left the class' })
          ]),
          h('div', { class: 'sv-actions' }, [
            h('a', { class: 'btn btn-line-green', href: 'tel:' + s.phone.replace(/\D/g, ''), text: '📞 Call ' + (s.adult ? 'student' : 'parent') }),
            h('button', { type: 'button', class: 'btn btn-line-green', text: s.active ? 'Mark as left' : 'Re-enrol', onclick: function () {
              if (s.active && !confirm(s.name + ' will no longer appear on the attendance list. Their past attendance is kept. Continue?')) return;
              s.active = !s.active; log((s.active ? 'Re-enrolled ' : 'Marked as left: ') + s.name + ' · ' + c.short); render(); } })
          ])
        ]));
      });
    }
    q.addEventListener('input', draw);
    main.appendChild(h('h2', { class: 'sv-h', text: c.name + ' · ' + list.filter(function (s) { return s.active; }).length + ' students' }));
    main.appendChild(q); draw(); main.appendChild(wrap);
    // add a student
    var nm = h('input', { id: 'atNewName', type: 'text', maxlength: '60', autocomplete: 'off' });
    var lv = h('input', { id: 'atNewLevel', type: 'text', maxlength: '40', placeholder: c.id === 'MA' ? 'e.g. Tajweed level 1' : 'e.g. Qaida, or Age 8 · Group B', autocomplete: 'off' });
    var ct = h('input', { id: 'atNewContact', type: 'text', maxlength: '60', placeholder: c.id === 'MA' ? 'Self' : 'e.g. Mother: Sana Hussain', autocomplete: 'off' });
    var ph = h('input', { id: 'atNewPhone', type: 'tel', maxlength: '20', placeholder: '604 555 0123', autocomplete: 'off' });
    var err = h('p', { class: 'ferr', role: 'alert' });
    main.appendChild(h('details', { class: 'at-addbox' }, [h('summary', { text: '+ Add a student to ' + c.short }),
      h('form', { class: 'rform at-add', novalidate: true, onsubmit: function (e) {
        e.preventDefault();
        var name = nm.value.trim().replace(/\s+/g, ' '), phone = ph.value.replace(/[^\d+]/g, '');
        if (name.length < 3) { err.textContent = 'Please enter the student\'s full name.'; return; }
        if (phone.replace(/\D/g, '').length < 10) { err.textContent = 'Please enter a phone number with area code.'; return; }
        S.push({ id: c.id + 'N' + Date.now(), cls: c.id, name: name, level: lv.value.trim() || '—', contact: ct.value.trim() || (c.id === 'MA' ? 'Self' : 'Parent'), phone: ph.value.trim(), adult: c.id === 'MA', active: true });
        log('Added student ' + name + ' · ' + c.short); render(); toast(name + ' added');
      } }, [
        h('div', { class: 'field' }, [h('label', { for: 'atNewName', text: 'Full name' }), nm]),
        h('div', { class: 'field' }, [h('label', { for: 'atNewLevel', text: 'Level or group' }), lv]),
        c.id === 'MA' ? null : h('div', { class: 'field' }, [h('label', { for: 'atNewContact', text: 'Parent or guardian' }), ct]),
        h('div', { class: 'field' }, [h('label', { for: 'atNewPhone', text: c.id === 'MA' ? 'Phone' : 'Parent phone' }), ph]),
        err, h('button', { class: 'btn btn-green', type: 'submit', text: 'Add student' })
      ])]));
  }

  // ---------- Admin ----------
  function admin(main) {
    if (me.role !== 'admin') return main.appendChild(h('p', { class: 'sv-empty', text: 'Admins only.' }));
    main.appendChild(h('h2', { class: 'sv-h', text: 'All classes · last 6 weeks' }));
    main.appendChild(h('div', { class: 'at-cards' }, CLASSES.map(function (c) {
      var list = students(c.id), held = Object.keys(REC[c.id]).filter(function (d) { return d >= shift(TODAY, -42) && !REC[c.id][d].cancelled; }).length;
      var pcts = list.map(function (s) { return stats(s).pct; }).filter(function (x) { return x != null; });
      var avg = pcts.length ? Math.round(pcts.reduce(function (a, b) { return a + b; }, 0) / pcts.length) : null;
      var flagged = list.filter(function (s) { return stats(s).flag; }).length;
      var todayDone = REC[c.id][TODAY], due = hasClass(c, TODAY);
      return h('div', { class: 'at-card' + (c.side === 'Sisters' ? ' sis' : '') }, [
        h('b', { text: c.name }), h('span', { class: 'fhint', text: c.time }),
        h('div', { class: 'sv-stats' }, [h('span', { text: list.length + ' students' }), h('span', { text: held + ' classes' }), h('span', { class: avg != null && avg < 80 ? 'no' : 'in', text: (avg == null ? '–' : avg + '%') + ' attended' }), h('span', { class: flagged ? 'no' : 'in', text: flagged + ' to follow up' })]),
        h('span', { class: 'at-today' + (due && !todayDone ? ' due' : ''), text: !due ? 'No class today' : todayDone ? 'Today: taken by ' + todayDone.by + ' at ' + todayDone.at : 'Today: not taken yet' }),
        h('span', { class: 'fhint', text: 'Teachers: ' + USERS.filter(function (u) { return u.classes !== 'all' && u.classes.indexOf(c.id) > -1; }).map(function (u) { return u.name.replace(' (demo)', ''); }).join(', ') })
      ]);
    })));
    main.appendChild(h('h2', { class: 'sv-h', text: 'Teacher accounts' }));
    main.appendChild(h('div', { class: 'sv-users' }, USERS.filter(function (u) { return u.role === 'teacher'; }).map(function (u) {
      return h('div', { class: 'sv-user' }, [h('div', null, [h('b', { text: u.name }), h('span', { text: u.side + ' · ' + u.classes.map(function (id) { return cls(id).short; }).join(', ') })]),
        h('button', { type: 'button', class: 'sv-undo', text: u.active ? 'Disable' : 'Enable', onclick: function () { u.active = !u.active; log((u.active ? 'Enabled ' : 'Disabled ') + u.name); render(); } })]);
    })));
    main.appendChild(h('h2', { class: 'sv-h', text: 'Activity log' }));
    main.appendChild(AUDIT.length ? h('ol', { class: 'sv-audit' }, AUDIT.slice(0, 40).map(function (a) { return h('li', null, [h('span', { text: a.at }), h('b', { text: a.who }), h('span', { text: a.action })]); }))
      : h('p', { class: 'sv-empty', text: 'Nothing yet.' }));
  }

  renderLogin();
})();
