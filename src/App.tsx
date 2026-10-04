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
import { VipPassPage } from './pages/public/VipPassPage';
import { PassVerificationPage } from './pages/public/PassVerificationPage';
import { ROUTES } from './router/routes';
import { ArrowLeft } from 'lucide-react';
import { Link } from './router/Router';

function AppContent() {
  const { path } = useRouter();

  // Determine current page component
  const renderRoute = () => {
    // Public routes
    if (path === ROUTES.PUBLIC.HOME || path === '') {
      return <LandingPage />;
    }
    if (path === ROUTES.PUBLIC.APPLY) {
      return <ApplicationPage />;
    }
    if (path === ROUTES.PUBLIC.APPLICATION_SUCCESS) {
      return <ApplicationSuccessPage />;
    }
    if (path === ROUTES.PUBLIC.CONTINUE || path.startsWith('/continue/')) {
      return <ContinuationPage />;
    }
    if (path === ROUTES.PUBLIC.PAYMENT || path.startsWith('/payment/')) {
      return <PaymentSubmissionPage />;
    }
    if (path === ROUTES.PUBLIC.VIP_PASS || path.startsWith('/vip-pass/')) {
      return <VipPassPage />;
    }
    if (path === ROUTES.PUBLIC.VERIFY || path.startsWith('/verify/') || path.startsWith('/verify-pass/')) {
      return <PassVerificationPage />;
    }
    if (path === ROUTES.PUBLIC.TERMS) {
      return <TermsPage />;
    }
    if (path === ROUTES.PUBLIC.PRIVACY) {
      return <PrivacyPage />;
    }

    // Management routes
    if (path === ROUTES.MANAGEMENT.LOGIN) {
      return <LoginPage />;
    }
    if (path === ROUTES.MANAGEMENT.DASHBOARD) {
      return <DashboardPage />;
    }
    if (path === ROUTES.MANAGEMENT.APPLICATIONS) {
      return <ApplicationsListPage />;
    }
    if (path.startsWith('/management/applications/')) {
      return <ApplicationDetailPage />;
    }
    if (path === ROUTES.MANAGEMENT.PAYMENTS) {
      return <PaymentsListPage />;
    }
    if (path.startsWith('/management/payments/')) {
      return <PaymentDetailPage />;
    }
    if (path === ROUTES.MANAGEMENT.EMAIL_HISTORY) {
      return <EmailHistoryPage />;
    }
    if (path === ROUTES.MANAGEMENT.AUDIT_LOG) {
      return <AuditLogPage />;
    }
    if (path === ROUTES.MANAGEMENT.SETTINGS) {
      return <SettingsPage />;
    }

    // 404 Fallback
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-5">
          <span className="text-4xl font-serif text-[#D4AF37] block">404</span>
          <h2 className="text-xl font-serif text-white font-medium">Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page you are looking for could not be found. Please check the web address or return home.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C07B] text-black font-semibold text-xs uppercase tracking-widest rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Event Home</span>
          </Link>
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
