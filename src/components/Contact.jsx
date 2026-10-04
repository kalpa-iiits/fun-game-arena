import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal.js';
import Logo from './Logo.jsx';
import { FacebookIcon, InstagramIcon } from './Icons.jsx';
import { BUSINESS, LINKS } from '../data/site.js';

export default function Contact() {
  const [headRef, headCls] = useReveal();
  const [cardRef, cardCls] = useReveal('contact-card');
  const [ctaRef, ctaCls] = useReveal('contact-cta');

  return (
    <section className="block" id="contact">
      <div className="wrap">
        <div className={`sec-head ${headCls}`} ref={headRef}>
          <span className="sec-tag">Get in touch</span>
          <h2 className="chrome">Come play with us.</h2>
          <p>
            Questions about a session, a group booking or directions? Reach us any way you like.
          </p>
        </div>

        <div className="contact-grid">
          <div className={cardCls} ref={cardRef}>
            <h3>Contact details</h3>

            <div className="cinfo">
              <div className="crow">
                <div className="ic">⌖</div>
                <div className="ct">
                  <small>Address</small>
                  <span>{BUSINESS.addressOneLine}</span>
                </div>
              </div>
              <div className="crow">
                <div className="ic">☎</div>
                <div className="ct">
                  <small>Phone</small>
                  <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
                </div>
              </div>
              {BUSINESS.email && (
                <div className="crow">
                  <div className="ic">✉</div>
                  <div className="ct">
                    <small>Email</small>
                    <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
                  </div>
                </div>
              )}
              <div className="crow">
                <div className="ic">◷</div>
                <div className="ct">
                  <small>Hours</small>
                  <span>{BUSINESS.hours}</span>
                </div>
              </div>
            </div>

            <div className="socials">
              <a href={BUSINESS.instagram} target="_blank" rel="noopener" aria-label="Instagram">
                <InstagramIcon />
                Instagram
              </a>
              <a href={BUSINESS.facebook} target="_blank" rel="noopener" aria-label="Facebook">
                <FacebookIcon />
                Facebook
              </a>
            </div>
          </div>

          <div className={ctaCls} ref={ctaRef}>
            <Logo height={120} fallbackSize={40} />
            <h3 className="chrome">Ready to take your shot?</h3>
            <p>
              Pick a game, lock a slot in under a minute — or just walk in and play whatever&apos;s
              free.
            </p>
            <Link className="btn btn-primary" to={LINKS.book}>
              Book your session <span className="arr">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
