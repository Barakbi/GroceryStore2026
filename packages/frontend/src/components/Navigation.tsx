import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { TEXT } from '../utils/text';

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="nav">
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            🛒 Grocery Store 2026
          </div>

          {user && (
            <ul className="nav-list">
              <li>
                <Link
                  to="/"
                  className={`nav-link ${isActive('/') ? 'active' : ''}`}
                >
                  {TEXT.nav.dashboard}
                </Link>
              </li>
              <li>
                <Link
                  to="/stores"
                  className={`nav-link ${isActive('/stores') ? 'active' : ''}`}
                >
                  {TEXT.nav.stores}
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className={`nav-link ${isActive('/products') ? 'active' : ''}`}
                >
                  {TEXT.nav.products}
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className={`nav-link ${isActive('/categories') ? 'active' : ''}`}
                >
                  קטגוריות
                </Link>
              </li>
              <li>
                <Link
                  to="/purchases"
                  className={`nav-link ${isActive('/purchases') ? 'active' : ''}`}
                >
                  {TEXT.nav.purchases}
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline"
                  style={{ padding: '0.5rem 1rem' }}
                >
                  {TEXT.nav.logout}
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
