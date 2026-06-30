import React, { useEffect, useState } from 'react';
import { Product, Category, UnitType } from '@grocery-store/shared';
import api from '../services/api';
import { TEXT, getUnitName } from '../utils/text';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    canonicalName: '',
    categoryId: '',
    barcode: '',
    defaultUnit: UnitType.PIECE
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        canonicalName: formData.canonicalName,
        categoryId: formData.categoryId || undefined,
        barcode: formData.barcode || undefined,
        defaultUnit: formData.defaultUnit
      };
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
      setFormData({ canonicalName: '', categoryId: '', barcode: '', defaultUnit: UnitType.PIECE });
      setShowForm(false);
      setEditingId(null);
      loadProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      canonicalName: product.canonicalName,
      categoryId: product.categoryId || '',
      barcode: product.barcode || '',
      defaultUnit: product.defaultUnit
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(TEXT.products.deleteConfirm)) {
      try {
        await api.deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="text-center">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: '1.5rem' }}>
        <h1>{TEXT.products.title}</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({ canonicalName: '', categoryId: '', barcode: '', defaultUnit: UnitType.PIECE });
            setEditingId(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? TEXT.common.cancel : TEXT.products.createProduct}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>{editingId ? TEXT.products.editProduct : TEXT.products.createProduct}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{TEXT.products.productName}</label>
              <input
                type="text"
                className="form-input"
                value={formData.canonicalName}
                onChange={(e) => setFormData({ ...formData, canonicalName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{TEXT.products.category}</label>
              <select
                className="form-select"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">ללא קטגוריה</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{TEXT.products.barcode}</label>
              <input
                type="text"
                className="form-input"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{TEXT.products.defaultUnit}</label>
              <select
                className="form-select"
                value={formData.defaultUnit}
                onChange={(e) => setFormData({ ...formData, defaultUnit: e.target.value as UnitType })}
              >
                {Object.values(UnitType).map((unit) => (
                  <option key={unit} value={unit}>
                    {getUnitName(unit)}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">{TEXT.common.save}</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ canonicalName: '', categoryId: '', barcode: '', defaultUnit: UnitType.PIECE });
                }}
              >
                {TEXT.common.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {products.length === 0 ? (
        <div className="card text-center">
          <h2>{TEXT.products.noProducts}</h2>
          <p className="text-secondary">{TEXT.products.createFirst}</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{TEXT.products.productName}</th>
                <th>{TEXT.products.category}</th>
                <th>{TEXT.products.defaultUnit}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td style={{ fontWeight: 'bold' }}>{product.canonicalName}</td>
                  <td>{product.category?.name || '-'}</td>
                  <td>{getUnitName(product.defaultUnit)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'end' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleEdit(product)}
                      >
                        {TEXT.common.edit}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(product.id)}
                      >
                        {TEXT.common.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
