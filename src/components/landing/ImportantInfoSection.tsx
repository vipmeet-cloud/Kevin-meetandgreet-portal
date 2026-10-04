import { Link } from '../../router/Router';
import { AlertCircle, Lock, ShieldCheck, FileText } from 'lucide-react';

export function ImportantInfoSection() {
  return (
    <section className="py-14 md:py-20 border-b border-white/[0.06] bg-[#080A0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-10 rounded-3xl bg-[#0E1118] border border-white/[0.08] shadow-2xl relative overflow-hidden">
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Important Information</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Application Review & Guidelines
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Every application is reviewed personally by management. Submitting an application does not guarantee admission until confirmed and your VIP Pass is issued.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-300" />
                  <span>Privacy Protected</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                  <span>Non-Transferable VIP Passes</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link
                href="/terms"
                className="w-full min-h-[46px] px-5 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1] rounded-2xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-center"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Terms & Conditions</span>
              </Link>

              <Link
                href="/privacy"
                className="w-full min-h-[44px] px-5 py-2.5 text-slate-400 hover:text-white rounded-2xl text-xs uppercase tracking-wider font-medium transition-colors flex items-center justify-center text-center"
              >
                <span>Privacy Policy</span>
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
