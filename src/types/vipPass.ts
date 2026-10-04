export type PassStatus = 'VALID' | 'REVOKED' | 'EXPIRED' | 'USED';

export interface VipPassRecord {
  id: string;
  pass_number: string;
  application_id: string;
  payment_id?: string | null;
  verification_token: string;
  applicant_name: string;
  celebrity_name: string;
  event_name: string;
  event_date: string;
  session_time: string;
  attendee_count: number;
  status: PassStatus;
  revocation_reason?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
  issued_at: string;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export function getPassStatusDisplay(status: PassStatus): {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
} {
  switch (status) {
    case 'VALID':
      return {
        label: 'Valid',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/25',
      };
    case 'REVOKED':
      return {
        label: 'No Longer Valid',
        colorClass: 'text-rose-400',
        bgClass: 'bg-rose-500/10',
        borderClass: 'border-rose-500/25',
      };
    case 'EXPIRED':
      return {
        label: 'Expired',
        colorClass: 'text-amber-400',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/25',
      };
    case 'USED':
      return {
        label: 'Already Used',
        colorClass: 'text-slate-400',
        bgClass: 'bg-slate-500/10',
        borderClass: 'border-slate-500/25',
      };
    default:
      return {
        label: 'No Longer Valid',
        colorClass: 'text-slate-400',
        bgClass: 'bg-slate-500/10',
        borderClass: 'border-slate-500/25',
      };
  }
}
