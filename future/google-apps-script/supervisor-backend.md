# Supervisor area: how the real (secure) version works

`supervisor.html` on the public website is a **demo front end** with made-up data and demo
logins (admin/admin, brothers/brothers, sisters/sisters). Demo logins in a public page are not
security; anyone can read them. **Never put real volunteer data behind the demo login.**

## Recommended production design (Phase 2)

The real supervisor app is served by **Google Apps Script inside the Islamic Centre's Google
Workspace for Nonprofits account**, not from GitHub Pages.

```
Supervisor's phone ──HTTPS──▶ Google sign-in (Workspace account + forced 2-step verification)
                                   │  only @dawateislamivancouver.ca accounts can open the app
                                   ▼
                     Apps Script web app (Deploy as: "Execute as: Me",
                     "Who has access: Anyone within dawateislamivancouver.ca")
                                   │  1. Session.getActiveUser().getEmail()  → who is asking
                                   │  2. look up "Supervisors" tab           → role + scope
                                   │  3. return ONLY the rows/columns that role may see
                                   ▼
                     Volunteers Google Sheet (restricted: script owner + 1–2 coordinators)
```

### Supervisors tab (managed by admins only)
| Email | Name | Role | Scope | Active |
|---|---|---|---|---|
| ahmed@dawateislamivancouver.ca | Br. Ahmed | supervisor | Brother | TRUE |
| sara@dawateislamivancouver.ca | Sr. Sara | supervisor | Sister | TRUE |
| zaid@dawateislamivancouver.ca | Zaid | admin | all | TRUE |

### Server functions (called from the page with `google.script.run`)
Every function starts with `var me = requireUser_();`, which throws if the email is not an
active row in the Supervisors tab. Then it checks role and scope before reading or writing.

| Function | Who | What it checks |
|---|---|---|
| `getBoard(eventId)` | supervisor, admin | Names only for the supervisor's own scope; other scope shows Filled/Open |
| `listApplications()` | supervisor, admin | Only "Pending review" rows in their scope |
| `approve(volId, jobs[])` / `decline(volId)` | supervisor, admin | Volunteer is in scope; jobs exist for that gender |
| `assign(eventId, shiftId, job, volId)` | supervisor, admin | Volunteer approved, same gender as job, not double-booked; uses `LockService` |
| `checkIn / checkOut / noShow / addNote` | supervisor, admin | Booking is in scope; event is today; note ≤ 300 chars, cleaned |
| `getVolunteer(volId)` | supervisor: basic fields; admin: + emergency contacts, age, police check | Field-level filtering on the server |
| `listUsers / addUser / setActive` | admin only | Cannot disable yourself; every change emailed to all admins |

All writes append a row to an **Audit** tab: time, email, action, target. Supervisors have no
edit access to the Sheet itself, so they can't change the audit log.

## OWASP Top 10 (2021) checklist

| Risk | How it is handled |
|---|---|
| **A01 Broken access control** | Server checks role + brothers/sisters scope on every call; deny by default; sensitive fields filtered server-side, not hidden in the browser |
| **A02 Cryptographic failures** | HTTPS only (Google); no passwords stored at all; no data in localStorage/cookies; no IDs or tokens with personal data in URLs |
| **A03 Injection / XSS** | All output written with `textContent` (no `innerHTML`); Sheet values prefixed to stop formula injection (`clean_()`); no `eval`; strict Content-Security-Policy |
| **A04 Insecure design** | Least privilege (roster vs restricted sheet); approval workflow; brothers/sisters separation built into the data model |
| **A05 Security misconfiguration** | Web app restricted to the Workspace domain; demo page `noindex`; CSP `default-src 'self'`, `object-src 'none'`, `base-uri 'none'` |
| **A06 Vulnerable components** | No third-party JavaScript libraries; Google-managed runtime |
| **A07 Identification & authentication failures** | Google sign-in with enforced 2-step verification; accounts disabled instantly by admins; 15-minute idle sign-out in the app |
| **A08 Software & data integrity** | `LockService` around all writes; changes only through server functions with validation; script edits limited to the owner |
| **A09 Logging & monitoring** | Audit tab for every action; admins emailed on account changes and bulk actions |
| **A10 SSRF** | The backend never fetches URLs supplied by users |

## Moving from demo to real
1. Set up Google Workspace for Nonprofits and create supervisor accounts with 2-step verification enforced.
2. Create the Supervisors and Audit tabs in the restricted Volunteers sheet.
3. Move `supervisor.js` into an Apps Script HTML file and replace the demo arrays with `google.script.run` calls.
4. Deploy as a web app limited to the domain, and remove the demo logins.
5. Remove `supervisor.html` from the public site, or keep it clearly as a demo only.
