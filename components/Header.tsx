'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import { useState } from 'react'

interface HeaderProps {
  onPost: () => void
}

export default function Header({ onPost }: HeaderProps) {
  const { user, loading, signOut } = useAuth()
  const { addToast } = useToast()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      addToast('Signed out successfully')
    } catch {
      addToast('Failed to sign out', 'error')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-amber-50 border-b-2 border-amber-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex flex-col min-w-0">
          <span className="text-xl font-bold text-amber-800 leading-tight truncate">CampusBorrow</span>
          <span className="text-xs text-amber-600 hidden sm:block">Borrow what you need. Share what you have.</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {loading ? (
            <div className="h-8 w-20 bg-amber-200 rounded animate-pulse" />
          ) : user ? (
            <>
              <span className="text-xs text-amber-700 hidden md:block max-w-[150px] truncate" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={onPost}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                + Post
              </button>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 text-sm rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                {signingOut ? '...' : 'Sign Out'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="px-3 py-1.5 text-amber-700 hover:text-amber-900 text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
