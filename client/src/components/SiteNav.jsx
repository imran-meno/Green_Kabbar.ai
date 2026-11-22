import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SiteNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate('/');
  }

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Link to="/" className="brand" aria-label="Green Kabbar home">
          <span className="brand-mark" aria-hidden="true">g</span>
          <span>green<span className="brand-light">kabbar</span></span>
        </Link>
        <div className="nav-links">
          <Link to="/how-it-works" className="nav-link">How it works</Link>
          <Link to="/rates" className="nav-link">Scrap rates</Link>
          {user && <Link to="/orders" className="nav-link">My pickups</Link>}
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation menu"><span aria-hidden="true">☰</span></summary>
          <div className="mobile-menu-panel">
            <Link to="/how-it-works">How it works</Link>
            <Link to="/rates">Scrap rates</Link>
            {!user && <Link to="/login">Log in</Link>}
            {!user && <Link to="/register">Create account</Link>}
            {user && <Link to="/orders">My pickups</Link>}
            {user && <Link to={user.role === 'admin' ? '/admin' : '/account'}>{user.role === 'admin' ? 'Admin dashboard' : 'My account'}</Link>}
          </div>
        </details>
        <div className="nav-actions">
          {user ? (
            <>
              <Link to={user.role === 'admin' ? '/admin' : '/account'} className="nav-login">
                {user.role === 'admin' ? 'Admin dashboard' : 'My account'}
              </Link>
              <span className="nav-greeting">Hi, {user.name.split(' ')[0]}</span>
              <button className="button button-outline button-small" onClick={signOut}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login">Log in</Link>
              <Link to="/register" className="button button-small">Get started <span aria-hidden="true">↗</span></Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
