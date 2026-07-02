// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] px-4 relative overflow-hidden">
      {/* Futuristic Background Effects */}
      <div className="absolute inset-0">
        {/* Glowing Orbs */}
        <div className="absolute top-[-40%] right-[-20%] w-[600px] h-[600px] rounded-full bg-[#6366F1]/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-40%] left-[-20%] w-[600px] h-[600px] rounded-full bg-[#4F46E5]/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#312E81]/10 blur-[150px]" />
        
        {/* Grid Lines - Using CSS instead of SVG */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* Brand Section */}
        <div className="text-center mb-10 animate-[fadeInUp_0.6s_ease-out]">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[#6366F1]/30 blur-2xl rounded-full" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#312E81] flex items-center justify-center text-white font-bold text-3xl mx-auto shadow-2xl shadow-[#6366F1]/30">
              Z
            </div>
          </div>
          
          <h1 className="text-7xl font-bold mt-5 tracking-tight bg-gradient-to-r from-white via-white to-[#94A3B8] bg-clip-text text-transparent">
            Z11
          </h1>
          
          <p className="text-xl text-[#94A3B8] font-light tracking-[0.3em] uppercase mt-1">
            zone1 scm
          </p>
          
          <p className="text-sm text-[#64748B] mt-3 tracking-wider">
            Inventory · Control · Confidence
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111C2E]/60 backdrop-blur-2xl border border-[#FFFFFF0F] rounded-3xl p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
          {/* Card Glow Effect */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#6366F1] to-transparent" />

          <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
          <p className="text-[#94A3B8] text-sm mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#EF44441F] border border-[#EF4444]/30 text-sm text-[#EF4444] animate-[fadeInUp_0.3s_ease-out]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3.5 bg-[#0B1120] border border-[#FFFFFF0F] rounded-xl text-white placeholder:text-[#475569] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3.5 bg-[#0B1120] border border-[#FFFFFF0F] rounded-xl text-white placeholder:text-[#475569] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#6366F1] via-[#4F46E5] to-[#312E81] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#6366F1]/30 transition-all duration-300 disabled:opacity-50 relative overflow-hidden group"
            >
              <span className="relative z-10">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Get Started'
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#6366F1] to-[#312E81] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#64748B]">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#818CF8] hover:text-[#6366F1] font-medium transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#475569] text-xs mt-6 tracking-wider animate-[fadeInUp_0.6s_ease-out_0.6s_both]">
          © {new Date().getFullYear()} Z11 · All rights reserved
        </p>
      </div>

      {/* Custom Animations - Add to globals.css */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .animate-pulse {
          animation: pulse 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}