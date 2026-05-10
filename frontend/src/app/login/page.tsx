'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, guestLogin } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setError('');
    try {
      await guestLogin();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Guest login failed');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-strong rounded-2xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-safeher-primary/20 mb-4">
              <Shield className="w-7 h-7 text-safeher-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-sm text-safeher-muted mt-1">Sign in to your SafeHer account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-safeher-muted mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-safeher-muted" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-safeher-muted focus:outline-none focus:border-safeher-primary transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-safeher-muted mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-safeher-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-safeher-muted focus:outline-none focus:border-safeher-primary transition-colors"
                  placeholder="Your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-safeher-muted hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-safeher-danger bg-safeher-danger/10 p-3 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-safeher-primary text-white rounded-xl font-semibold hover:bg-safeher-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0a0a1a] text-safeher-muted">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="w-full py-3 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50"
            >
              {guestLoading ? 'Loading...' : 'Continue as Guest'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-safeher-muted">
              Don't have an account?{' '}
              <Link href="/signup" className="text-safeher-primary hover:underline">Get Started</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
