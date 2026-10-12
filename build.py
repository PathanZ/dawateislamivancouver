"""Assemble the site pages from shared pieces. Run: python3 build.py

Website of Faizan e Madina Vancouver (Dawat-e-Islami), for dawateislamivancouver.ca.

Pages
  index.html          Home: today's prayers, weekly Ijtima, services, donations, visit/map
  prayer-times.html   Monthly timetable
  events.html         Event flyers and posters (edit assets/events.js to add one)

The Dawat-e-Islami Canada website lives in the PathanZ/dawateislami-vancouver
repo and will link to this site.
"""
from pathlib import Path
import hashlib

ROOT = Path(__file__).parent
BN = "81933 5662 RR0001"
SITE_URL = "https://dawateislamivancouver.ca/"
V_NAME = "Faizan e Madina Vancouver"
V_ADDRESS = "7062 134 St, Surrey, BC V3W 4T2"
V_PHONE = "+1 (778) 895-0886"
V_TEL = "+17788950886"
V_MAP_Q = "Faizan+e+Madina,+7062+134+Street,+Surrey,+BC"
JUMMAH = "1:30 PM &amp; 3:30 PM"
# Website forms (tax receipts, Dua-e-Maghfirah): paste the Google Apps Script web app URL
# here (see google-apps-script/masjid-forms.gs), then run python3 build.py.
FORMS_ENDPOINT = ""

# Cache-busting: browsers re-download CSS/JS whenever their contents change
V = hashlib.md5(b"".join((ROOT / f).read_bytes() for f in ["assets/style.css", "assets/main.js", "assets/prayer-data.js", "assets/events.js"])).hexdigest()[:8]


def tbc(label="TBC"):
    return f'<span class="draft">{label}</span>'


def head(title, desc, path=""):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#5b6b3a">
<meta name="description" content="{desc}">
<title>{title}</title>
<link rel="canonical" href="{SITE_URL}{path}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{SITE_URL}{path}">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%95%8C%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Marcellus&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css?v={V}">
</head>
<body>
'''


def header(current):
    def link(href, text, key):
        cur = ' aria-current="page"' if key == current else ""
        return f'<a href="{href}"{cur}>{text}</a>'
    return f'''<a class="ribbon" href="index.html#ijtima">
  <span class="ribbon-in"><b>Weekly Ijtima</b> <span id="ijtimaWhen">every Thursday at 7:00 PM</span> <span class="ribbon-sep" aria-hidden="true">·</span> <span class="ribbon-all">All are welcome</span> <span class="ribbon-go" aria-hidden="true">→</span></span>
</a>
<div class="topbar">
  <div class="wrap">
    <span class="arabic bismillah" lang="ar">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</span>
    <a class="next" id="nextPrayer" href="prayer-times.html" aria-live="polite"></a>
  </div>
</div>
<header class="site-header">
  <div class="wrap">
    <a class="logo" href="index.html"><img src="assets/img/logo-vancouver.png" width="900" height="242" alt="Dawat-e-Islami Vancouver"></a>
    <button class="menu-toggle" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Main">
      {link("prayer-times.html", "Prayer times", "prayer")}
      {link("events.html", "Events", "events")}
      {link("index.html#ijtima", "Weekly Ijtima", None)}
      {link("index.html#services", "Services", None)}
      {link("index.html#visit", "Visit us", None)}
      <a class="btn btn-gold" href="index.html#donate">Donate now</a>
    </nav>
  </div>
</header>
'''


FOOTER = f'''<footer class="site-footer" id="contact">
  <div class="wrap">
    <div class="cols">
      <div>
        <img class="footer-logo" src="assets/img/logo-vancouver-white.png" width="900" height="242" alt="Dawat-e-Islami Vancouver">
        <p><b>{V_NAME}</b> is a centre of Dawat-e-Islami, a global, non-political movement spreading the teachings of the Qur'an and Sunnah.</p>
        <p class="bn">Registered Canadian charity · BN {BN}</p>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li>{V_ADDRESS}</li>
          <li><a href="tel:{V_TEL}">{V_PHONE}</a></li>
          <li>Email: {tbc()}</li>
          <li>WhatsApp: {tbc()}</li>
        </ul>
      </div>
      <div>
        <h4>Quick links</h4>
        <ul>
          <li><a href="prayer-times.html">Prayer times</a></li>
          <li><a href="events.html">Events</a></li>
          <li><a href="index.html#ijtima">Weekly Ijtima</a></li>
          <li><a href="index.html#maghfirah">Dua-e-Maghfirah</a></li>
          <li><a href="index.html#school">Weekend Islamic School</a></li>
          <li><a href="index.html#services">Services</a></li>
          <li><a href="index.html#books">Free Islamic books</a></li>
          <li><a href="index.html#about">About us</a></li>
          <li><a href="index.html#donate">Donate</a></li>
        </ul>
      </div>
      <div>
        <h4>Dawat-e-Islami</h4>
        <ul>
          <li>Dawat-e-Islami Canada {tbc("website coming soon")}</li>
          <li><a href="https://www.dawateislami.net/" target="_blank" rel="noopener">Global website</a></li>
          <li><a href="https://www.dawateislamiusa.org/" target="_blank" rel="noopener">Dawat-e-Islami USA</a></li>
          <li><a href="https://www.fatwaqa.com/en" target="_blank" rel="noopener">Ask a question (Darul Ifta)</a></li>
        </ul>
        <h4 class="follow">Follow us</h4>
        <ul class="social">
          <li><a class="soc soc-ig" href="https://www.instagram.com/dawateislamivancouver/" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram"><span class="soc-ic"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg></span></a></li>
          <li><a class="soc soc-fb" href="https://www.facebook.com/DawateislamiinVancouver/" target="_blank" rel="noopener" aria-label="Facebook" title="Facebook"><span class="soc-ic"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg></span></a></li>
          <li><a class="soc soc-tt" href="https://www.tiktok.com/@maulana.abid.canada" target="_blank" rel="noopener" aria-label="TikTok, Maulana Abid" title="TikTok, Maulana Abid"><span class="soc-ic"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></span></a></li>
        </ul>
        <p class="soc-note">TikTok: Maulana Abid</p>
      </div>
    </div>
    <div class="legal">
      <span>© <span id="year">2026</span> {V_NAME} · Dawat-e-Islami Canada</span>
      <span>Draft preview for management review</span>
    </div>
  </div>
</footer>
<script src="assets/prayer-data.js?v={V}"></script>
<script src="assets/events.js?v={V}"></script>
<script src="assets/main.js?v={V}"></script>
</body>
</html>
'''

ICON = {
    "salah": '<path d="M3 20h18M5 20V11l7-6 7 6v9M10 20v-5h4v5"/>',
    "jummah": '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c.8-3 3-5 6-5s5.2 2 6 5M14 15.2c.6-.1 1.3-.2 2-.2 3 0 5.2 2 6 5"/>',
    "ijtima": '<path d="M12 3v3M5 21v-6a7 7 0 0114 0v6M3 21h18M9 21v-3h6v3"/>',
    "school": '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "courses": '<path d="M4 4h12l4 4v12H4zM8 12h8M8 16h5"/>',
    "quran": '<path d="M4 5h7a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v12a2 2 0 012-2h7z"/>',
    "sisters": '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/>',
    "online": '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4M10 9l5 2-5 2z"/>',
}


def svg(name):
    return f'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICON[name]}</svg>'


def card(icon, title, text):
    return f'''        <article class="program">
          <div class="ic" aria-hidden="true">{svg(icon)}</div>
          <h3>{title}</h3>
          <p>{text}</p>
        </article>'''


SERVICES = "\n".join([
    card("salah", "5 daily prayers", "Jama'at for all five daily prayers."),
    card("jummah", "Two Jummah prayers", "Khutbah at 1:30 PM and 3:30 PM, with a speech 30 minutes before each."),
    card("ijtima", "Weekly Ijtima", "Every Thursday at 7:00 PM, open to everyone."),
    card("school", "Weekend Islamic School", "Every Sunday, 11 AM to 1 PM, for ages 6 to 12."),
    card("courses", "Free monthly courses", "Short courses on everyday Islamic knowledge."),
    card("quran", "Qur'an classes & Hifz", "Qur'an reading with tajweed and the Hifz program."),
    card("sisters", "Sisters-only Halaqah", "Classes and gatherings for Islamic sisters."),
    card("online", "Faizan Online Academy", "Live online classes you can join from home."),
])

IJTIMA_PARTS = "".join(f"<li>{p}</li>" for p in ["Tilawat", "Naat", "Bayan", "Zikr", "Dua", "Salam"])

TODAY_CARD = f'''      <aside class="today" aria-labelledby="todayTitle">
        <div class="today-head">
          <h2 id="todayTitle">Today's prayers</h2>
          <span class="today-date" id="todayDate"></span>
        </div>
        <div class="today-cols"><span>Prayer</span><span>Begins</span><span>Jama'at</span></div>
        <ul class="today-list" id="todayList"></ul>
        <div class="today-foot">
          <span class="jm-pill">Jummah <b>1:30 PM</b> &amp; <b>3:30 PM</b></span>
          <a href="prayer-times.html">Full timetable</a>
        </div>
      </aside>'''

HOME = f'''<main id="top">
  <section class="hero">
    <div class="wrap">
      <div>
        <p class="arabic" lang="ar">اَلسَّلَامُ عَلَيْكُمْ</p>
        <h1>Welcome to {V_NAME}</h1>
        <p class="tagline">Dawat-e-Islami · Surrey, BC</p>
        <p class="lead">Our masjid serves the Lower Mainland with the five daily prayers, two Jummah congregations, a weekly Ijtima and Qur'an classes for all ages.</p>
        <div class="actions">
          <a class="btn btn-gold" href="#donate">Donate now</a>
          <a class="btn btn-line" href="#visit">Get directions</a>
        </div>
      </div>
{TODAY_CARD}
    </div>
  </section>

  <section class="weekly" aria-label="Weekly prayers and gatherings">
    <div class="wrap weekly-grid">
      <div class="wk wk-jummah">
        <div class="wk-head"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c.8-3 3-5 6-5s5.2 2 6 5M14 15.2c.6-.1 1.3-.2 2-.2 3 0 5.2 2 6 5"/></svg><span>Every Friday</span></div>
        <h2>Jumu'ah Salah</h2>
        <div class="jm-two">
          <div class="jm"><p class="jm-label">1st Jamaat</p><p class="jm-time">1:30 <small>PM</small></p><p class="jm-sub">Khutbah · Iqamah 1:35 PM</p></div>
          <div class="jm"><p class="jm-label">2nd Jamaat</p><p class="jm-time">3:30 <small>PM</small></p><p class="jm-sub">Khutbah · Iqamah 3:35 PM</p></div>
        </div>
        <p class="wk-note">A speech begins 30 minutes before each Khutbah. Brothers and sisters welcome.</p>
        <a class="wk-go" href="events.html">See the Jumu'ah poster →</a>
      </div>
      <a class="wk wk-ijtima" href="#ijtima">
        <div class="wk-head"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3M5 21v-6a7 7 0 0114 0v6M3 21h18M9 21v-3h6v3"/></svg><span>Every Thursday</span></div>
        <h2>Weekly Ijtima</h2>
        <div class="jm"><p class="jm-label">Thursday night</p><p class="jm-time">7:00 <small>PM</small></p><p class="jm-sub">Tilawat · Naat · Bayan · Zikr · Dua</p></div>
        <p class="wk-note">Open to everyone. Dinner served, with a separate arrangement for sisters.</p>
        <span class="wk-go">Details and Dua-e-Maghfirah →</span>
      </a>
    </div>
  </section>

  <section class="block events-home" id="events">
    <div class="wrap">
      <div class="head">
        <p class="kicker">What's coming up</p>
        <h2>Upcoming events</h2>
        <div class="ornament" aria-hidden="true">✦</div>
      </div>
      <div class="events-grid" id="eventsGrid" data-limit="3"></div>
      <p class="center-cta"><a class="btn btn-green" href="events.html">See all events</a></p>
    </div>
  </section>

  <section class="slogan" aria-label="Madani Maqsad">
    <div class="wrap">
      <p class="kicker">Our Madani Maqsad</p>
      <p class="en">"I must strive to reform myself and the people of the entire world, In sha Allah."</p>
    </div>
  </section>

  <section class="block" id="ijtima">
    <div class="wrap about">
      <div>
        <div class="head left">
          <p class="kicker">Every Thursday</p>
          <h2>Weekly Ijtima, open to everyone</h2>
          <div class="ornament" aria-hidden="true">✦</div>
        </div>
        <p>A weekly spiritual gathering with recitation, a bayan on the topic of the week, remembrance of Allah and a heartfelt dua.</p>
        <ul class="parts">{IJTIMA_PARTS}</ul>
        <ul class="facts">
          <li><b>When</b><span>Every Thursday at 7:00 PM</span></li>
          <li><b>Where</b><span>{V_ADDRESS}</span></li>
          <li><b>Also</b><span>Dinner served · separate arrangement for sisters</span></li>
        </ul>
        <p class="ij-link"><a href="#maghfirah">Submit names for Dua-e-Maghfirah at the Ijtima →</a></p>
      </div>
      <div class="photo-slot">
        <div><strong>Photo</strong><span>Weekly Ijtima at the masjid, to be added</span></div>
      </div>
    </div>
  </section>

  <section class="block tint" id="maghfirah">
    <div class="wrap magh">
      <div class="magh-intro">
        <div class="head left">
          <p class="kicker">Remember those who have passed away</p>
          <h2>Dua-e-Maghfirah</h2>
          <div class="ornament" aria-hidden="true">✦</div>
        </div>
        <p>Send us the names of your loved ones who have passed away. At the Weekly Ijtima on Thursday, the whole gathering will make a collective dua for their forgiveness and mercy.</p>
        <h3 class="sub">Why make dua for the deceased</h3>
        <ul class="benefits">
          <li>
            <p class="ar" lang="ar">رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ</p>
            <p>"Our Lord, forgive us and our brothers who came before us in faith." The Qur'an teaches the believers to pray for those who have gone before them.</p>
            <cite>Surah Al-Hashr, 59:10</cite>
          </li>
          <li>
            <p>When a person dies, their deeds come to an end except three: ongoing charity, beneficial knowledge, and a righteous child who prays for them. Your dua keeps reaching them.</p>
            <cite>Sahih Muslim, 1631</cite>
          </li>
          <li>
            <p>A person's rank in Paradise is raised, and they ask how. They are told it is because their child sought forgiveness for them.</p>
            <cite>Sunan Ibn Majah, 3660</cite>
          </li>
          <li>
            <p>When you pray for a fellow Muslim in their absence, an angel says, "Ameen, and the same for you." Making dua for others brings blessings back to you too.</p>
            <cite>Sahih Muslim, 2733</cite>
          </li>
        </ul>
      </div>
      <form class="rform" id="maghForm" novalidate data-endpoint="{FORMS_ENDPOINT}">
        <input type="hidden" name="form" value="maghfirah">
        <div class="rules">
          <b>How it works</b>
          <ul>
            <li>Up to <b>3 names per family each week</b>.</li>
            <li>You can book for this Thursday or the next one, up to <b>2 weeks ahead</b>.</li>
            <li>Names for this Thursday are accepted until <b>5:00 PM</b> that day.</li>
          </ul>
        </div>
        <div class="field">
          <label for="m_week">Which Thursday's Ijtima? <span class="req">*</span></label>
          <select id="m_week" name="week" required></select>
        </div>
        <fieldset class="field">
          <legend>Names of the deceased <span class="req">*</span></legend>
          <div class="names" id="m_names">
            <div class="nrow"><input type="text" name="deceased_1" id="m_d1" aria-label="Name of the deceased, 1" placeholder="Full name" required><input type="text" name="relation_1" id="m_r1" aria-label="Relation to you, 1" placeholder="Relation (optional)"></div>
            <div class="nrow" hidden><input type="text" name="deceased_2" id="m_d2" aria-label="Name of the deceased, 2" placeholder="Full name"><input type="text" name="relation_2" id="m_r2" aria-label="Relation to you, 2" placeholder="Relation (optional)"></div>
            <div class="nrow" hidden><input type="text" name="deceased_3" id="m_d3" aria-label="Name of the deceased, 3" placeholder="Full name"><input type="text" name="relation_3" id="m_r3" aria-label="Relation to you, 3" placeholder="Relation (optional)"></div>
          </div>
          <button type="button" class="addname" id="m_add">+ Add another name</button>
        </fieldset>
        <div class="field">
          <label for="m_name">Your name <span class="req">*</span></label>
          <input id="m_name" name="submitter" type="text" autocomplete="name" required>
        </div>
        <div class="two">
          <div class="field">
            <label for="m_phone">Phone number <span class="req">*</span></label>
            <input id="m_phone" name="phone" type="tel" autocomplete="tel" placeholder="604 555 0123" required>
          </div>
          <div class="field">
            <label for="m_email">Email</label>
            <input id="m_email" name="email" type="email" autocomplete="email">
          </div>
        </div>
        <div class="hp" aria-hidden="true"><label for="m_web">Leave this empty</label><input id="m_web" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <p class="ferr" id="m_err" role="alert"></p>
        <button class="btn btn-green" type="submit" id="m_submit">Submit names</button>
        <div class="fdone" id="m_done" hidden>
          <b>JazakAllah khair. The names have been added.</b>
          <p id="m_done_txt">They will be included in the collective dua at the Weekly Ijtima, In sha Allah.</p>
        </div>
      </form>
    </div>
  </section>

  <section class="block alt" id="school">
    <div class="wrap school">
      <div>
        <div class="head left">
          <p class="kicker">For children aged 6 to 12</p>
          <h2>Faizan Weekend Islamic School</h2>
          <div class="ornament" aria-hidden="true">✦</div>
        </div>
        <p>Learn, practise and have fun. Children learn the basics of their faith through stories, activities and good company, with male teachers for boys and female teachers for girls.</p>
        <ul class="facts">
          <li><b>When</b><span>Every Sunday, 11:00 AM to 1:00 PM</span></li>
          <li><b>Ages</b><span>6 to 12</span></li>
          <li><b>Fee</b><span>$50 per month</span></li>
          <li><b>Where</b><span>{V_ADDRESS}</span></li>
          <li><b>Contact</b><span>Principal: <a href="tel:+12365162065">(236) 516-2065</a><br>Masjid: <a href="tel:{V_TEL}">{V_PHONE}</a></span></li>
        </ul>
        <h3 class="sub">What children learn</h3>
        <ul class="learn">
          <li><b>Aqaaid and Ibaadaat</b><span>Learning about Allah and how to worship Him</span></li>
          <li><b>Seerah</b><span>Stories from the life of Prophet Muhammad ﷺ</span></li>
          <li><b>Sunnah and Duas</b><span>Learning and practising important Sunnahs and duas</span></li>
          <li><b>Akhlaq</b><span>Good behaviour for a better life</span></li>
        </ul>
        <ul class="parts"><li>Arts and crafts</li><li>Group activities</li><li>Quizzes</li><li>Interactive learning</li></ul>
        <a class="btn btn-green" href="tel:+12365162065">Call the Principal to register</a>
      </div>
      <a class="school-flyer" href="assets/events/weekend-school.jpg" target="_blank" rel="noopener">
        <img src="assets/events/weekend-school.jpg" width="1254" height="1254" loading="lazy" alt="Faizan Weekend Islamic School flyer: every Sunday 11 AM to 1 PM, ages 6 to 12, $50 per month">
      </a>
    </div>
  </section>

  <section class="block" id="services">
    <div class="wrap">
      <div class="head">
        <p class="kicker">At our masjid</p>
        <h2>Our services to the community</h2>
        <div class="ornament" aria-hidden="true">✦</div>
      </div>
      <div class="programs four">
{SERVICES}
      </div>
    </div>
  </section>

  <section class="block alt" id="books">
    <div class="wrap">
      <div class="head">
        <p class="kicker">Read and download for free</p>
        <h2>Free Islamic books</h2>
        <div class="ornament" aria-hidden="true">✦</div>
        <p>Dawat-e-Islami's online library has more than 5,000 Islamic books in over 30 languages. Read them online or download a free PDF.</p>
      </div>
      <div class="books-grid">
          <a class="bookcard" href="https://www.dawateislami.net/bookslibrary/en/search?pn=1&amp;filterLang=en" target="_blank" rel="noopener">
            <span class="bk-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h7a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v12a2 2 0 012-2h7z"/></svg></span>
            <span class="bk-lang">English</span>
            <b>English books</b>
            <span class="bk-txt">Faith, worship, the life of the Prophet ﷺ, manners and more.</span>
            <span class="when">Open library →</span>
          </a>
          <a class="bookcard" href="https://www.dawateislami.net/bookslibrary/ur" target="_blank" rel="noopener">
            <span class="bk-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h7a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v12a2 2 0 012-2h7z"/></svg></span>
            <span class="bk-lang">اردو</span>
            <b>Urdu books</b>
            <span class="bk-txt">The full Urdu collection, including the writings of Ameer-e-Ahl-e-Sunnat.</span>
            <span class="when">Open library →</span>
          </a>
          <a class="bookcard" href="https://arabicdawateislami.net/bookslibrary/" target="_blank" rel="noopener">
            <span class="bk-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h7a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v12a2 2 0 012-2h7z"/></svg></span>
            <span class="bk-lang">العربية</span>
            <b>Arabic books</b>
            <span class="bk-txt">Books and classical texts in Arabic.</span>
            <span class="when">Open library →</span>
          </a>
          <a class="bookcard" href="https://www.dawateislami.net/bookslibrary/en/search?pn=1&amp;filterLang=en&amp;writer=1" target="_blank" rel="noopener">
            <span class="bk-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h7a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-7a2 2 0 00-2 2v12a2 2 0 012-2h7z"/></svg></span>
            <span class="bk-lang">Writers</span>
            <b>Browse by author</b>
            <span class="bk-txt">Find books by Ameer-e-Ahl-e-Sunnat, Imam Ahmad Raza Khan and other scholars.</span>
            <span class="when">Open library →</span>
          </a>
      </div>
      <p class="books-more">Also from Dawat-e-Islami: <a href="https://alqurankarim.net/" target="_blank" rel="noopener">Al-Qur'an with translation and tafseer</a> · <a href="https://www.dawateislami.net/magazine/en" target="_blank" rel="noopener">Monthly magazine</a></p>
    </div>
  </section>

  <section class="block hadees" aria-labelledby="hadeesTitle">
    <div class="wrap">
      <p class="kicker" id="hadeesTitle">Hadees of the week</p>
      <p class="arabic" lang="ar">خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ</p>
      <blockquote>The best among you is the one who learns the Qur'an and teaches it.</blockquote>
      <cite>Sahih al-Bukhari, Hadith 5027</cite>
    </div>
  </section>

  <section class="block alt" id="donate">
    <div class="wrap donate">
      <div>
        <div class="head left">
          <p class="kicker">Support us</p>
          <h2>Your donation keeps our masjid going</h2>
          <div class="ornament" aria-hidden="true">✦</div>
        </div>
        <p>Donations support {V_NAME}: the masjid, Qur'an classes, the weekend school and community programs. Zakat, Sadaqah and Fitra are all accepted, as are donations toward the masjid's mortgage and Qarz-e-Hasna contributions.</p>
        <p class="hadith">"Charity does not decrease wealth." <span>Sahih Muslim, 2588</span></p>
        <div class="taxnote">
          <b>Every donation receives an official tax receipt</b>
          <p>Donations to {V_NAME} receive an official donation receipt for income tax purposes, which you can use to claim a charitable tax credit with the CRA. Registered Canadian charity, BN {BN}.</p>
          <a href="#receipt">Request your tax receipt →</a>
        </div>
      </div>
      <div class="give">
        <h3>Ways to give</h3>
        <div class="online">
          <b>Donate online</b>
          <small>Card payment through Dawat-e-Islami Canada's secure donation page.</small>
          <a class="btn btn-green wide" href="https://payments.madinaapps.com/Dawat-e-Islami-Canada/e8eabaf5-6961-11ed-8091-0a5309febefe" target="_blank" rel="noopener">General donation</a>
          <div class="online-two">
            <a class="btn btn-line-green" href="https://payments.madinaapps.com/Dawat-e-Islami-Canada/e8ed2c7e-6961-11ed-8091-0a5309febefe" target="_blank" rel="noopener">Zakat</a>
            <a class="btn btn-line-green" href="https://payments.madinaapps.com/Dawat-e-Islami-Canada/e8ed2ef2-6961-11ed-8091-0a5309febefe" target="_blank" rel="noopener">Fitra</a>
          </div>
        </div>
        <div class="etransfer">
          <b>Interac e-Transfer</b>
          <small>Please send to the right email for each type of giving.</small>
          <ul class="et-list">
            <li><b>Zakat</b><span class="em">Zakat2dawat@gmail.com</span><button type="button" class="copy" data-copy="Zakat2dawat@gmail.com" aria-label="Copy the Zakat e-Transfer email">Copy</button></li>
            <li><b>Sadaqah</b><span class="em">FMsurrey@gmail.com</span><button type="button" class="copy" data-copy="FMsurrey@gmail.com" aria-label="Copy the Sadaqah e-Transfer email">Copy</button></li>
            <li><b>Fitra</b><span class="em">Fitra2dawat@gmail.com</span><button type="button" class="copy" data-copy="Fitra2dawat@gmail.com" aria-label="Copy the Fitra e-Transfer email">Copy</button></li>
            <li><b>Mortgage payment donation</b><span class="em">Surrey@dawateislamicanada.net</span><button type="button" class="copy" data-copy="Surrey@dawateislamicanada.net" aria-label="Copy the Mortgage payment donation e-Transfer email">Copy</button></li>
            <li><b>Qarz-e-Hasna contribution</b><span class="em">Surrey@dawateislamicanada.net</span><button type="button" class="copy" data-copy="Surrey@dawateislamicanada.net" aria-label="Copy the Qarz-e-Hasna contribution e-Transfer email">Copy</button></li>
          </ul>
          <small>For a tax receipt, include your full name and mailing address in the message.</small>
        </div>
        <div class="etransfer">
          <b>In person</b>
          <span>At the masjid after any prayer</span>
        </div>
      </div>
    </div>

    <div class="wrap receipt" id="receipt">
      <div class="receipt-intro">
        <div class="head left">
          <p class="kicker">After you donate</p>
          <h2>Request a tax receipt</h2>
          <div class="ornament" aria-hidden="true">✦</div>
        </div>
        <p>Fill in this form after making your donation. Our team will match it to your payment and send your official donation receipt by email.</p>
        <ul class="facts">
          <li><b>Why the address?</b><span>The CRA requires the donor's name and address on every official receipt.</span></li>
          <li><b>Privacy</b><span>Your details are used only to issue your receipt and contact you about it. They are never shared.</span></li>
        </ul>
      </div>
      <form class="rform" id="receiptForm" novalidate data-endpoint="{FORMS_ENDPOINT}">
        <input type="hidden" name="form" value="receipt">
        <fieldset class="field">
          <legend>The receipt is for <span class="req">*</span></legend>
          <div class="choice">
            <label><input type="radio" name="donor_type" id="dt_ind" value="Individual" required> An individual</label>
            <label><input type="radio" name="donor_type" id="dt_bus" value="Business"> A business</label>
          </div>
        </fieldset>
        <div class="field">
          <label for="r_name" id="r_name_label">Full name <span class="req">*</span></label>
          <input id="r_name" name="name" type="text" autocomplete="name" required>
        </div>
        <div class="field">
          <label for="r_address">Mailing address <span class="req">*</span></label>
          <textarea id="r_address" name="address" rows="2" autocomplete="street-address" placeholder="Street, city, province, postal code" required></textarea>
        </div>
        <div class="two">
          <div class="field">
            <label for="r_amount">Donation amount (CAD) <span class="req">*</span></label>
            <div class="money"><span>$</span><input id="r_amount" name="amount" type="number" inputmode="decimal" min="1" step="0.01" required></div>
          </div>
          <div class="field">
            <label for="r_date">Donation date <span class="req">*</span></label>
            <input id="r_date" name="date" type="date" required>
          </div>
        </div>
        <div class="two">
          <div class="field">
            <label for="r_type">Type of donation <span class="req">*</span></label>
            <select id="r_type" name="donation_type" required>
              <option value="">Choose one</option>
              <option>Sadaqah</option>
              <option>Zakat</option>
              <option>General donation</option>
              <option>Fitrana</option>
            </select>
          </div>
          <div class="field">
            <label for="r_method">How did you donate?</label>
            <select id="r_method" name="method">
              <option value="">Choose one</option>
              <option>Interac e-Transfer</option>
              <option>Online (card)</option>
              <option>Cash or cheque at the masjid</option>
            </select>
          </div>
        </div>
        <div class="two">
          <div class="field">
            <label for="r_email">Email <span class="req">*</span></label>
            <input id="r_email" name="email" type="email" autocomplete="email" required>
          </div>
          <div class="field">
            <label for="r_phone">Phone number <span class="req">*</span></label>
            <input id="r_phone" name="phone" type="tel" autocomplete="tel" placeholder="604 555 0123" required>
          </div>
        </div>
        <div class="hp" aria-hidden="true"><label for="r_web">Leave this empty</label><input id="r_web" name="website" type="text" tabindex="-1" autocomplete="off"></div>
        <label class="consent"><input type="checkbox" id="r_ok" name="consent" value="yes" required> I confirm these details are correct and agree to be contacted about my receipt. <span class="req">*</span></label>
        <p class="ferr" id="r_err" role="alert"></p>
        <button class="btn btn-green" type="submit" id="r_submit">Send receipt request</button>
        <div class="fdone" id="r_done" hidden>
          <b>JazakAllah khair. Your request has been sent.</b>
          <p>We'll email your official donation receipt once your donation is matched. Questions? Call <a href="tel:{V_TEL}">{V_PHONE}</a>.</p>
        </div>
      </form>
    </div>
  </section>

  <section class="block" id="about">
    <div class="wrap about">
      <div>
        <div class="head left">
          <p class="kicker">About us</p>
          <h2>Part of the global family of Dawat-e-Islami</h2>
          <div class="ornament" aria-hidden="true">✦</div>
        </div>
        <p>Dawat-e-Islami was founded in 1981 in Karachi by Ameer-e-Ahl-e-Sunnat, Maulana Muhammad Ilyas Attar Qadri. Today it serves communities around the world through Qur'an education, Islamic scholarship and welfare work.</p>
        <p>{V_NAME} is Dawat-e-Islami's centre for the Vancouver area, one of several Faizan e Madina centres across Canada.</p>
        <p>{tbc("Add: a few lines about the centre's history in Surrey")}</p>
      </div>
      <div class="photo-slot">
        <div><strong>Photo</strong><span>The masjid, to be added</span></div>
      </div>
    </div>
  </section>

  <section class="block tint" id="visit">
    <div class="wrap visit">
      <div>
        <div class="head left">
          <p class="kicker">Visit us</p>
          <h2>Find {V_NAME}</h2>
          <div class="ornament" aria-hidden="true">✦</div>
        </div>
        <ul>
          <li><b>Address</b><span>{V_ADDRESS}</span></li>
          <li><b>Open</b><span>Daily for all five prayers</span></li>
          <li><b>Jummah</b><span>{JUMMAH}</span></li>
          <li><b>Phone</b><span><a href="tel:{V_TEL}">{V_PHONE}</a></span></li>
          <li><b>Parking</b><span>{tbc()}</span></li>
        </ul>
        <a class="btn btn-green" href="https://www.google.com/maps/search/?api=1&amp;query={V_MAP_Q}" target="_blank" rel="noopener">Get directions</a>
      </div>
      <div class="map-slot">
        <iframe title="Map of {V_NAME}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q={V_MAP_Q}&amp;output=embed"></iframe>
      </div>
    </div>
  </section>
</main>
'''

PT_MAIN = (ROOT / "partials/prayer-main.html").read_text()

EVENTS_MAIN = f'''<main>
  <section class="page-head">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> <span>›</span> <span aria-current="page">Events</span></nav>
      <h1>Events</h1>
      <p>Upcoming programs and gatherings at {V_NAME}</p>
    </div>
  </section>
  <div class="wrap pt-main">
    <div class="events-grid" id="eventsGrid"></div>
    <p class="muted centres-note">Every Thursday at 7:00 PM: <a href="index.html#ijtima">Weekly Ijtima</a>, open to everyone.</p>
  </div>
</main>
'''

pages = {
    "index.html": (head(f"{V_NAME} | Dawat-e-Islami",
                        f"Prayer times, Jummah, weekly Ijtima, Qur'an classes and donations at {V_NAME}, 7062 134 Street, Surrey, BC.")
                   + header("home") + HOME),
    "prayer-times.html": (head(f"Prayer times | {V_NAME}",
                               f"Monthly prayer and jama'at times for {V_NAME} in Surrey, BC (Hanafi).", "prayer-times.html")
                          + header("prayer") + PT_MAIN),
    "events.html": (head(f"Events | {V_NAME}",
                         f"Upcoming events, programs and gatherings at {V_NAME} in Surrey, BC.", "events.html")
                    + header("events") + EVENTS_MAIN),
}
for name, html in pages.items():
    (ROOT / name).write_text(html + FOOTER)
print("built", ", ".join(pages))
