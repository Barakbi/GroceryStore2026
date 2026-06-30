import React, { useEffect, useState } from 'react';
import { PurchaseWithDetails, Store, Product, Category, UnitType, CreatePurchaseItemRequest, ItemPriceChange } from '@grocery-store/shared';
import api from '../services/api';
import { TEXT, formatCurrency, formatDate, getUnitName } from '../utils/text';
import AddProductModal from '../components/AddProductModal';

interface PriceChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  previousPrice: number;
  percentageChange: number;
  productName: string;
  previousDate: Date;
}

function PriceChangeModal({ isOpen, onClose, currentPrice, previousPrice, percentageChange, productName, previousDate }: PriceChangeModalProps) {
  if (!isOpen) return null;

  const isIncrease = percentageChange > 0;

  return (
    <div style={{
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
    }} onClick={onClose}>
      <div className="card" style={{ maxWidth: '400px', margin: '1rem' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBlockEnd: '1rem' }}>{TEXT.purchases.priceChange}</h3>
        <p style={{ marginBlockEnd: '0.5rem', fontWeight: 'bold' }}>{productName}</p>
        <p style={{ marginBlockEnd: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          {TEXT.purchases.comparedToLastPurchase} ({formatDate(previousDate)})
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBlockEnd: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {TEXT.purchases.previousPrice}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {formatCurrency(previousPrice)}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {TEXT.purchases.currentPrice}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
              {formatCurrency(currentPrice)}
            </div>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '0.75rem',
          borderRadius: '8px',
          backgroundColor: isIncrease ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          color: isIncrease ? 'var(--color-danger)' : 'var(--color-secondary)',
          fontWeight: 'bold',
          fontSize: '1.25rem'
        }}>
          {isIncrease ? '+' : ''}{percentageChange.toFixed(1)}%
        </div>

        <button
          className="btn btn-outline"
          onClick={onClose}
          style={{ marginBlockStart: '1rem', width: '100%' }}
        >
          {TEXT.common.close}
        </button>
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [priceChanges, setPriceChanges] = useState<Map<string, Map<string, ItemPriceChange>>>(new Map());
  const [priceChangeModal, setPriceChangeModal] = useState<{
    isOpen: boolean;
    currentPrice: number;
    previousPrice: number;
    percentageChange: number;
    productName: string;
    previousDate: Date;
  } | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [addProductForItemIndex, setAddProductForItemIndex] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    storeId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [] as CreatePurchaseItemRequest[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [purchasesData, storesData, productsData, categoriesData] = await Promise.all([
        api.getPurchases(),
        api.getStores(),
        api.getProducts(),
        api.getCategories()
      ]);
      setPurchases(purchasesData);
      setStores(storesData);
      setProducts(productsData);
      setCategories(categoriesData);

      // Load price changes for each purchase
      const priceChangesMap = new Map<string, Map<string, ItemPriceChange>>();
      for (const purchase of purchasesData) {
        try {
          const changes = await api.getPurchaseItemPriceChanges(purchase.id);
          const itemMap = new Map<string, ItemPriceChange>();
          for (const change of changes) {
            itemMap.set(change.itemId, change);
          }
          priceChangesMap.set(purchase.id, itemMap);
        } catch (err) {
          console.error('Failed to load price changes for purchase:', purchase.id, err);
        }
      }
      setPriceChanges(priceChangesMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      storeId: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: []
    });
    setEditingPurchaseId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('נא להוסיף לפחות פריט אחד');
      return;
    }
    try {
      if (editingPurchaseId) {
        // Update existing purchase
        await api.updatePurchase(editingPurchaseId, {
          ...formData,
          purchaseDate: new Date(formData.purchaseDate)
        });
      } else {
        // Create new purchase
        await api.createPurchase({
          ...formData,
          purchaseDate: new Date(formData.purchaseDate)
        });
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save purchase:', error);
    }
  };

  const handleEdit = (purchase: PurchaseWithDetails) => {
    setEditingPurchaseId(purchase.id);
    setFormData({
      storeId: purchase.storeId,
      purchaseDate: new Date(purchase.purchaseDate).toISOString().split('T')[0],
      notes: purchase.notes || '',
      items: purchase.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitType: item.unitType as UnitType,
        totalPrice: item.totalPrice
      }))
    });
    setShowForm(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: '',
          quantity: 1,
          unitType: UnitType.PIECE,
          totalPrice: 0
        }
      ]
    });
  };

  const updateItem = (index: number, field: keyof CreatePurchaseItemRequest, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleAddProduct = (itemIndex: number) => {
    setAddProductForItemIndex(itemIndex);
    setShowAddProductModal(true);
  };

  const handleProductCreated = async (newProduct: Product) => {
    // Refresh products list
    const updatedProducts = await api.getProducts();
    setProducts(updatedProducts);

    // Auto-select the newly created product for the current item
    if (addProductForItemIndex !== null) {
      updateItem(addProductForItemIndex, 'productId', newProduct.id);
    }
  };

  const handleCategoriesUpdate = async () => {
    // Refresh categories list
    const updatedCategories = await api.getCategories();
    setCategories(updatedCategories);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(TEXT.purchases.deleteConfirm)) {
      try {
        await api.deletePurchase(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete purchase:', error);
      }
    }
  };

  const getPriceChangeForItem = (purchaseId: string, itemId: string): ItemPriceChange | undefined => {
    const purchaseChanges = priceChanges.get(purchaseId);
    if (!purchaseChanges) return undefined;
    return purchaseChanges.get(itemId);
  };

  const getFilteredProducts = () => {
    if (!categoryFilter) {
      return products;
    }
    return products.filter(product => product.categoryId === categoryFilter);
  };

  const renderPriceChangeIcon = (purchaseId: string, item: PurchaseWithDetails['items'][0]) => {
    const change = getPriceChangeForItem(purchaseId, item.id);
    if (!change || change.previousPrice === null || change.percentageChange === null) {
      return null;
    }

    // Only show icon if change is more than 1%
    if (Math.abs(change.percentageChange) < 1) {
      return null;
    }

    const isIncrease = change.percentageChange > 0;

    return (
      <button
        onClick={() => setPriceChangeModal({
          isOpen: true,
          currentPrice: change.currentPrice,
          previousPrice: change.previousPrice!,
          percentageChange: change.percentageChange!,
          productName: item.product.canonicalName,
          previousDate: new Date(change.previousPurchaseDate!)
        })}
        style={{
          marginInlineStart: '0.5rem',
          padding: '0.125rem 0.375rem',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          backgroundColor: isIncrease ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
          color: isIncrease ? 'var(--color-danger)' : 'var(--color-secondary)'
        }}
        title={isIncrease ? TEXT.purchases.priceIncreased : TEXT.purchases.priceDecreased}
      >
        {isIncrease ? '▲' : '▼'} {Math.abs(change.percentageChange).toFixed(0)}%
      </button>
    );
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
        <h1>{TEXT.purchases.title}</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? TEXT.common.cancel : TEXT.purchases.createPurchase}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>{editingPurchaseId ? TEXT.purchases.editPurchase : TEXT.purchases.createPurchase}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{TEXT.purchases.selectStore}</label>
              <select
                className="form-select"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                required
              >
                <option value="">{TEXT.purchases.selectStore}</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{TEXT.purchases.purchaseDate}</label>
              <input
                type="date"
                className="form-input"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{TEXT.purchases.notes}</label>
              <textarea
                className="form-textarea"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBlockEnd: '0.5rem' }}>
                <label className="form-label" style={{ marginBlockEnd: 0 }}>{TEXT.purchases.items}</label>
                <button type="button" className="btn btn-secondary" onClick={addItem}>
                  {TEXT.purchases.addItem}
                </button>
              </div>

              {/* Category Filter */}
              {categories.length > 0 && (
                <div style={{
                  marginBlockEnd: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-background)',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBlockEnd: '0.5rem' }}>
                    סינון לפי קטגוריה:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter(null)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '16px',
                        border: !categoryFilter ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: !categoryFilter ? 'var(--color-primary)' : 'white',
                        color: !categoryFilter ? 'white' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: !categoryFilter ? 'bold' : 'normal',
                        transition: 'all 0.2s'
                      }}
                    >
                      הכל
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setCategoryFilter(category.id)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '16px',
                          border: categoryFilter === category.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: categoryFilter === category.id ? 'var(--color-primary)' : 'white',
                          color: categoryFilter === category.id ? 'white' : 'var(--color-text)',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: categoryFilter === category.id ? 'bold' : 'normal',
                          transition: 'all 0.2s'
                        }}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                  {categoryFilter && (
                    <div style={{ marginBlockStart: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      מציג {getFilteredProducts().length} מוצרים
                    </div>
                  )}
                </div>
              )}

              {formData.items.map((item, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                  gap: '0.5rem',
                  marginBlockEnd: '0.5rem',
                  alignItems: 'end'
                }}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <select
                      className="form-select"
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      required
                      style={{ flex: 1 }}
                    >
                      <option value="">{TEXT.purchases.selectProduct}</option>
                      {getFilteredProducts().map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.canonicalName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleAddProduct(index)}
                      title={TEXT.products.addProductQuick}
                      style={{
                        padding: '0.375rem 0.625rem',
                        fontSize: '1rem',
                        lineHeight: '1.5'
                      }}
                    >
                      +
                    </button>
                  </div>

                  <input
                    type="number"
                    className="form-input"
                    placeholder={TEXT.purchases.quantity}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                    min="0.01"
                    step="0.01"
                    required
                  />

                  <select
                    className="form-select"
                    value={item.unitType}
                    onChange={(e) => updateItem(index, 'unitType', e.target.value)}
                    required
                  >
                    {Object.values(UnitType).map((unit) => (
                      <option key={unit} value={unit}>
                        {getUnitName(unit)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    className="form-input"
                    placeholder={TEXT.purchases.price}
                    value={item.totalPrice}
                    onChange={(e) => updateItem(index, 'totalPrice', parseFloat(e.target.value))}
                    min="0"
                    step="0.01"
                    required
                  />

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeItem(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {formData.items.length > 0 && (
              <div style={{
                textAlign: 'end',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                marginBlockEnd: '1rem'
              }}>
                {TEXT.purchases.total}: {formatCurrency(calculateTotal())}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">{TEXT.common.save}</button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={resetForm}
              >
                {TEXT.common.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {purchases.length === 0 ? (
        <div className="card text-center">
          <h2>{TEXT.purchases.noPurchases}</h2>
          <p className="text-secondary">{TEXT.purchases.createFirst}</p>
        </div>
      ) : (
        <div>
          {purchases.map((purchase) => (
            <div key={purchase.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBlockEnd: '1rem' }}>
                <div>
                  <h3 style={{ marginBlockEnd: '0.25rem' }}>{purchase.store.name}</h3>
                  <div className="text-secondary">
                    {formatDate(purchase.purchaseDate)} • {purchase.items.length} {TEXT.purchases.itemsCount}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {formatCurrency(purchase.totalAmount)}
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEdit(purchase)}
                  >
                    {TEXT.common.edit}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(purchase.id)}
                  >
                    {TEXT.common.delete}
                  </button>
                </div>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>{TEXT.purchases.product}</th>
                    <th>{TEXT.purchases.quantity}</th>
                    <th>{TEXT.purchases.price}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.product.canonicalName}
                        {renderPriceChangeIcon(purchase.id, item)}
                      </td>
                      <td>
                        {item.quantity} {getUnitName(item.unitType)}
                      </td>
                      <td style={{ fontWeight: 'bold' }}>
                        {formatCurrency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {priceChangeModal && (
        <PriceChangeModal
          isOpen={priceChangeModal.isOpen}
          onClose={() => setPriceChangeModal(null)}
          currentPrice={priceChangeModal.currentPrice}
          previousPrice={priceChangeModal.previousPrice}
          percentageChange={priceChangeModal.percentageChange}
          productName={priceChangeModal.productName}
          previousDate={priceChangeModal.previousDate}
        />
      )}

      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => {
          setShowAddProductModal(false);
          setAddProductForItemIndex(null);
        }}
        onProductCreated={handleProductCreated}
        categories={categories}
        onCategoriesUpdate={handleCategoriesUpdate}
      />
    </div>
  );
}
