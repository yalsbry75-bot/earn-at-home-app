/**
 * Firebase Services Wrapper
 * Provides utility functions for Firebase operations
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, firestore, storage } from './config';
import type { User } from '../types';
import { generateReferralCode } from '../services/securityService';

// ============= Auth Services =============

export const authService = {
  // Register new user with complete profile
  async register(
    email: string,
    password: string,
    displayName: string,
    fatherName: string,
    country: string
  ) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile
      await updateProfile(user, { displayName });

      // Generate referral code
      const referralCode = generateReferralCode(user.uid);

      // Create user document in Firestore with complete data
      await setDoc(doc(firestore, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName: displayName,
        fatherName: fatherName,
        country: country,
        photoURL: null,
        language: 'ar',
        referralCode: referralCode,
        points: 0,
        balance: 0,
        level: 'Bronze',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        emailVerified: true,
        devices: [],
        role: 'user',
      });

      return user;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last login
      await updateDoc(doc(firestore, 'users', user.uid), {
        lastLogin: Timestamp.now(),
      });

      return user;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },

  // Get user profile from Firestore
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (!userDoc.exists()) return null;

      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastLogin: data.lastLogin?.toDate() || new Date(),
      } as User;
    } catch (error) {
      throw error;
    }
  },

  // Send password reset email
  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  },

  // Send password reset email (exported function)
  async sendResetEmail(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  },

  // Reset password with code
  async resetPassword(code: string, newPassword: string) {
    try {
      await confirmPasswordReset(auth, code, newPassword);
    } catch (error) {
      throw error;
    }
  },

  // Verify email
  async verifyEmail(userId: string) {
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        emailVerified: true,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },
};

// ============= User Services =============

export const userService = {
  // Get user profile
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (!userDoc.exists()) return null;

      const data = userDoc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<User>) {
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Delete user account
  async deleteUserAccount(userId: string) {
    try {
      const userRef = doc(firestore, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      throw error;
    }
  },

  // Check if email exists
  async emailExists(email: string): Promise<boolean> {
    try {
      const q = query(collection(firestore, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      throw error;
    }
  },

  // Get user by referral code
  async getUserByReferralCode(referralCode: string): Promise<User | null> {
    try {
      const q = query(collection(firestore, 'users'), where('referralCode', '==', referralCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return null;

      const data = querySnapshot.docs[0].data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User;
    } catch (error) {
      throw error;
    }
  },

  // Add points to user
  async addPoints(userId: string, points: number) {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) throw new Error('User not found');

      const currentPoints = userDoc.data().points || 0;
      await updateDoc(userRef, {
        points: currentPoints + points,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Add balance to user
  async addBalance(userId: string, balance: number) {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) throw new Error('User not found');

      const currentBalance = userDoc.data().balance || 0;
      await updateDoc(userRef, {
        balance: currentBalance + balance,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Update user level
  async updateUserLevel(userId: string, level: string) {
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        level: level,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      throw error;
    }
  },
};

// ============= Storage Services =============

export const storageService = {
  // Upload file
  async uploadFile(userId: string, file: File, path: string): Promise<string> {
    try {
      const fileRef = ref(storage, `users/${userId}/${path}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    } catch (error) {
      throw error;
    }
  },

  // Delete file
  async deleteFile(userId: string, path: string) {
    try {
      const fileRef = ref(storage, `users/${userId}/${path}`);
      await deleteObject(fileRef);
    } catch (error) {
      throw error;
    }
  },

  // Get download URL
  async getDownloadURL(userId: string, path: string): Promise<string> {
    try {
      const fileRef = ref(storage, `users/${userId}/${path}`);
      return await getDownloadURL(fileRef);
    } catch (error) {
      throw error;
    }
  },
};

// ============= Firestore Services =============

export const firestoreService = {
  // Generic get document
  async getDocument<T>(collection: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(firestore, collection, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as T) : null;
    } catch (error) {
      throw error;
    }
  },

  // Generic set document
  async setDocument<T extends Record<string, any>>(collection: string, docId: string, data: T) {
    try {
      await setDoc(doc(firestore, collection, docId), data);
    } catch (error) {
      throw error;
    }
  },

  // Generic update document
  async updateDocument<T extends Record<string, any>>(collection: string, docId: string, data: Partial<T>) {
    try {
      await updateDoc(doc(firestore, collection, docId), data as any);
    } catch (error) {
      throw error;
    }
  },

  // Generic delete document
  async deleteDocument(collection: string, docId: string) {
    try {
      await deleteDoc(doc(firestore, collection, docId));
    } catch (error) {
      throw error;
    }
  },

  // Generic query
  async queryDocuments<T>(
    collectionName: string,
    constraints: any[] = []
  ): Promise<T[]> {
    try {
      const q = query(collection(firestore, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as T);
    } catch (error) {
      throw error;
    }
  },
};
