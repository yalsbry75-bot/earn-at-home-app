/**
 * Referral System Types
 * Types for referral management, fraud detection, and risk scoring
 */

// ============= Referral Types =============

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  status: 'pending' | 'qualified' | 'rejected';
  createdAt: Date;
  qualifiedAt?: Date;
  rejectionReason?: string;
  referrerReward?: number;
  referredReward?: number;
}

export interface ReferralCode {
  userId: string;
  code: string;
  link: string;
  createdAt: Date;
  updatedAt: Date;
  totalReferrals: number;
  qualifiedReferrals: number;
  totalEarnings: number;
}

export interface ReferralStats {
  userId: string;
  totalReferrals: number;
  qualifiedReferrals: number;
  pendingReferrals: number;
  rejectedReferrals: number;
  totalEarnings: number;
  averageQualificationTime: number;
}

// ============= Anti-Fraud Types =============

export interface DeviceFingerprint {
  id: string;
  userId: string;
  deviceId: string;
  browserFingerprint: string;
  osVersion: string;
  screenResolution: string;
  hardwareSignature?: string;
  createdAt: Date;
  lastSeenAt: Date;
  isVerified: boolean;
}

export interface IPIntelligence {
  id: string;
  userId: string;
  ipAddress: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  isVPN: boolean;
  isProxy: boolean;
  isDatacenter: boolean;
  reputation: number; // 0-100, higher = more suspicious
  createdAt: Date;
  lastSeenAt: Date;
}

export interface BehaviorAnalysis {
  id: string;
  userId: string;
  taskCompletionSpeed: number; // milliseconds
  clickPattern: string;
  interactionTime: number;
  isAutomated: boolean;
  automationScore: number; // 0-100
  createdAt: Date;
}

export interface AccountLinking {
  id: string;
  userId: string;
  linkedUserIds: string[];
  linkReason: 'same_device' | 'same_ip' | 'same_fingerprint' | 'network';
  detectedAt: Date;
  severity: 'low' | 'medium' | 'high';
}

export interface FraudFlag {
  id: string;
  userId: string;
  flagType: 'self_referral' | 'same_device' | 'same_ip' | 'vpn_detected' | 'bot_behavior' | 'account_linking' | 'rapid_tasks';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metadata: Record<string, any>;
  createdAt: Date;
  resolvedAt?: Date;
  action: 'warning' | 'temporary_hold' | 'manual_review' | 'freeze' | 'ban';
}

// ============= Risk Score Types =============

export interface RiskScore {
  id: string;
  userId: string;
  score: number; // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  lastUpdated: Date;
  nextReviewDate: Date;
}

export interface RiskFactor {
  name: string;
  weight: number; // 0-1
  value: number; // 0-100
  description: string;
  timestamp: Date;
}

export interface RiskAction {
  id: string;
  userId: string;
  riskScore: number;
  action: 'none' | 'warning' | 'temporary_hold' | 'manual_review' | 'freeze' | 'ban';
  reason: string;
  metadata: Record<string, any>;
  createdAt: Date;
  executedAt?: Date;
  resolvedAt?: Date;
}

// ============= Security Logs Types =============

export interface SecurityLog {
  id: string;
  userId: string;
  action: string;
  reason: string;
  riskScore: number;
  metadata: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  deviceId?: string;
}

// ============= Referral Qualification Rules =============

export interface ReferralQualificationRules {
  emailVerificationRequired: boolean;
  minTasksCompleted: number;
  minHoursAfterRegistration: number;
  minPointsEarned: number;
  maxReferralsPerDay: number;
  maxReferralsPerMonth: number;
}

// ============= Referral Rewards =============

export interface ReferralRewards {
  referrerReward: number;
  referredReward: number;
  bonusReward?: number;
  bonusThreshold?: number;
}

// ============= UI State Types =============

export interface ReferralState {
  referralCode: string;
  referralLink: string;
  stats: ReferralStats | null;
  referrals: Referral[];
  isLoading: boolean;
  error: string | null;
}

export interface FraudState {
  riskScore: RiskScore | null;
  fraudFlags: FraudFlag[];
  isLoading: boolean;
  error: string | null;
}
