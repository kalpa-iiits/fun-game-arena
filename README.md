# Fun Game Arena — website

React + Vite site for **Fun Game Arena** — indoor cricket nets, 8-ball pool and
table tennis under one roof. Design is built from the FGA badge: chrome type on
carbon-hex black, a red half and a blue half meeting in the middle, gold for the
tagline register.

## Run it

```bash
npm install
npm run dev
```

`npm run build` emits a static `dist/` you can drop on any host.

## Routes

| Path | Page |
|---|---|
| `/` | landing page |
| `/book` | booking flow |
| `/book?game=pool&pkg=60-min` | booking flow, preselected |

It's a single-page app, so deep links need a catch-all rewrite to
`index.html`. `public/_redirects` (Netlify, Cloudflare Pages) and `vercel.json`
are already in the repo. On Apache or nginx you'll need the equivalent rule.

A bare `?pkg=` works too — `/book?pkg=3-overs` finds whichever arena owns that
slug, so old links don't break.

---

## ⚠️ Before you launch

Three things still need your real details.

**1. Drop the logo in.** The badge PNG is referenced at `public/assets/fga-logo.png`
but isn't in the repo yet. Save it there (transparent PNG, ~1080px square):

```bash
cp /path/to/your/fga-logo.png public/assets/fga-logo.png
```

Until it exists, every logo slot falls back to a chrome "FGA / Fun Game Arena"
wordmark rather than a broken image — so the site looks intentional either way.
See `src/components/Logo.jsx`.

**2. Fill in the placeholders.** Search `src/data/site.js` for `TODO`:

| What | Where |
|---|---|
| Phone, email, address | `BUSINESS` block |
| Google Maps link + embed | `BUSINESS.mapsLink` / `mapsEmbed` |
| Instagram / Facebook URLs | `BUSINESS.instagram` / `facebook` |
| **Pool and table-tennis prices** | `GAMES[1]` and `GAMES[2]` |
| Session lengths (`durationMin`) | each package in `GAMES` |
| Opening hours, lead time, fees | `BOOKING` |
| Reel links + videos | `REELS` and `public/assets/reel-*.mp4` |
| Domain in SEO tags | `index.html` and `SITE` in `src/data/schema.js` |

The cricket prices (₹75 / ₹99 / ₹199) are real. **The pool and table-tennis
prices are invented placeholders** — plausible numbers so the page renders
complete, but they are not yours. Replace them before anyone can see this.

**3. Decide how bookings get paid for.** The flow currently takes *requests* —
no payment, customer calls to confirm. See **The booking page** below before you
switch payments on. `LINKS.member` and `LINKS.membership` still point at routes
that don't exist yet.

---

## Structure

```
index.html                 SEO meta, Google Fonts, #root
.env                       Supabase creds for the live board (blank = off)
public/assets/             fga-logo.png (you add), reels + posters
src/
  main.jsx                 entry
  App.jsx                  section order; owns the live poll + pricing tab state
  styles/global.css        the whole design system, one file
  data/site.js             all copy — brand, games, prices, FAQs, contact
  data/schema.js           JSON-LD, generated from site.js
  lib/supabase.js          client, null when env vars are absent
  lib/liveTime.js          IST clock + slot-formatting helpers
  hooks/
    useReveal.js           scroll-in fade
    useScrolled.js         nav condense past 40px
    useCountUp.js          scoreboard counters, incl. the speed-gun overshoot
    useSpotlight.js        cursor-following card highlight (--mx/--my)
    useLiveQueue.js        live/closed state machine
  pages/
    Home.jsx               landing page
    Book.jsx               six-step booking flow
  lib/booking.js           slot grid, IST clock, validation, submit
  styles/book.css          booking-page styles
  components/              Nav, Hero, Ticker, Scoreboard, Arenas, LiveStatus,
                           Pricing, Location, Reels, Faq, Contact, Footer,
                           BookBar, Logo, Seo, Icons, Toast, BookingSuccess
```

## The design system

Everything lives in `src/styles/global.css`, driven by tokens on `:root`.

- **Ground** — cool graphite (`--void #06070a`), not warm black, with a fixed
  carbon-hex mesh laid under the whole page.
- **Chrome** — `--chrome` is the metal gradient. Put `class="chrome"` on any
  heading to render it in polished steel; it degrades to solid `--steel` where
  `background-clip:text` isn't supported, so headings never go invisible.
- **Two halves** — `--red` (cricket) and `--blue` (table tennis) split
  left/right, exactly as the badge does. They meet in the nav seam, the footer
  rule and the book bar.
- **Gold** — `--gold` is the tagline register: section eyebrows, prices, the
  diamond ornaments.
- **Angular panels** — cards use `clip-path` corner cuts rather than border
  radius, echoing the shield silhouette. `--notch` sets the size.
- **Type** — Teko for display, Barlow for body, Barlow Condensed for UI labels.

### Adding a fourth game

A game owns its colour through three CSS custom properties, so adding one is a
data change only — append to `GAMES` in `src/data/site.js` with `accent`,
`accentSoft` and `accentInk`. The arena card, the pricing tab, the hero chip and
the footer link all pick it up.

`accentInk` is the text colour used *on* the accent. Gold is light enough that
white fails contrast on it, so the pool arena inks dark (`#171104`); red and
blue ink white.

## The booking page

Six steps — game, package, date, time, details, confirm — with a progress rail
that ticks each one off. The page carries the selected game's `--accent`, so
choosing 8-Ball Pool turns the rail, slots and confirm button gold.

**Slots are generated, not stored.** `buildGrid` walks from `BOOKING.open` to
`BOOKING.close` in steps of the chosen package's `durationMin`, so a 10-minute
cricket package offers 10:30, 10:40, 10:50… and a 60-minute pool package offers
10:30, 11:30, 12:30… A slot only appears if it finishes before closing. Change
the hours or a `durationMin` in `src/data/site.js` and every time on the page
follows.

A slot is greyed out when it overlaps an existing booking, or when it's inside
`BOOKING.leadTimeMin` (90 minutes) of now — so nobody books a lane you can't
set up in time. All clock maths runs in IST composed from UTC, never the
visitor's timezone, so someone booking from abroad sees the same grid as
someone standing in the arena.

### Payment — read this before launch

`submitBooking` in `src/lib/booking.js` has two modes:

- **`request`** (current) — nothing is configured, so no money moves. The
  customer gets a reference and is told plainly that nothing has been charged
  and to call to confirm. It's a real fallback, not a fake success screen.
- **`paid`** — switches on when `VITE_RAZORPAY_KEY_ID` is set. The three steps
  are marked `TODO` in the file: hold the slot server-side, open checkout,
  confirm against the signed payload.

**Payment confirmation must be verified on your server.** Never let the browser
assert that a payment succeeded — anyone can forge that call. Until that
backend exists, leave the key unset and take booking requests.

To record requests somewhere staff can see them, POST the `booking` object at
the marked line before the `request` return.

### Availability

When Supabase is configured the page reads a `bookings` table (`date`,
`start_hhmm`, `end_hhmm`, `resource`, `status`) and subtracts those intervals.
`resource` is the game id, so the three arenas book independently. A failed
lookup logs and falls through to "nothing booked" rather than blocking the
customer — availability is advisory, and the server is what actually holds a
slot.

Note this does not yet model *multiple tables per game*. If you have three pool
tables, a single booking currently blocks that time for all of them. Add a
table count per game and compare against the number of overlapping bookings
when you wire the backend up.

## The live board

`useLiveQueue` reproduces a three-tier state machine:

1. a staff emergency shutdown (`is_arena_open` RPC returning `closed_for_day`),
2. otherwise the IST clock — outside opening hours the board flips to "closed"
   and previews the next trading day's confirmed bookings,
3. otherwise it polls the `live_queue_v` view every 30 seconds for who's playing
   and who's next.

Polling pauses while the tab is hidden and re-fires on focus. Every failure path
renders an empty state rather than stranding a `Loading…`. Names are masked
client-side (`Rahul Sharma` → `Rahul S.`) and the queries select no phone, email
or revenue columns.

**It is off by default.** `.env` ships blank, so `supabase` is `null` and the
board renders "Arena open / nobody on the clock". Fill in
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` when your backend is ready —
note the bundle grows by ~200 KB then, since the client is currently tree-shaken
out.

## Accessibility notes

- Pricing tabs use real `role="tablist"` / `aria-selected`.
- FAQ is native `<details>`/`<summary>` — keyboard support for free, and the
  answers stay in the DOM for crawlers.
- `prefers-reduced-motion` disables every animation and pins reveals visible.
- Text on accent colours goes through `--accent-ink` so nothing relies on white
  over a light accent.
