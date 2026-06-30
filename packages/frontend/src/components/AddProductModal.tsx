import React, { useState, useEffect } from 'react';
import { Product, Category, UnitType } from '@grocery-store/shared';
import api from '../services/api';
import { TEXT, getUnitName } from '../utils/text';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
  categories: Category[];
  onCategoriesUpdate: () => void;
}

export default function AddProductModal({
  isOpen,
  onClose,
  onProductCreated,
  categories,
  onCategoriesUpdate
}: AddProductModalProps) {
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [defaultUnit, setDefaultUnit] = useState<UnitType>(UnitType.PIECE);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setProductName('');
      setCategoryId('');
      setShowNewCategory(false);
      setNewCategoryName('');
      setBarcode('');
      setDefaultUnit(UnitType.PIECE);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let finalCategoryId = categoryId;

      // Create new category if needed
      if (showNewCategory && newCategoryName.trim()) {
        const newCategory = await api.createCategory({ name: newCategoryName.trim() });
        finalCategoryId = newCategory.id;
        onCategoriesUpdate(); // Refresh categories list
      }

      // Create the product
      const newProduct = await api.createProduct({
        canonicalName: productName.trim(),
        categoryId: finalCategoryId || undefined,
        barcode: barcode.trim() || undefined,
        defaultUnit
      });

      onProductCreated(newProduct);
      onClose();
    } catch (err: any) {
      console.error('Failed to create product:', err);
      setError(err.response?.data?.error || 'שגיאה ביצירת מוצר');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBlockEnd: '1rem' }}>{TEXT.products.addProductQuick}</h3>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              marginBlockEnd: '1rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c00'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{TEXT.products.productName}</label>
            <input
              type="text"
              className="form-input"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{TEXT.products.category}</label>
            {!showNewCategory ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                >
                  <option value="">ללא קטגוריה</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewCategory(true)}
                  style={{ whiteSpace: 'nowrap' }}
                  disabled={isSubmitting}
                >
                  + קטגוריה
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={TEXT.products.newCategoryPlaceholder}
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowNewCategory(false);
                    setNewCategoryName('');
                  }}
                  disabled={isSubmitting}
                >
                  ביטול
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">{TEXT.products.barcode}</label>
            <input
              type="text"
              className="form-input"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{TEXT.products.defaultUnit}</label>
            <select
              className="form-select"
              value={defaultUnit}
              onChange={(e) => setDefaultUnit(e.target.value as UnitType)}
              disabled={isSubmitting}
            >
              {Object.values(UnitType).map((unit) => (
                <option key={unit} value={unit}>
                  {getUnitName(unit)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBlockStart: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? TEXT.common.loading : TEXT.common.save}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {TEXT.common.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
