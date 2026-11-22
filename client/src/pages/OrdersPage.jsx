import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const materialIcons = { iron: '⌁', copper: '◉', aluminium: '▤', plastic: '♧', paper: '▱', cardboard: '▧', glass: '♢', ewaste: '⌘' };

function expectedPickupDate(order) {
  const date = new Date(order.createdAt);
  date.setDate(date.getDate() + Number(order.pickupDays));
  return date.toLocaleDateString();
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    let active = true;
    api('/orders')
      .then((data) => { if (active) setOrders(data); })
      .catch((requestError) => { if (active) setError(requestError.message); });
    return () => { active = false; };
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <section className="orders-page">
      <div className="orders-heading"><div><span className="eyebrow">YOUR PICKUPS</span><h1>Good to see you,<br /><span className="serif-accent">{user.name.split(' ')[0]}.</span></h1></div><Link to="/sell" className="button button-dark">New pickup <span aria-hidden="true">↗</span></Link></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {!error && orders.length === 0 && <div className="empty-orders"><span>✳</span><h2>No pickups yet.</h2><p>Your first scrap pickup is just a photo away.</p><Link to="/sell" className="button button-dark">Get a scrap estimate <span aria-hidden="true">↗</span></Link></div>}
      {orders.length > 0 && <div className="orders-list">{orders.map((order) => (
        <article className="order-card" key={order._id}>
          <div className="order-material material-icon mint">{materialIcons[order.type] || '♻'}</div>
          <div className="order-info"><span className="eyebrow">PICKUP · {new Date(order.createdAt).toLocaleDateString()}</span><h2>{order.type} <span>· {order.weightKg} kg</span></h2><p>{order.status === 'arrived' ? 'Completed' : `Expected by ${expectedPickupDate(order)}`} · {order.address}</p></div>
          <div className="order-value"><b className="money-value">Rs {Number(order.total).toLocaleString()}</b><span className={`order-status status-${order.status}`}>{order.status.replace('_', ' ')}</span></div>
          <Link className="order-arrow" to={`/track/${order._id}`} aria-label={`View ${order.type} pickup`}>↗</Link>
        </article>
      ))}</div>}
    </section>
  );
}
