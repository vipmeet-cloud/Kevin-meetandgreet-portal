import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Shield, Copy, Check, QrCode as QrIcon } from 'lucide-react';

interface QRCodeDisplayProps {
  referenceCode: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({
  referenceCode,
  size = 200,
  className = '',
}: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function generateQR() {
      try {
        // Encode solely the official verification reference format
        const textToEncode = `AURA-VIP-REF:${referenceCode}`;
        const url = await QRCode.toDataURL(textToEncode, {
          width: size,
          margin: 1.5,
          color: {
            dark: '#D4AF37', // Gold QR code foreground
            light: '#0E1118', // Rich obsidian background
          },
          errorCorrectionLevel: 'M',
        });
        setDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    }

    if (referenceCode) {
      generateQR();
    }
  }, [referenceCode, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referenceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-5 rounded-2xl bg-[#0F131D] border border-white/[0.08] text-center space-y-4 shadow-xl ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
        <div className="flex items-center gap-1.5 text-[#D4AF37] font-mono uppercase tracking-wider font-semibold">
          <QrIcon className="w-3.5 h-3.5" />
          <span>Application Reference</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Reference Code</span>
      </div>

      {/* QR Code Container with subtle gold border */}
      <div className="relative inline-block p-3 rounded-2xl bg-[#090C12] border border-[#D4AF37]/30 shadow-2xl">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR code for reference ${referenceCode}`}
            className="rounded-xl w-44 h-44 mx-auto object-contain"
          />
        ) : (
          <div className="w-44 h-44 rounded-xl flex items-center justify-center bg-white/[0.02] text-xs text-slate-500">
            Generating Secure Barcode...
          </div>
        )}

        {/* Small Holographic Security Seal */}
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
          <Shield className="w-3 h-3" />
        </div>
      </div>

      {/* Reference Code Copy Bar */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-xs">
        <span className="text-white font-bold tracking-widest pl-2 truncate">
          {referenceCode}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[#D4AF37] hover:text-white transition-colors flex items-center gap-1 cursor-pointer shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Save this reference number for your records to check your application status.
      </p>
    </div>
  );
}
