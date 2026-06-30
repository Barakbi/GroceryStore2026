import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Store,
  CreateStoreRequest,
  UpdateStoreRequest,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductNormalizationRequest,
  ProductNormalizationResponse,
  Purchase,
  PurchaseWithDetails,
  CreatePurchaseRequest,
  UpdatePurchaseRequest,
  DashboardStats,
  StoreAnalytics,
  ProductAnalytics,
  PriceHistoryPoint,
  StorePrice,
  PriceChange,
  ItemPriceChange,
  MonthlySpending,
  ApiResponse
} from '@grocery-store/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle response errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse<any>>) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data!;
  }

  async getMe() {
    const response = await this.client.get<ApiResponse<any>>('/auth/me');
    return response.data.data!;
  }

  // Stores
  async getStores(): Promise<Store[]> {
    const response = await this.client.get<ApiResponse<Store[]>>('/stores');
    return response.data.data!;
  }

  async getStore(id: string): Promise<Store> {
    const response = await this.client.get<ApiResponse<Store>>(`/stores/${id}`);
    return response.data.data!;
  }

  async createStore(data: CreateStoreRequest): Promise<Store> {
    const response = await this.client.post<ApiResponse<Store>>('/stores', data);
    return response.data.data!;
  }

  async updateStore(id: string, data: UpdateStoreRequest): Promise<Store> {
    const response = await this.client.put<ApiResponse<Store>>(`/stores/${id}`, data);
    return response.data.data!;
  }

  async deleteStore(id: string): Promise<void> {
    await this.client.delete(`/stores/${id}`);
  }

  async getStoreAnalytics(id: string): Promise<StoreAnalytics> {
    const response = await this.client.get<ApiResponse<StoreAnalytics>>(`/stores/${id}/analytics`);
    return response.data.data!;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await this.client.get<ApiResponse<Category[]>>('/categories');
    return response.data.data!;
  }

  async getCategory(id: string): Promise<Category> {
    const response = await this.client.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data!;
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await this.client.post<ApiResponse<Category>>('/categories', data);
    return response.data.data!;
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const response = await this.client.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data.data!;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.client.delete(`/categories/${id}`);
  }

  // Products
  async getProducts(params?: { category?: string; search?: string }): Promise<Product[]> {
    const response = await this.client.get<ApiResponse<Product[]>>('/products', { params });
    return response.data.data!;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.client.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await this.client.post<ApiResponse<Product>>('/products', data);
    return response.data.data!;
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    const response = await this.client.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data!;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.client.delete(`/products/${id}`);
  }

  async normalizeProduct(data: ProductNormalizationRequest): Promise<ProductNormalizationResponse> {
    const response = await this.client.post<ApiResponse<ProductNormalizationResponse>>('/products/normalize', data);
    return response.data.data!;
  }

  async findSimilarProducts(name: string, barcode?: string) {
    const response = await this.client.get('/products/similar', {
      params: { name, barcode }
    });
    return response.data.data!;
  }

  async mergeProducts(sourceId: string, targetId: string): Promise<Product> {
    const response = await this.client.post<ApiResponse<Product>>('/products/merge', {
      sourceId,
      targetId
    });
    return response.data.data!;
  }

  async getProductAnalytics(id: string): Promise<ProductAnalytics> {
    const response = await this.client.get<ApiResponse<ProductAnalytics>>(`/products/${id}/analytics`);
    return response.data.data!;
  }

  async getProductPriceHistory(id: string, startDate?: Date, endDate?: Date): Promise<PriceHistoryPoint[]> {
    const response = await this.client.get<ApiResponse<PriceHistoryPoint[]>>(`/products/${id}/price-history`, {
      params: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      }
    });
    return response.data.data!;
  }

  // Purchases
  async getPurchases(params?: {
    storeId?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<PurchaseWithDetails[]> {
    const response = await this.client.get<ApiResponse<PurchaseWithDetails[]>>('/purchases', {
      params: {
        ...params,
        startDate: params?.startDate?.toISOString(),
        endDate: params?.endDate?.toISOString()
      }
    });
    return response.data.data!;
  }

  async getPurchase(id: string): Promise<PurchaseWithDetails> {
    const response = await this.client.get<ApiResponse<PurchaseWithDetails>>(`/purchases/${id}`);
    return response.data.data!;
  }

  async createPurchase(data: CreatePurchaseRequest): Promise<PurchaseWithDetails> {
    const response = await this.client.post<ApiResponse<PurchaseWithDetails>>('/purchases', data);
    return response.data.data!;
  }

  async updatePurchase(id: string, data: UpdatePurchaseRequest): Promise<PurchaseWithDetails> {
    const response = await this.client.put<ApiResponse<PurchaseWithDetails>>(`/purchases/${id}`, data);
    return response.data.data!;
  }

  async deletePurchase(id: string): Promise<void> {
    await this.client.delete(`/purchases/${id}`);
  }

  // Analytics
  async getDashboard(): Promise<DashboardStats> {
    const response = await this.client.get<ApiResponse<DashboardStats>>('/analytics/dashboard');
    return response.data.data!;
  }

  async getPriceComparison(productId: string): Promise<StorePrice[]> {
    const response = await this.client.get<ApiResponse<StorePrice[]>>('/analytics/price-comparison', {
      params: { productId }
    });
    return response.data.data!;
  }

  async getStoreComparison(productId: string, storeIds: string[]) {
    const response = await this.client.get('/analytics/store-comparison', {
      params: { productId, storeIds }
    });
    return response.data.data!;
  }

  async getExclusiveProducts(storeId: string): Promise<Product[]> {
    const response = await this.client.get<ApiResponse<Product[]>>('/analytics/exclusive-products', {
      params: { storeId }
    });
    return response.data.data!;
  }

  async getPriceChanges(threshold?: number): Promise<PriceChange[]> {
    const response = await this.client.get<ApiResponse<PriceChange[]>>('/analytics/price-changes', {
      params: { threshold }
    });
    return response.data.data!;
  }

  async getMonthlySpending(year: number): Promise<MonthlySpending[]> {
    const response = await this.client.get<ApiResponse<MonthlySpending[]>>('/analytics/monthly-spending', {
      params: { year }
    });
    return response.data.data!;
  }

  async getPurchaseItemPriceChanges(purchaseId: string): Promise<ItemPriceChange[]> {
    const response = await this.client.get<ApiResponse<ItemPriceChange[]>>('/analytics/purchase-item-price-changes', {
      params: { purchaseId }
    });
    return response.data.data!;
  }
}

export const api = new ApiClient();
export default api;
