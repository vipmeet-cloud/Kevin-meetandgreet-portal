import { ClipboardCheck, UserCheck, ShieldAlert, Ticket, ArrowRight } from 'lucide-react';
import { Link } from '../../router/Router';

export function ProcessSection() {
  const steps = [
    {
      num: '01',
      title: 'Submit Application',
      description: 'Fill out a short application with your contact details and preferred date.',
      icon: ClipboardCheck,
      badge: 'Step 1'
    },
    {
      num: '02',
      title: 'Management Review',
      description: 'Management reviews your application and checks seat availability.',
      icon: UserCheck,
      badge: 'Step 2'
    },
    {
      num: '03',
      title: 'Next Step & Payment',
      description: 'When approved, you receive an email link to confirm your details and complete payment.',
      icon: ShieldAlert,
      badge: 'Step 3'
    },
    {
      num: '04',
      title: 'Receive Your VIP Pass',
      description: 'Once payment is confirmed, your VIP Pass is ready to view, download, and bring to the event.',
      icon: Ticket,
      badge: 'Step 4'
    },
  ];

  return (
    <section id="process" className="py-16 md:py-24 border-b border-white/[0.06] bg-[#0C0E14] relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-3 mb-12 md:mb-16">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37] font-semibold">
            <span>Simple Process</span>
            <span aria-hidden="true">·</span>
            <span>How It Works</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-medium text-white tracking-tight">
            How It Works in 4 Steps
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Because space is limited, every application is reviewed by management before admission is confirmed.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-[#121622] border border-white/[0.06] flex flex-col justify-between relative group hover:border-[#D4AF37]/40 hover:shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Natural Editorial Numbering */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-serif font-bold text-[#D4AF37] tabular-nums">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 transition-colors shadow-inner">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-lg font-serif font-medium text-white">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-white/[0.04] text-[11px] text-slate-500">
                  {idx < 2 ? (
                    <span className="text-amber-400/90 font-medium">Under Review</span>
                  ) : (
                    <span className="text-emerald-400/90 font-medium">After Approval</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Link & Notice */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-5 p-6 rounded-3xl bg-gradient-to-r from-[#141824] to-[#0D1018] border border-white/[0.08] shadow-2xl">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs uppercase tracking-widest text-[#D4AF37] font-mono font-semibold block">
              Applications Now Open
            </span>
            <p className="text-xs text-slate-400 max-w-xl">
              Applications are currently open for upcoming dates. Submit your details today to reserve your place.
            </p>
          </div>

          <Link
            href="/apply"
            className="min-h-[48px] px-7 py-3 rounded-2xl bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA820A] hover:brightness-110 active:scale-[0.98] text-slate-950 font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Apply Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
