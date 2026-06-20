/**
 * Duplicate Reward Protection Service
 * Prevents double-crediting of rewards
 * 
 * Features:
 * - Transaction ID tracking
 * - Idempotency keys
 * - Rate limiting
 * - Fraud detection
 * - Audit logging
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// ============= Duplicate Protection Service =============

export const duplicateProtectionService = {
  /**
   * Check if reward has already been credited
   */
  async isRewardDuplicate(
    userId: string,
    transactionId: string,
    provider: string
  ): Promise<{
    isDuplicate: boolean;
    previousRewardId?: string;
    previousTimestamp?: Date;
    message: string;
  }> {
    try {
      const checkDuplicate = httpsCallable<any, any>(
        functions,
        'checkRewardDuplicate'
      );

      const result = await checkDuplicate({
        userId,
        transactionId,
        provider,
      });

      return (result.data as any).result;
    } catch (error: any) {
      console.error('Error checking duplicate:', error);
      throw new Error(`Duplicate check failed: ${error.message}`);
    }
  },

  /**
   * Register reward to prevent duplicates
   * Should be called AFTER reward is successfully created
   */
  async registerReward(
    userId: string,
    rewardId: string,
    transactionId: string,
    provider: string,
    rewardAmount: number
  ): Promise<void> {
    try {
      const register = httpsCallable<any, any>(
        functions,
        'registerRewardForDuplicateProtection'
      );

      await register({
        userId,
        rewardId,
        transactionId,
        provider,
        rewardAmount,
      });
    } catch (error: any) {
      console.error('Error registering reward:', error);
      throw new Error(`Reward registration failed: ${error.message}`);
    }
  },

  /**
   * Create idempotency key for request
   * Ensures same request is never processed twice
   */
  createIdempotencyKey(userId: string, provider: string, offerId: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const data = `${userId}:${provider}:${offerId}:${timestamp}`;
    
    // Simple hash - in production, use crypto.subtle.digest
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `${provider}-${Math.abs(hash)}-${timestamp}`;
  },

  /**
   * Check if request with idempotency key was already processed
   */
  async checkIdempotencyKey(idempotencyKey: string): Promise<{
    processed: boolean;
    result?: any;
    message: string;
  }> {
    try {
      const check = httpsCallable<any, any>(
        functions,
        'checkIdempotencyKey'
      );

      const result = await check({ idempotencyKey });
      return (result.data as any).result;
    } catch (error: any) {
      console.error('Error checking idempotency key:', error);
      throw new Error(`Idempotency check failed: ${error.message}`);
    }
  },

  /**
   * Store idempotency key result
   * Called after successful reward creation
   */
  async storeIdempotencyResult(
    idempotencyKey: string,
    result: any,
    ttl: number = 86400 // 24 hours
  ): Promise<void> {
    try {
      const store = httpsCallable<any, any>(
        functions,
        'storeIdempotencyResult'
      );

      await store({
        idempotencyKey,
        result,
        ttl,
      });
    } catch (error: any) {
      console.error('Error storing idempotency result:', error);
      // Don't throw - this is not critical
    }
  },

  /**
   * Get reward history for user and provider
   * Used to detect patterns and suspicious activity
   */
  async getRewardHistory(
    userId: string,
    provider: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const getHistory = httpsCallable<any, any>(
        functions,
        'getRewardHistoryForDuplicateCheck'
      );

      const result = await getHistory({
        userId,
        provider,
        limit,
      });

      return (result.data as any).history || [];
    } catch (error) {
      console.error('Error getting reward history:', error);
      throw error;
    }
  },

  /**
   * Check for rapid reward claiming
   * Detects if user is claiming rewards too quickly
   */
  async checkRapidClaiming(
    userId: string,
    provider: string,
    timeWindow: number = 300 // 5 minutes
  ): Promise<{
    isRapid: boolean;
    recentRewards: number;
    message: string;
  }> {
    try {
      const check = httpsCallable<any, any>(
        functions,
        'checkRapidRewardClaiming'
      );

      const result = await check({
        userId,
        provider,
        timeWindow,
      });

      return (result.data as any).result;
    } catch (error: any) {
      console.error('Error checking rapid claiming:', error);
      throw new Error(`Rapid claiming check failed: ${error.message}`);
    }
  },

  /**
   * Check for same offer completion by multiple accounts
   * Detects potential fraud rings
   */
  async checkMultiAccountFraud(
    offerId: string,
    provider: string,
    timeWindow: number = 3600 // 1 hour
  ): Promise<{
    isSuspicious: boolean;
    accountsCompleted: number;
    message: string;
  }> {
    try {
      const check = httpsCallable<any, any>(
        functions,
        'checkMultiAccountFraud'
      );

      const result = await check({
        offerId,
        provider,
        timeWindow,
      });

      return (result.data as any).result;
    } catch (error: any) {
      console.error('Error checking multi-account fraud:', error);
      throw new Error(`Multi-account fraud check failed: ${error.message}`);
    }
  },

  /**
   * Check for same IP completing same offer
   * Detects potential bot activity
   */
  async checkSameIPFraud(
    offerId: string,
    provider: string,
    ipAddress: string,
    timeWindow: number = 3600 // 1 hour
  ): Promise<{
    isSuspicious: boolean;
    completionCount: number;
    message: string;
  }> {
    try {
      const check = httpsCallable<any, any>(
        functions,
        'checkSameIPFraud'
      );

      const result = await check({
        offerId,
        provider,
        ipAddress,
        timeWindow,
      });

      return (result.data as any).result;
    } catch (error: any) {
      console.error('Error checking same IP fraud:', error);
      throw new Error(`Same IP fraud check failed: ${error.message}`);
    }
  },

  /**
   * Get duplicate protection statistics
   */
  async getStatistics(): Promise<{
    totalRewards: number;
    duplicatesDetected: number;
    duplicateRate: number;
    fraudDetected: number;
    fraudRate: number;
    lastUpdated: Date;
  }> {
    try {
      const getStats = httpsCallable<any, any>(
        functions,
        'getDuplicateProtectionStats'
      );

      const result = await getStats({});
      return (result.data as any).stats;
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  },

  /**
   * Perform complete duplicate check
   * Comprehensive check before crediting reward
   */
  async performCompleteCheck(
    userId: string,
    transactionId: string,
    provider: string,
    offerId: string,
    ipAddress?: string
  ): Promise<{
    canCredit: boolean;
    isDuplicate: boolean;
    isRapidClaiming: boolean;
    isMultiAccountFraud: boolean;
    isSameIPFraud: boolean;
    errors: string[];
    recommendation: 'approve' | 'reject' | 'review';
  }> {
    const errors: string[] = [];
    let isDuplicate = false;
    let isRapidClaiming = false;
    let isMultiAccountFraud = false;
    let isSameIPFraud = false;

    try {
      // 1. Check for duplicate transaction
      const duplicateCheck = await this.isRewardDuplicate(userId, transactionId, provider);
      if (duplicateCheck.isDuplicate) {
        errors.push('Duplicate transaction detected');
        isDuplicate = true;
      }

      // 2. Check for rapid claiming
      const rapidCheck = await this.checkRapidClaiming(userId, provider);
      if (rapidCheck.isRapid) {
        errors.push(`Rapid claiming detected: ${rapidCheck.recentRewards} rewards in 5 minutes`);
        isRapidClaiming = true;
      }

      // 3. Check for multi-account fraud
      const multiAccountCheck = await this.checkMultiAccountFraud(offerId, provider);
      if (multiAccountCheck.isSuspicious) {
        errors.push(`Multi-account fraud detected: ${multiAccountCheck.accountsCompleted} accounts completed this offer`);
        isMultiAccountFraud = true;
      }

      // 4. Check for same IP fraud (if IP provided)
      if (ipAddress) {
        const sameIPCheck = await this.checkSameIPFraud(offerId, provider, ipAddress);
        if (sameIPCheck.isSuspicious) {
          errors.push(`Same IP fraud detected: ${sameIPCheck.completionCount} completions from this IP`);
          isSameIPFraud = true;
        }
      }

      // Determine recommendation
      let recommendation: 'approve' | 'reject' | 'review' = 'approve';
      if (isDuplicate || isRapidClaiming) {
        recommendation = 'reject';
      } else if (isMultiAccountFraud || isSameIPFraud) {
        recommendation = 'review';
      }

      return {
        canCredit: errors.length === 0,
        isDuplicate,
        isRapidClaiming,
        isMultiAccountFraud,
        isSameIPFraud,
        errors,
        recommendation,
      };
    } catch (error: any) {
      console.error('Error in complete check:', error);
      errors.push(error.message);
      return {
        canCredit: false,
        isDuplicate: false,
        isRapidClaiming: false,
        isMultiAccountFraud: false,
        isSameIPFraud: false,
        errors,
        recommendation: 'reject',
      };
    }
  },
};
