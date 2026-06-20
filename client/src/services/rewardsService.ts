/**
 * Rewards Service
 * All reward mutations are delegated to Firebase Callable Functions.
 * The frontend never writes reward points, balances, transactions, or activity logs directly.
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

export const POINTS_PER_USD = 2000;
export const WITHDRAWAL_POINTS_EXAMPLE = 10000;
export const WITHDRAWAL_USD_EXAMPLE = 5;
export const REGISTRATION_BONUS_POINTS = 100;
export const DAILY_LOGIN_BONUS_POINTS = 10;
export const REFERRAL_REWARD_POINTS = 300;
export const AD_REWARD_POINTS = 20;

export type RewardResult = {
  success: boolean;
  granted: boolean;
  points: number;
  usdValue: number;
  message: string;
  reason?: string;
  transactionId?: string;
  nextEligibleAt?: string;
};


export type AdRewardSessionResult = {
  success: boolean;
  started: boolean;
  points: number;
  sessionId?: string;
  adUrl?: string;
  startedAt?: string;
  canClaimAt?: string;
  expiresAt?: string;
  minInteractionSeconds?: number;
  cooldownSeconds?: number;
  dailyLimit?: number;
  reason?: string;
  nextEligibleAt?: string;
};

export type AdRewardStatus = {
  success: boolean;
  canStart: boolean;
  points: number;
  taskId: string;
  provider: string;
  dailyCount: number;
  dailyLimit: number;
  minInteractionSeconds: number;
  cooldownSeconds: number;
  nextEligibleAt: string | null;
};

export type RewardStatus = {
  success: boolean;
  registrationBonusGranted: boolean;
  canClaimDaily: boolean;
  lastDailyLoginBonusAt: string | null;
  nextDailyLoginBonusAt: string | null;
  rewards: {
    registrationBonusPoints: number;
    dailyLoginBonusPoints: number;
    referralRewardPoints: number;
    adRewardPoints: number;
    adRewardCooldownSeconds: number;
    adRewardMinInteractionSeconds: number;
    adRewardDailyLimit: number;
    pointsPerUsd: number;
    withdrawalInfo: string;
  };
};

async function callRewardFunction<TRequest extends Record<string, unknown>, TResponse>(
  functionName: string,
  payload: TRequest
): Promise<TResponse> {
  const callable = httpsCallable<TRequest, TResponse>(functions, functionName);
  const result = await callable(payload);
  return result.data;
}

export const rewardsService = {
  async claimRegistrationBonus(): Promise<RewardResult> {
    return callRewardFunction<Record<string, never>, RewardResult>('processRegistrationBonus', {});
  },

  async claimDailyLoginBonus(): Promise<RewardResult> {
    return callRewardFunction<Record<string, never>, RewardResult>('processDailyLoginBonus', {});
  },

  async getRewardStatus(): Promise<RewardStatus> {
    return callRewardFunction<Record<string, never>, RewardStatus>('getRewardStatus', {});
  },


  async startAdRewardSession(): Promise<AdRewardSessionResult> {
    return callRewardFunction<Record<string, never>, AdRewardSessionResult>('startAdRewardSession', {});
  },

  async completeAdRewardSession(params: {
    sessionId: string;
    clientInteractionMs?: number;
    visibilityLossCount?: number;
  }): Promise<RewardResult & { verified: boolean }> {
    return callRewardFunction<{
      sessionId: string;
      clientInteractionMs?: number;
      visibilityLossCount?: number;
    }, RewardResult & { verified: boolean }>('completeAdRewardSession', params);
  },

  async getAdRewardStatus(): Promise<AdRewardStatus> {
    return callRewardFunction<Record<string, never>, AdRewardStatus>('getAdRewardStatus', {});
  },

  async processReferralReward(referralId: string) {
    return callRewardFunction<{ referralId: string }, RewardResult & { qualified: boolean }>(
      'processReferralReward',
      { referralId }
    );
  },

  pointsToUsd(points: number): number {
    return points / POINTS_PER_USD;
  },

  usdToPoints(usd: number): number {
    return usd * POINTS_PER_USD;
  },

  getWithdrawalInfoLabel(): string {
    return `${WITHDRAWAL_POINTS_EXAMPLE.toLocaleString()} Points = $${WITHDRAWAL_USD_EXAMPLE}`;
  },
};
