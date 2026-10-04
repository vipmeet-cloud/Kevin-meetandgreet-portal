import { useState } from 'react';
import { ApplicationFormData } from '../../types/application';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Calendar,
  Clock,
  Users,
  X
} from 'lucide-react';

interface StepSubmitProps {
  formData: ApplicationFormData;
  errors: Record<string, string>;
  onChange: (field: keyof ApplicationFormData, value: any) => void;
  celebrityName?: string;
  eventName?: string;
  isSubmitting: boolean;
  onSubmit: () => void;
  onBackToReview: () => void;
}

export function StepSubmit({
  formData,
  errors,
  onChange,
  celebrityName = 'The Celebrity',
  eventName = 'VIP Meet & Greet',
  isSubmitting,
  onSubmit,
  onBackToReview,
}: StepSubmitProps) {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="space-y-1.5 text-left">
        <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-mono font-semibold">
          Section 05 · Terms & Submission
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium tracking-tight">
          Terms & Submission
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Please review the guidelines below and confirm your application.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Reservation Highlight Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#131724] to-[#0A0D14] border border-[#D4AF37]/30 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest font-mono text-[#D4AF37] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ready to Submit</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Status: <span className="text-amber-400 font-medium">Ready for Review</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05]">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Applicant</span>
              <span className="text-white font-medium mt-1 truncate block">{formData.full_name || 'Guest'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05]">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Date</span>
              <span className="text-white font-medium mt-1 truncate block">{formData.preferred_date || '—'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05]">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Session</span>
              <span className="text-[#D4AF37] font-medium mt-1 truncate block">{formData.preferred_session || '—'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.05]">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Attendees</span>
              <span className="text-white font-medium mt-1 block">{formData.attendee_count} {formData.attendee_count === 1 ? 'Guest' : 'Guests'}</span>
            </div>
          </div>
        </div>

        {/* Legal Checkboxes */}
        <div className="space-y-4">
          
          {/* Checkbox 1: Terms */}
          <div
            onClick={() => onChange('terms_accepted', !formData.terms_accepted)}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              formData.terms_accepted
                ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                : errors.terms_accepted
                ? 'bg-red-500/10 border-red-500/80'
                : 'bg-[#0D1018] border-white/[0.08] hover:border-white/[0.2]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                formData.terms_accepted
                  ? 'bg-[#D4AF37] border-[#D4AF37] text-black'
                  : 'border-slate-500 bg-transparent'
              }`}
            >
              {formData.terms_accepted && <CheckCircle className="w-4 h-4 stroke-[2.5]" />}
            </div>

            <div className="space-y-1 text-left flex-1">
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Event Guidelines & Non-Transferability <span className="text-[#D4AF37]">*</span>
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                I understand that submitting an application does not guarantee attendance until confirmed by management. VIP Passes cannot be resold or transferred.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTermsModal(true);
                }}
                className="text-[11px] text-[#D4AF37] hover:underline inline-flex items-center gap-1 font-mono pt-0.5 cursor-pointer"
              >
                <span>Read Event Terms</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
          {errors.terms_accepted && (
            <p className="text-xs text-red-400 pl-2">{errors.terms_accepted}</p>
          )}

          {/* Checkbox 2: Privacy / Vetting */}
          <div
            onClick={() => onChange('privacy_accepted', !formData.privacy_accepted)}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              formData.privacy_accepted
                ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                : errors.privacy_accepted
                ? 'bg-red-500/10 border-red-500/80'
                : 'bg-[#0D1018] border-white/[0.08] hover:border-white/[0.2]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                formData.privacy_accepted
                  ? 'bg-[#D4AF37] border-[#D4AF37] text-black'
                  : 'border-slate-500 bg-transparent'
              }`}
            >
              {formData.privacy_accepted && <CheckCircle className="w-4 h-4 stroke-[2.5]" />}
            </div>

            <div className="space-y-1 text-left flex-1">
              <span className="text-xs sm:text-sm font-semibold text-white block">
                Privacy & Contact Consent <span className="text-[#D4AF37]">*</span>
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                I allow management to verify my contact details and reach out regarding this application. My information will never be shared or sold.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPrivacyModal(true);
                }}
                className="text-[11px] text-[#D4AF37] hover:underline inline-flex items-center gap-1 font-mono pt-0.5 cursor-pointer"
              >
                <span>Read Privacy Policy</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
          {errors.privacy_accepted && (
            <p className="text-xs text-red-400 pl-2">{errors.privacy_accepted}</p>
          )}

        </div>

        {/* Security & Zero Fee Note */}
        <div className="p-4 rounded-2xl bg-[#090C12] border border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#D4AF37]" />
            <span>Secure Application · No Application Fee</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Protected</span>
        </div>

      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-lg w-full bg-[#121622] border border-white/[0.1] rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-serif text-lg font-medium">
                <FileText className="w-5 h-5 text-[#D4AF37]" />
                <span>Terms of Service</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed pr-1 flex-1">
              <h4 className="font-semibold text-white text-sm">1. Application Review</h4>
              <p>Applications are reviewed individually by management. Submitting an application does not guarantee an approved pass or a scheduled meeting.</p>

              <h4 className="font-semibold text-white text-sm">2. Non-Transferable VIP Passes</h4>
              <p>Your approved VIP Pass is strictly for you. Passes cannot be resold, transferred, or shared with others.</p>

              <h4 className="font-semibold text-white text-sm">3. Entry & Photo ID</h4>
              <p>All guests must bring valid government photo ID matching their application name upon arrival. Venue security guidelines apply.</p>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onChange('terms_accepted', true);
                  setShowTermsModal(false);
                }}
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C07B] text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-lg w-full bg-[#121622] border border-white/[0.1] rounded-3xl p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-serif text-lg font-medium">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <span>Privacy Policy</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 text-xs text-slate-300 leading-relaxed pr-1 flex-1">
              <h4 className="font-semibold text-white text-sm">1. How We Use Your Details</h4>
              <p>Your information is used only to review your application and keep you updated regarding your VIP Meet & Greet with {celebrityName}.</p>

              <h4 className="font-semibold text-white text-sm">2. Keeping Your Information Safe</h4>
              <p>Your information is secure and accessible only to management. We never sell or share your details with advertisers or third parties.</p>

              <h4 className="font-semibold text-white text-sm">3. Photos & Attachments</h4>
              <p>Uploaded photos and identification files are stored safely and treated confidentially.</p>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onChange('privacy_accepted', true);
                  setShowPrivacyModal(false);
                }}
                className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C07B] text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
