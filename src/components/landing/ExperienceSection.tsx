import { MeetGreetSettings } from '../../types/settings';
import { Sparkles, Users, Key } from 'lucide-react';

interface ExperienceSectionProps {
  settings: MeetGreetSettings;
}

export function ExperienceSection({ settings }: ExperienceSectionProps) {
  const celebrityName = settings?.celebrity_name || 'the Artist';

  const experiences = [
    {
      title: 'Personalized Guest Reception',
      tagline: 'Warm Hospitality',
      description: `Enjoy dedicated guest service, comfortable seating, and personalized attention during your time with ${celebrityName}.`,
      icon: Sparkles,
    },
    {
      title: 'Private Lounge & Photography',
      tagline: 'Comfort & Privacy',
      description: `A relaxed private lounge away from crowds, complete with professional photos of you together with ${celebrityName}.`,
      icon: Users,
    },
    {
      title: 'Official VIP Pass',
      tagline: 'Simple Event Check-In',
      description: 'Quick and smooth entry on event day using your digital VIP Pass right on your mobile phone.',
      icon: Key,
    },
  ];

  return (
    <section id="experience" className="py-16 md:py-24 border-b border-white/[0.06] bg-[#090C12]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className="max-w-2xl space-y-3 mb-12 md:mb-16">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">
            <span>Privileges & Hospitality</span>
            <span aria-hidden="true">·</span>
            <span>Curation Standards</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            The VIP Experience
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Every aspect of the engagement is managed to the highest executive hospitality standards, ensuring privacy and personal comfort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {experiences.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-3xl bg-[#0E1118] border border-white/[0.07] hover:border-white/[0.2] transition-all duration-200 flex flex-col justify-between group shadow-xl"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-200 group-hover:text-amber-300 transition-colors shadow-sm">
                    <Icon className="w-6 h-6 stroke-[1.5]" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono block">
                      {item.tagline}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed pt-1">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/[0.04] flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Access Level</span>
                  <span className="text-slate-300">VIP Access</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
