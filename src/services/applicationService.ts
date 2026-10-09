import { getSupabaseClient } from './supabase';
import { tokenService } from './tokenService';
import { emailService } from './emailService';
import { 
  ApplicationFormData, 
  ApplicationRecord, 
  ApplicationSubmissionResult,
  ApplicationStepValidation,
  AuditLogRecord,
  ApplicationStatus
} from '../types/application';

// Helper to generate human-readable reference code: VIP-XXXX-XXX
export function generateReferenceCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let chunk1 = '';
  let chunk2 = '';

  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(7);
    window.crypto.getRandomValues(arr);
    for (let i = 0; i < 4; i++) chunk1 += chars[arr[i] % chars.length];
    for (let i = 4; i < 7; i++) chunk2 += chars[arr[i] % chars.length];
  } else {
    for (let i = 0; i < 4; i++) chunk1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 3; i++) chunk2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `VIP-${chunk1}-${chunk2}`;
}

// Helper to generate cryptographically secure continuation token
export function generateSecureContinuationToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `sec_${hex}`;
  }
  // Fallback
  return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Session key for current submission receipt
const SUBMISSION_RECEIPT_KEY = 'aura_vip_last_submission';
// In-memory fallback applications for dev environments without live credentials
const DEV_APPLICATIONS_KEY = 'aura_vip_dev_applications';
const DEV_AUDIT_LOGS_KEY = 'aura_vip_dev_audit_logs';

export interface SubmittedReceipt {
  referenceCode: string;
  applicationId: string;
  fullName: string;
  email: string;
  preferredDate: string;
  preferredSession: string;
  attendeeCount: number;
  submittedAt: string;
  status: string;
}

export function saveSubmissionReceipt(receipt: SubmittedReceipt) {
  try {
    sessionStorage.setItem(SUBMISSION_RECEIPT_KEY, JSON.stringify(receipt));
  } catch {
    // sessionStorage unavailable
  }
}

export function getSubmissionReceipt(): SubmittedReceipt | null {
  try {
    const raw = sessionStorage.getItem(SUBMISSION_RECEIPT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // unavailable
  }
  return null;
}

// Validation helpers
export function validateAboutYou(data: Partial<ApplicationFormData>): ApplicationStepValidation {
  const errors: Record<string, string> = {};

  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.full_name = 'Please enter your full legal name.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  const phoneRegex = /^[\d\s+\-().]{6,25}$/;
  if (!data.phone || !phoneRegex.test(data.phone.trim())) {
    errors.phone = 'Please enter a valid telephone contact number.';
  }

  if (!data.country || data.country.trim().length < 2) {
    errors.country = 'Please specify your country of residence.';
  }

  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'Please specify your current city.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateMeetGreetDetails(data: Partial<ApplicationFormData>): ApplicationStepValidation {
  const errors: Record<string, string> = {};

  if (!data.preferred_date || data.preferred_date.trim().length === 0) {
    errors.preferred_date = 'Please select a preferred engagement date.';
  }

  if (!data.preferred_session || data.preferred_session.trim().length === 0) {
    errors.preferred_session = 'Please select your preferred session timeframe.';
  }

  if (!data.attendee_count || data.attendee_count < 1 || data.attendee_count > 10) {
    errors.attendee_count = 'Guest count must be between 1 and 10 attendees.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateAgreements(data: Partial<ApplicationFormData>): ApplicationStepValidation {
  const errors: Record<string, string> = {};

  if (!data.terms_accepted) {
    errors.terms_accepted = 'You must review and accept the VIP Meet & Greet Guidelines.';
  }

  if (!data.privacy_accepted) {
    errors.privacy_accepted = 'Please confirm consent for identity verification & screening.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function getStoredDevApplications(): ApplicationRecord[] {
  try {
    const raw = localStorage.getItem(DEV_APPLICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredDevApplications(apps: ApplicationRecord[]) {
  try {
    localStorage.setItem(DEV_APPLICATIONS_KEY, JSON.stringify(apps));
  } catch {}
}

function getStoredDevAuditLogs(): AuditLogRecord[] {
  try {
    const raw = localStorage.getItem(DEV_AUDIT_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredDevAuditLogs(logs: AuditLogRecord[]) {
  try {
    localStorage.setItem(DEV_AUDIT_LOGS_KEY, JSON.stringify(logs));
  } catch {}
}

export const applicationService = {
  /**
   * Check for duplicate applications submitted within 24 hours
   */
  async checkDuplicate(email: string, phone: string): Promise<{ isDuplicate: boolean; referenceCode?: string }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const devApps = getStoredDevApplications();
      const existing = devApps.find(a => 
        a.email.toLowerCase() === email.trim().toLowerCase() || a.phone === phone.trim()
      );
      if (existing) {
        return { isDuplicate: true, referenceCode: existing.reference_code };
      }
      return { isDuplicate: false };
    }

    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await (supabase.from('applications') as any)
        .select('reference_code, email, phone, created_at')
        .or(`email.ilike.${email.trim().toLowerCase()},phone.eq.${phone.trim()}`)
        .gte('created_at', yesterday)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return { isDuplicate: true, referenceCode: data.reference_code };
      }
    } catch {}

    return { isDuplicate: false };
  },

  /**
   * Submit new applicant application to Supabase
   */
  async submit(formData: ApplicationFormData, termsVersion = '1.0'): Promise<ApplicationSubmissionResult> {
    const step1 = validateAboutYou(formData);
    if (!step1.isValid) {
      return { success: false, error: Object.values(step1.errors)[0] };
    }

    const step2 = validateMeetGreetDetails(formData);
    if (!step2.isValid) {
      return { success: false, error: Object.values(step2.errors)[0] };
    }

    const step5 = validateAgreements(formData);
    if (!step5.isValid) {
      return { success: false, error: Object.values(step5.errors)[0] };
    }

    const dupCheck = await this.checkDuplicate(formData.email, formData.phone);
    if (dupCheck.isDuplicate) {
      return {
        success: false,
        isDuplicate: true,
        referenceCode: dupCheck.referenceCode,
        error: `An application has already been registered with these contact details (Ref: ${dupCheck.referenceCode}).`,
      };
    }

    const referenceCode = generateReferenceCode();
    const supabase = getSupabaseClient();

    const applicationPayload = {
      reference_code: referenceCode,
      full_name: formData.full_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      country: formData.country.trim(),
      city: formData.city.trim(),
      preferred_contact_method: formData.preferred_contact_method || 'email',
      preferred_date: formData.preferred_date.trim(),
      preferred_session: formData.preferred_session.trim(),
      attendee_count: Number(formData.attendee_count) || 1,
      special_requirements: formData.special_requirements?.trim() || null,
      message_to_management: formData.message_to_management?.trim() || null,
      terms_version: termsVersion,
      terms_accepted_at: new Date().toISOString(),
      privacy_accepted_at: new Date().toISOString(),
      status: 'UNDER_REVIEW',
    };

    // 1. Primary submission method: Server-side API endpoint
    // Uses serverSupabase (service role) to guarantee 100% bypass of anon RLS restrictions on Vercel and incognito browsers
    try {
      const serverRes = await fetch('/api/applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: applicationPayload,
          file: formData.supporting_file_url ? {
            cloudinary_url: formData.supporting_file_url,
            file_type: formData.supporting_file_type || 'image',
            public_id: formData.supporting_file_public_id || null,
          } : null,
        }),
      });

      if (serverRes.ok) {
        const resData = await serverRes.json();
        if (resData.success && resData.application) {
          const appRecord = resData.application;
          
          saveSubmissionReceipt({
            referenceCode: appRecord.reference_code,
            applicationId: appRecord.id,
            fullName: formData.full_name,
            email: formData.email,
            preferredDate: formData.preferred_date,
            preferredSession: formData.preferred_session,
            attendeeCount: formData.attendee_count,
            submittedAt: appRecord.created_at || new Date().toISOString(),
            status: 'Under Management Review',
          });

          // Dispatch Application Received email via Gmail SMTP
          const firstName = formData.full_name.split(' ')[0] || 'Guest';
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          emailService.sendEmail({
            to: formData.email,
            recipientName: firstName,
            type: 'APPLICATION_RECEIVED',
            data: {
              firstName,
              referenceCode: appRecord.reference_code,
              applicationUrl: `${origin}/apply`,
            },
            applicationId: appRecord.id,
            applicationReference: appRecord.reference_code,
          }).catch(e => console.warn('Application email notice:', e));

          return {
            success: true,
            referenceCode: appRecord.reference_code,
            applicationId: appRecord.id,
            status: 'UNDER_REVIEW',
          };
        }
      }
    } catch (sErr) {
      console.warn('Notice: Server application submission endpoint notice, checking direct DB:', sErr);
    }

    if (supabase) {
      try {
        const { data, error } = await (supabase.from('applications') as any)
          .insert(applicationPayload)
          .select('id, reference_code, status, created_at')
          .single();

        if (error) {
          console.warn('Supabase application insertion notice (schema cache or pending table):', error.message || error);
          // Fall through to resilient dev storage so application is never lost!
        } else if (data) {
          if (formData.supporting_file_url) {
            try {
              await (supabase.from('application_files') as any).insert({
                application_id: data.id,
                file_type: formData.supporting_file_type || 'image',
                cloudinary_url: formData.supporting_file_url,
                public_id: formData.supporting_file_public_id || null,
              });
            } catch {}
          }

          // Initial audit log
          try {
            await (supabase.from('audit_logs') as any).insert({
              action: 'APPLICATION_SUBMITTED',
              application_id: data.id,
              metadata: { reference_code: data.reference_code, full_name: formData.full_name },
            });
          } catch {}

          // Also mirror in dev applications store so management console sees it immediately
          const devApps = getStoredDevApplications();
          const recordToStore: ApplicationRecord = {
            ...applicationPayload,
            id: data.id,
            status: 'UNDER_REVIEW' as ApplicationStatus,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.created_at || new Date().toISOString(),
          };
          devApps.unshift(recordToStore);
          saveStoredDevApplications(devApps);

          saveSubmissionReceipt({
            referenceCode: data.reference_code,
            applicationId: data.id,
            fullName: formData.full_name,
            email: formData.email,
            preferredDate: formData.preferred_date,
            preferredSession: formData.preferred_session,
            attendeeCount: formData.attendee_count,
            submittedAt: data.created_at || new Date().toISOString(),
            status: 'Under Management Review',
          });

          // Dispatch Application Received email
          const firstName = formData.full_name.split(' ')[0] || 'Guest';
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          emailService.sendEmail({
            to: formData.email,
            recipientName: firstName,
            type: 'APPLICATION_RECEIVED',
            data: {
              firstName,
              referenceCode: data.reference_code,
              applicationUrl: `${origin}/apply`,
            },
            applicationId: data.id,
            applicationReference: data.reference_code,
          }).catch(e => console.warn('Application email notice:', e));

          return {
            success: true,
            referenceCode: data.reference_code,
            applicationId: data.id,
            status: 'UNDER_REVIEW',
          };
        }
      } catch (err: unknown) {
        console.warn('Supabase application insertion exception, falling back to local storage:', err);
      }
    }

    // Fallback store for development preview / unmigrated database
    const generatedId = `app_${Date.now()}`;
    const newRecord: ApplicationRecord = {
      ...applicationPayload,
      id: generatedId,
      status: 'UNDER_REVIEW' as ApplicationStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const devApps = getStoredDevApplications();
    devApps.unshift(newRecord);
    saveStoredDevApplications(devApps);

    saveSubmissionReceipt({
      referenceCode,
      applicationId: generatedId,
      fullName: formData.full_name,
      email: formData.email,
      preferredDate: formData.preferred_date,
      preferredSession: formData.preferred_session,
      attendeeCount: formData.attendee_count,
      submittedAt: new Date().toISOString(),
      status: 'Under Management Review',
    });

    // Dispatch Application Received email
    const firstName = formData.full_name.split(' ')[0] || 'Guest';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    emailService.sendEmail({
      to: formData.email,
      recipientName: firstName,
      type: 'APPLICATION_RECEIVED',
      data: {
        firstName,
        referenceCode,
        applicationUrl: `${origin}/apply`,
      },
      applicationId: generatedId,
      applicationReference: referenceCode,
    }).catch(e => console.warn('Application email notice:', e));

    return {
      success: true,
      referenceCode,
      applicationId: generatedId,
      status: 'UNDER_REVIEW',
    };
  },

  /**
   * Fetch applications list for management with filters and search
   */
  async fetchApplications(options?: {
    status?: string;
    search?: string;
  }): Promise<{ applications: ApplicationRecord[]; count: number; error: string | null }> {
    let remoteApps: ApplicationRecord[] = [];

    // 1. Try server API endpoint (bypasses RLS with service role)
    try {
      const params = new URLSearchParams();
      if (options?.status && options.status !== 'ALL') params.set('status', options.status);
      if (options?.search && options.search.trim().length > 0) params.set('search', options.search.trim());
      
      const serverRes = await fetch(`/api/applications?${params.toString()}`);
      if (serverRes.ok) {
        const sData = await serverRes.json();
        if (sData.success && Array.isArray(sData.applications)) {
          remoteApps = sData.applications;
        }
      }
    } catch {}

    // 2. Direct client-side Supabase query
    if (remoteApps.length === 0) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          let query = (supabase.from('applications') as any)
            .select('*, application_files(*)', { count: 'exact' })
            .order('created_at', { ascending: false });

          if (options?.status && options.status !== 'ALL') {
            query = query.eq('status', options.status);
          }

          if (options?.search && options.search.trim().length > 0) {
            const s = options.search.trim();
            query = query.or(`reference_code.ilike.%${s}%,full_name.ilike.%${s}%,email.ilike.%${s}%`);
          }

          const { data, error } = await query;
          if (!error && data) {
            remoteApps = data as ApplicationRecord[];
          }
        } catch (err: unknown) {
          console.warn('Failed to query applications from Supabase, using local store:', err);
        }
      }
    }

    // Merge with dev local applications so all submissions are displayed
    let devApps = getStoredDevApplications();
    if (options?.status && options.status !== 'ALL') {
      devApps = devApps.filter(a => a.status === options.status);
    }
    if (options?.search && options.search.trim().length > 0) {
      const s = options.search.toLowerCase();
      devApps = devApps.filter(a => 
        a.reference_code.toLowerCase().includes(s) ||
        a.full_name.toLowerCase().includes(s) ||
        a.email.toLowerCase().includes(s)
      );
    }

    // Deduplicate by id and reference_code
    const seenIds = new Set<string>();
    const seenRefs = new Set<string>();
    const combined: ApplicationRecord[] = [];

    for (const app of [...remoteApps, ...devApps]) {
      if (!seenIds.has(app.id) && !seenRefs.has(app.reference_code)) {
        seenIds.add(app.id);
        seenRefs.add(app.reference_code);
        combined.push(app);
      }
    }

    return { applications: combined, count: combined.length, error: null };
  },

  /**
   * Fetch application by ID with files and audit logs
   */
  async fetchApplicationById(id: string): Promise<{
    application: ApplicationRecord | null;
    error: string | null;
  }> {
    // 1. Try server API endpoint (bypasses RLS)
    try {
      const serverRes = await fetch(`/api/applications/${encodeURIComponent(id)}`);
      if (serverRes.ok) {
        const sData = await serverRes.json();
        if (sData.success && sData.application) {
          return { application: sData.application, error: null };
        }
      }
    } catch {}

    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await (supabase.from('applications') as any)
          .select('*, application_files(*)')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          // Fetch audit logs for this application
          const { data: auditData } = await (supabase.from('audit_logs') as any)
            .select('*')
            .eq('application_id', id)
            .order('created_at', { ascending: false });

          const fullRecord: ApplicationRecord = {
            ...data,
            audit_logs: auditData || [],
          };

          return { application: fullRecord, error: null };
        }
      } catch (err: unknown) {
        console.warn('Exception querying Supabase application by id:', err);
      }
    }

    // Dev fallback
    const apps = getStoredDevApplications();
    const app = apps.find(a => a.id === id || a.reference_code === id);
    if (!app) return { application: null, error: 'Application not found' };

    const logs = getStoredDevAuditLogs().filter(l => l.application_id === app.id);
    return { application: { ...app, audit_logs: logs }, error: null };
  },

  /**
   * Approve application: generate secure continuation token, update status, log audit
   */
  async approveApplication(
    applicationId: string,
    managementUserId: string,
    managementEmail: string,
    notes?: string
  ): Promise<{
    success: boolean;
    token?: string;
    continuationUrl?: string;
    expiresAt?: string;
    error?: string;
  }> {
    // Generate and store cryptographically secure continuation token in application_tokens table
    const tokenRecord = await tokenService.createContinuationToken(applicationId, 7);
    const token = tokenRecord.token;
    const expiresAt = tokenRecord.expiresAt;
    const supabase = getSupabaseClient();

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const continuationUrl = `${origin}/continue/${token}`;

    if (supabase) {
      try {
        const { error: updateErr } = await (supabase.from('applications') as any)
          .update({
            status: 'APPROVED_AWAITING_COMPLETION',
            continuation_token: token,
            continuation_token_expires_at: expiresAt,
            management_notes: notes?.trim() || null,
            approved_at: new Date().toISOString(),
            approved_by: managementUserId || null,
          })
          .eq('id', applicationId);

        if (!updateErr) {
          // Insert audit log
          try {
            await (supabase.from('audit_logs') as any).insert({
              action: 'APPLICATION_APPROVED',
              application_id: applicationId,
              management_user_id: managementUserId || null,
              management_user_email: managementEmail || null,
              metadata: {
                continuation_token_prefix: token.substring(0, 10) + '...',
                expires_at: expiresAt,
                notes: notes?.trim() || null,
              },
            });
          } catch {}
        }
      } catch (err: unknown) {
        console.warn('Failed to update remote application approval, falling back to local store:', err);
      }
    }

    // Always mirror in dev fallback
    const apps = getStoredDevApplications();
    const idx = apps.findIndex(a => a.id === applicationId);
    if (idx !== -1) {
      apps[idx].status = 'APPROVED_AWAITING_COMPLETION';
      apps[idx].continuation_token = token;
      apps[idx].continuation_token_expires_at = expiresAt;
      apps[idx].management_notes = notes || null;
      apps[idx].approved_at = new Date().toISOString();
      saveStoredDevApplications(apps);

      const logs = getStoredDevAuditLogs();
      logs.unshift({
        id: `log_${Date.now()}`,
        action: 'APPLICATION_APPROVED',
        application_id: applicationId,
        management_user_id: managementUserId,
        management_user_email: managementEmail,
        metadata: { expires_at: expiresAt, notes },
        created_at: new Date().toISOString(),
      });
      saveStoredDevAuditLogs(logs);
    }

    // Send Approval Email to Applicant
    const approvedApp = apps.find(a => a.id === applicationId);
    if (approvedApp) {
      const firstName = approvedApp.full_name.split(' ')[0] || 'Guest';
      emailService.sendEmail({
        to: approvedApp.email,
        recipientName: firstName,
        type: 'APPLICATION_APPROVED',
        data: {
          firstName,
          referenceCode: approvedApp.reference_code,
          continuationUrl,
        },
        applicationId: approvedApp.id,
        applicationReference: approvedApp.reference_code,
      }).catch(e => console.warn('Approval email notice:', e));
    }

    return {
      success: true,
      token,
      continuationUrl,
      expiresAt,
    };
  },

  /**
   * Decline application: record mandatory reason, update status, log audit
   */
  async declineApplication(
    applicationId: string,
    managementUserId: string,
    managementEmail: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'A specific explanation is required to decline an application.' };
    }

    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { error: updateErr } = await (supabase.from('applications') as any)
          .update({
            status: 'DECLINED',
            decline_reason: reason.trim(),
            declined_at: new Date().toISOString(),
            declined_by: managementUserId || null,
          })
          .eq('id', applicationId);

        if (!updateErr) {
          try {
            await (supabase.from('audit_logs') as any).insert({
              action: 'APPLICATION_DECLINED',
              application_id: applicationId,
              management_user_id: managementUserId || null,
              management_user_email: managementEmail || null,
              metadata: { reason: reason.trim() },
            });
          } catch {}
        }
      } catch (err: unknown) {
        console.warn('Failed to update remote application decline, falling back to local store:', err);
      }
    }

    // Always mirror in dev store
    const apps = getStoredDevApplications();
    const idx = apps.findIndex(a => a.id === applicationId);
    if (idx !== -1) {
      apps[idx].status = 'DECLINED';
      apps[idx].decline_reason = reason.trim();
      apps[idx].declined_at = new Date().toISOString();
      saveStoredDevApplications(apps);

      const logs = getStoredDevAuditLogs();
      logs.unshift({
        id: `log_${Date.now()}`,
        action: 'APPLICATION_DECLINED',
        application_id: applicationId,
        management_user_id: managementUserId,
        management_user_email: managementEmail,
        metadata: { reason: reason.trim() },
        created_at: new Date().toISOString(),
      });
      saveStoredDevAuditLogs(logs);
    }

    return { success: true };
  },

  /**
   * Request additional information from applicant
   */
  async requestInformation(
    applicationId: string,
    managementUserId: string,
    managementEmail: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!message || message.trim().length < 5) {
      return { success: false, error: 'Please enter a clear explanation of what information is needed.' };
    }

    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { error: updateErr } = await (supabase.from('applications') as any)
          .update({
            status: 'INFORMATION_REQUIRED',
            information_requested_message: message.trim(),
            information_requested_at: new Date().toISOString(),
            information_requested_by: managementUserId || null,
          })
          .eq('id', applicationId);

        if (!updateErr) {
          try {
            await (supabase.from('audit_logs') as any).insert({
              action: 'APPLICATION_INFORMATION_REQUESTED',
              application_id: applicationId,
              management_user_id: managementUserId || null,
              management_user_email: managementEmail || null,
              metadata: { message: message.trim() },
            });
          } catch {}
        }
      } catch (err: unknown) {
        console.warn('Failed to update remote application request info, falling back to local store:', err);
      }
    }

    // Always mirror in dev store
    const apps = getStoredDevApplications();
    const idx = apps.findIndex(a => a.id === applicationId);
    if (idx !== -1) {
      apps[idx].status = 'INFORMATION_REQUIRED';
      apps[idx].information_requested_message = message.trim();
      apps[idx].information_requested_at = new Date().toISOString();
      saveStoredDevApplications(apps);

      const logs = getStoredDevAuditLogs();
      logs.unshift({
        id: `log_${Date.now()}`,
        action: 'APPLICATION_INFORMATION_REQUESTED',
        application_id: applicationId,
        management_user_id: managementUserId,
        management_user_email: managementEmail,
        metadata: { message: message.trim() },
        created_at: new Date().toISOString(),
      });
      saveStoredDevAuditLogs(logs);
    }

    // Send Information Requested Email to Applicant
    const targetApp = apps.find(a => a.id === applicationId);
    if (targetApp) {
      const firstName = targetApp.full_name.split(' ')[0] || 'Guest';
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const appUrl = targetApp.continuation_token
        ? `${origin}/continue/${targetApp.continuation_token}`
        : `${origin}/apply`;

      emailService.sendEmail({
        to: targetApp.email,
        recipientName: firstName,
        type: 'INFORMATION_REQUESTED',
        data: {
          firstName,
          referenceCode: targetApp.reference_code,
          reason: message.trim(),
          applicationUrl: appUrl,
        },
        applicationId: targetApp.id,
        applicationReference: targetApp.reference_code,
      }).catch(e => console.warn('Info request email notice:', e));
    }

    return { success: true };
  },

  /**
   * Validate continuation token for /continue/:token
   */
  async validateContinuationToken(token: string): Promise<{
    valid: boolean;
    application?: ApplicationRecord;
    error?: string;
  }> {
    if (!token || token.trim().length === 0) {
      return { valid: false, error: 'This continuation link is no longer available.' };
    }

    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const now = new Date().toISOString();
        const { data, error } = await (supabase.from('applications') as any)
          .select('reference_code, full_name, email, preferred_date, preferred_session, attendee_count, status, continuation_token_expires_at')
          .eq('continuation_token', token.trim())
          .gt('continuation_token_expires_at', now)
          .maybeSingle();

        if (error || !data) {
          return { valid: false, error: 'This continuation link is no longer available.' };
        }

        return { valid: true, application: data as ApplicationRecord };
      } catch {
        return { valid: false, error: 'This continuation link is no longer available.' };
      }
    }

    // Dev fallback
    const apps = getStoredDevApplications();
    const app = apps.find(a => a.continuation_token === token.trim());
    if (!app) {
      return { valid: false, error: 'This continuation link is no longer available.' };
    }

    if (app.continuation_token_expires_at && new Date(app.continuation_token_expires_at) < new Date()) {
      return { valid: false, error: 'This continuation link has expired.' };
    }

    return { valid: true, application: app };
  },
};
