/**
 * Resend Email Service Architecture
 * Reserved for Phase 5 (Transactional application confirmations, review status updates, VIP pass delivery).
 * Designed for server-side dispatch to prevent client-side key exposure.
 */

export interface ResendEmailPayload {
  to: string;
  subject: string;
  template: 'application_received' | 'application_approved' | 'payment_confirmed' | 'vip_pass_issued';
  variables: Record<string, string | number>;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function isResendConfigured(): boolean {
  // Check if Resend API key is present in environment (used server-side)
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 0);
}

/**
 * Placeholder dispatch for Phase 1.
 * Will connect to backend proxy /api/send-email in Phase 5.
 */
export async function queueEmailNotification(payload: ResendEmailPayload): Promise<EmailDispatchResult> {
  // Phase 1: Service foundation architecture check
  if (!isResendConfigured()) {
    return {
      success: false,
      error: 'Resend email service is reserved for Phase 5 and not yet configured.'
    };
  }

  return {
    success: true,
    messageId: `queued_${Date.now()}`
  };
}
