import { useState } from 'react';
import { Link, useRouter } from '../../router/Router';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Shield } from 'lucide-react';

export function Navbar() {
  const { settings, isPortalConfigured } = useSettings();
  const { isAuthorizedManagement } = useAuth();
  const { path } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const brandName = isPortalConfigured && settings?.event_name 
    ? settings.event_name 
    : 'VIP Meet & Greet';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080A0F]/85 backdrop-blur-xl border-b border-white/[0.06] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <Link 
          href="/" 
          className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-slate-200 transition-colors whitespace-nowrap truncate max-w-[220px] sm:max-w-xs"
        >
          {brandName}
        </Link>

        {/* Desktop Navigation: Experience, How It Works, Terms, Privacy */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
          <a href="/#experience" className="hover:text-white transition-colors py-2">
            Experience
          </a>
          <a href="/#process" className="hover:text-white transition-colors py-2">
            How It Works
          </a>
          <Link href="/terms" className="hover:text-white transition-colors py-2">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors py-2">
            Privacy
          </Link>
        </nav>

        {/* Primary CTA: Apply */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthorizedManagement && (
            <Link
              href="/management"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.04] transition-colors"
              title="Management Console"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
            </Link>
          )}

          <Link
            href="/apply"
            className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-950 bg-white hover:bg-slate-100 active:scale-[0.98] rounded-xl transition-all shadow-md whitespace-nowrap"
          >
            Apply
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/apply"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-white rounded-lg active:scale-95 transition-all"
          >
            Apply
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white rounded-lg cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Clean Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#0C0F17]/98 backdrop-blur-2xl px-5 py-6 space-y-4 shadow-2xl animate-fadeIn">
          <nav className="flex flex-col space-y-3 text-sm font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-white"
            >
              Home
            </Link>
            <a
              href="/#experience"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-slate-300 hover:text-white transition-colors"
            >
              Experience
            </a>
            <a
              href="/#process"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-slate-300 hover:text-white transition-colors"
            >
              How It Works
            </a>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-slate-400 hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-slate-400 hover:text-white transition-colors"
            >
              Privacy
            </Link>
          </nav>

          <div className="pt-3 border-t border-white/[0.06]">
            <Link
              href="/apply"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full min-h-[46px] flex items-center justify-center font-semibold text-xs uppercase tracking-wider text-slate-950 bg-white rounded-xl shadow-lg"
            >
              Apply for VIP Access
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
