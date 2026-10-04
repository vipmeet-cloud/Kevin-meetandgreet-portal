import { ApplicationFormData } from '../../types/application';
import { Calendar, Users, Clock, MessageSquare, Shield, Info } from 'lucide-react';

interface StepMeetGreetDetailsProps {
  formData: ApplicationFormData;
  errors: Record<string, string>;
  onChange: (field: keyof ApplicationFormData, value: any) => void;
  celebrityName?: string;
}

export function StepMeetGreetDetails({
  formData,
  errors,
  onChange,
  celebrityName = 'The Celebrity',
}: StepMeetGreetDetailsProps) {
  // Session timeframe options with modern visual selection cards
  const sessions = [
    {
      id: 'Morning (10:00 AM)',
      timeframe: 'Morning Session',
      time: '10:00 AM – 11:30 AM',
      tag: 'Quiet Hospitality',
      description: 'Private breakfast reception, unhurried personal dialogue, and priority seating.',
    },
    {
      id: 'Afternoon (2:00 PM)',
      timeframe: 'Afternoon Session',
      time: '2:00 PM – 3:30 PM',
      tag: 'Executive Reception',
      description: 'Chilled champagne service, private salon portrait, and backstage walkthrough.',
    },
    {
      id: 'Evening (6:00 PM)',
      timeframe: 'Evening Gala Session',
      time: '6:00 PM – 7:45 PM',
      tag: 'Pre-Performance Gala',
      description: 'Exclusive green-room audience immediately prior to main stage appearance.',
    },
  ];

  // Configured date selection choices (dynamic window)
  const availableDates = [
    { id: '2026-11-14', display: 'Saturday, Nov 14, 2026', note: 'Primary Salon' },
    { id: '2026-11-15', display: 'Sunday, Nov 15, 2026', note: 'Encore Evening' },
    { id: '2026-11-21', display: 'Saturday, Nov 21, 2026', note: 'Executive Matinee' },
    { id: '2026-11-22', display: 'Sunday, Nov 22, 2026', note: 'Closing Reception' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="space-y-1.5 text-left">
        <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-mono font-semibold">
          Section 02 · Session Details
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium tracking-tight">
          Meet & Greet Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Choose when you would like to meet {celebrityName}.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Preferred Date Selection (Visual Cards) */}
        <div className="space-y-2">
          <label className="block text-xs uppercase font-semibold tracking-wider text-slate-300">
            Preferred Date <span className="text-[#D4AF37]">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availableDates.map((d) => {
              const isSelected = formData.preferred_date === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onChange('preferred_date', d.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15 ring-1 ring-[#D4AF37]'
                      : 'bg-[#0D1018] border-white/[0.08] hover:border-white/[0.2]'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-serif font-medium text-white block">
                      {d.display}
                    </span>
                    <span className="text-[11px] font-mono text-[#D4AF37] block">
                      {d.note}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#D4AF37]'
                        : 'border-slate-600 bg-transparent'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                </button>
              );
            })}
          </div>
          {errors.preferred_date && (
            <p className="text-xs text-red-400 pl-1">{errors.preferred_date}</p>
          )}
        </div>

        {/* Timeframe / Session Selection (Visual Cards) */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs uppercase font-semibold tracking-wider text-slate-300">
            Timeframe / Session Schedule <span className="text-[#D4AF37]">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sessions.map((s) => {
              const isSelected = formData.preferred_session === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange('preferred_session', s.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/15 ring-1 ring-[#D4AF37]'
                      : 'bg-[#0D1018] border-white/[0.08] hover:border-white/[0.2]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37]">
                        {s.tag}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-[#D4AF37] bg-[#D4AF37]'
                            : 'border-slate-600 bg-transparent'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    </div>
                    <h4 className="text-sm font-serif font-semibold text-white">
                      {s.timeframe}
                    </h4>
                    <span className="text-xs font-mono text-slate-300 block mt-0.5">
                      {s.time}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed border-t border-white/[0.04] pt-2">
                    {s.description}
                  </p>
                </button>
              );
            })}
          </div>
          {errors.preferred_session && (
            <p className="text-xs text-red-400 pl-1">{errors.preferred_session}</p>
          )}
        </div>

        {/* Guest / Attendee Count (Interactive Tactile Stepper) */}
        <div className="p-5 rounded-2xl bg-[#0D1018] border border-white/[0.08] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-300 block">
                Number of Attendees
              </span>
              <span className="text-[11px] text-slate-400">
                Primary applicant + accredited companions (Maximum 4 per private slot)
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {[1, 2, 3, 4].map((count) => {
                const isActive = formData.attendee_count === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onChange('attendee_count', count)}
                    className={`min-h-[44px] min-w-[44px] rounded-xl text-sm font-mono font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/25'
                        : 'bg-white/[0.04] text-slate-300 border border-white/[0.08] hover:border-white/[0.2]'
                    }`}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-white/[0.04]">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>All companion attendees must provide government ID matching the submitted names upon arrival.</span>
          </div>
        </div>

        {/* Special Requirements */}
        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-semibold tracking-wider text-slate-300">
            Special Requirements / Accessibility Accommodations (Optional)
          </label>
          <input
            type="text"
            name="special_requirements"
            placeholder="e.g. Wheelchair access, sign-language assistance, specific dietary restrictions"
            value={formData.special_requirements}
            onChange={(e) => onChange('special_requirements', e.target.value)}
            className="w-full min-h-[48px] px-4 py-3 bg-[#0D1018] border border-white/[0.1] rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#D4AF37] transition-all"
          />
        </div>

        {/* Optional Message to Management */}
        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-semibold tracking-wider text-slate-300">
            Personal Note to Celebrity Management (Optional)
          </label>
          <textarea
            name="message_to_management"
            rows={3}
            placeholder="Briefly state your purpose, special personal dedication, or message for the management committee..."
            value={formData.message_to_management}
            onChange={(e) => onChange('message_to_management', e.target.value)}
            className="w-full p-4 bg-[#0D1018] border border-white/[0.1] rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#D4AF37] transition-all leading-relaxed"
          />
        </div>

      </div>
    </div>
  );
}
