'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import GuardianDashboard from '@/components/GuardianDashboard';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GuardianPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-safeher-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12122a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      <Navbar />

      <main className="pt-24 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-8 h-8 text-safeher-primary" />
              <h1 className="text-3xl font-bold text-white">Guardian Dashboard</h1>
            </div>
            <p className="text-safeher-muted">Monitor and respond to emergency alerts from your protected contacts</p>
          </motion.div>

          <GuardianDashboard />
        </div>
      </main>
    </div>
  );
}
