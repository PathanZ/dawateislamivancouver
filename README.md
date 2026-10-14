# Faizan e Madina Vancouver — website

Website of Faizan e Madina Vancouver (Dawat-e-Islami), 7062 134 Street, Surrey, BC.
Domain: **dawateislamivancouver.ca** · Preview: https://pathanz.github.io/dawateislamivancouver/

- `index.html` — home page: today's prayers, weekly Ijtima, services, donations, about, visit/map
- `prayer-times.html` — monthly timetable
- `donate.html` — all donation options (online, e-Transfer, in person); share dawateislamivancouver.ca/donate.html
- `tax-receipt.html` — tax receipt request form
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

## Free tutoring (Grades 2–8)

- `tutoring.html` — program page and parent registration form; `tutoring-terms.html` — parent agreement (consent, release, camera notice, privacy notice, online rules). Wording lives in `partials/tutoring-main.html` and `partials/tutoring-terms.html`; bump `TERMS_VERSION` in `build.py` when the agreement changes.
- `assets/tutoring.js` — open/closed switch, session days/times/spots, booking limits. Mirror any change in the TUTORING section of `google-apps-script/masjid-forms.gs`, which re-checks every booking.
- Registrations stay closed (`open: false`) until volunteer checks, insurance and legal review are done.

## Themes

`THEME` in `build.py` picks the look: `"midnight"` (Midnight Emerald, dark, uses `assets/theme-midnight.css`) or `"jamia"` (green and gold, light). Change it and run `python3 build.py`.
Saved snapshots on GitHub: branch `jamia-theme` (green and gold) and branch `olive-theme` (olive).


## Volunteers

- `volunteer.html` — volunteer sign-up (profile + shift picker), and the hours letter request.
- `volunteer-terms.html` — the volunteer agreement (bump `VOL_TERMS_VERSION` in build.py when the wording changes).
- `assets/volunteer.js` — set `open: true` once the Google script is set up (until then the page shows example shifts).
- Events, shifts, sign-ups, attendance and letters are all managed in the "Volunteers" Google Sheet.
  Setup steps 11–14 are at the top of `google-apps-script/masjid-forms.gs`.

### Volunteers v2 and past events
- Volunteers apply → supervisors approve in the "Volunteers" tab (Status + Approved jobs) → shifts booked automatically.
- Events can be at other locations (Events tab, "Location" column). Attendance: Sign-ups tab (Status Attended/No-show, Checked in/out, Work done, Supervisor notes).
- `volunteer-parent-consent.html` — printable consent form for 16–17-year-olds.
- `past-events.html` + `assets/past-events.js` — events archive. Replace the example lines and set `FEM_PAST_EVENTS_EXAMPLE = false`.
