import { getSupabaseClient } from './supabase';

export interface TermsData {
  id: string;
  version: string;
  title: string;
  content: string;
  effective_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchCurrentTerms(): Promise<{ data: TermsData | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      data: {
        id: 'default-terms',
        version: '1.0',
        title: 'VIP Meet & Greet Terms of Participation',
        content: `1. APPLICATION & SELECTION
Submission of an application does not guarantee attendance. All applicants undergo private background and identity verification by authorized celebrity management. Management reserves exclusive discretion to accept, defer, or decline applications without requirement of public explanation.

2. PRIVATE SECURITY & VENUE PROTOCOLS
Due to high-profile security protocols, exact private venue coordinates and reporting schedules are provided strictly to confirmed VIP guests following management credential verification. Unauthorized recording devices, weapons, and unregistered guests are strictly prohibited.

3. TRANSFERS & NON-RESALE POLICY
VIP Meet & Greet invitations and credentials are strictly personal, non-transferable, and non-resaleable. Any attempt to auction, transfer, or counterfeit VIP credentials results in immediate nullification and venue exclusion.

4. CANCELLATION & SCHEDULING CONTINGENCIES
In the event of unforeseen celebrity touring, production, or health exigencies, the management team will provide timely rescheduled dates or official notifications through official contact channels.`,
        effective_date: '2026-10-01',
        is_current: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null
    };
  }

  try {
    const { data, error } = await supabase
      .from('terms_versions')
      .select('*')
      .eq('is_current', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      // Fallback to official structured baseline
      return {
        data: {
          id: 'baseline-terms',
          version: '1.0',
          title: 'VIP Meet & Greet Terms of Participation',
          content: 'VIP Meet & Greet applications are reviewed by authorized management. Applications do not guarantee attendance. Exact schedule and private security instructions will be issued upon official verification.',
          effective_date: '2026-10-01',
          is_current: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null
      };
    }

    return { data: data as TermsData, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error loading terms';
    return { data: null, error: message };
  }
}
