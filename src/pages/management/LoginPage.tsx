import { useState, useEffect } from 'react';
import { useNavigate, Link } from '../../router/Router';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';
import { PRIMARY_MANAGEMENT_CREDENTIALS } from '../../services/auth';
import { Shield, Lock, ArrowLeft, AlertCircle, Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthorizedManagement } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // If already authorized, navigate to management dashboard asynchronously
  useEffect(() => {
    if (isAuthorizedManagement) {
      const timer = setTimeout(() => {
        navigate('/management', { replace: true });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthorizedManagement, navigate]);

  if (isAuthorizedManagement) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3 font-mono text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
          <p>Redirecting to Management Console...</p>
        </div>
      </div>
    );
  }

  const handleFillCredentials = () => {
    setEmail(PRIMARY_MANAGEMENT_CREDENTIALS.email);
    setPassword(PRIMARY_MANAGEMENT_CREDENTIALS.password);
    setAuthError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !password) {
      setAuthError('Please enter both your authorized email and password.');
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        setAuthError(result.error || 'Authentication credentials not recognized or insufficient privileges.');
      } else {
        navigate('/management');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setAuthError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="max-w-md w-full space-y-6 animate-fadeIn">
        
        {/* Return to Public Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Event Portal</span>
          </Link>
        </div>

        {/* Modern SaaS Login Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0F121C] border border-white/[0.08] shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-slate-200 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Shield className="w-7 h-7 stroke-[1.5]" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">
              Management Portal
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Secure access for authorized celebrity liaisons, executive review staff, and event coordinators.
            </p>
          </div>

          {/* Quick Credential Helper Badge */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 truncate">
              <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="truncate">
                <span className="text-[11px] text-slate-300 font-medium block truncate">
                  management.meet.greet@gmail.com
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  Lead Administrator Account
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFillCredentials}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 text-slate-200 hover:text-white text-[11px] font-semibold tracking-wide shrink-0 transition-all cursor-pointer"
            >
              Fill Credentials
            </button>
          </div>

          {/* Auth Error Display */}
          {authError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-2.5 text-red-400 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Management Email
              </label>
              <input
                type="email"
                placeholder="management.meet.greet@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full min-h-[48px] px-4 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/80 transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full min-h-[48px] pl-4 pr-11 py-3 bg-[#080A10] border border-white/[0.1] rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/80 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => alert('Password recovery: Please contact the Lead Administrator or system security officer for credential reset.')}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[50px] py-3.5 bg-white text-slate-950 hover:bg-slate-100 active:scale-[0.98] font-semibold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Discreet footer notice */}
          <div className="pt-4 border-t border-white/[0.04] text-center">
            <p className="text-[11px] text-slate-500">
              Access is restricted strictly to provisioned accounts verified via Row-Level Security.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
