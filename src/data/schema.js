/* JSON-LD structured data — injected once by <Seo />.
   Address, geo and phone all come from site.js so they cannot drift apart. */

import { BRAND, BUSINESS, FAQS, GAMES } from './site.js';

// Set VITE_SITE_URL in .env and in your host's environment variables.
// Falls back to whatever origin the page is served from, so a preview
// deploy never advertises the production URL to crawlers.
const SITE = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

/* Declared once so the LocalBusiness and Organization nodes can never
   disagree — Google treats a mismatch as a weaker trust signal. */
const POSTAL_ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'Loknath Path, 23 Lokhra Road, opposite HP Petrol Pump',
  addressLocality: BUSINESS.locality,
  addressRegion: BUSINESS.region,
  postalCode: BUSINESS.postalCode,
  addressCountry: 'IN',
};

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'SportsActivityLocation',
  '@id': `${SITE}/#business`,
  name: BRAND.name,
  alternateName: [BRAND.short, 'FGA Arena'],
  slogan: BRAND.tagline,
  description:
    'Fun Game Arena is an indoor games arena with three attractions under one roof: cricket nets driven by a high-speed bowling machine with adjustable speed, spin and swing; 8-ball pool on tournament-cloth tables; and match-spec table tennis. Suitable for all ages and genders. Walk in or book online.',
  url: `${SITE}/`,
  telephone: BUSINESS.phoneHref.replace('tel:', ''),
  ...(BUSINESS.email ? { email: BUSINESS.email } : {}),
  currenciesAccepted: 'INR',
  priceRange: '₹₹',
  address: POSTAL_ADDRESS,
  // Coordinates matter for "near me" searches — Google ranks on proximity.
  geo: {
    '@type': 'GeoCoordinates',
    latitude: BUSINESS.geo.lat,
    longitude: BUSINESS.geo.lng,
  },
  areaServed: [
    { '@type': 'City', name: 'Guwahati' },
    { '@type': 'Place', name: 'Lal Ganesh' },
    { '@type': 'Place', name: 'Lokhra' },
    { '@type': 'Place', name: 'Kahilipara' },
    { '@type': 'Place', name: 'Beltola' },
    { '@type': 'Place', name: 'Dispur' },
    { '@type': 'AdministrativeArea', name: 'Kamrup Metropolitan' },
  ],
  hasMap: BUSINESS.mapsLink,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '18:00',
      closes: '23:30',
    },
  ],
  logo: { '@type': 'ImageObject', url: `${SITE}/assets/fga-logo.png` },
  image: { '@type': 'ImageObject', url: `${SITE}/assets/fga-logo.png` },
  sameAs: [BUSINESS.instagram, BUSINESS.facebook],
  sport: ['Cricket', 'Billiards', 'Table Tennis'],
  additionalType: 'https://schema.org/EntertainmentBusiness',
  paymentAccepted: 'Cash, UPI, Credit Card, Debit Card',
  publicAccess: true,
  isAccessibleForFree: false,
  smokingAllowed: false,
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: 'Indoor cricket nets', value: true },
    {
      '@type': 'LocationFeatureSpecification',
      name: 'Bowling machine (130+ km/h, spin & swing)',
      value: true,
    },
    { '@type': 'LocationFeatureSpecification', name: '8-ball pool tables', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Table tennis tables', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Equipment provided', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Online booking', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Walk-ins welcome', value: true },
  ],
  potentialAction: {
    '@type': 'ReserveAction',
    name: 'Book a session',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE}/book.html`,
      actionPlatform: [
        'https://schema.org/DesktopWebPlatform',
        'https://schema.org/MobileWebPlatform',
      ],
    },
    result: { '@type': 'Reservation', name: 'Indoor games session booking' },
  },
  // One Offer per package across all three arenas, generated from site.js so
  // the schema can never drift from the prices actually on the page.
  makesOffer: GAMES.flatMap((game) =>
    game.packages.map((pkg) => ({
      '@type': 'Offer',
      name: `${game.name} — ${pkg.qty} ${pkg.unit}`,
      price: pkg.price.replace(/[^\d.]/g, ''),
      priceCurrency: 'INR',
      url: `${SITE}/book.html?game=${game.id}&pkg=${pkg.slug}`,
      availability: 'https://schema.org/InStock',
    }))
  ),
};

/* Built from the same FAQS array the accordion renders, so the two can never
   drift apart. */
export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export const siteSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: BRAND.name,
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: BRAND.name,
      alternateName: [BRAND.short, 'Fun Game Arena'],
      url: `${SITE}/`,
      logo: `${SITE}/assets/fga-logo.png`,
      ...(BUSINESS.email ? { email: BUSINESS.email } : {}),
      telephone: BUSINESS.phoneHref.replace('tel:', ''),
      address: POSTAL_ADDRESS,
      sameAs: [BUSINESS.instagram, BUSINESS.facebook],
    },
    {
      '@type': 'WebPage',
      '@id': `${SITE}/#webpage`,
      url: `${SITE}/`,
      name: `${BRAND.name} | Indoor Cricket Nets, 8-Ball Pool & Table Tennis`,
      isPartOf: { '@id': `${SITE}/#website` },
      about: { '@id': `${SITE}/#business` },
      inLanguage: 'en-IN',
    },
  ],
};
