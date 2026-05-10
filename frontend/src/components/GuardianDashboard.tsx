'use client';

import { useState, useEffect } from 'react';
import { alertAPI, locationAPI } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { Shield, MapPin, Bell, User, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function GuardianDashboard() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [trackedUsers, setTrackedUsers] = useState<any[]>([]);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    loadGuardianAlerts();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('emergency_alert', (data: any) => {
      toast.error(`Emergency from ${data.userName}!`, { icon: '\u{1F6A8}' });
      loadGuardianAlerts();
    });

    socket.on('guardian_location_update', (data: any) => {
      setTrackedUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [{ ...data, timestamp: new Date() }, ...filtered];
      });
    });

    socket.on('ai_emergency_detected', (data: any) => {
      toast.error(`AI detected emergency!`, { icon: '\u26A0' });
    });

    return () => {
      socket.off('emergency_alert');
      socket.off('guardian_location_update');
      socket.off('ai_emergency_detected');
    };
  }, [socket]);

  const loadGuardianAlerts = async () => {
    try {
      const res = await alertAPI.getGuardianAlerts();
      setAlerts(res.data.alerts);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 border border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-safeher-primary/20">
              <Bell className="w-5 h-5 text-safeher-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{alerts.length}</p>
              <p className="text-xs text-safeher-muted">Total Alerts</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5 border border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-safeher-success/20">
              <MapPin className="w-5 h-5 text-safeher-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{trackedUsers.length}</p>
              <p className="text-xs text-safeher-muted">Tracking Now</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-5 border border-white/5">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-safeher-warning/20">
              <Shield className="w-5 h-5 text-safeher-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{socket ? 'Online' : 'Offline'}</p>
              <p className="text-xs text-safeher-muted">Connection Status</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-safeher-primary" />
            <span>Emergency Alerts</span>
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
            <AnimatePresence>
              {alerts.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 text-safeher-muted">
                  No alerts yet
                </motion.div>
              ) : (
                alerts.map((alert, i) => (
                  <motion.div
                    key={alert._id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <User className="w-8 h-8 text-safeher-primary" />
                        <div>
                          <p className="text-sm font-medium text-white">{alert.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-safeher-muted">{alert.type} - {alert.status}</p>
                        </div>
                      </div>
                      <span className="text-xs text-safeher-muted">
                        {new Date(alert.sentAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/5">
          <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-safeher-success" />
            <span>Live Tracking</span>
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
            {trackedUsers.length === 0 ? (
              <div className="text-center py-8 text-safeher-muted">No active tracking</div>
            ) : (
              trackedUsers.map((user, i) => (
                <motion.div
                  key={user.userId || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 rounded-xl bg-white/5 border border-white/5"
                >
                  <p className="text-sm font-medium text-white">{user.userName}</p>
                  <p className="text-xs text-safeher-muted">
                    {user.location?.latitude?.toFixed(4)}, {user.location?.longitude?.toFixed(4)}
                  </p>
                  <p className="text-xs text-safeher-muted">
                    {new Date(user.timestamp).toLocaleTimeString()}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
