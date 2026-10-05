import { useState, useEffect, useRef } from 'react';
import { useRouter, Link } from '../../router/Router';
import { tokenService } from '../../services/tokenService';
import { paymentService } from '../../services/paymentService';
import { useSettings } from '../../context/SettingsContext';
import { uploadImageToCloudinary } from '../../services/cloudinary';
import { ApplicationRecord } from '../../types/application';
import { PaymentRecord } from '../../types/payment';
import QRCode from 'qrcode';
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
  Sparkles,
  Coins,
  Gift,
  QrCode,
  ExternalLink
} from 'lucide-react';

export function PaymentSubmissionPage() {
  const router = useRouter();
  const token = router.params?.token || router.path.split('/').pop() || '';
  const { settings } = useSettings();

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);

  // Method selector: 'Bank Wire Transfer' | 'Bitcoin / Cryptocurrency' | 'Gift Card'
  const [paymentMethod, setPaymentMethod] = useState<'Bank Wire Transfer' | 'Bitcoin / Cryptocurrency' | 'Gift Card'>('Bank Wire Transfer');
  
  // Bank Wire states
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptPublicId, setReceiptPublicId] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptProgress, setReceiptProgress] = useState(0);

  // Crypto / Bitcoin states
  const [cryptoWalletAddress, setCryptoWalletAddress] = useState('');
  const [cryptoTxHash, setCryptoTxHash] = useState('');
  const [generatedBitcoinQr, setGeneratedBitcoinQr] = useState<string | null>(null);
  const [copiedCryptoAddress, setCopiedCryptoAddress] = useState(false);

  // Gift Card states
  const [giftCardType, setGiftCardType] = useState('Apple Gift Card');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardPin, setGiftCardPin] = useState('');
  const [giftCardImageUrl, setGiftCardImageUrl] = useState<string | null>(null);
  const [giftCardBackImageUrl, setGiftCardBackImageUrl] = useState<string | null>(null);
  const [isUploadingGiftFront, setIsUploadingGiftFront] = useState(false);
  const [isUploadingGiftBack, setIsUploadingGiftBack] = useState(false);

  const [termsAgreed, setTermsAgreed] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPayment, setSubmittedPayment] = useState<PaymentRecord | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  const [copiedBankInfo, setCopiedBankInfo] = useState(false);

  const receiptInputRef = useRef<HTMLInputElement>(null);
  const giftFrontInputRef = useRef<HTMLInputElement>(null);
  const giftBackInputRef = useRef<HTMLInputElement>(null);

  // Validate Token on load
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

  // Generate dynamic QR Code for Bitcoin if not manually configured
  const effectiveBtcAddress = settings?.bitcoin_wallet_address || 'bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x';
  useEffect(() => {
    if (settings?.bitcoin_image_url) {
      setGeneratedBitcoinQr(settings.bitcoin_image_url);
    } else if (effectiveBtcAddress) {
      QRCode.toDataURL(effectiveBtcAddress, {
        width: 320,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then(url => setGeneratedBitcoinQr(url))
        .catch(() => {});
    }
  }, [settings?.bitcoin_image_url, effectiveBtcAddress]);

  // Generic File Uploader Helper
  const handleUploadFile = async (
    file: File, 
    type: 'receipt' | 'gift-front' | 'gift-back'
  ) => {
    setUploadError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Unsupported format. Please upload JPG, PNG, WEBP, or PDF.');
      return;
    }

    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size exceeds 15MB limit.');
      return;
    }

    if (type === 'receipt') {
      setReceiptFileName(file.name);
      if (file.type.startsWith('image/')) {
        setReceiptPreview(URL.createObjectURL(file));
      }
      setIsUploadingReceipt(true);
      setReceiptProgress(25);
    } else if (type === 'gift-front') {
      setIsUploadingGiftFront(true);
    } else if (type === 'gift-back') {
      setIsUploadingGiftBack(true);
    }

    const timer = setInterval(() => {
      if (type === 'receipt') {
        setReceiptProgress(p => (p >= 85 ? 85 : p + 15));
      }
    }, 150);

    try {
      const folder = type === 'receipt' ? 'payment-receipts' : 'gift-cards';
      const uploadRes = await uploadImageToCloudinary(file, folder);
      clearInterval(timer);

      if (type === 'receipt') {
        setReceiptProgress(100);
        if (uploadRes.secureUrl) {
          setReceiptUrl(uploadRes.secureUrl);
          setReceiptPublicId(uploadRes.publicId);
        }
      } else if (type === 'gift-front' && uploadRes.secureUrl) {
        setGiftCardImageUrl(uploadRes.secureUrl);
      } else if (type === 'gift-back' && uploadRes.secureUrl) {
        setGiftCardBackImageUrl(uploadRes.secureUrl);
      }
    } catch {
      clearInterval(timer);
    } finally {
      if (type === 'receipt') setIsUploadingReceipt(false);
      if (type === 'gift-front') setIsUploadingGiftFront(false);
      if (type === 'gift-back') setIsUploadingGiftBack(false);
    }
  };

  const handleCopy = (text: string, isCrypto = false) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (isCrypto) {
        setCopiedCryptoAddress(true);
        setTimeout(() => setCopiedCryptoAddress(false), 2000);
      } else {
        setCopiedBankInfo(true);
        setTimeout(() => setCopiedBankInfo(false), 2000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validation per method
    let finalReference = paymentReference.trim();
    if (paymentMethod === 'Bank Wire Transfer') {
      if (!paymentReference.trim()) {
        setSubmitError('Please enter your wire transaction reference or bank confirmation number.');
        return;
      }
    } else if (paymentMethod === 'Bitcoin / Cryptocurrency') {
      if (!cryptoTxHash.trim()) {
        setSubmitError('Please enter your Bitcoin Transaction ID / Hash (TXID).');
        return;
      }
      finalReference = cryptoTxHash.trim();
    } else if (paymentMethod === 'Gift Card') {
      if (!giftCardCode.trim()) {
        setSubmitError('Please enter the Gift Card claim code or card number.');
        return;
      }
      if (!giftCardImageUrl && !receiptUrl) {
        setSubmitError('Please upload a photo of your Gift Card for verification.');
        return;
      }
      finalReference = `GC-${giftCardType.replace(/\s+/g, '').toUpperCase()}-${giftCardCode.trim().slice(-6)}`;
    }

    if (!termsAgreed) {
      setSubmitError('Please acknowledge that the submitted payment represents an official, genuine transaction.');
      return;
    }

    if (!application) return;

    setIsSubmitting(true);

    try {
      const feeAmount = settings?.fee_amount ? Number(settings.fee_amount) : 2500;
      const feeCurrency = settings?.fee_currency || 'USD';

      const res = await paymentService.submitPayment({
        token: token,
        payment_reference: finalReference.toUpperCase(),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        receipt_url: receiptUrl || giftCardImageUrl,
        receipt_public_id: receiptPublicId,
        amount: feeAmount,
        currency: feeCurrency,
        terms_agreed: termsAgreed,
        crypto_wallet_address: cryptoWalletAddress.trim() || null,
        crypto_tx_hash: cryptoTxHash.trim() || null,
        gift_card_type: paymentMethod === 'Gift Card' ? giftCardType : null,
        gift_card_code: paymentMethod === 'Gift Card' ? giftCardCode.trim() : null,
        gift_card_pin: paymentMethod === 'Gift Card' ? giftCardPin.trim() : null,
        gift_card_image_url: giftCardImageUrl,
        gift_card_back_image_url: giftCardBackImageUrl,
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

  // Token expired / invalid
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
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                STAGE COMPLETED
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Payment Under Review
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                Thank you, <strong className="text-white">{application.full_name}</strong>. Your payment details have been safely received and are currently being verified by management.
              </p>
            </div>

            {/* Reconciliation Card */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-2.5 text-xs text-left font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                <span className="text-slate-400">Application Reference</span>
                <span className="text-amber-300 font-bold">{application.reference_code}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                <span className="text-slate-400">Payment Reference</span>
                <span className="text-white font-bold">{submittedPayment.payment_reference}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                <span className="text-slate-400">Method</span>
                <span className="text-slate-200">{submittedPayment.payment_method}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Amount</span>
                <span className="text-emerald-400 font-bold">
                  {submittedPayment.currency === 'USD' ? '$' : `${submittedPayment.currency} `}
                  {submittedPayment.amount.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Once verified by our finance team, your digital VIP Pass will be issued and unlocked automatically on your continuation page.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/continue/${token}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20"
              >
                View Application Status
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-colors"
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
  const paymentDeadlineHours = settings?.payment_deadline_hours || 48;
  const paymentInstructions = settings?.payment_instructions || 'Bank Wire Transfer Details:\nPlease remit payment using your application reference code.';

  const isBtcEnabled = settings?.bitcoin_enabled ?? true;
  const isGiftCardEnabled = settings?.gift_card_enabled ?? true;
  const cryptoToken = settings?.bitcoin_network || 'Bitcoin (BTC)';
  const cryptoAddress = settings?.bitcoin_wallet_address || 'bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x';
  const cryptoInstructions = settings?.bitcoin_instructions || 'Transfer the exact fee equivalent to the Bitcoin wallet address below or scan the QR code. Keep your Transaction Hash / ID (TXID) for confirmation.';
  const giftCardInstructions = settings?.gift_card_instructions || 'Purchase an approved gift card matching your application fee amount. Enter the claim code / PIN and upload clear photos of the front and back of the card.';
  
  const rawGiftCardTypes = settings?.gift_card_types || 'Apple Gift Card, Steam, Razer Gold, Amazon, Vanilla Visa, Google Play';
  const giftCardOptions = rawGiftCardTypes.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8 animate-fadeIn">
      {/* Back Link */}
      <div>
        <Link
          href={`/continue/${token}`}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37] hover:text-[#E5C07B] transition-colors"
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
            <span>SECURE PAYMENT GATEWAY</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            VIP Admission Payment
          </h1>

          <p className="text-xs sm:text-sm text-slate-400">
            Select your preferred payment method below to finalize your VIP accreditation.
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

        {/* PAYMENT METHOD SELECTOR TABS */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Select Payment Method *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Bank Wire */}
            <button
              type="button"
              onClick={() => setPaymentMethod('Bank Wire Transfer')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                paymentMethod === 'Bank Wire Transfer'
                  ? 'bg-amber-400/10 border-amber-400 text-white shadow-lg shadow-amber-400/10'
                  : 'bg-[#080A10] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.2]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <CreditCard className={`w-5 h-5 ${paymentMethod === 'Bank Wire Transfer' ? 'text-amber-400' : 'text-slate-400'}`} />
                {paymentMethod === 'Bank Wire Transfer' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Bank Wire Transfer</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">SWIFT / IBAN wire</span>
              </div>
            </button>

            {/* Bitcoin / Crypto */}
            {isBtcEnabled && (
              <button
                type="button"
                onClick={() => setPaymentMethod('Bitcoin / Cryptocurrency')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  paymentMethod === 'Bitcoin / Cryptocurrency'
                    ? 'bg-amber-400/10 border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#080A10] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.2]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Coins className={`w-5 h-5 ${paymentMethod === 'Bitcoin / Cryptocurrency' ? 'text-amber-400' : 'text-slate-400'}`} />
                  {paymentMethod === 'Bitcoin / Cryptocurrency' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Bitcoin / Crypto</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{cryptoToken}</span>
                </div>
              </button>
            )}

            {/* Gift Card */}
            {isGiftCardEnabled && (
              <button
                type="button"
                onClick={() => setPaymentMethod('Gift Card')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  paymentMethod === 'Gift Card'
                    ? 'bg-amber-400/10 border-amber-400 text-white shadow-lg shadow-amber-400/10'
                    : 'bg-[#080A10] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.2]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Gift className={`w-5 h-5 ${paymentMethod === 'Gift Card' ? 'text-amber-400' : 'text-slate-400'}`} />
                  {paymentMethod === 'Gift Card' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Gift Card</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Apple, Steam, Amazon</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* INSTRUCTIONS CARD PER METHOD */}
        {paymentMethod === 'Bank Wire Transfer' && (
          <div className="p-6 rounded-2xl bg-[#090C12] border border-white/[0.08] space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Bank Wire Instructions
                </h3>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(paymentInstructions, false)}
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
                    <span>Copy Wire Details</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.04] text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed selection:bg-amber-400/30 selection:text-white">
              {paymentInstructions}
            </div>

            <p className="text-[11px] text-slate-500">
              * Important: Include your Reference Code (<strong className="text-slate-300">{application.reference_code}</strong>) in the wire description.
            </p>
          </div>
        )}

        {paymentMethod === 'Bitcoin / Cryptocurrency' && (
          <div className="p-6 rounded-2xl bg-[#090C12] border border-amber-500/20 space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                    Bitcoin & Crypto Payment
                  </h3>
                  <span className="text-[11px] text-amber-300 font-mono">Accepted Token: {cryptoToken}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(cryptoAddress, true)}
                className="px-3 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-medium text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                {copiedCryptoAddress ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Address Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Wallet Address</span>
                  </>
                )}
              </button>
            </div>

            {/* QR Code & Wallet Address Display */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-black/60 border border-white/[0.06]">
              {generatedBitcoinQr && (
                <div className="p-3 bg-white rounded-2xl border border-white/[0.2] shadow-xl shrink-0">
                  <img
                    src={generatedBitcoinQr}
                    alt="Bitcoin Wallet QR Code"
                    className="w-36 h-36 object-contain"
                  />
                  <span className="text-[10px] text-black font-mono font-bold block text-center mt-1">SCAN TO PAY</span>
                </div>
              )}

              <div className="space-y-2 text-xs font-mono w-full">
                <span className="text-[10px] uppercase text-slate-500 block">Verified Receiving Address</span>
                <div className="p-3 rounded-xl bg-black/80 border border-white/[0.08] text-amber-300 font-mono break-all text-xs select-all">
                  {cryptoAddress}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans pt-1">
                  {cryptoInstructions}
                </p>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'Gift Card' && (
          <div className="p-6 rounded-2xl bg-[#090C12] border border-emerald-500/20 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
              <Gift className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Gift Card Payment Instructions
                </h3>
                <span className="text-[11px] text-emerald-300">Accepted: {rawGiftCardTypes}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-white/[0.04] text-xs text-slate-300 leading-relaxed">
              <p>{giftCardInstructions}</p>
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                💡 Tip: Ensure the card value covers the fee of <strong>{feeCurrency === 'USD' ? '$' : `${feeCurrency} `}{feeAmount.toLocaleString()}</strong>. Multiple cards can be combined if needed.
              </div>
            </div>
          </div>
        )}

        {/* SUBMISSION FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* METHOD SPECIFIC INPUTS */}
          {paymentMethod === 'Bank Wire Transfer' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Transaction Reference / Wire Confirmation Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. WT-948201-NYC or BANK-REF-88421"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 uppercase transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Payment Execution Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                  required
                />
              </div>

              {/* Wire Receipt Upload */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Wire Transfer Receipt Voucher (Optional but Recommended)
                </label>
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFile(f, 'receipt');
                  }}
                />

                {!receiptUrl && !isUploadingReceipt ? (
                  <div
                    onClick={() => receiptInputRef.current?.click()}
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
                        Supports JPG, PNG, WEBP, or PDF (Max 15MB)
                      </p>
                    </div>
                  </div>
                ) : isUploadingReceipt ? (
                  <div className="p-6 rounded-2xl bg-[#080A10] border border-white/[0.1] text-center space-y-3">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
                    <p className="text-xs text-slate-300 font-mono">Uploading voucher ({receiptProgress}%)...</p>
                    <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${receiptProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#080A10] border border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 truncate">
                      {receiptPreview ? (
                        <img src={receiptPreview} alt="Receipt preview" className="w-12 h-12 rounded-xl object-cover border border-white/[0.1]" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center text-emerald-400">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white block truncate">{receiptFileName || 'Receipt Voucher Attached'}</span>
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                          <Check className="w-3 h-3" /> Attached for Review
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setReceiptUrl(null); setReceiptPreview(null); }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {paymentMethod === 'Bitcoin / Cryptocurrency' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Transaction Hash / ID (TXID) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7c94b7c84a2f8d3e1a6c0b5e9f2d4... or txid"
                  value={cryptoTxHash}
                  onChange={(e) => setCryptoTxHash(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-amber-300 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Provided by your wallet / exchange upon broadcast.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Your Sender Wallet Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Address you transferred from (for rapid reconciliation)"
                  value={cryptoWalletAddress}
                  onChange={(e) => setCryptoWalletAddress(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Transaction Screenshot Upload */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Wallet Debit Screenshot / Proof (Optional)
                </label>
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadFile(f, 'receipt');
                  }}
                />

                {!receiptUrl && !isUploadingReceipt ? (
                  <div
                    onClick={() => receiptInputRef.current?.click()}
                    className="p-5 rounded-2xl border-2 border-dashed border-white/[0.1] hover:border-amber-400/50 bg-[#080A10] cursor-pointer transition-colors text-center space-y-1.5 group"
                  >
                    <UploadCloud className="w-6 h-6 text-slate-400 mx-auto group-hover:text-amber-300" />
                    <p className="text-xs font-semibold text-slate-200">Tap to upload transfer screenshot</p>
                    <p className="text-[11px] text-slate-500">Supports JPG, PNG (Max 15MB)</p>
                  </div>
                ) : isUploadingReceipt ? (
                  <div className="p-4 rounded-2xl bg-[#080A10] border border-white/[0.1] text-center space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-400 mx-auto" />
                    <p className="text-xs text-slate-300 font-mono">Uploading screenshot...</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-[#080A10] border border-emerald-500/30 flex items-center justify-between gap-3">
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 truncate">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{receiptFileName || 'Proof Image Attached'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => { setReceiptUrl(null); setReceiptPreview(null); }}
                      className="p-1 text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {paymentMethod === 'Gift Card' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Gift Card Brand *
                </label>
                <select
                  value={giftCardType}
                  onChange={(e) => setGiftCardType(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                  required
                >
                  {giftCardOptions.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                  <option value="Other Approved Gift Card">Other Approved Card</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Claim Code / Card Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter claim code"
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 uppercase transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Card PIN / Security Code
                  </label>
                  <input
                    type="text"
                    placeholder="PIN (if applicable)"
                    value={giftCardPin}
                    onChange={(e) => setGiftCardPin(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-xs sm:text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              {/* Upload Front and Back of Gift Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Front Photo */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Front of Card Photo *
                  </label>
                  <input
                    ref={giftFrontInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadFile(f, 'gift-front');
                    }}
                  />
                  {!giftCardImageUrl && !isUploadingGiftFront ? (
                    <div
                      onClick={() => giftFrontInputRef.current?.click()}
                      className="p-5 rounded-2xl border-2 border-dashed border-white/[0.1] hover:border-emerald-400/50 bg-[#080A10] cursor-pointer text-center space-y-1 transition-colors"
                    >
                      <UploadCloud className="w-5 h-5 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-200">Upload Card Front</p>
                      <p className="text-[10px] text-slate-500">Showing card face</p>
                    </div>
                  ) : isUploadingGiftFront ? (
                    <div className="p-4 rounded-2xl bg-[#080A10] border border-white/[0.1] text-center space-y-2">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-400 mx-auto" />
                      <p className="text-xs text-slate-300 font-mono">Uploading...</p>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-black/60 p-2 flex items-center justify-between">
                      <img src={giftCardImageUrl!} alt="Gift Card Front" className="w-16 h-12 object-cover rounded-lg" />
                      <span className="text-[11px] text-emerald-300 font-medium">Front Attached</span>
                      <button
                        type="button"
                        onClick={() => setGiftCardImageUrl(null)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Back Photo */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Back of Card Photo (Showing PIN) *
                  </label>
                  <input
                    ref={giftBackInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadFile(f, 'gift-back');
                    }}
                  />
                  {!giftCardBackImageUrl && !isUploadingGiftBack ? (
                    <div
                      onClick={() => giftBackInputRef.current?.click()}
                      className="p-5 rounded-2xl border-2 border-dashed border-white/[0.1] hover:border-emerald-400/50 bg-[#080A10] cursor-pointer text-center space-y-1 transition-colors"
                    >
                      <UploadCloud className="w-5 h-5 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-200">Upload Card Back</p>
                      <p className="text-[10px] text-slate-500">Showing code & PIN</p>
                    </div>
                  ) : isUploadingGiftBack ? (
                    <div className="p-4 rounded-2xl bg-[#080A10] border border-white/[0.1] text-center space-y-2">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-400 mx-auto" />
                      <p className="text-xs text-slate-300 font-mono">Uploading...</p>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-emerald-500/40 bg-black/60 p-2 flex items-center justify-between">
                      <img src={giftCardBackImageUrl!} alt="Gift Card Back" className="w-16 h-12 object-cover rounded-lg" />
                      <span className="text-[11px] text-emerald-300 font-medium">Back Attached</span>
                      <button
                        type="button"
                        onClick={() => setGiftCardBackImageUrl(null)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Legal Acknowledgement Checkbox */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-white/[0.2] bg-white/[0.05] text-amber-400 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer h-4 w-4"
                required
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                I confirm that I have sent this payment for application <strong className="text-white">{application.reference_code}</strong> using the details provided above.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[52px] py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-black font-extrabold text-xs uppercase tracking-widest transition-all shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Submit Payment for Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
