import { ApplicationFormData } from '../../types/application';
import { 
  User, 
  Calendar, 
  FileText, 
  Edit3, 
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  Clock, 
  MessageSquare 
} from 'lucide-react';

interface StepReviewProps {
  formData: ApplicationFormData;
  celebrityName?: string;
  eventName?: string;
  onEditStep: (stepNumber: number) => void;
}

export function StepReview({
  formData,
  celebrityName = 'The Celebrity',
  eventName = 'VIP Meet & Greet',
  onEditStep,
}: StepReviewProps) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="space-y-1.5 text-left">
        <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-mono font-semibold">
          Section 04 · Summary
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium tracking-tight">
          Review Your Application
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Please check your details before sending your application to management.
        </p>
      </div>

      <div className="space-y-5">
        
        {/* Section 1: About You Card */}
        <div className="p-6 rounded-3xl bg-[#0D1018] border border-white/[0.08] space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] text-[#D4AF37] flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                About You
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-xs text-[#D4AF37] hover:text-[#E5C07B] flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Full Legal Name</span>
              <span className="text-white font-medium text-sm mt-0.5 block">{formData.full_name || '—'}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Email Address</span>
              <span className="text-white font-mono text-xs mt-0.5 block truncate">{formData.email || '—'}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Telephone Contact</span>
              <span className="text-white font-mono text-xs mt-0.5 block">{formData.phone || '—'}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Location</span>
              <span className="text-white font-medium text-xs mt-0.5 block">
                {formData.city ? `${formData.city}, ${formData.country}` : '—'}
              </span>
            </div>

            <div className="sm:col-span-2 pt-1 border-t border-white/[0.04]">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Preferred Contact Channel</span>
              <span className="text-[#D4AF37] uppercase font-mono text-xs font-semibold mt-0.5 block">
                {formData.preferred_contact_method}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Meet & Greet Details Card */}
        <div className="p-6 rounded-3xl bg-[#0D1018] border border-white/[0.08] space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] text-[#D4AF37] flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Meet & Greet Schedule
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs text-[#D4AF37] hover:text-[#E5C07B] flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Requested Date</span>
              <span className="text-white font-medium text-sm mt-0.5 block">{formData.preferred_date || '—'}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Session Timeframe</span>
              <span className="text-[#D4AF37] font-semibold text-xs mt-0.5 block">{formData.preferred_session || '—'}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Total Guests / Attendees</span>
              <span className="text-white font-mono text-sm mt-0.5 block">
                {formData.attendee_count} {formData.attendee_count === 1 ? 'Guest' : 'Guests'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Special Accommodations</span>
              <span className="text-slate-300 text-xs mt-0.5 block">
                {formData.special_requirements || 'None Specified'}
              </span>
            </div>

            {formData.message_to_management && (
              <div className="sm:col-span-2 pt-2 border-t border-white/[0.04]">
                <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Note to Management</span>
                <p className="text-slate-300 text-xs italic mt-1 leading-relaxed">
                  “{formData.message_to_management}”
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Supporting Information Card */}
        <div className="p-6 rounded-3xl bg-[#0D1018] border border-white/[0.08] space-y-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] text-[#D4AF37] flex items-center justify-center">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Supporting Photo or Document
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-xs text-[#D4AF37] hover:text-[#E5C07B] flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="text-xs">
            {formData.supporting_file_url ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/[0.06]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-white font-medium block truncate">
                    {formData.supporting_file_name || 'Attached file'}
                  </span>
                  <span className="text-[11px] text-emerald-400 block">
                    File uploaded
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-slate-500 italic block">
                No attachments added (optional).
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
