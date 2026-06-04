export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="brutal p-4 rounded-2xl bg-card border-3 border-border shadow-neo flex items-center gap-4">
        <div className="w-12 h-12 bg-muted rounded-xl border-2 border-border" />
        <div className="flex flex-col gap-2">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="brutal p-4 rounded-xl bg-card border-3 border-border shadow-neo flex flex-col gap-2">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="brutal p-4 rounded-2xl bg-card border-3 border-border shadow-neo flex flex-col gap-4 h-64">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="flex-1 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
