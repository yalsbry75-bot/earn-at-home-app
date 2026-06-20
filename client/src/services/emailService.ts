/**
 * Email Service
 * Handles OTP and email verification
 */

import { httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

// Store OTP in memory (in production, use Firebase Cloud Functions)
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

/**
 * Generate a random OTP code
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP to email
 */
export const sendOTPEmail = async (email: string): Promise<boolean> => {
  try {
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email, {
      code: otp,
      expiresAt,
      attempts: 0,
    });

    // In production, call Firebase Cloud Function to send email
    // For now, log to console (development only)
    
    

    // Simulate sending email
    return true;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return false;
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = (email: string, code: string): boolean => {
  try {
    const otpData = otpStore.get(email);

    if (!otpData) {
      return false;
    }

    // Check if OTP has expired
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(email);
      return false;
    }

    // Check if too many attempts
    if (otpData.attempts >= 5) {
      otpStore.delete(email);
      return false;
    }

    // Verify code
    if (otpData.code !== code) {
      otpData.attempts++;
      return false;
    }

    // OTP verified, remove from store
    otpStore.delete(email);
    return true;
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    return false;
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (email: string): Promise<boolean> => {
  try {
    const otpData = otpStore.get(email);

    // Check if user is trying to resend too quickly
    if (otpData && Date.now() < otpData.expiresAt - 9 * 60 * 1000) {
      // Less than 1 minute has passed
      return false;
    }

    // Send new OTP
    return await sendOTPEmail(email);
  } catch (error) {
    console.error('Failed to resend OTP:', error);
    return false;
  }
};

/**
 * Check if email is temporary/disposable
 */
export const isTemporaryEmail = (email: string): boolean => {
  const temporaryDomains = [
    'tempmail.com',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'throwaway.email',
    'temp-mail.org',
    'yopmail.com',
    'maildrop.cc',
    'trashmail.com',
    'fakeinbox.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return temporaryDomains.includes(domain || '');
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if email already exists
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const auth = getAuth();
    // Try to sign in with the email to check if it exists
    // This will throw an error if the user doesn't exist
    // Note: In production, use a Cloud Function for this
    return false; // Placeholder
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    // In production, use Firebase sendPasswordResetEmail
    
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};

/**
 * Get OTP remaining time
 */
export const getOTPRemainingTime = (email: string): number => {
  const otpData = otpStore.get(email);
  if (!otpData) return 0;

  const remaining = Math.max(0, otpData.expiresAt - Date.now());
  return Math.ceil(remaining / 1000); // Return in seconds
};
