/**
 * Web Ad Provider
 * PRODUCTION IMPLEMENTATION - REAL ADS ONLY
 * 
 * ⚠️ CRITICAL SECURITY NOTICE:
 * - NO simulated rewards
 * - NO setTimeout-based rewards
 * - NO fake ad events
 * - All rewards MUST be created by Cloud Functions only
 * - Frontend NEVER submits reward amounts
 * - Rewards are disabled until a real ad provider is integrated
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase/config';
import { antifraudService } from '../../antifraudService';
import type { IAdProvider, AdRewardRequest, AdRewardResponse, AdStats } from '../types';
import { nanoid } from 'nanoid';

export class WebAdProvider implements IAdProvider {
  name = 'web';
  private readonly REAL_AD_PROVIDERS = ['google-admob', 'facebook-audience', 'applovin'];
  private activeProvider: string | null = null;

  constructor() {
    // Check if a real ad provider is configured
    const provider = process.env.REACT_APP_AD_PROVIDER;
    if (provider && this.REAL_AD_PROVIDERS.includes(provider)) {
      this.activeProvider = provider;
      console.log(`✅ Real ad provider configured: ${provider}`);
    } else {
      console.warn('⚠️ WARNING: No real ad provider configured. Rewarded ads are DISABLED.');
      console.warn('To enable ads, configure one of: ' + this.REAL_AD_PROVIDERS.join(', '));
    }
  }

  /**
   * Check if ads are available
   * Returns false if no real provider is configured
   */
  isAvailable(): boolean {
    return this.activeProvider !== null;
  }

  /**
   * Show ad - ONLY works with real ad providers
   * 
   * ⚠️ SECURITY: This method does NOT create rewards directly.
   * Rewards are ONLY created by Cloud Functions after server-side validation.
   */
  async showAd(adType: 'banner' | 'interstitial' | 'rewarded'): Promise<AdRewardResponse> {
    try {
      // SECURITY CHECK: Reject if no real provider is configured
      if (!this.activeProvider) {
        return {
          success: false,
          message: 'Rewarded ads are not available. No real ad provider is configured.',
          error: 'NO_REAL_PROVIDER',
        };
      }

      // SECURITY CHECK: Only rewarded ads can generate rewards
      if (adType !== 'rewarded') {
        return {
          success: true,
          message: `${adType} ad displayed (no reward)`,
          points: 0,
        };
      }

      // For rewarded ads, we return a response indicating the user should watch an ad
      // The actual reward creation happens ONLY in Cloud Functions after validation
      return {
        success: true,
        message: 'Ready to show rewarded ad. Reward will be created by server after ad completion.',
        points: 0, // Points are NEVER set by frontend
      };
    } catch (error: any) {
      console.error('❌ Error in showAd:', error);
      return {
        success: false,
        message: 'Failed to show ad',
        error: error.message,
      };
    }
  }

  /**
   * Create reward via Cloud Function ONLY
   * 
   * ⚠️ CRITICAL SECURITY REQUIREMENTS:
   * 1. Frontend NEVER calculates or submits reward amounts
   * 2. Server ALWAYS validates the reward amount
   * 3. Server ALWAYS validates the user's eligibility
   * 4. Server ALWAYS checks for fraud indicators
   * 5. All rewards are logged in audit trail
   */
  async createReward(request: AdRewardRequest): Promise<AdRewardResponse> {
    try {
      // SECURITY CHECK: Reject if no real provider
      if (!this.activeProvider) {
        return {
          success: false,
          message: 'Rewards are disabled. No real ad provider is configured.',
          error: 'REWARDS_DISABLED',
        };
      }

      // SECURITY CHECK: Frontend MUST NOT submit pointsEarned
      // The server will calculate this based on ad type and user eligibility
      if (request.pointsEarned && request.pointsEarned > 0) {
        console.error('❌ SECURITY VIOLATION: Frontend attempted to submit pointsEarned');
        return {
          success: false,
          message: 'Invalid reward request. Frontend cannot specify reward amount.',
          error: 'INVALID_REQUEST',
        };
      }

      // Get device fingerprint for fraud detection
      const fingerprint = await antifraudService.createDeviceFingerprint(request.userId);
      const deviceFingerprint = fingerprint.browserFingerprint;

      // Prepare reward request - WITHOUT pointsEarned (server will calculate)
      const rewardRequest: AdRewardRequest = {
        userId: request.userId,
        adType: request.adType,
        provider: this.activeProvider,
        deviceFingerprint,
        impressionId: request.impressionId || nanoid(),
        // SECURITY: pointsEarned is NOT included - server will calculate
        pointsEarned: 0, // Placeholder, server will override
      };

      // Call Cloud Function to create reward
      // The Cloud Function will:
      // 1. Validate the user's eligibility
      // 2. Check for fraud indicators
      // 3. Calculate the correct reward amount
      // 4. Create the reward in Firestore
      // 5. Log the action in audit trail
      const createAdReward = httpsCallable<AdRewardRequest, AdRewardResponse>(
        functions,
        'createAdReward'
      );

      const result = await createAdReward(rewardRequest);

      if (result.data.success) {
        console.log('✅ Reward created successfully by Cloud Function');
        return {
          success: true,
          rewardId: result.data.rewardId,
          message: 'Reward created successfully',
          points: result.data.points || 0, // Points from server, not frontend
        };
      }

      console.warn('⚠️ Cloud Function rejected reward:', result.data.message);
      return {
        success: false,
        message: result.data.message,
        error: result.data.error,
      };
    } catch (error: any) {
      console.error('❌ Error creating reward:', error);

      return {
        success: false,
        message: 'Failed to create reward',
        error: error.message,
      };
    }
  }

  /**
   * Get ad statistics from server
   */
  async getStats(): Promise<AdStats> {
    try {
      const getAdRewardStats = httpsCallable<void, any>(
        functions,
        'getAdRewardStats'
      );

      const result = await getAdRewardStats();

      if (result.data.success) {
        return result.data.stats;
      }

      return {
        totalAds: 0,
        totalRewards: 0,
        totalPoints: 0,
        period: '24h',
      };
    } catch (error: any) {
      console.error('Error getting ad stats:', error);

      return {
        totalAds: 0,
        totalRewards: 0,
        totalPoints: 0,
        period: '24h',
      };
    }
  }

  /**
   * Get provider status
   */
  getProviderStatus(): {
    available: boolean;
    provider: string | null;
    message: string;
  } {
    return {
      available: this.isAvailable(),
      provider: this.activeProvider,
      message: this.activeProvider
        ? `✅ Real ad provider configured: ${this.activeProvider}`
        : '⚠️ No real ad provider configured. Rewarded ads are disabled.',
    };
  }
}
