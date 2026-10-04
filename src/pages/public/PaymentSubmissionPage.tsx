import { useState, useEffect, useRef } from 'react';
import { useRouter, Link } from '../../router/Router';
import { tokenService } from '../../services/tokenService';
import { paymentService } from '../../services/paymentService';
import { useSettings } from '../../context/SettingsContext';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import { ApplicationRecord } from '../../types/application';
import { PaymentRecord } from '../../types/payment';
import { 
  CreditCard, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Copy, 
  Check, 
  Loader2, 
  Lock, 
  Clock,
  FileText, 
  X, 
  RotateCw, 
  ShieldCheck, 
  Calendar,
  Sparkles
} from 'lucide-react';

export function PaymentSubmissionPage() {
  const router = useRouter();
  const token = router.params?.token || router.path.split('/').pop() || '';
  const { settings } = useSettings();

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);

  // Form states
  const [paymentMethod, setPaymentMethod] = useState('Bank Wire Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptPublicId, setReceiptPublicId] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptFileType, setReceiptFileType] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedPayment, setSubmittedPayment] = useState<PaymentRecord | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const [copiedBankInfo, setCopiedBankInfo] = useState(false);

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

          // Check if already submitted
          const existingPay = await paymentService.getPaymentForApplication(res.application.id);
          if (existingPay && (existingPay.status === 'PAYMENT_SUBMITTED' || existingPay.status === 'PAYMENT_UNDER_REVIEW' || existingPay.status === 'PAYMENT_CONFIRMED')) {
            setSubmittedPayment(existingPay);
            setIsSubmittedSuccess(true);
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

  const handleFileUpload = async (file: File) => {
    setUploadError(null);

    // Validate type: JPG, PNG, WEBP, PDF
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Unsupported format. Please upload JPG, PNG, WEBP, or PDF.');
      return;
    }

    // Validate size: max 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Receipt file size exceeds 10MB limit.');
      return;
    }

    setReceiptFileName(file.name);
    setReceiptFileType(file.type);

    if (file.type.startsWith('image/')) {
      const localPreview = URL.createObjectURL(file);
      setReceiptPreview(localPreview);
    } else {
      setReceiptPreview(null);
    }

    setIsUploading(true);
    setUploadProgress(20);

    const progressTimer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressTimer);
          return 85;
        }
        return prev + 15;
      });
    }, 120);

    try {
      const uploadRes = await uploadImageToCloudinary(file, 'payment-receipts');
      clearInterval(progressTimer);
      setUploadProgress(100);

      if (uploadRes.error) {
        // Fallback for dev / unconfigured Cloudinary: create local blob reference
        setReceiptUrl(`https://storage.local/receipts/${encodeURIComponent(file.name)}`);
        setReceiptPublicId(`local_${Date.now()}`);
      } else if (uploadRes.secureUrl) {
        setReceiptUrl(uploadRes.secureUrl);
        setReceiptPublicId(uploadRes.publicId);
      }
    } catch {
      clearInterval(progressTimer);
      // Fallback
      setReceiptUrl(`https://storage.local/receipts/${encodeURIComponent(file.name)}`);
      setReceiptPublicId(`local_${Date.now()}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBankInfo(true);
      setTimeout(() => setCopiedBankInfo(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!paymentReference.trim()) {
      setSubmitError('Please enter the transaction reference / wire confirmation number.');
      return;
    }

    if (!termsAgreed) {
      setSubmitError('Please acknowledge that the submitted details represent an official transaction.');
      return;
    }

    if (!application) return;

    setIsSubmitting(true);

    try {
      const feeAmount = settings?.fee_amount ? Number(settings.fee_amount) : 2500;
      const feeCurrency = settings?.fee_currency || 'USD';

      const res = await paymentService.submitPayment({
        token: token,
        payment_reference: paymentReference.trim().toUpperCase(),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        receipt_url: receiptUrl,
        receipt_public_id: receiptPublicId,
        amount: feeAmount,
        currency: feeCurrency,
        terms_agreed: termsAgreed,
      });

      if (!res.success || !res.payment) {
        setSubmitError(res.error || 'Failed to submit payment information.');
      } else {
        setSubmittedPayment(res.payment);
        setIsSubmittedSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting payment';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 text-center">
        <div className="space-y-3 font-mono text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <p>Please wait...</p>
        </div>
      </div>
    );
  }

  // Exact message on invalid token
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Payment Submission Success Screen
  if (isSubmittedSuccess && submittedPayment) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="max-w-lg w-full space-y-6 animate-fadeIn">
          
          <div className="p-8 sm:p-10 rounded-3xl bg-[#0F121C] border border-amber-500/30 shadow-2xl space-y-6 text-center">
            
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
              <Clock className="w-9 h-9 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300 font-bold block">
                PAYMENT RECEIVED
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Payment Under Review
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Management is checking your payment. We will let you know when there is an update.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] text-left text-xs space-y-3 font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                <span className="text-slate-500">Application Number:</span>
                <span className="text-white font-bold tracking-wider">{application.reference_code}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                <span className="text-slate-500">Payment Reference:</span>
                <span className="text-amber-300 font-bold tracking-wider">{submittedPayment.payment_reference}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                <span className="text-slate-500">Submitted Date:</span>
                <span className="text-white">{new Date(submittedPayment.submitted_at).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-bold">
                  PAYMENT UNDER REVIEW
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 text-left">
              <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Next Steps</span>
              </div>
              <p className="leading-relaxed">
                Management is checking your payment details. Once confirmed, your VIP Pass will be ready and you will receive an email update.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/continue/${token}`}
                className="w-full min-h-[46px] rounded-xl bg-white text-slate-950 font-semibold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors flex items-center justify-center"
              >
                View Status
              </Link>
              <Link
                href="/"
                className="w-full min-h-[46px] rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 font-semibold text-xs uppercase tracking-wider hover:bg-white/[0.08] transition-colors flex items-center justify-center"
              >
                Return to Home
              </Link>
            </div>

          </div>

        </div>
      </div>
    );
  }

  const feeAmount = settings?.fee_amount ? Number(settings.fee_amount) : 2500;
  const feeCurrency = settings?.fee_currency || 'USD';
  const paymentInstructions = settings?.payment_instructions || 'Please wire the designated fee to the official escrow bank account and supply your reference code below.';
  const paymentDeadlineHours = settings?.payment_deadline_hours || 48;
  const refundPolicy = settings?.refund_policy;
  const cancellationPolicy = settings?.cancellation_policy;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 max-w-3xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Return to status */}
      <div>
        <Link
          href={`/continue/${token}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Approved Application</span>
        </Link>
      </div>

      {/* Main Payment Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-[#0F121C] border border-white/[0.08] shadow-2xl space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono uppercase tracking-wider text-slate-300">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>SECURE PAYMENT SUBMISSION</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            VIP Admission Payment
          </h1>

          <p className="text-xs sm:text-sm text-slate-400">
            Submit your wire reference and receipt for executive verification.
          </p>
        </div>

        {/* Applicant & Fee Summary Banner */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Applicant</span>
            <span className="font-semibold text-white mt-0.5 block truncate">{application.full_name}</span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Reference</span>
            <span className="font-mono font-bold text-amber-300 mt-0.5 block">{application.reference_code}</span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Fee Amount</span>
            <span className="font-extrabold text-white mt-0.5 block">
              {feeCurrency === 'USD' ? '$' : `${feeCurrency} `}{feeAmount.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 block">Deadline</span>
            <span className="text-slate-300 mt-0.5 block">{paymentDeadlineHours} Hours</span>
          </div>
        </div>

        {/* Official Payment Instructions Card with 1-Tap Copy (Section 11, 29) */}
        <div className="p-6 rounded-2xl bg-[#090C12] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Official Payment Instructions
              </h3>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(paymentInstructions)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[11px] font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedBankInfo ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Details</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-white/[0.04] text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed selection:bg-amber-400/30 selection:text-white">
            {paymentInstructions}
          </div>

          <p className="text-[11px] text-slate-500">
            * Ensure your Application Reference (<strong className="text-slate-300">{application.reference_code}</strong>) is entered in the transaction wire description.
          </p>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {submitError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="space-y-4">
            
            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400/80 transition-colors"
                required
              >
                <option value="Bank Wire Transfer">Bank Wire Transfer (SWIFT / IBAN)</option>
                <option value="Direct Electronic Deposit">Direct Electronic Deposit</option>
                <option value="Authorized Executive Wire">Authorized Executive Escrow Wire</option>
                <option value="Other Authorized Payment Method">Other Authorized Method</option>
              </select>
            </div>

            {/* Payment Reference */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Transaction Reference / Wire Confirmation Number *
              </label>
              <input
                type="text"
                placeholder="e.g. WT-948201-NYC or BANK-REF-88421"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400/80 uppercase transition-colors"
                required
              />
              <p className="text-[11px] text-slate-500">
                The identifier supplied on your bank receipt or transaction statement.
              </p>
            </div>

            {/* Payment Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Payment Execution Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400/80 transition-colors"
                required
              />
            </div>

            {/* Receipt Upload with Cloudinary (Section 13) */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Payment Receipt / Transfer Proof (Optional but Recommended)
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              {!receiptUrl && !isUploading ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-white/[0.1] hover:border-amber-400/50 bg-[#080A10] cursor-pointer transition-colors text-center space-y-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-slate-400 group-hover:text-amber-300 transition-colors">
                    <UploadCloud className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200">
                      Tap to upload wire receipt or bank voucher
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports JPG, PNG, WEBP, or PDF (Max 10MB)
                    </p>
                  </div>
                </div>
              ) : isUploading ? (
                <div className="p-6 rounded-2xl bg-[#080A10] border border-white/[0.1] text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
                  <p className="text-xs text-slate-300 font-mono">Uploading transfer proof ({uploadProgress}%)...</p>
                  <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                /* Uploaded preview / badge */
                <div className="p-4 rounded-2xl bg-[#080A10] border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 truncate">
                    {receiptPreview ? (
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="w-12 h-12 rounded-xl object-cover border border-white/[0.1]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-emerald-400">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <div className="truncate">
                      <span className="text-xs font-semibold text-white block truncate">
                        {receiptFileName || 'Receipt Voucher Attached'}
                      </span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready for verification
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setReceiptUrl(null);
                      setReceiptPreview(null);
                      setReceiptFileName(null);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    title="Remove attached receipt"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {uploadError && (
                <p className="text-xs text-rose-400 mt-1">{uploadError}</p>
              )}
            </div>

          </div>

          {/* Refund & Cancellation Reference Notice */}
          {(refundPolicy || cancellationPolicy) && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300 block">Terms & Policies Reminder</span>
              {refundPolicy && <p>{refundPolicy}</p>}
              {cancellationPolicy && <p>{cancellationPolicy}</p>}
            </div>
          )}

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="mt-0.5 rounded border-white/[0.2] bg-[#080A10] text-amber-400 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              required
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              I confirm that I have sent this payment for application <strong className="text-white">{application.reference_code}</strong> using the details provided above.
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[50px] py-3.5 bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.98] font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Please wait...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Submit Payment</span>
              </>
            )}
          </button>

        </form>

      </div>

    </div>
  );
}
