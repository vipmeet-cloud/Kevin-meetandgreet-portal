import { RouterProvider, useRouter } from './router/Router';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/public/LandingPage';
import { ApplicationPage } from './pages/public/ApplicationPage';
import { ApplicationSuccessPage } from './pages/public/ApplicationSuccessPage';
import { ContinuationPage } from './pages/public/ContinuationPage';
import { PaymentSubmissionPage } from './pages/public/PaymentSubmissionPage';
import { TermsPage } from './pages/public/TermsPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { FutureRoutePlaceholder } from './pages/public/FutureRoutePlaceholder';
import { LoginPage } from './pages/management/LoginPage';
import { DashboardPage } from './pages/management/DashboardPage';
import { ApplicationsListPage } from './pages/management/ApplicationsListPage';
import { ApplicationDetailPage } from './pages/management/ApplicationDetailPage';
import { PaymentsListPage } from './pages/management/PaymentsListPage';
import { PaymentDetailPage } from './pages/management/PaymentDetailPage';
import { EmailHistoryPage } from './pages/management/EmailHistoryPage';
import { AuditLogPage } from './pages/management/AuditLogPage';
import { SettingsPage } from './pages/management/SettingsPage';
import { VisitorTrackerPage } from './pages/management/VisitorTrackerPage';
import { InquiriesPage } from './pages/management/InquiriesPage';
import { VipPassPage } from './pages/public/VipPassPage';
import { PassVerificationPage } from './pages/public/PassVerificationPage';
import { FloatingContactBox } from './components/common/FloatingContactBox';
import { visitorTrackerService } from './services/visitorService';
import { useEffect } from 'react';
import { ROUTES } from './router/routes';
import { ArrowLeft } from 'lucide-react';
import { Link } from './router/Router';

function AppContent() {
  const { path } = useRouter();
  const normalized = (path || '/').toLowerCase().replace(/\/+$/, '') || '/';

  // Real-time visitor tracking and persistent session logging
  useEffect(() => {
    visitorTrackerService.trackVisit(path || '/');

    const heartbeat = setInterval(() => {
      visitorTrackerService.sendHeartbeat(path || '/');
    }, 25000);

    const handleBeforeUnload = () => {
      visitorTrackerService.markOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [path]);

  // Determine current page component
  const renderRoute = () => {
    // Public routes
    if (normalized === '/' || normalized === '') {
      return <LandingPage />;
    }
    if (normalized === '/apply') {
      return <ApplicationPage />;
    }
    if (normalized === '/application-success') {
      return <ApplicationSuccessPage />;
    }
    if (
      normalized === '/continue' || 
      normalized.startsWith('/continue/') || 
      normalized === '/check' || 
      normalized.startsWith('/check/') ||
      normalized === '/status' ||
      normalized.startsWith('/status/')
    ) {
      return <ContinuationPage />;
    }
    if (
      normalized === '/payment' || 
      normalized.startsWith('/payment/') ||
      normalized === '/pay' ||
      normalized.startsWith('/pay/')
    ) {
      return <PaymentSubmissionPage />;
    }
    if (
      normalized === '/vip-pass' || 
      normalized.startsWith('/vip-pass/') ||
      normalized === '/pass' ||
      normalized.startsWith('/pass/')
    ) {
      return <VipPassPage />;
    }
    if (
      normalized === '/verify' || 
      normalized === '/verify-pass' || 
      normalized.startsWith('/verify/') || 
      normalized.startsWith('/verify-pass/')
    ) {
      return <PassVerificationPage />;
    }
    if (normalized === '/terms') {
      return <TermsPage />;
    }
    if (normalized === '/privacy') {
      return <PrivacyPage />;
    }

    // Management routes & common aliases
    if (normalized === '/management/login' || normalized === '/admin/login' || normalized === '/login') {
      return <LoginPage />;
    }
    if (
      normalized === '/management' || 
      normalized === '/admin' || 
      normalized === '/dashboard' ||
      normalized === '/admin/dashboard'
    ) {
      return <DashboardPage />;
    }
    if (
      normalized === '/management/applications' || 
      normalized === '/admin/applications' ||
      normalized === '/applications'
    ) {
      return <ApplicationsListPage />;
    }
    if (
      normalized.startsWith('/management/applications/') ||
      normalized.startsWith('/admin/applications/') ||
      normalized.startsWith('/applications/')
    ) {
      return <ApplicationDetailPage />;
    }
    if (
      normalized === '/management/payments' || 
      normalized === '/admin/payments' ||
      normalized === '/payments'
    ) {
      return <PaymentsListPage />;
    }
    if (
      normalized.startsWith('/management/payments/') ||
      normalized.startsWith('/admin/payments/') ||
      normalized.startsWith('/payments/')
    ) {
      return <PaymentDetailPage />;
    }
    if (
      normalized === '/management/email-history' || 
      normalized === '/admin/email-history' ||
      normalized === '/emails'
    ) {
      return <EmailHistoryPage />;
    }
    if (
      normalized === '/management/audit-log' || 
      normalized === '/admin/audit-log' ||
      normalized === '/audit'
    ) {
      return <AuditLogPage />;
    }
    if (
      normalized === '/management/settings' || 
      normalized === '/admin/settings' ||
      normalized === '/settings'
    ) {
      return <SettingsPage />;
    }
    if (
      normalized === '/management/visitors' || 
      normalized === '/admin/visitors' ||
      normalized === '/visitors'
    ) {
      return <VisitorTrackerPage />;
    }
    if (
      normalized === '/management/inquiries' || 
      normalized === '/admin/inquiries' ||
      normalized === '/inquiries'
    ) {
      return <InquiriesPage />;
    }

    // 404 Fallback with helpful navigation
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-5 shadow-2xl">
          <span className="text-4xl font-serif text-[#D4AF37] block">404</span>
          <h2 className="text-xl font-serif text-white font-medium">Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page you are looking for does not exist or may have been moved.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C07B] text-black font-semibold text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Event Home</span>
            </Link>
            <Link
              href="/management"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all"
            >
              <span>Management</span>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const isManagementConsole = path.startsWith('/management') && path !== '/management/login';
  const isApplicationFlow = path === ROUTES.PUBLIC.APPLY || path.startsWith('/payment/');

  return (
    <div className="min-h-screen flex flex-col bg-[#07090E] text-slate-100 selection:bg-[#D4AF37]/30 selection:text-white">
      {/* Show public navbar on public pages & login */}
      {!isManagementConsole && <Navbar />}

      <div className="flex-1">
        {renderRoute()}
      </div>

      {/* Show public footer on public pages, except sticky mobile application flow */}
      {!isManagementConsole && !isApplicationFlow && <Footer />}

      {/* Floating in-app contact drawer for guests on public portal */}
      {!isManagementConsole && <FloatingContactBox />}
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
