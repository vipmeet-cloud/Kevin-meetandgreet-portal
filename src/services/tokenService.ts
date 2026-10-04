import { getSupabaseClient } from './supabase';
import { ApplicationRecord } from '../types/application';

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token.trim());
  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Simple fallback hash for environments without WebCrypto subtle
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}_${token.length}`;
}

export function generateSecureContinuationToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(28);
    window.crypto.getRandomValues(array);
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `sec_vip_${hex}`;
  }
  return `sec_vip_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

const DEV_TOKENS_KEY = 'aura_vip_dev_tokens';

interface StoredToken {
  id: string;
  application_id: string;
  raw_token: string;
  token_hash: string;
  token_type: string;
  expires_at: string;
  revoked_at?: string | null;
  created_at: string;
  last_used_at?: string | null;
}

function getStoredDevTokens(): StoredToken[] {
  try {
    const raw = localStorage.getItem(DEV_TOKENS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveStoredDevTokens(tokens: StoredToken[]) {
  try {
    localStorage.setItem(DEV_TOKENS_KEY, JSON.stringify(tokens));
  } catch {}
}

export const tokenService = {
  /**
   * Create and store a secure continuation token for an application
   */
  async createContinuationToken(
    applicationId: string,
    expiresInDays = 7
  ): Promise<{ token: string; expiresAt: string; error?: string }> {
    const rawToken = generateSecureContinuationToken();
    const tokenHash = await hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        // Revoke any previous active tokens for this application
        await (supabase.from('application_tokens') as any)
          .update({ revoked_at: new Date().toISOString() })
          .eq('application_id', applicationId)
          .is('revoked_at', null);

        // Insert new token record
        await (supabase.from('application_tokens') as any).insert({
          application_id: applicationId,
          token_hash: tokenHash,
          token_type: 'CONTINUATION',
          expires_at: expiresAt,
        });

        // Update application record with active token and expiration
        await (supabase.from('applications') as any)
          .update({
            continuation_token: rawToken,
            continuation_token_expires_at: expiresAt,
          })
          .eq('id', applicationId);

        return { token: rawToken, expiresAt };
      } catch (err: unknown) {
        console.warn('Supabase application_tokens update warning, using fallback token storage:', err);
      }
    }

    // Dev fallback
    const tokens = getStoredDevTokens();
    tokens.push({
      id: `tok_${Date.now()}`,
      application_id: applicationId,
      raw_token: rawToken,
      token_hash: tokenHash,
      token_type: 'CONTINUATION',
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });
    saveStoredDevTokens(tokens);

    return { token: rawToken, expiresAt };
  },

  /**
   * Validate continuation token server-side / securely
   */
  async validateContinuationToken(token: string): Promise<{
    valid: boolean;
    application?: ApplicationRecord;
    error?: string;
  }> {
    if (!token || token.trim().length === 0) {
      return { valid: false, error: 'This continuation link is no longer available.' };
    }

    const cleanToken = token.trim();
    const tokenHash = await hashToken(cleanToken);
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const now = new Date().toISOString();

        // 1. Check application_tokens by hash or fallback to direct continuation_token check
        const { data: tokenRecord } = await (supabase.from('application_tokens') as any)
          .select('application_id, expires_at, revoked_at')
          .eq('token_hash', tokenHash)
          .is('revoked_at', null)
          .gt('expires_at', now)
          .maybeSingle();

        let appId = tokenRecord?.application_id;

        // 2. Query application record
        let appQuery = (supabase.from('applications') as any)
          .select('*');

        if (appId) {
          appQuery = appQuery.eq('id', appId);
        } else {
          appQuery = appQuery
            .eq('continuation_token', cleanToken)
            .gt('continuation_token_expires_at', now);
        }

        const { data: appData, error: appErr } = await appQuery.maybeSingle();

        if (!appErr && appData) {
          // Must be in an approved / active workflow state
          const validStatuses = [
            'APPROVED_AWAITING_COMPLETION',
            'APPROVED',
            'PAYMENT_SUBMITTED',
            'PAYMENT_UNDER_REVIEW',
            'PAYMENT_CONFIRMED_AWAITING_PASS',
            'PAYMENT_REJECTED',
            'PAYMENT_CLARIFICATION_REQUIRED',
          ];

          if (!validStatuses.includes(appData.status)) {
            return { valid: false, error: 'This continuation link is no longer available.' };
          }

          // Update last_used_at on token record
          try {
            await (supabase.from('application_tokens') as any)
              .update({ last_used_at: new Date().toISOString() })
              .eq('token_hash', tokenHash);
          } catch {}

          return { valid: true, application: appData as ApplicationRecord };
        }
      } catch (err: unknown) {
        console.warn('Supabase token query exception, checking local storage:', err);
      }
    }

    // Dev fallback
    const tokens = getStoredDevTokens();
    const tokenRec = tokens.find(t => t.raw_token === cleanToken || t.token_hash === tokenHash);
    
    // Check localStorage dev applications
    try {
      const rawApps = localStorage.getItem('aura_vip_dev_applications');
      if (rawApps) {
        const apps: ApplicationRecord[] = JSON.parse(rawApps);
        const app = apps.find(a => 
          (tokenRec && a.id === tokenRec.application_id) || 
          a.continuation_token === cleanToken
        );

        if (app) {
          if (app.continuation_token_expires_at && new Date(app.continuation_token_expires_at) < new Date()) {
            return { valid: false, error: 'This continuation link is no longer available.' };
          }
          return { valid: true, application: app };
        }
      }
    } catch {}

    return { valid: false, error: 'This continuation link is no longer available.' };
  },
};
