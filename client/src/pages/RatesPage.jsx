import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import SiteFooter from '../components/SiteFooter.jsx';

const materials = [
  { id: 'iron', label: 'Iron', icon: '⌁', color: 'mint' },
  { id: 'copper', label: 'Copper', icon: '◉', color: 'peach' },
  { id: 'aluminium', label: 'Aluminium', icon: '▤', color: 'sky' },
  { id: 'plastic', label: 'Plastic', icon: '♧', color: 'lilac' },
  { id: 'paper', label: 'Paper', icon: '▱', color: 'butter' },
  { id: 'cardboard', label: 'Cardboard', icon: '▧', color: 'peach' },
  { id: 'glass', label: 'Glass', icon: '♢', color: 'sky' },
  { id: 'ewaste', label: 'E-waste', icon: '⌘', color: 'lilac' },
];

export default function RatesPage() {
  const [rates, setRates] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api('/rates')
      .then((data) => { if (active) setRates(data); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  return (
    <div className="information-page rates-page">
      <header className="information-heading">
        <span className="eyebrow">CLEAR, UPFRONT ESTIMATES</span>
        <h1>Know what your<br /><span className="serif-accent">scrap is worth.</span></h1>
        <p>Indicative Green Kabbar rates in PKR per kilogram. Final value depends on material quality and the confirmed weight at collection.</p>
      </header>
      <section className="rates-page-content">
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="materials-grid">
          {materials.map((material, index) => (
            <article className="material-card" key={material.id} style={{ '--reveal-delay': `${index * 55}ms` }}>
              <span className={`material-icon ${material.color}`}>{material.icon}</span>
              <span className="material-name">{material.label}</span>
              <span className="material-price">{rates ? <>Rs {Number(rates[material.id]).toLocaleString()}<small> / kg</small></> : '—'}</span>
            </article>
          ))}
        </div>
        <p className="rates-note">Rates are estimates. Confirm the final price with your collector at pickup.</p>
        <Link to="/sell" className="button">Get my scrap estimate <span aria-hidden="true">↗</span></Link>
      </section>
      <SiteFooter />
    </div>
  );
}
