'use client';

import { useEmergency } from '@/context/EmergencyContext';
import { ScrollText, Plus, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EVENT_COLORS: Record<string, { dot: string; glow: string; bg: string }> = {
  default: { dot: 'bg-safeher-primary', glow: 'shadow-safeher-primary/50', bg: 'bg-safeher-primary/10' },
  sos:     { dot: 'bg-red-500',         glow: 'shadow-red-500/50',         bg: 'bg-red-500/10' },
  voice:   { dot: 'bg-purple-500',      glow: 'shadow-purple-500/50',      bg: 'bg-purple-500/10' },
  call:    { dot: 'bg-green-500',       glow: 'shadow-green-500/50',       bg: 'bg-green-500/10' },
  guard:   { dot: 'bg-cyan-500',        glow: 'shadow-cyan-500/50',        bg: 'bg-cyan-500/10' },
};

function getEventStyle(title: string) {
  const t = title.toLowerCase();
  if (t.includes('sos') || t.includes('emergency')) return EVENT_COLORS.sos;
  if (t.includes('voice') || t.includes('mic') || t.includes('keyword')) return EVENT_COLORS.voice;
  if (t.includes('call') || t.includes('phone')) return EVENT_COLORS.call;
  if (t.includes('guard') || t.includes('monitor')) return EVENT_COLORS.guard;
  return EVENT_COLORS.default;
}

export default function EmergencyTimelinePanel() {
  const { timeline, addTimelineEvent } = useEmergency();

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/5 to-cyan-500/5 backdrop-blur-2xl p-6 shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <ScrollText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Emergency Timeline</h3>
            <p className="text-xs text-gray-500">{timeline.length} event{timeline.length !== 1 ? 's' : ''} recorded</p>
          </div>
        </div>
        <button
          onClick={() => addTimelineEvent('Manual Test', 'User triggered a test event')}
          className="flex items-center gap-1.5 rounded-xl bg-white/8 border border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/15 hover:text-white hover:border-white/20 active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> Add Test Event
        </button>
      </div>

      {/* Timeline */}
      <div className="relative flex-1 overflow-y-auto pr-2 scrollbar-hide min-h-[200px]">
        {timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-600">No events recorded yet</p>
            <p className="text-xs text-gray-700">Emergency activity will appear here in real-time</p>
          </div>
        ) : (
          <>
            {/* Vertical line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-safeher-primary/60 via-cyan-500/40 to-transparent rounded-full" />

            <div className="space-y-3">
              <AnimatePresence>
                {timeline.map((event, i) => {
                  const style = getEventStyle(event.title);
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="relative pl-10"
                    >
                      {/* Node */}
                      <div className={`absolute left-0 top-3 w-[38px] h-[38px] rounded-full border-4 border-[#0a0a1a] ${style.dot} shadow-lg ${style.glow} flex items-center justify-center`}>
                        <span className="w-2 h-2 rounded-full bg-white/60" />
                      </div>

                      {/* Card */}
                      <div className={`rounded-2xl border border-white/8 ${style.bg} backdrop-blur-sm p-3.5 transition-all hover:border-white/15 hover:bg-white/5`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-white text-sm leading-tight">{event.title}</span>
                          <span className="text-[10px] text-gray-600 font-mono flex-shrink-0 mt-0.5">{formatTime(event.time)}</span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{event.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
