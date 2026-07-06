import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ProductSpending, StorePrice } from '@grocery-store/shared';
import api from '../services/api';
import { TEXT, formatCurrency, formatDate } from '../utils/text';

interface PriceComparisonChartProps {
  products: ProductSpending[];
}

export default function PriceComparisonChart({ products }: PriceComparisonChartProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [storePrices, setStorePrices] = useState<StorePrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedProductId) {
      loadPriceComparison();
    } else {
      setStorePrices([]);
    }
  }, [selectedProductId]);

  const loadPriceComparison = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getPriceComparison(selectedProductId);
      setStorePrices(data);
    } catch (err: any) {
      setError(err.response?.data?.error || TEXT.errors.fetchError);
    } finally {
      setLoading(false);
    }
  };

  // Find the cheapest store
  const minPrice = storePrices.length > 0
    ? Math.min(...storePrices.map(sp => sp.avgUnitPrice))
    : 0;

  // Prepare data for chart
  const chartData = storePrices.map(sp => ({
    name: sp.store.name,
    price: sp.avgUnitPrice,
    isCheapest: sp.avgUnitPrice === minPrice
  }));

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center" style={{ padding: '2rem' }}>
          <div className="spinner"></div>
          <p style={{ marginBlockStart: '1rem' }}>{TEXT.common.loading}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-danger" style={{ padding: '2rem' }}>
          <p>{error}</p>
        </div>
      );
    }

    if (!selectedProductId) {
      return (
        <div className="text-center" style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>
          <p>{TEXT.dashboard.noProductSelected}</p>
        </div>
      );
    }

    if (storePrices.length === 0) {
      return (
        <div className="text-center" style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>
          <p>{TEXT.dashboard.noPurchaseHistory}</p>
        </div>
      );
    }

    if (storePrices.length === 1) {
      return (
        <div className="text-center" style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>
          <p>{TEXT.dashboard.onlyOneStore}</p>
          <p style={{ marginBlockStart: '0.5rem' }}>
            {storePrices[0].store.name}: {formatCurrency(storePrices[0].avgUnitPrice)}
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={Math.max(200, storePrices.length * 50)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <XAxis
              type="number"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), TEXT.analytics.avgPrice]}
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="price" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isCheapest ? 'var(--color-secondary)' : 'var(--color-primary)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Detailed Table */}
        <div style={{ marginBlockStart: '2rem' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{TEXT.stores.storeName}</th>
                <th>{TEXT.analytics.avgPrice}</th>
                <th>{TEXT.analytics.lastPrice}</th>
                <th>{TEXT.analytics.lastPurchase}</th>
                <th>{TEXT.analytics.purchaseCount}</th>
              </tr>
            </thead>
            <tbody>
              {storePrices.map((sp) => (
                <tr key={sp.store.id}>
                  <td style={{ fontWeight: sp.avgUnitPrice === minPrice ? 'bold' : 'normal' }}>
                    {sp.store.name}
                    {sp.avgUnitPrice === minPrice && (
                      <span style={{
                        color: 'var(--color-secondary)',
                        marginInlineStart: '0.5rem',
                        fontSize: '0.875rem'
                      }}>
                        {TEXT.analytics.cheapestStore}
                      </span>
                    )}
                  </td>
                  <td style={{
                    fontWeight: sp.avgUnitPrice === minPrice ? 'bold' : 'normal',
                    color: sp.avgUnitPrice === minPrice ? 'var(--color-secondary)' : 'inherit'
                  }}>
                    {formatCurrency(sp.avgUnitPrice)}
                  </td>
                  <td>{formatCurrency(sp.lastPrice)}</td>
                  <td>{formatDate(sp.lastPurchaseDate)}</td>
                  <td>{sp.purchaseCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="card">
      <h2 style={{ marginBlockEnd: '1rem' }}>{TEXT.dashboard.priceComparisonTitle}</h2>

      <div style={{ marginBlockEnd: '1rem' }}>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="form-input"
          style={{ maxWidth: '300px' }}
        >
          <option value="">{TEXT.dashboard.selectProduct}</option>
          {products.map((ps) => (
            <option key={ps.product.id} value={ps.product.id}>
              {ps.product.canonicalName}
            </option>
          ))}
        </select>
      </div>

      {renderContent()}
    </div>
  );
}
