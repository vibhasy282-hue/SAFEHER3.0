'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, LogOut, Menu, X, Bell, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#050510]/95 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/40'
        : 'bg-[#050510]/80 backdrop-blur-lg border-b border-white/5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-safeher-primary to-safeher-danger flex items-center justify-center shadow-lg shadow-safeher-primary/30 group-hover:shadow-safeher-primary/50 transition-shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-safeher-success border-2 border-[#050510] animate-pulse" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              Safe<span className="bg-gradient-to-r from-safeher-primary to-pink-400 bg-clip-text text-transparent">Her</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link href="/dashboard"
                  className="text-sm text-gray-400 hover:text-white transition-colors font-medium hover:text-safeher-primary">
                  Dashboard
                </Link>
                <Link href="/guardian"
                  className="text-sm text-gray-400 hover:text-white transition-colors font-medium">
                  Guardian
                </Link>

                {/* Connection status */}
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  isOnline
                    ? 'text-safeher-success border-safeher-success/30 bg-safeher-success/10'
                    : 'text-orange-400 border-orange-400/30 bg-orange-400/10'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-safeher-success animate-pulse' : 'bg-orange-400'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </div>

                {/* User pill */}
                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-safeher-primary/30 to-safeher-secondary/30 border border-safeher-primary/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-safeher-primary">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-300 font-medium">{user.name}</span>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg text-gray-500 hover:text-safeher-danger hover:bg-safeher-danger/10 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors font-medium">
                  Login
                </Link>
                <Link href="/signup"
                  className="px-5 py-2 bg-gradient-to-r from-safeher-primary to-safeher-danger text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-safeher-primary/30 transition-all hover:-translate-y-0.5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-[#0a0a1a]/95 backdrop-blur-xl border-t border-white/5"
          >
            <div className="px-4 py-4 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-safeher-primary/30 to-safeher-secondary/30 border border-safeher-primary/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-safeher-primary">{user.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/guardian" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>
                    Guardian
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left text-safeher-danger hover:bg-safeher-danger/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-2.5 rounded-xl text-gray-300 hover:bg-white/5" onClick={() => setMobileOpen(false)}>Login</Link>
                  <Link href="/signup" className="block px-3 py-2.5 rounded-xl bg-gradient-to-r from-safeher-primary to-safeher-danger text-white font-semibold text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
