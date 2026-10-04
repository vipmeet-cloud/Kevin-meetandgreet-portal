import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useRouter } from '../../router/Router';
import { useSettings } from '../../context/SettingsContext';
import { getSubmissionReceipt, SubmittedReceipt } from '../../services/applicationService';
import { QRCodeDisplay } from '../../components/application/QRCodeDisplay';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowLeft, 
  Printer, 
  Clock, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  User,
  MapPin
} from 'lucide-react';

export function ApplicationSuccessPage() {
  const { navigate } = useRouter();
  const { settings } = useSettings();
  const [receipt, setReceipt] = useState<SubmittedReceipt | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#F3E5AB', '#AA820A', '#FFFFFF', '#6366F1'],
      });
    } catch {
      // Confetti fallback if canvas not available
    }

    const currentReceipt = getSubmissionReceipt();
    if (currentReceipt) {
      setReceipt(currentReceipt);
    } else {
      // If direct navigation, provide representative sample for preview
      setReceipt({
        referenceCode: 'VIP-7K4Q-29M',
        applicationId: 'app_preview',
        fullName: 'VIP Guest Applicant',
        email: 'applicant@confidential-inbox.com',
        preferredDate: '2026-11-14',
        preferredSession: 'Afternoon (2:00 PM)',
        attendeeCount: 1,
        submittedAt: new Date().toISOString(),
        status: 'Under Management Review',
      });
    }
  }, []);

  const handleCopy = () => {
    if (receipt?.referenceCode) {
      navigator.clipboard.writeText(receipt.referenceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const celebrityName = settings?.celebrity_name || 'Principal Artist';
  const eventName = settings?.event_name || 'Exclusive VIP Meet & Greet';

  return (
    <div className="min-h-screen bg-[#07090E] relative py-8 sm:py-14 px-4 sm:px-6">
      
      {/* Background glow effects */}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Success Header Badge */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center mx-auto shadow-2xl shadow-[#D4AF37]/20 animate-float">
            <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Application Received</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white font-medium tracking-tight">
              Application Received
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              We received your VIP Meet & Greet application for <span className="text-[#E5C07B] font-medium">{celebrityName}</span>. Management will review your details and contact you soon.
            </p>
          </div>
        </div>

        {/* Reference Code Card */}
        <div className="p-6 sm:p-8 rounded-3xl luxury-card border border-[#D4AF37]/40 shadow-2xl text-center space-y-6 relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-mono font-medium block">
              Your Application Number
            </span>
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className="text-2xl sm:text-3xl font-mono font-bold tracking-wider text-white bg-black/60 px-5 py-2.5 rounded-2xl border border-white/[0.1] select-all">
                {receipt?.referenceCode || 'VIP-PENDING'}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[48px] px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 text-[#D4AF37] border border-white/[0.1] transition-all flex items-center gap-1.5 text-xs font-mono font-semibold cursor-pointer"
                title="Copy Application Number"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Save this number for your records. We also sent a confirmation to your email.
            </p>
          </div>

          {/* QR Code Credential */}
          {receipt?.referenceCode && (
            <div className="pt-2 max-w-xs mx-auto">
              <QRCodeDisplay
                referenceCode={receipt.referenceCode}
                size={180}
              />
            </div>
          )}

          {/* Dossier Summary Grid */}
          <div className="border-t border-white/[0.08] pt-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Guest Name</span>
              <span className="text-white font-medium text-sm mt-0.5 block">{receipt?.fullName}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Email</span>
              <span className="text-white font-mono text-xs mt-0.5 block truncate">{receipt?.email}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Requested Date</span>
              <span className="text-[#D4AF37] font-medium text-xs mt-0.5 block">
                {receipt?.preferredDate} · {receipt?.preferredSession}
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Guests</span>
              <span className="text-white font-mono text-xs mt-0.5 block">
                {receipt?.attendeeCount} {receipt?.attendeeCount === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>
          </div>

        </div>

        {/* What Happens Next */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0F131E] border border-white/[0.08] space-y-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-sm uppercase tracking-widest font-mono font-semibold text-white">
              What Happens Next
            </h3>
          </div>

          <div className="space-y-4">
            
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                01
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  Management Review
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Management will review your application and check schedule availability.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                02
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  Next Step Email
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When approved, you will receive an email with a secure link to complete the next step and payment.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-400 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                03
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">
                  Your VIP Pass
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Once payment is confirmed, your VIP Pass is ready to view and download directly to your phone.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:flex-1 min-h-[48px] px-6 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] text-xs uppercase tracking-widest font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:flex-1 min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA820A] hover:brightness-110 active:scale-[0.98] text-slate-950 text-xs uppercase tracking-widest font-bold transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Return Home</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Discretion Notice */}
        <p className="text-[11px] text-slate-500 text-center leading-relaxed">
          If you have questions about your application, please contact management with your application number.
        </p>

      </div>
    </div>
  );
}
