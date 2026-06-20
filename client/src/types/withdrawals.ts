/**
 * Withdrawal & KYC System Types
 */

// ============= Withdrawal Types =============

export type WithdrawalStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'failed'
  | 'on_hold';

export type PaymentMethodType = 
  | 'paypal'
  | 'wise'
  | 'usdt_trc20'
  | 'usdt_erc20'
  | 'e_wallet'
  | 'bank_transfer'
  | 'local_payment';

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number; // USD
  fee: number;
  netAmount: number;
  method: PaymentMethodType;
  paymentDetails: Record<string, any>; // Encrypted or masked
  status: WithdrawalStatus;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  adminNotes?: string;
  rejectionReason?: string;
  transactionHash?: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  label: string;
  details: Record<string, any>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============= KYC Types =============

export type KYCLevel = 0 | 1 | 2;
export type KYCStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface KYCData {
  userId: string;
  level: KYCLevel;
  status: KYCStatus;
  fullName?: string;
  country?: string;
  idType?: 'passport' | 'id_card' | 'driving_license';
  idNumber?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  selfieUrl?: string;
  submittedAt?: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

// ============= Wallet State Updates =============

export interface WalletBalance {
  available: number;
  pendingWithdrawal: number;
  frozen: number;
  totalPaid: number;
}

// ============= Security & Logs =============

export interface WithdrawalLog {
  id: string;
  userId: string;
  withdrawalId: string;
  action: string;
  status: WithdrawalStatus;
  adminId?: string;
  notes?: string;
  timestamp: Date;
  ipAddress?: string;
  deviceId?: string;
}

// ============= UI State =============

export interface WithdrawalState {
  withdrawals: Withdrawal[];
  paymentMethods: PaymentMethod[];
  kyc: KYCData | null;
  isLoading: boolean;
  error: string | null;
}
