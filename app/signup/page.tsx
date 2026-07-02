'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        first_name: name.split(' ')[0] || '',
        last_name: name.split(' ').slice(1).join(' ') || '',
        role: 'viewer',
      })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--success-bg)] flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mt-4">Check Your Email</h2>
          <p className="text-sm text-muted mt-2">
            We've sent you a confirmation link. Please verify your email to continue.
          </p>
          <Link href="/login" className="inline-block mt-6 px-6 py-2 bg-[var(--primary-default)] text-white rounded-lg hover:bg-[var(--primary-hover)]">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary-default)] flex items-center justify-center text-white font-bold text-3xl mx-auto">
            Z
          </div>
          <h1 className="text-2xl font-bold mt-4">Z11</h1>
          <p className="text-sm text-muted">zone1 scm - Create Account</p>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6">Create Account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--error-bg)] border border-[var(--error)] text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-white focus:border-[var(--primary-default)] focus:outline-none"
                placeholder="Juan Dela Cruz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-white focus:border-[var(--primary-default)] focus:outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg text-white focus:border-[var(--primary-default)] focus:outline-none"
                placeholder="•••••••• (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--primary-default)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--primary-default)] hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}