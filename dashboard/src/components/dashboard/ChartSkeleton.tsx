export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-card border border-border ${className}`}>
      <div 
        className="absolute inset-0 bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface bg-[length:200%_100%] animate-pulse"
        style={{
          backgroundImage: 'linear-gradient(90deg, var(--color-card), var(--color-border), var(--color-card))',
          animation: 'shimmer 2s infinite linear'
        }}
      />
    </div>
  );
}
