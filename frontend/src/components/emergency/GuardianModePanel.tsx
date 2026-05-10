'use client';

import { useState, useEffect, useRef } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { PhoneCall, Shield, Wifi, Eye, MapPin, Volume2, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GUARDIAN_LOGS = [
  { icon: '🔍', text: 'Scanning surroundings... All clear.' },
  { icon: '🎙️', text: 'Voice analysis: Normal ambient noise.' },
  { icon: '📍', text: 'Location check: Safe zone verified.' },
  { icon: '👥', text: 'Crowd density: Normal levels.' },
  { icon: '✅', text: 'No threats detected. Guardian watching.' },
  { icon: '📡', text: 'Network check: Stable. Backup ready.' },
  { icon: '🌙', text: 'Night mode active. Enhanced vigilance ON.' },
  { icon: '🔐', text: 'Encryption verified. Data secure.' },
];

const FAKE_CALLERS = ['Mom', 'Priya', 'Anjali', 'Rahul', 'Sneha', 'Ananya'];

export default function GuardianModePanel() {
  const { addTimelineEvent, triggerFakeCall } = useEmergency();
  const [guardianOn, setGuardianOn] = useState(false);
  const [logs, setLogs] = useState<{ icon: string; text: string; id: number }[]>([]);
  const [logId, setLogId] = useState(0);
  const [selectedCaller, setSelectedCaller] = useState(FAKE_CALLERS[0]);
  const [showCallerPicker, setShowCallerPicker] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (guardianOn) {
      // Add initial log
      setLogs([{ icon: '🟢', text: 'Continuous monitoring enabled. Predictive alerts on.', id: 0 }]);
      setLogId(1);

      interval = setInterval(() => {
        const entry = GUARDIAN_LOGS[Math.floor(Math.random() * GUARDIAN_LOGS.length)];
        setLogs(prev => [...prev.slice(-9), { ...entry, id: Date.now() }]);
      }, 4000);
    } else {
      setLogs([]);
    }
    return () => clearInterval(interval);
  }, [guardianOn]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const toggleGuardian = () => {
    const next = !guardianOn;
    setGuardianOn(next);
    addTimelineEvent(
      next ? '👼 Guardian Mode ON' : '👼 Guardian Mode OFF',
      next ? 'AI continuous monitoring activated' : 'AI monitoring disabled'
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Guardian Mode Card */}
      <div className={`rounded-3xl border backdrop-blur-2xl p-6 shadow-2xl transition-all duration-500 ${
        guardianOn
          ? 'border-safeher-success/30 bg-gradient-to-br from-safeher-success/10 to-emerald-900/10 shadow-safeher-success/10'
          : 'border-white/8 bg-gradient-to-br from-white/5 to-purple-500/5'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 ${
              guardianOn
                ? 'bg-gradient-to-br from-safeher-success to-emerald-600 shadow-safeher-success/40'
                : 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/30'
            }`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">AI Guardian Mode</h3>
              <p className="text-xs text-gray-500">Continuous threat monitoring</p>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-semibold ${!guardianOn ? 'text-gray-400' : 'text-gray-600'}`}>OFF</span>
            <button
              onClick={toggleGuardian}
              className={`relative h-7 w-14 rounded-full transition-all duration-300 focus:outline-none ${
                guardianOn ? 'bg-safeher-success shadow-lg shadow-safeher-success/30' : 'bg-white/15 hover:bg-white/20'
              }`}
            >
              <motion.div
                layout
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-md"
                animate={{ left: guardianOn ? '30px' : '4px' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            </button>
            <span className={`text-xs font-semibold ${guardianOn ? 'text-safeher-success' : 'text-gray-600'}`}>ON</span>
          </div>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { icon: Eye, label: 'Visual', active: guardianOn },
            { icon: Volume2, label: 'Audio', active: guardianOn },
            { icon: MapPin, label: 'Location', active: true },
            { icon: Radio, label: 'Network', active: true },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              active
                ? 'border-safeher-success/25 bg-safeher-success/8 text-safeher-success'
                : 'border-white/8 bg-white/4 text-gray-600'
            }`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`ml-auto w-1.5 h-1.5 rounded-full ${active && guardianOn ? 'bg-safeher-success animate-pulse' : active ? 'bg-gray-500' : 'bg-gray-700'}`} />
            </div>
          ))}
        </div>

        {/* Log output */}
        <div className={`rounded-2xl border p-3 h-24 overflow-y-auto scrollbar-hide transition-all duration-300 ${
          guardianOn ? 'border-safeher-success/15 bg-black/30' : 'border-white/8 bg-black/20'
        }`}>
          {guardianOn ? (
            <div className="space-y-1.5">
              <AnimatePresence>
                {logs.map(log => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span>{log.icon}</span>
                    <span className="text-gray-400 font-mono">{log.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={logsEndRef} />
            </div>
          ) : (
            <p className="text-xs text-gray-600 flex items-center gap-2 h-full">
              <Shield className="w-4 h-4 opacity-40" />
              Toggle ON to begin AI continuous monitoring
            </p>
          )}
        </div>
      </div>

      {/* Fake Call Card */}
      <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/5 to-green-500/5 backdrop-blur-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <PhoneCall className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Fake Call Escape</h3>
            <p className="text-xs text-gray-500">Simulate an incoming call to exit unsafe situations</p>
          </div>
        </div>

        {/* Caller selection */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Incoming from</p>
          <div className="relative">
            <button
              onClick={() => setShowCallerPicker(!showCallerPicker)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/8 border border-white/12 hover:bg-white/12 hover:border-white/20 transition-all text-sm font-semibold text-white"
            >
              <span className="flex items-center gap-2">
                <span className="text-base">📞</span>
                {selectedCaller}
              </span>
              <span className="text-gray-500 text-xs">▾</span>
            </button>
            <AnimatePresence>
              {showCallerPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  className="absolute top-full mt-2 w-full bg-[#0f0f2a] border border-white/15 rounded-2xl shadow-2xl z-10 overflow-hidden"
                >
                  {FAKE_CALLERS.map(caller => (
                    <button
                      key={caller}
                      onClick={() => { setSelectedCaller(caller); setShowCallerPicker(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/8 transition-colors ${caller === selectedCaller ? 'text-safeher-success font-semibold' : 'text-gray-300'}`}
                    >
                      {caller}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Trigger button */}
        <motion.button
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { triggerFakeCall(); addTimelineEvent('📞 Fake Call Triggered', `Simulated incoming call from ${selectedCaller}`); }}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 py-4 font-bold text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
        >
          <PhoneCall className="h-5 w-5" />
          Trigger Fake Call from {selectedCaller}
        </motion.button>

        <p className="text-xs text-gray-600 text-center mt-3">
          📱 Simulates a realistic incoming call with ringtone
        </p>
      </div>
    </div>
  );
}
