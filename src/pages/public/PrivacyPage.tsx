import { Link } from '../../router/Router';
import { useSettings } from '../../context/SettingsContext';
import { Lock, ArrowLeft, ShieldCheck } from 'lucide-react';

export function PrivacyPage() {
  const { settings } = useSettings();

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
            <Lock className="w-4 h-4" />
            <span>Privacy & Protection</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif text-white font-medium tracking-tight">
            Privacy Policy
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>Version 1.0</span>
            <span aria-hidden="true">·</span>
            <span>Effective October 2026</span>
          </div>
        </div>

        {/* Content Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-8">
          
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300 leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Your Privacy Matters: </span>
              When you apply for a VIP Meet & Greet with {celebrityName} for {eventName}, management treats your personal details with care and confidentiality.
            </div>
          </div>

          <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
            <section className="space-y-2">
              <h3 className="text-base font-serif text-white font-semibold">
                1. How We Use Your Information
              </h3>
              <p>
                We only use the information you submit for:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong className="text-white">Reviewing your application:</strong> Checking your details and available seats.</li>
                <li><strong className="text-white">Keeping you updated:</strong> Emailing you updates about your application and next steps.</li>
                <li><strong className="text-white">Safety and security:</strong> Making sure the event is safe for all guests.</li>
                <li><strong className="text-white">Event check-in:</strong> Preparing your VIP Pass and checking you in at the venue.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-serif text-white font-semibold">
                2. Information We Collect
              </h3>
              <p>
                When you apply, we collect your name, email address, phone number, city, and any notes or photo identification you submit. We do not collect unnecessary information.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-serif text-white font-semibold">
                3. Keeping Your Data Safe
              </h3>
              <p>
                Your details are stored securely. Only authorized management can view your application. Your information is never posted online or shared publicly.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-serif text-white font-semibold">
                4. No Selling of Personal Information
              </h3>
              <p>
                We do not sell, rent, or trade your personal information to anyone. We only share details with venue security or payment partners when strictly necessary to manage your visit.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-serif text-white font-semibold">
                5. Questions
              </h3>
              <p>
                If you have questions about your data or wish to update your details, please contact management.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-white/[0.06] text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>Contact: {settings?.support_email || 'management.meet.greet@gmail.com'}</span>
            <Link href="/terms" className="text-[#D4AF37] hover:underline">
              View Terms of Service →
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
