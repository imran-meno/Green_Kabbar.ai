import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SiteNav from './components/SiteNav.jsx';
import HomePage from './pages/HomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import SellPage from './pages/SellPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import TrackPage from './pages/TrackPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import RatesPage from './pages/RatesPage.jsx';
import { AuthContext } from './context/AuthContext.jsx';
import { api } from './api.js';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('gk_user') || 'null');
  } catch {
    localStorage.removeItem('gk_user');
    localStorage.removeItem('gk_token');
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(readStoredUser);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const location = useLocation();

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem('gk_token')) {
      setAuthReady(true);
      return () => { active = false; };
    }

    api('/auth/me')
      .then((data) => {
        if (!active) return;
        localStorage.setItem('gk_user', JSON.stringify(data.user));
        setAuthError('');
        setUser(data.user);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          localStorage.removeItem('gk_token');
          localStorage.removeItem('gk_user');
          setUser(null);
          setAuthError('Your session has expired. Please log in again.');
          return;
        }
        setAuthError(error.message);
      })
      .finally(() => { if (active) setAuthReady(true); });

    return () => { active = false; };
  }, []);

  const auth = useMemo(() => ({
    user,
    authReady,
    login(data) {
      localStorage.setItem('gk_token', data.token);
      localStorage.setItem('gk_user', JSON.stringify(data.user));
      setAuthError('');
      setAuthReady(true);
      setUser(data.user);
    },
    logout() {
      localStorage.removeItem('gk_token');
      localStorage.removeItem('gk_user');
      setAuthError('');
      setUser(null);
      setAuthReady(true);
    },
  }), [user, authReady]);

  return (
    <AuthContext.Provider value={auth}>
      <div className="app-shell">
        <SiteNav />
        <main>
          {authError && <div className="form-error session-error" role="alert">Could not refresh your account details: {authError}</div>}
          <div key={location.pathname} className="route-transition">
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/rates" element={<RatesPage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="/sell" element={<SellPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/track/:id" element={<TrackPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
