import { useState, useEffect } from 'react';
import { SettingsFormData, SettingsValidationErrors } from '../../types/settings';
import { fetchManagementMeetGreetSettings, saveMeetGreetSettings } from '../../services/settings';
import { validateSettingsForm } from '../../services/validation';
import { getCloudinaryConfig, uploadImageToCloudinary } from '../../services/cloudinary';
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
  Eye
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
  });

  const cloudinaryConfig = getCloudinaryConfig();

  // Load existing settings
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setErrorMessage(null);
      const { data, error } = await fetchManagementMeetGreetSettings();
      if (error) {
        setErrorMessage(error);
      } else if (data) {
        setExistingId(data.id);
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

    // Auto-clear validation error on change
    if (validationErrors[name as keyof SettingsValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
    setSaveSuccess(false);
  };

  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'celebrity_image_url' | 'event_logo_url') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentConfig = getCloudinaryConfig();
    if (!currentConfig.isConfigured) {
      setCloudinaryNotice(
        'Cloudinary cloud name is not set in environment (VITE_CLOUDINARY_CLOUD_NAME or CLOUDINARY_CLOUD_NAME). Please specify an image URL directly or set your Cloudinary variables.'
      );
      return;
    }

    setUploadingImage(true);
    setCloudinaryNotice(null);

    const folder = field === 'celebrity_image_url' ? 'celebrity-portraits' : 'event-logos';
    const result = await uploadImageToCloudinary(file, folder);

    if (result.error) {
      setCloudinaryNotice(result.error);
    } else if (result.secureUrl) {
      setFormData(prev => ({ ...prev, [field]: result.secureUrl! }));
      setCloudinaryNotice('Image uploaded to Cloudinary successfully.');
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

      {/* 1. Celebrity Identity Section */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-3">
          <h3 className="text-base font-serif text-white font-medium">
            1. Celebrity Identity & Billing
          </h3>
          <p className="text-xs text-slate-400">
            Define the persona represented by this portal. Never hardcoded; dynamic from Supabase.
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
              placeholder="e.g. Julian Vance, Maestro Chen, Elena Rostova"
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
              Celebrity Title / Designation *
            </label>
            <input
              type="text"
              name="celebrity_title"
              placeholder="e.g. Grammy-Nominated Soloist, Principal Artist"
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

      {/* 3. Brand Theme & Colors */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-3">
          <h3 className="text-base font-serif text-white font-medium">
            3. Brand Identity & Color System
          </h3>
          <p className="text-xs text-slate-400">
            Customize the portal visual identity. Colors update the public interface dynamically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Primary Brand Color (Hex)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="brand_primary_color"
                value={formData.brand_primary_color}
                onChange={handleChange}
                className="w-12 h-11 bg-transparent border-0 rounded cursor-pointer"
              />
              <input
                type="text"
                name="brand_primary_color"
                value={formData.brand_primary_color}
                onChange={handleChange}
                className="flex-1 px-4 py-2.5 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Secondary Canvas Color (Hex)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="brand_secondary_color"
                value={formData.brand_secondary_color}
                onChange={handleChange}
                className="w-12 h-11 bg-transparent border-0 rounded cursor-pointer"
              />
              <input
                type="text"
                name="brand_secondary_color"
                value={formData.brand_secondary_color}
                onChange={handleChange}
                className="flex-1 px-4 py-2.5 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Liaison & Official Support Channels */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-3">
          <h3 className="text-base font-serif text-white font-medium">
            4. Official Liaison & Support Contacts
          </h3>
          <p className="text-xs text-slate-400">
            Displayed on the public footer, contact section, and communication channels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Support Email *
            </label>
            <input
              type="email"
              name="support_email"
              placeholder="liaison@artistmanagement.com"
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
              Support Phone (Optional)
            </label>
            <input
              type="tel"
              name="support_phone"
              placeholder="+1 (555) 019-2831"
              value={formData.support_phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              WhatsApp Liaison (Optional)
            </label>
            <input
              type="text"
              name="support_whatsapp"
              placeholder="+1 (555) 019-2831"
              value={formData.support_whatsapp}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      {/* 5. VIP Admission Fee & Payment Stage Configuration (Phase 4) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#121622] border border-white/[0.08] space-y-6">
        <div className="border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <h3 className="text-base font-bold text-white tracking-wide">
              VIP Admission Fee & Payment Instructions
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure the required fee amount, what it covers, deadline window, refund/cancellation policies, and manual payment wire instructions presented to approved applicants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Fee Title / Designation *
            </label>
            <input
              type="text"
              name="fee_name"
              placeholder="VIP Private Audience & Credentials Fee"
              value={formData.fee_name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Amount & Currency *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="fee_amount"
                placeholder="2500"
                value={formData.fee_amount}
                onChange={handleChange}
                className="w-2/3 px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
              />
              <select
                name="fee_currency"
                value={formData.fee_currency}
                onChange={handleChange}
                className="w-1/3 px-3 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD ($)</option>
                <option value="CAD">CAD ($)</option>
                <option value="CHF">CHF</option>
                <option value="SGD">SGD ($)</option>
                <option value="PHP">PHP (₱)</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Fee Summary Description
            </label>
            <input
              type="text"
              name="fee_description"
              placeholder="Official admission credentials, private one-on-one executive audience, personal verified photography session, and dedicated VIP host accompaniment."
              value={formData.fee_description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              What the Fee Covers (Inclusions - One item per line)
            </label>
            <textarea
              name="fee_inclusions"
              rows={4}
              placeholder="1. Admission to the VIP Guest Area&#10;2. One-on-one meeting with the Celebrity Guest&#10;3. High-resolution photos & signed keepsake&#10;4. VIP Pass and venue entry&#10;5. Dedicated VIP host accompaniment"
              value={formData.fee_inclusions}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Payment Deadline Window (Hours)
            </label>
            <input
              type="number"
              name="payment_deadline_hours"
              placeholder="48"
              value={formData.payment_deadline_hours}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
            <p className="text-[11px] text-slate-500 mt-1">Hours after approval before admission window closes.</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Refund Policy Terms
            </label>
            <textarea
              name="refund_policy"
              rows={2}
              placeholder="Full refund provided if the scheduled audience is cancelled or rescheduled by executive management."
              value={formData.refund_policy}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Cancellation Policy
            </label>
            <textarea
              name="cancellation_policy"
              rows={2}
              placeholder="Written notice required at least 72 hours prior to scheduled audience."
              value={formData.cancellation_policy}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Official Payment Instructions (Wire Transfer / Bank Account Details) *
            </label>
            <textarea
              name="payment_instructions"
              rows={5}
              placeholder="Bank Name: Royal Private Reserve Bank&#10;Account Name: VIP Management Executive Escrow&#10;Account / IBAN: US89 RPRB 0192 8847 2910 44&#10;SWIFT / BIC: RPRBUS33&#10;Reference: Please include your VIP Application Reference Code in the wire reference field."
              value={formData.payment_instructions}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#0B0D12] border border-white/[0.1] rounded-xl text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-[#D4AF37] leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              * Note: These details are securely displayed only to approved applicants with authenticated continuation tokens.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Portal Visibility State */}
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

        <div className="flex items-center gap-3 w-full sm:w-auto">
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
