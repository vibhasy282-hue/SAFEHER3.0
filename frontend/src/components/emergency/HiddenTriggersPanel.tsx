'use client';

import { useEmergency } from '@/context/EmergencyContext';
import { Smartphone, Power, Volume2, Watch, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const TRIGGERS = [
  {
    key: 'shake',
    name: 'Shake Detection',
    icon: Smartphone,
    desc: 'Shake phone vigorously 3×',
    hint: 'Click to test',
    gradient: 'from-purple-500 to-violet-600',
    glow: 'shadow-purple-500/30',
    hoverGlow: 'hover:shadow-purple-500/50',
    border: 'hover:border-purple-500/50',
    bg: 'hover:bg-purple-500/10',
  },
  {
    key: 'power',
    name: 'Triple Power Press',
    icon: Power,
    desc: 'Press power button 3× fast',
    hint: 'Press "P" key ×3',
    gradient: 'from-red-500 to-orange-500',
    glow: 'shadow-red-500/30',
    hoverGlow: 'hover:shadow-red-500/50',
    border: 'hover:border-red-500/50',
    bg: 'hover:bg-red-500/10',
  },
  {
    key: 'volume',
    name: 'Long Volume Press',
    icon: Volume2,
    desc: 'Hold volume down 3 seconds',
    hint: 'Hold "V" key',
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'shadow-cyan-500/30',
    hoverGlow: 'hover:shadow-cyan-500/50',
    border: 'hover:border-cyan-500/50',
    bg: 'hover:bg-cyan-500/10',
  },
  {
    key: 'watch',
    name: 'Smartwatch Trigger',
    icon: Watch,
    desc: 'Double-tap smartwatch face',
    hint: 'Click to test',
    gradient: 'from-emerald-500 to-green-500',
    glow: 'shadow-emerald-500/30',
    hoverGlow: 'hover:shadow-emerald-500/50',
    border: 'hover:border-emerald-500/50',
    bg: 'hover:bg-emerald-500/10',
  },
];

export default function HiddenTriggersPanel() {
  const { triggerCountdown } = useEmergency();

  return (
    <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/5 to-purple-500/5 backdrop-blur-2xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Smart Hidden SOS Triggers</h3>
          <p className="text-xs text-gray-500">Discrete emergency activation — no one will notice</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-safeher-primary/10 border border-safeher-primary/25">
          <span className="w-1.5 h-1.5 rounded-full bg-safeher-primary animate-pulse" />
          <span className="text-xs font-semibold text-safeher-primary">Active</span>
        </div>
      </div>

      {/* Trigger cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TRIGGERS.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.button
              key={t.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => triggerCountdown(t.name)}
              className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 p-5 text-center transition-all duration-200 shadow-lg ${t.glow} ${t.hoverGlow} ${t.border} ${t.bg}`}
            >
              {/* Icon */}
              <div className={`mx-auto mb-3 w-12 h-12 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center shadow-lg ${t.glow} group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="h-6 w-6 text-white" />
              </div>

              {/* Text */}
              <h4 className="font-bold text-white text-sm mb-1">{t.name}</h4>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{t.desc}</p>

              {/* Hint badge */}
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                <Zap className="w-2.5 h-2.5" />
                {t.hint}
              </div>

              {/* Hover glow overlay */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${t.gradient} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`} />
            </motion.button>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/5 flex items-start gap-2.5">
        <span className="text-lg flex-shrink-0">💡</span>
        <p className="text-xs text-gray-500 leading-relaxed">
          All triggers start a <strong className="text-gray-300">5-second countdown</strong> before sending SOS — giving you time to cancel false alarms. Keyboard shortcuts work when the browser tab is active.
        </p>
      </div>
    </div>
  );
}
