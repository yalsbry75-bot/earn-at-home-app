/**
 * Tasks Service
 * Handles task operations, verification, and rewards
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import type {
  Task,
  UserTask,
  TaskHistory,
  DailyLoginReward,
  UserDailyLogin,
  TaskFilter,
  TaskStats,
} from '../types/tasks';

// ============= Tasks Services =============

export const tasksService = {
  // Get all tasks with filters
  async getTasks(filter: TaskFilter = {}): Promise<Task[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('status', '==', 'active'),
      ];

      if (filter.type) {
        constraints.push(where('type', '==', filter.type));
      }

      if (filter.provider) {
        constraints.push(where('provider', '==', filter.provider));
      }

      constraints.push(orderBy('priority', 'desc'));
      constraints.push(orderBy('createdAt', 'desc'));

      if (filter.limit && filter.limit > 0) {
        constraints.push(limit(filter.limit));
      }

      // Note: offset is not available in Firestore, use pagination instead

      const q = query(collection(firestore, 'tasks'), ...constraints);
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate(),
        } as Task;
      });
    } catch (error) {
      throw error;
    }
  },

  // Get single task
  async getTask(taskId: string): Promise<Task | null> {
    try {
      const taskDoc = await getDoc(doc(firestore, 'tasks', taskId));
      if (!taskDoc.exists()) return null;

      const data = taskDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate(),
      } as Task;
    } catch (error) {
      throw error;
    }
  },

  // Subscribe to tasks changes
  subscribeTasks(
    filter: TaskFilter = {},
    callback: (tasks: Task[]) => void
  ) {
    try {
      const constraints: QueryConstraint[] = [
        where('status', '==', 'active'),
      ];

      if (filter.type) {
        constraints.push(where('type', '==', filter.type));
      }

      constraints.push(orderBy('priority', 'desc'));
      constraints.push(orderBy('createdAt', 'desc'));

      if (filter.limit && filter.limit > 0) {
        constraints.push(limit(filter.limit));
      }

      const q = query(collection(firestore, 'tasks'), ...constraints);

      return onSnapshot(q, (querySnapshot) => {
        const tasks = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            expiresAt: data.expiresAt?.toDate(),
          } as Task;
        });

        callback(tasks);
      });
    } catch (error) {
      throw error;
    }
  },

  // Get user task status
  async getUserTask(userId: string, taskId: string): Promise<UserTask | null> {
    try {
      const userTaskDoc = await getDoc(
        doc(firestore, `users/${userId}/tasks`, taskId)
      );
      if (!userTaskDoc.exists()) return null;

      const data = userTaskDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastCompletedAt: data.lastCompletedAt?.toDate(),
        nextAvailableAt: data.nextAvailableAt?.toDate(),
      } as UserTask;
    } catch (error) {
      throw error;
    }
  },

  // Get user tasks
  async getUserTasks(userId: string): Promise<UserTask[]> {
    try {
      const q = query(
        collection(firestore, `users/${userId}/tasks`)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastCompletedAt: data.lastCompletedAt?.toDate(),
          nextAvailableAt: data.nextAvailableAt?.toDate(),
        } as UserTask;
      });
    } catch (error) {
      throw error;
    }
  },

  // Create task history (for verification)
  async createTaskHistory(
    userId: string,
    taskId: string,
    rewardPoints: number,
    rewardUSD: number,
    provider: string
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore, 'taskHistory'), {
        userId,
        taskId,
        status: 'pending',
        rewardPoints,
        rewardUSD,
        provider,
        timestamp: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Get task history
  async getTaskHistory(userId: string, limitCount: number = 50): Promise<TaskHistory[]> {
    try {
      const q = query(
        collection(firestore, 'taskHistory'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
        } as TaskHistory;
      });
    } catch (error) {
      throw error;
    }
  },

  // Subscribe to task history
  subscribeTaskHistory(
    userId: string,
    callback: (history: TaskHistory[]) => void,
    limitCount: number = 50
  ) {
    try {
      const q = query(
        collection(firestore, 'taskHistory'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      return onSnapshot(q, (querySnapshot) => {
        const history = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate(),
          } as TaskHistory;
        });

        callback(history);
      });
    } catch (error) {
      throw error;
    }
  },

  // Get task stats
  async getTaskStats(userId: string): Promise<TaskStats> {
    try {
      // Get all tasks
      const allTasks = await this.getTasks({ limit: 1000, offset: 0 });
      const totalTasks = allTasks.length;

      // Get user tasks
      const userTasks = await this.getUserTasks(userId);
      const completedTasks = userTasks.filter(
        (t) => t.status === 'completed'
      ).length;

      // Get task history
      const history = await this.getTaskHistory(userId, 1000);
      const totalEarnings = history
        .filter((h) => h.status === 'verified')
        .reduce((sum, h) => sum + h.rewardUSD, 0);

      const totalPoints = history
        .filter((h) => h.status === 'verified')
        .reduce((sum, h) => sum + h.rewardPoints, 0);

      return {
        totalTasks,
        availableTasks: totalTasks - completedTasks,
        completedTasks,
        totalEarnings,
        totalPoints,
        averageReward: completedTasks > 0 ? totalEarnings / completedTasks : 0,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      };
    } catch (error) {
      throw error;
    }
  },
};

// ============= Daily Login Services =============

export const dailyLoginService = {
  // Get daily login rewards config
  getDailyRewards(): DailyLoginReward[] {
    return [
      { day: 1, points: 100, usd: 0.1 },
      { day: 2, points: 150, usd: 0.15 },
      { day: 3, points: 200, usd: 0.2 },
      { day: 4, points: 250, usd: 0.25 },
      { day: 5, points: 300, usd: 0.3 },
      { day: 6, points: 400, usd: 0.4 },
      { day: 7, points: 500, usd: 0.5 }, // Weekly bonus
    ];
  },

  // Get user daily login
  async getUserDailyLogin(userId: string): Promise<UserDailyLogin | null> {
    try {
      const dailyLoginDoc = await getDoc(doc(firestore, `users/${userId}/dailyLogin`, 'current'));
      if (!dailyLoginDoc.exists()) return null;

      const data = dailyLoginDoc.data();

      return {
        ...data,
        lastLoginDate: data.lastLoginDate?.toDate() || new Date(),
        lastRewardClaimed: data.lastRewardClaimed?.toDate(),
      } as UserDailyLogin;
    } catch (error) {
      throw error;
    }
  },

  // Check if can claim daily reward
  async canClaimDailyReward(userId: string): Promise<boolean> {
    try {
      const dailyLogin = await this.getUserDailyLogin(userId);
      if (!dailyLogin) return true;

      const now = new Date();
      const lastLogin = new Date(dailyLogin.lastLoginDate);

      // Check if 24 hours have passed (UTC)
      const diffHours =
        (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);

      return diffHours >= 24;
    } catch (error) {
      throw error;
    }
  },

  // Record daily login (backend should call this)
  async recordDailyLogin(userId: string): Promise<UserDailyLogin> {
    try {
      const dailyLogin = await this.getUserDailyLogin(userId);
      const now = new Date();

      let currentStreak = 1;
      let maxStreak = 1;

      if (dailyLogin) {
        const lastLogin = new Date(dailyLogin.lastLoginDate);
        const diffHours = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);

        if (diffHours >= 24 && diffHours < 48) {
          // Consecutive day
          currentStreak = dailyLogin.currentStreak + 1;
          maxStreak = Math.max(currentStreak, dailyLogin.maxStreak);
        } else if (diffHours >= 48) {
          // Streak broken
          currentStreak = 1;
          maxStreak = dailyLogin.maxStreak;
        }
      }

      const newDailyLogin: UserDailyLogin = {
        userId,
        lastLoginDate: now,
        currentStreak,
        maxStreak,
        totalLogins: (dailyLogin?.totalLogins || 0) + 1,
        lastRewardClaimed: now,
      };

      const dailyLoginRef = doc(firestore, `users/${userId}/dailyLogin`, 'current');
      await setDoc(dailyLoginRef, newDailyLogin);

      return newDailyLogin;
    } catch (error) {
      throw error;
    }
  },
};

// ============= Anti Abuse Services =============

export const antiAbuseService = {
  // Check for suspicious activity
  async checkSuspiciousActivity(userId: string): Promise<boolean> {
    try {
      // Check for multiple accounts
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (!userDoc.exists()) return false;

      const userData = userDoc.data();

      // Check if device is flagged
      if (userData.flagged) return true;

      // Check for rapid task completion
      const recentHistory = await tasksService.getTaskHistory(userId, 10);
      if (recentHistory.length >= 10) {
        const timestamps = recentHistory.map((h) => h.timestamp.getTime());
        const timeDiff = timestamps[0] - timestamps[9];
        const minutesPassed = timeDiff / (1000 * 60);

        // If 10 tasks completed in less than 5 minutes, it's suspicious
        if (minutesPassed < 5) return true;
      }

      return false;
    } catch (error) {
      throw error;
    }
  },

  // Flag user account
  async flagUser(userId: string, reason: string): Promise<void> {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      await updateDoc(userDocRef, {
        flagged: true,
        flagReason: reason,
        flaggedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Unflag user account
  async unflagUser(userId: string): Promise<void> {
    try {
      const userDocRef = doc(firestore, 'users', userId);
      await updateDoc(userDocRef, {
        flagged: false,
        flagReason: null,
        flaggedAt: null,
      });
    } catch (error) {
      throw error;
    }
  },
};
