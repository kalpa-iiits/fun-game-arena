/* ---------------------------------------------------------------------------
   Fun Game Arena — all site copy in one place.

   ⚠️  FILL THESE IN BEFORE LAUNCH
   The contact block and the pool / table-tennis prices are placeholders. They
   are NOT carried over from any other business — every value marked TODO needs
   your real details. Search this file for "TODO".
   --------------------------------------------------------------------------- */

export const BRAND = {
  name: 'Fun Game Arena',
  short: 'FGA',
  tagline: 'Test your gaming limits.',
  logo: '/assets/fga-logo.png',
};

export const BUSINESS = {
  phoneDisplay: '+91 70022 13840',
  phoneNav: 'Call: 70022 13840',
  phoneDrawer: 'Call 70022 13840',
  phoneHref: 'tel:+917002213840',

  // No public email yet. Set one here and it reappears automatically in the
  // Contact card, the footer and the structured data.
  email: null,

  addressLines: ['Loknath Path, 23 Lokhra Road,', 'Lal Ganesh, Guwahati – 781035, Assam'],
  addressOneLine:
    'Loknath Path, 23 Lokhra Road, opposite HP Petrol Pump, Lal Ganesh, Guwahati – 781035, Assam',
  landmark: 'Opposite HP Petrol Pump',
  locality: 'Lal Ganesh',
  city: 'Guwahati',
  region: 'Assam',
  postalCode: '781035',
  geo: { lat: 26.1396573, lng: 91.7382727 },

  hours: 'Open daily · 6:00 PM – 11:30 PM',
  hoursShort: '6:00 PM – 11:30 PM',

  mapsLink: 'https://maps.app.goo.gl/anQUXz7VNxDFogEd7',
  // Centred on the arena rather than a text search, so the pin can't drift
  // if Google re-geocodes the name.
  mapsEmbed:
    'https://maps.google.com/maps?q=26.1396573,91.7382727&z=17&output=embed',

  instagram: 'https://www.instagram.com/fungamearenaguwahati/',
  facebook: 'https://www.facebook.com/',
};

/* In-app routes. The booking page reads ?game= and ?pkg= to preselect. */
export const LINKS = {
  book: '/book',
  myBookings: '/my-bookings',
  pkg: (game, slug) => `/book?game=${game}&pkg=${slug}`,
};

/* ---------------------------------------------------------------------------
   Booking engine config.

   `open`/`close` are IST wall-clock. The slot grid is generated from these
   plus each package's `durationMin`, so changing hours here changes every
   available time on the booking page.
   --------------------------------------------------------------------------- */
export const BOOKING = {
  open: '18:00',
  close: '23:30',
  daysAhead: 14,        // how many date chips to offer
  leadTimeMin: 90,      // a slot must be this far in the future to be bookable
  holdMinutes: 15,      // how long a slot is held while paying
  // Payment-gateway fee added to the package price, per rupee band.
  gatewayFee: (amount) => Math.max(2, Math.ceil(amount * 0.025)),
};

export const NAV_LINKS = [
  { href: '#arenas', label: 'Arenas' },
  { href: '#live', label: 'Live' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#location', label: 'Location' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
];

export const TICKER_ITEMS = [
  'Cricket Nets',
  '8-Ball Pool',
  'Table Tennis',
  'Bowling Machine 130+ km/h',
  'All Ages · All Genders',
  'Walk-in or Book Online',
  'Test Your Gaming Limits',
];

export const SCORES = [
  { to: 130, suffix: '+', unit: 'km/h top speed', accent: 'var(--red)', speed: true },
  { to: 3, unit: 'game arenas', accent: 'var(--gold)' },
  { text: '11:30', unit: 'open till, every night', accent: 'var(--blue)' },
  { text: 'All', unit: 'ages & levels', accent: 'var(--steel-2)' },
];

/* ---------------------------------------------------------------------------
   The three arenas. `accent` / `accentSoft` drive each card's colour through
   CSS custom properties, so a game owns its colour everywhere it appears —
   card, pricing tab, hero chip.
   --------------------------------------------------------------------------- */
export const GAMES = [
  {
    id: 'cricket',
    // How many nets/tables you have of this game. Raise it and that many
    // people can book the same time slot independently.
    tables: 1,
    name: 'Cricket Nets',
    sub: 'Bowling machine',
    icon: '🏏',
    accent: 'var(--red)',
    accentSoft: 'rgba(230,35,28,.18)',
    accentInk: '#fff',
    blurb:
      'A high-speed bowling machine that does more than fire it down. Dial the pace up to genuine match speed or ease it back to groove your technique — then switch to spin or swing and face the exact ball that gets you out.',
    perks: ['Adjustable speed to 130+ km/h', 'Off-spin, leg-spin, in-swing, out-swing', 'Kit available on site'],
    from: '₹75',
    packages: [
      {
        slug: '3-overs',
        qty: '3',
        unit: 'Overs',
        durationMin: 10,
        price: '₹75',
        per: 'per person',
        desc: 'A quick, sharp hit. Perfect for a warm-up, a top-up session, or a first taste of the machine.',
        perks: ['Adjustable speed', 'Spin & swing options', 'All ages welcome'],
      },
      {
        slug: '5-overs',
        qty: '5',
        unit: 'Overs',
        durationMin: 10,
        price: '₹99',
        per: 'per person',
        desc: 'The sweet spot — enough deliveries to settle in, work on your shots and properly build an innings.',
        perks: ['Adjustable speed', 'Spin & swing options', 'Great for all levels'],
      },
      {
        slug: '10-overs',
        qty: '10',
        unit: 'Overs',
        durationMin: 15,
        price: '₹199',
        per: 'per person',
        desc: 'A full grind. Maximum time at the crease to train endurance, footwork and your complete range of strokes.',
        perks: ['Adjustable speed', 'Spin & swing options', 'Best value session'],
        best: true,
      },
    ],
  },
  {
    id: 'pool',
    // How many nets/tables you have of this game. Raise it and that many
    // people can book the same time slot independently.
    tables: 1,
    name: '8-Ball Pool',
    sub: 'Tournament tables',
    icon: '🎱',
    accent: 'var(--gold)',
    accentSoft: 'rgba(227,180,92,.18)',
    // gold is light — white on it fails contrast, so this arena inks dark
    accentInk: '#171104',
    blurb:
      'Proper tournament-cloth tables, good cues and a clean break every time. Play a casual frame with friends, run the table solo, or settle it over a full hour of pool.',
    perks: ['Tournament-grade cloth', 'House cues & chalk included', 'Frame or hourly rates'],
    from: '₹99', // TODO: confirm real price
    packages: [
      {
        slug: '1-frame',
        qty: '1',
        unit: 'Frame',
        durationMin: 15,
        price: '₹99', // TODO
        per: 'per table',
        desc: 'One rack, start to finish. The quick decider when you just want to settle an argument.',
        perks: ['Cues & chalk included', 'Up to 4 players', 'Walk-in friendly'],
      },
      {
        slug: '30-min',
        qty: '30',
        unit: 'Minutes',
        durationMin: 30,
        price: '₹249', // TODO
        per: 'per table',
        desc: 'Half an hour on the cloth — enough for a few frames without watching the clock.',
        perks: ['Cues & chalk included', 'Up to 4 players', 'Great for pairs'],
      },
      {
        slug: '60-min',
        qty: '60',
        unit: 'Minutes',
        durationMin: 60,
        price: '₹449', // TODO
        per: 'per table',
        desc: 'A full hour. Bring the group, rotate players and actually get your eye in.',
        perks: ['Cues & chalk included', 'Up to 6 players', 'Best value per frame'],
        best: true,
      },
    ],
  },
  {
    id: 'table-tennis',
    // How many nets/tables you have of this game. Raise it and that many
    // people can book the same time slot independently.
    tables: 1,
    name: 'Table Tennis',
    sub: 'Match-spec tables',
    icon: '🏓',
    accent: 'var(--blue)',
    accentSoft: 'rgba(34,120,240,.18)',
    accentInk: '#fff',
    blurb:
      'Match-spec tables with room to actually move behind them. Rally with a friend, play doubles, or drill your serve — bats and balls are on the house.',
    perks: ['Match-spec tables', 'Bats & balls included', 'Singles or doubles'],
    from: '₹149', // TODO: confirm real price
    packages: [
      {
        slug: '30-min',
        qty: '30',
        unit: 'Minutes',
        durationMin: 30,
        price: '₹149', // TODO
        per: 'per table',
        desc: 'A sharp half-hour hit. Ideal for a singles match or a quick warm-up before pool.',
        perks: ['Bats & balls included', 'Up to 2 players', 'Walk-in friendly'],
      },
      {
        slug: '60-min',
        qty: '60',
        unit: 'Minutes',
        durationMin: 60,
        price: '₹269', // TODO
        per: 'per table',
        desc: 'An hour on the table — long enough for a proper best-of-five and a rematch.',
        perks: ['Bats & balls included', 'Up to 4 players', 'Great for doubles'],
        best: true,
      },
      {
        slug: '2-hour',
        qty: '2',
        unit: 'Hours',
        durationMin: 120,
        price: '₹499', // TODO
        per: 'per table',
        desc: 'Block booking for a group or a small office tournament. Bring everyone.',
        perks: ['Bats & balls included', 'Up to 6 players', 'Best value per hour'],
      },
    ],
  },
];

/* ---------------------------------------------------------------------------
   Instagram reels shown on the landing page.

   Empty for now — the section hides itself when there is nothing to show.
   To bring it back, drop your own .mp4 files (plus a poster frame each) into
   public/assets/ and add entries here; nothing else needs changing:

     { href:  'https://www.instagram.com/p/XXXX/',
       video: '/assets/reel-1.mp4',
       poster:'/assets/reel-1-poster.jpg',
       tag:   'Arena flythrough',
       label: 'Watch reel: arena flythrough' },
   --------------------------------------------------------------------------- */
export const REELS = [];

export const FAQS = [
  {
    q: 'What can I play at Fun Game Arena?',
    a: 'Three arenas under one roof: indoor cricket nets with a high-speed bowling machine, 8-ball pool on tournament-cloth tables, and match-spec table tennis. You can book one or move between all three in a single visit.',
  },
  {
    q: 'How much does a session cost?',
    a: 'Cricket nets start at ₹75 per person for 3 overs. Pool and table tennis are charged per table so the price splits across your group. Full pricing for every arena is in the Pricing section above — pick a game to see its rates.',
  },
  {
    q: 'Can the bowling machine bowl spin and swing?',
    a: 'Yes. The machine runs at adjustable speeds up to 130+ km/h and delivers both spin and swing, so you can face pace, off-spin, leg-spin, in-swing and out-swing in one session.',
  },
  {
    q: 'Is it suitable for beginners and kids?',
    a: 'Absolutely. Machine speed is set to suit each batter, so it works for first-timers and kids as well as club cricketers. Pool and table tennis need no experience at all. Every arena is open to all ages and all genders.',
  },
  {
    q: 'Do I need to book in advance, or can I walk in?',
    a: 'Both work. Reserving online guarantees your slot at a busy hour, but you are welcome to walk in any time during opening hours and take the next free table or net.',
  },
  {
    q: 'Do you provide the equipment?',
    a: 'Yes. Cues and chalk for pool, bats and balls for table tennis, and cricket kit is available on site. Bring your own bat or cue if you prefer your own gear.',
  },
  {
    q: 'Can I book the arena for a group, party or corporate event?',
    a: 'Yes — group and block bookings across all three arenas are available, including office tournaments and birthdays. Get in touch and we will put together a slot and a rate for your group size.',
  },
];

export const FOOTER_SEO_LINKS = [
  { href: null, label: 'Indoor Cricket Nets' },
  { href: null, label: 'Bowling Machine Practice' },
  { href: null, label: '8-Ball Pool Tables' },
  { href: null, label: 'Table Tennis Booking' },
  { href: null, label: 'Group & Corporate Bookings' },
];
