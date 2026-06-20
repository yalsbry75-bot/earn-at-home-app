/**
 * Transaction Logging Service
 * Comprehensive audit logging for all financial transactions
 * 
 * Features:
 * - Detailed transaction logging
 * - Audit trail tracking
 * - Event logging
 * - User activity tracking
 * - Fraud detection logging
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

// ============= Transaction Logging Service =============

export const transactionLoggingService = {
  /**
   * Log reward transaction
   */
  async logRewardTransaction(
    userId: string,
    provider: string,
    transactionData: {
      rewardId: string;
      offerId: string;
      offerName: string;
      transactionId: string;
      rewardAmount: number;
      rewardCurrency: string;
      points: number;
      status: 'pending' | 'verified' | 'rejected' | 'fraud_detected';
      fraudScore?: number;
      deviceFingerprint?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const logTransaction = httpsCallable<any, any>(
        functions,
        'logRewardTransaction'
      );

      await logTransaction({
        userId,
        provider,
        transactionData,
      });
    } catch (error) {
      console.error('Error logging reward transaction:', error);
      // Don't throw - logging failure shouldn't block reward
    }
  },

  /**
   * Log withdrawal transaction
   */
  async logWithdrawalTransaction(
    userId: string,
    withdrawalData: {
      withdrawalId: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
      fee: number;
      netAmount: number;
      transactionHash?: string;
      bankDetails?: Record<string, any>;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const logTransaction = httpsCallable<any, any>(
        functions,
        'logWithdrawalTransaction'
      );

      await logTransaction({
        userId,
        withdrawalData,
      });
    } catch (error) {
      console.error('Error logging withdrawal transaction:', error);
      // Don't throw - logging failure shouldn't block withdrawal
    }
  },

  /**
   * Log referral transaction
   */
  async logReferralTransaction(
    userId: string,
    referralData: {
      referralId: string;
      referredUserId: string;
      referralCode: string;
      rewardAmount: number;
      rewardCurrency: string;
      points: number;
      status: 'pending' | 'qualified' | 'rejected';
      qualificationReason?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const logTransaction = httpsCallable<any, any>(
        functions,
        'logReferralTransaction'
      );

      await logTransaction({
        userId,
        referralData,
      });
    } catch (error) {
      console.error('Error logging referral transaction:', error);
      // Don't throw - logging failure shouldn't block referral
    }
  },

  /**
   * Log user activity
   */
  async logUserActivity(
    userId: string,
    activity: {
      action: string;
      category: string;
      description: string;
      status: 'success' | 'failed' | 'pending';
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const logActivity = httpsCallable<any, any>(
        functions,
        'logUserActivity'
      );

      await logActivity({
        userId,
        activity,
      });
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Don't throw - logging failure shouldn't block activity
    }
  },

  /**
   * Log fraud detection event
   */
  async logFraudDetectionEvent(
    userId: string,
    fraudData: {
      eventType: string;
      fraudScore: number;
      reasons: string[];
      recommendation: 'approve' | 'reject' | 'review';
      transactionId?: string;
      provider?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const logFraud = httpsCallable<any, any>(
        functions,
        'logFraudDetectionEvent'
      );

      await logFraud({
        userId,
        fraudData,
      });
    } catch (error) {
      console.error('Error logging fraud detection event:', error);
      // Don't throw - logging failure shouldn't block fraud detection
    }
  },

  /**
   * Get transaction history for user
   */
  async getTransactionHistory(
    userId: string,
    type?: 'reward' | 'withdrawal' | 'referral' | 'all',
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const getHistory = httpsCallable<any, any>(
        functions,
        'getTransactionHistory'
      );

      const result = await getHistory({
        userId,
        type,
        limit,
        offset,
      });

      return (result.data as any).transactions || [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  },

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<any> {
    try {
      const getTransaction = httpsCallable<any, any>(
        functions,
        'getTransaction'
      );

      const result = await getTransaction({ transactionId });
      return (result.data as any).transaction;
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  },

  /**
   * Get user activity log
   */
  async getUserActivityLog(
    userId: string,
    category?: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const getActivityLog = httpsCallable<any, any>(
        functions,
        'getUserActivityLog'
      );

      const result = await getActivityLog({
        userId,
        category,
        limit,
      });

      return (result.data as any).activities || [];
    } catch (error) {
      console.error('Error getting activity log:', error);
      throw error;
    }
  },

  /**
   * Get audit trail for specific transaction
   */
  async getAuditTrail(transactionId: string): Promise<any[]> {
    try {
      const getAuditTrail = httpsCallable<any, any>(
        functions,
        'getAuditTrail'
      );

      const result = await getAuditTrail({ transactionId });
      return (result.data as any).auditTrail || [];
    } catch (error) {
      console.error('Error getting audit trail:', error);
      throw error;
    }
  },

  /**
   * Get fraud detection log
   */
  async getFraudDetectionLog(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const getFraudLog = httpsCallable<any, any>(
        functions,
        'getFraudDetectionLog'
      );

      const result = await getFraudLog({
        userId,
        limit,
      });

      return (result.data as any).fraudLog || [];
    } catch (error) {
      console.error('Error getting fraud detection log:', error);
      throw error;
    }
  },

  /**
   * Get transaction statistics
   */
  async getTransactionStatistics(
    userId: string,
    period: '24h' | '7d' | '30d' | 'all' = '30d'
  ): Promise<any> {
    try {
      const getStats = httpsCallable<any, any>(
        functions,
        'getTransactionStatistics'
      );

      const result = await getStats({
        userId,
        period,
      });

      return (result.data as any).statistics;
    } catch (error) {
      console.error('Error getting transaction statistics:', error);
      throw error;
    }
  },

  /**
   * Export transaction history as CSV
   */
  async exportTransactionHistory(
    userId: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    try {
      const exportData = httpsCallable<any, any>(
        functions,
        'exportTransactionHistory'
      );

      const result = await exportData({
        userId,
        format,
      });

      return (result.data as any).data;
    } catch (error) {
      console.error('Error exporting transaction history:', error);
      throw error;
    }
  },

  /**
   * Get system-wide transaction statistics
   * Admin only
   */
  async getSystemTransactionStatistics(
    period: '24h' | '7d' | '30d' = '24h'
  ): Promise<any> {
    try {
      const getStats = httpsCallable<any, any>(
        functions,
        'getSystemTransactionStatistics'
      );

      const result = await getStats({ period });
      return (result.data as any).statistics;
    } catch (error) {
      console.error('Error getting system statistics:', error);
      throw error;
    }
  },

  /**
   * Search transactions
   */
  async searchTransactions(
    query: {
      userId?: string;
      provider?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      minAmount?: number;
      maxAmount?: number;
    },
    limit: number = 100
  ): Promise<any[]> {
    try {
      const search = httpsCallable<any, any>(
        functions,
        'searchTransactions'
      );

      const result = await search({
        query,
        limit,
      });

      return (result.data as any).transactions || [];
    } catch (error) {
      console.error('Error searching transactions:', error);
      throw error;
    }
  },

  /**
   * Generate transaction report
   */
  async generateTransactionReport(
    userId: string,
    reportType: 'summary' | 'detailed' | 'fraud_analysis' = 'summary',
    period: '24h' | '7d' | '30d' | 'all' = '30d'
  ): Promise<any> {
    try {
      const generateReport = httpsCallable<any, any>(
        functions,
        'generateTransactionReport'
      );

      const result = await generateReport({
        userId,
        reportType,
        period,
      });

      return (result.data as any).report;
    } catch (error) {
      console.error('Error generating transaction report:', error);
      throw error;
    }
  },
};
