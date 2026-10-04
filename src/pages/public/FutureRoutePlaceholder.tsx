import { Link, useRouter } from '../../router/Router';
import { FUTURE_ROUTES_MAP } from '../../router/routes';
import { Clock, ArrowLeft, Shield } from 'lucide-react';

export function FutureRoutePlaceholder() {
  const { path } = useRouter();

  // Find corresponding future route info
  const matchingPrefix = Object.keys(FUTURE_ROUTES_MAP).find(prefix => path.startsWith(prefix));
  const info = matchingPrefix ? FUTURE_ROUTES_MAP[matchingPrefix] : {
    featureName: 'Reserved Portal Feature',
    phase: 'Future Phase',
    description: 'This operational route is structurally reserved for a future release of the VIP Management Portal.'
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 py-16">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#121622] border border-white/[0.08] text-center space-y-6 shadow-2xl">
        
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7 stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider font-mono text-[#D4AF37]">
            <Shield className="w-3.5 h-3.5" />
            <span>Scheduled for {info.phase}</span>
          </div>

          <h2 className="text-2xl font-serif text-white font-medium tracking-tight">
            {info.featureName}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {info.description}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.04] text-[11px] font-mono text-slate-500 text-left">
          <div className="text-slate-400">Route: <span className="text-slate-200">{path}</span></div>
          <div>Status: Foundation Architecture Ready (Phase 1)</div>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full min-h-[44px] px-6 py-2.5 bg-[#D4AF37] hover:bg-[#E5C07B] text-black font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-[#D4AF37]/15 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Event Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
