export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-5 w-32 rounded bg-zinc-800" />
      <div className="h-24 rounded-lg border border-zinc-800 bg-zinc-900" />
      <div className="h-24 rounded-lg border border-zinc-800 bg-zinc-900" />
      <div className="h-24 rounded-lg border border-zinc-800 bg-zinc-900" />
    </div>
  );
}
