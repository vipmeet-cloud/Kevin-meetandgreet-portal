export type ApplicationStatus =
  | 'UNDER_REVIEW'
  | 'APPROVED_AWAITING_COMPLETION'
  | 'APPROVED'
  | 'DECLINED'
  | 'INFORMATION_REQUIRED'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_UNDER_REVIEW'
  | 'PAYMENT_CONFIRMED_AWAITING_PASS'
  | 'PAYMENT_REJECTED'
  | 'PAYMENT_CLARIFICATION_REQUIRED';

export type PreferredContactMethod = 'email' | 'phone' | 'whatsapp';

export const PUBLIC_STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: 'Under Management Review',
  APPROVED_AWAITING_COMPLETION: 'Approved — Next Step Available',
  APPROVED: 'Approved — Next Step Available',
  DECLINED: 'Application Declined',
  INFORMATION_REQUIRED: 'Additional Information Required',
  ADDITIONAL_INFO_REQUIRED: 'Additional Information Required',
  PAYMENT_SUBMITTED: 'Payment Submitted — Awaiting Management Review',
  PAYMENT_UNDER_REVIEW: 'Payment Under Management Review',
  PAYMENT_CONFIRMED_AWAITING_PASS: 'Payment Confirmed — VIP Pass Pending',
  PAYMENT_REJECTED: 'Payment Requires Attention',
  PAYMENT_CLARIFICATION_REQUIRED: 'Payment Requires Clarification',
};

export function getPublicStatusLabel(status: string): string {
  return PUBLIC_STATUS_LABELS[status] || 'Under Management Review';
}

export interface ApplicationFormData {
  // Step 1: About You
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  preferred_contact_method: PreferredContactMethod;

  // Step 2: Meet & Greet Details
  preferred_date: string;
  preferred_session: string;
  attendee_count: number;
  special_requirements: string;
  message_to_management: string;

  // Step 3: Supporting Information
  supporting_file_url?: string;
  supporting_file_name?: string;
  supporting_file_type?: string;
  supporting_file_public_id?: string;

  // Step 5: Terms & Submit
  terms_accepted: boolean;
  privacy_accepted: boolean;
}

export interface ApplicationFileRecord {
  id: string;
  application_id: string;
  file_type: string;
  cloudinary_url: string;
  public_id: string | null;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  application_id: string;
  management_user_id: string | null;
  management_user_email: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface ApplicationRecord {
  id: string;
  reference_code: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  preferred_contact_method: PreferredContactMethod;
  preferred_date: string;
  preferred_session: string;
  attendee_count: number;
  special_requirements: string | null;
  message_to_management: string | null;
  terms_version: string;
  terms_accepted_at: string;
  privacy_accepted_at: string;
  status: ApplicationStatus;
  continuation_token?: string | null;
  continuation_token_expires_at?: string | null;
  decline_reason?: string | null;
  information_requested_message?: string | null;
  information_requested_at?: string | null;
  information_requested_by?: string | null;
  management_notes?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  declined_at?: string | null;
  declined_by?: string | null;
  created_at: string;
  updated_at: string;
  application_files?: ApplicationFileRecord[];
  audit_logs?: AuditLogRecord[];
}

export interface ApplicationSubmissionResult {
  success: boolean;
  referenceCode?: string;
  applicationId?: string;
  status?: ApplicationStatus;
  isDuplicate?: boolean;
  error?: string;
}

export interface ApplicationStepValidation {
  isValid: boolean;
  errors: Record<string, string>;
}
