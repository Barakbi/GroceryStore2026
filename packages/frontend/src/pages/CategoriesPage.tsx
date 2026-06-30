import React, { useEffect, useState } from 'react';
import { Category } from '@grocery-store/shared';
import api from '../services/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api.updateCategory(editingId, formData);
      } else {
        await api.createCategory(formData);
      }
      setFormData({ name: '' });
      setShowForm(false);
      setEditingId(null);
      loadCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      setError(error.response?.data?.error || 'Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name });
    setEditingId(category.id);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('האם למחוק קטגוריה זו? מוצרים בקטגוריה זו יישארו ללא קטגוריה.')) {
      try {
        await api.deleteCategory(id);
        loadCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
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
        <h1>קטגוריות</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({ name: '' });
            setEditingId(null);
            setShowForm(!showForm);
            setError(null);
          }}
        >
          {showForm ? 'ביטול' : 'קטגוריה חדשה'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>{editingId ? 'עריכת קטגוריה' : 'קטגוריה חדשה'}</h2>
          {error && (
            <div style={{
              padding: '0.75rem',
              marginBlockEnd: '1rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c00'
            }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">שם הקטגוריה</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                required
                placeholder="לדוגמה: חלב ומוצריו, ירקות, פירות"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">שמירה</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ name: '' });
                  setError(null);
                }}
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="card text-center">
          <h2>אין קטגוריות</h2>
          <p className="text-secondary">צור קטגוריה ראשונה לארגון המוצרים שלך</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>שם הקטגוריה</th>
                <th>ברירת מחדל</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.isDefault ? 'כן' : 'לא'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEdit(category)}
                      >
                        ערוך
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(category.id)}
                      >
                        מחק
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
