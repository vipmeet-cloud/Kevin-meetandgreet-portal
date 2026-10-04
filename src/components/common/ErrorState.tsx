import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Unable to Load Portal Information',
  message = 'The VIP concierge portal could not complete your request at this time. Please check your connectivity or try again shortly.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`p-6 sm:p-8 rounded-2xl bg-[#141824]/90 border border-amber-500/20 text-center max-w-lg mx-auto ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-serif font-semibold text-white mb-2 tracking-wide">
        {title}
      </h3>

      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black bg-[#D4AF37] hover:bg-[#E5C07B] rounded-xl transition-all shadow-md shadow-[#D4AF37]/20 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      )}
    </div>
  );
}
