import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE_URL, api, tok } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function TrackPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    let socket;
    api(`/orders/${id}`)
      .then((data) => {
        if (!active) return;
        setOrder(data);
        socket = API_BASE_URL ? io(API_BASE_URL) : io();
        socket.on('connect_error', () => setError('Pickup updates are temporarily unavailable.'));
        socket.on('tracking_error', (message) => setError(message.error));
        socket.on('pos', setPosition);
        socket.emit('track', { id, token: tok() });
      })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [id, user]);

  if (!user) return <Navigate to="/login" replace />;
  if (error && !order) return <section className="track-page"><div className="form-error" role="alert">{error}</div><Link to="/orders" className="text-link">Back to my pickups ↗</Link></section>;
  if (!order) return <section className="track-page"><p className="loading-message">Loading your pickup…</p></section>;

  const progress = position?.progress || 0;
  const riderX = 12 + progress * 66;
  const riderY = 76 - progress * 52;
  const arrived = position?.status === 'arrived' || order.status === 'arrived';

  return (
    <section className="track-page">
      <Link to="/orders" className="back-link">← All pickups</Link>
      <div className="track-heading"><span className="eyebrow">PICKUP DETAILS</span><h1>Your scrap is<br /><span className="serif-accent">on its way.</span></h1><p>Pickup reference <b>#{order._id.slice(-6).toUpperCase()}</b></p></div>
      <div className="track-summary">
        <div><span className="eyebrow">YOUR ESTIMATED TOTAL</span><b className="money-value">Rs {Number(order.total).toLocaleString()}</b><small>{order.weightKg} kg of {order.type}</small></div>
        <div><span className="eyebrow">PICKUP WINDOW</span><b>Within {order.pickupDays} day{order.pickupDays === 1 ? '' : 's'}</b><small>{order.address}</small></div>
      </div>
      <div className="tracking-card">
        <div className="tracking-card-heading"><div><span className="eyebrow">{arrived ? 'PICKUP COMPLETE' : 'PICKUP STATUS'}</span><h2>{arrived ? 'Your collector has arrived.' : 'We’re getting things ready.'}</h2></div><span className="live-tag"><i /> {arrived ? 'ARRIVED' : 'SCHEDULED'}</span></div>
        <div className="route-map" role="img" aria-label="Illustrated pickup route preview">
          <div className="map-street street-one" /><div className="map-street street-two" /><div className="map-street street-three" />
          <svg viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true"><path d="M12 76 C28 72 22 38 44 43 S61 61 78 28 S85 18 90 14" className="map-route" /></svg>
          <span className="map-pin map-start">●</span><span className="map-pin map-home">⌂</span>
          <span className="map-rider" style={{ left: `${riderX}%`, top: `${riderY}%` }}>↗</span>
          <span className="map-label label-start">PICKUP POINT</span><span className="map-label label-home">YOU</span>
          <span className="map-hill hill-one" /><span className="map-hill hill-two" />
        </div>
        <div className="collector-row"><span className="collector-avatar">GK</span><span><b>{order.collector?.name || 'Your Green Kabbar collector'}</b><small>{arrived ? 'Ready to collect your scrap' : 'Assigned to your pickup'}</small></span>{order.collector?.phone && <a className="call-collector" href={`tel:${order.collector.phone}`}>Call ↗</a>}</div>
        <p className="tracking-disclaimer">{error || 'Route preview is simulated for this demo; live GPS appears when a collector app is connected.'}</p>
      </div>
    </section>
  );
}
