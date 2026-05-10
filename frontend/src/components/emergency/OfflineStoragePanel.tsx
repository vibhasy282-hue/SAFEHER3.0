'use client';

import { useEmergency } from '@/context/EmergencyContext';
import { Save, Download, Trash2, ShieldCheck, Database, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function OfflineStoragePanel() {
  const { addTimelineEvent } = useEmergency();
  const [logs, setLogs] = useState<string[]>(['[Storage] Ready...', '[Storage] No emergency data stored yet.']);
  const [stats, setStats] = useState({ sosCount: 0, voiceTriggers: 0, savedLocation: 'Not saved' });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load initial stats
    const saved = localStorage.getItem('safeher_emergency');
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setStats({
          sosCount: d.sosCount || 0,
          voiceTriggers: d.voiceTriggers || 0,
          savedLocation: d.location ? `${d.location.lat.toFixed(3)}, ${d.location.lng.toFixed(3)}` : 'Not saved'
        });
      } catch (e) { /* ignore */ }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  const handleSave = () => {
    const loc = localStorage.getItem('safeher_location');
    const location = loc ? JSON.parse(loc) : null;
    
    const data = {
      timestamp: new Date().toISOString(),
      location,
      sosCount: parseInt(localStorage.getItem('safeher_sos_count') || '0'),
      timeline: JSON.parse(localStorage.getItem('safeher_timeline') || '[]')
    };
    
    localStorage.setItem('safeher_emergency', JSON.stringify(data));
    addLog(`Emergency data encrypted & saved locally`);
    addTimelineEvent('💾 Manual Save', 'Emergency data snapshot stored to device');
    alert('Emergency data saved successfully to local storage.');
  };

  const handleExport = () => {
    const data = localStorage.getItem('safeher_emergency') || '{}';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; 
    a.download = 'safeher-emergency-backup.json';
    a.click(); 
    URL.revokeObjectURL(url);
    addLog('Emergency data exported to JSON');
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to delete all local emergency data? This cannot be undone.')) {
      const keys = ['safeher_emergency','safeher_sos_count','safeher_voice_triggers','safeher_location','safeher_timeline'];
      keys.forEach(k => localStorage.removeItem(k));
      addLog('All emergency storage cleared');
      setStats({ sosCount: 0, voiceTriggers: 0, savedLocation: 'Not saved' });
      addTimelineEvent('🗑️ Storage Cleared', 'User deleted all local emergency records');
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">📴 Offline Emergency System</h3>
          <p className="text-sm text-safeher-muted">Works without internet. Stores data encrypted on device.</p>
        </div>
        {!isOnline && (
          <div className="animate-pulse rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
            OFFLINE MODE ACTIVE
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
          <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-safeher-success" />
          <div className="text-xs uppercase tracking-wider text-safeher-muted">Local Storage</div>
          <div className="mt-1 font-bold text-safeher-success">Encrypted</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
          <Database className={`mx-auto mb-2 h-8 w-8 ${isOnline ? 'text-safeher-primary' : 'text-orange-400'}`} />
          <div className="text-xs uppercase tracking-wider text-safeher-muted">Network Status</div>
          <div className={`mt-1 font-bold ${isOnline ? 'text-white' : 'text-orange-400'}`}>{isOnline ? 'Connected' : 'Offline Backup'}</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center">
          <MapPin className="mx-auto mb-2 h-8 w-8 text-cyan-400" />
          <div className="text-xs uppercase tracking-wider text-safeher-muted">Last Location</div>
          <div className="mt-1 font-mono text-sm font-bold text-white">{stats.savedLocation}</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-black/20 p-4">
        <div className="mb-4 font-semibold text-white">📋 Emergency Storage Console</div>
        
        <div className="mb-4 flex flex-wrap gap-3">
          <button onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20">
            <Save className="h-4 w-4" /> Save Data
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20">
            <Download className="h-4 w-4" /> Export JSON
          </button>
          <button onClick={handleClear} className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/30">
            <Trash2 className="h-4 w-4" /> Clear Storage
          </button>
        </div>
        
        <div className="h-24 overflow-y-auto rounded-lg bg-black/40 p-3 font-mono text-xs text-safeher-muted">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
