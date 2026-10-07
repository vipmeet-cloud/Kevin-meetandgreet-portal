import { useState, useEffect } from 'react';
import { useRouter, useParams, Link } from '../../router/Router';
import { useAuth } from '../../context/AuthContext';
import { applicationService } from '../../services/applicationService';
import { passService } from '../../services/passService';
import { ApplicationRecord, getPublicStatusLabel, AuditLogRecord } from '../../types/application';
import { VipPassRecord, getPassStatusDisplay } from '../../types/vipPass';
import { ManagementLayout } from '../../components/management/ManagementLayout';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
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
  Sparkles,
  QrCode,
  Ban
} from 'lucide-react';

export function ApplicationDetailPage() {
  const router = useRouter();
  const params = router.params;
  const id = params?.id || router.path.split('/').pop() || '';
  const { user } = useAuth();

  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [pass, setPass] = useState<VipPassRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{
    continuationUrl: string;
    expiresAt: string;
  } | null>(null);

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);

  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);

  const loadApplication = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await applicationService.fetchApplicationById(id);
      if (res.error || !res.application) {
        setErrorMessage(res.error || 'Application not found');
      } else {
        setApplication(res.application);
        // Also fetch pass if available
        const foundPass = await passService.fetchPassByApplicationId(res.application.id);
        setPass(foundPass);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve application';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  const handleApprove = async () => {
    if (!application || !user) return;
    setIsApproving(true);
    try {
      const res = await applicationService.approveApplication(
        application.id,
        user.id,
        user.email || 'management@aura-vip.com',
        approveNotes
      );

      if (res.success && res.continuationUrl) {
        setApprovalResult({
          continuationUrl: res.continuationUrl,
          expiresAt: res.expiresAt || '',
        });
        loadApplication();
      } else {
        alert(res.error || 'Approval failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error approving application';
      alert(msg);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDecline = async () => {
    if (!application || !user || !declineReason.trim()) return;
    setIsDeclining(true);
    try {
      const res = await applicationService.declineApplication(
        application.id,
        user.id,
        user.email || 'management@aura-vip.com',
        declineReason
      );

      if (res.success) {
        setShowDeclineModal(false);
        setDeclineReason('');
        loadApplication();
      } else {
        alert(res.error || 'Decline failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error declining application';
      alert(msg);
    } finally {
      setIsDeclining(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!application || !user || !requestMessage.trim()) return;
    setIsRequesting(true);
    try {
      const res = await applicationService.requestInformation(
        application.id,
        user.id,
        user.email || 'management@aura-vip.com',
        requestMessage
      );

      if (res.success) {
        setShowRequestInfoModal(false);
        setRequestMessage('');
        loadApplication();
      } else {
        alert(res.error || 'Request failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error requesting information';
      alert(msg);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCopyContinuationLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRevokePass = async () => {
    if (!pass || !revokeReason.trim()) {
      alert('Please enter a reason for revoking the VIP Pass.');
      return;
    }
    setIsRevoking(true);
    try {
      const res = await passService.revokePass(
        pass.id,
        revokeReason,
        user?.id,
        user?.email
      );

      if (res.success) {
        setShowRevokeModal(false);
        setRevokeReason('');
        await loadApplication();
      } else {
        alert(res.error || 'Failed to revoke pass.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error revoking pass';
      alert(msg);
    } finally {
      setIsRevoking(false);
    }
  };

  if (isLoading) {
    return (
      <ManagementLayout title="Applicant Dossier" subtitle="Loading record...">
        <div className="p-16 text-center text-xs text-slate-400 font-mono space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
          <p>Decrypting applicant records...</p>
        </div>
      </ManagementLayout>
    );
  }

  if (errorMessage || !application) {
    return (
      <ManagementLayout title="Applicant Dossier" subtitle="Record unavailable">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#0C0F17] border border-white/[0.08] text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">Application Record Not Found</h3>
          <p className="text-xs text-slate-400">{errorMessage || 'The requested application could not be located.'}</p>
          <Link
            href="/management/applications"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Applications</span>
          </Link>
        </div>
      </ManagementLayout>
    );
  }

  const isApproved = application.status === 'APPROVED_AWAITING_COMPLETION' || application.status === 'APPROVED';
  const isDeclined = application.status === 'DECLINED';
  const isInfoRequired = application.status === 'INFORMATION_REQUIRED' || application.status === 'ADDITIONAL_INFO_REQUIRED';

  return (
    <ManagementLayout
      title={`Dossier: ${application.full_name}`}
      subtitle={`Reference ${application.reference_code} · Logged ${new Date(application.created_at).toLocaleDateString()}`}
    >
      <div className="space-y-8 animate-fadeIn max-w-5xl">
        
        {/* Back Link & Quick Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <Link
            href="/management/applications"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Applications</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Current Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                isApproved
                  ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                  : isDeclined
                  ? 'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                  : isInfoRequired
                  ? 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-300'
                  : 'bg-amber-500/10 border border-amber-500/25 text-amber-300'
              }`}
            >
              {getPublicStatusLabel(application.status)}
            </span>
          </div>
        </div>

        {/* Existing Continuation Token Banner if already approved */}
        {isApproved && application.continuation_token && (
          <div className="p-5 sm:p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Approved Continuation Link Active</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Expires: {application.continuation_token_expires_at ? new Date(application.continuation_token_expires_at).toLocaleDateString() : '7 Days'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/continue/${application.continuation_token}`}
                className="flex-1 min-w-0 w-full px-4 py-2.5 bg-black/60 border border-white/[0.1] rounded-xl text-xs font-mono text-emerald-300 select-all truncate"
              />
              <button
                type="button"
                onClick={() => handleCopyContinuationLink(`${window.location.origin}/continue/${application.continuation_token}`)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        )}

        {/* VIP Pass Banner & Management Controls */}
        {pass && (
          <div className="p-5 sm:p-6 rounded-3xl bg-[#0F1422] border-2 border-[#D4AF37]/50 text-white space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-[#D4AF37] block">VIP Pass Issued</span>
                  <span className="text-xl font-mono font-bold text-white">{pass.pass_number}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const statusInfo = getPassStatusDisplay(pass.status);
                  return (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusInfo.bgClass} ${statusInfo.borderClass} ${statusInfo.colorClass}`}>
                      {statusInfo.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block">Verification Token: <span className="font-mono text-slate-300">{pass.verification_token.substring(0, 16)}...</span></span>
                <span className="text-slate-400 block">Issued: {new Date(pass.issued_at).toLocaleString()}</span>
                {pass.status === 'REVOKED' && (
                  <span className="text-rose-400 block font-semibold mt-1">Reason for Cancellation: {pass.revocation_reason}</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href={`/vip-pass/${pass.verification_token}`}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-xs transition-all inline-flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>View VIP Pass</span>
                </Link>

                <Link
                  href={`/verify/${pass.verification_token}`}
                  className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-xs transition-all inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Check Verification</span>
                </Link>

                {pass.status !== 'REVOKED' && (
                  <button
                    type="button"
                    onClick={() => setShowRevokeModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-400" />
                    <span>Revoke Pass</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phase 4 Payment Stage Active Banner */}
        {['PAYMENT_SUBMITTED', 'PAYMENT_UNDER_REVIEW', 'PAYMENT_CONFIRMED_AWAITING_PASS', 'PAYMENT_REJECTED', 'PAYMENT_CLARIFICATION_REQUIRED'].includes(application.status) && (
          <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-mono font-semibold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Payment Stage Active: {getPublicStatusLabel(application.status)}</span>
              </span>
              <Link
                href="/management/payments"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
              >
                <span>Open Payments Roster</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Decline Reason Banner if declined */}
        {isDeclined && application.decline_reason && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs space-y-1">
            <span className="font-semibold block text-white">Decline Explanation Recorded:</span>
            <p className="leading-relaxed text-slate-300">“{application.decline_reason}”</p>
          </div>
        )}

        {/* Information Request Banner if info requested */}
        {isInfoRequired && application.information_requested_message && (
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs space-y-1">
            <span className="font-semibold block text-white">Information Requested by Management:</span>
            <p className="leading-relaxed text-slate-300">“{application.information_requested_message}”</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (2 Cols): Overview & Parameters */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Applicant Profile Card */}
            <div className="p-6 rounded-3xl bg-[#0C0F17] border border-white/[0.08] space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
                <User className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Applicant Overview
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Full Legal Name</span>
                  <span className="text-white font-medium text-sm mt-0.5 block">{application.full_name}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Email Address</span>
                  <a href={`mailto:${application.email}`} className="text-white font-mono text-xs mt-0.5 block hover:underline truncate">
                    {application.email}
                  </a>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Telephone Contact</span>
                  <a href={`tel:${application.phone}`} className="text-white font-mono text-xs mt-0.5 block hover:underline">
                    {application.phone}
                  </a>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Geographic Origin</span>
                  <span className="text-white font-medium text-xs mt-0.5 block">
                    {application.city}, {application.country}
                  </span>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-slate-500 text-[10px] uppercase font-mono">Preferred Channel:</span>
                  <span className="text-amber-400 font-mono font-semibold uppercase text-xs">
                    {application.preferred_contact_method}
                  </span>
                </div>
              </div>
            </div>

            {/* Meet & Greet Session Details Card */}
            <div className="p-6 rounded-3xl bg-[#0C0F17] border border-white/[0.08] space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Requested Meet & Greet Session
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Requested Date</span>
                  <span className="text-white font-medium text-sm mt-0.5 block">{application.preferred_date}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Session Slot</span>
                  <span className="text-amber-300 font-medium text-xs mt-0.5 block">{application.preferred_session}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Total Attendee Count</span>
                  <span className="text-white font-mono text-sm mt-0.5 block">
                    {application.attendee_count} {application.attendee_count === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-mono block">Special Accommodations</span>
                  <span className="text-slate-300 text-xs mt-0.5 block">
                    {application.special_requirements || 'None Specified'}
                  </span>
                </div>

                {application.message_to_management && (
                  <div className="sm:col-span-2 pt-3 border-t border-white/[0.04]">
                    <span className="text-slate-500 text-[10px] uppercase font-mono block">Message to Management</span>
                    <p className="text-slate-300 text-xs italic mt-1 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                      “{application.message_to_management}”
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Supporting Credentials Card */}
            <div className="p-6 rounded-3xl bg-[#0C0F17] border border-white/[0.08] space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Supporting Files & Verification Credentials
                </h3>
              </div>

              {application.application_files && application.application_files.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {application.application_files.map((f) => (
                    <div key={f.id} className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/[0.08]">
                        <img src={f.cloudinary_url} alt="Credential preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate flex-1">
                        <span className="text-xs font-medium text-white block truncate">{f.file_type || 'Attachment'}</span>
                        <a
                          href={f.cloudinary_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-1 font-mono mt-0.5"
                        >
                          <span>Open Full Size</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-slate-500 italic">
                  No additional verification files uploaded with this submission. Standard photo ID check applies upon venue check-in.
                </div>
              )}
            </div>

            {/* Terms Governance Audit */}
            <div className="p-5 rounded-2xl bg-[#0C0F17] border border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Terms Version {application.terms_version} Accepted</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Logged: {new Date(application.terms_accepted_at).toLocaleString()}
              </span>
            </div>

          </div>

          {/* Right Column (1 Col): Management Actions & Audit Log */}
          <div className="space-y-6">
            
            {/* Action Card */}
            <div className="p-6 rounded-3xl bg-[#0F121C] border border-white/[0.08] space-y-5 shadow-2xl">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Management Decision
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Approve to dispatch cryptographic continuation token, decline with explanation, or request supplementary information.
              </p>

              <div className="space-y-2.5 pt-2">
                {/* Approve Button */}
                <button
                  type="button"
                  onClick={() => setShowApproveModal(true)}
                  disabled={isApproved}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isApproved ? 'Approved' : 'Approve Application'}</span>
                </button>

                {/* Request Info Button */}
                <button
                  type="button"
                  onClick={() => setShowRequestInfoModal(true)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.98] text-indigo-300 border border-white/[0.08] font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Request Information</span>
                </button>

                {/* Decline Button */}
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(true)}
                  disabled={isDeclined}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] text-rose-400 border border-rose-500/25 font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isDeclined ? 'Declined' : 'Decline Application'}</span>
                </button>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="p-6 rounded-3xl bg-[#0C0F17] border border-white/[0.08] space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Audit History
                </h3>
              </div>

              {application.audit_logs && application.audit_logs.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {application.audit_logs.map((log) => (
                    <div key={log.id} className="text-xs space-y-1 pl-3 border-l-2 border-white/[0.1]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-white">
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {log.management_user_email || 'System'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  Initial application logged. Further staff decisions will record here immutably.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* APPROVE MODAL */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full bg-[#121622] border border-white/[0.1] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Approve VIP Application</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  setApprovalResult(null);
                }}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!approvalResult ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Approving will generate a single-use cryptographically secure continuation token valid for 7 days. Status will update to <span className="text-emerald-400 font-semibold">Approved — Next Step Available</span>.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Executive Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Internal reference notes or reservation tier allocation..."
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    className="w-full p-3 bg-[#080A10] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowApproveModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2"
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Confirm Approval</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Approval Result Screen */
              <div className="space-y-5 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                  <span className="font-semibold block text-white text-sm">Application Approved</span>
                  <p>A secure continuation link has been created for {application.full_name}.</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Single-Use Continuation Link</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={approvalResult.continuationUrl}
                      className="flex-1 px-3 py-2 bg-black/60 border border-white/[0.1] rounded-xl text-xs font-mono text-white select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyContinuationLink(approvalResult.continuationUrl)}
                      className="px-3 py-2 rounded-xl bg-white text-slate-950 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApproveModal(false);
                      setApprovalResult(null);
                    }}
                    className="px-5 py-2 bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DECLINE MODAL */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full bg-[#121622] border border-white/[0.1] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <XCircle className="w-5 h-5 text-rose-400" />
                <span>Decline Application</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Please provide a formal justification for this decision. This explanation will be recorded in the audit trail.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Reason for Decline <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Venue capacity reached for this session, conflicting credential verification..."
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full p-3 bg-[#080A10] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-400"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isDeclining || !declineReason.trim()}
                  className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeclining ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  <span>Confirm Decline</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE PASS MODAL */}
      {showRevokeModal && pass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full bg-[#121622] border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-base">
                <Ban className="w-5 h-5 text-rose-400" />
                <span>Revoke VIP Pass</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRevokeModal(false);
                  setRevokeReason('');
                }}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Revoking will immediately cancel pass <strong className="text-white font-mono">{pass.pass_number}</strong>. The verification page will show it as no longer valid and the applicant will receive an email notice.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Reason for Cancellation <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Applicant requested cancellation, or rescheduled session..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full p-3 bg-[#080A10] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-400"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRevokeModal(false);
                    setRevokeReason('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleRevokePass}
                  disabled={isRevoking || !revokeReason.trim()}
                  className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isRevoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  <span>Confirm Revocation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST INFO MODAL */}
      {showRequestInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full bg-[#121622] border border-white/[0.1] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2 text-white font-semibold text-base">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                <span>Request More Information</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestInfoModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Specify what additional information or clarification is needed from {application.full_name}.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Information Needed <span className="text-indigo-400">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Please provide a clear photograph of government ID matching the attendee names..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full p-3 bg-[#080A10] border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRequestInfoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleRequestInfo}
                  disabled={isRequesting || !requestMessage.trim()}
                  className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Send Request</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </ManagementLayout>
  );
}
