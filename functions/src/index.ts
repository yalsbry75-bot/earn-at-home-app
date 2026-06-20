import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as crypto from 'crypto';

admin.initializeApp();

const db = admin.firestore();
const REGION = 'asia-southeast1';

const POINTS_PER_USD = 2000;
const REGISTRATION_BONUS_POINTS = 100;
const DAILY_LOGIN_BONUS_POINTS = 10;
const REFERRAL_REWARD_POINTS = 300;
const AD_REWARD_POINTS = 20;
const AD_REWARD_TASK_ID = 'adsterra_smartlink_reward';
const AD_REWARD_SOURCE = 'adsterra_smartlink';
const ADSTERRA_SMARTLINK = 'https://www.effectivecpmnetwork.com/csf2m6gv?key=92b5acf44c1118964f9a9aa030f41bd2';
const AD_REWARD_MIN_INTERACTION_MS = 30 * 1000;
const AD_REWARD_COOLDOWN_MS = 2 * 60 * 1000;
const AD_REWARD_SESSION_EXPIRY_MS = 15 * 60 * 1000;
const AD_REWARD_DAILY_LIMIT = 20;
const DAILY_LOGIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const REGISTRATION_BONUS_WINDOW_MS = 24 * 60 * 60 * 1000;

const REFERRAL_RULES = {
  emailVerificationRequired: true,
  minTasksCompleted: 3,
  minHoursAfterRegistration: 24,
  minPointsEarned: 100,
  maxReferralsPerDay: 10,
  maxReferralsPerMonth: 100,
};

type RewardKind = 'registration_bonus' | 'daily_login_bonus' | 'referral_reward' | 'ad_reward';

type RewardResult = {
  success: boolean;
  granted: boolean;
  points: number;
  usdValue: number;
  message: string;
  reason?: string;
  transactionId?: string;
  nextEligibleAt?: string;
};

type ReferralValidationResult = {
  valid: boolean;
  reason?: string;
};

function requireAuthUid(request: { auth?: { uid?: string } }): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }
  return uid;
}

function pointsToUsd(points: number): number {
  return points / POINTS_PER_USD;
}


function buildAdsterraUrl(sessionId: string, userId: string): string {
  const url = new URL(ADSTERRA_SMARTLINK);
  url.searchParams.set('subid', sessionId);
  url.searchParams.set('user_id', userId);
  url.searchParams.set('task_id', AD_REWARD_TASK_ID);
  return url.toString();
}

function getClientIp(request: { rawRequest?: { headers?: Record<string, string | string[] | undefined>; ip?: string } }): string {
  const forwardedFor = request.rawRequest?.headers?.['x-forwarded-for'];
  if (Array.isArray(forwardedFor)) return forwardedFor[0] || 'unknown';
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) return forwardedFor.split(',')[0].trim();
  return request.rawRequest?.ip || 'unknown';
}

function getUserAgent(request: { rawRequest?: { headers?: Record<string, string | string[] | undefined> } }): string {
  const userAgent = request.rawRequest?.headers?.['user-agent'];
  if (Array.isArray(userAgent)) return userAgent[0] || 'unknown';
  return userAgent || 'unknown';
}

function createSessionId(userId: string): string {
  return `ad_${userId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

function todayStartMillis(): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function tomorrowStartMillis(): number {
  const date = new Date();
  date.setHours(24, 0, 0, 0);
  return date.getTime();
}

async function countCompletedAdRewardsSince(userId: string, sinceMillis: number): Promise<number> {
  const sessions = await db.collection('adRewardSessions').where('userId', '==', userId).get();
  return sessions.docs.filter((doc) => {
    const data = doc.data();
    return data.status === 'completed' && timestampMillis(data.completedAt || data.rewardedAt) >= sinceMillis;
  }).length;
}

async function getLastCompletedAdRewardMillis(userId: string): Promise<number> {
  const sessions = await db.collection('adRewardSessions').where('userId', '==', userId).get();
  return sessions.docs.reduce((latest, doc) => {
    const data = doc.data();
    if (data.status !== 'completed') return latest;
    return Math.max(latest, timestampMillis(data.completedAt || data.rewardedAt));
  }, 0);
}

async function rejectAdRewardAction(params: {
  userId: string;
  sessionId?: string;
  action: string;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  const now = Timestamp.now();
  const id = `${params.action}_${params.userId}_${now.toMillis()}_${crypto.randomBytes(4).toString('hex')}`;
  await db.collection('activityLogs').doc(id).set({
    id,
    userId: params.userId,
    action: params.action,
    status: 'rejected',
    points: 0,
    source: AD_REWARD_SOURCE,
    metadata: {
      ...(params.metadata || {}),
      sessionId: params.sessionId || null,
      reason: params.reason,
      rewardKind: 'ad_reward',
    },
    createdAt: now,
  });
}

async function validateAdRewardRisk(userId: string): Promise<{ ok: boolean; reason?: string }> {
  const [flagged, riskScore] = await Promise.all([
    hasHighRiskFraudFlag(userId),
    getLatestRiskScore(userId),
  ]);

  if (flagged) return { ok: false, reason: 'high_risk_fraud_flag' };
  if (riskScore > 70) return { ok: false, reason: 'high_risk_score' };
  return { ok: true };
}

function timestampMillis(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toMillis?: () => number; seconds?: number };
    if (typeof candidate.toMillis === 'function') return candidate.toMillis();
    if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
  }
  return 0;
}


function usdToPoints(usd: number): number {
  return Math.ceil(usd * POINTS_PER_USD);
}

function normalizeUsdAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

function calculateWithdrawalFee(amount: number, method: string): number {
  switch (method) {
    case 'paypal':
      return Math.round((amount * 0.02 + 0.3) * 100) / 100;
    case 'usdt_trc20':
    case 'usdt_erc20':
      return 1;
    case 'bank_transfer':
      return 5;
    default:
      return 0;
  }
}

function maskPaymentDetails(details: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...details };
  const email = String(masked.email || '');
  if (email.includes('@')) {
    const [name, domain] = email.split('@');
    masked.email = `${name.slice(0, 2)}***@${domain}`;
  }
  const accountNumber = String(masked.accountNumber || masked.iban || '');
  if (accountNumber.length > 4) {
    const maskedValue = `****${accountNumber.slice(-4)}`;
    if (masked.accountNumber) masked.accountNumber = maskedValue;
    if (masked.iban) masked.iban = maskedValue;
  }
  const walletAddress = String(masked.walletAddress || masked.address || '');
  if (walletAddress.length > 12) {
    const maskedValue = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    if (masked.walletAddress) masked.walletAddress = maskedValue;
    if (masked.address) masked.address = maskedValue;
  }
  return masked;
}

async function requireAdminUid(request: { auth?: { uid?: string } }): Promise<string> {
  const uid = requireAuthUid(request);
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists || userSnap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access is required.');
  }
  return uid;
}

function calculateLevel(points: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' {
  if (points >= 1000) return 'Platinum';
  if (points >= 500) return 'Gold';
  if (points >= 100) return 'Silver';
  return 'Bronze';
}

function generateReferralCode(userId: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += chars.charAt((hash + i) % chars.length);
  }
  return code;
}

async function getExistingReferralByCode(code: string): Promise<{ referrerId: string; code: string } | null> {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) return null;

  const referralCodeSnap = await db
    .collection('referralCodes')
    .where('code', '==', normalizedCode)
    .limit(1)
    .get();

  if (!referralCodeSnap.empty) {
    const data = referralCodeSnap.docs[0].data();
    return { referrerId: data.userId, code: data.code };
  }

  const userCodeSnap = await db
    .collection('users')
    .where('referralCode', '==', normalizedCode)
    .limit(1)
    .get();

  if (!userCodeSnap.empty) {
    const data = userCodeSnap.docs[0].data();
    return { referrerId: userCodeSnap.docs[0].id, code: data.referralCode };
  }

  return null;
}

async function hasHighRiskFraudFlag(userId: string): Promise<boolean> {
  const flags = await db.collection('fraudFlags').where('userId', '==', userId).get();
  return flags.docs.some((doc) => {
    const data = doc.data();
    return ['high', 'critical'].includes(data.severity) && !data.resolvedAt;
  });
}

async function getLatestRiskScore(userId: string): Promise<number> {
  const scores = await db.collection('riskScores').where('userId', '==', userId).get();
  if (scores.empty) return 0;
  const latest = scores.docs.sort((a, b) => {
    return timestampMillis(b.data().lastUpdated) - timestampMillis(a.data().lastUpdated);
  })[0];
  return Number(latest.data().score || 0);
}

async function hasSharedDevice(referrerId: string, referredId: string): Promise<boolean> {
  const [referrerDevices, referredDevices] = await Promise.all([
    db.collection('deviceFingerprints').where('userId', '==', referrerId).get(),
    db.collection('deviceFingerprints').where('userId', '==', referredId).get(),
  ]);

  const referrerDeviceIds = new Set<string>();
  const referrerFingerprints = new Set<string>();

  referrerDevices.docs.forEach((doc) => {
    const data = doc.data();
    if (data.deviceId) referrerDeviceIds.add(data.deviceId);
    if (data.browserFingerprint) referrerFingerprints.add(data.browserFingerprint);
  });

  return referredDevices.docs.some((doc) => {
    const data = doc.data();
    return (
      (data.deviceId && referrerDeviceIds.has(data.deviceId)) ||
      (data.browserFingerprint && referrerFingerprints.has(data.browserFingerprint))
    );
  });
}

async function countReferralsSince(referrerId: string, sinceMillis: number): Promise<number> {
  const referrals = await db.collection('referrals').where('referrerId', '==', referrerId).get();
  return referrals.docs.filter((doc) => timestampMillis(doc.data().createdAt) >= sinceMillis).length;
}

async function validateReferralProtections(
  referrerId: string,
  referredId: string
): Promise<ReferralValidationResult> {
  if (referrerId === referredId) {
    return { valid: false, reason: 'self_referral' };
  }

  const [referrerSnap, referredSnap] = await Promise.all([
    db.collection('users').doc(referrerId).get(),
    db.collection('users').doc(referredId).get(),
  ]);

  if (!referrerSnap.exists || !referredSnap.exists) {
    return { valid: false, reason: 'missing_user' };
  }

  if (referrerSnap.data()?.status !== 'active') {
    return { valid: false, reason: 'referrer_not_active' };
  }

  if (referredSnap.data()?.status !== 'active') {
    return { valid: false, reason: 'referred_not_active' };
  }

  const existingReferredReferral = await db
    .collection('referrals')
    .where('referredId', '==', referredId)
    .limit(1)
    .get();

  if (!existingReferredReferral.empty) {
    return { valid: false, reason: 'referred_user_already_registered' };
  }

  const now = Date.now();
  const [dailyCount, monthlyCount] = await Promise.all([
    countReferralsSince(referrerId, now - 24 * 60 * 60 * 1000),
    countReferralsSince(referrerId, now - 30 * 24 * 60 * 60 * 1000),
  ]);

  if (dailyCount >= REFERRAL_RULES.maxReferralsPerDay) {
    return { valid: false, reason: 'daily_referral_limit_reached' };
  }

  if (monthlyCount >= REFERRAL_RULES.maxReferralsPerMonth) {
    return { valid: false, reason: 'monthly_referral_limit_reached' };
  }

  const [referrerFlagged, referredFlagged, referrerRisk, referredRisk, sharedDevice] = await Promise.all([
    hasHighRiskFraudFlag(referrerId),
    hasHighRiskFraudFlag(referredId),
    getLatestRiskScore(referrerId),
    getLatestRiskScore(referredId),
    hasSharedDevice(referrerId, referredId),
  ]);

  if (referrerFlagged || referredFlagged) {
    return { valid: false, reason: 'high_risk_fraud_flag' };
  }

  if (referrerRisk > 70 || referredRisk > 70) {
    return { valid: false, reason: 'high_risk_score' };
  }

  if (sharedDevice) {
    return { valid: false, reason: 'same_device_detected' };
  }

  return { valid: true };
}

async function countCompletedTasks(userId: string): Promise<number> {
  const [userTasksSnap, taskHistorySnap] = await Promise.all([
    db.collection(`users/${userId}/tasks`).where('status', '==', 'completed').get(),
    db.collection('taskHistory').where('userId', '==', userId).where('status', '==', 'verified').get(),
  ]);

  return Math.max(userTasksSnap.size, taskHistorySnap.size);
}

async function isReferralQualified(referralId: string): Promise<{ qualified: boolean; reason?: string }> {
  const referralSnap = await db.collection('referrals').doc(referralId).get();
  if (!referralSnap.exists) return { qualified: false, reason: 'referral_not_found' };

  const referral = referralSnap.data()!;
  if (referral.status === 'rejected') return { qualified: false, reason: referral.rejectionReason || 'rejected' };
  if (referral.rewardGranted === true) return { qualified: true };

  const [referredSnap, fraudCheck] = await Promise.all([
    db.collection('users').doc(referral.referredId).get(),
    validateReferralProtectionsForExisting(referral.referrerId, referral.referredId),
  ]);

  if (!referredSnap.exists) return { qualified: false, reason: 'referred_user_not_found' };
  if (!fraudCheck.valid) return { qualified: false, reason: fraudCheck.reason };

  const referred = referredSnap.data()!;
  const emailVerified = Boolean(referred.emailVerified);
  if (REFERRAL_RULES.emailVerificationRequired && !emailVerified) {
    return { qualified: false, reason: 'email_not_verified' };
  }

  const createdAt = timestampMillis(referred.createdAt);
  const accountAgeHours = createdAt ? (Date.now() - createdAt) / (1000 * 60 * 60) : 0;
  if (accountAgeHours < REFERRAL_RULES.minHoursAfterRegistration) {
    return { qualified: false, reason: 'minimum_account_age_not_met' };
  }

  const completedTasks = await countCompletedTasks(referral.referredId);
  if (completedTasks < REFERRAL_RULES.minTasksCompleted) {
    return { qualified: false, reason: 'minimum_tasks_not_completed' };
  }

  if (Number(referred.points || 0) < REFERRAL_RULES.minPointsEarned) {
    return { qualified: false, reason: 'minimum_points_not_earned' };
  }

  return { qualified: true };
}

async function validateReferralProtectionsForExisting(
  referrerId: string,
  referredId: string
): Promise<ReferralValidationResult> {
  if (referrerId === referredId) {
    return { valid: false, reason: 'self_referral' };
  }

  const [referrerFlagged, referredFlagged, referrerRisk, referredRisk, sharedDevice] = await Promise.all([
    hasHighRiskFraudFlag(referrerId),
    hasHighRiskFraudFlag(referredId),
    getLatestRiskScore(referrerId),
    getLatestRiskScore(referredId),
    hasSharedDevice(referrerId, referredId),
  ]);

  if (referrerFlagged || referredFlagged) return { valid: false, reason: 'high_risk_fraud_flag' };
  if (referrerRisk > 70 || referredRisk > 70) return { valid: false, reason: 'high_risk_score' };
  if (sharedDevice) return { valid: false, reason: 'same_device_detected' };

  return { valid: true };
}

async function grantReward(params: {
  userId: string;
  points: number;
  kind: RewardKind;
  source: string;
  description: string;
  transactionType: 'earned' | 'referral';
  idempotencyKey?: string;
  notificationTitle: string;
  notificationBody: string;
  notificationType: 'earning' | 'referral';
  metadata?: Record<string, unknown>;
  updateRewardState?: (current: Record<string, unknown>, now: Timestamp) => { ok: boolean; reason?: string; nextEligibleAt?: string; update: Record<string, unknown> };
}): Promise<RewardResult> {
  const now = Timestamp.now();
  const transactionId = params.idempotencyKey || `${params.kind}_${params.userId}_${now.toMillis()}`;
  const transactionRef = db.collection('transactions').doc(transactionId);
  const ledgerRef = db.collection('pointsLedger').doc(transactionId);
  const activityRef = db.collection('activityLogs').doc(transactionId);
  const notificationRef = db.collection('notifications').doc(transactionId);
  const userRef = db.collection('users').doc(params.userId);
  const walletRef = db.collection('wallets').doc(params.userId);

  return db.runTransaction(async (transaction) => {
    const [userSnap, walletSnap, existingTransactionSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(walletRef),
      transaction.get(transactionRef),
    ]);

    if (!userSnap.exists) {
      throw new HttpsError('not-found', 'User profile was not found.');
    }

    if (existingTransactionSnap.exists) {
      transaction.set(db.collection('activityLogs').doc(`${transactionId}_duplicate_${now.toMillis()}`), {
        id: `${transactionId}_duplicate_${now.toMillis()}`,
        userId: params.userId,
        action: params.kind,
        status: 'duplicate_blocked',
        points: 0,
        source: params.source,
        metadata: { ...(params.metadata || {}), reason: 'duplicate_reward' },
        createdAt: now,
      });

      return {
        success: true,
        granted: false,
        points: 0,
        usdValue: 0,
        message: 'Reward already processed.',
        reason: 'duplicate_reward',
        transactionId,
      } satisfies RewardResult;
    }

    const userData = userSnap.data() || {};
    const currentRewardState = (userData.rewardState || {}) as Record<string, unknown>;
    const rewardStateDecision = params.updateRewardState?.(currentRewardState, now);

    if (rewardStateDecision && !rewardStateDecision.ok) {
      const skippedActivityId = `${params.kind}_${params.userId}_skipped_${now.toMillis()}`;
      transaction.set(db.collection('activityLogs').doc(skippedActivityId), {
        id: skippedActivityId,
        userId: params.userId,
        action: params.kind,
        status: 'skipped',
        points: 0,
        source: params.source,
        metadata: { ...(params.metadata || {}), reason: rewardStateDecision.reason },
        createdAt: now,
      });

      return {
        success: true,
        granted: false,
        points: 0,
        usdValue: 0,
        message: 'Reward is not eligible.',
        reason: rewardStateDecision.reason,
        nextEligibleAt: rewardStateDecision.nextEligibleAt,
      } satisfies RewardResult;
    }

    const currentPoints = Number(userData.points || 0);
    const nextPoints = currentPoints + params.points;
    const usdValue = pointsToUsd(params.points);

    const userUpdate: Record<string, unknown> = {
      points: FieldValue.increment(params.points),
      balance: FieldValue.increment(usdValue),
      level: calculateLevel(nextPoints),
      updatedAt: now,
    };

    if (rewardStateDecision?.update) {
      Object.assign(userUpdate, rewardStateDecision.update);
    }

    transaction.update(userRef, userUpdate);

    const walletPayload: Record<string, unknown> = {
      userId: params.userId,
      availableBalance: FieldValue.increment(params.points),
      totalEarnings: FieldValue.increment(params.points),
      updatedAt: now,
    };

    if (!walletSnap.exists) {
      walletPayload.pendingBalance = 0;
      walletPayload.frozenBalance = 0;
      walletPayload.createdAt = now;
    }

    transaction.set(walletRef, walletPayload, { merge: true });

    const baseRecord = {
      id: transactionId,
      userId: params.userId,
      amount: params.points,
      source: params.source,
      metadata: params.metadata || {},
      createdAt: now,
    };

    transaction.set(transactionRef, {
      ...baseRecord,
      type: params.transactionType,
      status: 'completed',
      description: params.description,
      usdValue,
    });

    transaction.set(ledgerRef, {
      ...baseRecord,
      type: 'earn',
      reason: params.description,
    });

    transaction.set(activityRef, {
      id: transactionId,
      userId: params.userId,
      action: params.kind,
      status: 'completed',
      points: params.points,
      usdValue,
      source: params.source,
      metadata: params.metadata || {},
      createdAt: now,
    });

    transaction.set(notificationRef, {
      id: transactionId,
      userId: params.userId,
      title: params.notificationTitle,
      body: params.notificationBody,
      type: params.notificationType,
      read: false,
      deepLink: '/wallet',
      createdAt: now,
    });

    return {
      success: true,
      granted: true,
      points: params.points,
      usdValue,
      message: 'Reward granted successfully.',
      transactionId,
    } satisfies RewardResult;
  });
}

export const processRegistrationBonus = onCall({ region: REGION }, async (request): Promise<RewardResult> => {
  const uid = requireAuthUid(request);
  const userRecord = await admin.auth().getUser(uid);
  const createdAt = Date.parse(userRecord.metadata.creationTime || '');

  if (createdAt && Date.now() - createdAt > REGISTRATION_BONUS_WINDOW_MS) {
    return {
      success: true,
      granted: false,
      points: 0,
      usdValue: 0,
      message: 'Registration bonus window has expired.',
      reason: 'registration_window_expired',
    };
  }

  return grantReward({
    userId: uid,
    points: REGISTRATION_BONUS_POINTS,
    kind: 'registration_bonus',
    source: 'registration_bonus',
    description: 'Registration welcome bonus',
    transactionType: 'earned',
    idempotencyKey: `reward_registration_${uid}`,
    notificationTitle: 'مرحباً بك',
    notificationBody: 'تمت إضافة مكافأة التسجيل: 100 نقطة إلى محفظتك.',
    notificationType: 'earning',
    metadata: { rewardKind: 'registration_bonus' },
    updateRewardState: (state, now) => {
      if (state.registrationBonusGranted === true) {
        return { ok: false, reason: 'registration_bonus_already_granted', update: {} };
      }
      return {
        ok: true,
        update: {
          'rewardState.registrationBonusGranted': true,
          'rewardState.registrationBonusGrantedAt': now,
        },
      };
    },
  });
});

export const processDailyLoginBonus = onCall({ region: REGION }, async (request): Promise<RewardResult> => {
  const uid = requireAuthUid(request);

  return grantReward({
    userId: uid,
    points: DAILY_LOGIN_BONUS_POINTS,
    kind: 'daily_login_bonus',
    source: 'daily_login_bonus',
    description: 'Daily login bonus',
    transactionType: 'earned',
    notificationTitle: 'مكافأة تسجيل الدخول اليومي',
    notificationBody: 'تمت إضافة 10 نقاط إلى محفظتك لتسجيل الدخول اليومي.',
    notificationType: 'earning',
    metadata: { rewardKind: 'daily_login_bonus', cooldownHours: 24 },
    updateRewardState: (state, now) => {
      const lastRewardMillis = timestampMillis(state.lastDailyLoginBonusAt);
      const nextEligibleMillis = lastRewardMillis + DAILY_LOGIN_COOLDOWN_MS;
      if (lastRewardMillis && Date.now() < nextEligibleMillis) {
        return {
          ok: false,
          reason: 'daily_login_bonus_cooldown',
          nextEligibleAt: new Date(nextEligibleMillis).toISOString(),
          update: {},
        };
      }
      return {
        ok: true,
        update: {
          'rewardState.lastDailyLoginBonusAt': now,
          'rewardState.dailyLoginBonusCount': FieldValue.increment(1),
        },
      };
    },
  });
});

export const getRewardStatus = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) throw new HttpsError('not-found', 'User profile was not found.');

  const rewardState = (userSnap.data()?.rewardState || {}) as Record<string, unknown>;
  const lastDailyLoginMillis = timestampMillis(rewardState.lastDailyLoginBonusAt);
  const nextDailyLoginMillis = lastDailyLoginMillis + DAILY_LOGIN_COOLDOWN_MS;
  const canClaimDaily = !lastDailyLoginMillis || Date.now() >= nextDailyLoginMillis;

  return {
    success: true,
    registrationBonusGranted: rewardState.registrationBonusGranted === true,
    canClaimDaily,
    lastDailyLoginBonusAt: lastDailyLoginMillis ? new Date(lastDailyLoginMillis).toISOString() : null,
    nextDailyLoginBonusAt: canClaimDaily ? null : new Date(nextDailyLoginMillis).toISOString(),
    rewards: {
      registrationBonusPoints: REGISTRATION_BONUS_POINTS,
      dailyLoginBonusPoints: DAILY_LOGIN_BONUS_POINTS,
      referralRewardPoints: REFERRAL_REWARD_POINTS,
      adRewardPoints: AD_REWARD_POINTS,
      adRewardCooldownSeconds: AD_REWARD_COOLDOWN_MS / 1000,
      adRewardMinInteractionSeconds: AD_REWARD_MIN_INTERACTION_MS / 1000,
      adRewardDailyLimit: AD_REWARD_DAILY_LIMIT,
      pointsPerUsd: POINTS_PER_USD,
      withdrawalInfo: '10,000 Points = $5',
    },
  };
});

export const createReferralLink = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const userRef = db.collection('users').doc(uid);
  const codeRef = db.collection('referralCodes').doc(uid);

  const result = await db.runTransaction(async (transaction) => {
    const [userSnap, codeSnap] = await Promise.all([transaction.get(userRef), transaction.get(codeRef)]);
    if (!userSnap.exists) throw new HttpsError('not-found', 'User profile was not found.');

    const currentOrigin = String(request.rawRequest.headers.origin || '').replace(/\/$/, '');
    const fallbackOrigin = 'https://app.example.com';
    const origin = currentOrigin || fallbackOrigin;

    if (codeSnap.exists) {
      const data = codeSnap.data()!;
      return {
        referralCode: data.code,
        referralLink: data.link || `${origin}/register?ref=${data.code}`,
      };
    }

    const userData = userSnap.data()!;
    const code = String(userData.referralCode || generateReferralCode(uid)).toUpperCase();
    const link = `${origin}/register?ref=${code}`;
    const now = Timestamp.now();

    transaction.set(codeRef, {
      userId: uid,
      code,
      link,
      createdAt: now,
      updatedAt: now,
      totalReferrals: 0,
      qualifiedReferrals: 0,
      totalEarnings: 0,
    }, { merge: true });

    if (!userData.referralCode) {
      transaction.update(userRef, { referralCode: code, updatedAt: now });
    }

    return { referralCode: code, referralLink: link };
  });

  return { success: true, ...result };
});

export const registerReferral = onCall({ region: REGION }, async (request) => {
  const referredId = requireAuthUid(request);
  const referralCode = String(request.data?.referralCode || '').trim().toUpperCase();
  if (!referralCode) throw new HttpsError('invalid-argument', 'Referral code is required.');

  const referralOwner = await getExistingReferralByCode(referralCode);
  if (!referralOwner) throw new HttpsError('not-found', 'Referral code was not found.');

  const referrerId = referralOwner.referrerId;
  const validation = await validateReferralProtections(referrerId, referredId);
  if (!validation.valid) {
    await db.collection('activityLogs').add({
      userId: referredId,
      action: 'referral_rejected',
      status: 'rejected',
      source: 'referral',
      metadata: { referrerId, referralCode, reason: validation.reason },
      createdAt: Timestamp.now(),
    });
    throw new HttpsError('failed-precondition', validation.reason || 'Referral validation failed.');
  }

  const referralId = `referral_${referrerId}_${referredId}`;
  const referralRef = db.collection('referrals').doc(referralId);
  const referredRef = db.collection('users').doc(referredId);
  const codeRef = db.collection('referralCodes').doc(referrerId);
  const now = Timestamp.now();

  await db.runTransaction(async (transaction) => {
    const [referralSnap, referredSnap] = await Promise.all([
      transaction.get(referralRef),
      transaction.get(referredRef),
    ]);

    if (!referredSnap.exists) throw new HttpsError('not-found', 'Referred user was not found.');

    const referredData = referredSnap.data() || {};
    const existingReferralState = referredData.referralState || {};
    if (existingReferralState.referredBy && existingReferralState.referredBy !== referrerId) {
      throw new HttpsError('already-exists', 'This user is already linked to another referral.');
    }

    if (!referralSnap.exists) {
      transaction.set(referralRef, {
        id: referralId,
        referrerId,
        referredId,
        referralCode,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
        referrerReward: REFERRAL_REWARD_POINTS,
        referredReward: 0,
        rewardGranted: false,
      });

      transaction.set(codeRef, {
        userId: referrerId,
        code: referralCode,
        totalReferrals: FieldValue.increment(1),
        updatedAt: now,
      }, { merge: true });
    }

    transaction.update(referredRef, {
      'referralState.referredBy': referrerId,
      'referralState.referralId': referralId,
      'referralState.referralCode': referralCode,
      updatedAt: now,
    });

    transaction.set(db.collection('activityLogs').doc(`referral_registered_${referralId}`), {
      id: `referral_registered_${referralId}`,
      userId: referredId,
      action: 'referral_registered',
      status: 'pending',
      source: 'referral',
      metadata: { referrerId, referredId, referralCode, referralId },
      createdAt: now,
    }, { merge: true });
  });

  return { success: true, referralId };
});

async function grantReferralRewardInternal(referralId: string): Promise<RewardResult & { qualified: boolean }> {
  const qualification = await isReferralQualified(referralId);
  if (!qualification.qualified) {
    return {
      success: true,
      qualified: false,
      granted: false,
      points: 0,
      usdValue: 0,
      message: 'Referral is not qualified yet.',
      reason: qualification.reason,
    };
  }

  const referralRef = db.collection('referrals').doc(referralId);
  const referralSnap = await referralRef.get();
  if (!referralSnap.exists) {
    throw new HttpsError('not-found', 'Referral was not found.');
  }

  const referral = referralSnap.data()!;
  if (referral.rewardGranted === true) {
    return {
      success: true,
      qualified: true,
      granted: false,
      points: 0,
      usdValue: 0,
      message: 'Referral reward already granted.',
      reason: 'duplicate_reward',
      transactionId: `reward_referral_${referralId}`,
    };
  }

  const reward = await grantReward({
    userId: referral.referrerId,
    points: REFERRAL_REWARD_POINTS,
    kind: 'referral_reward',
    source: 'referral_reward',
    description: 'Successful referral reward',
    transactionType: 'referral',
    idempotencyKey: `reward_referral_${referralId}`,
    notificationTitle: 'مكافأة إحالة ناجحة',
    notificationBody: 'تمت إضافة 300 نقطة إلى محفظتك مقابل إحالة مؤهلة.',
    notificationType: 'referral',
    metadata: { rewardKind: 'referral_reward', referralId, referredId: referral.referredId },
  });

  if (reward.granted) {
    const now = Timestamp.now();
    await db.runTransaction(async (transaction) => {
      const currentReferral = await transaction.get(referralRef);
      if (!currentReferral.exists) return;
      if (currentReferral.data()?.rewardGranted === true) return;

      transaction.update(referralRef, {
        status: 'qualified',
        qualifiedAt: now,
        rewardGranted: true,
        rewardGrantedAt: now,
        updatedAt: now,
      });

      transaction.set(db.collection('referralCodes').doc(referral.referrerId), {
        qualifiedReferrals: FieldValue.increment(1),
        totalEarnings: FieldValue.increment(REFERRAL_REWARD_POINTS),
        updatedAt: now,
      }, { merge: true });
    });
  }

  return { ...reward, qualified: true };
}

export const processReferralReward = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const referralId = String(request.data?.referralId || '').trim();
  if (!referralId) throw new HttpsError('invalid-argument', 'Referral ID is required.');

  const referralSnap = await db.collection('referrals').doc(referralId).get();
  if (!referralSnap.exists) throw new HttpsError('not-found', 'Referral was not found.');

  const referral = referralSnap.data()!;
  if (referral.referrerId !== uid && referral.referredId !== uid) {
    throw new HttpsError('permission-denied', 'You cannot process this referral.');
  }

  return grantReferralRewardInternal(referralId);
});

export const checkReferralQualification = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const referralId = String(request.data?.referralId || '').trim();
  const refereeId = String(request.data?.refereeId || request.data?.referredId || '').trim();

  let resolvedReferralId = referralId;
  if (!resolvedReferralId && refereeId) {
    const referralSnap = await db
      .collection('referrals')
      .where('referredId', '==', refereeId)
      .limit(1)
      .get();
    if (!referralSnap.empty) resolvedReferralId = referralSnap.docs[0].id;
  }

  if (!resolvedReferralId) throw new HttpsError('invalid-argument', 'Referral ID or referred user ID is required.');

  const referralSnap = await db.collection('referrals').doc(resolvedReferralId).get();
  if (!referralSnap.exists) throw new HttpsError('not-found', 'Referral was not found.');

  const referral = referralSnap.data()!;
  if (referral.referrerId !== uid && referral.referredId !== uid) {
    throw new HttpsError('permission-denied', 'You cannot check this referral.');
  }

  const result = await grantReferralRewardInternal(resolvedReferralId);
  return {
    success: true,
    qualified: result.qualified,
    rewardGranted: result.granted,
    reason: result.reason,
    points: result.points,
  };
});

export const getUserReferrals = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const limitValue = Math.min(Number(request.data?.limit || 50), 1000);

  const referralsSnap = await db
    .collection('referrals')
    .where('referrerId', '==', uid)
    .limit(limitValue)
    .get();

  const referrals = referralsSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));

  const total = referrals.length;
  const qualified = referrals.filter((ref: any) => ref.status === 'qualified').length;
  const pending = referrals.filter((ref: any) => ref.status === 'pending').length;
  const rejected = referrals.filter((ref: any) => ref.status === 'rejected').length;
  const totalEarnings = referrals
    .filter((ref: any) => ref.status === 'qualified')
    .reduce((sum: number, ref: any) => sum + Number(ref.referrerReward || REFERRAL_REWARD_POINTS), 0);

  return {
    success: true,
    referrals,
    stats: { total, qualified, pending, rejected, totalEarnings },
  };
});


export const startAdRewardSession = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const now = Timestamp.now();
  const nowMillis = now.toMillis();
  const risk = await validateAdRewardRisk(uid);

  if (!risk.ok) {
    await rejectAdRewardAction({
      userId: uid,
      action: 'ad_reward_session_rejected',
      reason: risk.reason || 'risk_rejected',
      metadata: { phase: 'start' },
    });
    throw new HttpsError('failed-precondition', risk.reason || 'Ad reward session rejected.');
  }

  const [dailyCount, lastCompletedMillis] = await Promise.all([
    countCompletedAdRewardsSince(uid, todayStartMillis()),
    getLastCompletedAdRewardMillis(uid),
  ]);

  if (dailyCount >= AD_REWARD_DAILY_LIMIT) {
    await rejectAdRewardAction({
      userId: uid,
      action: 'ad_reward_session_rejected',
      reason: 'daily_ad_reward_limit_reached',
      metadata: { dailyCount, dailyLimit: AD_REWARD_DAILY_LIMIT },
    });
    return {
      success: true,
      started: false,
      reason: 'daily_ad_reward_limit_reached',
      points: AD_REWARD_POINTS,
      dailyLimit: AD_REWARD_DAILY_LIMIT,
    };
  }

  const nextEligibleMillis = lastCompletedMillis + AD_REWARD_COOLDOWN_MS;
  if (lastCompletedMillis && nowMillis < nextEligibleMillis) {
    await rejectAdRewardAction({
      userId: uid,
      action: 'ad_reward_session_rejected',
      reason: 'ad_reward_cooldown',
      metadata: { nextEligibleAt: new Date(nextEligibleMillis).toISOString() },
    });
    return {
      success: true,
      started: false,
      reason: 'ad_reward_cooldown',
      points: AD_REWARD_POINTS,
      nextEligibleAt: new Date(nextEligibleMillis).toISOString(),
      cooldownSeconds: AD_REWARD_COOLDOWN_MS / 1000,
    };
  }

  const userRef = db.collection('users').doc(uid);
  const sessionId = createSessionId(uid);
  const result = await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) throw new HttpsError('not-found', 'User profile was not found.');

    const userData = userSnap.data() || {};
    const rewardState = (userData.rewardState || {}) as Record<string, unknown>;
    const currentSessionId = String(rewardState.currentAdSessionId || '');
    const currentSessionStartedMillis = timestampMillis(rewardState.currentAdSessionStartedAt);
    const currentSessionStillActive = Boolean(
      currentSessionId && currentSessionStartedMillis && nowMillis - currentSessionStartedMillis < AD_REWARD_SESSION_EXPIRY_MS
    );

    if (currentSessionStillActive) {
      const currentAdUrl = buildAdsterraUrl(currentSessionId, uid);
      const canClaimAtMillis = currentSessionStartedMillis + AD_REWARD_MIN_INTERACTION_MS;
      const expiresAtMillis = currentSessionStartedMillis + AD_REWARD_SESSION_EXPIRY_MS;
      transaction.set(db.collection('activityLogs').doc(`ad_reward_session_duplicate_${currentSessionId}_${now.toMillis()}`), {
        id: `ad_reward_session_duplicate_${currentSessionId}_${now.toMillis()}`,
        userId: uid,
        action: 'ad_reward_session_duplicate_blocked',
        status: 'duplicate_blocked',
        points: 0,
        source: AD_REWARD_SOURCE,
        metadata: {
          rewardKind: 'ad_reward',
          sessionId: currentSessionId,
          reason: 'active_session_exists',
        },
        createdAt: now,
      });
      return {
        reused: true,
        sessionId: currentSessionId,
        adUrl: currentAdUrl,
        startedAt: new Date(currentSessionStartedMillis).toISOString(),
        canClaimAt: new Date(canClaimAtMillis).toISOString(),
        expiresAt: new Date(expiresAtMillis).toISOString(),
      };
    }

    const adUrl = buildAdsterraUrl(sessionId, uid);
    const sessionRef = db.collection('adRewardSessions').doc(sessionId);

    transaction.set(sessionRef, {
      id: sessionId,
      userId: uid,
      taskId: AD_REWARD_TASK_ID,
      provider: 'Adsterra Smartlink',
      smartlinkUrl: ADSTERRA_SMARTLINK,
      openedUrl: adUrl,
      status: 'started',
      rewardPoints: AD_REWARD_POINTS,
      minInteractionMs: AD_REWARD_MIN_INTERACTION_MS,
      cooldownMs: AD_REWARD_COOLDOWN_MS,
      dailyLimit: AD_REWARD_DAILY_LIMIT,
      startedAt: now,
      lastActivityAt: now,
      expiresAt: Timestamp.fromMillis(nowMillis + AD_REWARD_SESSION_EXPIRY_MS),
      client: {
        ipAddress: getClientIp(request),
        userAgent: getUserAgent(request),
      },
      createdAt: now,
      updatedAt: now,
    });

    transaction.update(userRef, {
      'rewardState.currentAdSessionId': sessionId,
      'rewardState.currentAdSessionStartedAt': now,
      updatedAt: now,
    });

    transaction.set(db.collection('activityLogs').doc(`ad_reward_session_started_${sessionId}`), {
      id: `ad_reward_session_started_${sessionId}`,
      userId: uid,
      action: 'ad_reward_session_started',
      status: 'started',
      points: 0,
      source: AD_REWARD_SOURCE,
      metadata: {
        rewardKind: 'ad_reward',
        sessionId,
        taskId: AD_REWARD_TASK_ID,
        minInteractionMs: AD_REWARD_MIN_INTERACTION_MS,
      },
      createdAt: now,
    });

    return {
      reused: false,
      sessionId,
      adUrl,
      startedAt: new Date(nowMillis).toISOString(),
      canClaimAt: new Date(nowMillis + AD_REWARD_MIN_INTERACTION_MS).toISOString(),
      expiresAt: new Date(nowMillis + AD_REWARD_SESSION_EXPIRY_MS).toISOString(),
    };
  });

  return {
    success: true,
    started: true,
    points: AD_REWARD_POINTS,
    minInteractionSeconds: AD_REWARD_MIN_INTERACTION_MS / 1000,
    cooldownSeconds: AD_REWARD_COOLDOWN_MS / 1000,
    dailyLimit: AD_REWARD_DAILY_LIMIT,
    ...result,
  };
});

export const completeAdRewardSession = onCall({ region: REGION }, async (request): Promise<RewardResult & { verified: boolean }> => {
  const uid = requireAuthUid(request);
  const sessionId = String(request.data?.sessionId || '').trim();
  if (!sessionId) throw new HttpsError('invalid-argument', 'Ad reward session ID is required.');

  const clientInteractionMs = Math.max(0, Number(request.data?.clientInteractionMs || 0));
  const visibilityLossCount = Math.max(0, Number(request.data?.visibilityLossCount || 0));
  const now = Timestamp.now();
  const nowMillis = now.toMillis();

  const risk = await validateAdRewardRisk(uid);
  if (!risk.ok) {
    await rejectAdRewardAction({
      userId: uid,
      sessionId,
      action: 'ad_reward_rejected',
      reason: risk.reason || 'risk_rejected',
      metadata: { phase: 'complete' },
    });
    return {
      success: true,
      verified: false,
      granted: false,
      points: 0,
      usdValue: 0,
      message: 'Ad reward rejected by fraud protections.',
      reason: risk.reason || 'risk_rejected',
    };
  }

  const sessionRef = db.collection('adRewardSessions').doc(sessionId);
  const userRef = db.collection('users').doc(uid);

  const precheck = await db.runTransaction(async (transaction) => {
    const [sessionSnap, userSnap] = await Promise.all([
      transaction.get(sessionRef),
      transaction.get(userRef),
    ]);

    if (!userSnap.exists) throw new HttpsError('not-found', 'User profile was not found.');
    if (!sessionSnap.exists) {
      return { ok: false, reason: 'session_not_found' };
    }

    const session = sessionSnap.data() || {};
    if (session.userId !== uid) return { ok: false, reason: 'session_user_mismatch' };
    if (session.status === 'completed') return { ok: false, reason: 'duplicate_reward' };
    if (session.status === 'verifying') return { ok: false, reason: 'session_already_processing' };
    if (session.status !== 'started') return { ok: false, reason: 'invalid_session_status' };

    const startedMillis = timestampMillis(session.startedAt);
    const expiresMillis = timestampMillis(session.expiresAt) || startedMillis + AD_REWARD_SESSION_EXPIRY_MS;
    const elapsedMillis = nowMillis - startedMillis;

    if (!startedMillis) return { ok: false, reason: 'invalid_session_start' };
    if (nowMillis > expiresMillis) return { ok: false, reason: 'ad_reward_session_expired' };
    if (elapsedMillis < AD_REWARD_MIN_INTERACTION_MS) {
      return {
        ok: false,
        reason: 'insufficient_interaction_time',
        nextEligibleAt: new Date(startedMillis + AD_REWARD_MIN_INTERACTION_MS).toISOString(),
      };
    }

    const userData = userSnap.data() || {};
    const rewardState = (userData.rewardState || {}) as Record<string, unknown>;
    const lastRewardMillis = timestampMillis(rewardState.lastAdRewardGrantedAt);
    const nextEligibleMillis = lastRewardMillis + AD_REWARD_COOLDOWN_MS;
    if (lastRewardMillis && nowMillis < nextEligibleMillis) {
      return {
        ok: false,
        reason: 'ad_reward_cooldown',
        nextEligibleAt: new Date(nextEligibleMillis).toISOString(),
      };
    }

    transaction.update(sessionRef, {
      status: 'verifying',
      verifyingAt: now,
      updatedAt: now,
      verification: {
        elapsedMillis,
        clientInteractionMs,
        visibilityLossCount,
        minInteractionMs: AD_REWARD_MIN_INTERACTION_MS,
        cooldownMs: AD_REWARD_COOLDOWN_MS,
        verifiedBy: 'server_elapsed_time',
      },
    });

    transaction.set(db.collection('activityLogs').doc(`ad_reward_verification_started_${sessionId}`), {
      id: `ad_reward_verification_started_${sessionId}`,
      userId: uid,
      action: 'ad_reward_verification_started',
      status: 'verifying',
      points: 0,
      source: AD_REWARD_SOURCE,
      metadata: {
        rewardKind: 'ad_reward',
        sessionId,
        elapsedMillis,
        clientInteractionMs,
        visibilityLossCount,
      },
      createdAt: now,
    });

    return { ok: true };
  });

  if (!precheck.ok) {
    await rejectAdRewardAction({
      userId: uid,
      sessionId,
      action: 'ad_reward_rejected',
      reason: precheck.reason || 'verification_failed',
      metadata: {
        nextEligibleAt: precheck.nextEligibleAt || null,
        clientInteractionMs,
        visibilityLossCount,
      },
    });
    return {
      success: true,
      verified: false,
      granted: false,
      points: 0,
      usdValue: 0,
      message: 'Ad reward is not eligible.',
      reason: precheck.reason,
      nextEligibleAt: precheck.nextEligibleAt,
    };
  }

  const dailyCount = await countCompletedAdRewardsSince(uid, todayStartMillis());
  if (dailyCount >= AD_REWARD_DAILY_LIMIT) {
    await sessionRef.set({ status: 'rejected', rejectionReason: 'daily_ad_reward_limit_reached', updatedAt: Timestamp.now() }, { merge: true });
    await rejectAdRewardAction({
      userId: uid,
      sessionId,
      action: 'ad_reward_rejected',
      reason: 'daily_ad_reward_limit_reached',
      metadata: { dailyCount, dailyLimit: AD_REWARD_DAILY_LIMIT },
    });
    return {
      success: true,
      verified: false,
      granted: false,
      points: 0,
      usdValue: 0,
      message: 'Daily advertisement reward limit reached.',
      reason: 'daily_ad_reward_limit_reached',
    };
  }

  const reward = await grantReward({
    userId: uid,
    points: AD_REWARD_POINTS,
    kind: 'ad_reward',
    source: AD_REWARD_SOURCE,
    description: 'Rewarded advertisement completed',
    transactionType: 'earned',
    idempotencyKey: `reward_ad_${sessionId}`,
    notificationTitle: 'مكافأة إعلان',
    notificationBody: 'تمت إضافة 20 نقطة إلى محفظتك مقابل مشاهدة الإعلان.',
    notificationType: 'earning',
    metadata: {
      rewardKind: 'ad_reward',
      sessionId,
      taskId: AD_REWARD_TASK_ID,
      provider: 'Adsterra Smartlink',
      minInteractionMs: AD_REWARD_MIN_INTERACTION_MS,
      clientInteractionMs,
      visibilityLossCount,
    },
    updateRewardState: (state, currentNow) => {
      const lastRewardMillis = timestampMillis(state.lastAdRewardGrantedAt);
      const nextEligibleMillis = lastRewardMillis + AD_REWARD_COOLDOWN_MS;
      if (lastRewardMillis && Date.now() < nextEligibleMillis) {
        return {
          ok: false,
          reason: 'ad_reward_cooldown',
          nextEligibleAt: new Date(nextEligibleMillis).toISOString(),
          update: {},
        };
      }
      return {
        ok: true,
        update: {
          'rewardState.lastAdRewardGrantedAt': currentNow,
          'rewardState.adRewardCount': FieldValue.increment(1),
          'rewardState.currentAdSessionId': FieldValue.delete(),
          'rewardState.currentAdSessionStartedAt': FieldValue.delete(),
        },
      };
    },
  });

  if (reward.granted) {
    await sessionRef.set({
      status: 'completed',
      rewardedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      transactionId: reward.transactionId,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } else {
    await sessionRef.set({
      status: reward.reason === 'duplicate_reward' ? 'completed' : 'rejected',
      rejectionReason: reward.reason || null,
      transactionId: reward.transactionId || null,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  }

  return {
    ...reward,
    verified: reward.granted,
  };
});

export const getAdRewardStatus = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const [dailyCount, lastCompletedMillis] = await Promise.all([
    countCompletedAdRewardsSince(uid, todayStartMillis()),
    getLastCompletedAdRewardMillis(uid),
  ]);

  const nextCooldownEligibleMillis = lastCompletedMillis + AD_REWARD_COOLDOWN_MS;
  const nowMillis = Date.now();
  const dailyLimitReached = dailyCount >= AD_REWARD_DAILY_LIMIT;
  const cooldownActive = Boolean(lastCompletedMillis && nowMillis < nextCooldownEligibleMillis);
  const canStart = !dailyLimitReached && !cooldownActive;
  const nextEligibleMillis = dailyLimitReached ? tomorrowStartMillis() : nextCooldownEligibleMillis;

  return {
    success: true,
    canStart,
    points: AD_REWARD_POINTS,
    taskId: AD_REWARD_TASK_ID,
    provider: 'Adsterra Smartlink',
    dailyCount,
    dailyLimit: AD_REWARD_DAILY_LIMIT,
    minInteractionSeconds: AD_REWARD_MIN_INTERACTION_MS / 1000,
    cooldownSeconds: AD_REWARD_COOLDOWN_MS / 1000,
    nextEligibleAt: canStart ? null : new Date(nextEligibleMillis).toISOString(),
  };
});

export const processPendingReferralRewards = onSchedule(
  { region: REGION, schedule: 'every 60 minutes', timeZone: 'Etc/UTC' },
  async () => {
    const pending = await db
      .collection('referrals')
      .where('status', '==', 'pending')
      .limit(50)
      .get();

    for (const referralDoc of pending.docs) {
      try {
        const result = await grantReferralRewardInternal(referralDoc.id);
        logger.info('Processed pending referral reward', { referralId: referralDoc.id, result });
      } catch (error) {
        logger.error('Failed to process pending referral reward', { referralId: referralDoc.id, error });
      }
    }
  }
);


export const createWithdrawalRequest = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const amount = normalizeUsdAmount(request.data?.amount);
  const method = String(request.data?.paymentMethod || request.data?.method || '').trim();
  const paymentDetails = (request.data?.bankDetails || request.data?.paymentDetails || {}) as Record<string, unknown>;
  const currency = String(request.data?.currency || 'USD').toUpperCase();

  if (currency !== 'USD') {
    throw new HttpsError('invalid-argument', 'Only USD withdrawals are currently supported.');
  }

  if (amount < 10) {
    throw new HttpsError('failed-precondition', 'Minimum withdrawal amount is $10.');
  }

  if (!method) {
    throw new HttpsError('invalid-argument', 'Payment method is required.');
  }

  if (!paymentDetails || Object.keys(paymentDetails).length === 0) {
    throw new HttpsError('invalid-argument', 'Payment details are required.');
  }

  const [userSnap, kycSnap, riskFlagged, riskScore] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('kyc').doc(uid).get(),
    hasHighRiskFraudFlag(uid),
    getLatestRiskScore(uid),
  ]);

  if (!userSnap.exists) throw new HttpsError('not-found', 'User profile was not found.');
  if (userSnap.data()?.status !== 'active') throw new HttpsError('failed-precondition', 'Only active users can request withdrawals.');
  if (riskFlagged || riskScore > 70) throw new HttpsError('failed-precondition', 'Withdrawal denied by risk controls.');

  const kyc = kycSnap.exists ? kycSnap.data()! : null;
  if (!kyc || kyc.status !== 'verified' || Number(kyc.level || 0) < 2) {
    throw new HttpsError('failed-precondition', 'Verified KYC Level 2 is required before withdrawal.');
  }

  const pointsAmount = usdToPoints(amount);
  const fee = calculateWithdrawalFee(amount, method);
  const netAmount = Math.max(0, Math.round((amount - fee) * 100) / 100);
  const now = Timestamp.now();
  const withdrawalRef = db.collection('withdrawals').doc();
  const transactionRef = db.collection('transactions').doc(`withdrawal_${withdrawalRef.id}`);
  const ledgerRef = db.collection('pointsLedger').doc(`withdrawal_${withdrawalRef.id}`);
  const activityRef = db.collection('activityLogs').doc(`withdrawal_requested_${withdrawalRef.id}`);
  const walletRef = db.collection('wallets').doc(uid);
  const userRef = db.collection('users').doc(uid);

  const result = await db.runTransaction(async (transaction) => {
    const [freshUserSnap, walletSnap] = await Promise.all([
      transaction.get(userRef),
      transaction.get(walletRef),
    ]);
    if (!freshUserSnap.exists) throw new HttpsError('not-found', 'User profile was not found.');

    const userData = freshUserSnap.data() || {};
    const walletData = walletSnap.exists ? walletSnap.data()! : null;
    const availablePoints = Number(walletData?.availableBalance ?? userData.points ?? 0);

    if (availablePoints < pointsAmount) {
      throw new HttpsError('failed-precondition', 'Insufficient wallet balance for withdrawal.');
    }

    if (!walletSnap.exists) {
      transaction.set(walletRef, {
        userId: uid,
        pendingBalance: 0,
        availableBalance: Number(userData.points || 0),
        frozenBalance: 0,
        totalEarnings: Number(userData.points || 0),
        createdAt: now,
        updatedAt: now,
      }, { merge: true });
    }

    transaction.update(userRef, {
      points: FieldValue.increment(-pointsAmount),
      balance: FieldValue.increment(-amount),
      updatedAt: now,
    });

    transaction.set(walletRef, {
      userId: uid,
      availableBalance: FieldValue.increment(-pointsAmount),
      pendingBalance: FieldValue.increment(pointsAmount),
      updatedAt: now,
      ...(walletSnap.exists ? {} : { frozenBalance: 0, totalEarnings: Number(userData.points || 0), createdAt: now }),
    }, { merge: true });

    const withdrawal = {
      id: withdrawalRef.id,
      userId: uid,
      amount,
      fee,
      netAmount,
      method,
      paymentMethod: method,
      paymentDetails,
      bankDetails: paymentDetails,
      maskedPaymentDetails: maskPaymentDetails(paymentDetails),
      status: 'pending',
      currency,
      pointsAmount,
      transactionId: transactionRef.id,
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(withdrawalRef, withdrawal);
    transaction.set(transactionRef, {
      id: transactionRef.id,
      userId: uid,
      type: 'withdrawal',
      amount: pointsAmount,
      usdValue: amount,
      fee,
      netAmount,
      status: 'pending',
      source: 'withdrawal',
      description: `Withdrawal request via ${method}`,
      withdrawalId: withdrawalRef.id,
      metadata: { method, currency, pointsAmount },
      createdAt: now,
      updatedAt: now,
    });
    transaction.set(ledgerRef, {
      id: ledgerRef.id,
      userId: uid,
      type: 'spend',
      amount: pointsAmount,
      reason: `Withdrawal request: $${amount.toFixed(2)}`,
      source: 'withdrawal',
      withdrawalId: withdrawalRef.id,
      createdAt: now,
    });
    transaction.set(activityRef, {
      id: activityRef.id,
      userId: uid,
      action: 'withdrawal_requested',
      status: 'pending',
      points: pointsAmount,
      usdValue: amount,
      source: 'withdrawal',
      metadata: { withdrawalId: withdrawalRef.id, method, currency, fee, netAmount },
      createdAt: now,
    });

    return withdrawal;
  });

  return { success: true, withdrawal: result, withdrawalId: withdrawalRef.id };
});

export const getUserWithdrawals = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const limitValue = Math.min(Number(request.data?.limit || 50), 100);
  const snap = await db.collection('withdrawals').where('userId', '==', uid).limit(limitValue).get();
  const withdrawals = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));

  return { success: true, withdrawals };
});

export const adminProcessWithdrawal = onCall({ region: REGION }, async (request) => {
  const adminId = await requireAdminUid(request);
  const withdrawalId = String(request.data?.withdrawalId || '').trim();
  const rawAction = String(request.data?.action || '').trim();
  const action = rawAction === 'pay' ? 'mark_paid' : rawAction;
  const notes = String(request.data?.notes || '').trim();

  if (!withdrawalId) throw new HttpsError('invalid-argument', 'Withdrawal ID is required.');
  if (!['approve', 'reject', 'mark_paid'].includes(action)) {
    throw new HttpsError('invalid-argument', 'Invalid withdrawal action.');
  }

  const now = Timestamp.now();
  const withdrawalRef = db.collection('withdrawals').doc(withdrawalId);
  const result = await db.runTransaction(async (transaction) => {
    const withdrawalSnap = await transaction.get(withdrawalRef);
    if (!withdrawalSnap.exists) throw new HttpsError('not-found', 'Withdrawal request was not found.');

    const withdrawal = withdrawalSnap.data()!;
    const userId = withdrawal.userId;
    const pointsAmount = Number(withdrawal.pointsAmount || usdToPoints(Number(withdrawal.amount || 0)));
    const userRef = db.collection('users').doc(userId);
    const walletRef = db.collection('wallets').doc(userId);
    const transactionRef = db.collection('transactions').doc(withdrawal.transactionId || `withdrawal_${withdrawalId}`);

    if (action === 'approve') {
      if (withdrawal.status !== 'pending') {
        throw new HttpsError('failed-precondition', 'Only pending withdrawals can be approved.');
      }
      transaction.update(withdrawalRef, {
        status: 'approved',
        approvedAt: now,
        processedAt: now,
        processedBy: adminId,
        adminNotes: notes || withdrawal.adminNotes || null,
        updatedAt: now,
      });
      transaction.set(transactionRef, { status: 'pending', updatedAt: now }, { merge: true });
    }

    if (action === 'reject') {
      if (['rejected', 'paid'].includes(withdrawal.status)) {
        throw new HttpsError('failed-precondition', 'This withdrawal cannot be rejected.');
      }
      const amount = Number(withdrawal.amount || pointsToUsd(pointsAmount));
      transaction.update(withdrawalRef, {
        status: 'rejected',
        rejectedAt: now,
        processedAt: now,
        processedBy: adminId,
        rejectionReason: notes || 'Rejected by admin',
        adminNotes: notes || withdrawal.adminNotes || null,
        updatedAt: now,
      });
      transaction.set(walletRef, {
        availableBalance: FieldValue.increment(pointsAmount),
        pendingBalance: FieldValue.increment(-pointsAmount),
        updatedAt: now,
      }, { merge: true });
      transaction.update(userRef, {
        points: FieldValue.increment(pointsAmount),
        balance: FieldValue.increment(amount),
        updatedAt: now,
      });
      transaction.set(transactionRef, { status: 'failed', failureReason: notes || 'Rejected by admin', updatedAt: now }, { merge: true });
      transaction.set(db.collection('pointsLedger').doc(`withdrawal_reversal_${withdrawalId}`), {
        id: `withdrawal_reversal_${withdrawalId}`,
        userId,
        type: 'earn',
        amount: pointsAmount,
        reason: `Withdrawal rejected: points returned`,
        source: 'withdrawal_reversal',
        withdrawalId,
        createdAt: now,
      });
    }

    if (action === 'mark_paid') {
      if (withdrawal.status !== 'approved') {
        throw new HttpsError('failed-precondition', 'Only approved withdrawals can be marked as paid.');
      }
      transaction.update(withdrawalRef, {
        status: 'paid',
        paidAt: now,
        processedAt: now,
        processedBy: adminId,
        adminNotes: notes || withdrawal.adminNotes || null,
        updatedAt: now,
      });
      transaction.set(walletRef, {
        pendingBalance: FieldValue.increment(-pointsAmount),
        updatedAt: now,
      }, { merge: true });
      transaction.set(transactionRef, { status: 'completed', completedAt: now, updatedAt: now }, { merge: true });
    }

    const activityId = `withdrawal_${action}_${withdrawalId}_${now.toMillis()}`;
    transaction.set(db.collection('activityLogs').doc(activityId), {
      id: activityId,
      userId,
      adminId,
      action: `withdrawal_${action}`,
      status: action === 'reject' ? 'rejected' : action === 'mark_paid' ? 'completed' : 'approved',
      points: pointsAmount,
      usdValue: Number(withdrawal.amount || 0),
      source: 'admin_withdrawal',
      metadata: { withdrawalId, notes },
      createdAt: now,
    });

    return { withdrawalId, action, userId };
  });

  return { success: true, ...result };
});

export const getWallet = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const walletRef = db.collection('wallets').doc(uid);
  const userRef = db.collection('users').doc(uid);

  const result = await db.runTransaction(async (transaction) => {
    const [walletSnap, userSnap] = await Promise.all([transaction.get(walletRef), transaction.get(userRef)]);
    if (!userSnap.exists) throw new HttpsError('not-found', 'User profile was not found.');

    if (walletSnap.exists) {
      return walletSnap.data();
    }

    const now = Timestamp.now();
    const userPoints = Number(userSnap.data()?.points || 0);
    const wallet = {
      userId: uid,
      pendingBalance: 0,
      availableBalance: userPoints,
      frozenBalance: 0,
      totalEarnings: userPoints,
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(walletRef, wallet, { merge: true });
    return wallet;
  });

  return { success: true, wallet: result };
});

export const getWalletSummary = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const walletSnap = await db.collection('wallets').doc(uid).get();
  const wallet = walletSnap.exists ? walletSnap.data()! : null;
  const availableBalance = Number(wallet?.availableBalance || 0);
  const pendingBalance = Number(wallet?.pendingBalance || 0);
  const frozenBalance = Number(wallet?.frozenBalance || 0);

  return {
    success: true,
    summary: {
      availableBalance,
      pendingBalance,
      frozenBalance,
      availableUsd: pointsToUsd(availableBalance),
      pendingUsd: pointsToUsd(pendingBalance),
      frozenUsd: pointsToUsd(frozenBalance),
      pointsPerUsd: POINTS_PER_USD,
      withdrawalInfo: '10,000 Points = $5',
    },
  };
});

export const getPointsLedger = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const limitValue = Math.min(Number(request.data?.limit || 50), 100);
  const snap = await db.collection('pointsLedger').where('userId', '==', uid).limit(limitValue).get();
  const ledger = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));

  return { success: true, ledger };
});

export const getUserTransactions = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const limitValue = Math.min(Number(request.data?.limit || 50), 100);
  const snap = await db.collection('transactions').where('userId', '==', uid).limit(limitValue).get();
  const transactions = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a: any, b: any) => timestampMillis(b.createdAt) - timestampMillis(a.createdAt));

  return { success: true, transactions };
});

export const getTransaction = onCall({ region: REGION }, async (request) => {
  const uid = requireAuthUid(request);
  const transactionId = String(request.data?.transactionId || '').trim();
  if (!transactionId) throw new HttpsError('invalid-argument', 'Transaction ID is required.');

  const snap = await db.collection('transactions').doc(transactionId).get();
  if (!snap.exists || snap.data()?.userId !== uid) {
    throw new HttpsError('not-found', 'Transaction was not found.');
  }

  return { success: true, transaction: { id: snap.id, ...snap.data() } };
});
