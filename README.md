# Faizan e Madina Vancouver — website

Website of Faizan e Madina Vancouver (Dawat-e-Islami), 7062 134 Street, Surrey, BC.
Domain: **dawateislamivancouver.ca** · Preview: https://pathanz.github.io/dawateislamivancouver/

- `index.html` — home page: today's prayers, weekly Ijtima, services, donations, about, visit/map
- `prayer-times.html` — monthly timetable
- `assets/prayer-data.js` — prayer times (add each new month here)
- `events.html` + `assets/events.js` — event flyers. Upload the flyer into `assets/events/`, then add one line to `assets/events.js` (instructions are inside the file). Flyers hide themselves after the event date.
- `build.py` — run `python3 build.py` after changing any text, to rebuild the pages

The Dawat-e-Islami Canada website is in the separate repo PathanZ/dawateislami-vancouver.
Its Vancouver entry will link here.

## Connecting the domain

1. At the domain registrar, add four A records for `@`: `185.199.108.153`, `185.199.109.153`,
   `185.199.110.153`, `185.199.111.153`, and a CNAME record for `www` pointing to `pathanz.github.io`.
2. Once those are saved, go to GitHub → Settings → Pages → Custom domain, enter
   `dawateislamivancouver.ca`, then tick **Enforce HTTPS** when it becomes available.

## Website forms (tax receipts and Dua-e-Maghfirah)

Both forms send submissions to one Google Sheet owned by the masjid, with a tab for each form.
The Dua-e-Maghfirah limits (3 names per family per Thursday, booking up to 2 weeks ahead,
5 PM cutoff on Thursday) are enforced by the sheet's script, not just the page.
Setup steps are at the top of `google-apps-script/masjid-forms.gs`. Once deployed, paste the
Web app URL into `FORMS_ENDPOINT` in `build.py` and run `python3 build.py`. Until then, both
forms tell people to call the masjid instead.
