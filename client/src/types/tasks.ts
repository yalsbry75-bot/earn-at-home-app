/**
 * Tasks and Ads Types
 * Type definitions for tasks, ads, and rewards system
 */

// Task Types
export type TaskType = 'ads' | 'daily_login' | 'app_install' | 'survey' | 'offerwall' | 'referral' | 'achievement';
export type TaskStatus = 'active' | 'inactive' | 'completed' | 'locked' | 'expired';
export type TaskUserStatus = 'available' | 'completed' | 'locked' | 'in_progress';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'failed';

// Task Interface
export interface Task {
  id: string;
  title: {
    ar: string;
    en: string;
  };
  description: {
    ar: string;
    en: string;
  };
  type: TaskType;
  provider: string;
  rewardPoints: number;
  rewardUSD: number;
  limitPerUser: number; // -1 for unlimited
  dailyLimit: number; // -1 for unlimited
  countryRestrictions: string[]; // empty for all countries
  status: TaskStatus;
  priority: number; // higher = more visible
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// User Task Interface
export interface UserTask {
  id: string;
  userId: string;
  taskId: string;
  status: TaskUserStatus;
  completedCount: number;
  lastCompletedAt?: Date;
  nextAvailableAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Task History Interface
export interface TaskHistory {
  id: string;
  userId: string;
  taskId: string;
  status: VerificationStatus;
  rewardPoints: number;
  rewardUSD: number;
  provider: string;
  verificationData?: {
    impressionId?: string;
    rewardCallback?: string;
    postbackUrl?: string;
    secret?: string;
  };
  deviceInfo?: {
    deviceId: string;
    os: string;
    appVersion: string;
  };
  timestamp: Date;
  completedAt?: Date;
  rejectionReason?: string;
}

// Ads Types
export type AdNetwork = 'admob' | 'applovin' | 'unity' | 'ironsource' | 'mintegral' | 'liftoff' | 'startio' | 'meta' | 'adsterra';
export type AdType = 'rewarded' | 'interstitial' | 'banner';

export interface AdConfig {
  network: AdNetwork;
  type: AdType;
  unitId: string;
  enabled: boolean;
  priority: number;
}

export interface AdEvent {
  id: string;
  userId: string;
  network: AdNetwork;
  type: AdType;
  impressionId: string;
  rewardAmount: number;
  status: 'shown' | 'clicked' | 'completed' | 'failed';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Daily Login Types
export interface DailyLoginReward {
  day: number;
  points: number;
  usd: number;
}

export interface UserDailyLogin {
  userId: string;
  lastLoginDate: Date;
  currentStreak: number;
  maxStreak: number;
  totalLogins: number;
  lastRewardClaimed?: Date;
}

// Anti Abuse Types
export interface AbuseReport {
  id: string;
  userId: string;
  type: 'vpn' | 'multi_account' | 'bot' | 'fraud' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  evidence?: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  action?: string;
}

export interface DeviceFingerprint {
  deviceId: string;
  os: string;
  osVersion: string;
  appVersion: string;
  brand: string;
  model: string;
  screenResolution: string;
  timezone: string;
  language: string;
  ipAddress?: string;
  createdAt: Date;
}

// Reward Callback Types
export interface RewardCallback {
  id: string;
  userId: string;
  taskId: string;
  callbackData: Record<string, any>;
  verified: boolean;
  verifiedAt?: Date;
  timestamp: Date;
}

// Task Filter Types
export interface TaskFilter {
  type?: TaskType;
  provider?: string;
  status?: TaskStatus;
  minReward?: number;
  maxReward?: number;
  sortBy?: 'reward' | 'newest' | 'priority';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Task Stats Types
export interface TaskStats {
  totalTasks: number;
  availableTasks: number;
  completedTasks: number;
  totalEarnings: number;
  totalPoints: number;
  averageReward: number;
  completionRate: number;
}
