export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-white/[0.04] rounded-xl border border-white/[0.04] ${className}`}
      aria-hidden="true"
    />
  );
}

export function HeroSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <LoadingSkeleton className="h-6 w-36" />
          <LoadingSkeleton className="h-14 w-full max-w-lg" />
          <LoadingSkeleton className="h-20 w-full max-w-md" />
          <div className="flex gap-4 pt-4">
            <LoadingSkeleton className="h-12 w-44 rounded-xl" />
            <LoadingSkeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <LoadingSkeleton className="h-[380px] sm:h-[450px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
