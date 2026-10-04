export type EmailType =
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_APPROVED'
  | 'INFORMATION_REQUESTED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_REJECTED'
  | 'VIP_PASS_READY'
  | 'VIP_PASS_REVOKED';

export type EmailStatus = 'sent' | 'failed' | 'simulated' | 'pending';

export interface EmailLogRecord {
  id: string;
  recipient: string;
  recipient_name?: string;
  subject: string;
  email_type: EmailType;
  application_id?: string | null;
  application_reference?: string | null;
  status: EmailStatus;
  message_id?: string | null;
  error_message?: string | null;
  sent_at: string;
  created_at: string;
}

export function getEmailTypeLabel(type: EmailType): string {
  switch (type) {
    case 'APPLICATION_RECEIVED':
      return 'Application Received';
    case 'APPLICATION_APPROVED':
      return 'Application Approved';
    case 'INFORMATION_REQUESTED':
      return 'Information Requested';
    case 'PAYMENT_SUBMITTED':
      return 'Payment Submitted';
    case 'PAYMENT_CONFIRMED':
      return 'Payment Confirmed';
    case 'PAYMENT_REJECTED':
      return 'Payment Rejected';
    case 'VIP_PASS_READY':
      return 'VIP Pass Ready';
    case 'VIP_PASS_REVOKED':
      return 'VIP Pass Revoked';
    default:
      return type;
  }
}
