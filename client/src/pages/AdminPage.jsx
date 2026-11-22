import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

function expectedPickupDate(order) {
  const date = new Date(order.createdAt);
  date.setDate(date.getDate() + Number(order.pickupDays));
  return date.toLocaleDateString();
}

export default function AdminPage() {
  const { user, authReady } = useAuth();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady || !user || user.role !== 'admin') return undefined;
    let active = true;
    api('/admin/dashboard')
      .then((data) => {
        if (!active) return;
        setOrders(data.orders);
        setUsers(data.users);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.status === 403) setAccessDenied(true);
        else if (requestError.status === 401) setSessionExpired(true);
        else setError(requestError.message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authReady, user]);

  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders.filter((order) => {
      const customer = order.user;
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesSearch = !search || [
        order._id,
        order.type,
        customer?.name,
        customer?.email,
        order.phone,
        customer?.phone,
      ].some((value) => String(value || '').toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
  }, [orders, query, statusFilter]);

  if (!authReady) return <section className="admin-page"><p className="loading-message">Checking your administrator access…</p></section>;
  if (!user) return <Navigate to="/login" replace />;
  if (sessionExpired) return <Navigate to="/login" replace />;
  if (accessDenied || user.role !== 'admin') return <Navigate to="/account" replace />;

  const pendingCount = orders.filter((order) => order.status !== 'arrived').length;
  const completedCount = orders.length - pendingCount;

  async function updateStatus(orderId, status) {
    setError('');
    setUpdatingOrder(orderId);
    try {
      const updated = await api(`/admin/orders/${orderId}`, { method: 'PATCH', body: { status } });
      setOrders((current) => current.map((order) => order._id === orderId ? updated : order));
    } catch (requestError) {
      if (requestError.status === 403) setAccessDenied(true);
      else if (requestError.status === 401) setSessionExpired(true);
      else setError(requestError.message);
    } finally {
      setUpdatingOrder('');
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div><span className="eyebrow">GREEN KABBAR · ADMIN</span><h1>Pickup overview.</h1><p>Manage orders, review pickup details, and keep customer records close.</p></div>
        <Link to="/" className="text-link">View website ↗</Link>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="admin-stats" aria-label="Admin overview">
        <article className="admin-stat"><span className="eyebrow">ALL PICKUPS</span><strong>{loading || error ? '—' : orders.length}</strong></article>
        <article className="admin-stat"><span className="eyebrow">PENDING</span><strong>{loading || error ? '—' : pendingCount}</strong></article>
        <article className="admin-stat"><span className="eyebrow">COMPLETED</span><strong>{loading || error ? '—' : completedCount}</strong></article>
        <article className="admin-stat"><span className="eyebrow">CUSTOMERS</span><strong>{loading || error ? '—' : users.length}</strong></article>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div><span className="eyebrow">ORDER MANAGEMENT</span><h2>All pickups</h2></div>
          <div className="admin-filters">
            <label className="admin-search"><span className="visually-hidden">Search pickups</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer or order" /></label>
            <label className="admin-status-filter"><span className="visually-hidden">Filter by pickup status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="scheduled">Scheduled</option><option value="on_the_way">On the way</option><option value="arrived">Arrived</option></select></label>
          </div>
        </div>
        {loading && <p className="account-empty">Loading admin dashboard…</p>}
        {!loading && !error && filteredOrders.length === 0 && <p className="account-empty">No pickups match your search.</p>}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Pickup</th><th>Customer</th><th>Material</th><th>Total</th><th>Status</th><th>Details</th></tr></thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <FragmentRow
                    key={order._id}
                    order={order}
                    expanded={expandedOrder === order._id}
                    updating={updatingOrder === order._id}
                    onToggle={() => setExpandedOrder((current) => current === order._id ? '' : order._id)}
                    onStatusChange={(status) => updateStatus(order._id, status)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-panel admin-customers">
        <div className="admin-panel-heading">
          <div><span className="eyebrow">CUSTOMER DIRECTORY</span><h2>Customers</h2></div>
          <span className="admin-record-count">{users.length} accounts</span>
        </div>
        {loading && <p className="account-empty">Loading customers…</p>}
        {!loading && !error && users.length === 0 && <p className="account-empty">No customer accounts yet.</p>}
        {!loading && !error && users.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table customer-table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Pickups</th></tr></thead>
              <tbody>{users.map((customer) => (
                <tr key={customer._id}>
                  <td>{customer.name}</td><td>{customer.email}</td><td>{customer.phone || '—'}</td><td>{customer.address || '—'}</td>
                  <td>{orders.filter((order) => String(order.user?._id) === String(customer._id)).length}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function FragmentRow({ order, expanded, updating, onToggle, onStatusChange }) {
  return (
    <>
      <tr>
        <td><span className="admin-order-id">#{order._id.slice(-6).toUpperCase()}</span><small>{new Date(order.createdAt).toLocaleDateString()}</small></td>
        <td>{order.user?.name || 'Unknown customer'}<small>{order.user?.email || 'Account unavailable'}</small></td>
        <td className="capitalize">{order.type}<small>{order.weightKg} kg</small></td>
        <td className="money-value">Rs {Number(order.total).toLocaleString()}</td>
        <td>
          <label className="visually-hidden" htmlFor={`status-${order._id}`}>Status for pickup {order._id.slice(-6)}</label>
          <select id={`status-${order._id}`} className={`admin-order-status status-${order.status}`} value={order.status} disabled={updating} onChange={(event) => onStatusChange(event.target.value)}>
            <option value="scheduled">Scheduled</option><option value="on_the_way">On the way</option><option value="arrived">Arrived</option>
          </select>
        </td>
        <td><button className="admin-detail-button" type="button" aria-expanded={expanded} onClick={onToggle}>{expanded ? 'Hide' : 'View'}</button></td>
      </tr>
      {expanded && (
        <tr className="admin-detail-row">
          <td colSpan="6">
            <div className="admin-order-detail">
              <div><span className="eyebrow">PICKUP ADDRESS</span><p>{order.address}</p></div>
              <div><span className="eyebrow">EXPECTED DATE</span><p>{order.status === 'arrived' ? 'Pickup completed' : expectedPickupDate(order)}</p></div>
              <div><span className="eyebrow">CUSTOMER PHONE</span><p>{order.phone || order.user?.phone || 'Not provided'}</p></div>
              <div><span className="eyebrow">COLLECTOR</span><p>{order.collector?.name || 'Not assigned'}{order.collector?.phone ? ` · ${order.collector.phone}` : ''}</p></div>
              <div><span className="eyebrow">RATE</span><p className="money-value">Rs {Number(order.ratePerKg).toLocaleString()} / kg</p></div>
              {order.location && <div><span className="eyebrow">MAP PIN</span><p>{order.location.lat}, {order.location.lng}</p></div>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
