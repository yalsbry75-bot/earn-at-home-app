/**
 * CPA Service - Multi-Provider Integration
 * Handles CPA (Cost Per Action) integrations with:
 * - AdGate Media
 * - CPAGrip
 * - Lootably
 * 
 * Features:
 * - Secure postback verification
 * - Duplicate reward protection
 * - Transaction logging
 * - Server-side reward crediting
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import type { CPAProvider, CPARewardRequest, CPARewardResponse, CPAPostbackData } from '../types/cpa';

// ============= CPA Service =============

export const cpaService = {
  /**
   * Get CPA provider configuration
   */
  async getProviderConfig(provider: CPAProvider): Promise<any> {
    try {
      const getCPAConfig = httpsCallable(functions, 'getCPAConfig');
      const result = await getCPAConfig({ provider });
      return (result.data as any).config || null;
    } catch (error) {
      console.error(`Error getting ${provider} config:`, error);
      throw error;
    }
  },

  /**
   * Get all CPA provider configurations
   */
  async getAllProviderConfigs(): Promise<Record<CPAProvider, any>> {
    try {
      const getAllCPAConfigs = httpsCallable(functions, 'getAllCPAConfigs');
      const result = await getAllCPAConfigs({});
      return (result.data as any).configs || {};
    } catch (error) {
      console.error('Error getting all CPA configs:', error);
      throw error;
    }
  },

  /**
   * Create CPA reward request
   * Frontend submits minimal data, server validates and creates reward
   */
  async createCPAReward(request: CPARewardRequest): Promise<CPARewardResponse> {
    try {
      // SECURITY: Frontend MUST NOT submit reward amount
      if (request.rewardAmount && request.rewardAmount > 0) {
        console.error('❌ SECURITY VIOLATION: Frontend attempted to submit rewardAmount');
        return {
          success: false,
          message: 'Invalid reward request. Frontend cannot specify reward amount.',
          error: 'INVALID_REQUEST',
        };
      }

      // Call Cloud Function to create CPA reward
      const createCPAReward = httpsCallable<CPARewardRequest, CPARewardResponse>(
        functions,
        'createCPAReward'
      );

      const result = await createCPAReward({
        userId: request.userId,
        provider: request.provider,
        offerId: request.offerId,
        offerName: request.offerName,
        transactionId: request.transactionId,
        deviceFingerprint: request.deviceFingerprint,
        // SECURITY: rewardAmount NOT included - server will calculate
      });

      if (result.data.success) {
        console.log(`✅ CPA reward created for ${request.provider}`);
        return {
          success: true,
          rewardId: result.data.rewardId,
          message: 'CPA reward created successfully',
          points: result.data.points || 0,
          usd: result.data.usd || 0,
        };
      }

      console.warn(`⚠️ CPA reward rejected: ${result.data.message}`);
      return {
        success: false,
        message: result.data.message,
        error: result.data.error,
      };
    } catch (error: any) {
      console.error('Error creating CPA reward:', error);
      return {
        success: false,
        message: 'Failed to create CPA reward',
        error: error.message,
      };
    }
  },

  /**
   * Verify CPA postback signature
   * Used for server-side verification of postback data
   */
  async verifyPostbackSignature(
    provider: CPAProvider,
    postbackData: CPAPostbackData,
    signature: string
  ): Promise<boolean> {
    try {
      const verifyPostback = httpsCallable<any, any>(
        functions,
        'verifyCPAPostback'
      );

      const result = await verifyPostback({
        provider,
        postbackData,
        signature,
      });

      return (result.data as any).verified === true;
    } catch (error) {
      console.error('Error verifying postback:', error);
      return false;
    }
  },

  /**
   * Get CPA reward history
   */
  async getCPARewardHistory(userId: string, provider?: CPAProvider, limit: number = 50): Promise<any[]> {
    try {
      const getCPAHistory = httpsCallable<any, any>(
        functions,
        'getCPARewardHistory'
      );

      const result = await getCPAHistory({
        userId,
        provider,
        limit,
      });

      return (result.data as any).history || [];
    } catch (error) {
      console.error('Error getting CPA reward history:', error);
      throw error;
    }
  },

  /**
   * Check for duplicate CPA reward
   * Prevents double-crediting of the same offer
   */
  async checkDuplicateReward(
    userId: string,
    provider: CPAProvider,
    transactionId: string
  ): Promise<boolean> {
    try {
      const checkDuplicate = httpsCallable<any, any>(
        functions,
        'checkCPADuplicate'
      );

      const result = await checkDuplicate({
        userId,
        provider,
        transactionId,
      });

      return (result.data as any).isDuplicate === true;
    } catch (error) {
      console.error('Error checking duplicate reward:', error);
      return false;
    }
  },

  /**
   * Get CPA provider status and statistics
   */
  async getProviderStats(provider: CPAProvider): Promise<any> {
    try {
      const getStats = httpsCallable<any, any>(
        functions,
        'getCPAProviderStats'
      );

      const result = await getStats({ provider });
      return (result.data as any).stats || {};
    } catch (error) {
      console.error(`Error getting ${provider} stats:`, error);
      throw error;
    }
  },

  /**
   * Get all CPA statistics
   */
  async getAllProviderStats(): Promise<Record<CPAProvider, any>> {
    try {
      const getAllStats = httpsCallable<any, any>(
        functions,
        'getAllCPAProviderStats'
      );

      const result = await getAllStats({});
      return (result.data as any).stats || {};
    } catch (error) {
      console.error('Error getting all CPA stats:', error);
      throw error;
    }
  },

  /**
   * Log CPA transaction for audit trail
   */
  async logCPATransaction(
    userId: string,
    provider: CPAProvider,
    transactionData: Record<string, any>
  ): Promise<void> {
    try {
      const logTransaction = httpsCallable<any, any>(
        functions,
        'logCPATransaction'
      );

      await logTransaction({
        userId,
        provider,
        transactionData,
      });
    } catch (error) {
      console.error('Error logging CPA transaction:', error);
      // Don't throw - logging failure shouldn't block reward creation
    }
  },

  /**
   * Get CPA offer list from provider
   */
  async getOffers(provider: CPAProvider, userId: string): Promise<any[]> {
    try {
      const getOffers = httpsCallable<any, any>(
        functions,
        'getCPAOffers'
      );

      const result = await getOffers({
        provider,
        userId,
      });

      return (result.data as any).offers || [];
    } catch (error) {
      console.error(`Error getting offers from ${provider}:`, error);
      throw error;
    }
  },

  /**
   * Track CPA offer click
   */
  async trackOfferClick(
    userId: string,
    provider: CPAProvider,
    offerId: string
  ): Promise<void> {
    try {
      const trackClick = httpsCallable<any, any>(
        functions,
        'trackCPAOfferClick'
      );

      await trackClick({
        userId,
        provider,
        offerId,
      });
    } catch (error) {
      console.error('Error tracking offer click:', error);
      // Don't throw - tracking failure shouldn't block user
    }
  },

  /**
   * Get provider-specific offer URL
   */
  async getOfferURL(
    userId: string,
    provider: CPAProvider,
    offerId: string
  ): Promise<string | null> {
    try {
      const getURL = httpsCallable<any, any>(
        functions,
        'getCPAOfferURL'
      );

      const result = await getURL({
        userId,
        provider,
        offerId,
      });

      return (result.data as any).url || null;
    } catch (error) {
      console.error('Error getting offer URL:', error);
      return null;
    }
  },
};

// ============= CPA Provider-Specific Services =============

export const adgateMediaService = {
  /**
   * AdGate Media specific configuration
   */
  async getConfig() {
    return cpaService.getProviderConfig('adgate_media');
  },

  /**
   * Create AdGate Media reward
   */
  async createReward(request: Omit<CPARewardRequest, 'provider'>) {
    return cpaService.createCPAReward({
      ...request,
      provider: 'adgate_media',
    });
  },

  /**
   * Get AdGate Media offers
   */
  async getOffers(userId: string) {
    return cpaService.getOffers('adgate_media', userId);
  },
};

export const cpaGripService = {
  /**
   * CPAGrip specific configuration
   */
  async getConfig() {
    return cpaService.getProviderConfig('cpagrip');
  },

  /**
   * Create CPAGrip reward
   */
  async createReward(request: Omit<CPARewardRequest, 'provider'>) {
    return cpaService.createCPAReward({
      ...request,
      provider: 'cpagrip',
    });
  },

  /**
   * Get CPAGrip offers
   */
  async getOffers(userId: string) {
    return cpaService.getOffers('cpagrip', userId);
  },
};

export const lootablyService = {
  /**
   * Lootably specific configuration
   */
  async getConfig() {
    return cpaService.getProviderConfig('lootably');
  },

  /**
   * Create Lootably reward
   */
  async createReward(request: Omit<CPARewardRequest, 'provider'>) {
    return cpaService.createCPAReward({
      ...request,
      provider: 'lootably',
    });
  },

  /**
   * Get Lootably offers
   */
  async getOffers(userId: string) {
    return cpaService.getOffers('lootably', userId);
  },
};
