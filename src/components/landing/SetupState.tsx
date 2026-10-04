import { Link } from '../../router/Router';
import { Shield, Sparkles } from 'lucide-react';

export function SetupState() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 py-16">
      <div className="max-w-xl w-full text-center space-y-8 animate-fadeIn">
        
        {/* Modern Minimal Crest */}
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center mx-auto text-slate-200 shadow-xl">
          <Shield className="w-7 h-7 stroke-[1.5]" />
        </div>

        {/* Title & Explanatory Prose */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs uppercase tracking-widest text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Private Admittance Notice</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            VIP Portal Initializing
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
            Guest intake schedule for this private audience is currently being finalized by executive management. Admittance applications will open once official dates are verified.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/terms"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold uppercase tracking-wider transition-colors border border-white/[0.1]"
          >
            Review VIP Guidelines
          </Link>
        </div>

        {/* Subtle discreet management access link */}
        <div className="pt-8 border-t border-white/[0.04] text-xs text-slate-500 flex items-center justify-center gap-2">
          <span>Official Event Roster</span>
          <span aria-hidden="true">·</span>
          <Link 
            href="/management/login" 
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            Authorized Personnel
          </Link>
        </div>

      </div>
    </div>
  );
}
