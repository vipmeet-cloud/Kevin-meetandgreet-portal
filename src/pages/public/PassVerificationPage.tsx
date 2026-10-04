import { useState, useEffect } from 'react';
import { useRouter } from '../../router/Router';
import { passService } from '../../services/passService';
import { useSettings } from '../../context/SettingsContext';
import { VipPassRecord } from '../../types/vipPass';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Building,
  Sparkles,
  Search
} from 'lucide-react';
import { Link } from '../../router/Router';

export function PassVerificationPage() {
  const { path } = useRouter();
  const { settings } = useSettings();

  const [token, setToken] = useState<string>('');
  const [manualToken, setManualToken] = useState('');
  const [pass, setPass] = useState<VipPassRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<string>('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let extracted = '';
    if (path.startsWith('/verify/')) {
      extracted = path.replace('/verify/', '').split('?')[0].split('#')[0];
    } else if (path.startsWith('/verify-pass/')) {
      extracted = path.replace('/verify-pass/', '').split('?')[0].split('#')[0];
    } else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      extracted = urlParams.get('token') || urlParams.get('id') || '';
    }

    setToken(extracted);
  }, [path]);

  const verifyPassToken = async (targetToken: string) => {
    if (!targetToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setNotFound(false);
    try {
      const res = await passService.fetchPassByToken(targetToken);
      setCheckedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (res.pass) {
        setPass(res.pass);
      } else {
        setPass(null);
        setNotFound(true);
      }
    } catch {
      setPass(null);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyPassToken(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      setToken(manualToken.trim());
    }
  };

  const celebrityName = pass?.celebrity_name || settings?.celebrity_name || 'Kevin Costner';

  return (
    <div className="min-h-[85vh] py-10 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Verification Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pass Verification</span>
          </div>
          <h1 className="text-2xl font-serif text-white font-medium mt-2">
            VIP Pass Verification
          </h1>
          <p className="text-xs text-slate-400">
            Official management check-in and clearance desk
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-10 rounded-3xl bg-[#121622] border border-white/[0.08] text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-300">Checking VIP Pass records...</p>
          </div>
        )}

        {/* Pass Found Result */}
        {!isLoading && pass && (
          <div className="rounded-3xl bg-[#121622] border border-white/[0.08] overflow-hidden shadow-2xl">
            {/* Status Hero Header */}
            {pass.status === 'VALID' && (
              <div className="p-6 bg-emerald-500/10 border-b border-emerald-500/20 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-emerald-400 uppercase tracking-wide">
                  Valid VIP Pass
                </h2>
                <p className="text-xs text-emerald-300">
                  Confirmed by Management · Admittance Approved
                </p>
              </div>
            )}

            {pass.status === 'REVOKED' && (
              <div className="p-6 bg-rose-500/10 border-b border-rose-500/20 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <XCircle className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-rose-400 uppercase tracking-wide">
                  Pass No Longer Valid
                </h2>
                <p className="text-xs text-rose-300">
                  {pass.revocation_reason || 'This pass has been cancelled by management. Entry is not permitted.'}
                </p>
              </div>
            )}

            {pass.status === 'EXPIRED' && (
              <div className="p-6 bg-amber-500/10 border-b border-amber-500/20 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-amber-400 uppercase tracking-wide">
                  VIP Pass Expired
                </h2>
                <p className="text-xs text-amber-300">
                  The scheduled date for this pass has passed.
                </p>
              </div>
            )}

            {/* Pass Verified Details */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-slate-400">Pass Number</span>
                <span className="font-mono text-sm font-bold text-white bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.08]">
                  {pass.pass_number}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-slate-400">Guest Name</span>
                <span className="text-sm font-semibold text-white">{pass.applicant_name}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-slate-400">Event</span>
                <span className="text-right text-slate-200 font-medium">
                  {celebrityName}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-slate-400">Scheduled Date</span>
                <span className="text-white font-medium">{pass.event_date}</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-slate-400">Session</span>
                <span className="text-white font-medium">{pass.session_time}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Check-in Verification</span>
                <span className="text-emerald-400 font-medium">Recorded at {checkedAt || 'Now'}</span>
              </div>
            </div>

            {/* Bottom note */}
            <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] text-center">
              <span className="text-[11px] text-slate-400">
                Staff must verify identity against a valid government photo ID upon arrival.
              </span>
            </div>
          </div>
        )}

        {/* Not Found or Search Form */}
        {!isLoading && (!pass || notFound) && (
          <div className="rounded-3xl bg-[#121622] border border-white/[0.08] p-6 space-y-5">
            {notFound && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                <h3 className="text-sm font-semibold text-amber-300">No Matching Pass Found</h3>
                <p className="text-xs text-amber-200/80">
                  The pass ID or QR code you submitted does not match any valid record.
                </p>
              </div>
            )}

            <form onSubmit={handleManualSearch} className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Enter Pass Number or Verification Token
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualToken}
                  onChange={e => setManualToken(e.target.value)}
                  placeholder="e.g. VIP-KC-XXXXX or vfy_..."
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                disabled={!manualToken.trim()}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#E5C07B] text-black font-semibold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer"
              >
                Verify Pass
              </button>
            </form>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Return to Event Home
          </Link>
        </div>
      </div>
    </div>
  );
}
