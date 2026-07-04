// Shared TypeScript types for Grocery Store 2026

// Unit type - compatible with Prisma's generated enum
// Export as const object for runtime use and as type for type checking
export const UnitType = {
  PIECE: 'PIECE',
  KILOGRAM: 'KILOGRAM',
  GRAM: 'GRAM',
  LITER: 'LITER',
  MILLILITER: 'MILLILITER',
  PACKAGE: 'PACKAGE'
} as const;

export type UnitType = typeof UnitType[keyof typeof UnitType];

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Store types
export interface Store {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  userId: string;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStoreRequest {
  name: string;
  address?: string;
  city?: string;
}

export interface UpdateStoreRequest {
  name?: string;
  address?: string;
  city?: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  userId: string;
  isDefault: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name?: string;
}

// Product types
export interface Product {
  id: string;
  canonicalName: string;
  categoryId: string | null;
  category?: Category;
  barcode: string | null;
  defaultUnit: UnitType;
  userId: string;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAlias {
  id: string;
  productId: string;
  aliasName: string;
  language: string | null;
  createdAt: Date;
}

export interface CreateProductRequest {
  canonicalName: string;
  categoryId?: string;
  barcode?: string;
  defaultUnit: UnitType;
}

export interface UpdateProductRequest {
  canonicalName?: string;
  categoryId?: string;
  barcode?: string;
  defaultUnit?: UnitType;
}

export interface ProductNormalizationRequest {
  name: string;
  barcode?: string;
}

export interface ProductNormalizationResponse {
  product: Product;
  isNew: boolean;
  matchScore?: number;
  suggestedProducts?: Array<{
    product: Product;
    similarity: number;
  }>;
}

// Purchase types
export interface Purchase {
  id: string;
  purchaseDate: Date;
  storeId: string;
  totalAmount: number;
  notes: string | null;
  userId: string;
  deletedAt: Date | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  unitType: UnitType;
  totalPrice: number;
  calculatedUnitPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseWithDetails extends Purchase {
  store: Store;
  items: Array<PurchaseItem & { product: Product }>;
}

export interface CreatePurchaseItemRequest {
  productId: string;
  quantity: number;
  unitType: UnitType;
  totalPrice: number;
}

export interface CreatePurchaseRequest {
  purchaseDate: Date;
  storeId: string;
  notes?: string;
  items: CreatePurchaseItemRequest[];
}

export interface UpdatePurchaseRequest {
  purchaseDate?: Date;
  storeId?: string;
  notes?: string;
  items?: CreatePurchaseItemRequest[];
}

// Analytics types
export interface DashboardStats {
  totalSpending: number;
  purchaseCount: number;
  avgBasketSize: number;
  productCount: number;
  storeCount: number;
  recentPurchases: PurchaseWithDetails[];
  monthlySpending: MonthlySpending[];
  topProducts: ProductSpending[];
  priceChanges: PriceChange[];
}

export interface MonthlySpending {
  month: string;
  year: number;
  total: number;
  purchaseCount: number;
}

export interface ProductSpending {
  product: Product;
  totalSpent: number;
  quantity: number;
  purchaseCount: number;
}

export interface StoreAnalytics {
  store: Store;
  totalSpending: number;
  purchaseCount: number;
  avgBasketSize: number;
  topProducts: ProductSpending[];
  categoryBreakdown: CategorySpending[];
}

export interface CategorySpending {
  categoryId?: string;
  categoryName: string;
  category?: Category;
  totalSpent: number;
  productCount: number;
}

export interface ProductAnalytics {
  product: Product;
  totalPurchases: number;
  totalQuantity: number;
  totalSpent: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceHistory: PriceHistoryPoint[];
  preferredStore?: Store;
  storeComparison: StorePrice[];
}

export interface PriceHistoryPoint {
  date: Date;
  price: number;
  unitPrice: number;
  storeId: string;
  storeName: string;
}

export interface StorePrice {
  store: Store;
  avgUnitPrice: number;
  lastPrice: number;
  lastPurchaseDate: Date;
  purchaseCount: number;
}

export interface PriceChange {
  product: Product;
  oldPrice: number;
  newPrice: number;
  percentageChange: number;
  store: Store;
  date: Date;
}

export interface ItemPriceChange {
  itemId: string;
  productId: string;
  currentPrice: number;
  previousPrice: number | null;
  percentageChange: number | null;
  previousPurchaseDate: Date | null;
}

// Report types
export interface StoreComparisonReport {
  stores: Store[];
  dateRange: {
    start: Date;
    end: Date;
  };
  comparison: Array<{
    store: Store;
    totalSpending: number;
    purchaseCount: number;
    avgBasketSize: number;
    productCount: number;
  }>;
}

export interface ProductComparisonReport {
  products: Product[];
  dateRange: {
    start: Date;
    end: Date;
  };
  comparison: Array<{
    product: Product;
    stores: Array<{
      store: Store;
      avgUnitPrice: number;
      purchaseCount: number;
      lastPurchaseDate: Date;
    }>;
  }>;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalSpending: number;
  purchaseCount: number;
  storeBreakdown: Array<{
    store: Store;
    spending: number;
    purchaseCount: number;
  }>;
  categoryBreakdown: CategorySpending[];
  topProducts: ProductSpending[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query parameters
export interface PurchaseFilters {
  storeId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
}
