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
      id: 'ex1', name: 'Example: big community event', date: iso, location: 'Example Banquet Hall, Surrey, BC',
      notes: 'Brothers and sisters both needed. Wear comfortable shoes.',
      shifts: times.map(function (t, i) {
        var jobs = [['Moving chairs & setup', 1], ['Parking', 1], ['Sisters: serving food', 1]].map(function (j, k) {
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
        (ev.location ? '<p class="vol-loc">📍 ' + esc(ev.location) + '</p>' : '') + (ev.notes ? '<p class="vol-notes">' + esc(ev.notes) + '</p>' : '') + '</header><ul class="vol-shifts">' +
        ev.shifts.map(function (s) {
          var full = s.left <= 0, label = esc(ev.name) + ' · ' + esc(niceDate(ev.date)) + ', ' + t12(s.start) + ' – ' + t12(s.end);
          var jobs = (s.jobs && s.jobs.length ? s.jobs : [{ name: '', left: s.left, total: s.total }]).map(function (j) {
            var off = j.left <= 0;
            return '<button type="button" class="vol-job' + (/sister/i.test(j.name) ? ' sis' : '') + '" data-shift="' + esc(s.id) + '" data-job="' + esc(j.name) + '" data-label="' + label + '"' + (off ? ' disabled' : '') +
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

  // ---------- Application form (step by step) ----------
  var closed = document.getElementById('volClosed'); if (!live && closed) closed.hidden = false;
  var err = document.getElementById('v_err'), btn = document.getElementById('v_submit');
  var newBox = document.getElementById('v_new'), retBox = document.getElementById('v_ret_box');
  var steps = [].slice.call(form.querySelectorAll('.vstep')), cur = 0;
  var back = document.getElementById('vBack'), next = document.getElementById('vNext');
  var INTERESTS = {
    Brother: ['Moving chairs & equipment', 'Event setup & takedown', 'Parking & traffic', 'Security', 'Greeting outside (entrance & parking)', 'Greeting inside',
      'Kitchen & food', 'Serving food', 'Cleaning', 'Transport (driving)', 'Collecting donations', 'Maktaba-tul-Madinah book stand', 'Faizan Online Academy stand',
      'Photography', 'Videography', 'Video editing', 'Tech & livestream', "Kids' activities", 'Tutoring & teaching', 'Admin & sign-in desk',
      'Roofing', 'Electrical work', 'Plumbing', 'Pest control (Integrated Pest Management)'],
    Sister: ["Setting up the sisters' side", "Cleaning the sisters' side", 'Serving food', 'Collecting donations', 'Maktaba-tul-Madinah book stand',
      'Faizan Online Academy stand', "Greeting on the sisters' side", 'Kitchen & food', "Kids' activities", 'Tutoring & teaching', 'Admin & sign-in desk', 'Decoration']
  };
  var MIN_INTERESTS = 5;
  function val(name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function isReturning() { return val('returning') === 'yes'; }
  function hasInterest(v) { return [].some.call(form.querySelectorAll('input[name=interests]:checked'), function (c) { return c.value === v; }); }
  function pickedAny(re) { return [].some.call(form.querySelectorAll('input[name=interests]:checked'), function (c) { return re.test(c.value); }); }
  var lastGender = '';
  function buildInterests() {
    var g = val('gender'), box = document.getElementById('v_interests');
    if (g === lastGender) return; lastGender = g;
    document.getElementById('v_int_hint').hidden = !!g;
    box.classList.toggle('sis', g === 'Sister');
    box.innerHTML = (INTERESTS[g] || []).map(function (v) { return '<label><input type="checkbox" name="interests" value="' + esc(v) + '"> ' + esc(v) + '</label>'; }).join('');
  }
  function toggles() {
    var ret = isReturning(), g = val('gender');
    newBox.hidden = ret; retBox.hidden = !ret;
    buildInterests();
    document.body.classList.toggle('vol-sister', g === 'Sister');
    document.getElementById('v_parent_box').hidden = val('age_group') !== '16-17';
    document.getElementById('v_student_box').hidden = !document.getElementById('v_student').checked;
    document.getElementById('v_youth_none').hidden = val('age_group') === '16-17' || document.getElementById('v_student').checked;
    document.getElementById('v_police_date_box').hidden = !/Check/.test(document.getElementById('v_police').value);
    form.querySelectorAll('.cert input[data-exp]').forEach(function (c) { var e = c.closest('.cert').querySelector('.cert-exp'); if (e) e.hidden = !c.checked; });
    document.getElementById('v_q_photo').hidden = !hasInterest('Photography');
    document.getElementById('v_q_video').hidden = !hasInterest('Videography');
    document.getElementById('v_q_edit').hidden = !hasInterest('Video editing');
    document.getElementById('v_q_trade').hidden = !pickedAny(/Roofing|Electrical|Plumbing|Pest control/);
    document.getElementById('v_q_car').hidden = g !== 'Brother';
    document.getElementById('v_car_ok').hidden = !(g === 'Brother' && val('car') === 'Yes');
    var trucks = [].map.call(form.querySelectorAll('input[name=moving_vehicle]:checked'), function (c) { return c.value; });
    document.getElementById('v_q_truck').hidden = g !== 'Brother';
    document.getElementById('v_truck_ok').hidden = !(g === 'Brother' && trucks.length && trucks.indexOf('None') < 0);
    document.getElementById('v_q_licence').hidden = g !== 'Brother';
    document.getElementById('v_kids_box').hidden = !pickedAny(/Kids|Tutoring/) || /Vulnerable/.test(document.getElementById('v_police').value);
    document.getElementById('v_lift_note').hidden = !(val('lifting') === 'No' || val('lifting') === 'Light items only');
    var n = form.querySelectorAll('input[name=interests]:checked').length;
    document.getElementById('v_int_count').textContent = n >= MIN_INTERESTS ? '(' + n + ' chosen ✓)' : '(pick at least ' + MIN_INTERESTS + ': ' + n + ' chosen)';
    document.getElementById('v_cphoto').hidden = !(ret || g === 'Brother');
    document.getElementById('v_sisphoto').hidden = ret || g !== 'Sister';
  }
  function showStep(i) {
    var ret = isReturning();
    cur = ret ? steps.length - 1 : i;
    steps.forEach(function (st, k) { st.hidden = ret ? k !== steps.length - 1 : k !== cur; });
    var last = cur === steps.length - 1;
    back.hidden = ret || cur === 0; next.hidden = last; btn.hidden = !last;
    document.getElementById('vStepCount').textContent = 'Step ' + (cur + 1) + ' of ' + steps.length;
    document.querySelectorAll('#vStepBar li').forEach(function (li, k) { li.className = k < cur ? 'done' : (k === cur ? 'on' : ''); });
  }
  form.addEventListener('change', function (e) {
    // "None of these" and a vehicle can't both be ticked
    if (e.target.name === 'moving_vehicle' && e.target.checked) form.querySelectorAll('input[name=moving_vehicle]').forEach(function (c) { if ((e.target.value === 'None') !== (c.value === 'None')) c.checked = false; });
  });
  form.addEventListener('change', function (e) { if (e.target.name === 'returning') showStep(0); toggles(); clearBad(e.target); });
  form.addEventListener('input', function (e) { clearBad(e.target); });
  function clearBad(el) { if (!el || !el.classList) return; el.classList.remove('bad'); var g = el.closest('.checks,.consent,.choice,.gpick'); if (g) g.classList.remove('bad'); err.textContent = ''; }
  function visible(el) { return !el.closest('[hidden]'); }
  function checkStep(st) {
    var bad = [], msg = '';
    st.querySelectorAll('[required]').forEach(function (el) {
      if (!visible(el)) return;
      if (el.type === 'radio') { if (!form.querySelector('input[name="' + el.name + '"]:checked')) bad.push(el.closest('.checks,.gpick')); }
      else if (el.type === 'checkbox') { if (!el.checked) bad.push(el.closest('.consent')); }
      else if (!(el.value.trim() !== '' && el.checkValidity())) bad.push(el);
    });
    var stepNo = +st.getAttribute('data-step');
    function need(id, ok) { var el = document.getElementById(id); if (el && visible(el) && !ok(el)) bad.push(el); }
    var filled = function (el) { return el.value.trim() !== ''; };
    if (stepNo === 1) { var ph = document.getElementById('v_phone'); if (ph.value && ph.value.replace(/\D/g, '').length < 10) { bad.push(ph); msg = 'Please enter a phone number with area code.'; } }
    if (stepNo === 2) ['v_ec1p', 'v_ec2p'].forEach(function (id) { var el = document.getElementById(id); if (el.value && el.value.replace(/\D/g, '').length < 10) { bad.push(el); msg = 'Please enter phone numbers with area code.'; } });
    if (stepNo === 3) { need('v_police_date', filled); form.querySelectorAll('.cert-exp input').forEach(function (el) { if (visible(el) && !el.value) bad.push(el); }); if (bad.length && !msg) msg = 'Please fill in the highlighted fields, including expiry dates for the certificates you ticked.'; }
    if (stepNo === 4) {
      if (form.querySelectorAll('input[name=interests]:checked').length < MIN_INTERESTS) { bad.push(document.getElementById('v_interests')); msg = 'Please choose at least ' + MIN_INTERESTS + ' areas you are interested in.'; }
      ['v_photo_eq', 'v_video_eq', 'v_edit_sw', 'v_trade_lic'].forEach(function (id) { need(id, filled); });
      if (visible(document.getElementById('v_q_car')) && !val('car')) bad.push(document.querySelector('#v_q_car .checks'));
      if (visible(document.getElementById('v_car_ok')) && !form.querySelector('input[name=car_insured]').checked) bad.push(document.getElementById('v_car_ok'));
      if (visible(document.getElementById('v_q_truck')) && !form.querySelector('input[name=moving_vehicle]:checked')) bad.push(document.getElementById('v_truck_opts'));
      if (visible(document.getElementById('v_truck_ok')) && !form.querySelector('input[name=moving_vehicle_insured]').checked) bad.push(document.getElementById('v_truck_ok'));
      need('v_licence', filled);
      if (visible(document.getElementById('v_kids_box')) && !val('kids_check_ok')) bad.push(document.querySelector('#v_kids_box .checks'));
    }
    if (stepNo === 5) {
      if (visible(document.getElementById('v_student_box'))) { need('v_school', filled); need('v_grade', filled); }
      if (visible(document.getElementById('v_parent_box'))) { need('v_pname', filled); need('v_pphone', filled); if (!document.getElementById('v_cparent').checked) bad.push(document.getElementById('v_cparent').closest('.consent')); }
    }
    if (stepNo === 6) {
      if (isReturning()) { var re = document.getElementById('v_ret_email'); if (!/\S+@\S+\.\S+/.test(re.value)) { bad.push(re); msg = 'Please enter the email you applied with.'; } }
      var cp = form.querySelector('input[name=c_photo]'); if (visible(cp) && !cp.checked) { bad.push(cp.closest('.consent')); msg = msg || 'Brothers must agree to being photographed and filmed to volunteer.'; }
      var sig = document.getElementById('v_sig');
      if (!isReturning() && sig.value.trim() && sig.value.trim().replace(/\s+/g, ' ').toLowerCase() !== document.getElementById('v_name').value.trim().replace(/\s+/g, ' ').toLowerCase()) { bad.push(sig); msg = 'Your signature must match your full name.'; }
    }
    bad = bad.filter(Boolean);
    if (bad.length) {
      bad.forEach(function (el) { el.classList.add('bad'); });
      err.textContent = msg || 'Please fill in the highlighted fields.';
      bad[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); if (bad[0].focus) bad[0].focus({ preventScroll: true });
      return false;
    }
    err.textContent = ''; return true;
  }
  next.addEventListener('click', function () { if (checkStep(steps[cur])) { showStep(cur + 1); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  back.addEventListener('click', function () { err.textContent = ''; showStep(cur - 1); form.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  toggles(); showStep(0);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!checkStep(steps[cur])) return;
    if (form.website.value) return;
    if (!live) { err.textContent = 'Volunteer applications open soon. Please check back, or call ' + '(778) 895-0886' + '.'; return; }
    var data = new URLSearchParams(), multi = {};
    new FormData(form).forEach(function (v, k) {
      if (k === 'website') return;
      var el = form.querySelector('[name="' + k + '"]'); if (el && !visible(el) && !isReturning() && el.closest('#v_new')) return;
      if (multi[k] !== undefined) multi[k] += ', ' + v; else multi[k] = v;
    });
    Object.keys(multi).forEach(function (k) { data.append(k, multi[k]); });
    btn.disabled = true; btn.textContent = 'Sending…';
    fetch(endpoint, { method: 'POST', body: data }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res.ok) throw new Error(res.error || 'Could not send.');
      form.querySelectorAll('fieldset,.vol-picked,#v_submit,.vstep-nav,.vstep-bar,.vstep-count').forEach(function (el) { el.hidden = true; });
      document.getElementById('v_done_txt').textContent = res.message || 'Check your email for your confirmation.';
      document.getElementById('v_done').hidden = false;
      document.getElementById('volBar').hidden = true;
      document.getElementById('v_done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function (x) {
      btn.disabled = false; btn.textContent = 'Send my application';
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
