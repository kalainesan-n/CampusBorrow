'use client'

interface ErrorStateProps {
  message?: string
  onRetry: () => void
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center p-8 text-center bg-red-50/90 rounded-2xl border border-red-200 shadow-xs max-w-md mx-auto my-8"
    >
      <div className="w-12 h-12 mb-3 rounded-full bg-red-100 flex items-center justify-center text-xl text-red-600 font-bold">
        ⚠️
      </div>
      <h3 className="text-base font-bold text-red-950 mb-1">
        Couldn't load items.
      </h3>
      <p className="text-xs text-red-700 max-w-xs mb-4">
        {message || 'A network error or database issue occurred. Please check your connection and try again.'}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
      >
        Retry
      </button>
    </div>
  )
}
