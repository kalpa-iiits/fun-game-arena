import { useState } from 'react';
import Seo from '../components/Seo.jsx';
import Nav from '../components/Nav.jsx';
import Hero from '../components/Hero.jsx';
import Ticker from '../components/Ticker.jsx';
import Scoreboard from '../components/Scoreboard.jsx';
import Arenas from '../components/Arenas.jsx';
import Availability from '../components/Availability.jsx';
import Pricing from '../components/Pricing.jsx';
import Location from '../components/Location.jsx';
import Reels from '../components/Reels.jsx';
import Faq from '../components/Faq.jsx';
import Contact from '../components/Contact.jsx';
import Footer from '../components/Footer.jsx';
import BookBar from '../components/BookBar.jsx';
import { GAMES } from '../data/site.js';

export default function Home() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Which pricing tab is open. Lifted so an arena card can deep-link into it.
  const [activeGame, setActiveGame] = useState(GAMES[0].id);

  return (
    <>
      <Seo />
      <Nav drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
      <Hero />
      <Ticker />
      <Scoreboard />
      <Arenas onPick={setActiveGame} />
      <Availability />
      <Pricing active={activeGame} setActive={setActiveGame} />
      <Location />
      <Reels />
      <Faq />
      <Contact />
      <Footer />
      <BookBar />
    </>
  );
}
