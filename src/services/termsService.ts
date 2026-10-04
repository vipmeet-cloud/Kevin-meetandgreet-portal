import { getSupabase } from '../lib/supabase';
import { TermsVersion, PrivacyVersion } from '../types';

const DEFAULT_TERMS: TermsVersion = {
  id: 'default-terms',
  version: '1.0',
  title: 'VIP Meet & Greet Event Terms & Conditions',
  effective_date: new Date().toISOString().split('T')[0],
  is_current: true,
  content: `1. ELIGIBILITY & SCREENING
All prospective attendees must submit an official verification request. Submission of an application does not guarantee approval. Management reserves the sole right to approve or decline any attendee at their absolute discretion.

2. NON-TRANSFERABLE PASSES
Approved VIP credentials are strictly personal, non-transferable, and tied exclusively to the verified individual’s government-issued identification. Any attempt to resell, transfer, or duplicate passes will result in immediate revocation and permanent ban.

3. CODE OF CONDUCT & EVENT PROTOCOLS
Attendees must adhere to all venue security protocols and respect celebrity privacy, event team instructions, and security guidelines. Intoxication, harassment, or failure to follow security personnel instructions will result in immediate escort from the premises without refund.

4. PHOTOGRAPHY & RECORDING POLICIES
Personal photography and filming within private salons are governed by specific celebrity event guidelines announced prior to entry. Professional filming equipment is prohibited unless authorized in writing by the management company.

5. RESERVATION OF RIGHTS & JURISDICTION
These terms serve as the operational guidelines of the event management company and are governed by applicable event venue jurisdiction. Management reserves the right to amend these guidelines as needed for security.`,
};

const DEFAULT_PRIVACY: PrivacyVersion = {
  id: 'default-privacy',
  version: '1.0',
  title: 'Official VIP Portal Privacy Policy',
  effective_date: new Date().toISOString().split('T')[0],
  is_current: true,
  content: `1. PURPOSE OF DATA COLLECTION
Information provided through this VIP portal is collected solely for the purposes of identity verification, security screening, attendee management, and official event communications.

2. RESTRICTED MANAGEMENT ACCESS
Access to applicant dossiers, identification documents, and personal contact details is restricted exclusively to authorized management personnel holding verified managerial roles.

3. STORAGE & SECURITY ARCHITECTURE
All records are stored using Supabase PostgreSQL databases with Row-Level Security (RLS) enforcement. Passwords and credentials are never stored in plain text.

4. THIRD-PARTY DISCLOSURE
We do not sell, rent, commercialize, or lease attendee personal data to third parties. Data is shared only with certified security personnel and venue authorities as strictly necessary for event admission and physical safety.

5. RETENTION & RECTIFICATION
Applicant records are retained only for the duration required to conduct the event and comply with legal audit requirements, after which records are archived or deleted in accordance with data protection regulations.`,
};

export const termsService = {
  /**
   * Fetch current active terms & conditions from Supabase
   */
  async fetchCurrentTerms(): Promise<{ terms: TermsVersion; error: string | null }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { terms: DEFAULT_TERMS, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('terms_versions')
        .select('*')
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { terms: DEFAULT_TERMS, error: null };
      }

      return { terms: data as TermsVersion, error: null };
    } catch {
      return { terms: DEFAULT_TERMS, error: null };
    }
  },

  /**
   * Fetch current active privacy policy from Supabase
   */
  async fetchCurrentPrivacy(): Promise<{ privacy: PrivacyVersion; error: string | null }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { privacy: DEFAULT_PRIVACY, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('privacy_versions')
        .select('*')
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { privacy: DEFAULT_PRIVACY, error: null };
      }

      return { privacy: data as PrivacyVersion, error: null };
    } catch {
      return { privacy: DEFAULT_PRIVACY, error: null };
    }
  },
};
