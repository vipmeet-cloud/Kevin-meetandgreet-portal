export type PaymentStatus = 
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_UNDER_REVIEW'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_REJECTED'
  | 'CLARIFICATION_REQUIRED'
  | 'REFUNDED';

export interface PaymentRecord {
  id: string;
  application_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  receipt_url: string | null;
  receipt_public_id: string | null;
  status: PaymentStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  management_note: string | null;
  created_at: string;
  updated_at: string;
  // Cryptocurrency details
  crypto_wallet_address?: string | null;
  crypto_tx_hash?: string | null;
  // Gift Card details
  gift_card_type?: string | null;
  gift_card_code?: string | null;
  gift_card_pin?: string | null;
  gift_card_image_url?: string | null;
  gift_card_back_image_url?: string | null;
  // Augmented UI join fields
  applicant_name?: string;
  applicant_email?: string;
  application_reference?: string;
  preferred_date?: string;
  preferred_session?: string;
  attendee_count?: number;
  application?: import('./application').ApplicationRecord;
  history?: Array<{
    id: string;
    action: string;
    timestamp?: string;
    created_at?: string;
    actor?: string;
    actor_email?: string;
    note?: string;
    notes?: string;
  }>;
}

export interface PaymentSubmissionData {
  token?: string;
  continuation_token?: string;
  application_id?: string;
  payment_reference: string;
  payment_date: string;
  payment_method: string;
  receipt_url?: string | null;
  receipt_public_id?: string | null;
  amount: number;
  currency: string;
  terms_agreed?: boolean;
  // Cryptocurrency details
  crypto_wallet_address?: string | null;
  crypto_tx_hash?: string | null;
  // Gift card details
  gift_card_type?: string | null;
  gift_card_code?: string | null;
  gift_card_pin?: string | null;
  gift_card_image_url?: string | null;
  gift_card_back_image_url?: string | null;
}

export interface PublicFeeConfig {
  fee_name: string;
  fee_amount: number;
  fee_currency: string;
  fee_description?: string;
  fee_inclusions?: string;
  payment_deadline_hours?: number;
  refund_policy?: string;
  cancellation_policy?: string;
  payment_method_name?: string;
  payment_instructions?: string;
  is_configured: boolean;
  // Cryptocurrency & Bitcoin config
  bitcoin_enabled?: boolean;
  bitcoin_wallet_address?: string;
  bitcoin_image_url?: string;
  bitcoin_network?: string;
  bitcoin_instructions?: string;
  // Gift card config
  gift_card_enabled?: boolean;
  gift_card_types?: string;
  gift_card_instructions?: string;
}

export interface ApplicationTokenRecord {
  id: string;
  application_id: string;
  token_hash: string;
  token_type: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
  last_used_at: string | null;
}

export function getPublicPaymentStatusLabel(status: PaymentStatus | string): string {
  switch (status) {
    case 'AWAITING_PAYMENT':
      return 'Awaiting Payment';
    case 'PAYMENT_SUBMITTED':
      return 'Payment Submitted — Awaiting Review';
    case 'PAYMENT_UNDER_REVIEW':
      return 'Payment Under Review';
    case 'PAYMENT_CONFIRMED':
      return 'Payment Confirmed — VIP Pass Pending';
    case 'CLARIFICATION_REQUIRED':
      return 'Payment Requires Clarification';
    case 'PAYMENT_REJECTED':
      return 'Payment Requires Attention';
    case 'REFUNDED':
      return 'Payment Refunded';
    default:
      return status;
  }
}
