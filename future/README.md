# Parts of the website on hold for later

These were built and tested, but are not on the live website for now. Nothing here is linked
from the site, and no pages are built from these files while `FUTURE = False` in `build.py`.

A complete copy of the website with all of these working is saved on the GitHub branch
**`full-site-2026-10-16`**.

| Feature | Files kept here | Move back to |
|---|---|---|
| Free tutoring (Grades 2–8): sign-up form and parent agreement | `partials/tutoring-main.html`, `partials/tutoring-terms.html`, `assets/tutoring.js` | `partials/`, `assets/` |
| Volunteers: sign-up, shifts, agreement, parent consent form | `partials/volunteer-main.html`, `partials/volunteer-terms.html`, `partials/volunteer-parent-consent.html`, `assets/volunteer.js` | `partials/`, `assets/` |
| Volunteer supervisor area (demo) | `assets/supervisor.js`, `google-apps-script/supervisor-backend.md` | `assets/`, `google-apps-script/` |
| Teacher attendance (demo) | `assets/attendance.js`, `google-apps-script/attendance-backend.md` | `assets/`, `google-apps-script/` |
| Map style options preview | `partials/map-options/` | `partials/` |

The guest-slide design options page (`slide-options.html`) needs no files moved; it comes back
with `FUTURE = True`.

## To bring them back
1. Move the files above back to their folders.
2. In `build.py`, set `FUTURE = True`.
3. Run `python3 build.py`, check the pages on a phone, and publish.

The Google Apps Script backend (`google-apps-script/masjid-forms.gs`) still contains the tutoring
and volunteer code, so nothing needs to change there.
