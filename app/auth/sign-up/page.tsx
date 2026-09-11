'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const { addToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Please provide an email and password.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const data = await signUp(email.trim(), password)

      // In Supabase, if email confirmation is enabled:
      if (data?.user && !data.session) {
        setSuccessInfo(
          'Account created! If your campus Supabase project requires email verification, check your inbox.'
        )
        addToast('Account created! Please check your email.', 'info')
      } else {
        addToast('Account created and signed in successfully!')
        router.push('/')
        router.refresh()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign up'
      if (msg.includes('already registered') || msg.includes('User already registered')) {
        setErrorMessage('An account with this email already exists. Please sign in.')
      } else if (msg.includes('weak') || msg.includes('Password should be')) {
        setErrorMessage('Password is too weak. Please use at least 6 characters.')
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
          Create your student account
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Join your campus community to borrow and share items
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

          {successInfo && (
            <div
              role="status"
              className="mb-5 p-3.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-medium"
            >
              {successInfo}
              <div className="mt-3">
                <Link
                  href="/auth/sign-in"
                  className="font-bold underline text-green-900"
                >
                  Proceed to Sign In →
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-xs font-bold text-stone-700 mb-1">
                Student Email Address
              </label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password" className="block text-xs font-bold text-stone-700 mb-1">
                Password (at least 6 characters)
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 bg-white focus:border-amber-500 focus:outline-hidden focus:ring-2 focus:ring-amber-200 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="signup-confirm" className="block text-xs font-bold text-stone-700 mb-1">
                Confirm Password
              </label>
              <input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-600">
            Already have an account?{' '}
            <Link
              href="/auth/sign-in"
              className="font-bold text-amber-700 hover:text-amber-800 underline underline-offset-2"
            >
              Sign in
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
