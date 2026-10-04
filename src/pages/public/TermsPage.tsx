import { useState, useEffect } from 'react';
import { Link } from '../../router/Router';
import { fetchCurrentTerms, TermsData } from '../../services/terms';
import { useSettings } from '../../context/SettingsContext';
import { FileText, Shield, ArrowLeft } from 'lucide-react';

export function TermsPage() {
  const { settings } = useSettings();
  const [terms, setTerms] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTerms() {
      setLoading(true);
      const { data } = await fetchCurrentTerms();
      setTerms(data);
      setLoading(false);
    }
    loadTerms();
  }, []);

  const eventName = settings?.event_name || 'VIP Meet & Greet Event';
  const celebrityName = settings?.celebrity_name || 'The Principal Celebrity';

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37] hover:text-[#E5C07B] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="space-y-4 mb-10 pb-8 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
            <FileText className="w-4 h-4" />
            <span>Guidelines & Terms</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif text-white font-medium tracking-tight">
            Terms of Service
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>Version {terms?.version || '1.0'}</span>
            <span aria-hidden="true">·</span>
            <span>Effective Date: {terms?.effective_date || '2026-10-01'}</span>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-6 sm:p-10 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-8">
          
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed flex items-start gap-3">
            <Shield className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Important Notice: </span>
              These terms apply to VIP attendee entry for {eventName} with {celebrityName}. Venue rules and safety checks apply. Final admission is subject to review and confirmation by management.
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 py-8 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading terms...</span>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-sm text-slate-300 space-y-6 leading-relaxed">
              <section className="space-y-2">
                <h3 className="text-base font-serif text-white font-semibold">
                  1. VIP Meet & Greet Access
                </h3>
                <p>
                  VIP Meet & Greet access is a special, private guest experience. Entry is granted individually after review. Applying through this website does not guarantee acceptance or a scheduled meeting.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-serif text-white font-semibold">
                  2. ID & Entry Requirements
                </h3>
                <p>
                  Management and venue staff check attendee identity. All guests must bring valid photo ID that matches their approved application. Guests without valid ID cannot enter.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-serif text-white font-semibold">
                  3. Passes Are Non-Transferable
                </h3>
                <p>
                  VIP passes and application links are strictly personal. You cannot sell, transfer, or auction your pass to anyone else. Transferred passes are cancelled immediately.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-serif text-white font-semibold">
                  4. Guest Guidelines
                </h3>
                <p>
                  Please respect the venue staff, hosts, and celebrity guest. Professional recording equipment and inappropriate behavior are not allowed. Anyone violating safety guidelines will be asked to leave.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-serif text-white font-semibold">
                  5. Schedule Changes
                </h3>
                <p>
                  Meeting times or locations may occasionally change due to travel or production schedules. Management will contact you by email if any change occurs.
                </p>
              </section>
            </div>
          )}

          <div className="pt-6 border-t border-white/[0.06] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>VIP Meet & Greet Management</span>
            <Link href="/privacy" className="text-[#D4AF37] hover:underline">
              View Privacy Policy →
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
