import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link to="/" className="brand footer-brand">
        <span className="brand-mark" aria-hidden="true">g</span>
        <span>green<span className="brand-light">kabbar</span></span>
      </Link>
      <span>Good for your home. Better for our planet.</span>
      <span>© {new Date().getFullYear()} Green Kabbar</span>
    </footer>
  );
}
