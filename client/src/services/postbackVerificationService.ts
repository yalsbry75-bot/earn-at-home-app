/**
 * Postback Verification Service
 * Handles secure verification of CPA postbacks
 * 
 * Features:
 * - HMAC-SHA256 signature verification
 * - Timestamp validation
 * - Duplicate detection
 * - Fraud scoring
 * - Audit logging
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import type { CPAPostbackData, CPAPostbackVerification, CPAFraudDetectionResult } from '../types/cpa';

// ============= Postback Verification Service =============

export const postbackVerificationService = {
  /**
   * Verify CPA postback with signature validation
   * 
   * SECURITY REQUIREMENTS:
   * 1. Signature must be HMAC-SHA256
   * 2. Timestamp must be within 5 minutes
   * 3. Transaction ID must not be duplicate
   * 4. User must not be flagged for fraud
   */
  async verifyPostback(
    provider: string,
    postbackData: CPAPostbackData,
    signature: string
  ): Promise<CPAPostbackVerification> {
    try {
      const verifyPostback = httpsCallable<any, any>(
        functions,
        'verifyPostback'
      );

      const result = await verifyPostback({
        provider,
        postbackData,
        signature,
      });

      const verification = (result.data as any).verification as CPAPostbackVerification;
      return verification;
    } catch (error: any) {
      console.error('Error verifying postback:', error);
      throw new Error(`Postback verification failed: ${error.message}`);
    }
  },

  /**
   * Verify postback signature using HMAC-SHA256
   * 
   * Expected format:
   * signature = HMAC-SHA256(postbackSecret, sortedQueryString)
   */
  async verifySignature(
    provider: string,
    postbackData: Record<string, any>,
    signature: string
  ): Promise<boolean> {
    try {
      const verify = httpsCallable<any, any>(
        functions,
        'verifyPostbackSignature'
      );

      const result = await verify({
        provider,
        postbackData,
        signature,
      });

      return (result.data as any).valid === true;
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  },

  /**
   * Validate postback timestamp
   * Ensures postback is not too old (within 5 minutes)
   */
  async validateTimestamp(timestamp: number): Promise<boolean> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const timeDiff = Math.abs(now - timestamp);
      const maxDiff = 5 * 60; // 5 minutes

      if (timeDiff > maxDiff) {
        console.warn(`⚠️ Postback timestamp too old: ${timeDiff} seconds`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating timestamp:', error);
      return false;
    }
  },

  /**
   * Check for duplicate postback
   * Prevents double-crediting of the same offer
   */
  async checkDuplicate(
    userId: string,
    provider: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      const checkDuplicate = httpsCallable<any, any>(
        functions,
        'checkPostbackDuplicate'
      );

      const result = await checkDuplicate({
        userId,
        provider,
        transactionId,
      });

      return (result.data as any).isDuplicate === true;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
  },

  /**
   * Perform fraud detection on postback
   * Checks for suspicious patterns and anomalies
   */
  async detectFraud(
    userId: string,
    postbackData: CPAPostbackData
  ): Promise<CPAFraudDetectionResult> {
    try {
      const detectFraud = httpsCallable<any, any>(
        functions,
        'detectPostbackFraud'
      );

      const result = await detectFraud({
        userId,
        postbackData,
      });

      return (result.data as any).fraudDetection as CPAFraudDetectionResult;
    } catch (error: any) {
      console.error('Error detecting fraud:', error);
      return {
        isFraud: true,
        fraudScore: 100,
        reasons: ['Error during fraud detection'],
        recommendation: 'reject',
        message: 'Fraud detection failed - rejecting for safety',
      };
    }
  },

  /**
   * Validate postback data structure
   * Ensures all required fields are present
   */
  validatePostbackStructure(postbackData: CPAPostbackData): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check required fields
    if (!postbackData.userId) errors.push('Missing userId');
    if (!postbackData.provider) errors.push('Missing provider');
    if (!postbackData.offerId) errors.push('Missing offerId');
    if (!postbackData.transactionId) errors.push('Missing transactionId');
    if (postbackData.rewardAmount === undefined) errors.push('Missing rewardAmount');
    if (!postbackData.currency) errors.push('Missing currency');
    if (!postbackData.timestamp) errors.push('Missing timestamp');

    // Validate data types
    if (typeof postbackData.rewardAmount !== 'number') {
      errors.push('rewardAmount must be a number');
    }
    if (typeof postbackData.timestamp !== 'number') {
      errors.push('timestamp must be a number');
    }

    // Validate reward amount
    if (postbackData.rewardAmount < 0) {
      errors.push('rewardAmount cannot be negative');
    }
    if (postbackData.rewardAmount > 1000) {
      errors.push('rewardAmount exceeds maximum limit');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Log postback for audit trail
   */
  async logPostback(
    provider: string,
    postbackData: CPAPostbackData,
    status: 'verified' | 'rejected' | 'duplicate' | 'fraud_detected'
  ): Promise<void> {
    try {
      const logPostback = httpsCallable<any, any>(
        functions,
        'logPostback'
      );

      await logPostback({
        provider,
        postbackData,
        status,
      });
    } catch (error) {
      console.error('Error logging postback:', error);
      // Don't throw - logging failure shouldn't block verification
    }
  },

  /**
   * Get postback verification history
   */
  async getVerificationHistory(
    userId: string,
    provider?: string,
    limit: number = 50
  ): Promise<CPAPostbackVerification[]> {
    try {
      const getHistory = httpsCallable<any, any>(
        functions,
        'getPostbackVerificationHistory'
      );

      const result = await getHistory({
        userId,
        provider,
        limit,
      });

      return (result.data as any).history || [];
    } catch (error) {
      console.error('Error getting verification history:', error);
      throw error;
    }
  },

  /**
   * Get postback statistics
   */
  async getPostbackStats(provider?: string): Promise<any> {
    try {
      const getStats = httpsCallable<any, any>(
        functions,
        'getPostbackStats'
      );

      const result = await getStats({ provider });
      return (result.data as any).stats || {};
    } catch (error) {
      console.error('Error getting postback stats:', error);
      throw error;
    }
  },

  /**
   * Verify complete postback workflow
   * Performs all verification checks in sequence
   */
  async verifyComplete(
    userId: string,
    provider: string,
    postbackData: CPAPostbackData,
    signature: string
  ): Promise<{
    verified: boolean;
    errors: string[];
    fraudScore: number;
    recommendation: 'approve' | 'reject' | 'review';
  }> {
    const errors: string[] = [];
    let fraudScore = 0;

    try {
      // 1. Validate structure
      const structureValidation = this.validatePostbackStructure(postbackData);
      if (!structureValidation.valid) {
        errors.push(...structureValidation.errors);
        return {
          verified: false,
          errors,
          fraudScore: 100,
          recommendation: 'reject',
        };
      }

      // 2. Verify signature
      const signatureValid = await this.verifySignature(provider, postbackData, signature);
      if (!signatureValid) {
        errors.push('Invalid signature');
        return {
          verified: false,
          errors,
          fraudScore: 100,
          recommendation: 'reject',
        };
      }

      // 3. Validate timestamp
      const timestampValid = await this.validateTimestamp(postbackData.timestamp);
      if (!timestampValid) {
        errors.push('Timestamp too old');
        return {
          verified: false,
          errors,
          fraudScore: 80,
          recommendation: 'reject',
        };
      }

      // 4. Check for duplicates
      const isDuplicate = await this.checkDuplicate(userId, provider, postbackData.transactionId);
      if (isDuplicate) {
        errors.push('Duplicate transaction');
        return {
          verified: false,
          errors,
          fraudScore: 100,
          recommendation: 'reject',
        };
      }

      // 5. Perform fraud detection
      const fraudDetection = await this.detectFraud(userId, postbackData);
      fraudScore = fraudDetection.fraudScore;

      if (fraudDetection.isFraud) {
        errors.push(...fraudDetection.reasons);
        return {
          verified: false,
          errors,
          fraudScore,
          recommendation: fraudDetection.recommendation,
        };
      }

      // 6. Log successful verification
      await this.logPostback(provider, postbackData, 'verified');

      return {
        verified: true,
        errors: [],
        fraudScore,
        recommendation: 'approve',
      };
    } catch (error: any) {
      console.error('Error in complete verification:', error);
      errors.push(error.message);
      return {
        verified: false,
        errors,
        fraudScore: 100,
        recommendation: 'reject',
      };
    }
  },
};
