'use client'

interface EmptyStateProps {
  isFiltered: boolean
  onClearFilters?: () => void
  onPost?: () => void
  isAuthenticated?: boolean
}

export default function EmptyState({
  isFiltered,
  onClearFilters,
  onPost,
  isAuthenticated,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white/70 backdrop-blur-xs rounded-2xl border border-dashed border-amber-200 shadow-xs max-w-lg mx-auto my-8">
      <div className="w-16 h-16 mb-4 rounded-full bg-amber-100 flex items-center justify-center text-2xl text-amber-700">
        {isFiltered ? '🔍' : '📦'}
      </div>
      <h3 className="text-lg font-bold text-amber-950 mb-2">
        {isFiltered ? 'No matching items found.' : 'Nothing here yet — be the first to post.'}
      </h3>
      <p className="text-sm text-stone-600 max-w-sm mb-6">
        {isFiltered
          ? 'Try adjusting your search terms or clearing your category filters to explore more items.'
          : 'CampusBorrow connects students needing items with classmates who have them. Share or ask for what you need!'}
      </p>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {isFiltered && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-200 transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            Clear Filters & Search
          </button>
        )}
        {!isFiltered && onPost && (
          <button
            onClick={onPost}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            {isAuthenticated ? '+ Create First Post' : 'Sign in to Post'}
          </button>
        )}
      </div>
    </div>
  )
}
