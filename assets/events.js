// Events and flyers for Faizan e Madina Vancouver
//
// To add an event:
//   1. Upload the flyer image into the assets/events/ folder.
//   2. Copy one of the example lines below, remove the // at the start, and fill it in.
//
//   title   - name of the event
//   date    - the event's date as YEAR-MONTH-DAY. After this date the flyer hides by itself.
//   time    - optional, e.g. "After Isha" or "7:00 PM"
//   image   - the flyer's file name inside assets/events/
//   details - optional, one short line
//
// For a program that runs every week, leave out date and add  ongoing: true, when: "Every Sunday"
// It then stays up until you delete the line.
//
// Newest/soonest events show first automatically.

window.FEM_EVENTS = [
  { title: "Jumu'ah Salah", ongoing: true, when: "Every Friday", time: "Iqamah 1:35 PM & 3:35 PM", image: "jummah.jpg", details: "Speech at 1:00 and 3:00 PM, Khutbah at 1:30 and 3:30 PM. All are welcome, brothers and sisters." },
  { title: "Faizan Weekend Islamic School", ongoing: true, when: "Every Sunday", time: "11:00 AM – 1:00 PM", image: "weekend-school.jpg", details: "Ages 6 to 12 · $50 per month. Call the Principal at (236) 516-2065." },
  { title: "Rukn-e-Shura Haji Khalid Attari: Canada visit", date: "2026-10-27", time: "Islamic gathering · in Vancouver 26–28 October", image: "haji-khalid-attari-canada-visit-2026.jpg", details: "Member of the Executive Committee of Dawat-e-Islami and Head of Dawat-e-Islami Canada. Everyone is welcome, with a separate arrangement for sisters." },
  // { title: "Mawlid un Nabi Ijtima", date: "2026-10-22", time: "After Isha", image: "mawlid-2026.jpg", details: "Dinner served. Sisters' arrangement available." },
];
