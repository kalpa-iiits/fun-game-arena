import { Fragment } from 'react';
import { TICKER_ITEMS } from '../data/site.js';

/* The track holds the list twice — the CSS slides it -50% for a seamless
   loop, so don't drop the duplicate. Gold diamonds separate the items. */
function Strip() {
  return (
    <span>
      {TICKER_ITEMS.map((item, i) => (
        <Fragment key={i}>
          <i />
          {item}
        </Fragment>
      ))}
      <i />
    </span>
  );
}

export default function Ticker() {
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        <Strip />
        <Strip />
      </div>
    </div>
  );
}
