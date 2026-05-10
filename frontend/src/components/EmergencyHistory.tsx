'use client';

import { useState, useEffect } from 'react';
import { emergencyAPI } from '@/lib/api';
import { EmergencyLog } from '@/types';
import { History, AlertTriangle, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const typeLabels: Record<string, string> = {
  voice_distress: 'Voice Distress',
  emotion_fear: 'Emotion Fear',
  gesture_sos: 'Gesture SOS',
  keyboard_sos: 'Keyboard SOS',
  panic_button: 'Panic Button',
  manual_sos: 'Manual SOS',
  ai_detected: 'AI Detected',
};

const severityColors: Record<string, string> = {
  critical: 'text-safeher-danger bg-safeher-danger/20 border-safeher-danger/30',
  high: 'text-orange-400 bg-orange-400/20 border-orange-400/30',
  medium: 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30',
  low: 'text-safeher-success bg-safeher-success/20 border-safeher-success/30',
};

export default function EmergencyHistory() {
  const [emergencies, setEmergencies] = useState<EmergencyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    // Offline guest token — skip backend call entirely
    if (!token || token === 'offline-guest-token') {
      setIsGuestMode(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await emergencyAPI.getHistory();
      setEmergencies(res.data.emergencies || []);
    } catch (e) {
      // Silently show empty state instead of error toast
      setEmergencies([]);
    } finally {
      setLoading(false);
    }
  };

  const resolveEmergency = async (id: string) => {
    try {
      await emergencyAPI.resolve({ emergencyId: id });
      loadHistory();
      toast.success('Emergency marked as resolved');
    } catch (e) {
      toast.error('Failed to resolve');
    }
  };

  return (
    <div className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-safeher-primary/20">
            <History className="w-5 h-5 text-safeher-primary" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Emergency History</h3>
            <p className="text-xs text-safeher-muted">{emergencies.length} total events</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="text-center py-8 text-safeher-muted">Loading...</div>
        ) : isGuestMode ? (
          <div className="text-center py-8 flex flex-col items-center gap-2">
            <Shield className="w-12 h-12 mb-1 opacity-20" />
            <p className="font-medium text-white/40">Guest Mode</p>
            <p className="text-xs text-safeher-muted max-w-[200px] leading-relaxed">
              Emergency history is stored per account. Log in to see your full event history.
            </p>
          </div>
        ) : emergencies.length === 0 ? (
          <div className="text-center py-8 text-safeher-muted flex flex-col items-center">
            <Shield className="w-12 h-12 mb-2 opacity-30" />
            <p>No emergency events recorded</p>
          </div>
        ) : (
          emergencies.map((emergency, i) => (
            <motion.div
              key={emergency._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-xl bg-white/5 border border-white/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${severityColors[emergency.severity]?.split(' ')[1] || 'bg-white/5'}`}>
                    <AlertTriangle className={`w-4 h-4 ${severityColors[emergency.severity]?.split(' ')[0] || 'text-safeher-muted'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{typeLabels[emergency.type] || emergency.type}</p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${severityColors[emergency.severity] || 'text-safeher-muted bg-white/5'}`}>
                        {emergency.severity}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${emergency.status === 'active' ? 'text-safeher-danger bg-safeher-danger/20 border-safeher-danger/30' : 'text-safeher-success bg-safeher-success/20 border-safeher-success/30'}`}>
                        {emergency.status}
                      </span>
                    </div>
                  </div>
                </div>
                {emergency.status === 'active' && (
                  <button
                    onClick={() => resolveEmergency(emergency._id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-safeher-success/20 text-safeher-success border border-safeher-success/30 hover:bg-safeher-success/30 transition-colors"
                  >
                    Resolve
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-1 mt-2 text-xs text-safeher-muted">
                <Clock className="w-3 h-3" />
                <span>{new Date(emergency.createdAt).toLocaleString()}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
