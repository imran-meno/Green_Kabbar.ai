import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PickupLocationMap from '../components/PickupLocationMap.jsx';
import { isSukkurLocation, isValidPhone } from '../utils/validation.js';

const materialIcons = { iron: '⌁', copper: '◉', aluminium: '▤', plastic: '♧', paper: '▱', cardboard: '▧', glass: '♢', ewaste: '⌘' };

function AnimatedAmount({ value }) {
  const [shown, setShown] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      previous.current = value;
      setShown(value);
      return undefined;
    }

    const from = previous.current;
    const start = performance.now();
    let frame;
    function animate(now) {
      const progress = Math.min((now - start) / 420, 1);
      const eased = 1 - ((1 - progress) ** 3);
      const next = Math.round(from + ((value - from) * eased));
      previous.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return shown.toLocaleString();
}

export default function SellPage() {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [predictor, setPredictor] = useState(null);
  const [consent, setConsent] = useState(false);
  const [weight, setWeight] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [location, setLocation] = useState(user?.location || null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookedOrderId, setBookedOrderId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  useEffect(() => {
    let active = true;
    api('/scrap/predictor-status')
      .then((status) => { if (active) setPredictor(status); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  function selectImage(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be 8 MB or smaller.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setPrediction(null);
    setError('');
  }

  function chooseImage(event) {
    selectImage(event.target.files?.[0]);
    event.target.value = '';
  }

  function dropImage(event) {
    event.preventDefault();
    setDragging(false);
    selectImage(event.dataTransfer.files?.[0]);
  }

  async function identify() {
    if (!image || !predictor) return;
    if (predictor.requiresConsent && !consent) {
      setError('Please consent to sending this photo to the configured AI provider.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', image);
      form.append('consent', consent ? 'true' : 'false');
      setPrediction(await api('/scrap/predict', { method: 'POST', form }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function bookPickup() {
    if (!isValidPhone(phone)) {
      setError('Enter a valid phone number so the collector can contact you.');
      return;
    }
    if (!address.trim()) {
      setError('Enter your street address.');
      return;
    }
    if (!isSukkurLocation(location)) {
      setError('Choose your pickup location on the Sukkur map.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const order = await api('/orders', { method: 'POST', body: { type: prediction.type, weightKg: weight, phone, address, location } });
      setBookedOrderId(order._id);
      setBookingComplete(true);
      setBusy(false);
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  const estimate = Math.round(Number(weight) * (prediction?.ratePerKg || 0));

  return (
    <>
    <section className="flow-page">
      <div className="flow-intro">
        <span className="eyebrow">YOUR SCRAP, YOUR CALL</span>
        <h1>Let’s see what<br /><span className="serif-accent">it’s worth.</span></h1>
        <p>Share a clear photo to get started. Review your estimate before you decide on a pickup.</p>
        <div className="flow-steps">
          <span className={prediction ? 'flow-complete' : 'flow-active'}>01 <small>Photo</small></span><i />
          <span className={prediction ? estimate > 0 ? 'flow-complete' : 'flow-active' : ''}>02 <small>Estimate</small></span><i />
          <span className={estimate > 0 ? 'flow-active' : ''}>03 <small>Pickup</small></span>
        </div>
      </div>
      <div className="sell-panel">
        <div className="sell-panel-heading"><span className="step-number">STEP 01</span><h2>What would you like to recycle?</h2><p>One material per photo works best.</p></div>
        {predictor?.provider === 'demo' && (
          <p className="demo-notice">Demo only: no image model is configured, so the estimate defaults to iron. Add <code>GEMINI_API_KEY</code> or configure <code>ML_URL</code> for image-based predictions.</p>
        )}
        {predictor?.provider === 'gemini' && (
          <div className="provider-disclosure">
            <b>Google Gemini free tier</b> sends this photo to Google. Free-tier content may be used to improve Google products and may be reviewed by people. Don’t include faces, addresses, documents, or other personal details. <a href="https://aistudio.google.com/docs/terms" target="_blank" rel="noreferrer">Review Google’s terms</a>.
          </div>
        )}
        {predictor?.provider === 'custom' && (
          <p className="provider-disclosure">This photo will be sent to the configured model service. Avoid including faces, addresses, documents, or other personal details.</p>
        )}
        <label
          className={`upload-area ${preview ? 'has-preview' : ''} ${dragging ? 'is-dragging' : ''}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
          }}
          onDrop={dropImage}
        >
          {preview ? (
            <div className={`upload-preview ${busy && !prediction ? 'is-scanning' : ''}`}>
              <img src={preview} alt="Selected scrap for identification" />
              {busy && !prediction && <><span className="scan-line" /><span className="scan-chip"><i />Reading your photo</span></>}
            </div>
          ) : <span className="upload-prompt"><span className="upload-icon">↥</span><b>Drop a photo here, or browse</b><small>JPG, PNG or WebP · up to 8 MB</small></span>}
          <input id="photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} />
        </label>
        {preview && <button className="change-photo" type="button" onClick={() => document.getElementById('photo-input')?.click()}>Choose a different photo</button>}
        {predictor?.requiresConsent && (
          <label className="consent-check">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
            <span>I agree to send this photo to the configured AI provider for scrap identification.</span>
          </label>
        )}
        {error && <div className="form-error" role="alert">{error}</div>}
        {!prediction && (
          <button className="button button-dark full-button" type="button" onClick={identify} disabled={!image || !predictor || busy || (predictor.requiresConsent && !consent)}>
            {busy ? <><span className="button-spinner" aria-hidden="true" />Identifying your scrap…</> : !predictor ? error ? 'Model setup unavailable' : 'Checking model setup…' : 'Identify my scrap'} {!busy && <span aria-hidden="true">↗</span>}
          </button>
        )}
        {prediction && (
          <div className="estimate-panel">
            <div className="estimate-result" aria-live="polite">
              <span className="material-icon mint">{materialIcons[prediction.type] || '♻'}</span>
              <div><span className="eyebrow">MATERIAL IDENTIFIED</span><h3>{prediction.type}</h3><p>Estimated rate <b className="money-value">Rs {Number(prediction.ratePerKg).toLocaleString()} / kg</b></p></div>
              <span className="confidence">{Math.round(prediction.confidence * 100)}%<small> model estimate</small></span>
            </div>
            {prediction.source === 'demo' && <p className="demo-notice">Demo placeholder only. This is not a prediction from your photo and must not be used for real pricing.</p>}
            {prediction.source === 'gemini' && <p className="model-note-light">AI classifications can be wrong. Confirm material and quality at pickup; the model confidence is not a guarantee.</p>}
            <label className="field-label">Approximate weight <span className="optional-label">kg</span><input type="number" min="0.1" step="0.1" placeholder="e.g. 5" value={weight} onChange={(event) => setWeight(event.target.value)} /></label>
            <label className="field-label">Phone number<input type="tel" autoComplete="tel" placeholder="03xx xxxxxxx" pattern="[0-9+() -]{7,20}" title="Enter a valid phone number." value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
            <div className="field-label pickup-location-field">
              Pickup location in Sukkur <span className="required-label">required</span>
              <p className="map-instructions">Tap the map to place your pickup pin. Map data by OpenStreetMap.</p>
              <PickupLocationMap location={location} onChange={setLocation} />
              <span className="map-selection" aria-live="polite">{location ? `Pin selected: ${location.lat}, ${location.lng}` : 'Select your location on the map'}</span>
            </div>
            <label className="field-label">Street address<input autoComplete="street-address" placeholder="Area, street, and house number" value={address} onChange={(event) => setAddress(event.target.value)} required /></label>
            {estimate > 0 && (
              <div className="estimate-total" aria-live="polite">
                <span>Your estimated total</span>
                <b className="money-value">Rs <AnimatedAmount value={estimate} /></b>
                <small>Calculated from weight × rate. Final amount confirmed at pickup.</small>
              </div>
            )}
            <button className="button button-dark full-button" type="button" onClick={bookPickup} disabled={busy || !(Number(weight) > 0) || !isValidPhone(phone) || !address.trim() || !isSukkurLocation(location)}>
              {busy ? 'Booking your pickup…' : 'Agree & book pickup'} <span aria-hidden="true">↗</span>
            </button>
            <button className="start-over" type="button" onClick={() => { setPrediction(null); setWeight(''); }}>Try another photo</button>
          </div>
        )}
        <p className="privacy-note"><span>⌑</span> Green Kabbar doesn’t save the uploaded image. External providers may process it; avoid personal details.</p>
      </div>
    </section>
    {bookingComplete && (
      <div className="booking-success-overlay">
        <section className="booking-success" role="dialog" aria-modal="true" aria-labelledby="booking-success-title">
          <div className="booking-animation" aria-hidden="true">
            <span className="booking-spark booking-spark-one">✦</span>
            <span className="booking-spark booking-spark-two">✳</span>
            <div className="booking-box"><span>↻</span><i /></div>
            <img className="booking-scrap-image" src={preview} alt="" />
          </div>
          <span className="eyebrow">PICKUP CONFIRMED</span>
          <h2 id="booking-success-title">Good things deserve<br /><span className="serif-accent">a second life.</span></h2>
          <p>Thanks for choosing Green Kabbar. Your scrap is on its way to a new purpose, and your pickup is booked.</p>
          <blockquote>“Small choices today make a cleaner Sukkur tomorrow.”</blockquote>
          <div className="booking-success-actions">
            <Link to={`/track/${bookedOrderId}`} className="button button-dark">Track my pickup <span aria-hidden="true">↗</span></Link>
            <Link to="/orders" className="text-link">My pickups</Link>
          </div>
        </section>
      </div>
    )}
    </>
  );
}
