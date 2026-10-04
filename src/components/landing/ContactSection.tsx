import { MeetGreetSettings } from '../../types/settings';
import { Mail, Phone, MessageSquare, ShieldCheck } from 'lucide-react';

interface ContactSectionProps {
  settings: MeetGreetSettings;
}

export function ContactSection({ settings }: ContactSectionProps) {
  const celebrityName = settings?.celebrity_name || 'Guest Artist';
  const email = settings?.support_email || 'concierge@vip-reception.com';
  const phone = settings?.support_phone;
  const whatsapp = settings?.support_whatsapp;

  return (
    <section id="contact" className="py-16 md:py-24 bg-[#080A0F]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">
            <span>Get in Touch</span>
            <span aria-hidden="true">·</span>
            <span>Contact Management</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Contact Management
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Have questions about your application, event details, or accessibility needs for {celebrityName}? Reach out to management directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          
          {/* Email Card */}
          <div className="p-6 rounded-3xl bg-[#0E1118] border border-white/[0.07] text-center space-y-3 flex flex-col justify-between shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-slate-300 flex items-center justify-center mx-auto">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                Email
              </span>
              <h3 className="text-sm font-semibold text-white">Support Email</h3>
            </div>
            <a
              href={`mailto:${email}`}
              className="text-xs text-white hover:text-amber-300 font-mono truncate block px-2 py-1 transition-colors"
            >
              {email}
            </a>
          </div>

          {/* Phone Card */}
          <div className="p-6 rounded-3xl bg-[#0E1118] border border-white/[0.07] text-center space-y-3 flex flex-col justify-between shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-slate-300 flex items-center justify-center mx-auto">
              <Phone className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                Direct Line
              </span>
              <h3 className="text-sm font-semibold text-white">Phone Support</h3>
            </div>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="text-xs text-white hover:text-amber-300 font-mono block px-2 py-1 transition-colors"
              >
                {phone}
              </a>
            ) : (
              <span className="text-xs text-slate-500 font-mono block px-2 py-1">
                Available via Email
              </span>
            )}
          </div>

          {/* WhatsApp Card */}
          <div className="p-6 rounded-3xl bg-[#0E1118] border border-white/[0.07] text-center space-y-3 flex flex-col justify-between shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-slate-300 flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                Messaging
              </span>
              <h3 className="text-sm font-semibold text-white">WhatsApp Support</h3>
            </div>
            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white hover:text-amber-300 font-mono block px-2 py-1 transition-colors"
              >
                {whatsapp}
              </a>
            ) : (
              <span className="text-xs text-slate-500 font-mono block px-2 py-1">
                Available via Email
              </span>
            )}
          </div>

        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Our management team is happy to assist you with any questions.</span>
        </div>
      </div>
    </section>
  );
}
