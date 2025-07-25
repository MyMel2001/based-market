import axios from 'axios'
import { 
  User, 
  Product,
  Game, 
  Transaction, 
  LoginRequest, 
  RegisterRequest, 
  CreateProductRequest,
  CreateGameRequest,
  ApiResponse,
  PaginatedResponse,
  ProductFilters,
  GameFilters
} from 'shared'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    throw error
  }
)

export const authApi = {
  login: (data: LoginRequest) => api.post<any, User>('/auth/login', data),
  register: (data: RegisterRequest) => api.post<any, User>('/auth/register', data),
  getMe: () => api.get<any, User>('/auth/me'),
}

export const productsApi = {
  getProducts: (params?: ProductFilters & { page?: number; limit?: number }) => 
    api.get<any, PaginatedResponse<Product>>('/games', { params }),
  getProduct: (id: string) => api.get<any, Product>(`/games/${id}`),
  createProduct: (data: CreateProductRequest) => api.post<any, Product>('/games', data),
  updateProduct: (id: string, data: Partial<CreateProductRequest>) => 
    api.put<any, Product>(`/games/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/games/${id}`),
  getMyProducts: (params?: { page?: number; limit?: number }) => 
    api.get<any, PaginatedResponse<Product>>('/games/my/products', { params }),
}

// Backward compatibility
export const gamesApi = {
  getGames: (params?: GameFilters & { page?: number; limit?: number }) => 
    productsApi.getProducts(params),
  getGame: (id: string) => productsApi.getProduct(id),
  createGame: (data: CreateGameRequest) => {
    const productData: CreateProductRequest = {
      title: data.title,
      description: data.description,
      productUrl: data.gameUrl,
      imageUrl: data.imageUrl,
      price: data.price,
      category: data.category,
      tags: data.tags,
      type: 'GAME',
    };
    return productsApi.createProduct(productData);
  },
  updateGame: (id: string, data: Partial<CreateGameRequest>) => {
    const productData: Partial<CreateProductRequest> = { ...data };
    if (data.gameUrl) {
      productData.productUrl = data.gameUrl;
      delete (productData as any).gameUrl;
    }
    return productsApi.updateProduct(id, productData);
  },
  deleteGame: (id: string) => productsApi.deleteProduct(id),
  getMyGames: (params?: { page?: number; limit?: number }) => 
    productsApi.getMyProducts(params),
}

export const paymentsApi = {
  createPayment: (productId: string) => 
    api.post<any, { transaction: Transaction; paymentAddress: string; amount: number; product: any; game?: any }>('/payments/create', { productId }),
  verifyPayment: (transactionId: string, txHash: string) => 
    api.post<any, Transaction>('/payments/verify', { transactionId, txHash }),
  freeDownload: (productId: string) => 
    api.post<any, Transaction>('/payments/free-download', { productId }),
  getMyTransactions: (params?: { page?: number; limit?: number }) => 
    api.get<any, PaginatedResponse<Transaction>>('/payments/my-transactions', { params }),
  
  // Backward compatibility
  createGamePayment: (gameId: string) => 
    api.post<any, { transaction: Transaction; paymentAddress: string; amount: number; game: any }>('/payments/create', { gameId }),
  freeGameDownload: (gameId: string) => 
    api.post<any, Transaction>('/payments/free-download', { gameId }),
}

export default api 