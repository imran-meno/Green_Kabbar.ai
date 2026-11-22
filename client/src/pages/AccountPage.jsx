import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function expectedPickupDate(order) {
  const date = new Date(order.createdAt);
  date.setDate(date.getDate() + Number(order.pickupDays));
  return date.toLocaleDateString();
}

export default function AccountPage() {
  const { user, authReady } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role === 'admin') return undefined;
    let active = true;
    api('/orders')
      .then((data) => { if (active) setOrders(data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  if (!authReady) return <section className="account-page"><p className="loading-message">Loading your account…</p></section>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;

  const pendingOrders = orders.filter((order) => order.status !== 'arrived');
  const completedOrders = orders.length - pendingOrders.length;

  return (
    <section className="account-page">
      <div className="account-heading">
        <div>
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1>Welcome back,<br /><span className="serif-accent">{user.name.split(' ')[0]}.</span></h1>
          <p>Keep track of your pickups and see when each one is expected.</p>
        </div>
        <Link to="/sell" className="button button-dark">Schedule a pickup <span aria-hidden="true">↗</span></Link>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="account-stats" aria-label="Pickup summary">
        <article className="account-stat"><span className="eyebrow">TOTAL PICKUPS</span><strong>{loading ? '—' : orders.length}</strong><span>All your orders</span></article>
        <article className="account-stat"><span className="eyebrow">PENDING</span><strong>{loading ? '—' : pendingOrders.length}</strong><span>Awaiting collection</span></article>
        <article className="account-stat"><span className="eyebrow">COMPLETED</span><strong>{loading ? '—' : completedOrders}</strong><span>Successfully collected</span></article>
      </div>

      <div className="account-content">
        <section className="account-panel">
          <div className="account-panel-heading">
            <div><span className="eyebrow">UP NEXT</span><h2>Pending pickup dates</h2></div>
            <Link to="/orders" className="text-link">All pickups ↗</Link>
          </div>
          {loading && <p className="account-empty">Loading your pickups…</p>}
          {!loading && !error && pendingOrders.length === 0 && (
            <p className="account-empty">No pending pickups. Schedule one whenever you’re ready.</p>
          )}
          {!loading && pendingOrders.length > 0 && (
            <div className="pending-list">
              {pendingOrders.slice(0, 5).map((order) => (
                <Link className="pending-item" key={order._id} to={`/track/${order._id}`}>
                  <span className="pending-date">{expectedPickupDate(order)}</span>
                  <span className="pending-description"><b>{order.type} · {order.weightKg} kg</b><small>{order.address}</small></span>
                  <span className={`order-status status-${order.status}`}>{order.status.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="account-panel account-profile">
          <span className="eyebrow">PROFILE DETAILS</span>
          <h2>{user.name}</h2>
          <dl>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Phone</dt><dd>{user.phone || 'Not provided'}</dd></div>
            <div><dt>Pickup address</dt><dd>{user.address || 'Add an address when scheduling a pickup'}</dd></div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
