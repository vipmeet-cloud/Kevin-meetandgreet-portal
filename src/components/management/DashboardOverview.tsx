import { useState, useEffect } from 'react';
import { Link } from '../../router/Router';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { applicationService } from '../../services/applicationService';
import { paymentService } from '../../services/paymentService';
import { ApplicationRecord, getPublicStatusLabel } from '../../types/application';
import { PaymentRecord } from '../../types/payment';
import { 
  Settings, 
  Calendar, 
  ShieldCheck, 
  ExternalLink, 
  FileText, 
  CreditCard, 
  Ticket, 
  Mail, 
  FileSpreadsheet,
  Clock,
  Inbox,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export function DashboardOverview() {
  const { settings, isPortalConfigured, isLoading: settingsLoading } = useSettings();
  const { managementProfile } = useAuth();

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const fetchApps = async () => {
    setLoadingApps(true);
    try {
      const [appRes, payRes] = await Promise.all([
        applicationService.fetchApplications(),
        paymentService.fetchPayments(),
      ]);
      setApplications(appRes.applications || []);
      setPayments(payRes.payments || []);
    } catch {}
    finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // Compute accurate metrics
  const pendingPaymentsCount = payments.filter(
    p => p.status === 'PAYMENT_SUBMITTED' || p.status === 'PAYMENT_UNDER_REVIEW'
  ).length;

  const appPaymentReviewCount = applications.filter(
    a => a.status === 'PAYMENT_SUBMITTED' || a.status === 'PAYMENT_UNDER_REVIEW'
  ).length;

  const metrics = {
    total: applications.length,
    underReview: applications.filter(a => a.status === 'UNDER_REVIEW').length,
    approved: applications.filter(a => a.status === 'APPROVED_AWAITING_COMPLETION' || a.status === 'APPROVED').length,
    paymentsSubmitted: Math.max(pendingPaymentsCount, appPaymentReviewCount),
    paymentsConfirmed: Math.max(
      payments.filter(p => p.status === 'PAYMENT_CONFIRMED').length,
      applications.filter(a => (a.status as string) === 'PAYMENT_CONFIRMED_AWAITING_PASS' || (a.status as string) === 'PAYMENT_CONFIRMED').length
    ),
  };

  const futureModules = [
    {
      title: 'Payment & Verification',
      icon: CreditCard,
      phase: 'Phase 4 (Live)',
      description: 'Single-use continuation token validation, manual wire instructions, receipt uploads, and management verification.',
    },
    {
      title: 'Email Notifications & History',
      icon: Mail,
      phase: 'Live',
      description: 'Send email notifications, track status, and view complete email history.',
    },
    {
      title: 'VIP Passes & QR Verification',
      icon: Ticket,
      phase: 'Live',
      description: 'Digital VIP passes with live QR verification and pass revocation.',
    },
    {
      title: 'Immutable Compliance Audit',
      icon: FileSpreadsheet,
      phase: 'Phase 7',
      description: 'Immutable system audit logs, staff waivers, role changes, and compliance exports.',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 5 Real Metric Cards (Part P) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Total Applications */}
        <Link
          href="/management/applications"
          className="p-4 sm:p-5 rounded-2xl bg-[#0E1118] border border-white/[0.08] hover:border-white/[0.2] transition-all space-y-2 block group shadow-md"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total</span>
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {metrics.total}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">All registered dossiers</span>
        </Link>

        {/* Under Review */}
        <Link
          href="/management/applications"
          className="p-4 sm:p-5 rounded-2xl bg-[#0E1118] border border-white/[0.08] hover:border-amber-400/30 transition-all space-y-2 block group shadow-md"
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Under Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300">
            {metrics.underReview}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Awaiting decision</span>
        </Link>

        {/* Approved */}
        <Link
          href="/management/applications"
          className="p-4 sm:p-5 rounded-2xl bg-[#0E1118] border border-white/[0.08] hover:border-emerald-400/30 transition-all space-y-2 block group shadow-md"
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            {metrics.approved}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Continuation dispatched</span>
        </Link>

        {/* Payment Review */}
        <Link
          href="/management/payments"
          className="p-4 sm:p-5 rounded-2xl bg-[#0E1118] border border-white/[0.08] hover:border-amber-400/30 transition-all space-y-2 block group shadow-md"
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Payment Review</span>
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300">
            {metrics.paymentsSubmitted}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Wire verification pending</span>
        </Link>

        {/* Confirmed Passes Pending */}
        <Link
          href="/management/payments"
          className="p-4 sm:p-5 rounded-2xl bg-[#0E1118] border border-white/[0.08] hover:border-emerald-400/30 transition-all space-y-2 block group shadow-md col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Confirmed</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            {metrics.paymentsConfirmed}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">Pass generation staged</span>
        </Link>

      </div>

      {/* Main Split: Recent Applications & Active Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Applications (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#0E1118] border border-white/[0.08] space-y-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="text-base font-semibold text-white">
                Recent Guest Applications
              </h3>
              <p className="text-xs text-slate-400">
                Latest submissions received through the public applicant intake.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchApps}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingApps ? 'animate-spin' : ''}`} />
              </button>

              <Link
                href="/management/applications"
                className="text-xs font-semibold text-white hover:text-amber-300 flex items-center gap-1 pl-1 transition-colors"
              >
                <span>View All ({metrics.total})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {applications.length > 0 ? (
            <div className="space-y-2.5">
              {applications.slice(0, 5).map((app) => (
                <Link
                  key={app.id}
                  href={`/management/applications/${app.id}`}
                  className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] flex items-center justify-between gap-3 transition-colors block group"
                >
                  <div className="space-y-0.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white tracking-wider">
                        {app.reference_code}
                      </span>
                      <span className="text-slate-500" aria-hidden="true">·</span>
                      <span className="font-semibold text-white text-xs truncate group-hover:text-amber-300 transition-colors">
                        {app.full_name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {app.preferred_date} · {app.preferred_session} · {app.attendee_count} {app.attendee_count === 1 ? 'Guest' : 'Guests'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-medium text-slate-300">
                      {getPublicStatusLabel(app.status)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-black/30 border border-white/[0.04] text-center space-y-2">
              <Inbox className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-xs font-semibold text-white">No applications received yet</h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Applications submitted by patrons on <span className="text-amber-400">/apply</span> will automatically stream into this review queue.
              </p>
            </div>
          )}
        </div>

        {/* Celebrity & Portal Status Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Event Summary */}
          <div className="p-6 rounded-3xl bg-[#0E1118] border border-white/[0.08] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Event Representation
              </span>
              <Calendar className="w-4 h-4 text-amber-400" />
            </div>

            {settingsLoading ? (
              <div className="space-y-2 py-2">
                <div className="h-5 w-32 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-4 w-44 bg-white/[0.03] rounded animate-pulse" />
              </div>
            ) : isPortalConfigured && settings ? (
              <div className="space-y-2">
                <div>
                  <h4 className="text-base font-bold text-white">
                    {settings.celebrity_name}
                  </h4>
                  <p className="text-xs text-amber-300 font-medium">
                    {settings.event_name}
                  </p>
                  <p className="text-xs text-slate-400 pt-0.5 truncate">
                    {settings.celebrity_title}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${settings.is_active ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-slate-300">
                    {settings.is_active ? 'Public Intake Active' : 'Intake Inactive'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-amber-300">
                  Configuration Inactive
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configure event parameters and upload celebrity portrait in Settings to publish public intake.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs">
              <Link
                href="/management/settings"
                className="text-white hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>Edit Settings</span>
                <Settings className="w-3.5 h-3.5" />
              </Link>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                <span>Live View</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="p-6 rounded-3xl bg-[#0E1118] border border-white/[0.08] space-y-3 shadow-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Direct Shortcuts
            </span>
            <div className="space-y-2">
              <Link
                href="/management/applications"
                className="w-full min-h-[42px] px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white flex items-center justify-between transition-colors"
              >
                <span>Triage Applications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/apply"
                target="_blank"
                className="w-full min-h-[42px] px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 flex items-center justify-between transition-colors"
              >
                <span>Preview Public /apply</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* Reserved Future Feature Roadmap */}
      <div className="space-y-4 pt-4">
        <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">
              System Architecture Roadmap
            </h3>
            <p className="text-xs text-slate-400">
              Future operational modules architecturally reserved for subsequent rollout phases.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Phased Architecture</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {futureModules.map((module, idx) => {
            const Icon = module.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#0C0F17] border border-white/[0.05] space-y-3 opacity-80 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.05]">
                    {module.phase}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">
                    {module.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
