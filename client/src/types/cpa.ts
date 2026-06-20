/**
 * CPA (Cost Per Action) Types
 * Type definitions for CPA integrations and rewards
 */

// CPA Provider Types
export type CPAProvider = 'adgate_media' | 'cpagrip' | 'lootably';
export type CPARewardStatus = 'pending' | 'verified' | 'rejected' | 'duplicate' | 'fraud_detected';

// CPA Reward Request
export interface CPARewardRequest {
  userId: string;
  provider: CPAProvider;
  offerId: string;
  offerName: string;
  transactionId: string;
  deviceFingerprint?: string;
  rewardAmount?: number; // SECURITY: Should NOT be submitted by frontend
  metadata?: Record<string, any>;
}

// CPA Reward Response
export interface CPARewardResponse {
  success: boolean;
  rewardId?: string;
  message: string;
  error?: string;
  points?: number;
  usd?: number;
  transactionId?: string;
}

// CPA Postback Data
export interface CPAPostbackData {
  userId: string;
  provider: CPAProvider;
  offerId: string;
  offerName: string;
  transactionId: string;
  rewardAmount: number;
  currency: string;
  timestamp: number;
  ipAddress?: string;
  deviceId?: string;
  [key: string]: any;
}

// CPA Provider Configuration
export interface CPAProviderConfig {
  provider: CPAProvider;
  enabled: boolean;
  apiKey: string;
  apiSecret?: string;
  postbackUrl: string;
  postbackSecret: string;
  minReward: number;
  maxReward: number;
  rewardMultiplier: number;
  offersAvailable: number;
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

// CPA Reward History
export interface CPARewardHistory {
  id: string;
  userId: string;
  provider: CPAProvider;
  offerId: string;
  offerName: string;
  transactionId: string;
  rewardAmount: number;
  points: number;
  status: CPARewardStatus;
  timestamp: Date;
  completedAt?: Date;
  rejectionReason?: string;
  fraudScore?: number;
  deviceFingerprint?: string;
  metadata?: Record<string, any>;
}

// CPA Offer
export interface CPAOffer {
  id: string;
  provider: CPAProvider;
  name: string;
  description: string;
  category: string;
  rewardAmount: number;
  rewardCurrency: string;
  icon?: string;
  thumbnail?: string;
  requirements?: string;
  countries?: string[];
  minAge?: number;
  maxAge?: number;
  priority: number;
  active: boolean;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// CPA Transaction Log
export interface CPATransactionLog {
  id: string;
  userId: string;
  provider: CPAProvider;
  offerId: string;
  transactionId: string;
  action: 'click' | 'view' | 'start' | 'complete' | 'verify' | 'reject';
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  metadata?: Record<string, any>;
}

// CPA Postback Verification
export interface CPAPostbackVerification {
  id: string;
  provider: CPAProvider;
  transactionId: string;
  signature: string;
  verified: boolean;
  verifiedAt?: Date;
  rejectionReason?: string;
  timestamp: Date;
  postbackData: CPAPostbackData;
}

// CPA Statistics
export interface CPAStatistics {
  provider: CPAProvider;
  totalOffers: number;
  activeOffers: number;
  totalRewards: number;
  totalPoints: number;
  totalUSD: number;
  averageReward: number;
  completionRate: number;
  fraudRate: number;
  lastUpdated: Date;
  period: '24h' | '7d' | '30d' | 'all';
}

// CPA Provider Status
export interface CPAProviderStatus {
  provider: CPAProvider;
  enabled: boolean;
  available: boolean;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  message: string;
  lastChecked: Date;
  responseTime?: number;
  errorMessage?: string;
}

// CPA Duplicate Check Result
export interface CPADuplicateCheckResult {
  isDuplicate: boolean;
  previousRewardId?: string;
  previousTimestamp?: Date;
  message: string;
}

// CPA Fraud Detection Result
export interface CPAFraudDetectionResult {
  isFraud: boolean;
  fraudScore: number; // 0-100
  reasons: string[];
  recommendation: 'approve' | 'reject' | 'review';
  message: string;
}

// CPA Reward Verification
export interface CPARewardVerification {
  rewardId: string;
  userId: string;
  provider: CPAProvider;
  transactionId: string;
  verified: boolean;
  verifiedAt: Date;
  verificationMethod: 'postback' | 'api' | 'manual';
  fraudScore: number;
  isDuplicate: boolean;
  message: string;
}
