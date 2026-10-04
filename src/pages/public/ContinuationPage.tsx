import { useState, useEffect } from 'react';
import { useRouter } from '../../router/Router';
import { tokenService } from '../../services/tokenService';
import { paymentService } from '../../services/paymentService';
import { passService } from '../../services/passService';
import { useSettings } from '../../context/SettingsContext';
import { ApplicationRecord } from '../../types/application';
import { PaymentRecord, getPublicPaymentStatusLabel } from '../../types/payment';
import { VipPassRecord } from '../../types/vipPass';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Info,
  Copy,
  Check,
  HelpCircle,
  XCircle,
  Lock,
  QrCode
} from 'lucide-react';
import { Link } from '../../router/Router';

export function ContinuationPage() {
  const router = useRouter();
  const token = router.params?.token || router.path.split('/').pop() || '';
  const { settings } = useSettings();
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [pass, setPass] = useState<VipPassRecord | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  useEffect(() => {
    async function validate() {
      setIsValidating(true);
      if (!token) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      try {
        const res = await tokenService.validateContinuationToken(token);
        if (res.valid && res.application) {
          setIsValid(true);
          setApplication(res.application);

          // Fetch any existing payment records for this application
          const payRec = await paymentService.getPaymentForApplication(res.application.id);
          if (payRec) {
            setPayment(payRec);
          }

          // Fetch VIP pass if ready
          const passRec = await passService.getPassByApplicationId(res.application.id);
          if (passRec) {
            setPass(passRec);
          }
        } else {
          setIsValid(false);
        }
      } catch {
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    }

    validate();
  }, [token]);

  const handleCopyInstructions = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 text-center">
        <div className="space-y-3 font-mono text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <p>Checking your link...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired link
  if (!isValid || !application) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0F121C] border border-white/[0.08] space-y-5 shadow-2xl animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">This link has expired.</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            If you need assistance with your application, please contact management.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const feeAmount = settings?.fee_amount;
  const hasConfiguredFee = feeAmount !== null && feeAmount !== undefined && Number(feeAmount) > 0;
  const feeName = settings?.fee_name || 'VIP Meet & Greet Pass';
  const feeCurrency = settings?.fee_currency || 'USD';
  const feeDescription = settings?.fee_description || 'Admission to meet the celebrity guest, private photo session, and personal host accompaniment.';
  const feeInclusions = settings?.fee_inclusions;
  const paymentDeadlineHours = settings?.payment_deadline_hours || 48;
  const refundPolicy = settings?.refund_policy;
  const cancellationPolicy = settings?.cancellation_policy;
  const paymentInstructions = settings?.payment_instructions;

  // Render status badge and banner depending on payment stage
  const currentAppStatus = application.status;
  const isPaymentSubmitted = currentAppStatus === 'PAYMENT_SUBMITTED' || currentAppStatus === 'PAYMENT_UNDER_REVIEW';
  const isPaymentConfirmed = currentAppStatus === 'PAYMENT_CONFIRMED_AWAITING_PASS';
  const isPaymentRejected = currentAppStatus === 'PAYMENT_REJECTED';
  const isClarificationNeeded = currentAppStatus === 'PAYMENT_CLARIFICATION_REQUIRED';
  const isAwaitingPayment = currentAppStatus === 'APPROVED' || currentAppStatus === 'APPROVED_AWAITING_COMPLETION';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0F121C] border border-white/[0.08] shadow-2xl relative overflow-hidden">
        
        {/* Subtle ambient lighting */}
        <div 
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[120px] pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(229,169,60,0.5) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
              VIP APPLICATION
            </span>

            {/* Dynamic Status Badges */}
            {isPaymentConfirmed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payment Confirmed — VIP Pass Pending</span>
              </span>
            ) : isPaymentSubmitted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Payment Submitted — Under Management Review</span>
              </span>
            ) : isClarificationNeeded ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Payment Requires Clarification</span>
              </span>
            ) : isPaymentRejected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold">
                <XCircle className="w-3.5 h-3.5" />
                <span>Payment Requires Attention</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>APPROVED</span>
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {application.full_name}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Your application has been approved by management.
            </p>
          </div>

          {/* Dossier Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/[0.06] text-xs">
            <div className="p-3 rounded-2xl bg-black/30 border border-white/[0.04]">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Application Ref</span>
              <span className="font-mono font-bold text-white tracking-wider mt-0.5 block">{application.reference_code}</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/30 border border-white/[0.04]">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Approved Date</span>
              <span className="font-medium text-white mt-0.5 block">
                {application.approved_at ? new Date(application.approved_at).toLocaleDateString() : 'Approved'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-black/30 border border-white/[0.04]">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Approved Session</span>
              <span className="font-medium text-amber-300 mt-0.5 block">{application.preferred_session}</span>
            </div>

            <div className="p-3 rounded-2xl bg-black/30 border border-white/[0.04]">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Attendees</span>
              <span className="font-mono font-bold text-white mt-0.5 block">{application.attendee_count} {application.attendee_count === 1 ? 'Guest' : 'Guests'}</span>
            </div>
          </div>

        </div>

      </div>

      {/* CLARIFICATION REQUESTED BANNER */}
      {isClarificationNeeded && (
        <div className="p-6 rounded-3xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>Clarification Required from Management</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {application.information_requested_message || payment?.management_note || 'Management requires additional clarification regarding your submitted transaction.'}
          </p>
          <div className="pt-2">
            <Link
              href={`/payment/${token}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-semibold text-xs uppercase tracking-wider transition-all"
            >
              <span>Update Payment Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* PAYMENT REJECTED BANNER */}
      {isPaymentRejected && (
        <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-500/30 text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>Your payment needs attention</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {application.decline_reason || payment?.rejection_reason || 'Management could not confirm the payment details you submitted. Please check the information and submit again.'}
          </p>
          <div className="pt-2">
            <Link
              href={`/payment/${token}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-xs uppercase tracking-wider transition-all"
            >
              <span>Review Payment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* VIP PASS READY (When pass is issued) OR PAYMENT CONFIRMED NOTICE */}
      {pass ? (
        <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1F1A0B] to-[#0F121C] border border-[#D4AF37]/50 text-center space-y-4 shadow-2xl relative overflow-hidden animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mx-auto shadow-lg">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <div className="inline-block px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
              Ready for Download
            </div>
            <h3 className="text-2xl font-serif text-white font-bold">Your VIP Pass is ready</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your VIP Meet & Greet Pass is ready. You can view the pass and download it to your phone.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] max-w-sm mx-auto text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Pass Number:</span>
              <span className="text-white font-bold">{pass.pass_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-bold uppercase">{pass.status}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={`/vip-pass/${pass.verification_token}`}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
            >
              <span>View VIP Pass</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : isPaymentConfirmed ? (
        <div className="p-8 rounded-3xl bg-gradient-to-b from-[#0F1A17] to-[#0A100E] border border-emerald-500/30 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-white">Your payment has been confirmed</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Your payment has been confirmed by management. Your VIP Pass is now being prepared. We will send you an email when it is ready.
            </p>
          </div>
          {payment && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] max-w-sm mx-auto text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Reference:</span>
                <span className="text-white font-bold">{payment.payment_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="text-emerald-400 font-bold">Confirmed</span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* PAYMENT UNDER REVIEW NOTICE (Section 21) */}
      {isPaymentSubmitted && (
        <div className="p-8 rounded-3xl bg-[#0F121C] border border-amber-500/30 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-center justify-center mx-auto shadow-lg">
            <Clock className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-white">Payment is being checked</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Management is checking your payment. We will let you know when there is an update.
            </p>
          </div>
          {payment && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] max-w-sm mx-auto text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Reference:</span>
                <span className="text-white font-bold">{payment.payment_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Submitted:</span>
                <span className="text-slate-300">{new Date(payment.submitted_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEXT STEP & FEE INFORMATION */}
      {isAwaitingPayment && (
        <div className="space-y-6">
          
          {/* Section: NEXT STEP */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0F121C] border border-white/[0.08] shadow-xl space-y-6">
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono uppercase tracking-wider text-slate-300">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Next step</span>
              </div>
              <h2 className="text-xl font-bold text-white">VIP Meet & Greet Pass Details</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                To confirm your spot, please review the fee details and submit your payment below.
              </p>
            </div>

            {/* Fee presentation or unavailable state */}
            {!hasConfiguredFee ? (
              <div className="p-6 rounded-2xl bg-black/40 border border-white/[0.06] text-center space-y-3">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white">Payment instructions are not currently available.</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Management is finalizing session arrangements. Please check back shortly or await direct email communication.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Fee Amount Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 block">
                      {feeName}
                    </span>
                    <h3 className="text-3xl font-extrabold text-white mt-1">
                      {feeCurrency === 'USD' ? '$' : feeCurrency === 'EUR' ? '€' : feeCurrency === 'GBP' ? '£' : `${feeCurrency} `}
                      {Number(feeAmount).toLocaleString()}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md">
                      {feeDescription}
                    </p>
                  </div>

                  <div className="text-right sm:text-right shrink-0">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Confirmation Window</span>
                    <span className="text-xs font-semibold text-white mt-0.5 block">Within {paymentDeadlineHours} Hours</span>
                  </div>
                </div>

                {/* What the fee covers */}
                {feeInclusions && (
                  <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      What the Fee Covers
                    </h4>
                    <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-1.5">
                      {feeInclusions}
                    </div>
                  </div>
                )}

                {/* Policies: Transparent Language (Section 10) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {refundPolicy && (
                    <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.06] space-y-1.5">
                      <span className="font-semibold text-white block">Refund Policy</span>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        {refundPolicy}
                      </p>
                    </div>
                  )}

                  {cancellationPolicy && (
                    <div className="p-4 rounded-2xl bg-black/30 border border-white/[0.06] space-y-1.5">
                      <span className="font-semibold text-white block">Cancellation Policy</span>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        {cancellationPolicy}
                      </p>
                    </div>
                  )}
                </div>

                {/* Transparent Payment Language Notice */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-400 space-y-1">
                  <p className="text-[11px] leading-relaxed">
                    Payment is subject to the terms and conditions displayed above. Please review the fee details and applicable cancellation/refund policy before submitting payment information.
                  </p>
                </div>

                {/* Proceed Button */}
                <div className="pt-2">
                  <Link
                    href={`/payment/${token}`}
                    className="w-full min-h-[50px] px-8 py-3.5 bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.98] font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Payment Submission</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* Return link */}
      <div className="text-center pt-4">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Return to Event Home
        </Link>
      </div>

    </div>
  );
}
