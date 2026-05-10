'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLocationTracker } from '@/hooks/useLocationTracker';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import SOSButton from '@/components/SOSButton';
import VoiceDetector from '@/components/VoiceDetector';
import WebcamMonitor from '@/components/WebcamMonitor';
import EmergencyHistory from '@/components/EmergencyHistory';
import ContactManager from '@/components/ContactManager';
import KeyboardSOS from '@/components/KeyboardSOS';
import EvidenceRecorder from '@/components/EvidenceRecorder';
import SafetyMap from '@/components/SafetyMap';
import VoiceAIPanel from '@/components/emergency/VoiceAIPanel';
import HiddenTriggersPanel from '@/components/emergency/HiddenTriggersPanel';
import OfflineStoragePanel from '@/components/emergency/OfflineStoragePanel';
import GuardianModePanel from '@/components/emergency/GuardianModePanel';
import EmergencyTimelinePanel from '@/components/emergency/EmergencyTimelinePanel';
import EmergencyOverlays from '@/components/emergency/EmergencyOverlays';
import { useHiddenTriggers } from '@/hooks/useHiddenTriggers';
import {
  Activity, Shield, Mic, Video, MapPin, Keyboard,
  Clock, Users, FileText, Zap, Eye, Bell, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: 'Overview',    icon: '🏠', desc: 'Main dashboard' },
  { id: 'monitoring', label: 'Monitoring',  icon: '👁️', desc: 'Live surveillance' },
  { id: 'routes',     label: 'Safe Routes', icon: '🗺️', desc: 'Map & directions' },
  { id: 'evidence',   label: 'Evidence',    icon: '📹', desc: 'Recording & logs' },
  { id: 'history',    label: 'History',     icon: '🕰️', desc: 'Emergency events' },
  { id: 'contacts',   label: 'Contacts',    icon: '👥', desc: 'Emergency contacts' },
];

// ─── Feature toggles config ────────────────────────────────────────────────────
const FEATURE_CONFIG = [
  { key: 'voice',    label: 'Voice AI',       icon: Mic,      color: 'from-cyan-500 to-blue-600',     desc: 'Keyword detection',  glow: 'shadow-cyan-500/25' },
  { key: 'webcam',   label: 'Webcam Guard',   icon: Video,    color: 'from-purple-500 to-pink-600',   desc: 'Visual monitoring',  glow: 'shadow-purple-500/25' },
  { key: 'location', label: 'GPS Tracking',   icon: MapPin,   color: 'from-green-500 to-emerald-600', desc: 'Live location',       glow: 'shadow-green-500/25' },
  { key: 'keyboard', label: 'Keyboard SOS',   icon: Keyboard, color: 'from-orange-500 to-red-600',    desc: 'Secret shortcuts',    glow: 'shadow-orange-500/25' },
];

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, border, dot, delay }: {
  icon: string; label: string; value: string;
  color: string; bg: string; border: string; dot: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, scale: 1.02 }}
      className={`p-4 rounded-2xl bg-gradient-to-br ${bg} border ${border} backdrop-blur-xl flex items-center gap-3 shadow-lg cursor-default`}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
          <p className={`text-sm font-bold ${color}`}>{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Feature toggle card ────────────────────────────────────────────────────────
function FeatureCard({ config, enabled, onToggle }: {
  config: typeof FEATURE_CONFIG[0]; enabled: boolean; onToggle: () => void
}) {
  const Icon = config.icon;
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03, y: -2 }}
      onClick={onToggle}
      className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 shadow-lg ${
        enabled
          ? `bg-gradient-to-br from-white/10 to-white/4 border-white/20 ${config.glow}`
          : 'bg-white/3 border-white/6 opacity-60 hover:opacity-80'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${
          enabled ? config.color : 'from-gray-700 to-gray-800'
        } shadow-lg transition-all duration-300`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={`relative h-6 w-11 rounded-full transition-all duration-300 ${
          enabled ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-white/15'
        }`}>
          <motion.div
            layout
            className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
            animate={{ left: enabled ? '24px' : '4px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        </div>
      </div>
      <p className={`font-bold text-sm ${enabled ? 'text-white' : 'text-gray-600'}`}>{config.label}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
        <p className="text-xs text-gray-500">{enabled ? 'Active' : config.desc}</p>
      </div>
    </motion.button>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [features, setFeatures] = useState({
    voice: true, webcam: true, location: true, keyboard: true,
  });

  useLocationTracker();
  useHiddenTriggers();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
          <div className="absolute inset-3 rounded-full border-2 border-pink-500/20 border-b-pink-500 animate-spin animate-reverse" />
        </div>
        <p className="text-gray-400 text-sm animate-pulse">Loading SafeHer...</p>
      </div>
    );
  }

  if (!user) return null;

  const toggleFeature = (key: string) =>
    setFeatures(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { icon: '🛡️', label: 'Safety Status', value: 'Protected',  color: 'text-green-400',  bg: 'from-green-500/15 to-emerald-500/5', border: 'border-green-500/20',  dot: 'bg-green-400', delay: 0.05 },
    { icon: '🎙️', label: 'Voice AI',      value: 'Ready',      color: 'text-cyan-400',   bg: 'from-cyan-500/15 to-blue-500/5',    border: 'border-cyan-500/20',   dot: 'bg-cyan-400',  delay: 0.1  },
    { icon: '📍', label: 'GPS',           value: 'Tracking',   color: 'text-blue-400',   bg: 'from-blue-500/15 to-indigo-500/5',  border: 'border-blue-500/20',   dot: 'bg-blue-400',  delay: 0.15 },
    { icon: '⚡', label: 'SOS Triggers',  value: '3 Active',   color: 'text-purple-400', bg: 'from-purple-500/15 to-pink-500/5',  border: 'border-purple-500/20', dot: 'bg-purple-400', delay: 0.2 },
  ];

  return (
    <div className="min-h-screen">
      <EmergencyOverlays />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#12122a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
        }}
      />
      <KeyboardSOS />
      <Navbar />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">

          {/* ── Hero greeting ── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-6 mt-4 overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-br from-purple-900/30 via-[#0a0a18] to-pink-900/20 backdrop-blur-2xl p-6 md:p-8 shadow-2xl"
          >
            {/* Decorative gradient blobs */}
            <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-pink-500/10 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div>
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-1">SafeHer AI Dashboard</p>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  {greeting},{' '}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                    {user.name}
                  </span>{' '}
                  👋
                </h1>
                <p className="text-gray-400 mt-1.5 text-sm">
                  Your AI safety shield is <span className="text-green-400 font-semibold">active</span> and monitoring 24/7
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/25 shadow-lg shadow-green-500/10">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-semibold text-green-400">All Systems Active</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                  <Bell className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-400">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {stats.map((s) => <StatCard key={s.label} {...s} />)}
            </div>
          </motion.div>

          {/* ── Sticky Tab Bar ── */}
          <div className="sticky top-16 z-30 -mx-4 px-4 pt-2 pb-3 mb-6 bg-gradient-to-b from-[#050510]/98 to-transparent backdrop-blur-md">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300 bg-white/4 hover:bg-white/8'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{tab.icon}</span>
                  <span className="relative z-10">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab Content ── */}
          <AnimatePresence mode="wait">

            {/* ───── OVERVIEW ───── */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                {/* SOS + Features */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* SOS Panel */}
                  <div className="relative overflow-hidden rounded-3xl border border-red-500/25 bg-gradient-to-br from-red-500/10 via-[#0f0010] to-purple-900/20 backdrop-blur-2xl p-8 flex flex-col items-center justify-center min-h-[340px] shadow-2xl shadow-red-500/10">
                    <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-red-500/8 blur-3xl" />
                    <p className="relative text-xs text-gray-500 uppercase tracking-widest mb-6 font-semibold">Emergency SOS</p>
                    <SOSButton />
                    <p className="relative text-xs text-gray-600 mt-6 text-center leading-relaxed max-w-[180px]">
                      Hold 1.5s to instantly alert emergency contacts & services
                    </p>
                  </div>

                  {/* Feature Toggles */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Safety Features</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {FEATURE_CONFIG.map(cfg => (
                        <FeatureCard
                          key={cfg.key}
                          config={cfg}
                          enabled={features[cfg.key as keyof typeof features]}
                          onToggle={() => toggleFeature(cfg.key)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Voice AI */}
                <VoiceAIPanel />

                {/* Safety Map */}
                <SafetyMap />

                {/* Hidden Triggers + Guardian */}
                <HiddenTriggersPanel />
                <GuardianModePanel />

                {/* Offline + Timeline */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <OfflineStoragePanel />
                  <EmergencyTimelinePanel />
                </div>
              </motion.div>
            )}

            {/* ───── MONITORING ───── */}
            {activeTab === 'monitoring' && (
              <motion.div
                key="monitoring"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                  <Eye className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <p className="text-sm text-cyan-200">Live monitoring panels below are active. Toggle features in the Overview tab.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <VoiceDetector enabled={features.voice} />
                  <WebcamMonitor enabled={features.webcam} />
                </div>
                <VoiceAIPanel />
              </motion.div>
            )}

            {/* ───── SAFE ROUTES ───── */}
            {activeTab === 'routes' && (
              <motion.div
                key="routes"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SafetyMap />
              </motion.div>
            )}

            {/* ───── EVIDENCE ───── */}
            {activeTab === 'evidence' && (
              <motion.div
                key="evidence"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                  <FileText className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <p className="text-sm text-purple-200">All recordings are stored locally on your device. Nothing is uploaded without your permission.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EvidenceRecorder />
                  <EmergencyHistory />
                </div>
              </motion.div>
            )}

            {/* ───── HISTORY ───── */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-200">Complete history of all emergency events, SOS activations, and AI detections stored locally.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <EmergencyHistory />
                  <EmergencyTimelinePanel />
                </div>
              </motion.div>
            )}

            {/* ───── CONTACTS ───── */}
            {activeTab === 'contacts' && (
              <motion.div
                key="contacts"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-green-500/20 bg-green-500/5">
                  <Users className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-200">Your emergency contacts will receive your live location and distress message during an SOS alert.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ContactManager />
                  <OfflineStoragePanel />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
