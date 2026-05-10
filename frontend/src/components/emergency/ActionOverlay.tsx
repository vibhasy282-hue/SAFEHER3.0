'use client';

import { useEmergency } from '@/context/EmergencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Phone, MessageSquare, Share2, X, MapPin, CheckCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

type ActionFeedback = { label: string; status: 'success' | 'info' | 'error' } | null;

export default function ActionOverlay({
  onActionSelect,
}: {
  onActionSelect: (action: string, data: any) => void;
}) {
  const { sosActive, cancelSOS } = useEmergency();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<'acquiring' | 'acquired' | 'failed'>('acquiring');
  const [feedback, setFeedback] = useState<ActionFeedback>(null);

  // Acquire location when SOS fires
  useEffect(() => {
    if (!sosActive) return;
    setLocStatus('acquiring');
    setLocation(null);
    setFeedback(null);

    if (!navigator.geolocation) {
      setLocStatus('failed');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus('acquired');
      },
      () => setLocStatus('failed'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [sosActive]);

  const mapsUrl = location
    ? `https://maps.google.com/?q=${location.lat},${location.lng}`
    : null;

  const emergencyMsg = useCallback(() => {
    let msg = '🚨 SAFEHER EMERGENCY ALERT 🚨\n\nI need immediate help!';
    if (location) {
      msg += `\n\n📍 My Live Location:\nLat: ${location.lat.toFixed(6)}, Lng: ${location.lng.toFixed(6)}\nMap: ${mapsUrl}`;
    } else {
      msg += '\n\n⚠️ Location unavailable';
    }
    msg += '\n\nSent via SafeHer AI Safety App';
    return msg;
  }, [location, mapsUrl]);

  const showFeedback = (label: string, status: ActionFeedback['status']) => {
    setFeedback({ label, status });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAction = (type: string) => {
    const msg = encodeURIComponent(emergencyMsg());

    if (type === 'police') {
      onActionSelect('call', { number: '100', label: 'Police 100' });
      showFeedback('Opening dialer for Police 100…', 'info');
    } else if (type === 'helpline') {
      onActionSelect('call', { number: '1091', label: 'Women Helpline 1091' });
      showFeedback('Opening dialer for Women Helpline…', 'info');
    } else if (type === 'emergency') {
      onActionSelect('call', { number: '112', label: 'Emergency 112' });
      showFeedback('Opening dialer for Emergency 112…', 'info');
    } else if (type === 'sms') {
      onActionSelect('sms', { number: '1091;100;112', message: msg });
      showFeedback('Opening SMS app…', 'info');
    } else if (type === 'whatsapp') {
      onActionSelect('whatsapp', { message: msg });
      showFeedback('Opening WhatsApp…', 'info');
    } else if (type === 'share') {
      onActionSelect('share', { message: msg, locationUrl: mapsUrl || 'unavailable' });
      showFeedback('Sharing location…', 'info');
    } else if (type === 'copy') {
      navigator.clipboard.writeText(emergencyMsg()).then(() => {
        showFeedback('Emergency message copied to clipboard!', 'success');
      }).catch(() => {
        showFeedback('Copy failed — try manually', 'error');
      });
    }
  };

  const ACTIONS = [
    {
      id: 'police',
      label: 'Police 100',
      emoji: '🚔',
      desc: 'Call immediately',
      gradient: 'from-red-600 to-red-800',
      glow: 'shadow-red-500/40',
      border: 'border-red-500/50',
    },
    {
      id: 'helpline',
      label: 'Women Helpline',
      emoji: '📞',
      desc: '1091 — 24/7 support',
      gradient: 'from-orange-500 to-orange-700',
      glow: 'shadow-orange-500/40',
      border: 'border-orange-500/50',
    },
    {
      id: 'emergency',
      label: 'Emergency 112',
      emoji: '🚨',
      desc: 'Unified emergency',
      gradient: 'from-rose-600 to-red-900',
      glow: 'shadow-rose-500/40',
      border: 'border-rose-500/50',
    },
    {
      id: 'sms',
      label: 'Send SMS Alert',
      emoji: '✉️',
      desc: 'SMS with location',
      gradient: 'from-purple-600 to-blue-700',
      glow: 'shadow-purple-500/40',
      border: 'border-purple-500/50',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Alert',
      emoji: '💬',
      desc: 'Share via WhatsApp',
      gradient: 'from-[#25D366] to-[#128C7E]',
      glow: 'shadow-green-500/40',
      border: 'border-green-500/50',
    },
    {
      id: 'share',
      label: 'Share Location',
      emoji: '📤',
      desc: 'Native share sheet',
      gradient: 'from-cyan-500 to-cyan-800',
      glow: 'shadow-cyan-500/40',
      border: 'border-cyan-500/50',
    },
  ];

  return (
    <AnimatePresence>
      {sosActive && (
        <motion.div
          key="sos-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          {/* Animated background rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute rounded-full border border-red-500/20 animate-ping"
                style={{
                  width: `${200 + i * 150}px`,
                  height: `${200 + i * 150}px`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '2.5s',
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.88, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.88, y: 30, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-br from-[#0f0418] via-[#180820] to-[#0f0c29] shadow-2xl shadow-red-500/20"
          >
            {/* Header */}
            <div className="relative overflow-hidden px-6 pt-6 pb-5 text-center border-b border-white/8">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/15 to-transparent" />
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-xl shadow-red-500/40"
              >
                <ShieldAlert className="h-8 w-8 text-white" />
              </motion.div>

              <h2 className="text-2xl font-black tracking-wide text-red-400">
                🚨 SOS ACTIVATED
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Choose an emergency action below.{' '}
                <span className="text-white font-medium">Your location is included in messages.</span>
              </p>

              {/* Location row */}
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5">
                <MapPin className="h-4 w-4 flex-shrink-0 text-red-400 animate-pulse" />
                <span className="font-mono text-xs text-gray-300">
                  {locStatus === 'acquiring' && (
                    <span className="text-yellow-400">Acquiring GPS location…</span>
                  )}
                  {locStatus === 'acquired' && location && (
                    <span className="text-green-400">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </span>
                  )}
                  {locStatus === 'failed' && (
                    <span className="text-orange-400">Location unavailable</span>
                  )}
                </span>
                {locStatus === 'acquired' && mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-[10px] text-cyan-400 underline hover:text-cyan-300"
                  >
                    View Map
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {ACTIONS.map((action, i) => (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    onClick={() => handleAction(action.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl bg-gradient-to-br ${action.gradient} border ${action.border} p-3.5 text-white shadow-lg ${action.glow} transition-shadow hover:shadow-xl`}
                  >
                    <span className="text-2xl">{action.emoji}</span>
                    <span className="text-xs font-black tracking-wide">{action.label}</span>
                    <span className="text-[10px] text-white/60">{action.desc}</span>
                  </motion.button>
                ))}
              </div>

              {/* Copy to clipboard */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleAction('copy')}
                className="w-full mb-3 flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 py-3 text-sm font-semibold text-gray-300 hover:bg-white/12 transition-colors"
              >
                📋 Copy Emergency Message to Clipboard
              </motion.button>

              {/* Feedback toast */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className={`mb-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border ${
                      feedback.status === 'success'
                        ? 'bg-green-500/15 border-green-500/30 text-green-300'
                        : feedback.status === 'error'
                        ? 'bg-red-500/15 border-red-500/30 text-red-300'
                        : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    {feedback.label}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={cancelSOS}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3.5 text-base font-black text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
                ✋ I'm Safe — Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
