import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Injects the public site URL into the canonical and Open Graph tags.
 *
 * These have to live in the static HTML: WhatsApp, Instagram and Facebook
 * scrape link previews without running JavaScript, so setting them at runtime
 * would mean no preview card when someone shares the site.
 *
 * When VITE_SITE_URL is absent we drop those tags rather than emitting a
 * wrong URL — and, importantly, rather than failing the build. (Vite's own
 * %VAR% syntax can't do this: an unsubstituted %VAR% reaches decodeURI and
 * throws "URI malformed", which is exactly how this bit this project.)
 */
function siteUrl(url) {
  return {
    name: 'inject-site-url',
    transformIndexHtml(html) {
      if (url) return html.split('__SITE_URL__').join(url);
      console.warn(
        '\n[build] VITE_SITE_URL is not set — canonical and Open Graph URL tags omitted.' +
          '\n        Set it in your host\'s environment variables to get link previews.\n'
      );
      return html
        .split('\n')
        .filter((line) => !line.includes('__SITE_URL__'))
        .join('\n');
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const raw = env.VITE_SITE_URL || process.env.VITE_SITE_URL || '';

  return {
    plugins: [react(), siteUrl(raw.trim().replace(/\/+$/, ''))],
    server: { port: 5173, open: true },
  };
});
