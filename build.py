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
# Site theme: "jamia" (green and gold, light) or "midnight" (Midnight Emerald, dark)
THEME = "jamia"
BN = "81933 5662 RR0001"
SITE_URL = "https://dawateislamivancouver.ca/"
V_NAME = "Faizan e Madina Vancouver"
V_ADDRESS = "7062 134 St, Surrey, BC V3W 4T2"
V_PHONE = "+1 (778) 895-0886"
V_TEL = "+17788950886"
V_MAP_Q = "Faizan+e+Madina,+7062+134+Street,+Surrey,+BC"
JUMMAH = "1:30 PM &amp; 3:30 PM"
# Tax receipt requests: the website's own form sends each answer into this Google Form,
# so responses appear in the Google Form (and its linked Sheet).
# Each number below is the Google Form's hidden code ("entry.NNNN") for that question.
# Get them from the form's "Get pre-filled link". Leave blank until known.
RECEIPT_GFORM = {
    "action": "https://docs.google.com/forms/d/e/1FAIpQLSeyMq8F7tD-UI_5P_UQ153uFTJESVN32fA95x0SDvJC6Gqm5g/formResponse",
    "email": "1490416767",          # Email (use "emailAddress" if the form collects emails automatically)
    "donor_type": "949598613",     # The receipt is for
    "name": "1021019779",           # Full name or business name
    "address": "1277793556",        # Mailing address
    "phone": "388973368",          # Phone number
    "amount": "1150079326",         # Donation amount (CAD)
    "date": "755839555",           # Donation date
    "donation_type": "1512475851",  # Type of donation
    "notes": "886799132",          # Notes
    "consent": "977493498",        # Confirmation
}
# The exact answer wording used in the Google Form (must match letter for letter)
RECEIPT_GFORM_TEXT = {
    "Individual": "An individual",
    "Business": "A business",
    "consent": "I confirm these details are correct and agree to be contacted about my receipt.",
}
RECEIPT_GFORM_JSON = __import__("html").escape(__import__("json").dumps({"f": RECEIPT_GFORM, "t": RECEIPT_GFORM_TEXT}, ensure_ascii=False), quote=True)

# Website forms (Dua-e-Maghfirah, tutoring): paste the Google Apps Script web app URL
# here (see google-apps-script/masjid-forms.gs), then run python3 build.py.
FORMS_ENDPOINT = ""

# Cache-busting: browsers re-download CSS/JS whenever their contents change
V = hashlib.md5(b"".join((ROOT / f).read_bytes() for f in ["assets/style.css", "assets/main.js", "assets/prayer-data.js", "assets/events.js", "assets/past-events.js", "assets/mortgage.js", "assets/tutoring.js", "assets/volunteer.js", "assets/theme-midnight.css"])).hexdigest()[:8]


def tbc(label="TBC"):
    return f'<span class="draft">{label}</span>'


THEME_CSS = f'\n<link rel="stylesheet" href="assets/theme-midnight.css?v={V}">' if THEME == "midnight" else ""
THEME_COLOR = "#0e1412" if THEME == "midnight" else "#0a3d34"
HEADER_LOGO = "logo-vancouver-white.png" if THEME == "midnight" else "logo-vancouver.png"


def head(title, desc, path=""):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="{THEME_COLOR}">
<meta name="description" content="{desc}">
<title>{title}</title>
<link rel="canonical" href="{SITE_URL}{path}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{SITE_URL}{path}">
<meta property="og:type" content="website">
<link rel="icon" type="image/png" href="assets/img/favicon.png"><link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Figtree:wght@400;500;600;700&family=Libre+Baskerville:ital@0;1&family=Sora:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css?v={V}">{THEME_CSS}
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
    <span class="tb-date" id="tbDate"></span>
    <span class="arabic bismillah" lang="ar">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</span>
    <a class="next" id="nextPrayer" href="prayer-times.html" aria-live="polite"></a>
  </div>
</div>
<header class="site-header">
  <div class="wrap">
    <a class="logo" href="index.html"><img src="assets/img/{HEADER_LOGO}" width="900" height="242" alt="Dawat-e-Islami Vancouver"></a>
    <button class="menu-toggle" aria-expanded="false" aria-controls="nav">Menu</button>
    <nav class="nav" id="nav" aria-label="Main">
      {link("prayer-times.html", "Prayer times", "prayer")}
      {link("events.html", "Events", "events")}
      {link("tutoring.html", "Free tutoring", "tutoring")}
      {link("volunteer.html", "Volunteer", "volunteer")}
      {link("index.html#ijtima", "Weekly Ijtima", None)}
      {link("index.html#services", "Services", None)}
      {link("index.html#visit", "Visit us", None)}
      <a class="btn btn-gold" href="donate.html">Donate now</a>
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
          <li><a href="tutoring.html">Free tutoring (Grades 2–8)</a></li>
          <li><a href="volunteer.html">Volunteer with us</a></li>
          <li><a href="past-events.html">Past events</a></li>
          <li><a href="donate.html">Donate</a></li>
        </ul>
      </div>
      <div>
        <h4>Dawat-e-Islami</h4>
        <ul>
          <li>Dawat-e-Islami Canada {tbc("website coming soon")}</li>
          <li><a href="https://www.dawateislami.net/" target="_blank" rel="noopener">Global website</a></li>
          <li><a href="https://www.dawateislamiusa.org/" target="_blank" rel="noopener">Dawat-e-Islami USA</a></li>
          <li><a href="https://www.fatwaqa.com/en" target="_blank" rel="noopener">Ask a question (Darul Ifta)</a></li>
          <li><a href="https://fgrf.org/" target="_blank" rel="noopener">FGRF: Faizan Global Relief Foundation</a></li>
        </ul>
        <h4 class="follow">Follow us</h4>
        <ul class="social">
          <li><a class="soc soc-ig" href="https://www.instagram.com/dawateislamivancouver/" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram"><span class="soc-ic"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg></span></a></li>
          <li><a class="soc soc-fb" href="https://www.facebook.com/DawateislamiinVancouver/" target="_blank" rel="noopener" aria-label="Facebook" title="Facebook"><span class="soc-ic"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg></span></a></li>
          <li><a class="soc soc-tt" href="https://www.tiktok.com/@maulana.abid.canada" target="_blank" rel="noopener" aria-label="TikTok, Maulana Abid" title="TikTok, Maulana Abid"><span class="soc-ic"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></span></a></li>
          <li><a class="soc soc-yt" href="https://www.youtube.com/@DawateIslamiEnglish" target="_blank" rel="noopener" aria-label="YouTube, Dawat-e-Islami English" title="YouTube, Dawat-e-Islami English"><span class="soc-ic"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></span></a></li>
        </ul>
        <p class="soc-note">YouTube: Dawat-e-Islami English · TikTok: Maulana Abid</p>
      </div>
    </div>
    <div class="legal">
      <span>© <span id="year">2026</span> {V_NAME} · Dawat-e-Islami Canada</span>
      <span>Draft preview for management review</span>
    </div>
  </div>
</footer>
<nav class="mbar" aria-label="Quick actions">
  <a href="prayer-times.html"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>Prayer times</span></a>
  <a href="tel:{V_TEL}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg><span>Call</span></a>
  <a href="https://www.google.com/maps/search/?api=1&amp;query={V_MAP_Q}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg><span>Directions</span></a>
  <a class="mbar-don" href="donate.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg><span>Donate</span></a>
</nav>
<script src="assets/prayer-data.js?v={V}"></script>
<script src="assets/events.js?v={V}"></script>
<script src="assets/past-events.js?v={V}"></script>
<script src="assets/mortgage.js?v={V}"></script>
<script src="assets/tutoring.js?v={V}"></script>
<script src="assets/volunteer.js?v={V}"></script>
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
    "relief": '<path d="M12 21s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 16.4 12 21 12 21z"/><path d="M12 11v5M9.5 13.5h5"/>',
    "tutoring": '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6"/>',
    "online": '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4M10 9l5 2-5 2z"/>',
}


def svg(name):
    return f'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">{ICON[name]}</svg>'


def card(icon, title, text, href=None, cta=None, ext=False):
    if href:
        tgt = ' target="_blank" rel="noopener"' if ext else ''
        cls = " program-wide" if icon == "relief" else ""
        return f'''        <a class="program{cls}" href="{href}"{tgt}>
          <div class="ic" aria-hidden="true">{svg(icon)}</div>
          <h3>{title}</h3>
          <p>{text}</p>
          <span class="when">{cta} →</span>
        </a>'''
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
    card("online", "Faizan Online Academy", "Live online classes you can join from home.", "https://faizanonline.net/", "Visit Faizan Online Academy", True),
    card("tutoring", "Free Tutoring", "Free homework help for students in Grades 2 to 8, at the Islamic Centre or online.", "tutoring.html", "Learn more and register"),
    card("relief", "FGRF Global Relief", "Faizan Global Relief Foundation, Dawat-e-Islami's relief work around the world, including humanitarian aid in Palestine.", "https://fgrf.org/", "Visit FGRF", True),
])

IJTIMA_PARTS = "".join(f"<li>{p}</li>" for p in ["Tilawat", "Naat", "Bayan", "Zikr", "Dua", "Salam"])

TODAY_CARD = f'''      <aside class="today" aria-labelledby="todayTitle">
        <div class="today-head">
          <h2 id="todayTitle">Today's prayers</h2>
          <span class="today-date" id="todayDate"></span>
        </div>
        <div class="today-cols"><span>Salat</span><span>Adhan</span><span>Iqamah</span></div>
        <ul class="today-list" id="todayList"></ul>
        <div class="today-foot">
          <span class="jm-pill">Jummah <b>1:30 PM</b> &amp; <b>3:30 PM</b></span>
          <a href="prayer-times.html">Full timetable</a>
        </div>
      </aside>'''

CANADA_MAP = (ROOT / "partials/canada-map.svg").read_text()
CANADA_MAP_PHONE = (ROOT / "partials/canada-map-phone.svg").read_text()
NA_MAP = (ROOT / "partials/na-map.svg").read_text()
NA_MAP_PHONE = (ROOT / "partials/na-map-phone.svg").read_text()
WORLD_MAP = (ROOT / "partials/world-map.svg").read_text()
WORLD_MAP_PHONE = (ROOT / "partials/world-map-phone.svg").read_text()

HOME = f'''<main id="top">
  <section class="hero">
    <div class="wrap">
      <div>
        <p class="arabic" lang="ar">اَلسَّلَامُ عَلَيْكُمْ</p>
        <h1>Welcome to {V_NAME}</h1>
        <p class="tagline">Dawat-e-Islami · Surrey, BC</p>
        <p class="lead">Our Islamic Centre serves the Lower Mainland with the five daily prayers, two Jummah congregations, a weekly Ijtima and Qur'an classes for all ages.</p>
        <div class="actions">
          <a class="btn btn-gold" href="donate.html">Donate now</a>
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
      <p class="en">"I must strive to reform myself and the people of the entire world, <span class="ar-inline" lang="ar" dir="rtl">ان شاءالله عزوجل</span>"</p>
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
        <div><strong>Photo</strong><span>Weekly Ijtima at the Islamic Centre, to be added</span></div>
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
            <li>Only <b>3 names are read each Thursday</b>. Once 3 names are in, that Thursday is full. First come, first served.</li>
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
          <p id="m_done_txt">They will be included in the collective dua at the Weekly Ijtima, <span class="ar-inline" lang="ar" dir="rtl">ان شاءالله عزوجل</span></p>
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
          <li><b>Contact</b><span>Principal: <a href="tel:+12365162065">(236) 516-2065</a><br>Islamic Centre: <a href="tel:{V_TEL}">{V_PHONE}</a></span></li>
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
        <img src="assets/events/weekend-school.jpg" width="1080" height="1350" loading="lazy" alt="Faizan Weekend Islamic School flyer: every Sunday 11 AM to 1 PM, ages 6 to 12, $50 per month">
      </a>
    </div>
    <div class="wrap student-work" id="student-work">
      <div class="sw-head">
        <p class="eyebrow">From our classrooms</p>
        <h3>What our students have been making</h3>
      </div>
      <div class="sw-grid">
        <figure class="sw-card">
          <a href="assets/student-work/four-books.jpg" target="_blank" rel="noopener"><img src="assets/student-work/four-books.jpg" width="1400" height="600" loading="lazy" alt="Four scroll puppets made by students, coloured in crayon, for the Quran, Injeel, Zaboor and Tawrat"></a>
          <figcaption>
            <span class="tag">Islamic studies</span>
            <b>The four revealed books</b>
            <span>Students made scroll puppets for the Tawrāt, Zaboor, Injeel and Quran, and matched each book to the Prophet it was revealed to.</span>
          </figcaption>
        </figure>
        <figure class="sw-card">
          <a href="assets/student-work/healthy-teeth.jpg" target="_blank" rel="noopener"><img src="assets/student-work/healthy-teeth.jpg" width="980" height="920" loading="lazy" alt="A student's worksheet sorting foods into ones that keep teeth healthy and ones that can hurt them"></a>
          <figcaption>
            <span class="tag">Health and cleanliness</span>
            <b>Caring for our teeth</b>
            <span>A cut-and-sort activity on foods that keep our teeth healthy and foods that can harm them.</span>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="block" id="services">
    <div class="wrap">
      <div class="head">
        <p class="kicker">At our Islamic Centre</p>
        <h2>Our services to the community</h2>
        <div class="ornament" aria-hidden="true">✦</div>
      </div>
      <div class="programs">
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
    <div class="wrap donate-teaser">
      <div>
        <p class="kicker">Support us</p>
        <h2>Your donation keeps our Islamic Centre going</h2>
        <p>Give Sadaqah, Zakat or Fitra online or by Interac e-Transfer, or sponsor a scholar's education. Every donation receives an official tax receipt.</p>
      </div>
      <div class="teaser-actions">
        <a class="btn btn-gold" href="donate.html">Donate now</a>
        <a class="btn btn-line-green" href="tax-receipt.html">Request a tax receipt</a>
      </div>
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
        <div><strong>Photo</strong><span>The Islamic Centre, to be added</span></div>
      </div>
    </div>
    <div class="wrap global">
      <div class="cm-head">
        <h3 id="cmHeading">Dawat-e-Islami across Canada</h3>
        <div class="cm-tabs" role="tablist" aria-label="Choose a map">
          <button type="button" role="tab" id="tab-ca" aria-controls="map-ca" aria-selected="true" class="is-on" data-map="ca" data-title="Dawat-e-Islami across Canada">Canada</button>
          <button type="button" role="tab" id="tab-na" aria-controls="map-na" aria-selected="false" tabindex="-1" data-map="na" data-title="Dawat-e-Islami across North America">North America</button>
          <button type="button" role="tab" id="tab-wd" aria-controls="map-wd" aria-selected="false" tabindex="-1" data-map="wd" data-title="From Vancouver to the Global Madani Markaz">World</button>
        </div>
      </div>
      <div class="wm-filters" role="group" aria-label="Show on the map">
        <button type="button" class="is-on" data-filter="all" aria-pressed="true">All</button>
        <button type="button" data-filter="centre" aria-pressed="false">Islamic Centres</button>
        <button type="button" data-filter="education" aria-pressed="false">Jamia &amp; School</button>
      </div>
      <div class="wm-frame cm-frame" id="map-ca" role="tabpanel" aria-labelledby="tab-ca">
        {CANADA_MAP}
        {CANADA_MAP_PHONE}
      </div>
      <div class="wm-frame cm-frame" id="map-na" role="tabpanel" aria-labelledby="tab-na" hidden>
        {NA_MAP}
        {NA_MAP_PHONE}
      </div>
      <div class="wm-frame cm-frame cm-world" id="map-wd" role="tabpanel" aria-labelledby="tab-wd" hidden>
        {WORLD_MAP}
        {WORLD_MAP_PHONE}
      </div>
      <aside class="dum-card" aria-labelledby="dumTitle">
        <span class="dum-ic" aria-hidden="true"><svg viewBox="-11 -11 22 22"><path d="M0 -3.5C-2.2 -5 -5 -5.2 -7.5 -4.4V5C-5 4.2 -2.2 4.4 0 5.9C2.2 4.4 5 4.2 7.5 5V-4.4C5 -5.2 2.2 -5 0 -3.5Z"/><path d="M0 -3.5V5.9" class="sp"/></svg></span>
        <div>
          <p class="dum-kicker">One of a kind in North America</p>
          <h4 id="dumTitle">Dar-ul-Madinah, Sacramento</h4>
          <p>A full-time Islamic elementary school for boys and girls, from Kindergarten to Grade 5. Children follow the regular school curriculum together with Qur'an and Islamic studies, in an Islamic environment.</p>
          <button type="button" class="dum-show" data-pick="Dar-ul-Madinah Sacramento">Show on map →</button>
        </div>
      </aside>
      <ul class="wm-legend" aria-label="Map key">
        <li><span class="k k-home" aria-hidden="true"></span>Faizan e Madina Vancouver (that's us)</li>
        <li><span class="k k-canada" aria-hidden="true"></span>Islamic Centres</li>
        <li class="k-school-li"><span class="k k-school" aria-hidden="true"><svg viewBox="-11 -11 22 22" width="20" height="20"><circle r="10.5" class="cm-school-bg"/><path d="M0 -3.5C-2.2 -5 -5 -5.2 -7.5 -4.4V5C-5 4.2 -2.2 4.4 0 5.9C2.2 4.4 5 4.2 7.5 5V-4.4C5 -5.2 2.2 -5 0 -3.5Z" class="cm-book"/></svg></span>Dar-ul-Madinah (Islamic elementary school)</li>
        <li class="k-hq-li"><span class="k k-hq" aria-hidden="true">★</span>Global headquarters, Karachi</li>
        <li class="k-glow-li"><span class="k k-glow" aria-hidden="true"></span>Places with Dawat-e-Islami centres (tap a dot for details)</li>
        <li><span class="k k-uni" aria-hidden="true"><svg viewBox="-11 -11 22 22" width="18" height="18"><circle r="11" class="cm-uni-bg"/><path d="M-6.5 -1.2 0 -4.6 6.5 -1.2 0 2.2z" class="cm-cap"/><path d="M-3.8 0.4v2.6c1.2 1.3 6.4 1.3 7.6 0v-2.6" class="cm-cap2"/><path d="M5.6 -0.8v3.6" class="cm-cap2"/></svg></span>Jamia-tul-Madinah (Islamic university)</li>
      </ul>
      <div class="wm-detail-row">
        <div class="wm-detail" id="wmDetail" aria-live="polite">
          <p class="wm-detail-k">Selected location</p>
          <h3 id="wmName">Faizan e Madina Vancouver</h3>
          <p class="wm-place" id="wmPlace">7062 134 St, Surrey, BC</p>
          <p id="wmInfo">Our Islamic Centre, serving the Vancouver area.</p>
          <p class="wm-src" id="wmSrc" hidden><a id="wmSrcLink" href="#" target="_blank" rel="noopener">Source</a></p>
        </div>
        <div class="wm-list">
          <p class="wm-detail-k">Featured locations</p>
          <button type="button" data-name="Global Madani Markaz, Faizan-e-Madina" data-place="Karachi, Pakistan" data-info="Dawat-e-Islami's global headquarters, on Main University Road, Karachi. Dawat-e-Islami was founded here in 1981." data-src="https://www.dawateislami.net/pk/about-us"><b>Global Madni Markaz</b><span>Karachi, Pakistan · Global headquarters</span></button>
          <button type="button" data-pick="Faizan e Madina Vancouver"><b>Faizan-e-Madina Vancouver</b><span>British Columbia</span></button>
          <button type="button" data-pick="Faizan-e-Madina Calgary"><b>Faizan-e-Madina Calgary</b><span>Alberta</span></button>
          <button type="button" data-pick="Faizan-e-Madina Hamilton"><b>Faizan-e-Madina Hamilton</b><span>Ontario</span></button>
          <button type="button" data-pick="Faizan-e-Madina Montréal"><b>Faizan-e-Madina Montréal</b><span>Quebec</span></button>
          <button type="button" data-pick="Jamia-tul-Madinah Montréal"><b>Jamia-tul-Madinah Montréal</b><span>Quebec</span></button>
        </div>
      </div>
      <ul class="wm-stats">
        <li><b>1981</b><span>Founded in Karachi</span></li>
        <li><b>1,500+</b><span>Jamia-tul-Madina branches worldwide</span></li>
        <li><b>11</b><span>Islamic Centres across Canada</span></li>
        <li><b>2</b><span>Jamia-tul-Madinah campuses in Canada</span></li>
      </ul>
      <p class="wm-note">Tap any symbol on the map, or a featured location, to see its details. Switch between Canada, North America and the world with the tabs above the map.</p>
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

DONATE_MAIN = f'''<main>
  <section class="page-head">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> <span>›</span> <span aria-current="page">Donate</span></nav>
      <h1>Donate</h1>
      <p>Support {V_NAME} · Registered Canadian charity, BN {BN}</p>
    </div>
  </section>

  <section class="block" id="donate">
    <div class="wrap donate">
      <div>
        <div class="head left">
          <p class="kicker">Why give</p>
          <h2>Your donation keeps our Islamic Centre going</h2>
          <div class="ornament" aria-hidden="true">✦</div>
        </div>
        <p>Donations support {V_NAME}: the Islamic Centre, Qur'an classes, the weekend school and community programs. Zakat, Sadaqah and Fitra are all accepted, along with sponsorship of scholars' education, as are donations toward the Islamic Centre's mortgage and Qarz-e-Hasna contributions.</p>
        <p class="hadith">"Charity does not decrease wealth." <span>Sahih Muslim, 2588</span></p>
        <div class="taxnote">
          <b>Every donation receives an official tax receipt</b>
          <p>Donations to {V_NAME} receive an official donation receipt for income tax purposes, which you can use to claim a charitable tax credit with the CRA. Registered Canadian charity, BN {BN}.</p>
          <a href="tax-receipt.html">Request your tax receipt →</a>
        </div>
      </div>
      <div class="give">
        <h3>Ways to give</h3>
        <div class="online">
          <b>Donate online</b>
          <small>Card payment through Dawat-e-Islami Canada's secure donation page.</small>
          <a class="btn btn-green wide" href="https://payments.madinaapps.com/Dawat-e-Islami-Canada/e8eabaf5-6961-11ed-8091-0a5309febefe" target="_blank" rel="noopener">Sadaqah – General donation</a>
          <div class="online-two">
            <a class="btn btn-line-green" href="https://payments.madinaapps.com/Dawat-e-Islami-Canada/e8ed2c7e-6961-11ed-8091-0a5309febefe" target="_blank" rel="noopener">Zakat</a>
            <a class="btn btn-line-green" href="https://payments.madinaapps.com/Dawat-e-Islami-Canada/e8ed2ef2-6961-11ed-8091-0a5309febefe" target="_blank" rel="noopener">Fitra</a>
          </div>
          <a class="btn btn-line-green wide scholar" href="https://payments.madinaapps.com/Dawat-e-Islami-Canada/e8e9ac55-6961-11ed-8091-0a5309febefe" target="_blank" rel="noopener">Sponsor a Scholar's Education</a>
          <small>Supports the education of Islamic scholars in Canada.</small>
        </div>
        <div class="etransfer">
          <b>Interac e-Transfer</b>
          <small>Please send to the right email for each type of giving.</small>
          <ul class="et-list">
            <li><b>Zakat</b><span class="em">Zakat2dawat@gmail.com</span><button type="button" class="copy" data-copy="Zakat2dawat@gmail.com" aria-label="Copy the Zakat e-Transfer email">Copy</button></li>
            <li><b>Sadaqah – General donation</b><span class="em">FMsurrey@gmail.com</span><button type="button" class="copy" data-copy="FMsurrey@gmail.com" aria-label="Copy the Sadaqah e-Transfer email">Copy</button></li>
            <li><b>Fitra</b><span class="em">Fitra2dawat@gmail.com</span><button type="button" class="copy" data-copy="Fitra2dawat@gmail.com" aria-label="Copy the Fitra e-Transfer email">Copy</button></li>
            <li><b>Mortgage payment donation</b><span class="em">Surrey@dawateislamicanada.net</span><button type="button" class="copy" data-copy="Surrey@dawateislamicanada.net" aria-label="Copy the Mortgage payment donation e-Transfer email">Copy</button></li>
            <li><b>Qarz-e-Hasna contribution</b><span class="em">Surrey@dawateislamicanada.net</span><button type="button" class="copy" data-copy="Surrey@dawateislamicanada.net" aria-label="Copy the Qarz-e-Hasna contribution e-Transfer email">Copy</button></li>
          </ul>
          <small>For a tax receipt, include your full name and mailing address in the message.</small>
        </div>
        <div class="etransfer">
          <b>In person</b>
          <span>At the Islamic Centre after any prayer</span>
        </div>
      </div>
    </div>

    <div class="wrap debtfree" id="debt-free">
      <div class="head">
        <p class="kicker">Help us become debt-free</p>
        <h2>Paying off the Islamic Centre's mortgage</h2>
        <div class="ornament" aria-hidden="true">✦</div>
        <p>Our Islamic Centre was bought with a bank mortgage, and every month part of our payment goes to interest. Every dollar paid off, and every dollar lent to us interest-free, brings us closer to being free of interest.</p>
      </div>
      <p class="example-flag" id="mgExample" hidden>Example figures only. The real mortgage numbers will be added soon.</p>
      <div class="debt-grid">
        <section class="debtcard" aria-labelledby="debtTitle">
          <h3 id="debtTitle">Our mortgage so far</h3>
          <p class="debt-pct"><b id="mgPct">–</b> paid off</p>
          <div class="debtbar" role="img" id="mgBar" aria-label="Mortgage progress">
            <span class="paid" id="mgBarPaid"></span>
          </div>
          <div class="debtbar-labels"><span>Paid off</span><span>Still owed to the bank</span></div>
          <ul class="debt-figs">
            <li class="f-paid"><span>Paid off</span><b id="mgPaid">–</b></li>
            <li class="f-owed"><span>Still owed</span><b id="mgOwed">–</b></li>
            <li><span>Total borrowed</span><b id="mgTotal">–</b></li>
            <li><span>Interest rate</span><b id="mgRate">–</b></li>
          </ul>
          <p class="debt-cost">At this rate, the remaining balance costs about <b id="mgYearly">–</b> in interest every year, or about <b id="mgMonthly">–</b> a month.</p>
          <p class="debt-asof" id="mgAsOf"></p>
        </section>
        <section class="qarzcard" aria-labelledby="qarzTitle">
          <h3 id="qarzTitle">Qarz-e-Hasna calculator</h3>
          <p>Qarz-e-Hasna is an interest-free loan to the Islamic Centre that is paid back to you. Each dollar you lend replaces a dollar of bank loan, so we stop paying interest on it.</p>
          <p class="qarz-legal"><b>Fully documented and official.</b> Every Qarz-e-Hasna loan is recorded in a written, notarized loan agreement signed by both sides. It's not just a handshake: it's a legally binding document that can be enforced in court.</p>
          <label for="qAmount" class="q-label">How much could you lend?</label>
          <div class="money q-money"><span>$</span><input id="qAmount" type="number" inputmode="numeric" min="0" step="100" value="5000"></div>
          <div class="q-quick" role="group" aria-label="Quick amounts">
            <button type="button" data-amt="1000">$1,000</button><button type="button" data-amt="5000">$5,000</button><button type="button" data-amt="10000">$10,000</button><button type="button" data-amt="25000">$25,000</button>
          </div>
          <div class="q-result" aria-live="polite">
            <p class="q-big">Your <b id="qLend">$5,000</b> loan saves about <b id="qYear">–</b> in interest per year</p>
            <ul class="q-more">
              <li><b id="qMonth">–</b><span>saved each month</span></li>
              <li><b id="qFive">–</b><span>saved over 5 years</span></li>
            </ul>
            <p class="q-note" id="qNote"></p>
          </div>
          <div class="q-cta">
            <p><b>Ready to lend?</b> Send by Interac e-Transfer to <span class="em">Surrey@dawateislamicanada.net</span> with "Qarz-e-Hasna" in the message, or call <a href="tel:{V_TEL}">{V_PHONE}</a> to arrange repayment terms.</p>
            <button type="button" class="copy" data-copy="Surrey@dawateislamicanada.net">Copy email</button>
          </div>
          <p class="q-fine">Savings are an estimate using the bank's yearly interest rate on the amount lent, without compounding. Actual savings depend on the mortgage terms.</p>
        </section>
      </div>
    </div>

    <div class="wrap"><div class="receipt-cta">
      <div>
        <p class="kicker">After you donate</p>
        <h3>Request your official tax receipt</h3>
        <p>Tell us about your donation and we'll email your receipt once it's matched to your payment.</p>
      </div>
      <a class="btn btn-green" href="tax-receipt.html">Request a tax receipt →</a>
    </div></div>
  </section>

</main>
'''

RECEIPT_MAIN = f'''<main>
  <section class="page-head">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> <span>›</span> <a href="donate.html">Donate</a> <span>›</span> <span aria-current="page">Tax receipt</span></nav>
      <h1>Request a tax receipt</h1>
      <p>Official donation receipts for income tax purposes · Registered Canadian charity, BN {BN}</p>
    </div>
  </section>
    <div class="wrap receipt receipt-page" id="receipt">
      <div class="receipt-intro">
        <div class="head left">
          <p class="kicker">After you donate</p>
          <h2>How it works</h2>
          <div class="ornament" aria-hidden="true">✦</div>
        </div>
        <p>Fill in this form after making your donation. Our team will match it to your payment and send your official donation receipt by email.</p>
        <ul class="facts">
          <li><b>Why the address?</b><span>The CRA requires the donor's name and address on every official receipt.</span></li>
          <li><b>Privacy</b><span>Your details are used only to issue your receipt and contact you about it. They are never shared.</span></li>
        </ul>
      </div>
      <form class="rform" id="receiptForm" novalidate data-gform="{RECEIPT_GFORM_JSON}">
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
              <option value="Sadaqah – General Donation">Sadaqah – General donation</option>
              <option value="Zakat">Zakat</option>
              <option value="Fitrana">Fitrana</option>
              <option value="Sponsor a Scholar (Jamia-tul-Madinah)">Sponsor a Scholar's Education</option>
            </select>
          </div>
          <div class="field">
            <label for="r_method">How did you donate?</label>
            <select id="r_method" name="method">
              <option value="">Choose one</option>
              <option>Interac e-Transfer</option>
              <option>Online (card)</option>
              <option>Cash or cheque at the Islamic Centre</option>
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
        <div class="field">
          <label for="r_notes">Notes <span class="opt">(optional)</span></label>
          <textarea id="r_notes" name="notes" rows="2" placeholder="Anything else we should know, such as an e-Transfer reference"></textarea>
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
</main>
'''

PT_MAIN = (ROOT / "partials/prayer-main.html").read_text()

# Free tutoring pages. Bump TERMS_VERSION whenever the parent agreement wording changes.
TERMS_VERSION = "1.0 (draft, 11 October 2026)"
VOL_TERMS_VERSION = "2.0 (draft, 13 October 2026)"
PRIVACY_EMAIL = "Email: " + tbc("privacy email TBC")
def fill(t):
    for k, v in {"V_NAME": V_NAME, "V_ADDRESS": V_ADDRESS, "V_PHONE": V_PHONE, "BN": BN, "FORMS_ENDPOINT": FORMS_ENDPOINT,
                 "TERMS_VERSION": TERMS_VERSION, "VOL_TERMS_VERSION": VOL_TERMS_VERSION, "PRIVACY_EMAIL": PRIVACY_EMAIL}.items():
        t = t.replace("%%" + k + "%%", v)
    assert "%%" not in t, "unfilled placeholder"
    return t
TUTOR_MAIN = fill((ROOT / "partials/tutoring-main.html").read_text())
TERMS_MAIN = fill((ROOT / "partials/tutoring-terms.html").read_text())
VOL_MAIN = fill((ROOT / "partials/volunteer-main.html").read_text())
VOL_TERMS_MAIN = fill((ROOT / "partials/volunteer-terms.html").read_text())
VOL_PARENT_MAIN = fill((ROOT / "partials/volunteer-parent-consent.html").read_text())

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
    <a class="past-teaser" href="past-events.html"><span class="pt-ic" aria-hidden="true">↺</span><span><b>Our events through the years</b><small>See every gathering we've held, newest first</small></span><span class="pt-go" aria-hidden="true">→</span></a>
  </div>
</main>
'''

PAST_MAIN = f'''<main>
  <section class="page-head">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> <span>›</span> <a href="events.html">Events</a> <span>›</span> <span aria-current="page">Past events</span></nav>
      <h1>Our events through the years</h1>
      <p>Every gathering, program and celebration held by {V_NAME}, newest first.</p>
    </div>
  </section>
  <div class="wrap pt-main past">
    <p class="example-flag" id="pastExample" hidden>These are example events to show how this page will look. Real events will be added soon.</p>
    <ul class="past-stats" id="pastStats" aria-label="Summary"></ul>
    <div class="past-filters">
      <div class="past-frow" role="group" aria-label="Year" id="pastYears"></div>
      <div class="past-frow" role="group" aria-label="Who it was for">
        <button type="button" class="is-on" data-aud="all" aria-pressed="true">Everyone</button>
        <button type="button" data-aud="family" aria-pressed="false">Family</button>
        <button type="button" data-aud="brothers" aria-pressed="false">Brothers</button>
        <button type="button" data-aud="sisters" aria-pressed="false" class="pink">Sisters</button>
      </div>
      <div class="past-frow" role="group" aria-label="Where">
        <button type="button" class="is-on" data-place="all" aria-pressed="true">All places</button>
        <button type="button" data-place="fem" aria-pressed="false">At Faizan e Madina</button>
        <button type="button" data-place="other" aria-pressed="false">Halls &amp; other venues</button>
      </div>
    </div>
    <div id="pastList" class="past-list" aria-live="polite"></div>
    <p class="center-cta"><a class="btn btn-green" href="events.html">See upcoming events</a></p>
  </div>
</main>
'''

# Map style options (preview page for management, not linked from the menu)
MAP_OPTIONS = [
    ("emerald", "Option 1: Emerald (currently live)", "Solid dark-green Canada in the website's colours, gold pins and gold lines from Vancouver."),
    ("light", "Option 2: Light and gold", "A light, airy map: cream Canada with a green outline, green pins and gold lines. Calm and classic."),
    ("night", "Option 3: Night glow", "A dark night-sky look. Glowing gold pins and lines stand out like lights across Canada."),
    ("dots", "Option 4: Dotted", "A modern dotted map. Canada is drawn with small green dots that ripple in from west to east."),
    ("provinces", "Option 5: Province colours", "Each province in a different shade of green, so people can easily see which province each centre is in."),
]
def map_option(v, title, text):
    d = (ROOT / f"partials/map-options/{v}-desk.svg").read_text()
    ph = (ROOT / f"partials/map-options/{v}-phone.svg").read_text()
    return f'''    <section class="mo-item" id="{v}">
      <h2>{title}</h2>
      <p>{text}</p>
      <div class="wm-frame cm-frame mo-{v}">{d}{ph}</div>
    </section>'''
MAPOPT_MAIN = f'''<main>
  <section class="page-head">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a> <span>›</span> <span aria-current="page">Map style options</span></nav>
      <h1>Map style options</h1>
      <p>Five looks for the Canada map on the home page. Each one animates when you scroll to it. Tell us which number you like.</p>
    </div>
  </section>
  <div class="wrap mo-list">
{chr(10).join(map_option(*o) for o in MAP_OPTIONS)}
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
    "donate.html": (head(f"Donate | {V_NAME}",
                         f"Donate to {V_NAME}: Sadaqah, Zakat, Fitra and scholar sponsorship online or by Interac e-Transfer. Official tax receipts issued. BN {BN}.", "donate.html")
                    + header("donate") + DONATE_MAIN),
    "tutoring.html": (head(f"Free tutoring, Grades 2 to 8 | {V_NAME}",
                           f"Free tutoring for Grades 2 to 8 from {V_NAME} volunteers in Newton, Surrey. In person or online. Register and request a session.", "tutoring.html")
                      + header("tutoring") + TUTOR_MAIN),
    "tutoring-terms.html": (head(f"Tutoring parent agreement | {V_NAME}",
                                 f"Consent, release, camera notice, privacy notice and online rules for the {V_NAME} free tutoring program.", "tutoring-terms.html")
                            + header("tutoring") + TERMS_MAIN),
    "tax-receipt.html": (head(f"Request a tax receipt | {V_NAME}",
                              f"Request your official donation receipt for income tax purposes from {V_NAME}. Registered Canadian charity, BN {BN}.", "tax-receipt.html")
                         + header("receipt") + RECEIPT_MAIN),
    "volunteer.html": (head(f"Volunteer | {V_NAME}",
                            f"Volunteer at {V_NAME}: sign up, choose shifts at upcoming events and get reminders. Students can request a signed volunteer hours letter.", "volunteer.html")
                       + header("volunteer") + VOL_MAIN),
    "volunteer-terms.html": (head(f"Volunteer agreement | {V_NAME}",
                                  f"Volunteer agreement, code of conduct, acknowledgement of risk and privacy notice for {V_NAME} volunteers.", "volunteer-terms.html")
                             + header("volunteer") + VOL_TERMS_MAIN),
    "volunteer-parent-consent.html": (head(f"Parent consent form for volunteers | {V_NAME}", f"Printable parent/guardian consent form for volunteers aged 16 and 17 at {V_NAME}.", "volunteer-parent-consent.html")
                                      + header("volunteer") + VOL_PARENT_MAIN),
    "past-events.html": (head(f"Past events | {V_NAME}", f"Every event held by {V_NAME} through the years: family gatherings, brothers' and sisters' programs, at the Islamic Centre and at halls.", "past-events.html")
                         + header("events") + PAST_MAIN),
    "map-options.html": (head(f"Map style options | {V_NAME}", "Preview of map styles for the home page.", "map-options.html").replace("<head>", '<head>\n<meta name="robots" content="noindex">', 1)
                         + header(None) + MAPOPT_MAIN),
}
for name, html in pages.items():
    (ROOT / name).write_text(html + FOOTER)
print("built", ", ".join(pages))
