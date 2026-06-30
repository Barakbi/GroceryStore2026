import React, { useEffect, useState } from 'react';
import { Store } from '@grocery-store/shared';
import api from '../services/api';
import { TEXT } from '../utils/text';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', city: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const data = await api.getStores();
      setStores(data);
    } catch (error) {
      console.error('Failed to load stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateStore(editingId, formData);
      } else {
        await api.createStore(formData);
      }
      setFormData({ name: '', address: '', city: '' });
      setShowForm(false);
      setEditingId(null);
      loadStores();
    } catch (error) {
      console.error('Failed to save store:', error);
    }
  };

  const handleEdit = (store: Store) => {
    setFormData({
      name: store.name,
      address: store.address || '',
      city: store.city || ''
    });
    setEditingId(store.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(TEXT.stores.deleteConfirm)) {
      try {
        await api.deleteStore(id);
        loadStores();
      } catch (error) {
        console.error('Failed to delete store:', error);
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
        <h1>{TEXT.stores.title}</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setFormData({ name: '', address: '', city: '' });
            setEditingId(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? TEXT.common.cancel : TEXT.stores.createStore}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>{editingId ? TEXT.stores.editStore : TEXT.stores.createStore}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{TEXT.stores.storeName}</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{TEXT.stores.address}</label>
              <input
                type="text"
                className="form-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{TEXT.stores.city}</label>
              <input
                type="text"
                className="form-input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">{TEXT.common.save}</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ name: '', address: '', city: '' });
                }}
              >
                {TEXT.common.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {stores.length === 0 ? (
        <div className="card text-center">
          <h2>{TEXT.stores.noStores}</h2>
          <p className="text-secondary">{TEXT.stores.createFirst}</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>{TEXT.stores.storeName}</th>
                <th>{TEXT.stores.address}</th>
                <th>{TEXT.stores.city}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id}>
                  <td style={{ fontWeight: 'bold' }}>{store.name}</td>
                  <td>{store.address || '-'}</td>
                  <td>{store.city || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'end' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleEdit(store)}
                      >
                        {TEXT.common.edit}
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(store.id)}
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
