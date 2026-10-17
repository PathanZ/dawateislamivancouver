// Free Tutoring Program settings
// The same settings must also be entered in google-apps-script/masjid-forms.gs (TUTORING section),
// because the Google Sheet double-checks every booking.
//
//   open         - false shows "Registrations open soon" and blocks submitting. Set to true at launch.
//   bookAhead    - how many days ahead parents may book (7 = one week)
//   perMonth     - how many sessions each child may book per calendar month
//   sessions     - the weekly sessions on offer. day: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
//                  mode: "in-person" or "online"; spots: students per session
//   example      - true while the sessions below are placeholders

window.FEM_TUTORING = {
  open: false,
  bookAhead: 7,
  perMonth: 1,
  minGrade: 2,
  maxGrade: 8,
  example: true,
  sessions: [
    { id: "sat-am", day: 6, start: "10:30 AM", end: "12:00 PM", mode: "in-person", spots: 6 },
    { id: "wed-pm", day: 3, start: "6:00 PM",  end: "7:00 PM",  mode: "online",    spots: 4 }
  ]
};
