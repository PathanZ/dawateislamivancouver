// Volunteer sign-ups
//   open   - false shows "Sign-ups open soon" and blocks sending. Set to true once the Google script is set up.
//   Real events and shifts come from the "Events" tab of the volunteer Google Sheet.
//   Until then, the example below shows how the shift picker works.
window.FEM_VOLUNTEER = {
  open: false
};

(function () {
  var cfg = window.FEM_VOLUNTEER || {};
  var wrap = document.getElementById('volEvents');
  var form = document.getElementById('volForm');
  if (!wrap || !form) return;
  var endpoint = form.getAttribute('data-endpoint') || '';
  var live = cfg.open && endpoint;
  var picked = {};   // shiftId -> {job, label}

  // ---------- Example data (shown until sign-ups open) ----------
  function exampleData() {
    var d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7) + 14);
    var iso = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var times = [['10:00', '12:00'], ['12:00', '14:00'], ['14:00', '16:00'], ['16:00', '18:00'], ['18:00', '20:00'], ['20:00', '21:00']];
    var taken = [[1, 0, 1], [0, 1, 0], [1, 1, 1], [0, 0, 1], [0, 1, 0], [0, 0, 0]];
    return { example: true, events: [{
      id: 'ex1', name: 'Example: big community event', date: iso,
      notes: 'Brothers and sisters both needed. Wear comfortable shoes.',
      shifts: times.map(function (t, i) {
        var jobs = [['Setup & cleaning', 1], ['Kitchen & food', 1], ['Parking', 1]].map(function (j, k) {
          return { name: j[0], total: j[1], left: j[1] - taken[i][k] };
        });
        var left = jobs.reduce(function (a, j) { return a + j.left; }, 0);
        return { id: 'ex1-' + t[0], start: t[0], end: t[1], total: 3, left: left, jobs: jobs };
      })
    }]};
  }

  // ---------- Helpers ----------
  function t12(hm) {
    var p = hm.split(':'), h = +p[0], m = p[1];
    return (h % 12 || 12) + (m === '00' ? '' : ':' + m) + (h < 12 ? ' AM' : ' PM');
  }
  function niceDate(iso) {
    var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- Shift picker ----------
  function render(data) {
    document.getElementById('volExample').hidden = !data.example;
    if (!data.events || !data.events.length) {
      wrap.innerHTML = '<div class="vol-empty"><b>No events need volunteers right now.</b><p>Sign up below to join our volunteer list and we\'ll let you know when help is needed.</p></div>';
      return;
    }
    wrap.innerHTML = data.events.map(function (ev) {
      return '<article class="vol-event"><header><p class="vol-date">' + esc(niceDate(ev.date)) + '</p><h3>' + esc(ev.name) + '</h3>' +
        (ev.notes ? '<p class="vol-notes">' + esc(ev.notes) + '</p>' : '') + '</header><ul class="vol-shifts">' +
        ev.shifts.map(function (s) {
          var full = s.left <= 0, label = esc(ev.name) + ' · ' + esc(niceDate(ev.date)) + ', ' + t12(s.start) + ' – ' + t12(s.end);
          var jobs = (s.jobs && s.jobs.length ? s.jobs : [{ name: '', left: s.left, total: s.total }]).map(function (j) {
            var off = j.left <= 0;
            return '<button type="button" class="vol-job" data-shift="' + esc(s.id) + '" data-job="' + esc(j.name) + '" data-label="' + label + '"' + (off ? ' disabled' : '') +
              ' aria-pressed="false">' + (j.name ? esc(j.name) : 'Pick this shift') + (j.name ? ' <small>' + (off ? 'full' : j.left + ' left') + '</small>' : '') + '</button>';
          }).join('');
          return '<li class="vol-shift' + (full ? ' is-full' : '') + '"><div class="vol-time"><b>' + t12(s.start) + ' – ' + t12(s.end) + '</b>' +
            '<span class="vol-left">' + (full ? 'Full, thank you!' : s.left + ' of ' + s.total + ' spots left') + '</span>' +
            '<span class="vol-meter" aria-hidden="true"><i style="width:' + Math.round((s.total - s.left) / Math.max(1, s.total) * 100) + '%"></i></span></div>' +
            '<div class="vol-jobs">' + jobs + '</div></li>';
        }).join('') + '</ul></article>';
    }).join('');
    wrap.querySelectorAll('.vol-job').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-shift'), job = b.getAttribute('data-job');
        var was = picked[id] && picked[id].job === job;
        wrap.querySelectorAll('.vol-job[data-shift="' + id + '"]').forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-pressed', 'false'); });
        if (was) delete picked[id];
        else { picked[id] = { job: job, label: b.getAttribute('data-label') }; b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true'); }
        syncPicked();
      });
    });
  }
  function syncPicked() {
    var ids = Object.keys(picked), n = ids.length;
    var bar = document.getElementById('volBar');
    bar.hidden = n === 0;
    document.getElementById('volBarTxt').textContent = n + (n === 1 ? ' shift' : ' shifts') + ' selected';
    document.getElementById('volPickedNone').hidden = n > 0;
    document.getElementById('volPickedList').innerHTML = ids.map(function (id) {
      return '<li>' + picked[id].label + (picked[id].job ? ' <span>(' + esc(picked[id].job) + ')</span>' : '') + '</li>';
    }).join('');
    document.getElementById('v_shifts').value = JSON.stringify(ids.map(function (id) { return { shift: id, job: picked[id].job }; }));
  }
  // Hide the floating "Continue" bar once the sign-up form is on screen
  if ('IntersectionObserver' in window) {
    var bar0 = document.getElementById('volBar');
    new IntersectionObserver(function (es) { es.forEach(function (e) { bar0.classList.toggle('is-away', e.isIntersecting); }); }, { threshold: 0.05 })
      .observe(document.getElementById('signup'));
  }
  if (live) {
    fetch(endpoint + '?action=shifts').then(function (r) { return r.json(); }).then(render).catch(function () {
      wrap.innerHTML = '<div class="vol-empty"><b>We couldn\'t load the events.</b><p>Please refresh the page, or call the Islamic Centre.</p></div>';
    });
  } else render(exampleData());

  // ---------- Sign-up form ----------
  var closed = document.getElementById('volClosed'); if (!live && closed) closed.hidden = false;
  var err = document.getElementById('v_err'), btn = document.getElementById('v_submit');
  var newBox = document.getElementById('v_new'), retBox = document.getElementById('v_ret_box');
  function isReturning() { var r = form.querySelector('input[name=returning]:checked'); return r && r.value === 'yes'; }
  function ageGroup() { var r = form.querySelector('input[name=age_group]:checked'); return r ? r.value : ''; }
  function toggles() {
    var ret = isReturning();
    newBox.hidden = ret; retBox.hidden = !ret;
    var minor = !ret && (ageGroup() === '13-15' || ageGroup() === '16-17');
    document.getElementById('v_parent_box').hidden = !minor;
    document.getElementById('v_student_box').hidden = !document.getElementById('v_student').checked;
    var kids = [].some.call(form.querySelectorAll('input[data-kids]'), function (c) { return c.checked; });
    document.getElementById('v_police_box').hidden = !kids;
  }
  form.addEventListener('change', function (e) { toggles(); clearBad(e.target); });
  form.addEventListener('input', function (e) { clearBad(e.target); });
  function clearBad(el) { if (!el || !el.classList) return; el.classList.remove('bad'); var g = el.closest('.checks,.consent,.choice'); if (g) g.classList.remove('bad'); err.textContent = ''; }
  toggles();

  function visible(el) { return !el.closest('[hidden]'); }
  function need(sel, ok, msg) { return { el: form.querySelector(sel), ok: ok, msg: msg }; }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); err.textContent = '';
    var checks = [];
    if (isReturning()) {
      var re = document.getElementById('v_ret_email');
      checks.push({ el: re, ok: /\S+@\S+\.\S+/.test(re.value), msg: 'Please enter the email you signed up with.' });
    } else {
      form.querySelectorAll('#v_new [required]').forEach(function (el) {
        if (!visible(el)) return;
        if (el.type === 'radio') { if (!form.querySelector('input[name="' + el.name + '"]:checked')) checks.push({ el: el.closest('.checks'), ok: false }); }
        else checks.push({ el: el, ok: el.value.trim() !== '' && el.checkValidity() });
      });
      checks.push({ el: document.getElementById('v_interests'), ok: !!form.querySelector('input[name=interests]:checked'), msg: '' });
      if (!document.getElementById('v_police_box').hidden) checks.push({ el: document.querySelector('#v_police_box .checks'), ok: !!form.querySelector('input[name=police_check]:checked') });
      if (!document.getElementById('v_student_box').hidden) ['v_school', 'v_grade'].forEach(function (id) { var el = document.getElementById(id); checks.push({ el: el, ok: el.value.trim() !== '' }); });
      if (!document.getElementById('v_parent_box').hidden) ['v_pname', 'v_pphone', 'v_pemail'].forEach(function (id) { var el = document.getElementById(id); checks.push({ el: el, ok: el.value.trim() !== '' && el.checkValidity() }); });
      var ph = document.getElementById('v_phone');
      if (ph.value && ph.value.replace(/\D/g, '').length < 10) checks.push({ el: ph, ok: false, msg: 'Please enter a phone number with area code.' });
    }
    ['c_agreement', 'c_tasks', 'c_conduct', 'c_privacy'].forEach(function (n) { var c = form.querySelector('input[name=' + n + ']'); checks.push({ el: c.closest('.consent'), ok: c.checked }); });
    var sig = document.getElementById('v_sig');
    checks.push({ el: sig, ok: sig.value.trim() !== '' });
    if (!isReturning() && sig.value.trim() && sig.value.trim().replace(/\s+/g, ' ').toLowerCase() !== document.getElementById('v_name').value.trim().replace(/\s+/g, ' ').toLowerCase())
      checks.push({ el: sig, ok: false, msg: 'Your signature must match your full name.' });
    var bad = checks.filter(function (c) { return !c.ok; });
    if (bad.length) {
      bad.forEach(function (c) { if (c.el) c.el.classList.add('bad'); });
      err.textContent = (bad.filter(function (c) { return c.msg; })[0] || {}).msg || 'Please fill in the highlighted fields.';
      var first = bad[0].el; if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (first.focus) first.focus({ preventScroll: true }); }
      return;
    }
    if (form.website.value) return;
    if (!live) { err.textContent = 'Volunteer sign-ups open soon. Please check back, or call ' + '(778) 895-0886' + '.'; return; }
    var data = new URLSearchParams(), fd = new FormData(form), multi = {};
    fd.forEach(function (v, k) { if (k === 'website') return; if (multi[k] !== undefined) multi[k] += ', ' + v; else multi[k] = v; });
    Object.keys(multi).forEach(function (k) { data.append(k, multi[k]); });
    btn.disabled = true; btn.textContent = 'Sending…';
    fetch(endpoint, { method: 'POST', body: data }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res.ok) throw new Error(res.error || 'Could not send.');
      form.querySelectorAll('fieldset,.vol-picked,#v_submit').forEach(function (el) { el.hidden = true; });
      document.getElementById('v_done_txt').textContent = res.message || 'Check your email for your confirmation.';
      document.getElementById('v_done').hidden = false;
      document.getElementById('volBar').hidden = true;
      document.getElementById('v_done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function (x) {
      btn.disabled = false; btn.textContent = 'Sign up to volunteer';
      err.textContent = x && x.message && x.message !== 'Failed to fetch' ? x.message : 'Could not send. Check your internet connection and try again.';
    });
  });

  // ---------- Hours letter request ----------
  var lf = document.getElementById('letterForm');
  if (lf) lf.addEventListener('submit', function (e) {
    e.preventDefault();
    var lerr = document.getElementById('l_err'), lb = document.getElementById('l_submit'); lerr.textContent = '';
    var em = document.getElementById('l_email'), nm = document.getElementById('l_name');
    em.classList.toggle('bad', !/\S+@\S+\.\S+/.test(em.value)); nm.classList.toggle('bad', !nm.value.trim());
    if (lf.querySelector('.bad')) { lerr.textContent = 'Please fill in the highlighted fields.'; return; }
    if (lf.website.value) return;
    if (!live) { lerr.textContent = 'Hours letters open soon. Please check back, or call ' + '(778) 895-0886' + '.'; return; }
    lb.disabled = true; lb.textContent = 'Sending…';
    var d = new URLSearchParams(new FormData(lf)); d.delete('website');
    fetch(endpoint, { method: 'POST', body: d }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res.ok) throw new Error(res.error);
      lf.querySelectorAll('.field,#l_submit').forEach(function (el) { el.hidden = true; });
      document.getElementById('l_done_txt').textContent = res.message || 'We\'ll email your letter once it\'s approved.';
      document.getElementById('l_done').hidden = false;
    }).catch(function (x) {
      lb.disabled = false; lb.textContent = 'Request my letter';
      lerr.textContent = x && x.message && x.message !== 'Failed to fetch' ? x.message : 'Could not send. Please try again.';
    });
  });
})();
