'use client';

import { useState, useCallback } from 'react';
import { PhoneOff, Shield } from 'lucide-react';
import { emergencyAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useEmergency } from '@/context/EmergencyContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  location?: { latitude: number; longitude: number };
}

export default function SOSButton({ location }: Props) {
  const { sosActive, activateSOS, cancelSOS: contextCancelSOS } = useEmergency();
  const [isActivating, setIsActivating] = useState(false);

  // ── Trigger SOS on single click ──────────────────────────────────────────────
  const handleSOS = useCallback(async () => {
    if (sosActive) {
      // Already active — clicking again cancels
      contextCancelSOS();
      toast('✅ SOS cancelled');
      return;
    }

    if (isActivating) return;
    setIsActivating(true);

    try {
      // Show the action overlay immediately — don't wait for geolocation
      activateSOS();
      toast.success('🚨 SOS Activated!');

      // Attempt to log to backend (non-blocking)
      const currentLoc = location ?? await getCurrentPosition().catch(() => undefined);
      if (currentLoc) {
        await emergencyAPI.triggerSOS({
          type: 'panic_button',
          location: currentLoc,
          triggeredBy: 'user',
        }).catch(() => {}); // Silently ignore if backend is offline
      }
    } catch {
      // activateSOS already called — overlay is shown
    } finally {
      setIsActivating(false);
    }
  }, [sosActive, isActivating, location, activateSOS, contextCancelSOS]);

  return (
    <div className="flex flex-col items-center select-none gap-3">

      {/* ── Outer glow rings ── */}
      <div className="relative">
        {/* Animated idle rings */}
        {!sosActive && !isActivating && (
          <>
            <span
              className="absolute inset-0 m-auto rounded-full border-2 border-red-500/25 animate-ping"
              style={{ width: 188, height: 188, animationDuration: '1.8s' }}
            />
            <span
              className="absolute inset-0 m-auto rounded-full border border-red-500/12 animate-ping"
              style={{ width: 210, height: 210, animationDuration: '2.4s', animationDelay: '0.3s' }}
            />
          </>
        )}

        {/* SOS Active pulse rings */}
        {sosActive && (
          <>
            <span className="absolute inset-0 m-auto rounded-full bg-green-400/10 animate-ping" style={{ width: 200, height: 200 }} />
            <span className="absolute inset-0 m-auto rounded-full bg-green-400/5 animate-ping" style={{ width: 230, height: 230, animationDelay: '0.4s' }} />
          </>
        )}

        {/* Main button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={!sosActive ? { scale: 1.06 } : {}}
          onClick={handleSOS}
          disabled={isActivating}
          className={`
            relative w-[168px] h-[168px] rounded-full flex flex-col items-center justify-center gap-2
            transition-all duration-300 cursor-pointer select-none disabled:opacity-60
            ${sosActive
              ? 'bg-gradient-to-br from-emerald-500 to-green-700 shadow-[0_0_50px_rgba(16,185,129,0.6)]'
              : isActivating
                ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-[0_0_40px_rgba(233,69,96,0.5)]'
                : 'bg-gradient-to-br from-[#e94560] to-[#c0103a] shadow-[0_0_40px_rgba(233,69,96,0.45)] hover:shadow-[0_0_65px_rgba(233,69,96,0.7)]'
            }
          `}
          style={{ border: '3px solid rgba(255,255,255,0.18)' }}
          aria-label="SOS Emergency Button"
        >
          <AnimatePresence mode="wait">
            {sosActive ? (
              <motion.div
                key="active"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <PhoneOff className="w-9 h-9 text-white drop-shadow" />
                <span className="text-white font-black text-xs tracking-[0.2em] uppercase">CANCEL</span>
              </motion.div>
            ) : isActivating ? (
              <motion.div
                key="activating"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-9 h-9 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                <span className="text-white font-black text-xs tracking-widest">SENDING...</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="flex flex-col items-center gap-1"
              >
                <Shield className="w-10 h-10 text-white drop-shadow-lg" />
                <span className="text-white font-black text-[28px] leading-none tracking-[0.15em]">SOS</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Status label ── */}
      <AnimatePresence mode="wait">
        {sosActive ? (
          <motion.p
            key="active-label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-bold text-emerald-400"
          >
            🟢 Emergency active — tap to cancel
          </motion.p>
        ) : isActivating ? (
          <motion.p
            key="activating-label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-bold text-orange-400 animate-pulse"
          >
            Activating...
          </motion.p>
        ) : (
          <motion.p
            key="idle-label"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-gray-400 font-medium"
          >
            Tap to activate SOS
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });
}
