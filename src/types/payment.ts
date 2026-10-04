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
