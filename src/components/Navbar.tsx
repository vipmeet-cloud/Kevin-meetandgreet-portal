import React, { useState } from 'react';
import { useRouter } from '../lib/router';
import { useApp } from '../context/AppContext';
import { Menu, X, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { path, navigate } = useRouter();
  const { publicSettings, isManagement } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const brandName = publicSettings?.event_name || 'AURA VIP';

  const isPublicPage = path === '/' || path === '/terms' || path === '/privacy';

  const handleNavClick = (target: string) => {
    setMobileMenuOpen(false);
    if (target.startsWith('#')) {
      if (path !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.querySelector(target);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        const el = document.querySelector(target);
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(target);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full luxury-glass border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => navigate('/')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="text-lg font-bold tracking-tight font-display text-slate-100 group-hover:text-[#D4AF37] transition-colors whitespace-nowrap">
            {brandName}
          </span>
        </button>

        {/* Zone 2: 4-6 text navigation links */}
        {isPublicPage && (
          <nav className="hidden md:flex items-center gap-7 text-xs tracking-wider uppercase font-medium text-slate-300">
            <button
              onClick={() => handleNavClick('#overview')}
              className="hover:text-[#D4AF37] transition-colors focus:outline-none cursor-pointer py-1"
            >
              Overview
            </button>
            <button
              onClick={() => handleNavClick('#experience')}
              className="hover:text-[#D4AF37] transition-colors focus:outline-none cursor-pointer py-1"
            >
              Experience
            </button>
            <button
              onClick={() => handleNavClick('#process')}
              className="hover:text-[#D4AF37] transition-colors focus:outline-none cursor-pointer py-1"
            >
              Process
            </button>
            <button
              onClick={() => handleNavClick('#faq')}
              className="hover:text-[#D4AF37] transition-colors focus:outline-none cursor-pointer py-1"
            >
              FAQ
            </button>
            <button
              onClick={() => handleNavClick('#contact')}
              className="hover:text-[#D4AF37] transition-colors focus:outline-none cursor-pointer py-1"
            >
              Support
            </button>
          </nav>
        )}

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          {isManagement && (
            <button
              onClick={() => navigate('/management')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Management Portal</span>
            </button>
          )}

          <button
            onClick={() => navigate('/apply')}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-[#F3E5AB] via-[#D4AF37] to-[#AA820A] hover:brightness-110 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer active:scale-95"
          >
            Apply for VIP
          </button>

          {/* Mobile menu button */}
          {isPublicPage && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 hover:text-white focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer (15% height compliant, thumb-friendly) */}
      {mobileMenuOpen && isPublicPage && (
        <div className="md:hidden luxury-glass border-b border-slate-800 px-6 py-5 animate-fade-in">
          <div className="flex flex-col gap-4 text-sm font-medium tracking-wide">
            <button
              onClick={() => handleNavClick('#overview')}
              className="text-left text-slate-300 hover:text-[#D4AF37] py-2 transition-colors"
            >
              Event Overview
            </button>
            <button
              onClick={() => handleNavClick('#experience')}
              className="text-left text-slate-300 hover:text-[#D4AF37] py-2 transition-colors"
            >
              Exclusive Experience
            </button>
            <button
              onClick={() => handleNavClick('#process')}
              className="text-left text-slate-300 hover:text-[#D4AF37] py-2 transition-colors"
            >
              Selection Process
            </button>
            <button
              onClick={() => handleNavClick('#faq')}
              className="text-left text-slate-300 hover:text-[#D4AF37] py-2 transition-colors"
            >
              Frequently Asked Questions
            </button>
            <button
              onClick={() => handleNavClick('#contact')}
              className="text-left text-slate-300 hover:text-[#D4AF37] py-2 transition-colors"
            >
              Official Concierge & Support
            </button>
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/terms');
                }}
                className="hover:text-slate-200"
              >
                Terms & Conditions
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/privacy');
                }}
                className="hover:text-slate-200"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/management/login');
                }}
                className="text-[#D4AF37] hover:underline"
              >
                Management
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
