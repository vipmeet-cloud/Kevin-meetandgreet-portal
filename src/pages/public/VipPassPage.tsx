import { useState, useEffect, useRef } from 'react';
import { useRouter } from '../../router/Router';
import { passService } from '../../services/passService';
import { useSettings } from '../../context/SettingsContext';
import { VipPassRecord, getPassStatusDisplay } from '../../types/vipPass';
import {
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  Clock,
  Shield,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import QRCode from 'qrcode';
import { Link } from '../../router/Router';

export function VipPassPage() {
  const { path } = useRouter();
  const { settings } = useSettings();

  // Extract token from path: /vip-pass/[token] or /vip-pass?token=...
  const [token, setToken] = useState<string>('');
  const [pass, setPass] = useState<VipPassRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const passCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Extract token
    let extracted = '';
    if (path.startsWith('/vip-pass/')) {
      extracted = path.replace('/vip-pass/', '').split('?')[0].split('#')[0];
    } else if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      extracted = urlParams.get('token') || urlParams.get('id') || '';
    }

    setToken(extracted);
  }, [path]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    async function loadPass() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await passService.fetchPassByToken(token);
        if (res.pass) {
          setPass(res.pass);
          // Generate QR code pointing to public verification page
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const verifyUrl = `${origin}/verify/${res.pass.verification_token}`;
          const qr = await QRCode.toDataURL(verifyUrl, {
            width: 320,
            margin: 1,
            color: {
              dark: '#0A0D14',
              light: '#FFFFFF',
            },
            errorCorrectionLevel: 'H',
          });
          setQrDataUrl(qr);
        } else {
          setError('We could not find this VIP Pass. Please verify the link provided in your email.');
        }
      } catch (err) {
        console.error('Error fetching pass:', err);
        setError('Unable to load VIP Pass right now.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPass();
  }, [token]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPass = async () => {
    if (!pass || !qrDataUrl) return;
    setIsDownloading(true);

    try {
      // High-resolution canvas rendering for crystal-clear mobile saving
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 2; // Retina 2x
      const width = 420 * scale;
      const height = 660 * scale;
      canvas.width = width;
      canvas.height = height;

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0E131F');
      bgGrad.addColorStop(0.5, '#07090E');
      bgGrad.addColorStop(1, '#111726');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Card outer border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(16 * scale, 16 * scale, width - 32 * scale, height - 32 * scale);

      // Inner border accent
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)';
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(22 * scale, 22 * scale, width - 44 * scale, height - 44 * scale);

      // Gold top accent line
      const goldGrad = ctx.createLinearGradient(40 * scale, 0, width - 40 * scale, 0);
      goldGrad.addColorStop(0, 'rgba(212, 175, 55, 0.1)');
      goldGrad.addColorStop(0.5, '#D4AF37');
      goldGrad.addColorStop(1, 'rgba(212, 175, 55, 0.1)');
      ctx.fillStyle = goldGrad;
      ctx.fillRect(40 * scale, 26 * scale, width - 80 * scale, 3 * scale);

      // Header labels
      ctx.fillStyle = '#D4AF37';
      ctx.font = `bold ${11 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.letterSpacing = '3px';
      ctx.fillText('VIP MEET & GREET', width / 2, 54 * scale);

      // Celebrity name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${24 * scale}px Georgia, serif`;
      ctx.letterSpacing = '1px';
      ctx.fillText(pass.celebrity_name || settings?.celebrity_name || 'Kevin Costner', width / 2, 88 * scale);

      // Pass ID Pill
      ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
      ctx.lineWidth = 1 * scale;
      const pillW = 160 * scale;
      const pillH = 26 * scale;
      const pillX = (width - pillW) / 2;
      const pillY = 104 * scale;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 8 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F5D77F';
      ctx.font = `bold ${12 * scale}px monospace`;
      ctx.fillText(pass.pass_number, width / 2, 121 * scale);

      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(40 * scale, 146 * scale);
      ctx.lineTo(width - 40 * scale, 146 * scale);
      ctx.stroke();

      // Guest Name
      ctx.fillStyle = '#94A3B8';
      ctx.font = `${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillText('VIP GUEST', width / 2, 168 * scale);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${20 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillText(pass.applicant_name, width / 2, 194 * scale);

      // Event Session & Date
      ctx.fillStyle = '#CBD5E1';
      ctx.font = `${12 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillText(pass.session_time || 'Exclusive Session', width / 2, 218 * scale);

      ctx.fillStyle = '#D4AF37';
      ctx.font = `bold ${12 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillText(pass.event_date || 'Confirmed Schedule', width / 2, 238 * scale);

      // QR Code render
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise(resolve => {
        qrImg.onload = resolve;
      });

      const qrSize = 190 * scale;
      const qrX = (width - qrSize) / 2;
      const qrY = 265 * scale;

      // QR background rounded box
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(qrX - 10 * scale, qrY - 10 * scale, qrSize + 20 * scale, qrSize + 20 * scale, 14 * scale);
      ctx.fill();

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Verified by Management Badge
      ctx.fillStyle = '#10B981';
      ctx.font = `bold ${12 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillText('✓ Verified by Management', width / 2, 510 * scale);

      // Safety note
      ctx.fillStyle = '#64748B';
      ctx.font = `${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillText('Valid for entry with official photo ID', width / 2, 532 * scale);
      ctx.fillText('Present this pass on your phone upon arrival', width / 2, 550 * scale);

      // Footer
      ctx.fillStyle = '#475569';
      ctx.font = `${9 * scale}px monospace`;
      ctx.fillText(`TOKEN: ${pass.verification_token.substring(0, 16)}...`, width / 2, 620 * scale);

      // Convert to blob and download
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VIP-PASS-${pass.pass_number}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to generate pass download:', err);
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading your VIP Pass...</p>
        </div>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#121622] border border-white/[0.08] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif text-white font-medium">VIP Pass Unavailable</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'We could not find this VIP Pass. Please verify the link in your confirmation email or contact management.'}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C07B] text-black font-semibold text-xs rounded-xl transition-all"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isRevoked = pass.status === 'REVOKED';
  const isExpired = pass.status === 'EXPIRED';
  const statusInfo = getPassStatusDisplay(pass.status);
  const celebrityName = pass.celebrity_name || settings?.celebrity_name || 'Kevin Costner';

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 flex flex-col items-center justify-center">
      {/* Top Banner if Revoked */}
      {isRevoked && (
        <div className="max-w-md w-full mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <div>
            <span className="font-semibold block text-sm text-white">This VIP Pass is no longer valid</span>
            <p className="mt-0.5 text-rose-300">
              {pass.revocation_reason || 'Management has cancelled this pass. If you believe this is a mistake, please contact management.'}
            </p>
          </div>
        </div>
      )}

      {/* Main VIP Pass Card */}
      <div
        ref={passCardRef}
        className="w-full max-w-sm sm:max-w-md bg-[#0F1422] border-2 border-[#D4AF37] rounded-3xl p-6 sm:p-8 relative shadow-2xl overflow-hidden backdrop-blur-xl"
        style={{
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.15)',
        }}
      >
        {/* Subtle Gold Ambient Corner Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VIP MEET & GREET</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif text-white font-medium mt-1">
              {celebrityName}
            </h1>
          </div>

          {/* Pass Status Pill */}
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusInfo.bgClass} ${statusInfo.borderClass} ${statusInfo.colorClass}`}>
            {statusInfo.label}
          </div>
        </div>

        {/* Pass ID & Guest Details */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-block px-3 py-1 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5D77F] font-mono text-xs font-bold tracking-wider">
            {pass.pass_number}
          </div>

          <div className="pt-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block">VIP GUEST</span>
            <span className="text-lg sm:text-xl font-semibold text-white tracking-wide block mt-0.5">
              {pass.applicant_name}
            </span>
          </div>

          <div className="text-xs text-slate-300 font-medium">
            {pass.event_name || 'Exclusive VIP Audience & Reception'}
          </div>
        </div>

        {/* Event Schedule Info */}
        <div className="grid grid-cols-2 gap-2.5 bg-black/40 border border-white/[0.06] rounded-2xl p-3 mb-6 text-left">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Date</span>
              <span className="text-xs font-medium text-white truncate block">{pass.event_date}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Session</span>
              <span className="text-xs font-medium text-white truncate block">{pass.session_time}</span>
            </div>
          </div>
        </div>

        {/* Large Scannable QR Code */}
        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center mx-auto max-w-[240px] shadow-lg mb-5">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`VIP Pass QR Code for ${pass.pass_number}`}
              className="w-48 h-48 object-contain"
            />
          ) : (
            <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
              Generating QR...
            </div>
          )}
          <span className="text-[10px] text-slate-800 font-semibold uppercase tracking-wider mt-2">
            Scan to Verify
          </span>
        </div>

        {/* Verified Badge */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Verified by Management</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Please present this VIP Pass on your phone upon arrival.
          </p>
        </div>

        {/* View Verification Live Link */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] text-center">
          <Link
            href={`/verify/${pass.verification_token}`}
            className="text-[11px] text-[#D4AF37] hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Check live pass verification</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Action Buttons Below Pass */}
      <div className="max-w-sm sm:max-w-md w-full mt-6 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleDownloadPass}
          disabled={isDownloading || isRevoked}
          className="w-full sm:flex-1 py-3 px-4 bg-[#D4AF37] hover:bg-[#E5C07B] text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isDownloading ? 'Preparing Download...' : 'Download Pass'}</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="w-full sm:w-auto py-3 px-4 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Link Copied' : 'Copy Pass Link'}</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 mt-4 text-center max-w-sm">
        Keep your pass safe. Bring an official photo ID matching the applicant name on the day of the event.
      </p>
    </div>
  );
}
