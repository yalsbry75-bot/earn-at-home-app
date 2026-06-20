import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  where,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { firestore, auth } from '../../firebase/config';
import { User } from '../../types';

export interface AdminLog {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId: string;
  targetType: 'user' | 'task' | 'withdrawal' | 'settings' | 'fraud';
  details: any;
  previousData?: any;
  newData?: any;
  timestamp: any;
}

export const adminService = {
  // Audit Logging
  async logAction(log: Omit<AdminLog, 'id' | 'adminId' | 'adminEmail' | 'timestamp'>) {
    const admin = auth.currentUser;
    if (!admin) return;

    await addDoc(collection(firestore, 'adminLogs'), {
      ...log,
      adminId: admin.uid,
      adminEmail: admin.email,
      timestamp: serverTimestamp(),
    });
  },

  // User Management
  async getAllUsers(limitCount = 100) {
    const q = query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  },

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'deleted', reason: string) {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    const previousData = userDoc.exists() ? userDoc.data() : null;

    await updateDoc(userRef, { 
      status, 
      updatedAt: serverTimestamp() 
    });

    await this.logAction({
      action: `Update user status to ${status}`,
      targetId: userId,
      targetType: 'user',
      details: { reason },
      previousData: { status: previousData?.status },
      newData: { status }
    });
  },

  // System Settings
  async getSettings() {
    const settingsDoc = await getDoc(doc(firestore, 'systemSettings', 'general'));
    return settingsDoc.exists() ? settingsDoc.data() : null;
  },

  async updateSettings(settings: any) {
    const settingsRef = doc(firestore, 'systemSettings', 'general');
    const previousDoc = await getDoc(settingsRef);
    const previousData = previousDoc.exists() ? previousDoc.data() : null;

    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });

    await this.logAction({
      action: 'Update system settings',
      targetId: 'general',
      targetType: 'settings',
      details: 'Updated general system settings',
      previousData,
      newData: settings
    });
  },

  // Dashboard Stats
  async getDashboardStats() {
    // Note: In a real production app, these should be pre-aggregated in a 'stats' collection
    // via Cloud Functions to avoid heavy reads. For this phase, we'll simulate or fetch.
    const usersCount = (await getDocs(collection(firestore, 'users'))).size;
    const withdrawalsPending = (await getDocs(query(collection(firestore, 'withdrawals'), where('status', '==', 'pending')))).size;
    
    // Simulate some financial data for the UI
    return {
      totalUsers: usersCount,
      pendingWithdrawals: withdrawalsPending,
      totalRevenue: 12500.50,
      totalPaid: 8400.25,
      activeTasks: 15,
      fraudAlerts: 3
    };
  }
};
