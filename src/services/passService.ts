import { getSupabaseClient } from './supabase';
import { VipPassRecord, PassStatus } from '../types/vipPass';
import { emailService } from './emailService';
import { applicationService } from './applicationService';
import { paymentService } from './paymentService';

const DEV_PASSES_KEY = 'aura_vip_dev_passes';

function getStoredDevPasses(): VipPassRecord[] {
  try {
    const raw = localStorage.getItem(DEV_PASSES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredDevPasses(passes: VipPassRecord[]) {
  try {
    localStorage.setItem(DEV_PASSES_KEY, JSON.stringify(passes));
  } catch {}
}

export function generatePassNumber(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let random = '';
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VIP-KC-${random}`;
}

export function generateVerificationToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `vfy_${hex}`;
  }
  return `vfy_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
}

export const passService = {
  /**
   * Generate a final VIP Pass after payment has been confirmed.
   */
  async generateVipPass(params: {
    applicationId: string;
    paymentId?: string | null;
  }): Promise<{ pass: VipPassRecord | null; error?: string }> {
    // 1. Fetch application details
    const appRes = await applicationService.fetchApplicationById(params.applicationId);
    if (!appRes.application) {
      return { pass: null, error: 'Application not found.' };
    }

    const app = appRes.application;

    // Check if a pass already exists for this application
    const existing = await this.fetchPassByApplicationId(params.applicationId);
    if (existing) {
      return { pass: existing };
    }

    const passNumber = generatePassNumber();
    const verificationToken = generateVerificationToken();
    const passId = `PASS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
    const nowIso = new Date().toISOString();

    const passRecord: VipPassRecord = {
      id: passId,
      pass_number: passNumber,
      application_id: app.id,
      payment_id: params.paymentId || null,
      verification_token: verificationToken,
      applicant_name: app.full_name,
      celebrity_name: 'Kevin Costner',
      event_name: 'Exclusive VIP Private Audience & Reception',
      event_date: app.preferred_date || '2026-11-14',
      session_time: app.preferred_session || 'Afternoon (2:00 PM)',
      attendee_count: app.attendee_count || 1,
      status: 'VALID',
      revocation_reason: null,
      revoked_at: null,
      revoked_by: null,
      issued_at: nowIso,
      expires_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await (supabase.from('vip_passes') as any).insert({
          id: passRecord.id,
          pass_number: passRecord.pass_number,
          application_id: passRecord.application_id,
          payment_id: passRecord.payment_id,
          verification_token: passRecord.verification_token,
          applicant_name: passRecord.applicant_name,
          celebrity_name: passRecord.celebrity_name,
          event_name: passRecord.event_name,
          event_date: passRecord.event_date,
          session_time: passRecord.session_time,
          attendee_count: passRecord.attendee_count,
          status: 'VALID',
          issued_at: passRecord.issued_at,
        });

        // Log audit
        try {
          await (supabase.from('audit_logs') as any).insert({
            application_id: app.id,
            action: 'VIP_PASS_GENERATED',
            metadata: { pass_number: passNumber, verification_token: verificationToken },
          });
        } catch {}
      } catch (err: unknown) {
        console.warn('Supabase pass insert notice, using local store:', err);
      }
    }

    // Always maintain dev local record
    const devPasses = getStoredDevPasses();
    devPasses.unshift(passRecord);
    saveStoredDevPasses(devPasses);

    // Send "VIP Pass is ready" email to applicant
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const passUrl = `${origin}/vip-pass/${verificationToken}`;

    const firstName = app.full_name.split(' ')[0] || 'Guest';

    emailService.sendEmail({
      to: app.email,
      recipientName: firstName,
      type: 'VIP_PASS_READY',
      data: {
        firstName,
        passId: passNumber,
        passUrl,
        referenceCode: app.reference_code,
      },
      applicationId: app.id,
      applicationReference: app.reference_code,
    }).catch(e => console.warn('Pass email dispatch notice:', e));

    return { pass: passRecord };
  },

  /**
   * Fetch all passes for management review
   */
  async fetchPasses(options?: {
    status?: string;
    search?: string;
  }): Promise<{ passes: VipPassRecord[]; error?: string }> {
    let remotePasses: VipPassRecord[] = [];
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        let query = (supabase.from('vip_passes') as any)
          .select('*')
          .order('issued_at', { ascending: false });

        if (options?.status && options.status !== 'ALL') {
          query = query.eq('status', options.status);
        }

        const { data, error } = await query;
        if (!error && data) {
          remotePasses = data as VipPassRecord[];
        }
      } catch {}
    }

    let devPasses = getStoredDevPasses();
    if (options?.status && options.status !== 'ALL') {
      devPasses = devPasses.filter(p => p.status === options.status);
    }
    if (options?.search && options.search.trim().length > 0) {
      const q = options.search.toLowerCase().trim();
      devPasses = devPasses.filter(p =>
        p.pass_number.toLowerCase().includes(q) ||
        p.applicant_name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }

    // Deduplicate
    const seen = new Set<string>();
    const combined: VipPassRecord[] = [];

    for (const p of [...remotePasses, ...devPasses]) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        combined.push(p);
      }
    }

    return { passes: combined };
  },

  /**
   * Fetch a single pass by verification token or ID
   */
  async fetchPassByToken(token: string): Promise<{ pass: VipPassRecord | null; error?: string }> {
    if (!token) return { pass: null, error: 'This link has expired.' };
    const clean = token.trim();

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from('vip_passes') as any)
          .select('*')
          .or(`verification_token.eq.${clean},id.eq.${clean},pass_number.eq.${clean}`)
          .maybeSingle();

        if (!error && data) {
          const pass = data as VipPassRecord;
          // Check expiration
          if (pass.expires_at && new Date(pass.expires_at) < new Date() && pass.status === 'VALID') {
            pass.status = 'EXPIRED';
          }
          return { pass };
        }
      } catch {}
    }

    const devPasses = getStoredDevPasses();
    const found = devPasses.find(p =>
      p.verification_token === clean || p.id === clean || p.pass_number === clean
    );

    if (found) {
      if (found.expires_at && new Date(found.expires_at) < new Date() && found.status === 'VALID') {
        found.status = 'EXPIRED';
      }
      return { pass: found };
    }

    return { pass: null, error: 'Pass not found' };
  },

  /**
   * Fetch pass for a given application ID
   */
  async fetchPassByApplicationId(applicationId: string): Promise<VipPassRecord | null> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await (supabase.from('vip_passes') as any)
          .select('*')
          .eq('application_id', applicationId)
          .maybeSingle();

        if (!error && data) return data as VipPassRecord;
      } catch {}
    }

    const devPasses = getStoredDevPasses();
    return devPasses.find(p => p.application_id === applicationId) || null;
  },

  /**
   * Revoke a VIP Pass
   */
  async revokePass(
    passId: string,
    reason: string,
    managementUserId?: string,
    managementEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!reason || reason.trim().length < 3) {
      return { success: false, error: 'Please enter a reason for revoking this pass.' };
    }

    const nowIso = new Date().toISOString();
    const cleanReason = reason.trim();
    const supabase = getSupabaseClient();

    let targetPass: VipPassRecord | null = null;

    if (supabase) {
      try {
        const { data: updated, error } = await (supabase.from('vip_passes') as any)
          .update({
            status: 'REVOKED',
            revocation_reason: cleanReason,
            revoked_at: nowIso,
            revoked_by: managementUserId || null,
            updated_at: nowIso,
          })
          .eq('id', passId)
          .select('*')
          .maybeSingle();

        if (updated) {
          targetPass = updated as VipPassRecord;
        }

        // Log audit
        try {
          await (supabase.from('audit_logs') as any).insert({
            action: 'VIP_PASS_REVOKED',
            metadata: { pass_id: passId, reason: cleanReason },
            management_user_id: managementUserId || null,
            management_user_email: managementEmail || null,
          });
        } catch {}
      } catch (err: unknown) {
        console.warn('Supabase pass revoke notice, using local store:', err);
      }
    }

    // Dev fallback
    const devPasses = getStoredDevPasses();
    const idx = devPasses.findIndex(p => p.id === passId || p.pass_number === passId);
    if (idx !== -1) {
      devPasses[idx].status = 'REVOKED';
      devPasses[idx].revocation_reason = cleanReason;
      devPasses[idx].revoked_at = nowIso;
      devPasses[idx].revoked_by = managementUserId || 'management';
      devPasses[idx].updated_at = nowIso;
      targetPass = devPasses[idx];
      saveStoredDevPasses(devPasses);
    }

    // Send "VIP Pass Revoked" email to applicant
    if (targetPass) {
      const appRes = await applicationService.fetchApplicationById(targetPass.application_id);
      if (appRes.application) {
        const firstName = appRes.application.full_name.split(' ')[0] || 'Guest';
        emailService.sendEmail({
          to: appRes.application.email,
          recipientName: firstName,
          type: 'VIP_PASS_REVOKED',
          data: {
            firstName,
            passId: targetPass.pass_number,
            reason: cleanReason,
            referenceCode: appRes.application.reference_code,
          },
          applicationId: appRes.application.id,
          applicationReference: appRes.application.reference_code,
        }).catch(e => console.warn('Revoke email dispatch notice:', e));
      }
    }

    return { success: true };
  },
};
