import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot,
  serverTimestamp,
  addDoc,
  limit
} from 'firebase/firestore';
import { firestore, auth } from '../firebase/config';
import { Notification } from '../types/phase8';

export const notificationService = {
  /**
   * الحصول على إشعارات المستخدم الحالي
   */
  async getMyNotifications(limitCount = 20) {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
  },

  /**
   * الاستماع للإشعارات الجديدة (Real-time)
   */
  subscribeToNotifications(callback: (notifications: Notification[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snap) => {
      const notifications = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      callback(notifications);
    });
  },

  /**
   * تحديد إشعار كمقروء
   */
  async markAsRead(notificationId: string) {
    const docRef = doc(firestore, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  },

  /**
   * إرسال إشعار (لأغراض الاختبار أو من قبل الأدمن)
   */
  async sendNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    await addDoc(collection(firestore, 'notifications'), {
      ...data,
      read: false,
      createdAt: serverTimestamp()
    });
    
    // تسجيل في سجلات الإشعارات العامة
    await addDoc(collection(firestore, 'notificationLogs'), {
      userId: data.userId,
      type: data.type,
      title: data.title,
      timestamp: serverTimestamp()
    });
  }
};
