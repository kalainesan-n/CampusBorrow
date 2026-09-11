'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'

export default function SignInPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { addToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    setLoading(true)
    try {
      await signIn(email.trim(), password)
      addToast('Signed in successfully! Welcome back.')
      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in'
      if (msg.includes('Invalid login credentials')) {
        setErrorMessage('Incorrect email or password. Please try again.')
      } else if (msg.includes('Email not confirmed')) {
        setErrorMessage('Please check your email and verify your account first.')
      } else if (msg.includes('network') || msg.includes('Failed to fetch')) {
        setErrorMessage('Network connection error. Please check your internet connection.')
      } else {
        setErrorMessage(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-amber-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <span className="text-3xl font-extrabold text-amber-900 tracking-tight">
            CampusBorrow
          </span>
        </Link>
        <h2 className="mt-2 text-xl font-bold text-stone-800">
          Sign in to your account
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Borrow what you need. Share what you have.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl border border-amber-100 sm:rounded-2xl sm:px-10">
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="block text-xs font-bold text-stone-700 mb-1">
                Student Email Address
              </label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-200 transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="signin-password" className="block text-xs font-bold text-stone-700">
                  Password
                </label>
              </div>
              <input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-200 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-600">
            Don&apos;t have an account yet?{' '}
            <Link
              href="/auth/sign-up"
              className="font-bold text-amber-700 hover:text-amber-800 underline underline-offset-2"
            >
              Create an account
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 text-center">
            <Link
              href="/"
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              ← Back to Campus Feed
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
