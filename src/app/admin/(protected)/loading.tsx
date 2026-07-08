export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
            <div className="h-8 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
