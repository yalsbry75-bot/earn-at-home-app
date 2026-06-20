/**
 * Security Service
 * Handles rate limiting, device tracking, and security checks
 */

interface LoginAttempt {
  timestamp: number;
  success: boolean;
}

interface DeviceInfo {
  id: string;
  name: string;
  lastLogin: number;
  ipAddress?: string;
}

// Store login attempts in memory (in production, use Firestore)
const loginAttempts = new Map<string, LoginAttempt[]>();
const deviceStore = new Map<string, DeviceInfo[]>();

const MAX_LOGIN_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const DEVICE_ID_KEY = 'device-id';

/**
 * Generate device ID
 */
export const generateDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

/**
 * Get device info
 */
export const getDeviceInfo = (): DeviceInfo => {
  const deviceId = generateDeviceId();
  const userAgent = navigator.userAgent;

  return {
    id: deviceId,
    name: extractDeviceName(userAgent),
    lastLogin: Date.now(),
    ipAddress: undefined, // Will be set by backend
  };
};

/**
 * Extract device name from user agent
 */
const extractDeviceName = (userAgent: string): string => {
  if (/Windows/.test(userAgent)) return 'Windows';
  if (/Mac/.test(userAgent)) return 'Mac';
  if (/iPhone/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent)) return 'iPad';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Linux/.test(userAgent)) return 'Linux';
  return 'Unknown Device';
};

/**
 * Check if login is rate limited
 */
export const isRateLimited = (email: string): boolean => {
  const attempts = loginAttempts.get(email) || [];
  const now = Date.now();

  // Remove old attempts outside the window
  const recentAttempts = attempts.filter((a) => now - a.timestamp < ATTEMPT_WINDOW);

  // Count failed attempts
  const failedAttempts = recentAttempts.filter((a) => !a.success).length;

  return failedAttempts >= MAX_LOGIN_ATTEMPTS;
};

/**
 * Record login attempt
 */
export const recordLoginAttempt = (email: string, success: boolean): void => {
  const attempts = loginAttempts.get(email) || [];
  attempts.push({
    timestamp: Date.now(),
    success,
  });

  // Keep only recent attempts
  const now = Date.now();
  const recentAttempts = attempts.filter((a) => now - a.timestamp < ATTEMPT_WINDOW * 2);

  loginAttempts.set(email, recentAttempts);
};

/**
 * Get remaining login attempts
 */
export const getRemainingLoginAttempts = (email: string): number => {
  const attempts = loginAttempts.get(email) || [];
  const now = Date.now();

  const recentAttempts = attempts.filter((a) => now - a.timestamp < ATTEMPT_WINDOW);
  const failedAttempts = recentAttempts.filter((a) => !a.success).length;

  return Math.max(0, MAX_LOGIN_ATTEMPTS - failedAttempts);
};

/**
 * Register device
 */
export const registerDevice = (userId: string, device: DeviceInfo): void => {
  const devices = deviceStore.get(userId) || [];

  // Check if device already exists
  const existingDevice = devices.find((d) => d.id === device.id);
  if (existingDevice) {
    existingDevice.lastLogin = Date.now();
  } else {
    devices.push(device);
  }

  deviceStore.set(userId, devices);
};

/**
 * Get user devices
 */
export const getUserDevices = (userId: string): DeviceInfo[] => {
  return deviceStore.get(userId) || [];
};

/**
 * Check if device is new
 */
export const isNewDevice = (userId: string, deviceId: string): boolean => {
  const devices = deviceStore.get(userId) || [];
  return !devices.find((d) => d.id === deviceId);
};

/**
 * Remove device
 */
export const removeDevice = (userId: string, deviceId: string): void => {
  const devices = deviceStore.get(userId) || [];
  const filtered = devices.filter((d) => d.id !== deviceId);
  deviceStore.set(userId, filtered);
};

/**
 * Logout from all devices
 */
export const logoutFromAllDevices = (userId: string): void => {
  deviceStore.delete(userId);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Password must be at least 8 characters');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Password must contain lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Password must contain uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Password must contain numbers');

  if (/[!@#$%^&*]/.test(password)) score++;
  else feedback.push('Password must contain special characters');

  return {
    isValid: score >= 4,
    score,
    feedback,
  };
};

/**
 * Generate referral code
 */
export const generateReferralCode = (userId: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  // Use userId to generate consistent code
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  for (let i = 0; i < 8; i++) {
    code += chars.charAt((hash + i) % chars.length);
  }

  return code;
};

/**
 * Check for suspicious activity
 */
export const checkSuspiciousActivity = (email: string, userId: string): {
  isSuspicious: boolean;
  reason?: string;
} => {
  // Check rate limiting
  if (isRateLimited(email)) {
    return {
      isSuspicious: true,
      reason: 'Too many login attempts',
    };
  }

  // Check device
  const devices = getUserDevices(userId);
  if (devices.length > 10) {
    return {
      isSuspicious: true,
      reason: 'Too many devices',
    };
  }

  return {
    isSuspicious: false,
  };
};
