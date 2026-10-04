import { Link } from '../../router/Router';
import { useSettings } from '../../context/SettingsContext';
import { Mail, Phone, MessageSquare, Lock } from 'lucide-react';

export function Footer() {
  const { settings, isPortalConfigured } = useSettings();

  const eventName = isPortalConfigured && settings?.event_name
    ? settings.event_name
    : 'VIP Meet & Greet Portal';

  return (
    <footer className="w-full bg-[#06080C] border-t border-white/[0.06] text-slate-400 py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12 border-b border-white/[0.06]">
          
          {/* Brand & Mission */}
          <div className="md:col-span-5 space-y-3">
            <span className="text-base font-bold tracking-tight text-white block">
              {eventName}
            </span>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Official VIP Meet & Greet website. Every application is reviewed directly by management to ensure a safe, memorable experience.
            </p>
            {isPortalConfigured && settings?.celebrity_name && (
              <div className="text-xs text-slate-500 pt-1 font-mono">
                Featuring: <span className="text-slate-300 font-medium">{settings.celebrity_name}</span>
              </div>
            )}
          </div>

          {/* Legal & Governance */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Information & Terms
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors py-1 inline-block">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors py-1 inline-block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="/#faq" className="hover:text-white transition-colors py-1 inline-block">
                  Help & FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Official Liaison Support */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Contact Us
            </h4>
            <div className="space-y-2 text-sm text-slate-400">
              {settings?.support_email ? (
                <a
                  href={`mailto:${settings.support_email}`}
                  className="flex items-center gap-2 hover:text-white transition-colors py-1 truncate"
                >
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{settings.support_email}</span>
                </a>
              ) : (
                <div className="flex items-center gap-2 py-1 text-slate-500">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>support@vip-management.org</span>
                </div>
              )}

              {settings?.support_phone && (
                <a
                  href={`tel:${settings.support_phone}`}
                  className="flex items-center gap-2 hover:text-white transition-colors py-1"
                >
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{settings.support_phone}</span>
                </a>
              )}

              {settings?.support_whatsapp && (
                <a
                  href={`https://wa.me/${settings.support_whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors py-1"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>WhatsApp Support</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar with discreet management entry */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {eventName}. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <span className="text-[11px] text-slate-600">Private VIP Experience</span>
            <Link
              href="/management/login"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors py-1"
              title="Authorized Management Team Access"
            >
              <Lock className="w-3 h-3" />
              <span>Management Access</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
