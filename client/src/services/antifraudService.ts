/**
 * Anti-Fraud Service
 * Handles device fingerprinting, IP intelligence, behavior analysis, and fraud detection
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
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import type {
  DeviceFingerprint,
  IPIntelligence,
  BehaviorAnalysis,
  AccountLinking,
  FraudFlag,
  RiskScore,
  RiskFactor,
  SecurityLog,
} from '../types/referrals';

/**
 * Generate device fingerprint
 */
export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Browser Fingerprint', 4, 17);
  }

  const canvasData = canvas.toDataURL();
  const screenData = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const navigatorData = `${navigator.language}${navigator.platform}${navigator.hardwareConcurrency}`;

  return btoa(`${canvasData}${screenData}${navigatorData}`).substring(0, 64);
};

/**
 * Get device ID from localStorage or generate new one
 */
export const getOrCreateDeviceId = (): string => {
  let deviceId = localStorage.getItem('deviceId');

  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
  }

  return deviceId;
};

export const antifraudService = {
  /**
   * Create device fingerprint record
   */
  async createDeviceFingerprint(userId: string): Promise<DeviceFingerprint> {
    try {
      const deviceId = getOrCreateDeviceId();
      const browserFingerprint = generateDeviceFingerprint();

      const fingerprintId = `fp_${userId}_${Date.now()}`;
      const fingerprintRef = doc(firestore, 'deviceFingerprints', fingerprintId);

      const fingerprint: DeviceFingerprint = {
        id: fingerprintId,
        userId,
        deviceId,
        browserFingerprint,
        osVersion: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        createdAt: new Date(),
        lastSeenAt: new Date(),
        isVerified: false,
      };

      await setDoc(fingerprintRef, {
        ...fingerprint,
        createdAt: Timestamp.now(),
        lastSeenAt: Timestamp.now(),
      });

      return fingerprint;
    } catch (error) {
      console.error('Error creating device fingerprint:', error);
      throw error;
    }
  },

  /**
   * Check if IP is VPN/Proxy (simplified check)
   */
  async checkIPReputation(ipAddress: string): Promise<IPIntelligence> {
    try {
      // In production, use a service like IPQualityScore, MaxMind, or similar
      // This is a simplified implementation
      const ipIntelligenceId = `ip_${ipAddress}_${Date.now()}`;

      // Simulate VPN detection (in production, call actual API)
      const isVPN = await this.detectVPN(ipAddress);
      const isProxy = await this.detectProxy(ipAddress);

      const intelligence: IPIntelligence = {
        id: ipIntelligenceId,
        userId: '', // Will be set by caller
        ipAddress,
        country: 'Unknown',
        city: 'Unknown',
        latitude: 0,
        longitude: 0,
        isVPN,
        isProxy,
        isDatacenter: isVPN || isProxy,
        reputation: isVPN || isProxy ? 75 : 20,
        createdAt: new Date(),
        lastSeenAt: new Date(),
      };

      return intelligence;
    } catch (error) {
      console.error('Error checking IP reputation:', error);
      throw error;
    }
  },

  /**
   * Detect VPN (simplified)
   */
  async detectVPN(ipAddress: string): Promise<boolean> {
    // Common VPN IP ranges and patterns
    const vpnPatterns = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
    ];

    return vpnPatterns.some((pattern) => pattern.test(ipAddress));
  },

  /**
   * Detect Proxy (simplified)
   */
  async detectProxy(ipAddress: string): Promise<boolean> {
    // Check for common proxy headers and patterns
    const proxyHeaders = ['x-forwarded-for', 'x-proxy-authorization', 'via'];
    return false; // Simplified - would check actual headers in production
  },

  /**
   * Record behavior analysis
   */
  async recordBehaviorAnalysis(
    userId: string,
    taskCompletionSpeed: number,
    clickPattern: string
  ): Promise<BehaviorAnalysis> {
    try {
      const analysisId = `ba_${userId}_${Date.now()}`;
      const analysisRef = doc(firestore, 'behaviorAnalysis', analysisId);

      // Calculate automation score based on speed
      const automationScore = this.calculateAutomationScore(taskCompletionSpeed);

      const analysis: BehaviorAnalysis = {
        id: analysisId,
        userId,
        taskCompletionSpeed,
        clickPattern,
        interactionTime: Date.now(),
        isAutomated: automationScore > 70,
        automationScore,
        createdAt: new Date(),
      };

      await setDoc(analysisRef, {
        ...analysis,
        createdAt: Timestamp.now(),
      });

      return analysis;
    } catch (error) {
      console.error('Error recording behavior analysis:', error);
      throw error;
    }
  },

  /**
   * Calculate automation score based on task completion speed
   */
  calculateAutomationScore(completionSpeed: number): number {
    // Speed in milliseconds
    // Very fast (< 500ms) = high automation score
    // Normal (500ms - 5000ms) = low automation score
    // Slow (> 5000ms) = very low automation score

    if (completionSpeed < 500) {
      return Math.min(100, (500 - completionSpeed) / 5);
    } else if (completionSpeed < 5000) {
      return Math.max(0, 50 - (completionSpeed - 500) / 100);
    } else {
      return 0;
    }
  },

  /**
   * Detect account linking
   */
  async detectAccountLinking(userId: string, deviceId: string): Promise<AccountLinking[]> {
    try {
      const linkedAccounts: AccountLinking[] = [];

      // Check for same device
      const deviceQuery = query(
        collection(firestore, 'deviceFingerprints'),
        where('deviceId', '==', deviceId)
      );
      const deviceDocs = await getDocs(deviceQuery);

      if (deviceDocs.size > 1) {
        const linkedUserIds = deviceDocs.docs
          .map((doc) => (doc.data() as DeviceFingerprint).userId)
          .filter((uid) => uid !== userId);

        if (linkedUserIds.length > 0) {
          const linkingId = `al_${userId}_${Date.now()}`;
          linkedAccounts.push({
            id: linkingId,
            userId,
            linkedUserIds,
            linkReason: 'same_device',
            detectedAt: new Date(),
            severity: linkedUserIds.length > 2 ? 'high' : 'medium',
          });
        }
      }

      return linkedAccounts;
    } catch (error) {
      console.error('Error detecting account linking:', error);
      throw error;
    }
  },

  /**
   * Create fraud flag
   */
  async createFraudFlag(
    userId: string,
    flagType: FraudFlag['flagType'],
    severity: FraudFlag['severity'],
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<FraudFlag> {
    try {
      const flagId = `ff_${userId}_${Date.now()}`;
      const flagRef = doc(firestore, 'fraudFlags', flagId);

      // Determine action based on severity
      let action: FraudFlag['action'] = 'warning';
      if (severity === 'high') {
        action = 'temporary_hold';
      } else if (severity === 'critical') {
        action = 'freeze';
      }

      const fraudFlag: FraudFlag = {
        id: flagId,
        userId,
        flagType,
        severity,
        description,
        metadata,
        createdAt: new Date(),
        action,
      };

      await setDoc(flagRef, {
        ...fraudFlag,
        createdAt: Timestamp.now(),
      });

      // Log security event
      await this.logSecurityEvent(userId, `fraud_flag_${flagType}`, description, metadata);

      return fraudFlag;
    } catch (error) {
      console.error('Error creating fraud flag:', error);
      throw error;
    }
  },

  /**
   * Calculate risk score for a user
   */
  async calculateRiskScore(userId: string): Promise<RiskScore> {
    try {
      const factors: RiskFactor[] = [];
      let totalScore = 0;

      // Get device fingerprints
      const deviceQuery = query(
        collection(firestore, 'deviceFingerprints'),
        where('userId', '==', userId)
      );
      const deviceDocs = await getDocs(deviceQuery);

      if (deviceDocs.size > 3) {
        const factor: RiskFactor = {
          name: 'multiple_devices',
          weight: 0.15,
          value: Math.min(100, deviceDocs.size * 20),
          description: `User has ${deviceDocs.size} devices`,
          timestamp: new Date(),
        };
        factors.push(factor);
        totalScore += factor.weight * factor.value;
      }

      // Get fraud flags
      const flagQuery = query(
        collection(firestore, 'fraudFlags'),
        where('userId', '==', userId)
      );
      const flagDocs = await getDocs(flagQuery);

      if (!flagDocs.empty) {
        const flagValue = Math.min(100, flagDocs.size * 30);
        const factor: RiskFactor = {
          name: 'fraud_flags',
          weight: 0.3,
          value: flagValue,
          description: `User has ${flagDocs.size} fraud flags`,
          timestamp: new Date(),
        };
        factors.push(factor);
        totalScore += factor.weight * factor.value;
      }

      // Get behavior analysis
      const behaviorQuery = query(
        collection(firestore, 'behaviorAnalysis'),
        where('userId', '==', userId)
      );
      const behaviorDocs = await getDocs(behaviorQuery);

      if (!behaviorDocs.empty) {
        const avgAutomationScore =
          behaviorDocs.docs.reduce((acc, doc) => {
            return acc + ((doc.data() as BehaviorAnalysis).automationScore || 0);
          }, 0) / behaviorDocs.size;

        const factor: RiskFactor = {
          name: 'automation_score',
          weight: 0.25,
          value: avgAutomationScore,
          description: `Average automation score: ${avgAutomationScore.toFixed(2)}`,
          timestamp: new Date(),
        };
        factors.push(factor);
        totalScore += factor.weight * factor.value;
      }

      // Get account linking
      const linkingQuery = query(
        collection(firestore, 'accountLinking'),
        where('userId', '==', userId)
      );
      const linkingDocs = await getDocs(linkingQuery);

      if (!linkingDocs.empty) {
        const linkValue = Math.min(100, linkingDocs.size * 40);
        const factor: RiskFactor = {
          name: 'account_linking',
          weight: 0.3,
          value: linkValue,
          description: `User has ${linkingDocs.size} linked accounts`,
          timestamp: new Date(),
        };
        factors.push(factor);
        totalScore += factor.weight * factor.value;
      }

      // Determine risk level
      let level: RiskScore['level'] = 'low';
      if (totalScore > 70) {
        level = 'critical';
      } else if (totalScore > 50) {
        level = 'high';
      } else if (totalScore > 30) {
        level = 'medium';
      }

      const riskScoreId = `rs_${userId}_${Date.now()}`;
      const riskScore: RiskScore = {
        id: riskScoreId,
        userId,
        score: Math.round(totalScore),
        level,
        factors,
        lastUpdated: new Date(),
        nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      // Save risk score
      const riskRef = doc(firestore, 'riskScores', riskScoreId);
      await setDoc(riskRef, {
        ...riskScore,
        lastUpdated: Timestamp.now(),
        nextReviewDate: Timestamp.fromDate(riskScore.nextReviewDate),
      });

      return riskScore;
    } catch (error) {
      console.error('Error calculating risk score:', error);
      throw error;
    }
  },

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    action: string,
    reason: string,
    metadata: Record<string, any> = {},
    riskScore: number = 0
  ): Promise<void> {
    try {
      const logId = `sl_${userId}_${Date.now()}`;
      const logRef = doc(firestore, 'securityLogs', logId);

      const log: SecurityLog = {
        id: logId,
        userId,
        action,
        reason,
        riskScore,
        metadata,
        timestamp: new Date(),
      };

      await setDoc(logRef, {
        ...log,
        timestamp: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error logging security event:', error);
      throw error;
    }
  },

  /**
   * Check for self-referral
   */
  async checkSelfReferral(referrerId: string, referredId: string): Promise<boolean> {
    return referrerId === referredId;
  },

  /**
   * Check if user has same device as another user
   */
  async checkSameDevice(userId1: string, userId2: string): Promise<boolean> {
    try {
      const deviceQuery1 = query(
        collection(firestore, 'deviceFingerprints'),
        where('userId', '==', userId1)
      );
      const deviceDocs1 = await getDocs(deviceQuery1);

      const deviceQuery2 = query(
        collection(firestore, 'deviceFingerprints'),
        where('userId', '==', userId2)
      );
      const deviceDocs2 = await getDocs(deviceQuery2);

      const deviceIds1 = deviceDocs1.docs.map((doc) => (doc.data() as DeviceFingerprint).deviceId);
      const deviceIds2 = new Set(
        deviceDocs2.docs.map((doc) => (doc.data() as DeviceFingerprint).deviceId)
      );

      for (let i = 0; i < deviceIds1.length; i++) {
        if (deviceIds2.has(deviceIds1[i])) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking same device:', error);
      throw error;
    }
  },

  /**
   * Get user's fraud flags
   */
  async getFraudFlags(userId: string): Promise<FraudFlag[]> {
    try {
      const flagQuery = query(
        collection(firestore, 'fraudFlags'),
        where('userId', '==', userId)
      );
      const flagDocs = await getDocs(flagQuery);

      return flagDocs.docs.map((doc) => ({
        ...(doc.data() as FraudFlag),
        createdAt: new Date((doc.data() as any).createdAt?.toMillis?.() || 0),
        resolvedAt: (doc.data() as any).resolvedAt
          ? new Date((doc.data() as any).resolvedAt?.toMillis?.() || 0)
          : undefined,
      }));
    } catch (error) {
      console.error('Error getting fraud flags:', error);
      throw error;
    }
  },

  /**
   * Get user's risk score
   */
  async getUserRiskScore(userId: string): Promise<RiskScore | null> {
    try {
      const riskQuery = query(
        collection(firestore, 'riskScores'),
        where('userId', '==', userId)
      );
      const riskDocs = await getDocs(riskQuery);

      if (riskDocs.empty) {
        return null;
      }

      const latestDoc = riskDocs.docs.sort((a, b) => {
        const timeA = (a.data() as any).lastUpdated?.toMillis?.() || 0;
        const timeB = (b.data() as any).lastUpdated?.toMillis?.() || 0;
        return timeB - timeA;
      })[0];

      return {
        ...(latestDoc.data() as RiskScore),
        lastUpdated: new Date((latestDoc.data() as any).lastUpdated?.toMillis?.() || 0),
        nextReviewDate: new Date((latestDoc.data() as any).nextReviewDate?.toMillis?.() || 0),
      };
    } catch (error) {
      console.error('Error getting user risk score:', error);
      throw error;
    }
  },
};
