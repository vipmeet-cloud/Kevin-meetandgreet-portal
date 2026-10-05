import { useState, useEffect } from 'react';
import { useRouter, useParams, Link } from '../../router/Router';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/paymentService';
import { passService } from '../../services/passService';
import { PaymentRecord, getPublicPaymentStatusLabel } from '../../types/payment';
import { VipPassRecord, getPassStatusDisplay } from '../../types/vipPass';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  X, 
  Send, 
  MessageSquare,
  Eye,
  DollarSign,
  Sparkles,
  QrCode,
  Coins,
  Gift
} from 'lucide-react';

export function PaymentDetailPage() {
  const router = useRouter();
  const id = router.params?.id || router.path.split('/').pop() || '';
  const { user } = useAuth();

  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [pass, setPass] = useState<VipPassRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [showClarifyModal, setShowClarifyModal] = useState(false);
  const [clarifyMessage, setClarifyMessage] = useState('');
  const [isClarifying, setIsClarifying] = useState(false);

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState('Payment Document');
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedCryptoTx, setCopiedCryptoTx] = useState(false);
  const [copiedGiftCode, setCopiedGiftCode] = useState(false);

  const loadPayment = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await paymentService.fetchPaymentById(id);
      if (res.error || !res.payment) {
        setErrorMessage(res.error || 'Payment record not found');
      } else {
        setPayment(res.payment);
        if (res.payment.application_id) {
          const foundPass = await passService.fetchPassByApplicationId(res.payment.application_id);
          setPass(foundPass);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve payment record';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayment();
  }, [id]);

  const handleCopyRef = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleCopyCrypto = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCryptoTx(true);
      setTimeout(() => setCopiedCryptoTx(false), 2000);
    }
  };

  const handleCopyGift = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedGiftCode(true);
      setTimeout(() => setCopiedGiftCode(false), 2000);
    }
  };

  // Section 19: Confirm Payment with mandatory confirmation dialog
  const handleConfirm = async () => {
    if (!payment || !user) return;
    setIsConfirming(true);

    try {
      const res = await paymentService.confirmPayment(
        payment.id,
        user.id,
        user.email || 'management@vip-portal.com',
        confirmNotes
      );

      if (res.success) {
        setShowConfirmModal(false);
        setConfirmNotes('');
        await loadPayment();
      } else {
        alert(res.error || 'Failed to confirm payment');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error confirming payment';
      alert(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  // Section 19: Reject Payment with mandatory reason
  const handleReject = async () => {
    if (!payment || !user || !rejectReason.trim()) return;
    setIsRejecting(true);

    try {
      const res = await paymentService.rejectPayment(
        payment.id,
        user.id,
        user.email || 'management@vip-portal.com',
        rejectReason
      );

      if (res.success) {
        setShowRejectModal(false);
        setRejectReason('');
        await loadPayment();
      } else {
        alert(res.error || 'Failed to reject payment');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error rejecting payment';
      alert(msg);
    } finally {
      setIsRejecting(false);
    }
  };

  // Section 19: Request Clarification with mandatory message
  const handleClarify = async () => {
    if (!payment || !user || !clarifyMessage.trim()) return;
    setIsClarifying(true);

    try {
      const res = await paymentService.requestClarification(
        payment.id,
        user.id,
        user.email || 'management@vip-portal.com',
        clarifyMessage
      );

      if (res.success) {
        setShowClarifyModal(false);
        setClarifyMessage('');
        await loadPayment();
      } else {
        alert(res.error || 'Failed to request clarification');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error requesting clarification';
      alert(msg);
    } finally {
      setIsClarifying(false);
    }
  };

  if (isLoading) {
    return (
      <ManagementLayout title="Payment Review">
        <div className="p-16 text-center text-xs font-mono text-slate-400 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <p>Retrieving payment record & transaction audit trail...</p>
        </div>
      </ManagementLayout>
    );
  }

  if (errorMessage || !payment) {
    return (
      <ManagementLayout title="Payment Review">
        <div className="p-10 max-w-lg mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Record Not Found</h3>
          <p className="text-xs text-slate-400">{errorMessage || 'The requested payment record does not exist.'}</p>
          <Link
            href="/management/payments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-950 font-semibold text-xs rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Payments Roster</span>
          </Link>
        </div>
      </ManagementLayout>
    );
  }

  const app = payment.application;

  return (
    <ManagementLayout
      title={`Payment Review: ${payment.payment_reference}`}
      subtitle="Reconcile applicant wire transaction, inspect transfer proof, and execute administrative determination."
    >
      <div className="space-y-6 animate-fadeIn pb-12">
        
        {/* Back navigation & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Link
            href="/management/payments"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Payments Roster</span>
          </Link>

          {/* Action CTAs: Confirm, Reject, Clarification */}
          <div className="flex flex-wrap items-center gap-2.5">
            {payment.status !== 'PAYMENT_CONFIRMED' && (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Payment</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowClarifyModal(true)}
              className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] text-white border border-white/[0.1] font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Request Clarification</span>
            </button>

            {payment.status !== 'PAYMENT_REJECTED' && (
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] text-rose-300 border border-rose-500/30 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Payment</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Alert Banner */}
        {payment.status === 'PAYMENT_CONFIRMED' ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">Payment Confirmed — VIP Pass Ready</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Verified by management on {new Date(payment.reviewed_at || payment.updated_at).toLocaleString()}.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold uppercase self-start sm:self-auto">
                Confirmed
              </span>
            </div>

            {pass && (
              <div className="pt-3 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <span>VIP Pass: <strong className="text-white font-mono">{pass.pass_number}</strong></span>
                  <span className="text-emerald-400 font-medium">({pass.status})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/vip-pass/${pass.verification_token}`}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-medium inline-flex items-center gap-1.5 transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>View Pass</span>
                  </Link>
                  <Link
                    href={`/verify/${pass.verification_token}`}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-medium inline-flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verify Pass</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : payment.status === 'PAYMENT_REJECTED' ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>Payment Rejected</span>
            </div>
            <p className="text-xs text-slate-300">
              Reason: {payment.rejection_reason || 'Transaction could not be verified.'}
            </p>
          </div>
        ) : payment.status === 'CLARIFICATION_REQUIRED' ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>Clarification Pending from Applicant</span>
            </div>
            <p className="text-xs text-slate-300">
              Message: {payment.management_note || 'Clarification requested by management.'}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">Payment Submitted — Awaiting Management Review</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Submitted on {new Date(payment.submitted_at).toLocaleString()}. Match reference against incoming bank wire records.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-mono font-bold uppercase">
              Under Review
            </span>
          </div>
        )}

        {/* 2-Column Review Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Payment Transaction Details & Proof (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Transaction Data Card */}
            <div className="p-6 rounded-3xl bg-[#0C0F17] border border-white/[0.08] space-y-5 shadow-xl">
              <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Transaction Overview</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">ID: {payment.id.substring(0, 8)}...</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.04]">
                  <span className="text-[10px] uppercase text-slate-500 block">Payment Reference</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-amber-300 text-sm tracking-wider">{payment.payment_reference}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyRef(payment.payment_reference)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Copy Payment Reference"
                    >
                      {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.04]">
                  <span className="text-[10px] uppercase text-slate-500 block">Verified Amount</span>
                  <span className="font-bold text-white text-sm mt-1 block">
                    {payment.currency === 'USD' ? '$' : `${payment.currency} `}{payment.amount.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.04]">
                  <span className="text-[10px] uppercase text-slate-500 block">Payment Method</span>
                  <span className="text-slate-200 mt-1 block truncate">{payment.payment_method}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.04]">
                  <span className="text-[10px] uppercase text-slate-500 block">Transaction Date</span>
                  <span className="text-slate-200 mt-1 block">{payment.payment_date}</span>
                </div>
              </div>
            </div>

            {/* Cryptocurrency Verification Card (if Bitcoin/Crypto) */}
            {(payment.payment_method?.includes('Bitcoin') || payment.crypto_tx_hash) && (
              <div className="p-6 rounded-3xl bg-[#0C0F17] border border-amber-500/30 space-y-4 shadow-xl animate-fadeIn">
                <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>Cryptocurrency Transaction Verification</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-400/20 text-amber-300 font-bold">
                    BTC / Blockchain
                  </span>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.04] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-slate-500">Transaction ID / Hash (TXID)</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCrypto(payment.crypto_tx_hash || payment.payment_reference)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        {copiedCryptoTx ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy TXID</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-amber-300 font-bold break-all select-all pt-0.5">
                      {payment.crypto_tx_hash || payment.payment_reference}
                    </div>
                    <div className="pt-1.5 flex items-center gap-2">
                      <a
                        href={`https://mempool.space/tx/${payment.crypto_tx_hash || payment.payment_reference}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        <span>Check on Mempool / Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {payment.crypto_wallet_address && (
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.04] space-y-1">
                      <span className="text-[10px] uppercase text-slate-500 block">Applicant Sender Address</span>
                      <span className="text-slate-200 font-mono break-all block select-all">
                        {payment.crypto_wallet_address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gift Card Verification Card (if Gift Card) */}
            {(payment.payment_method?.includes('Gift Card') || payment.gift_card_code) && (
              <div className="p-6 rounded-3xl bg-[#0C0F17] border border-emerald-500/30 space-y-4 shadow-xl animate-fadeIn">
                <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    <span>Gift Card Verification Details</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-400/20 text-emerald-300 font-bold">
                    {payment.gift_card_type || 'Gift Card'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.04] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-slate-500">Claim Code / Number</span>
                      {payment.gift_card_code && (
                        <button
                          type="button"
                          onClick={() => handleCopyGift(payment.gift_card_code!)}
                          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                        >
                          {copiedGiftCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <span className="text-emerald-300 font-bold text-sm block select-all">
                      {payment.gift_card_code || '—'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.04] space-y-1">
                    <span className="text-[10px] uppercase text-slate-500 block">Security PIN</span>
                    <span className="text-white font-bold text-sm block select-all">
                      {payment.gift_card_pin || 'No PIN Required / N/A'}
                    </span>
                  </div>
                </div>

                {/* Gift Card Photos */}
                {(payment.gift_card_image_url || payment.gift_card_back_image_url) && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Uploaded Gift Card Photos</span>
                    <div className="grid grid-cols-2 gap-3">
                      {payment.gift_card_image_url && (
                        <div
                          onClick={() => {
                            setPreviewModalUrl(payment.gift_card_image_url || null);
                            setPreviewModalTitle('Gift Card Front');
                            setShowReceiptModal(true);
                          }}
                          className="relative rounded-2xl overflow-hidden border border-white/[0.1] bg-black/40 max-h-48 cursor-pointer group p-2 text-center"
                        >
                          <img
                            src={payment.gift_card_image_url}
                            alt="Gift Card Front"
                            className="max-h-40 w-auto mx-auto object-contain rounded-xl"
                          />
                          <span className="text-[10px] text-slate-400 block mt-1">Front Face (Tap to Zoom)</span>
                        </div>
                      )}

                      {payment.gift_card_back_image_url && (
                        <div
                          onClick={() => {
                            setPreviewModalUrl(payment.gift_card_back_image_url || null);
                            setPreviewModalTitle('Gift Card Back');
                            setShowReceiptModal(true);
                          }}
                          className="relative rounded-2xl overflow-hidden border border-white/[0.1] bg-black/40 max-h-48 cursor-pointer group p-2 text-center"
                        >
                          <img
                            src={payment.gift_card_back_image_url}
                            alt="Gift Card Back"
                            className="max-h-40 w-auto mx-auto object-contain rounded-xl"
                          />
                          <span className="text-[10px] text-slate-400 block mt-1">Back with Barcode & PIN</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Uploaded Receipt Viewer (Section 18) */}
            <div className="p-6 rounded-3xl bg-[#0C0F17] border border-white/[0.08] space-y-4 shadow-xl">
              <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Transfer Proof / Receipt Voucher</span>
                </h3>
              </div>

              {payment.receipt_url ? (
                <div className="space-y-3">
                  <div 
                    onClick={() => setShowReceiptModal(true)}
                    className="relative rounded-2xl overflow-hidden border border-white/[0.1] bg-black/40 max-h-80 cursor-pointer group flex items-center justify-center p-2"
                  >
                    {payment.receipt_url.endsWith('.pdf') ? (
                      <div className="p-8 text-center space-y-2">
                        <FileText className="w-12 h-12 text-emerald-400 mx-auto" />
                        <span className="text-xs font-semibold text-white block">PDF Document Attached</span>
                        <span className="text-[11px] text-slate-400">Click to open document</span>
                      </div>
                    ) : (
                      <img
                        src={payment.receipt_url}
                        alt="Wire transfer receipt"
                        className="max-h-72 w-auto object-contain rounded-xl transition-transform group-hover:scale-[1.02]"
                      />
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold">
                      <Eye className="w-4 h-4" />
                      <span>Click to Enlarge</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[11px]">Storage: Cloudinary Verified URL</span>
                    <a
                      href={payment.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      <span>Open Full Size</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-black/30 border border-white/[0.04] text-center space-y-2 text-xs text-slate-400">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No receipt image was uploaded by the applicant.</p>
                  <p className="text-[11px] text-slate-500">Reconciliation relies on matching the reference code in bank records.</p>
                </div>
              )}
            </div>

            {/* Payment History Audit Timeline (Section 24) */}
            <div className="p-6 rounded-3xl bg-[#0C0F17] border border-white/[0.08] space-y-4 shadow-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Payment Event History</span>
              </h3>

              {payment.history && payment.history.length > 0 ? (
                <div className="space-y-3 font-mono text-xs divide-y divide-white/[0.04]">
                  {payment.history.map((event: any) => (
                    <div key={event.id} className="pt-3 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">ACTION: {event.action}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(event.created_at || event.timestamp || Date.now()).toLocaleString()}
                        </span>
                      </div>
                      {(event.notes || event.note) && (
                        <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{event.notes || event.note}</p>
                      )}
                      {(event.actor_email || event.actor) && (
                        <span className="text-[10px] text-slate-500 block">Actor: {event.actor_email || event.actor}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-mono">No prior review iterations recorded.</p>
              )}
            </div>

          </div>

          {/* Right Column: Applicant Dossier & Fast Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Applicant Summary Card */}
            <div className="p-6 rounded-3xl bg-[#0C0F17] border border-white/[0.08] space-y-5 shadow-xl">
              <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Applicant Dossier</span>
                </h3>
                {app && (
                  <Link
                    href={`/management/applications/${app.id}`}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1"
                  >
                    <span>View Full File</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {app ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Full Legal Name</span>
                    <span className="text-base font-bold text-white mt-0.5 block">{app.full_name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">App Reference</span>
                      <span className="font-bold text-amber-300">{app.reference_code}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Allocated Guests</span>
                      <span className="text-white font-bold">{app.attendee_count} Attendee(s)</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{app.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{app.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{app.city}, {app.country}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.04] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block">Approved Session</span>
                    <span className="text-white font-semibold block">{app.preferred_date}</span>
                    <span className="text-amber-300 block text-[11px]">{app.preferred_session}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Applicant data linked via reference: {payment.application_id}</p>
              )}
            </div>

            {/* Reconciliation Checklist Guide */}
            <div className="p-6 rounded-3xl bg-[#0C0F17] border border-white/[0.08] space-y-3 shadow-xl text-xs">
              <h4 className="font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verification Checklist</span>
              </h4>
              <ul className="space-y-2 text-slate-400 text-[11px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Verify exact amount matches the fee requirement ({payment.currency} {payment.amount.toLocaleString()}).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Match reference code <strong className="text-slate-200">{payment.payment_reference}</strong> on official bank escrow feed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>Confirming payment transitions application to <em>“Payment Confirmed — VIP Pass Pending”</em>.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>

      {/* CONFIRM PAYMENT MODAL (Section 19: Mandatory confirmation modal) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0F121C] border border-emerald-500/30 space-y-5 shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">
                Confirm that this payment has been verified?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This action will mark the transaction as verified, transition the applicant status to <strong className="text-emerald-400">“Payment Confirmed — VIP Pass Pending”</strong>, and log an immutable audit event.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.04] text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="text-white font-bold">{app?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="text-amber-300 font-bold">{payment.payment_reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="text-white">{payment.currency} {payment.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Management Verification Note (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Wire confirmed on bank statement ref #84920."
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080A10] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isConfirming}
                onClick={handleConfirm}
                className="w-1/2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Confirm Payment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PAYMENT MODAL (Section 19: Requires reason) */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0F121C] border border-rose-500/30 space-y-5 shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Reject Payment Record</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Provide a clear reason. The applicant will be notified that payment requires attention and will be permitted to resubmit.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Wire transfer reference could not be located in bank escrow statements within 7 business days."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080A10] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-400"
                required
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="w-1/2 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isRejecting || !rejectReason.trim()}
                onClick={handleReject}
                className="w-1/2 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <span>Reject Payment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLARIFICATION REQUEST MODAL (Section 19: Requires message) */}
      {showClarifyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0F121C] border border-indigo-500/30 space-y-5 shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Request Payment Clarification</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Specify what additional proof or confirmation is needed from the applicant.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Clarification Message *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Please provide a clear PDF bank statement showing the sender account name matching your dossier."
                value={clarifyMessage}
                onChange={(e) => setClarifyMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#080A10] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400"
                required
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowClarifyModal(false)}
                className="w-1/2 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isClarifying || !clarifyMessage.trim()}
                onClick={handleClarify}
                className="w-1/2 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isClarifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Send Request</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENLARGED RECEIPT / CARD MODAL */}
      {showReceiptModal && (previewModalUrl || payment.receipt_url) && (
        <div 
          onClick={() => {
            setShowReceiptModal(false);
            setPreviewModalUrl(null);
          }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-3xl max-h-[90vh] p-4 bg-[#0C0F17] rounded-3xl border border-white/[0.1] shadow-2xl space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                {previewModalTitle}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowReceiptModal(false);
                  setPreviewModalUrl(null);
                }}
                className="p-1.5 bg-black/60 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewModalUrl || payment.receipt_url!}
              alt="Enlarged Document"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

    </ManagementLayout>
  );
}
