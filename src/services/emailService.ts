import { EmailLogRecord, EmailType, EmailStatus } from '../types/email';
import { EmailTemplateData, generateEmailHtml } from './emailTemplates';
import { getSupabaseClient } from './supabase';

const DEV_EMAIL_LOGS_KEY = 'aura_vip_dev_email_logs';

function getStoredDevEmailLogs(): EmailLogRecord[] {
  try {
    const raw = localStorage.getItem(DEV_EMAIL_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredDevEmailLogs(logs: EmailLogRecord[]) {
  try {
    localStorage.setItem(DEV_EMAIL_LOGS_KEY, JSON.stringify(logs));
  } catch {}
}

export const emailService = {
  /**
   * Dispatch an email notification via server-side Resend API.
   * If server or Resend API key is unconfigured, logs and simulates cleanly without throwing errors.
   */
  async sendEmail(params: {
    to: string;
    recipientName?: string;
    type: EmailType;
    data: EmailTemplateData;
    applicationId?: string | null;
    applicationReference?: string | null;
  }): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
    const { subject, html, text } = generateEmailHtml(params.type, params.data);
    const nowIso = new Date().toISOString();
    const logId = `eml_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Try server-side dispatch
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: params.to,
          subject,
          html,
          text,
          emailType: params.type,
          recipientName: params.recipientName,
          applicationId: params.applicationId,
          applicationReference: params.applicationReference,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const localRecord: EmailLogRecord = {
          id: result.logId || logId,
          recipient: params.to,
          recipient_name: params.recipientName,
          subject,
          email_type: params.type,
          application_id: params.applicationId || null,
          application_reference: params.applicationReference || null,
          status: result.status || (result.simulated ? 'simulated' : 'sent'),
          message_id: result.messageId || null,
          sent_at: nowIso,
          created_at: nowIso,
        };

        const logs = getStoredDevEmailLogs();
        logs.unshift(localRecord);
        saveStoredDevEmailLogs(logs);

        return { success: true, simulated: result.simulated };
      }
    } catch (err: unknown) {
      console.warn('Backend email endpoint notice, using local simulation:', err);
    }

    // Local simulation fallback
    const localRecord: EmailLogRecord = {
      id: logId,
      recipient: params.to,
      recipient_name: params.recipientName,
      subject,
      email_type: params.type,
      application_id: params.applicationId || null,
      application_reference: params.applicationReference || null,
      status: 'simulated',
      message_id: `sim_${Date.now()}`,
      sent_at: nowIso,
      created_at: nowIso,
    };

    const logs = getStoredDevEmailLogs();
    logs.unshift(localRecord);
    saveStoredDevEmailLogs(logs);

    return { success: true, simulated: true };
  },

  /**
   * Fetch complete email history for management inspection
   */
  async fetchEmailHistory(): Promise<{ logs: EmailLogRecord[]; error?: string }> {
    let remoteLogs: EmailLogRecord[] = [];

    try {
      const res = await fetch('/api/emails/history');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.logs)) {
          remoteLogs = data.logs;
        }
      }
    } catch {}

    // Query Supabase database under management RLS
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: dbLogs } = await (supabase.from('audit_logs') as any)
          .select('metadata')
          .eq('action', 'EMAIL_LOG')
          .order('created_at', { ascending: false })
          .limit(100);

        if (dbLogs && dbLogs.length > 0) {
          const parsed = dbLogs.map((r: any) => r.metadata as EmailLogRecord).filter(Boolean);
          remoteLogs = [...remoteLogs, ...parsed];
        }
      }
    } catch {}

    const devLogs = getStoredDevEmailLogs();

    // Deduplicate by id
    const seenIds = new Set<string>();
    const combined: EmailLogRecord[] = [];

    for (const log of [...remoteLogs, ...devLogs]) {
      if (!seenIds.has(log.id)) {
        seenIds.add(log.id);
        combined.push(log);
      }
    }

    return { logs: combined };
  },

  /**
   * Retry sending an email that previously failed
   */
  async retryEmail(logId: string): Promise<{ success: boolean; error?: string }> {
    const logs = getStoredDevEmailLogs();
    const target = logs.find(l => l.id === logId);
    if (!target) return { success: false, error: 'Email record not found' };

    const result = await this.sendEmail({
      to: target.recipient,
      recipientName: target.recipient_name,
      type: target.email_type,
      data: { firstName: target.recipient_name || 'Guest', referenceCode: target.application_reference || undefined },
      applicationId: target.application_id,
      applicationReference: target.application_reference,
    });

    if (result.success) {
      target.status = result.simulated ? 'simulated' : 'sent';
      saveStoredDevEmailLogs(logs);
    }

    return result;
  },
};
