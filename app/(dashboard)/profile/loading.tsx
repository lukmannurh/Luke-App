export default function ProfileLoading() {
  return (
    <>
      <div className="h-10 w-48 animate-pulse rounded-xl bg-card" />
      <div className="mt-1 h-5 w-64 animate-pulse rounded-lg bg-card" />

      {/* Avatar + identity card */}
      <div className="brutal mt-5 flex animate-pulse items-center gap-4 rounded-2xl bg-accent p-5">
        <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-card" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-32 rounded-lg bg-card" />
          <div className="h-4 w-40 rounded-lg bg-card" />
          <div className="h-6 w-24 rounded-lg bg-card" />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="brutal h-24 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>

      {/* Recent activity skeleton */}
      <section className="mt-6">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-card" />
        <div className="mt-3 flex flex-col gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="brutal h-16 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      </section>
    </>
  );
}
