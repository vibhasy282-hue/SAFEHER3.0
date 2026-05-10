'use client';

import { useEmergency } from '@/context/EmergencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FakeCallOverlay() {
  const { fakeCallActive, endFakeCall } = useEmergency();
  const [callState, setCallState] = useState<'incoming' | 'connected'>('incoming');
  const [callDuration, setCallDuration] = useState(0);

  // Reset state when fake call becomes active
  useEffect(() => {
    if (fakeCallActive) {
      setCallState('incoming');
      setCallDuration(0);
      
      // Play ringing sound
      const audio = new Audio();
      // Using Web Audio API to synthesize a ringing tone
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        let ringInterval = setInterval(() => {
          if (callState !== 'incoming') {
            clearInterval(ringInterval);
            return;
          }
          
          for (let i = 0; i < 2; i++) {
            const t = ctx.currentTime + i * 0.4;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, t);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
          }
        }, 2000);
        return () => clearInterval(ringInterval);
      } catch(e) { /* ignore */ }
    }
  }, [fakeCallActive]);

  // Handle call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === 'connected' && fakeCallActive) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState, fakeCallActive]);

  const handleAccept = () => {
    setCallState('connected');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {fakeCallActive && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[10020] flex flex-col bg-gradient-to-b from-[#1e293b] to-[#0f172a] text-white"
        >
          <div className="flex flex-1 flex-col items-center justify-center pt-20">
            <motion.div 
              animate={callState === 'incoming' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-5xl shadow-[0_0_30px_rgba(59,130,246,0.5)]"
            >
              👮
            </motion.div>
            
            <h1 className="mb-2 text-4xl font-semibold">Police Station</h1>
            
            <div className="text-xl text-slate-400">
              {callState === 'incoming' ? 'Incoming Call...' : formatDuration(callDuration)}
            </div>
          </div>

          <div className="flex justify-center gap-16 pb-20">
            {callState === 'incoming' ? (
              <>
                <button
                  onClick={endFakeCall}
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500 transition-transform group-hover:scale-110">
                    <PhoneOff className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-medium text-slate-300">Decline</span>
                </button>
                
                <button
                  onClick={handleAccept}
                  className="group flex flex-col items-center gap-3"
                >
                  <div className="flex h-20 w-20 animate-bounce items-center justify-center rounded-full bg-green-500 transition-transform group-hover:scale-110">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-medium text-slate-300">Accept</span>
                </button>
              </>
            ) : (
              <button
                onClick={endFakeCall}
                className="group flex flex-col items-center gap-3"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500 transition-transform group-hover:scale-110">
                  <PhoneOff className="h-8 w-8 text-white" />
                </div>
                <span className="font-medium text-slate-300">End Call</span>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
