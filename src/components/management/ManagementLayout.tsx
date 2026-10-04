import React from 'react';
import { Link, useRouter } from '../../router/Router';
import { useAuth } from '../../context/AuthContext';
import { Shield, Settings, LayoutDashboard, FileText, LogOut, ArrowLeft, AlertCircle, User, CreditCard, History, Mail } from 'lucide-react';

interface ManagementLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function ManagementLayout({ children, title, subtitle }: ManagementLayoutProps) {
  const { managementProfile, isAuthorizedManagement, isLoading, logout } = useAuth();
  const { path } = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080A0F] flex items-center justify-center">
        <div className="text-center space-y-3 font-mono text-xs text-slate-400">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Verifying Management Clearance...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorizedManagement || !managementProfile) {
    return (
      <div className="min-h-screen bg-[#080A0F] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0E1118] border border-white/[0.08] text-center space-y-5 shadow-2xl animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white">Management Access Required</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This console requires authorized credentials from the executive management team. Please sign in with your provisioned account.
            </p>
          </div>
          <Link
            href="/management/login"
            className="w-full py-3 bg-white text-slate-950 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100"
          >
            <span>Proceed to Management Sign-In</span>
          </Link>
        </div>
      </div>
    );
  }

  const isApplicationsRoute = path.startsWith('/management/applications');
  const isPaymentsRoute = path.startsWith('/management/payments');
  const isEmailHistoryRoute = path.startsWith('/management/email-history');
  const isAuditLogRoute = path.startsWith('/management/audit-log');

  return (
    <div className="min-h-screen bg-[#080A0F] text-slate-100 flex flex-col selection:bg-amber-400/20 selection:text-amber-200">
      
      {/* Management Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0C0F17]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Left: Brand & Return */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-medium transition-colors py-1"
              title="Return to Public Portal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Public Portal</span>
            </Link>
            <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-semibold tracking-wide text-white whitespace-nowrap">
                VIP Management
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <Link
              href="/management"
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                path === '/management'
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/management/applications"
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isApplicationsRoute
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Applications</span>
            </Link>

            <Link
              href="/management/payments"
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isPaymentsRoute
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payments</span>
            </Link>

            <Link
              href="/management/email-history"
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isEmailHistoryRoute
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Emails</span>
            </Link>

            <Link
              href="/management/settings"
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                path === '/management/settings'
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>

            <Link
              href="/management/audit-log"
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isAuditLogRoute
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log</span>
            </Link>

            <div className="h-4 w-px bg-white/[0.08] mx-1 hidden sm:block" />

            {/* Profile & Logout */}
            <div className="flex items-center gap-2 pl-2">
              <div className="hidden lg:block text-right">
                <span className="text-xs text-white font-medium block truncate max-w-[130px]">
                  {managementProfile.full_name}
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-400 block">
                  {managementProfile.role}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                className="min-h-[38px] px-2.5 sm:px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </nav>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span>Management Console</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-semibold">{managementProfile.role} Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </main>

      {/* Mobile Bottom Navigation for Management */}
      <div className="sm:hidden sticky bottom-0 inset-x-0 z-40 bg-[#0C0F17]/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 py-2 flex items-center justify-around">
        <Link
          href="/management"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium ${
            path === '/management' ? 'text-white' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/management/applications"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium ${
            isApplicationsRoute ? 'text-white' : 'text-slate-400'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Apps</span>
        </Link>

        <Link
          href="/management/payments"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium ${
            isPaymentsRoute ? 'text-white' : 'text-slate-400'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payments</span>
        </Link>

        <Link
          href="/management/email-history"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium ${
            isEmailHistoryRoute ? 'text-white' : 'text-slate-400'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Emails</span>
        </Link>

        <Link
          href="/management/settings"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium ${
            path === '/management/settings' ? 'text-white' : 'text-slate-400'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        <Link
          href="/management/audit-log"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium ${
            isAuditLogRoute ? 'text-white' : 'text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit</span>
        </Link>
      </div>

    </div>
  );
}
