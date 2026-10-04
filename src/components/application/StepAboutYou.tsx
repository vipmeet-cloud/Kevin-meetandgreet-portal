import { ApplicationFormData } from '../../types/application';
import { User, Mail, Phone, Globe, MapPin, MessageSquare, CheckCircle } from 'lucide-react';

interface StepAboutYouProps {
  formData: ApplicationFormData;
  errors: Record<string, string>;
  onChange: (field: keyof ApplicationFormData, value: any) => void;
}

export function StepAboutYou({ formData, errors, onChange }: StepAboutYouProps) {
  const contactMethods: { id: 'email' | 'phone' | 'whatsapp'; label: string; icon: any; hint: string }[] = [
    { id: 'email', label: 'Email', icon: Mail, hint: 'Updates by email' },
    { id: 'phone', label: 'Phone Call', icon: Phone, hint: 'Direct phone call' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, hint: 'Direct message' },
  ];

  const popularCountries = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'United Arab Emirates',
    'Singapore',
    'Japan',
    'Philippines',
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Step Header */}
      <div className="space-y-1.5 text-left">
        <div className="text-xs uppercase tracking-widest text-[#D4AF37] font-mono font-semibold">
          Section 01 · Your Details
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-white font-medium tracking-tight">
          Your Information
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          We’ll use these details to contact you with updates regarding your application.
        </p>
      </div>

      {/* Inputs Grid */}
      <div className="space-y-5">
        
        {/* Full Legal Name */}
        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-semibold tracking-wider text-slate-300">
            Full Legal Name <span className="text-[#D4AF37]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="full_name"
              placeholder="As indicated on government photo ID"
              value={formData.full_name}
              onChange={(e) => onChange('full_name', e.target.value)}
              className={`w-full min-h-[48px] pl-10 pr-10 py-3 bg-[#0D1018] border rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                errors.full_name
                  ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30'
                  : formData.full_name.trim().length >= 2
                  ? 'border-[#D4AF37]/50 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20'
                  : 'border-white/[0.1] focus:border-[#D4AF37]'
              }`}
              required
            />
            {formData.full_name.trim().length >= 2 && !errors.full_name && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </div>
          {errors.full_name && (
            <p className="text-xs text-red-400 pl-1">{errors.full_name}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-semibold tracking-wider text-slate-300">
            Email Address <span className="text-[#D4AF37]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="your.name@private-domain.com"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              className={`w-full min-h-[48px] pl-10 pr-10 py-3 bg-[#0D1018] border rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                errors.email
                  ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30'
                  : formData.email.includes('@')
                  ? 'border-[#D4AF37]/50 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20'
                  : 'border-white/[0.1] focus:border-[#D4AF37]'
              }`}
              required
            />
            {formData.email.includes('@') && !errors.email && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </div>
          {errors.email ? (
            <p className="text-xs text-red-400 pl-1">{errors.email}</p>
          ) : (
            <p className="text-[11px] text-slate-500 pl-1">We will send your application status and updates here.</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="block text-xs uppercase font-semibold tracking-wider text-slate-300">
            Telephone / Mobile Number <span className="text-[#D4AF37]">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              name="phone"
              placeholder="+1 (555) 234-5678"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              className={`w-full min-h-[48px] pl-10 pr-10 py-3 bg-[#0D1018] border rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                errors.phone
                  ? 'border-red-500/80 focus:ring-2 focus:ring-red-500/30'
                  : formData.phone.trim().length >= 7
                  ? 'border-[#D4AF37]/50 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20'
                  : 'border-white/[0.1] focus:border-[#D4AF37]'
              }`}
              required
            />
            {formData.phone.trim().length >= 7 && !errors.phone && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </div>
          {errors.phone && (
            <p className="text-xs text-red-400 pl-1">{errors.phone}</p>
          )}
        </div>

        {/* Country & City Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-semibold tracking-wider text-slate-300">
              Country <span className="text-[#D4AF37]">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="country"
                list="popular-countries"
                placeholder="Country of residence"
                value={formData.country}
                onChange={(e) => onChange('country', e.target.value)}
                className={`w-full min-h-[48px] pl-10 pr-4 py-3 bg-[#0D1018] border rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                  errors.country ? 'border-red-500/80' : 'border-white/[0.1] focus:border-[#D4AF37]'
                }`}
                required
              />
              <datalist id="popular-countries">
                {popularCountries.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            {errors.country && (
              <p className="text-xs text-red-400 pl-1">{errors.country}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase font-semibold tracking-wider text-slate-300">
              City <span className="text-[#D4AF37]">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="city"
                placeholder="Primary city"
                value={formData.city}
                onChange={(e) => onChange('city', e.target.value)}
                className={`w-full min-h-[48px] pl-10 pr-4 py-3 bg-[#0D1018] border rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none transition-all ${
                  errors.city ? 'border-red-500/80' : 'border-white/[0.1] focus:border-[#D4AF37]'
                }`}
                required
              />
            </div>
            {errors.city && (
              <p className="text-xs text-red-400 pl-1">{errors.city}</p>
            )}
          </div>
        </div>

        {/* Preferred Contact Method */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs uppercase font-semibold tracking-wider text-slate-300">
            Preferred Communication Channel
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {contactMethods.map((m) => {
              const Icon = m.icon;
              const isSelected = formData.preferred_contact_method === m.id;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChange('preferred_contact_method', m.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37] shadow-md shadow-[#D4AF37]/15'
                      : 'bg-[#0D1018] border-white/[0.08] hover:border-white/[0.2]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#D4AF37] bg-[#D4AF37]'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">{m.label}</span>
                    <span className="text-[10px] text-slate-400 block">{m.hint}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
