import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PickupLocationMap from '../components/PickupLocationMap.jsx';
import AnimatedScene from '../components/AnimatedScene.jsx';
import { isSukkurLocation } from '../utils/validation.js';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '', email: '', password: '' });
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (isRegister && !isSukkurLocation(location)) {
      setError('Choose your pickup location on the Sukkur map.');
      return;
    }
    setBusy(true);
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: { ...form, location } });
      login(data);
      navigate(data.user.role === 'admin' ? '/admin' : isRegister ? '/sell' : '/account');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-aside">
        <span className="eyebrow eyebrow-light">A BETTER KIND OF PICKUP</span>
        <h1>{isRegister ? <>Good things<br />start <em>right here.</em></> : <>Welcome<br /><em>back.</em></>}</h1>
        <p>Make your next pickup simple. See your orders, check your estimate, and keep useful materials in circulation.</p>
        <AnimatedScene className="auth-scene" scene={isRegister ? 'register' : 'login'} />
        <div className="auth-aside-note"><span>✳</span> Small steps make a cleaner city.</div>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-form-heading">
          <span className="eyebrow">{isRegister ? 'JOIN GREEN KABBAR' : 'YOUR GREEN KABBAR ACCOUNT'}</span>
          <h2>{isRegister ? 'Create your account' : 'Sign in to continue'}</h2>
          <p>{isRegister ? 'A few details and you’re ready to go.' : 'Your next pickup is just around the corner.'}</p>
        </div>
        {error && <div className="form-error error-shake" role="alert">{error}</div>}
        {isRegister && (
          <>
            <label className="field-label">Full name<input name="name" autoComplete="name" placeholder="Enter Your Name" value={form.name} onChange={update} required /></label>
            <label className="field-label">Phone number<input name="phone" type="tel" autoComplete="tel" placeholder="03xx xxxxxxx" pattern="[0-9+() -]{7,20}" title="Enter a valid phone number." value={form.phone} onChange={update} required /></label>
            <div className="field-label pickup-location-field">
              Pickup location in Sukkur <span className="required-label">required</span>
              <p className="map-instructions">Tap the map to place your pickup pin. Map data by OpenStreetMap.</p>
              <PickupLocationMap location={location} onChange={setLocation} />
              <span className="map-selection" aria-live="polite">{location ? `Pin selected: ${location.lat}, ${location.lng}` : 'Select your location on the map'}</span>
            </div>
            <label className="field-label">Street address<input name="address" autoComplete="street-address" placeholder="Area, street, and house number" value={form.address} onChange={update} required /></label>
          </>
        )}
        <label className="field-label">Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={update} required /></label>
        <label className="field-label">Password<input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder={isRegister ? 'At least 6 characters' : 'Your password'} minLength={isRegister ? 6 : undefined} value={form.password} onChange={update} required /></label>
        <button className="button button-dark auth-submit" disabled={busy}>
          {busy ? <><span className="button-spinner" aria-hidden="true" />{isRegister ? 'Creating account…' : 'Signing in…'}</> : <>{isRegister ? 'Create account' : 'Log in'} <span aria-hidden="true">↗</span></>}
        </button>
        <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to Green Kabbar?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link></p>
      </form>
    </section>
  );
}
