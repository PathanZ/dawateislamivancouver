# Teacher attendance: how the real (secure) version works

`attendance.html` on the public website is a **demo front end** with made-up students and demo
logins (mohsin/mohsin, zaid/zaid, sister/sister, admin/admin). Demo logins in a public page are not
security; anyone can read them. **Never enter real students behind the demo login.** Most students
are children, so their names and parents' phone numbers must only live in the Islamic Centre's own
Google account.

## Recommended production design

Same approach as the volunteer supervisor area: a **Google Apps Script web app inside the Islamic
Centre's Google Workspace for Nonprofits account**, opened from a bookmark on the teacher's phone.

```
Teacher's phone ──HTTPS──▶ Google sign-in (teacher@dawateislamivancouver.ca + 2-step verification)
                                   │  only Islamic Centre accounts can open the app
                                   ▼
                     Apps Script web app ("Execute as: Me",
                     "Who has access: Anyone within dawateislamivancouver.ca")
                                   │ 1. Session.getActiveUser().getEmail()   → which teacher
                                   │ 2. Teachers tab                         → their classes
                                   │ 3. read/write ONLY rows for those classes
                                   ▼
                     "Student attendance" Google Sheet (shared with nobody except the owner and the admin)
```

### Sheet tabs

| Tab | Columns |
|---|---|
| **Teachers** (admin only) | Email · Name · Side (Brothers/Sisters) · Classes (e.g. `MB, WB`) · Role (teacher/admin) · Active |
| **Classes** | Class ID · Name · Side · Days (e.g. `Mon,Tue,Wed,Thu,Fri`) · Time · Mode (In person / Hybrid) · Monthly in-person rule |
| **Students** | Student ID · Class ID · Full name · Level/group · Parent name · Parent phone · Enrolled (TRUE/FALSE) · Start date · Left date |
| **Attendance** | Date · Class ID · Student ID · Status (Present/Late/Absent/Excused/No class) · Note · Mode (Online/In person) · Saved by · Saved at |
| **Audit** | Time · Email · Action · Class · Date |

One row per student per class day keeps it easy to filter, total and print. The Register screen and
the "needs a follow-up" list are calculated from the Attendance tab.

### Server functions (called from the page with `google.script.run`)
Every function starts with `var me = requireTeacher_();`, which stops unless the signed-in email is an
active row in the Teachers tab, and then checks `classId` is one of that teacher's classes.

| Function | What it checks |
|---|---|
| `getMyClasses()` | Returns only the teacher's classes (a brothers' teacher never receives the girls' class) |
| `getDay(classId, date)` | Class is theirs; date is not in the future |
| `saveDay(classId, date, rows, mode, cancelled)` | Class is theirs; every student ID belongs to that class; status is one of the 4 allowed values; notes ≤ 120 characters, cleaned; uses `LockService` so two teachers saving at once can't overwrite each other; replaces that day's rows; writes to Audit |
| `getRegister(classId, month)` | Class is theirs |
| `addStudent / setEnrolled` | Class is theirs; name and phone checked; "left" students keep their history |
| `adminOverview / setTeacher` | Admin only; every account change is emailed to the admins |

## Privacy (children's information, BC PIPA)
- Collect only what's needed: name, level/group, one parent name and phone. No dates of birth, addresses or health details in this sheet.
- Parents are told on the registration form that attendance is recorded and why (safety, follow-up on absences, progress).
- Teachers see only their own class. Only the admin can download the whole sheet.
- Keep records for the current year plus 2 years, then delete; delete a student's details on a parent's request unless a record must be kept by law.
- Downloads ("Download month") are cleaned so a name starting with `=` can't run as a spreadsheet formula.

## OWASP Top 10 (2021) checklist

| Risk | How it is handled |
|---|---|
| **A01 Broken access control** | Class ownership checked on the server for every call; deny by default; brothers/sisters classes kept apart |
| **A02 Cryptographic failures** | HTTPS only; no passwords stored (Google sign-in); nothing saved on the phone; no names in URLs |
| **A03 Injection / XSS** | Text written with `textContent` only; strict Content-Security-Policy; spreadsheet values cleaned against formula injection |
| **A04 Insecure design** | Least privilege per class; "left" instead of delete so history is never lost by accident; unsaved-changes warning |
| **A05 Security misconfiguration** | Web app limited to the Workspace domain; sheet not shared; demo page `noindex` and blocked in robots.txt |
| **A06 Vulnerable components** | No third-party JavaScript libraries |
| **A07 Identification & authentication failures** | Google sign-in with enforced 2-step verification; admin can disable a teacher instantly; 15-minute idle sign-out |
| **A08 Software & data integrity** | `LockService` around saves; only server functions can change data; script edits limited to the owner |
| **A09 Logging & monitoring** | Audit tab records who saved or changed which class and day |
| **A10 SSRF** | The backend never fetches addresses supplied by users |

## Moving from demo to real
1. Set up Google Workspace for Nonprofits; create teacher accounts (2-step verification on).
2. Create the "Student attendance" sheet with the tabs above; fill in Classes and Teachers.
3. Move `attendance.js` into an Apps Script HTML file; replace the demo arrays with `google.script.run` calls.
4. Deploy as a web app limited to the domain; give each teacher the link to add to their home screen.
5. Remove the demo logins, or keep `attendance.html` clearly as a demo.
