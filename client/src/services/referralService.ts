/**
 * Referral Service
 * Handles referral management, qualification checks, and reward distribution
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
  QueryConstraint,
} from 'firebase/firestore';
import { firestore, auth, functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';
import type {
  Referral,
  ReferralCode,
  ReferralStats,
  ReferralQualificationRules,
  ReferralRewards,
} from '../types/referrals';
import type { User } from '../types';

// Default qualification rules
const DEFAULT_QUALIFICATION_RULES: ReferralQualificationRules = {
  emailVerificationRequired: true,
  minTasksCompleted: 3,
  minHoursAfterRegistration: 24,
  minPointsEarned: 100,
  maxReferralsPerDay: 10,
  maxReferralsPerMonth: 100,
};

// Default rewards
const DEFAULT_REWARDS: ReferralRewards = {
  referrerReward: 300,
  referredReward: 0,
  bonusReward: 0,
  bonusThreshold: 10, // After 10 qualified referrals
};

export const referralService = {
  /**
   * Create referral link via Cloud Function
   */
  async createReferralLink(): Promise<{ referralCode: string; referralLink: string }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const createReferralLink = httpsCallable(functions, 'createReferralLink');
      const result = await createReferralLink({});
      
      if ((result.data as any).success) {
        return {
          referralCode: (result.data as any).referralCode,
          referralLink: (result.data as any).referralLink,
        };
      } else {
        throw new Error((result.data as any).message || 'Failed to create referral link');
      }
    } catch (error) {
      console.error('Error creating referral link:', error);
      throw error;
    }
  },

  /**
   * Get referral link for a user
   */
  getReferralLink(referralCode: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?ref=${referralCode}`;
  },

  /**
   * Register referral via Cloud Function
   */
  async registerReferral(referralCode: string): Promise<{ referralId: string }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const registerReferral = httpsCallable(functions, 'registerReferral');
      const result = await registerReferral({
        referralCode,
        refereeId: user.uid,
      });

      if ((result.data as any).success) {
        return {
          referralId: (result.data as any).referralId,
        };
      } else {
        throw new Error((result.data as any).message || 'Failed to register referral');
      }
    } catch (error) {
      console.error('Error registering referral:', error);
      throw error;
    }
  },

  /**
   * Check if a referral is qualified via Cloud Function
   */
  async checkReferralQualification(
    referralId: string,
    refereeId: string,
    rules?: ReferralQualificationRules
  ): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const checkReferralQualification = httpsCallable(functions, 'checkReferralQualification');
      const result = await checkReferralQualification({
        referralId,
        refereeId,
      });

      return (result.data as any).qualified || false;
    } catch (error) {
      console.error('Error checking referral qualification:', error);
      throw error;
    }
  },

  /**
   * Get referral stats for a user via Cloud Function
   */
  async getReferralStats(): Promise<ReferralStats> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const getUserReferrals = httpsCallable(functions, 'getUserReferrals');
      const result = await getUserReferrals({ limit: 1000, offset: 0 });

      const referrals = (result.data as any).referrals || [];
      const stats = (result.data as any).stats || {};

      return {
        userId: user.uid,
        totalReferrals: stats.total || 0,
        qualifiedReferrals: stats.qualified || 0,
        pendingReferrals: stats.pending || 0,
        rejectedReferrals: stats.rejected || 0,
        totalEarnings: stats.totalEarnings || 0,
        averageQualificationTime: 0,
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      throw error;
    }
  },

  /**
   * Get referrals for a user via Cloud Function
   */
  async getReferrals(): Promise<Referral[]> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const getUserReferrals = httpsCallable(functions, 'getUserReferrals');
      const result = await getUserReferrals({ limit: 50, offset: 0 });

      const referrals = (result.data as any).referrals || [];
      return referrals.map((ref: any) => ({
        ...ref,
        createdAt: ref.createdAt?.toDate?.() || new Date(ref.createdAt),
        qualifiedAt: ref.qualifiedAt?.toDate?.() || (ref.qualifiedAt ? new Date(ref.qualifiedAt) : undefined),
      }));
    } catch (error) {
      console.error('Error getting referrals:', error);
      throw error;
    }
  },

  /**
   * Get referral code for a user
   */
  async getReferralCode(userId: string): Promise<ReferralCode | null> {
    try {
      const codeRef = doc(firestore, 'referralCodes', userId);
      const codeDoc = await getDoc(codeRef);

      if (!codeDoc.exists()) {
        return null;
      }

      return codeDoc.data() as ReferralCode;
    } catch (error) {
      console.error('Error getting referral code:', error);
      throw error;
    }
  },

  /**
   * Create referral code document
   */
  async createReferralCodeDoc(userId: string, code: string): Promise<void> {
    try {
      const codeRef = doc(firestore, 'referralCodes', userId);

      await setDoc(codeRef, {
        userId,
        code,
        link: this.getReferralLink(code),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        totalReferrals: 0,
        qualifiedReferrals: 0,
        totalEarnings: 0,
      });
    } catch (error) {
      console.error('Error creating referral code document:', error);
      throw error;
    }
  },

  /**
   * Get user by referral code
   */
  async getUserByReferralCode(code: string): Promise<User | null> {
    try {
      const codeQuery = query(
        collection(firestore, 'referralCodes'),
        where('code', '==', code)
      );
      const codeDocs = await getDocs(codeQuery);

      if (codeDocs.empty) {
        return null;
      }

      const userId = codeDocs.docs[0].data().userId;
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      console.error('Error getting user by referral code:', error);
      throw error;
    }
  },
};
