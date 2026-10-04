import { useReveal } from '../hooks/useReveal.js';
import { FAQS } from '../data/site.js';

/**
 * Native <details>/<summary> — free keyboard support, and the answers stay in
 * the DOM for crawlers. The rotating gold "+" is CSS on `.faq[open]`.
 */
export default function Faq() {
  const [headRef, headCls] = useReveal();
  const [listRef, listCls] = useReveal('faq-list');

  return (
    <section className="block" id="faq">
      <div className="wrap">
        <div className={`sec-head center ${headCls}`} ref={headRef}>
          <span className="sec-tag">Good to know</span>
          <h2 className="chrome">Questions, answered.</h2>
        </div>

        <div className={listCls} ref={listRef}>
          {FAQS.map((item) => (
            <details className="faq" key={item.q}>
              <summary>
                {item.q} <span className="plus">+</span>
              </summary>
              <div className="ans">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
