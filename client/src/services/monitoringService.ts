import { 
  collection, 
  addDoc, 
  serverTimestamp, 
} from 'firebase/firestore';
import { firestore, auth, analytics } from '../firebase/config';
import { logEvent } from 'firebase/analytics';
import { AnalyticsEvent, CrashReport } from '../types/phase8';

export const monitoringService = {
  /**
   * تتبع الأحداث (Analytics)
   */
  async trackEvent(eventName: string, params: Record<string, any> = {}) {
    const user = auth.currentUser;
    
    // 1. Firebase Analytics (Official)
    logEvent(analytics, eventName, {
      user_id: user?.uid,
      ...params
    });

    // 2. Custom Firestore Analytics (For Admin Dashboard)
    try {
      await addDoc(collection(firestore, 'analyticsEvents'), {
        userId: user?.uid || 'anonymous',
        eventName,
        params,
        platform: 'web',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error('Failed to log custom event:', e);
    }
  },

  /**
   * تسجيل الأخطاء (Crash Reporting)
   */
  async reportError(error: Error, componentStack?: string) {
    const user = auth.currentUser;
    
    const report: Omit<CrashReport, 'id' | 'timestamp'> = {
      userId: user?.uid,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack || '',
      componentStack,
      deviceInfo: {
        browser: navigator.userAgent,
        os: navigator.platform,
        userAgent: navigator.userAgent
      }
    };

    try {
      await addDoc(collection(firestore, 'crashReports'), {
        ...report,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error('Failed to report error to Firestore:', e);
    }
  }
};
