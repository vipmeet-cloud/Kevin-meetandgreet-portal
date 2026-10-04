import { useState } from 'react';
import { Link } from '../../router/Router';
import { MeetGreetSettings } from '../../types/settings';
import { ArrowRight, Sparkles, Shield, User, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  settings: MeetGreetSettings | null;
}

export function HeroSection({ settings }: HeroSectionProps) {
  const [imageError, setImageError] = useState(false);

  const celebrityName = settings?.celebrity_name || 'Exclusive Guest Artist';
  const celebrityTitle = settings?.celebrity_title || 'Principal Guest';
  const eventName = settings?.event_name || 'Private VIP Audience';
  const imageUrl = settings?.celebrity_image_url;
  const description = settings?.event_description || `Join ${celebrityName} for a private meet and greet experience. Submit your application below to get started. Management reviews every application personally.`;

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-28 border-b border-white/[0.06]">
      
      {/* Subtle modern ambient background gradient */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[160px] pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(circle, rgba(229,169,60,0.4) 0%, rgba(99,102,241,0.15) 50%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Typography & CTAs (7 cols) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Small Eyebrow (Part F) */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono uppercase tracking-widest text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>PRIVATE VIP EXPERIENCE</span>
            </div>

            {/* Large Heading (Part F) */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08]">
                VIP Meet & Greet
              </h1>

              <div className="text-xl sm:text-2xl font-medium text-slate-200">
                Featuring <span className="text-white font-bold">{celebrityName}</span>
                {celebrityTitle && (
                  <span className="block text-sm text-slate-400 font-normal mt-0.5">
                    {celebrityTitle} · {eventName}
                  </span>
                )}
              </div>
            </div>

            {/* Short Modern Description */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {description}
            </p>

            {/* Primary & Secondary CTAs (Part F) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <Link
                href="/apply"
                className="min-h-[50px] px-8 py-3.5 bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.98] font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Apply for VIP Access</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#experience"
                className="min-h-[50px] px-6 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] font-semibold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>Explore Experience</span>
              </a>
            </div>

            {/* Trust Signals */}
            <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Reviewed by Management</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Verified VIP Pass</span>
              </div>
            </div>

          </div>

          {/* Right Column: Modern Composition Celebrity Portrait (5 cols) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              
              {/* Modern Card Container with layered depth */}
              <div className="relative rounded-3xl p-2 bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent shadow-2xl">
                <div className="relative aspect-[4/5] rounded-[22px] overflow-hidden bg-[#0D1018] border border-white/[0.06]">
                  
                  {imageUrl && !imageError ? (
                    <img
                      src={imageUrl}
                      alt={celebrityName}
                      referrerPolicy="no-referrer"
                      onError={() => setImageError(true)}
                      className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    /* Clean Fallback Graphic */
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#141724] to-[#0A0D14]">
                      <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 mb-4 shadow-lg">
                        <User className="w-10 h-10 stroke-[1.2]" />
                      </div>
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-mono block">
                        Official Audience Roster
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">
                        {celebrityName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {celebrityTitle}
                      </p>
                    </div>
                  )}

                  {/* Sleek bottom glass card overlay */}
                  <div className="absolute inset-x-3 bottom-3 p-4 rounded-2xl bg-[#090C12]/85 backdrop-blur-xl border border-white/[0.08] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                        Exclusive Access
                      </span>
                      <h4 className="text-sm font-semibold text-white">
                        {celebrityName}
                      </h4>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono uppercase">
                      Intake Open
                    </span>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
