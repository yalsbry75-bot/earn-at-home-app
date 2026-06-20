/**
 * Wallet Service (Production-Ready)
 * Handles wallet operations via Cloud Functions only
 * Frontend NEVER modifies balances directly
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import type { Wallet, Transaction, PointsLedger } from '../types';

// ============= Wallet Services =============

export const walletService = {
  /**
   * Get wallet for user via Cloud Function
   */
  async getWallet(userId?: string): Promise<Wallet | null> {
    try {
      const getWallet = httpsCallable<void, any>(functions, 'getWallet');
      const result = await getWallet();

      if (result.data.success) {
        const wallet = result.data.wallet;
        return {
          ...wallet,
          createdAt: wallet.createdAt?.toDate?.() || new Date(wallet.createdAt),
          updatedAt: wallet.updatedAt?.toDate?.() || new Date(wallet.updatedAt),
        } as Wallet;
      }

      return null;
    } catch (error) {
      console.error('Error getting wallet:', error);
      throw error;
    }
  },

  /**
   * Get wallet summary via Cloud Function
   */
  async getWalletSummary(userId?: string) {
    try {
      const getWalletSummary = httpsCallable<void, any>(functions, 'getWalletSummary');
      const result = await getWalletSummary();

      if (result.data.success) {
        return result.data.summary;
      }

      return null;
    } catch (error) {
      console.error('Error getting wallet summary:', error);
      throw error;
    }
  },

  /**
   * NOTE: Frontend NEVER calls updateWallet directly
   * All wallet updates are done via Cloud Functions only
   */
  async updateWallet(userId: string, updates: Partial<Wallet>) {
    throw new Error(
      'Frontend cannot update wallet directly. Use Cloud Functions instead.'
    );
  },
};

// ============= Points Services =============

export const pointsService = {
  /**
   * Get user points via Cloud Function
   */
  async getUserPoints(userId?: string): Promise<number> {
    try {
      const wallet = await walletService.getWallet();
      return wallet?.availableBalance || 0;
    } catch (error) {
      console.error('Error getting user points:', error);
      return 0;
    }
  },

  /**
   * Get points ledger via Cloud Function
   */
  async getPointsLedger(userId?: string, limit: number = 50): Promise<PointsLedger[]> {
    try {
      const getPointsLedger = httpsCallable<{ limit: number }, any>(
        functions,
        'getPointsLedger'
      );
      const result = await getPointsLedger({ limit });

      if (result.data.success) {
        return result.data.ledger || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting points ledger:', error);
      return [];
    }
  },

  /**
   * NOTE: Frontend NEVER calls addPointsLedgerEntry directly
   * All ledger entries are created via Cloud Functions only
   */
  async addPointsLedgerEntry(
    userId: string,
    type: 'earn' | 'spend',
    amount: number,
    reason: string,
    source: string
  ) {
    throw new Error(
      'Frontend cannot add ledger entries directly. Use Cloud Functions instead.'
    );
  },

  // Convert points to USD
  convertPointsToUSD(points: number, conversionRate: number = 2000): number {
    return points / conversionRate;
  },

  // Convert USD to points
  convertUSDToPoints(usd: number, conversionRate: number = 2000): number {
    return usd * conversionRate;
  },
};

// ============= Transaction Services =============

export const transactionService = {
  /**
   * Get user transactions via Cloud Function
   */
  async getUserTransactions(userId?: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const getUserTransactions = httpsCallable<{ limit: number }, any>(
        functions,
        'getUserTransactions'
      );
      const result = await getUserTransactions({ limit });

      if (result.data.success) {
        return result.data.transactions || [];
      }

      return [];
    } catch (error) {
      console.error('Error getting user transactions:', error);
      return [];
    }
  },

  /**
   * Get transaction by ID via Cloud Function
   */
  async getTransaction(transactionId: string): Promise<Transaction | null> {
    try {
      const getTransaction = httpsCallable<{ transactionId: string }, any>(
        functions,
        'getTransaction'
      );
      const result = await getTransaction({ transactionId });

      if (result.data.success) {
        return result.data.transaction || null;
      }

      return null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  },

  /**
   * NOTE: Frontend NEVER calls addTransaction directly
   * All transactions are created via Cloud Functions only
   */
  async addTransaction(
    userId: string,
    type: 'earned' | 'withdrawal' | 'referral' | 'task',
    amount: number,
    status: 'pending' | 'completed' | 'failed',
    source: string,
    description: string
  ) {
    throw new Error(
      'Frontend cannot add transactions directly. Use Cloud Functions instead.'
    );
  },
};

// ============= Level Services =============

export const levelService = {
  /**
   * Get user level based on total earnings
   */
  async getUserLevel(userId?: string): Promise<string> {
    try {
      const wallet = await walletService.getWallet();
      const totalEarnings = wallet?.totalEarnings || 0;
      return this.calculateLevel(totalEarnings);
    } catch (error) {
      console.error('Error getting user level:', error);
      return 'Bronze';
    }
  },

  // Get level info
  getLevelInfo(level: string) {
    const levels = {
      Bronze: {
        name: 'Bronze',
        minPoints: 0,
        maxPoints: 99,
        bonus: 0,
        color: '#CD7F32',
        description: 'مستوى البرونز - ابدأ رحلتك',
      },
      Silver: {
        name: 'Silver',
        minPoints: 100,
        maxPoints: 499,
        bonus: 5,
        color: '#C0C0C0',
        description: 'مستوى الفضة - زيادة 5% في الأرباح',
      },
      Gold: {
        name: 'Gold',
        minPoints: 500,
        maxPoints: 999,
        bonus: 10,
        color: '#FFD700',
        description: 'مستوى الذهب - زيادة 10% في الأرباح',
      },
      Platinum: {
        name: 'Platinum',
        minPoints: 1000,
        maxPoints: Infinity,
        bonus: 20,
        color: '#E5E4E2',
        description: 'مستوى البلاتين - زيادة 20% في الأرباح',
      },
    };

    return levels[level as keyof typeof levels] || levels.Bronze;
  },

  // Calculate level based on points
  calculateLevel(points: number): string {
    if (points >= 1000) return 'Platinum';
    if (points >= 500) return 'Gold';
    if (points >= 100) return 'Silver';
    return 'Bronze';
  },

  // Get points needed for next level
  getPointsForNextLevel(currentPoints: number): number {
    const currentLevel = this.calculateLevel(currentPoints);

    switch (currentLevel) {
      case 'Bronze':
        return 100 - currentPoints;
      case 'Silver':
        return 500 - currentPoints;
      case 'Gold':
        return 1000 - currentPoints;
      case 'Platinum':
        return 0; // Max level
      default:
        return 100;
    }
  },

  // Get level progress percentage
  getLevelProgress(currentPoints: number): number {
    const currentLevel = this.calculateLevel(currentPoints);
    const levelInfo = this.getLevelInfo(currentLevel);

    if (currentLevel === 'Platinum') return 100;

    const progress =
      ((currentPoints - levelInfo.minPoints) /
        (levelInfo.maxPoints - levelInfo.minPoints)) *
      100;

    return Math.min(100, Math.max(0, progress));
  },
};
