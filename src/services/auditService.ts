import { getSupabaseClient } from './supabase';
import { AuditLogRecord } from '../types/application';

const DEV_AUDIT_LOGS_KEY = 'aura_vip_dev_audit_logs';

function getStoredDevAuditLogs(): AuditLogRecord[] {
  try {
    const raw = localStorage.getItem(DEV_AUDIT_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export const auditService = {
  /**
   * Fetch chronological audit log records for management
   */
  async fetchAuditLogs(options?: { limit?: number; action?: string; applicationId?: string }): Promise<{ logs: AuditLogRecord[]; error?: string }> {
    const supabase = getSupabaseClient();
    const limit = options?.limit || 150;

    if (supabase) {
      try {
        let query = (supabase.from('audit_logs') as any)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (options?.action && options.action !== 'ALL') {
          query = query.eq('action', options.action);
        } else {
          // Exclude internal system sync records from management audit trail
          query = query.not('action', 'in', '("VISITOR_RECORD","CONTACT_INQUIRY","EMAIL_LOG")');
        }
        if (options?.applicationId) {
          query = query.eq('application_id', options.applicationId);
        }

        const { data, error } = await query;

        if (!error && data) {
          return { logs: data as AuditLogRecord[] };
        }
      } catch (err: unknown) {
        console.warn('Could not query remote audit logs:', err);
      }
    }

    const devLogs = getStoredDevAuditLogs();
    let filtered = devLogs;
    if (options?.action && options.action !== 'ALL') {
      filtered = filtered.filter(l => l.action === options.action);
    }
    if (options?.applicationId) {
      filtered = filtered.filter(l => l.application_id === options.applicationId);
    }
    return { logs: filtered.slice(0, limit) };
  },

  /**
   * Insert an audit log entry
   */
  async recordAction(
    action: string,
    applicationId?: string,
    paymentId?: string,
    userId?: string,
    userEmail?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const nowIso = new Date().toISOString();

    if (supabase) {
      try {
        await (supabase.from('audit_logs') as any).insert({
          action,
          application_id: applicationId || null,
          payment_id: paymentId || null,
          management_user_id: userId || null,
          management_user_email: userEmail || null,
          metadata: metadata || null,
          created_at: nowIso,
        });
        return;
      } catch (err) {
        console.warn('Could not record remote audit log:', err);
      }
    }

    // Dev fallback
    try {
      const logs = getStoredDevAuditLogs();
      logs.unshift({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action,
        application_id: applicationId || '',
        management_user_id: userId || null,
        management_user_email: userEmail || null,
        metadata,
        created_at: nowIso,
      });
      localStorage.setItem(DEV_AUDIT_LOGS_KEY, JSON.stringify(logs));
    } catch {}
  },
};
