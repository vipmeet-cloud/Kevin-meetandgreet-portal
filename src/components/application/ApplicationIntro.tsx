import { useState } from 'react';
import { MeetGreetSettings } from '../../types/settings';
import { 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Lock, 
  FileText, 
  User, 
  Sparkles,
  AlertTriangle 
} from 'lucide-react';

interface ApplicationIntroProps {
  settings: MeetGreetSettings | null;
  onStart: () => void;
  onViewTerms: () => void;
}

export function ApplicationIntro({
  settings,
  onStart,
  onViewTerms,
}: ApplicationIntroProps) {
  const [imageError, setImageError] = useState(false);

  // If portal is unconfigured or inactive
  if (!settings || !settings.is_active || !settings.celebrity_name) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#121622] border border-amber-500/30 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-mono">
              Status Notice
            </span>
            <h2 className="text-2xl font-serif text-white font-medium">
              Applications Currently Closed
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Applications are currently closed for this event. Please check back soon or contact management.
            </p>
          </div>

          <a
            href="/"
            className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center"
          >
            Return to Event Overview
          </a>
        </div>
      </div>
    );
  }

  const celebrityName = settings.celebrity_name;
  const celebrityTitle = settings.celebrity_title || 'Principal Artist';
  const eventName = settings.event_name || 'Exclusive VIP Engagement';
  const celebrityImage = settings.celebrity_image_url;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fadeIn">
      
      {/* Hero Presentation Card */}
      <div className="relative rounded-3xl overflow-hidden luxury-card border border-white/[0.1] shadow-2xl p-6 sm:p-10 text-center space-y-8">
        
        {/* Subtle top glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

        {/* Celebrity Portrait Capsule */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-b from-[#D4AF37] to-transparent shadow-xl">
          <div className="w-full h-full rounded-full overflow-hidden bg-[#141824] flex items-center justify-center border border-white/[0.1]">
            {celebrityImage && !imageError ? (
              <img
                src={celebrityImage}
                alt={celebrityName}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <User className="w-10 h-10 text-[#D4AF37] stroke-[1.2]" />
            )}
          </div>
        </div>

        {/* Title & Invitation Prose */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-xs font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{eventName}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white font-medium tracking-tight">
            VIP Meet & Greet
          </h1>

          <p className="text-base sm:text-lg font-serif text-[#E5C07B] max-w-lg mx-auto">
            “Apply to meet {celebrityName} in person.”
          </p>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed pt-1">
            Management reviews each application personally. When approved, you will receive event details and your VIP Pass.
          </p>
        </div>

        {/* Metric / Information Badges (3 items) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] text-[#D4AF37] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Time to Complete</span>
              <span className="text-xs font-semibold text-white">~3 Minutes</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] text-[#D4AF37] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Review</span>
              <span className="text-xs font-semibold text-white">Direct by Management</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.04] text-[#D4AF37] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Privacy</span>
              <span className="text-xs font-semibold text-white">Safe & Secure</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <button
            type="button"
            onClick={onStart}
            className="w-full sm:flex-1 min-h-[52px] px-8 py-3.5 bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA820A] hover:brightness-110 active:scale-[0.98] text-slate-950 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-[#D4AF37]/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Start Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onViewTerms}
            className="w-full sm:w-auto min-h-[48px] px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.1] rounded-2xl text-xs uppercase tracking-widest font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>View Terms</span>
          </button>
        </div>

        {/* Discretion & Privacy Assurance */}
        <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed pt-2">
          Submitting an application does not guarantee admission until confirmed by management. Your personal information is kept completely private.
        </p>

      </div>
    </div>
  );
}
