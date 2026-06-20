/**
 * Withdrawal & Wallet Service
 * Handles financial operations, withdrawal lifecycle, and wallet management
 * Uses Cloud Functions for all financial operations
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  writeBatch,
  orderBy,
  limit,
} from 'firebase/firestore';
import { firestore, auth, functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';
import type { 
  Withdrawal, 
  WithdrawalStatus, 
  PaymentMethod, 
  PaymentMethodType,
  KYCData 
} from '../types/withdrawals';
import type { User } from '../types';
import { antifraudService } from './antifraudService';

const MIN_WITHDRAWAL_AMOUNT = 10; // USD

export const withdrawalService = {
  /**
   * Get user wallet via Cloud Function
   */
  async getWallet(userId: string) {
    try {
      const getWallet = httpsCallable(functions, 'getWallet');
      const result = await getWallet({});
      return result.data;
    } catch (error) {
      console.error('Error getting wallet:', error);
      throw error;
    }
  },

  /**
   * Get wallet summary via Cloud Function
   */
  async getWalletSummary(userId: string) {
    try {
      const getWalletSummary = httpsCallable(functions, 'getWalletSummary');
      const result = await getWalletSummary({});
      return result.data;
    } catch (error) {
      console.error('Error getting wallet summary:', error);
      throw error;
    }
  },

  /**
   * Create a new withdrawal request via Cloud Function
   */
  async createWithdrawalRequest(
    userId: string,
    amount: number,
    method: PaymentMethodType,
    paymentDetails: Record<string, any>
  ): Promise<any> {
    try {
      // 1. Basic validation
      if (amount < MIN_WITHDRAWAL_AMOUNT) {
        throw new Error(`Minimum withdrawal amount is $${MIN_WITHDRAWAL_AMOUNT}`);
      }

      // 2. Check user risk score
      const riskScore = await antifraudService.getUserRiskScore(userId);
      if (riskScore && riskScore.score > 70) {
        throw new Error('Withdrawal denied: High risk account. Please contact support.');
      }

      // 3. Call Cloud Function to create withdrawal
      const createWithdrawalRequest = httpsCallable(functions, 'createWithdrawalRequest');
      const result = await createWithdrawalRequest({
        amount,
        paymentMethod: method,
        bankDetails: paymentDetails,
        currency: 'USD',
      });

      if ((result.data as any).success) {
        return (result.data as any);
      } else {
        throw new Error((result.data as any).message || 'Failed to create withdrawal');
      }
    } catch (error) {
      console.error('Error creating withdrawal request:', error);
      throw error;
    }
  },

  /**
   * Calculate withdrawal fee based on method
   */
  calculateFee(amount: number, method: PaymentMethodType): number {
    switch (method) {
      case 'paypal': return amount * 0.02 + 0.3;
      case 'usdt_trc20': return 1.0;
      case 'bank_transfer': return 5.0;
      default: return 0;
    }
  },

  /**
   * Mask sensitive payment details
   */
  maskPaymentDetails(details: Record<string, any>): Record<string, any> {
    const masked = { ...details };
    if (masked.email) {
      const [name, domain] = masked.email.split('@');
      masked.email = `${name[0]}***@${domain}`;
    }
    if (masked.accountNumber) {
      masked.accountNumber = `****${masked.accountNumber.slice(-4)}`;
    }
    return masked;
  },

  /**
   * Get user withdrawals via Cloud Function
   */
  async getUserWithdrawals(userId: string): Promise<any[]> {
    try {
      const getUserWithdrawals = httpsCallable(functions, 'getUserWithdrawals');
      const result = await getUserWithdrawals({ limit: 50, offset: 0 });
      return (result.data as any).withdrawals || [];
    } catch (error) {
      console.error('Error getting user withdrawals:', error);
      throw error;
    }
  },

  /**
   * Get KYC Data
   */
  async getKYCData(userId: string): Promise<KYCData | null> {
    try {
      const kycRef = doc(firestore, 'kyc', userId);
      const kycDoc = await getDoc(kycRef);
      if (!kycDoc.exists()) return null;
      const data = kycDoc.data();
      return {
        ...data,
        submittedAt: data.submittedAt?.toDate(),
        verifiedAt: data.verifiedAt?.toDate(),
      } as KYCData;
    } catch (error) {
      console.error('Error getting KYC data:', error);
      throw error;
    }
  },

  /**
   * Submit KYC Level 1
   */
  async submitKYCLevel1(userId: string, fullName: string, country: string): Promise<void> {
    try {
      const kycRef = doc(firestore, 'kyc', userId);
      await setDoc(kycRef, {
        userId,
        level: 1,
        status: 'pending', // Changed from 'verified' to 'pending' for admin review
        fullName,
        country,
        submittedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error submitting KYC Level 1:', error);
      throw error;
    }
  },

  /**
   * Submit KYC Level 2 (Identity Verification)
   */
  async submitKYCLevel2(
    userId: string, 
    idType: string, 
    idNumber: string, 
    urls: { front: string, back?: string, selfie: string }
  ): Promise<void> {
    try {
      const kycRef = doc(firestore, 'kyc', userId);
      await setDoc(kycRef, {
        userId,
        level: 2,
        status: 'pending',
        idType,
        idNumber,
        idFrontUrl: urls.front,
        idBackUrl: urls.back,
        selfieUrl: urls.selfie,
        submittedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Error submitting KYC Level 2:', error);
      throw error;
    }
  },

  /**
   * Admin: Process Withdrawal via Cloud Function
   */
  async processWithdrawal(
    withdrawalId: string, 
    action: 'approve' | 'reject' | 'mark_paid',
    adminId: string,
    notes?: string
  ): Promise<void> {
    try {
      const adminProcessWithdrawal = httpsCallable(functions, 'adminProcessWithdrawal');
      const result = await adminProcessWithdrawal({
        action,
        withdrawalId,
        notes,
      });

      if (!(result.data as any).success) {
        throw new Error((result.data as any).message || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      throw error;
    }
  }
};
