import { MeetGreetSettings } from '../../types/settings';
import { Award, Compass, ShieldCheck } from 'lucide-react';

interface AboutSectionProps {
  settings: MeetGreetSettings;
}

export function AboutSection({ settings }: AboutSectionProps) {
  const celebrityName = settings?.celebrity_name || 'Guest Artist';
  const eventName = settings?.event_name || 'Private VIP Engagement';
  const bio = settings?.celebrity_bio || 'A private and distinguished gathering providing meaningful personal rapport, executive hospitality, and direct dialogue in an intimate salon environment.';
  const description = settings?.event_description || 'Due to high security standards, invitations and access passes are issued exclusively through authorized executive screening.';

  return (
    <section id="about" className="py-16 md:py-24 border-b border-white/[0.06] bg-[#080A0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-2xl space-y-3 mb-12 md:mb-16">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">
            <span>Event Details</span>
            <span aria-hidden="true">·</span>
            <span>What to Expect</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            About the Meet & Greet
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            {eventName} offers a quiet, relaxed setting designed for genuine personal conversation and photos with {celebrityName}.
          </p>
        </div>

        {/* Narrative Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1118] border border-white/[0.07] space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-white">
                Biography & Profile
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {bio}
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1118] border border-white/[0.07] space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-white">
                Event Logistics & Purpose
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            
            {/* Standards Cards */}
            <div className="p-6 rounded-3xl bg-[#0E1118] border border-white/[0.07] flex items-start gap-4 shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Private Venue Details</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Venue location and arrival instructions are shared directly with confirmed guests once their pass is ready.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0E1118] border border-white/[0.07] flex items-start gap-4 shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Limited Guest Size</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Guest numbers are kept small so everyone enjoys unhurried conversation and comfortable hospitality.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-[#0E1118] border border-white/[0.07] flex items-start gap-4 shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <Compass className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Dedicated Management Host</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Management hosts will welcome you at the venue and assist with any arrival questions or special needs.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
