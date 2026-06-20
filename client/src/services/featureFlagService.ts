import { 
  doc, 
  getDoc, 
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { FeatureFlags } from '../types/phase8';

const DEFAULT_FLAGS: FeatureFlags = {
  adsEnabled: true,
  tasksEnabled: true,
  withdrawalsEnabled: true,
  referralsEnabled: true,
  maintenanceMode: false,
  minVersion: '1.0.0'
};

export const featureFlagService = {
  /**
   * الحصول على الإعدادات الحالية
   */
  async getFlags(): Promise<FeatureFlags> {
    const docRef = doc(firestore, 'systemSettings', 'featureFlags');
    const snap = await getDoc(docRef);
    
    if (snap.exists()) {
      return snap.data() as FeatureFlags;
    }
    
    // إذا لم تكن موجودة، قم بإنشاء القيم الافتراضية
    await setDoc(docRef, { ...DEFAULT_FLAGS, updatedAt: serverTimestamp() });
    return DEFAULT_FLAGS;
  },

  /**
   * الاستماع للتغييرات في الميزات (Real-time)
   */
  subscribeToFlags(callback: (flags: FeatureFlags) => void) {
    const docRef = doc(firestore, 'systemSettings', 'featureFlags');
    
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as FeatureFlags);
      } else {
        callback(DEFAULT_FLAGS);
      }
    });
  },

  /**
   * تحديث الميزات (للأدمن)
   */
  async updateFlags(flags: Partial<FeatureFlags>) {
    const docRef = doc(firestore, 'systemSettings', 'featureFlags');
    await setDoc(docRef, { 
      ...flags, 
      updatedAt: serverTimestamp() 
    }, { merge: true });
  }
};
