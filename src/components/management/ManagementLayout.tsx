import React, { useState } from 'react';
import { Link, useRouter } from '../../router/Router';
import { useAuth } from '../../context/AuthContext';
import { 
  Shield, 
  Settings, 
  LayoutDashboard, 
  FileText, 
  LogOut, 
  ArrowLeft, 
  AlertCircle, 
  User, 
  CreditCard, 
  History, 
  Mail,
  Menu,
  X,
  Globe,
  MessageSquare
} from 'lucide-react';

interface ManagementLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function ManagementLayout({ children, title, subtitle }: ManagementLayoutProps) {
  const { status, managementProfile, isAuthorizedManagement, isLoading, logout } = useAuth();
  const { path } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading || status === 'AUTHENTICATING' || status === 'AUTHENTICATED_LOADING_PROFILE') {
    return (
      <div className="min-h-screen bg-[#080A0F] flex items-center justify-center">
        <div className="text-center space-y-3 font-mono text-xs text-slate-400">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 font-medium">
            {status === 'AUTHENTICATED_LOADING_PROFILE' 
              ? 'Restoring Database Management Profile & Settings...' 
              : 'Verifying Supabase Management Clearance...'}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">Row-Level Security (RLS) identity verification</p>
        </div>
      </div>
    );
  }

  if (status === 'UNAUTHENTICATED' || !isAuthorizedManagement || !managementProfile) {
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
  const isVisitorsRoute = path.startsWith('/management/visitors');
  const isInquiriesRoute = path.startsWith('/management/inquiries');

  return (
    <div className="min-h-screen bg-[#080A0F] text-slate-100 flex flex-col selection:bg-amber-400/20 selection:text-amber-200">
      
      {/* Management Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0C0F17]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Left: Brand & Return */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              href="/"
              className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-medium transition-colors py-1 shrink-0"
              title="Return to Public Portal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Public Portal</span>
            </Link>
            <div className="h-4 w-px bg-white/[0.08] hidden sm:block shrink-0" />
            <Link href="/management" className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-white truncate">
                VIP Management
              </span>
            </Link>
          </div>

          {/* Navigation Links (Desktop: md and above only) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
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
              href="/management/visitors"
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isVisitorsRoute
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Visitors & IP</span>
            </Link>

            <Link
              href="/management/inquiries"
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                isInquiriesRoute
                  ? 'bg-white/[0.08] text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Inquiries</span>
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

            <div className="h-4 w-px bg-white/[0.08] mx-1 shrink-0" />

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
                className="min-h-[38px] px-2.5 sm:px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </nav>

          {/* Mobile Right Action Bar (under md) */}
          <div className="flex md:hidden items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-mono text-[10px] uppercase font-semibold">
              {managementProfile.role}
            </span>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white rounded-xl bg-white/[0.04] border border-white/[0.08] active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Slide-Down Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.08] bg-[#0A0D14]/98 backdrop-blur-2xl px-4 py-5 space-y-4 shadow-2xl animate-fadeIn">
            {/* User Profile Header */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div className="truncate">
                <span className="text-xs font-semibold text-white block truncate">
                  {managementProfile.full_name}
                </span>
                <span className="text-[10px] font-mono uppercase text-emerald-400 block">
                  {managementProfile.role} clearance
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Menu Links */}
            <nav className="flex flex-col space-y-1 text-sm font-medium">
              <Link
                href="/management"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  path === '/management' ? 'bg-white/[0.1] text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span>Dashboard Overview</span>
              </Link>

              <Link
                href="/management/applications"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  isApplicationsRoute ? 'bg-white/[0.1] text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Guest Applications</span>
              </Link>

              <Link
                href="/management/payments"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  isPaymentsRoute ? 'bg-white/[0.1] text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Payment Verification</span>
              </Link>

              <Link
                href="/management/email-history"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  isEmailHistoryRoute ? 'bg-white/[0.1] text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Email Notifications</span>
              </Link>

              <Link
                href="/management/visitors"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  isVisitorsRoute ? 'bg-white/[0.1] text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Live Visitors & IP Tracker</span>
              </Link>

              <Link
                href="/management/inquiries"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  isInquiriesRoute ? 'bg-white/[0.1] text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Guest Messages & Inquiries</span>
              </Link>

              <Link
                href="/management/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  path === '/management/settings' ? 'bg-white/[0.1] text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Event Settings & Branding</span>
              </Link>

              <Link
                href="/management/audit-log"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-colors ${
                  isAuditLogRoute ? 'bg-white/[0.1] text-white font-semibold' : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <History className="w-4 h-4 text-purple-400" />
                <span>Compliance Audit Trail</span>
              </Link>
            </nav>

            <div className="pt-2 border-t border-white/[0.06]">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Event Portal</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 min-w-0 overflow-x-hidden">
        <div className="mb-6 sm:mb-8 space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 flex-wrap">
            <span>Management Console</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-semibold">{managementProfile.role} Access</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 break-words leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="min-w-0 w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation for Management */}
      <div className="md:hidden sticky bottom-0 inset-x-0 z-40 bg-[#0C0F17]/98 backdrop-blur-2xl border-t border-white/[0.08] px-1 py-1.5 flex items-center justify-around overflow-x-hidden">
        <Link
          href="/management"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
            path === '/management' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/management/applications"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
            isApplicationsRoute ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Apps</span>
        </Link>

        <Link
          href="/management/payments"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
            isPaymentsRoute ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payments</span>
        </Link>

        <Link
          href="/management/settings"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
            path === '/management/settings' ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-medium transition-colors cursor-pointer ${
            mobileMenuOpen ? 'text-amber-400 font-semibold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </div>

    </div>
  );
}
