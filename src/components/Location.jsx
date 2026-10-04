import { useReveal } from '../hooks/useReveal.js';
import { BRAND, BUSINESS } from '../data/site.js';

export default function Location() {
  const [ref, cls] = useReveal('map-grid');

  return (
    <section className="block" id="location">
      <div className="wrap">
        <div className={cls} ref={ref}>
          <div className="map-info">
            <span className="sec-tag">Find us</span>
            <h2 className="chrome">Easy to reach.</h2>
            <p>
              Drop in, pick your game and play. Open daily, {BUSINESS.hoursShort}. Tap below for
              turn-by-turn directions straight to the arena.
            </p>
            <div className="map-addr">
              {BUSINESS.addressLines[0]}
              <br />
              {BUSINESS.addressLines[1]}
            </div>
            <a className="btn btn-blue" href={BUSINESS.mapsLink} target="_blank" rel="noopener">
              Get directions <span className="arr">→</span>
            </a>
          </div>

          <div className="map-frame">
            {/* Sits behind the iframe — if the embed is blocked (privacy
                extensions, no network) the visitor still gets a tappable card. */}
            <a
              className="map-fallback"
              href={BUSINESS.mapsLink}
              target="_blank"
              rel="noopener"
              aria-hidden="true"
            >
              <span className="map-pin">⌖</span>
              <span className="map-fb-title">{BRAND.name}</span>
              <span className="map-fb-sub">{BUSINESS.addressOneLine}</span>
              <span className="map-fb-cta">Open in Google Maps →</span>
            </a>
            <iframe
              title={`${BRAND.name} location on Google Maps`}
              src={BUSINESS.mapsEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
