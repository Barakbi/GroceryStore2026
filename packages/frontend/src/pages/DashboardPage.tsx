import { useEffect, useState } from 'react';
import { DashboardStats } from '@grocery-store/shared';
import api from '../services/api';
import { TEXT, formatCurrency, formatDate } from '../utils/text';
import PriceComparisonChart from '../components/PriceComparisonChart';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboard();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.error || TEXT.errors.fetchError);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center" style={{ padding: '2rem' }}>
          <div className="spinner"></div>
          <p style={{ marginBlockStart: '1rem' }}>{TEXT.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card text-center text-danger">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="container">
      <h1 style={{ marginBlockEnd: '1.5rem' }}>{TEXT.dashboard.title}</h1>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBlockEnd: '2rem'
      }}>
        <div className="card text-center">
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {TEXT.dashboard.totalSpending}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            {formatCurrency(stats.totalSpending)}
          </div>
        </div>

        <div className="card text-center">
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {TEXT.dashboard.purchaseCount}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
            {stats.purchaseCount}
          </div>
        </div>

        <div className="card text-center">
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {TEXT.dashboard.avgBasket}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>
            {formatCurrency(stats.avgBasketSize)}
          </div>
        </div>

        <div className="card text-center">
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {TEXT.dashboard.productCount}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {stats.productCount}
          </div>
        </div>

        <div className="card text-center">
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {TEXT.dashboard.storeCount}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {stats.storeCount}
          </div>
        </div>
      </div>

      {/* Recent Purchases */}
      {stats.recentPurchases && stats.recentPurchases.length > 0 && (
        <div className="card">
          <h2 style={{ marginBlockEnd: '1rem' }}>{TEXT.dashboard.recentPurchases}</h2>
          <table className="table">
            <thead>
              <tr>
                <th>{TEXT.purchases.purchaseDate}</th>
                <th>{TEXT.stores.storeName}</th>
                <th>{TEXT.purchases.itemsCount}</th>
                <th>{TEXT.purchases.total}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentPurchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>{formatDate(purchase.purchaseDate)}</td>
                  <td>{purchase.store.name}</td>
                  <td>{purchase.items.length}</td>
                  <td style={{ fontWeight: 'bold' }}>
                    {formatCurrency(purchase.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Price Changes */}
      {stats.priceChanges && stats.priceChanges.length > 0 && (
        <div className="card">
          <h2 style={{ marginBlockEnd: '1rem' }}>{TEXT.dashboard.priceChanges}</h2>
          <table className="table">
            <thead>
              <tr>
                <th>{TEXT.products.productName}</th>
                <th>{TEXT.stores.storeName}</th>
                <th>{TEXT.analytics.percentChange}</th>
                <th>{TEXT.purchases.purchaseDate}</th>
              </tr>
            </thead>
            <tbody>
              {stats.priceChanges.map((change, index) => (
                <tr key={index}>
                  <td>{change.product.canonicalName}</td>
                  <td>{change.store.name}</td>
                  <td style={{
                    color: change.percentageChange > 0
                      ? 'var(--color-danger)'
                      : 'var(--color-secondary)',
                    fontWeight: 'bold'
                  }}>
                    {change.percentageChange > 0 ? '+' : ''}
                    {change.percentageChange.toFixed(1)}%
                  </td>
                  <td>{formatDate(change.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Price Comparison Chart */}
      {stats.topProducts && stats.topProducts.length > 0 && (
        <PriceComparisonChart products={stats.topProducts} />
      )}

      {/* No data message */}
      {stats.purchaseCount === 0 && (
        <div className="card text-center">
          <h2>{TEXT.dashboard.noPurchases}</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBlockStart: '0.5rem' }}>
            {TEXT.dashboard.startShopping}
          </p>
        </div>
      )}
    </div>
  );
}
