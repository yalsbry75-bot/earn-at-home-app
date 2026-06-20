import { Timestamp } from 'firebase/firestore';

// Ads Types
export interface AdImpression {
  id?: string;
  userId: string;
  adNetwork: 'admob' | 'applovin' | 'unity' | 'ironsource' | 'mintegral' | 'vungle' | 'meta' | 'startio';
  adType: 'rewarded' | 'interstitial' | 'banner';
  impressionId: string;
  rewarded: boolean;
  pointsEarned?: number;
  verified: boolean;
  timestamp: Timestamp | Date;
}

// Notification Types
export interface Notification {
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'task' | 'earning' | 'withdrawal' | 'referral' | 'security' | 'admin';
  read: boolean;
  deepLink?: string;
  createdAt: Timestamp | Date;
}

// Feature Flags Types
export interface FeatureFlags {
  adsEnabled: boolean;
  tasksEnabled: boolean;
  withdrawalsEnabled: boolean;
  referralsEnabled: boolean;
  maintenanceMode: boolean;
  minVersion: string;
  globalNotification?: string;
}

// Analytics Event Types
export interface AnalyticsEvent {
  id?: string;
  userId: string;
  eventName: string;
  params: Record<string, any>;
  platform: 'web' | 'ios' | 'android';
  timestamp: Timestamp | Date;
}

// Crash Report Types
export interface CrashReport {
  id?: string;
  userId?: string;
  errorName: string;
  errorMessage: string;
  stackTrace: string;
  componentStack?: string;
  deviceInfo: {
    browser: string;
    os: string;
    userAgent: string;
  };
  timestamp: Timestamp | Date;
}
