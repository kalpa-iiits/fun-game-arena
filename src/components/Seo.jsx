import { useEffect } from 'react';
import { faqSchema, localBusinessSchema, siteSchema } from '../data/schema.js';

/**
 * Injects the three JSON-LD blocks the original page ships in <head>.
 *
 * Note this runs client-side: Google executes JS and will pick it up, but if
 * you ever need the markup in the raw HTML response, move these blocks into
 * index.html or pre-render the page.
 */
export default function Seo() {
  useEffect(() => {
    const blocks = [localBusinessSchema, faqSchema, siteSchema];
    const nodes = blocks.map((data) => {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.textContent = JSON.stringify(data);
      document.head.appendChild(el);
      return el;
    });
    return () => nodes.forEach((el) => el.remove());
  }, []);

  return null;
}
