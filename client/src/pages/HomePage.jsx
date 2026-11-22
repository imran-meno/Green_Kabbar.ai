import { Link } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter.jsx';
import AnimatedScene from '../components/AnimatedScene.jsx';

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light"><span className="status-dot" /> A cleaner Sukkur starts at home</span>
            <h1>That old stuff?<br />It’s <span>worth something.</span></h1>
            <p>Sell your scrap from your doorstep. Get a clear price, book a pickup, and give good materials a second life.</p>
            <div className="hero-actions">
              <Link to="/sell" className="button button-lime">Get my scrap price <span aria-hidden="true">↗</span></Link>
              <Link to="/how-it-works" className="text-link text-link-light">See how it works <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="hero-proof"><span className="avatar-stack"><i>G</i><i>K</i><i>+</i></span><span>Easy pickup. Fair value. Less waste.</span></div>
          </div>
          <div className="hero-art"><AnimatedScene scene="home" /></div>
        </div>
        <div className="hero-bottom"><span>RECYCLE WITH PURPOSE</span><span>01 — 04</span></div>
      </section>

      <section className="trust-strip" aria-label="Our service promise">
        <div><span className="trust-icon">◎</span><span><b>Upfront estimates</b><small>Know your rate first</small></span></div>
        <div><span className="trust-icon">⌂</span><span><b>Doorstep pickup</b><small>No trips to the yard</small></span></div>
        <div><span className="trust-icon">↻</span><span><b>Better reuse</b><small>Keep useful things in use</small></span></div>
      </section>

      <section className="closing-cta">
        <div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Make room for<br /><span className="serif-accent">something better.</span></h2></div>
        <div>
          <div className="home-page-links">
            <Link to="/sell" className="button">Start with a photo <span aria-hidden="true">↗</span></Link>
            <Link to="/rates" className="text-link">See scrap rates</Link>
          </div>
        </div>
        <span className="cta-flower" aria-hidden="true">✳</span>
      </section>
      <SiteFooter />
    </div>
  );
}
