// Home page slideshow (the 4 large slides at the top of the home page)
//
// HOW TO CHANGE A SLIDE
//   Edit the words between the quotes below and save. Keep the commas and quotes.
//   The slides show in the same order as they are listed here.
//
//   style   - the look of the slide: "guest", "canada", "month", "relief", "academy" or "green"
//   kicker  - the small gold line above the title
//   title   - the big title (keep it short: about 3 to 8 words)
//   text    - one or two short sentences
//   date    - optional, shown in a gold badge, e.g. "Tuesday, 27 October"
//   place   - optional, shown next to the date, e.g. "Faizan e Madina Vancouver"
//   button  - the words on the button
//   link    - where the slide goes when someone taps it:
//               another website:     "https://fgrf.org/"   (opens in a new tab)
//               a page on our site:  "events.html"
//   image   - optional: a poster or photo instead of the built-in artwork.
//             Upload it to the assets/slides/ folder and put its file name here, e.g. "eid.jpg".
//             Best size: 1600 x 900 pixels (landscape). Text in the image may be hard to read on phones.
//   imageAlt - if you use an image, describe it in a few words for blind visitors
//   photo   - optional: a round photo of a person shown on the slide (for a guest speaker).
//             Upload a square photo (about 500 x 500) to assets/slides/ and put its file name here.
//   photoAlt - the person's name, for blind visitors
//
// USING A BANNER FROM ANOTHER WEBSITE (e.g. FGRF, Faizan Online Academy)
//   banner    - a wide banner picture in assets/slides/. Computers show the whole banner;
//               phones show it on top with the title, text and button underneath.
//   bannerAlt - the words on the banner, for blind visitors
//
// USING YOUR OWN FINISHED DESIGN (made in Canva, Photoshop, etc.)
//   poster      - the computer picture, 2280 x 880 pixels (wide), in assets/slides/
//   posterPhone - the phone picture, 1080 x 1620 pixels (tall), in assets/slides/
//   posterAlt   - the words on the picture, for blind visitors
//   link        - where it goes when tapped (optional)
//   Keep important words and faces in the middle 60% of the wide picture: tablets trim the left and right edges.
//   Example: { poster: "eid-wide.jpg", posterPhone: "eid-phone.jpg", posterAlt: "Eid Mubarak from Faizan e Madina Vancouver", link: "events.html" },
//
// THE GUEST SPEAKER SLIDE ({ style: "guest" }) - a poster with the guest in front of a waving Canadian flag
//   kicker    - e.g. "Coming to Vancouver"
//   honorific - small line above the name, e.g. "Rukn-e-Shura"
//   title     - the guest's name (the last word is shown in gold)
//   text      - the guest's role
//   date      - "Weekday, DAY Month", e.g. "Tuesday, 27 October" (shown as a ticket)
//   event     - e.g. "Islamic Gathering";   place - a short line under it
//   cutout    - a photo of the guest with the background removed (PNG or WebP), in assets/slides/
//   from    - optional, YEAR-MONTH-DAY: the slide only appears from this day
//   until   - optional, YEAR-MONTH-DAY: the slide hides by itself after this day
//
// THE ISLAMIC MONTH SLIDE ({ style: "month" })
//   This slide changes by itself on the 1st of every Islamic month.
//   Its words come from MONTHS further down. To use your own words for one time only,
//   add a title and text to the slide itself and they will be used instead.

window.FEM_SLIDES = [
  {
    style: "guest",
    kicker: "Coming to Vancouver",
    honorific: "Rukn-e-Shura",
    title: "Haji Khalid Attari",
    text: "Member of the Executive Committee of Dawat-e-Islami & Head of Dawat-e-Islami Canada",
    date: "Tuesday, 27 October",
    event: "Islamic Gathering",
    place: "All welcome · Sisters' area available",
    cutout: "haji-khalid-attari-hd.webp",
    cutoutAlt: "Haji Khalid Attari",
    button: "See the tour poster",
    link: "events.html",
    until: "2026-10-28"
  },
  {
    style: "month",
    button: "Join the weekly Ijtima",
    link: "index.html#ijtima"
  },
  {
    style: "relief",
    kicker: "FGRF · Faizan Global Relief Foundation",
    title: "Help reach families in need",
    text: "Dawat-e-Islami's relief work around the world, including humanitarian aid in Palestine.",
    button: "Visit FGRF",
    link: "https://fgrf.org/",
    banner: "fgrf-gaza-relief.webp",
    bannerAlt: "FGRF continues relief activities in war-affected Gaza: 800 mattresses recently delivered in a container. Help us to help them."
  },
  {
    style: "academy",
    kicker: "Faizan Online Academy",
    title: "Learn the Qur'an from home",
    text: "Live online Islamic classes you can join from home, for children and adults.",
    button: "Visit Faizan Online Academy",
    link: "https://faizanonline.net/",
    banner: "faizan-online-academy.webp",
    bannerAlt: "Faizan Online Academy: learn Quran online with qualified Quran teachers at home, Hifz Quran and Darse Nizami."
  }
];

// Words for the Islamic month slide, one line per month (1 = Muharram ... 12 = Dhul-Hijjah).
// Please have the Imam check these before the site goes live.
window.FEM_MONTHS = {
  1:  { name: "Muharram-ul-Haram", arabic: "مُحَرَّمُ الْحَرَام", text: "The first month of the Islamic year and one of the four sacred months. The 10th, Ashura, is a day of fasting and of remembering Imam Husain and the martyrs of Karbala." },
  2:  { name: "Safar-ul-Muzaffar", arabic: "صَفَرُ الْمُظَفَّر", text: "Islam teaches there is no bad luck in Safar or in any month. Fill it with Durood Sharif, charity and good deeds." },
  3:  { name: "Rabi-ul-Awwal", arabic: "رَبِيعُ الْأَوَّل", text: "The blessed month in which our beloved Prophet Muhammad ﷺ was born. Celebrate with Milad, Naat and Durood Sharif." },
  4:  { name: "Rabi-ul-Aakhir", arabic: "رَبِيعُ الْآخِر", text: "The month of Ghaus-e-Azam, Shaykh Abdul Qadir Jilani. Gyarhwin Sharif, on the 11th, remembers his life and teachings." },
  5:  { name: "Jumada-al-Ula", arabic: "جُمَادَى الْأُولٰى", text: "A new Islamic month has begun. Make it count: read Durood Sharif often, keep Nafl fasts, and join us every Thursday for the weekly Ijtima." },
  6:  { name: "Jumada-al-Ukhra", arabic: "جُمَادَى الْآخِرَة", text: "The Urs of the first Caliph, Sayyiduna Abu Bakr Siddiq, is observed on the 22nd. Follow his example of love for the Prophet ﷺ." },
  7:  { name: "Rajab-ul-Murajjab", arabic: "رَجَبُ الْمُرَجَّب", text: "One of the four sacred months. The 27th night, Shab-e-Mi'raj, remembers the Prophet's ﷺ miraculous night journey." },
  8:  { name: "Sha'ban-ul-Mu'azzam", arabic: "شَعْبَانُ الْمُعَظَّم", text: "The Prophet ﷺ fasted more in Sha'ban than in any month except Ramadan. The 15th night, Shab-e-Bara'at, is a night of forgiveness." },
  9:  { name: "Ramadan-ul-Mubarak", arabic: "رَمَضَانُ الْمُبَارَك", text: "The month of fasting and the Holy Qur'an. Join us for Taraweeh and Iftar, and seek Laylat-ul-Qadr in the last ten nights." },
  10: { name: "Shawwal-ul-Mukarram", arabic: "شَوَّالُ الْمُكَرَّم", text: "Begins with Eid-ul-Fitr. Fasting six days of Shawwal after Ramadan brings great reward." },
  11: { name: "Dhul-Qa'dah", arabic: "ذُو الْقَعْدَة", text: "One of the four sacred months, as pilgrims prepare to travel for Hajj." },
  12: { name: "Dhul-Hijjah", arabic: "ذُو الْحِجَّة", text: "The month of Hajj and Eid-ul-Adha. Its first ten days are among the best days of the year, and the 9th is the Day of Arafah." }
};
