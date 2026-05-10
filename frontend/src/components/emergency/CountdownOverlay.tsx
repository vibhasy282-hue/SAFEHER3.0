'use client';

import { useEmergency } from '@/context/EmergencyContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function CountdownOverlay() {
  const { countdown, cancelCountdown } = useEmergency();

  return (
    <AnimatePresence>
      {countdown.active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#0f0c29]/95 text-center backdrop-blur-sm"
        >
          <div className="mb-8 text-xl text-safeher-muted">
            {countdown.triggerName} — Sending SOS in...
          </div>
          <motion.div
            key={countdown.timeLeft}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-9xl font-black text-safeher-danger drop-shadow-[0_0_40px_rgba(239,68,68,0.5)]"
          >
            {countdown.timeLeft}
          </motion.div>
          <button
            onClick={cancelCountdown}
            className="mt-12 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
          >
            ✋ Cancel Emergency
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
