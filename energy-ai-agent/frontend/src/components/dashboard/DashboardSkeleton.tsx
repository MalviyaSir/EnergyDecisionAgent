export function DashboardSkeleton() {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="premium-card h-40 animate-pulse bg-white/[0.08]" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="premium-card h-80 animate-pulse bg-white/[0.08]" />
        ))}
      </div>
    </div>
  );
}
