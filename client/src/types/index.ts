/**
 * Global Types Definition
 * Central location for all TypeScript interfaces and types
 */

// User Types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  fatherName?: string;
  country?: string;
  photoURL?: string;
  language: 'ar' | 'en';
  referralCode: string;
  points: number;
  balance: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  status: 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  role: 'user' | 'admin';
  devices?: Device[];
}

export interface Device {
  id: string;
  name: string;
  lastLogin: number;
  ipAddress?: string;
}

// Wallet Types
export interface Wallet {
  userId: string;
  pendingBalance: number;
  availableBalance: number;
  frozenBalance: number;
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

// Points Types
export interface PointsLedger {
  id?: string;
  userId: string;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
  source: string;
  createdAt: Date;
}

// Transaction Types
export interface Transaction {
  id?: string;
  userId: string;
  type: 'earned' | 'withdrawal' | 'referral' | 'task';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  source: string;
  description: string;
  createdAt: Date;
}

// Level Types
export interface LevelInfo {
  name: string;
  minPoints: number;
  maxPoints: number;
  bonus: number;
  color: string;
  description: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Wallet State Types
export interface WalletState {
  wallet: Wallet | null;
  points: number;
  transactions: Transaction[];
  level: string;
  isLoading: boolean;
  error: string | null;
}

// Settings Types
export interface AppSettings {
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  offlineMode: boolean;
}

// UI Types
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Common Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
