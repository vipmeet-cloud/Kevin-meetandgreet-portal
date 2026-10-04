import { useState, useEffect } from 'react';
import { useRouter } from '../../router/Router';
import { useSettings } from '../../context/SettingsContext';
import { ApplicationFormData, ApplicationSubmissionResult } from '../../types/application';
import { 
  applicationService, 
  validateAboutYou, 
  validateMeetGreetDetails, 
  validateAgreements 
} from '../../services/applicationService';
import { ApplicationProgressBar } from '../../components/application/ApplicationProgressBar';
import { StepAboutYou } from '../../components/application/StepAboutYou';
import { StepMeetGreetDetails } from '../../components/application/StepMeetGreetDetails';
import { StepSupportingInfo } from '../../components/application/StepSupportingInfo';
import { StepReview } from '../../components/application/StepReview';
import { StepSubmit } from '../../components/application/StepSubmit';
import { HeroSkeleton } from '../../components/common/LoadingSkeleton';
import { 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  AlertCircle, 
  Loader2,
  ChevronLeft
} from 'lucide-react';

const INITIAL_FORM_DATA: ApplicationFormData = {
  full_name: '',
  email: '',
  phone: '',
  country: '',
  city: '',
  preferred_contact_method: 'email',
  preferred_date: '2026-11-14',
  preferred_session: 'Afternoon (2:00 PM)',
  attendee_count: 1,
  special_requirements: '',
  message_to_management: '',
  supporting_file_url: '',
  supporting_file_name: '',
  supporting_file_type: '',
  supporting_file_public_id: '',
  terms_accepted: false,
  privacy_accepted: false,
};

export function ApplicationPage() {
  const { navigate } = useRouter();
  const { settings, isLoading: settingsLoading } = useSettings();

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<ApplicationFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleChange = (field: keyof ApplicationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleNext = () => {
    setSubmissionError(null);

    if (step === 1) {
      const v = validateAboutYou(formData);
      if (!v.isValid) {
        setErrors(v.errors);
        return;
      }
    } else if (step === 2) {
      const v = validateMeetGreetDetails(formData);
      if (!v.isValid) {
        setErrors(v.errors);
        return;
      }
    }

    setErrors({});
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handleBack = () => {
    setSubmissionError(null);
    setErrors({});
    if (step === 1) {
      navigate('/');
    } else {
      setStep((prev) => Math.max(1, prev - 1));
    }
  };

  const handleStepJump = (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep);
    }
  };

  const handleSubmit = async () => {
    setSubmissionError(null);
    const v = validateAgreements(formData);
    if (!v.isValid) {
      setErrors(v.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result: ApplicationSubmissionResult = await applicationService.submit(formData, '1.0');

      if (!result.success) {
        setSubmissionError(result.error || 'Submission could not be completed. Please check your connection and retry.');
        setIsSubmitting(false);
        return;
      }

      navigate('/application-success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected submission failure';
      setSubmissionError(msg);
      setIsSubmitting(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen py-12">
        <HeroSkeleton />
      </div>
    );
  }

  const celebrityName = settings?.celebrity_name || 'Guest Artist';
  const eventName = settings?.event_name || 'Private VIP Meet & Greet';

  return (
    <div className="min-h-screen bg-[#080A0F] relative flex flex-col justify-between pb-28 md:pb-16 selection:bg-amber-400/20 selection:text-amber-200">
      
      {/* Main Content Area */}
      <div className="flex-1">
        
        {/* Sticky Top Progress Bar */}
        <ApplicationProgressBar
          currentStep={step}
          totalSteps={5}
          onStepClick={handleStepJump}
        />

        {/* Top Context Navigation */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5 pr-3 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{step === 1 ? 'Cancel & Return' : 'Previous Step'}</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {celebrityName}
          </span>
        </div>

        {/* Active Step Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 md:py-8">
          
          {/* Submission Error Banner */}
          {submissionError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div className="space-y-1">
                <span className="font-semibold text-white block">Application Notice:</span>
                <p className="leading-relaxed">{submissionError}</p>
              </div>
            </div>
          )}

          {/* Form Step Components */}
          <div className="space-y-6">
            
            {step === 1 && (
              <StepAboutYou
                formData={formData}
                errors={errors}
                onChange={handleChange}
              />
            )}

            {step === 2 && (
              <StepMeetGreetDetails
                formData={formData}
                errors={errors}
                onChange={handleChange}
                celebrityName={celebrityName}
              />
            )}

            {step === 3 && (
              <StepSupportingInfo
                formData={formData}
                onChange={handleChange}
              />
            )}

            {step === 4 && (
              <StepReview
                formData={formData}
                celebrityName={celebrityName}
                eventName={eventName}
                onEditStep={(target) => setStep(target)}
              />
            )}

            {step === 5 && (
              <StepSubmit
                formData={formData}
                errors={errors}
                onChange={handleChange}
                celebrityName={celebrityName}
                eventName={eventName}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onBackToReview={() => setStep(4)}
              />
            )}

            {/* Desktop Inline Action Bar */}
            <div className="hidden sm:flex items-center justify-between pt-8 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="min-h-[46px] px-5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{step === 1 ? 'Cancel' : 'Back'}</span>
              </button>

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="min-h-[46px] px-8 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.98] text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>{step === 4 ? 'Proceed to Submission' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-h-[48px] px-8 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.98] text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center gap-2.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Transmitting Dossier...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Sticky Bottom Action Bar (Optimized for Mobile/Android touch) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0C0F17]/95 backdrop-blur-2xl border-t border-white/[0.08] px-4 py-3 shadow-2xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="min-h-[48px] min-w-[48px] px-3 rounded-2xl bg-white/[0.06] active:bg-white/[0.12] text-slate-300 flex items-center justify-center border border-white/[0.08] shrink-0"
            aria-label="Previous step"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 min-h-[48px] px-5 bg-white text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
            >
              <span>{step === 4 ? 'Proceed to Submit' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] px-5 bg-white text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Application</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
