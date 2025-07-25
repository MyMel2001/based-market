export interface User {
  id: string;
  email: string;
  username: string;
  role: 'DEVELOPER' | 'USER' | 'ADMIN';
  moneroAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  productUrl: string;
  imageUrl?: string;
  price: number; // in XMR, 0 for free products
  category: string;
  tags: string[];
  type: 'GAME' | 'APP';
  developerId: string;
  developer: User;
  isActive: boolean;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Keep Game interface for backward compatibility
export interface Game extends Product {
  gameUrl: string;
}

export interface Transaction {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  amount: number; // in XMR
  moneroTxHash?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  title: string;
  description: string;
  productUrl: string;
  imageUrl?: string;
  price: number;
  category: string;
  tags: string[];
  type: 'GAME' | 'APP';
}

// Keep for backward compatibility
export interface CreateGameRequest extends CreateProductRequest {
  gameUrl: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  role: 'DEVELOPER' | 'USER';
  moneroAddress?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  category?: string;
  type?: 'GAME' | 'APP';
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  search?: string;
  sortBy?: 'createdAt' | 'price' | 'downloadCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Keep for backward compatibility
export interface GameFilters extends ProductFilters {} 