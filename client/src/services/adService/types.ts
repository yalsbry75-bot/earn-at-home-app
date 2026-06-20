/**
 * Ad Service - Type Definitions
 */

export interface IAdProvider {
  name: string;
  isAvailable(): boolean;
  showAd(adType: 'banner' | 'interstitial' | 'rewarded'): Promise<AdRewardResponse>;
  createReward(request: AdRewardRequest): Promise<AdRewardResponse>;
  getStats(): Promise<AdStats>;
}

export interface AdRewardRequest {
  userId: string;
  adType: 'banner' | 'interstitial' | 'rewarded' | 'native';
  provider: string;
  impressionId: string;
  pointsEarned: number;
  deviceFingerprint: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface AdRewardResponse {
  success: boolean;
  rewardId?: string;
  message: string;
  error?: string;
  points?: number;
}

export interface AdStats {
  totalAds: number;
  totalRewards: number;
  totalPoints: number;
  period: string;
}

export interface AdImpression {
  id: string;
  userId: string;
  adType: 'banner' | 'interstitial' | 'rewarded' | 'native';
  provider: string;
  impressionId: string;
  pointsEarned: number;
  verified: boolean;
  deviceFingerprint: string;
  ipAddress?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
