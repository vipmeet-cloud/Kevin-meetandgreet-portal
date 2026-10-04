import { getSupabase } from '../lib/supabase';
import { ManagementRole, ManagementUser } from '../types';

export interface ManagementVerificationResult {
  isAuthorized: boolean;
  role: ManagementRole | null;
  managementUser: ManagementUser | null;
  error: string | null;
}

export const managementService = {
  /**
   * Verify whether the authenticated user has an active management role in Supabase.
   * Never trusts client-side assertions; directly queries the management_users table
   * protected by Row-Level Security and calls the backend role verification route if active.
   */
  async verifyManagementAccess(userId: string): Promise<ManagementVerificationResult> {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        isAuthorized: false,
        role: null,
        managementUser: null,
        error: 'Database connection unconfigured.',
      };
    }

    try {
      // 1. Attempt server-side verification first if available
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          const resp = await fetch('/api/management/verify-role', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (resp.ok) {
            const serverData = await resp.json();
            if (serverData.isAuthorized) {
              return {
                isAuthorized: true,
                role: serverData.role,
                managementUser: serverData.managementUser,
                error: null,
              };
            }
          }
        }
      } catch {
        // Fall back to direct Supabase RLS query if server route is in dev mode
      }

      // 2. Query management_users table directly using Supabase client with user's JWT
      const { data, error } = await supabase
        .from('management_users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Management authorization query error:', error);
        return {
          isAuthorized: false,
          role: null,
          managementUser: null,
          error: 'Unable to verify management credentials. Please contact system administrator.',
        };
      }

      if (!data) {
        return {
          isAuthorized: false,
          role: null,
          managementUser: null,
          error: 'Your account is not authorized for management access. Please contact an administrator.',
        };
      }

      return {
        isAuthorized: true,
        role: data.role as ManagementRole,
        managementUser: data as ManagementUser,
        error: null,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to verify management role.';
      return {
        isAuthorized: false,
        role: null,
        managementUser: null,
        error: msg,
      };
    }
  },

  /**
   * Determine if a role has permission to update celebrity/event configuration
   */
  canModifySettings(role: ManagementRole | null): boolean {
    if (!role) return false;
    return role === 'administrator' || role === 'manager';
  },

  /**
   * Determine if a role has full administration permissions
   */
  isAdministrator(role: ManagementRole | null): boolean {
    return role === 'administrator';
  },
};
