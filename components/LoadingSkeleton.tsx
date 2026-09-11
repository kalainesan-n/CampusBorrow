export default function LoadingSkeleton() {
  return (
    <div
      className="w-full bg-white rounded-2xl border border-amber-100 overflow-hidden animate-pulse"
      aria-label="Loading..."
      role="status"
    >
      <div className="h-40 bg-amber-50" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-12 bg-amber-100 rounded-full" />
          <div className="h-5 w-20 bg-amber-100 rounded-full" />
        </div>
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex justify-between mt-2">
          <div className="h-3 w-20 bg-gray-100 rounded" />
          <div className="h-3 w-12 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  )
}

export function LoadingSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <LoadingSkeleton key={i} />
      ))}
    </div>
  )
}
