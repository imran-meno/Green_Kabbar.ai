import { Link } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter.jsx';

const steps = [
  { number: '01', title: 'Show us your scrap', copy: 'Upload a clear photo of the recyclable items you want to sell.', icon: '↥' },
  { number: '02', title: 'Get an estimate', copy: 'Review the material and estimated value before booking.', icon: '◈' },
  { number: '03', title: 'Choose your pickup point', copy: 'Pin your location in Sukkur, add your street address, and phone number.', icon: '⌖' },
  { number: '04', title: 'We come to you', copy: 'Track your pickup. Final weight and payment are confirmed at collection.', icon: '↗' },
];

export default function HowItWorksPage() {
  return (
    <div className="information-page how-page">
      <header className="information-heading">
        <span className="eyebrow">HOW GREEN KABBAR WORKS</span>
        <h1>Four simple steps.<br /><span className="serif-accent">A lighter footprint.</span></h1>
        <p>Turn unwanted scrap into value without making a trip to the yard.</p>
      </header>
      <section className="section how-section" aria-label="Pickup steps">
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <div className="step-card-top"><span className="step-icon">{step.icon}</span><span className="step-number">{step.number}</span></div>
              <h3>{step.title}</h3><p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="information-cta"><p>Ready to give your scrap a second life?</p><Link to="/sell" className="button">Start a pickup <span aria-hidden="true">↗</span></Link></div>
      <SiteFooter />
    </div>
  );
}
