import { useState, useEffect } from 'react';
import { SettingsFormData, SettingsValidationErrors } from '../../types/settings';
import { fetchManagementMeetGreetSettings, saveMeetGreetSettings } from '../../services/settings';
import { validateSettingsForm } from '../../services/validation';
import { getCloudinaryConfig, uploadImageToCloudinary, testCloudinaryConnection } from '../../services/cloudinary';
import { getSupabaseCredentials, setRuntimeSupabaseCredentials, getSupabaseClient } from '../../services/supabase';
import { applyFavicon, FAVICON_PRESETS } from '../../utils/favicon';
import { useSettings } from '../../context/SettingsContext';
import { 
  Save, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Info,
  Sparkles,
  Eye,
  Globe,
  Copy,
  Check,
  ShieldCheck,
  Database,
  Cloud
} from 'lucide-react';

export function SettingsForm() {
  const { refreshSettings } = useSettings();
  const [existingId, setExistingId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<SettingsValidationErrors>({});
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [cloudinaryNotice, setCloudinaryNotice] = useState<string | null>(null);
  const [faviconSuccessNotice, setFaviconSuccessNotice] = useState<string | null>(null);

  const [cloudinaryTest, setCloudinaryTest] = useState<{ testing: boolean; result?: { success: boolean; message: string; url?: string } }>({ testing: false });
  const [supabaseTest, setSupabaseTest] = useState<{ testing: boolean; result?: { success: boolean; message: string } }>({ testing: false });
  const [copiedEnv, setCopiedEnv] = useState<boolean>(false);

  const [formData, setFormData] = useState<SettingsFormData>({
    celebrity_name: '',
    celebrity_title: '',
    celebrity_bio: '',
    celebrity_image_url: '',
    event_name: '',
    event_description: '',
    hero_title: 'VIP Meet & Greet',
    hero_subtitle: '',
    event_logo_url: '',
    brand_primary_color: '#D4AF37',
    brand_secondary_color: '#0B0D12',
    support_email: '',
    support_phone: '',
    support_whatsapp: '',
    is_active: true,

    // Phase 4: Fee & Payment Configuration
    fee_name: 'VIP Meet & Greet Pass',
    fee_amount: 2500,
    fee_currency: 'USD',
    fee_description: 'VIP Meet & Greet Pass, private one-on-one meeting with the celebrity guest, professional photo session, and personal host accompaniment.',
    fee_inclusions: '1. Admission to the VIP Guest Area\n2. One-on-one meeting with the Celebrity Guest\n3. High-resolution photos & signed keepsake\n4. VIP Pass and venue entry\n5. Dedicated VIP host accompaniment',
    payment_deadline_hours: 48,
    refund_policy: 'Full refund provided if the meeting is cancelled or rescheduled by management. If you cannot attend, please let us know at least 72 hours in advance for a full refund.',
    cancellation_policy: 'Cancellations received within 48 hours of the scheduled meeting may be subject to venue fees.',
    payment_instructions: 'Bank Wire Transfer Details:\nBank Name: Royal Private Bank\nAccount Name: VIP Management\nAccount / IBAN: US89 RPRB 0192 8847 2910 44\nSWIFT / BIC: RPRBUS33\nReference: Please include your VIP Application Number in the transfer notes.',

    // Bitcoin & Cryptocurrency
    bitcoin_enabled: true,
    bitcoin_wallet_address: 'bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x',
    bitcoin_image_url: '',
    bitcoin_network: 'Bitcoin (BTC)',
    bitcoin_instructions: 'Transfer the exact fee equivalent to the Bitcoin wallet address below or scan the QR code. Keep your Transaction Hash / ID (TXID) for confirmation.',

    // Gift Card
    gift_card_enabled: true,
    gift_card_types: 'Apple Gift Card, Steam, Amazon, Vanilla Visa, Razer Gold',
    gift_card_instructions: 'Purchase an approved gift card matching your application fee amount. Enter the claim code / PIN and upload clear photos of the front and back of the card.',

    // Cloudinary Direct Config
    cloudinary_cloud_name: 'jt6qb4ke',
    cloudinary_upload_preset: 'Vipmeet',

    // Website Favicon & Visual Identity
    site_favicon_url: '/favicon.svg',

    // Supabase
    supabase_url: 'https://fiwsjwpyzhltzrdnpcrf.supabase.co',
    supabase_anon_key: '',
  });

  // Load existing settings
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setErrorMessage(null);
      const { data, error } = await fetchManagementMeetGreetSettings();
      const creds = getSupabaseCredentials();
      const cloudCfg = getCloudinaryConfig();

      if (error) {
        setErrorMessage(error);
      } else if (data) {
        const storedCloudName = typeof window !== 'undefined' ? localStorage.getItem('aura_vip_cloudinary_cloud_name') : null;
        const storedPreset = typeof window !== 'undefined' ? localStorage.getItem('aura_vip_cloudinary_upload_preset') : null;
        const storedFavicon = typeof window !== 'undefined' ? localStorage.getItem('aura_vip_site_favicon_url') : null;

        setExistingId(data.id);
        const resolvedFavicon = data.site_favicon_url || storedFavicon || '/favicon.svg';
        applyFavicon(resolvedFavicon);

        setFormData({
          celebrity_name: data.celebrity_name || '',
          celebrity_title: data.celebrity_title || '',
          celebrity_bio: data.celebrity_bio || '',
          celebrity_image_url: data.celebrity_image_url || '',
          event_name: data.event_name || '',
          event_description: data.event_description || '',
          hero_title: data.hero_title || 'VIP Meet & Greet',
          hero_subtitle: data.hero_subtitle || '',
          event_logo_url: data.event_logo_url || '',
          brand_primary_color: data.brand_primary_color || '#D4AF37',
          brand_secondary_color: data.brand_secondary_color || '#0B0D12',
          support_email: data.support_email || '',
          support_phone: data.support_phone || '',
          support_whatsapp: data.support_whatsapp || '',
          is_active: data.is_active ?? true,

          fee_name: data.fee_name || 'VIP Meet & Greet Pass',
          fee_amount: data.fee_amount !== null && data.fee_amount !== undefined ? data.fee_amount : 2500,
          fee_currency: data.fee_currency || 'USD',
          fee_description: data.fee_description || 'VIP Meet & Greet Pass, private one-on-one meeting with the celebrity guest, professional photo session, and personal host accompaniment.',
          fee_inclusions: data.fee_inclusions || '1. Admission to the VIP Guest Area\n2. One-on-one meeting with the Celebrity Guest\n3. High-resolution photos & signed keepsake\n4. VIP Pass and venue entry\n5. Dedicated VIP host accompaniment',
          payment_deadline_hours: data.payment_deadline_hours || 48,
          refund_policy: data.refund_policy || 'Full refund provided if the meeting is cancelled or rescheduled by management. If you cannot attend, please let us know at least 72 hours in advance for a full refund.',
          cancellation_policy: data.cancellation_policy || 'Cancellations received within 48 hours of the scheduled meeting may be subject to venue fees.',
          payment_instructions: data.payment_instructions || 'Bank Wire Transfer Details:\nBank Name: Royal Private Bank\nAccount Name: VIP Management\nAccount / IBAN: US89 RPRB 0192 8847 2910 44\nSWIFT / BIC: RPRBUS33\nReference: Please include your VIP Application Number in the transfer notes.',

          bitcoin_enabled: data.bitcoin_enabled ?? true,
          bitcoin_wallet_address: data.bitcoin_wallet_address || 'bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x',
          bitcoin_image_url: data.bitcoin_image_url || '',
          bitcoin_network: data.bitcoin_network || 'Bitcoin (BTC)',
          bitcoin_instructions: data.bitcoin_instructions || 'Transfer the exact fee equivalent to the Bitcoin wallet address below or scan the QR code. Keep your Transaction Hash / ID (TXID) for confirmation.',

          gift_card_enabled: data.gift_card_enabled ?? true,
          gift_card_types: data.gift_card_types || 'Apple Gift Card, Steam, Amazon, Vanilla Visa, Razer Gold',
          gift_card_instructions: data.gift_card_instructions || 'Purchase an approved gift card matching your application fee amount. Enter the claim code / PIN and upload clear photos of the front and back of the card.',

          cloudinary_cloud_name: storedCloudName || (data as any).cloudinary_cloud_name || cloudCfg.cloudName || 'jt6qb4ke',
          cloudinary_upload_preset: storedPreset || (data as any).cloudinary_upload_preset || cloudCfg.uploadPreset || 'Vipmeet',

          site_favicon_url: resolvedFavicon,

          supabase_url: (data as any).supabase_url || creds.url || 'https://fiwsjwpyzhltzrdnpcrf.supabase.co',
          supabase_anon_key: (data as any).supabase_anon_key || creds.anonKey || '',
        });
      }
      setLoading(false);
    }

    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (name === 'site_favicon_url') {
      applyFavicon(value);
    }

    // Auto-clear validation error on change
    if (validationErrors[name as keyof SettingsValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
    setSaveSuccess(false);
  };

  const handleCloudinaryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'celebrity_image_url' | 'event_logo_url' | 'bitcoin_image_url' | 'site_favicon_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setCloudinaryNotice(null);

    const folderMap = {
      celebrity_image_url: 'celebrity-portraits',
      event_logo_url: 'event-logos',
      bitcoin_image_url: 'crypto-wallets',
      site_favicon_url: 'favicons',
    } as const;

    const folder = folderMap[field] || 'celebrity-portraits';
    const result = await uploadImageToCloudinary(file, folder);

    if (result.error) {
      setCloudinaryNotice(result.error);
    } else if (result.secureUrl) {
      setFormData(prev => ({ ...prev, [field]: result.secureUrl! }));
      if (field === 'site_favicon_url') {
        applyFavicon(result.secureUrl);
        setFaviconSuccessNotice('Favicon uploaded and applied live to browser tab!');
        setTimeout(() => setFaviconSuccessNotice(null), 3000);
      }
      setCloudinaryNotice('Image uploaded and applied successfully.');
    }

    setUploadingImage(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setErrorMessage(null);

    const validation = validateSettingsForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setErrorMessage('Please review the highlighted validation errors before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);

    const { data, error } = await saveMeetGreetSettings(formData, existingId);

    if (error) {
      setErrorMessage(`Failed to save settings: ${error}`);
      setSaving(false);
      return;
    }

    if (data) {
      setExistingId(data.id);
      setSaveSuccess(true);
      if (formData.site_favicon_url) {
        applyFavicon(formData.site_favicon_url);
      }
      await refreshSettings();
      // Scroll to top to see notification
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-[#121622] border border-white/[0.08] text-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading current event parameters from Supabase...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      
      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-xs sm:text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Settings saved successfully. The public VIP portal now reflects the updated configuration.</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-xs sm:text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Cloudinary Information Notice */}
      {cloudinaryNotice && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-amber-300 text-xs">
          <Info className="w-4 h-4 shrink-0" />
          <span>{cloudinaryNotice}</span>
        </div>
      )}

      {/* 1. Celebrity Profile Information */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-3">
          <h3 className="text-base font-serif text-white font-medium">
            1. Featured Celebrity Profile
          </h3>
          <p className="text-xs text-slate-400">
            Configure the VIP guest details showcased to applicants on the exclusive landing page.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Celebrity Full Name *
            </label>
            <input
              type="text"
              name="celebrity_name"
              placeholder="e.g. Julian Vance"
              value={formData.celebrity_name}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] ${
                validationErrors.celebrity_name ? 'border-red-500' : 'border-white/[0.1]'
              }`}
              required
            />
            {validationErrors.celebrity_name && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.celebrity_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Professional Title / Credential *
            </label>
            <input
              type="text"
              name="celebrity_title"
              placeholder="e.g. Academy Award-Winning Actor & Filmmaker"
              value={formData.celebrity_title}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] ${
                validationErrors.celebrity_title ? 'border-red-500' : 'border-white/[0.1]'
              }`}
              required
            />
            {validationErrors.celebrity_title && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.celebrity_title}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Celebrity Biography & Background *
            </label>
            <textarea
              name="celebrity_bio"
              rows={4}
              placeholder="Provide a formal executive biography detailing career milestones and the nature of the engagement..."
              value={formData.celebrity_bio}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] leading-relaxed ${
                validationErrors.celebrity_bio ? 'border-red-500' : 'border-white/[0.1]'
              }`}
              required
            />
            {validationErrors.celebrity_bio && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.celebrity_bio}</p>
            )}
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Celebrity Portrait Image URL
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                name="celebrity_image_url"
                placeholder="https://images.example.com/portraits/artist.jpg"
                value={formData.celebrity_image_url}
                onChange={handleChange}
                className="flex-1 px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
              />

              {/* Cloudinary upload hook button */}
              <label className="min-h-[44px] px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.1] rounded-xl text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap">
                <Upload className="w-4 h-4 text-[#D4AF37]" />
                <span>{uploadingImage ? 'Uploading...' : 'Upload via Cloudinary'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCloudinaryUpload(e, 'celebrity_image_url')}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-500">
              Cloudinary integration architecture is prepared. You can provide any valid HTTPS image URL directly or upload an asset.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Event & Hero Presentation */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-3">
          <h3 className="text-base font-serif text-white font-medium">
            2. Event & Hero Display Presentation
          </h3>
          <p className="text-xs text-slate-400">
            Configure how the event is presented on the public hero and about sections.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Official Event Title *
            </label>
            <input
              type="text"
              name="event_name"
              placeholder="e.g. World Tour VIP Private Session 2026"
              value={formData.event_name}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] ${
                validationErrors.event_name ? 'border-red-500' : 'border-white/[0.1]'
              }`}
              required
            />
            {validationErrors.event_name && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.event_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Event Logo URL (Optional)
            </label>
            <input
              type="url"
              name="event_logo_url"
              placeholder="https://example.com/logo.png"
              value={formData.event_logo_url}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Hero Display Headline *
            </label>
            <input
              type="text"
              name="hero_title"
              placeholder="e.g. VIP Meet & Greet"
              value={formData.hero_title}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] ${
                validationErrors.hero_title ? 'border-red-500' : 'border-white/[0.1]'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Hero Display Subtitle *
            </label>
            <input
              type="text"
              name="hero_subtitle"
              placeholder="e.g. An Intimate Private Gathering with Julian Vance"
              value={formData.hero_subtitle}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] ${
                validationErrors.hero_subtitle ? 'border-red-500' : 'border-white/[0.1]'
              }`}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Event Purpose & Description *
            </label>
            <textarea
              name="event_description"
              rows={3}
              placeholder="Describe the venue arrangement, privacy standards, and attendance guidelines..."
              value={formData.event_description}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] leading-relaxed ${
                validationErrors.event_description ? 'border-red-500' : 'border-white/[0.1]'
              }`}
              required
            />
          </div>
        </div>
      </div>

      {/* 2b. Website Favicon & Browser Identity */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Website Favicon & Browser Identity
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Customize the browser tab icon and bookmark emblem displayed to all VIP applicants and management visitors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              applyFavicon(formData.site_favicon_url);
              setFaviconSuccessNotice('Active browser tab favicon refreshed!');
              setTimeout(() => setFaviconSuccessNotice(null), 3000);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Apply Live to Browser Tab</span>
          </button>
        </div>

        {faviconSuccessNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{faviconSuccessNotice}</span>
          </div>
        )}

        {/* Browser Tab Simulation Mockup */}
        <div className="p-4 rounded-2xl bg-[#090C12] border border-white/[0.06] space-y-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Live Browser Tab Preview
          </div>
          
          <div className="w-full bg-[#1A1F2C] rounded-xl p-2 border border-white/[0.08] shadow-inner">
            <div className="flex items-center gap-2 max-w-sm bg-[#0B0D12] px-3.5 py-2 rounded-lg border border-white/[0.08] text-xs text-slate-200">
              <img
                src={formData.site_favicon_url || '/favicon.svg'}
                alt="Favicon Preview"
                className="w-4 h-4 object-contain rounded shrink-0 bg-white/10 p-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/favicon.svg';
                }}
              />
              <span className="truncate font-medium text-slate-100 flex-1">
                {formData.event_name ? `${formData.event_name} | VIP Portal` : 'VIP Meet & Greet Portal'}
              </span>
              <span className="text-slate-500 text-[10px] ml-1">✕</span>
            </div>
          </div>
        </div>

        {/* Favicon URL & Direct Upload */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Favicon Icon URL / Asset Source
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                name="site_favicon_url"
                placeholder="https://... or choose from presets below"
                value={formData.site_favicon_url}
                onChange={handleChange}
                className="flex-1 px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
              />

              <label className="min-h-[44px] px-4 py-2.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-amber-300 border border-[#D4AF37]/30 rounded-xl text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap">
                <Upload className="w-4 h-4 text-[#D4AF37]" />
                <span>{uploadingImage ? 'Uploading...' : 'Upload Favicon'}</span>
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/x-icon,image/jpeg,image/webp"
                  onChange={(e) => handleCloudinaryUpload(e, 'site_favicon_url')}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Supports SVG, PNG, ICO, and WEBP formats. Automatically uploaded to Cloudinary or stored with zero compression loss.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Instant Luxury VIP Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FAVICON_PRESETS.map((preset) => {
                const isSelected = formData.site_favicon_url === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, site_favicon_url: preset.url }));
                      applyFavicon(preset.url);
                      setFaviconSuccessNotice(`Preset "${preset.name}" applied!`);
                      setTimeout(() => setFaviconSuccessNotice(null), 2500);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-6 h-6 object-contain rounded shrink-0 bg-black/40 p-0.5 border border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{preset.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{preset.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Brand Theme & Colors */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-3">
          <h3 className="text-base font-serif text-white font-medium">
            3. Visual Theme & Palette Configuration
          </h3>
          <p className="text-xs text-slate-400">
            Define primary and secondary accent colors used across the applicant journey and security credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Primary Brand Accent (Gold Default: #D4AF37) *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="brand_primary_color"
                value={formData.brand_primary_color}
                onChange={handleChange}
                className="w-12 h-11 bg-transparent border border-white/[0.1] rounded-xl cursor-pointer p-1"
              />
              <input
                type="text"
                name="brand_primary_color"
                value={formData.brand_primary_color}
                onChange={handleChange}
                className="flex-1 px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
                placeholder="#D4AF37"
                required
              />
            </div>
            {validationErrors.brand_primary_color && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.brand_primary_color}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Secondary Deep Base (#0B0D12 Default) *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="brand_secondary_color"
                value={formData.brand_secondary_color}
                onChange={handleChange}
                className="w-12 h-11 bg-transparent border border-white/[0.1] rounded-xl cursor-pointer p-1"
              />
              <input
                type="text"
                name="brand_secondary_color"
                value={formData.brand_secondary_color}
                onChange={handleChange}
                className="flex-1 px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
                placeholder="#0B0D12"
                required
              />
            </div>
            {validationErrors.brand_secondary_color && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.brand_secondary_color}</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Support & Executive Contact */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-3">
          <h3 className="text-base font-serif text-white font-medium">
            4. Support & Executive Concierge Channels
          </h3>
          <p className="text-xs text-slate-400">
            Contact addresses displayed to approved applicants requiring personalized concierge assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Official Inquiries Email *
            </label>
            <input
              type="email"
              name="support_email"
              placeholder="management.meet.greet@gmail.com"
              value={formData.support_email}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] ${
                validationErrors.support_email ? 'border-red-500' : 'border-white/[0.1]'
              }`}
              required
            />
            {validationErrors.support_email && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.support_email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Concierge Phone Line (Optional)
            </label>
            <input
              type="tel"
              name="support_phone"
              placeholder="+1 (800) 555-0199"
              value={formData.support_phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              VIP WhatsApp Support (Optional)
            </label>
            <input
              type="tel"
              name="support_whatsapp"
              placeholder="+1 (555) 019-8822"
              value={formData.support_whatsapp}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      {/* 5. Phase 4: Fee & Payment Instructions Configuration */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-serif text-white font-medium flex items-center gap-2">
              <span>5. VIP Application Fee & Payment Terms</span>
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] font-sans font-bold border border-[#D4AF37]/20">
                Phase 4
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure the mandatory pass fee required upon applicant approval, alongside disbursement deadlines and bank wiring instructions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Fee Tier Title *
            </label>
            <input
              type="text"
              name="fee_name"
              placeholder="e.g. Executive VIP Meet & Greet Pass"
              value={formData.fee_name}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] ${
                validationErrors.fee_name ? 'border-red-500' : 'border-white/[0.1]'
              }`}
              required
            />
            {validationErrors.fee_name && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.fee_name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Currency *
            </label>
            <select
              name="fee_currency"
              value={formData.fee_currency}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
              <option value="CHF">CHF (Fr)</option>
              <option value="AED">AED (د.إ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Fee Amount ({formData.fee_currency}) *
            </label>
            <input
              type="number"
              name="fee_amount"
              min="0"
              step="1"
              placeholder="2500"
              value={formData.fee_amount}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#0B0D12] border rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] ${
                validationErrors.fee_amount ? 'border-red-500' : 'border-white/[0.1]'
              }`}
              required
            />
            {validationErrors.fee_amount && (
              <p className="text-[11px] text-red-400 mt-1">{validationErrors.fee_amount}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Payment Window (Hours from Approval) *
            </label>
            <input
              type="number"
              name="payment_deadline_hours"
              min="1"
              max="720"
              placeholder="48"
              value={formData.payment_deadline_hours}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
            <p className="text-[11px] text-slate-500 mt-1">Default is 48 hours. After this window, unpaid applications expire.</p>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Fee Summary & Description
            </label>
            <textarea
              name="fee_description"
              rows={2}
              placeholder="Brief description of what the VIP fee covers..."
              value={formData.fee_description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] leading-relaxed"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Pass Inclusions (Displayed as Checkpoints)
            </label>
            <textarea
              name="fee_inclusions"
              rows={4}
              placeholder="List items line by line (e.g. 1. Admission to VIP Area...)"
              value={formData.fee_inclusions}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] font-mono leading-relaxed text-xs"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Payment Remittance Instructions (Wire Transfer Details) *
            </label>
            <textarea
              name="payment_instructions"
              rows={6}
              placeholder="Bank Name: ...&#10;Account Name: ...&#10;IBAN / Account: ...&#10;SWIFT: ...&#10;Reference instruction: ..."
              value={formData.payment_instructions}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] font-mono leading-relaxed"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Displayed on the applicant payment portal once their application status is changed to Approved.
            </p>
          </div>

          <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Refund Policy
              </label>
              <textarea
                name="refund_policy"
                rows={3}
                placeholder="Full refund provided if the meeting is cancelled..."
                value={formData.refund_policy}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Cancellation Policy
              </label>
              <textarea
                name="cancellation_policy"
                rows={3}
                placeholder="Cancellations received within 48 hours..."
                value={formData.cancellation_policy}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Bitcoin & Cryptocurrency Gateway Configuration */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Bitcoin & Cryptocurrency Gateway
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enable crypto settlement with customizable token name, receiving wallet address, QR code upload, and TXID confirmation.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              name="bitcoin_enabled"
              checked={formData.bitcoin_enabled}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-400"></div>
            <span className="ml-3 text-xs font-semibold text-slate-300">
              {formData.bitcoin_enabled ? 'Active' : 'Disabled'}
            </span>
          </label>
        </div>

        {formData.bitcoin_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Cryptocurrency Token / Network *
              </label>
              <input
                type="text"
                name="bitcoin_network"
                placeholder="e.g. Bitcoin (BTC) / Lightning, USDT (TRC-20), ETH"
                value={formData.bitcoin_network}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">Token ticker and network displayed to applicant.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Bitcoin / Wallet Receiving Address *
              </label>
              <input
                type="text"
                name="bitcoin_wallet_address"
                placeholder="e.g. bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x"
                value={formData.bitcoin_wallet_address}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm font-mono text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">Applicant will copy this address for payment transfer.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Bitcoin Wallet QR Code / Payment Image
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <input
                  type="text"
                  name="bitcoin_image_url"
                  placeholder="https://res.cloudinary.com/... or paste image URL"
                  value={formData.bitcoin_image_url}
                  onChange={handleChange}
                  className="flex-1 w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
                
                <label className="w-full sm:w-auto px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-amber-300 rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0 border border-amber-400/20">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload QR Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCloudinaryUpload(e, 'bitcoin_image_url')}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.bitcoin_image_url && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/[0.06] w-fit">
                  <img
                    src={formData.bitcoin_image_url}
                    alt="Bitcoin Wallet QR"
                    className="w-16 h-16 object-contain rounded-lg border border-white/[0.1] bg-white p-1"
                  />
                  <div className="text-xs space-y-0.5">
                    <span className="font-semibold text-white block">Active QR Code Applied</span>
                    <span className="text-[11px] text-slate-400 block">Applicants can scan this QR code directly to pay</span>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Crypto Payment Instructions & Guidelines
              </label>
              <textarea
                name="bitcoin_instructions"
                rows={3}
                placeholder="1. Send exact fee amount to wallet address above&#10;2. Confirm network before sending&#10;3. Submit Transaction ID (TXID) hash below"
                value={formData.bitcoin_instructions}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 leading-relaxed font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* 7. Gift Card Gateway Configuration */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Gift Card Payment Gateway
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Allow applicants to pay using verified gift cards with claim code, PIN, and card photo upload options.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              name="gift_card_enabled"
              checked={formData.gift_card_enabled}
              onChange={handleChange}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-400"></div>
            <span className="ml-3 text-xs font-semibold text-slate-300">
              {formData.gift_card_enabled ? 'Active' : 'Disabled'}
            </span>
          </label>
        </div>

        {formData.gift_card_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Accepted Gift Card Brands (Comma-separated)
              </label>
              <input
                type="text"
                name="gift_card_types"
                placeholder="Apple Gift Card, Steam, Razer Gold, Amazon, Google Play, Vanilla Visa"
                value={formData.gift_card_types}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">Options displayed in the applicant gift card selection dropdown.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Gift Card Instructions for Applicant
              </label>
              <textarea
                name="gift_card_instructions"
                rows={3}
                placeholder="Please purchase a physical or digital gift card matching your fee amount. Enter the claim code / PIN and upload clear photos of both front and back of the card showing barcodes."
                value={formData.gift_card_instructions}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400 leading-relaxed font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* 8. Cloudinary Media Storage Configuration */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-400" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Cloudinary Media Storage & Presets (Vercel Ready)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Your Cloudinary cloud name and unsigned upload preset (configured to <code className="text-sky-300 font-mono">Vipmeet</code>).
            </p>
          </div>

          <button
            type="button"
            disabled={cloudinaryTest.testing}
            onClick={async () => {
              setCloudinaryTest({ testing: true });
              const res = await testCloudinaryConnection(formData.cloudinary_cloud_name, formData.cloudinary_upload_preset);
              setCloudinaryTest({ testing: false, result: res });
            }}
            className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            {cloudinaryTest.testing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Testing Connection...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Cloudinary Connection</span>
              </>
            )}
          </button>
        </div>

        {cloudinaryTest.result && (
          <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
            cloudinaryTest.result.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {cloudinaryTest.result.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            )}
            <div className="space-y-1">
              <span className="font-semibold block">{cloudinaryTest.result.message}</span>
              {cloudinaryTest.result.url && (
                <a
                  href={cloudinaryTest.result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] underline text-emerald-200 mt-1"
                >
                  <span>View Verified Test Asset</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Cloudinary Cloud Name
            </label>
            <input
              type="text"
              name="cloudinary_cloud_name"
              placeholder="jt6qb4ke"
              value={formData.cloudinary_cloud_name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">Pre-configured with verified cloud name <code className="text-sky-300">jt6qb4ke</code>.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Upload Preset
            </label>
            <input
              type="text"
              name="cloudinary_upload_preset"
              placeholder="Vipmeet"
              value={formData.cloudinary_upload_preset}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">Unsigned preset <code className="text-sky-300">Vipmeet</code> is active and tested.</p>
          </div>
        </div>
      </div>

      {/* 9. Supabase Database & Vercel Sync Helper */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Supabase Database & Vercel Synchronization
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify database connectivity and copy environment variables for your Vercel deployment.
            </p>
          </div>

          <button
            type="button"
            disabled={supabaseTest.testing}
            onClick={async () => {
              setSupabaseTest({ testing: true });
              try {
                const client = getSupabaseClient();
                if (!client) {
                  setSupabaseTest({ testing: false, result: { success: false, message: 'Could not initialize Supabase client.' } });
                  return;
                }
                const { error } = await client.from('meet_greet_settings').select('id').limit(1);
                if (error) {
                  setSupabaseTest({ testing: false, result: { success: false, message: `Database error: ${error.message}` } });
                } else {
                  setSupabaseTest({ testing: false, result: { success: true, message: 'Supabase PostgreSQL connected successfully! 200 OK verified.' } });
                }
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Connection failed';
                setSupabaseTest({ testing: false, result: { success: false, message: msg } });
              }
            }}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            {supabaseTest.testing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Pinging Supabase...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Test Database Ping</span>
              </>
            )}
          </button>
        </div>

        {supabaseTest.result && (
          <div className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
            supabaseTest.result.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {supabaseTest.result.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span className="font-semibold">{supabaseTest.result.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Supabase Project URL
            </label>
            <input
              type="text"
              name="supabase_url"
              placeholder="https://fiwsjwpyzhltzrdnpcrf.supabase.co"
              value={formData.supabase_url}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Supabase Anon Public Key
            </label>
            <input
              type="password"
              name="supabase_anon_key"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={formData.supabase_anon_key}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* 1-Click Copy Helper for Vercel Environment Variables */}
        <div className="p-4 rounded-2xl bg-[#0B0D12] border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Vercel Dashboard Environment Variables</span>
            </span>
            <button
              type="button"
              onClick={() => {
                const envText = `VITE_SUPABASE_URL=${formData.supabase_url || 'https://fiwsjwpyzhltzrdnpcrf.supabase.co'}\nVITE_SUPABASE_ANON_KEY=${formData.supabase_anon_key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpd3Nqd3B5emhsdHpyZG5wY3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMTk1NTYsImV4cCI6MjEwNjU5NTU1Nn0.Vx7y96504_aJaORBHv1bC2T3IK7Usx_rhj78OPE_wNI'}\nVITE_CLOUDINARY_CLOUD_NAME=${formData.cloudinary_cloud_name || 'jt6qb4ke'}\nVITE_CLOUDINARY_UPLOAD_PRESET=${formData.cloudinary_upload_preset || 'Vipmeet'}\nCLOUDINARY_CLOUD_NAME=${formData.cloudinary_cloud_name || 'jt6qb4ke'}\nCLOUDINARY_UPLOAD_PRESET=${formData.cloudinary_upload_preset || 'Vipmeet'}`;
                navigator.clipboard.writeText(envText);
                setCopiedEnv(true);
                setTimeout(() => setCopiedEnv(false), 3000);
              }}
              className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedEnv ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All 4 Vercel Env Vars</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Even without entering these in Vercel, our application automatically falls back to these pre-bundled credentials, ensuring your deployed site works right out of the box!
          </p>
        </div>
      </div>

      {/* 10. Portal Visibility State */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-white/[0.08] flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-white">Active Portal Status</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            When enabled, visitors see this configuration on the public landing page. When disabled, the portal displays a holding state.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
        </label>
      </div>

      {/* Submit Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/[0.06]">
        <div className="text-xs text-slate-500">
          * Modifications are committed directly to Supabase Postgres via authenticated RLS policies.
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Preview Public View</span>
          </a>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-[#D4AF37] hover:bg-[#E5C07B] active:scale-[0.98] text-black font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to Supabase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Event Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

    </form>
  );
}
