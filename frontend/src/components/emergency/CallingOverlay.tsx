'use client';

import { useEmergency } from '@/context/EmergencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';

interface CallingState {
  active: boolean;
  type: string;
  number: string;
  label: string;
  fallbackHint: string;
  fallbackData: string;
}

export default function CallingOverlay({ 
  callState, 
  onClose 
}: { 
  callState: CallingState; 
  onClose: () => void;
}) {
  const { addTimelineEvent } = useEmergency();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (callState.active) {
      setShowFallback(false);
      
      // Play a quick ringing tone
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        for (let i = 0; i < 4; i++) {
          const t = ctx.currentTime + i * 0.6;
          [440, 480].forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            osc.start(t);
            osc.stop(t + 0.25);
          });
        }
      } catch(e) { /* ignore */ }

      // Show fallback UI after 3.5 seconds (in case native dialog doesn't block the UI or fails)
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [callState.active]);

  const handleCopy = () => {
    navigator.clipboard.writeText(callState.fallbackData).then(() => {
      addTimelineEvent('📋 Copied', `Copied emergency data to clipboard`);
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy. Please manually select and copy the text.');
    });
  };

  return (
    <AnimatePresence>
      {callState.active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f0c29]/98 p-6 text-center"
        >
          {/* Ring Animation */}
          <div className="relative mb-8 h-32 w-32">
            <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 animate-[ping_1.5s_infinite] rounded-full border-4 border-safeher-danger opacity-75" />
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 animate-[ping_1.5s_infinite_0.5s] rounded-full border-4 border-safeher-danger opacity-50" />
            <div className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 animate-[ping_1.5s_infinite_1s] rounded-full border-4 border-safeher-danger opacity-25" />
          </div>

          <div className="mb-4 text-6xl font-black text-white drop-shadow-lg">
            {callState.number}
          </div>
          
          <div className="mb-8 animate-pulse text-xl font-bold tracking-widest text-safeher-danger">
            {showFallback ? 'ATTEMPTING TO OPEN...' : `CALLING ${callState.label.toUpperCase()}...`}
          </div>

          <AnimatePresence>
            {showFallback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md rounded-xl border border-safeher-danger bg-red-500/10 p-6"
              >
                <div className="mb-4 text-sm text-safeher-muted">
                  {callState.fallbackHint}
                </div>
                <div className="mb-6 break-all rounded-lg bg-black/50 p-4 font-mono text-xs text-white shadow-inner">
                  {callState.fallbackData}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleCopy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-safeher-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-safeher-primary/80"
                  >
                    <Copy className="h-4 w-4" /> Copy Data
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
