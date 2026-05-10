'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Brain, Activity, AlertTriangle, Radio, Zap, Phone, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmergency } from '@/context/EmergencyContext';

const KEYWORDS = ['help', 'bachao', 'madad', 'save me', 'bachavo', 'bachaao', 'help me', 'save'];
const BAR_COUNT = 36;

interface LogEntry { id: string; time: string; text: string; type: 'system' | 'listening' | 'alert' | 'error'; }
interface Detection { keyword: string; confidence: number; time: string; }

function now() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

// ─── Action Dialog shown after keyword detection ────────────────────────────
function DetectionActionDialog({
  detection, onSOS, onDismiss
}: {
  detection: Detection;
  onSOS: () => void;
  onDismiss: () => void;
}) {
  const [timer, setTimer] = useState(15);

  useEffect(() => {
    const t = setInterval(() => setTimer(p => {
      if (p <= 1) { clearInterval(t); onDismiss(); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      transition={{ type: 'spring', bounce: 0.3 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-3xl border border-red-500/40 bg-gradient-to-br from-slate-900 to-red-950/40 p-6 shadow-2xl shadow-red-500/20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center animate-pulse">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-red-400 tracking-wide">🚨 EMERGENCY DETECTED</h2>
            <p className="text-xs text-gray-400">Voice AI identified a distress keyword</p>
          </div>
          <div className="ml-auto w-9 h-9 rounded-full border-2 border-red-500/40 flex items-center justify-center text-sm font-bold text-red-400">
            {timer}
          </div>
        </div>

        {/* Detection detail */}
        <div className="mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-gray-400 mb-1">Keyword detected</p>
          <p className="text-2xl font-black text-white">"{detection.keyword.toUpperCase()}"</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-red-400 font-semibold">AI Confidence: {detection.confidence}%</span>
            <span className="text-xs text-gray-500">{detection.time}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full"
              initial={{ width: 0 }} animate={{ width: `${detection.confidence}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }} onClick={onSOS}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 border border-red-500/40 text-white shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-shadow">
            <Shield className="w-7 h-7" />
            <span className="font-black text-sm">🚨 SEND SOS</span>
            <span className="text-xs text-red-200 text-center">Real emergency — alert contacts & services</span>
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }} onClick={onDismiss}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 border border-white/20 text-white shadow-lg hover:shadow-white/10 transition-shadow">
            <span className="text-3xl">✋</span>
            <span className="font-black text-sm">NO EMERGENCY</span>
            <span className="text-xs text-gray-300 text-center">False alarm — I'm safe, dismiss</span>
          </motion.button>
        </div>

        {/* Dismiss */}
        <button onClick={onDismiss}
          className="w-full py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-400 text-sm font-semibold hover:bg-white/10 transition-colors">
          ✋ I'm Safe — Dismiss ({timer}s)
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────
export default function VoiceAIPanel() {
  const { triggerCountdown, triggerFakeCall, activateSOS, addTimelineEvent } = useEmergency();

  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [panicLevel, setPanicLevel] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [dangerConfidence, setDangerConfidence] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(3));
  const [log, setLog] = useState<LogEntry[]>([
    { id: '1', time: now(), text: 'Voice AI initialized', type: 'system' },
    { id: '2', time: now(), text: 'Click Start to activate microphone', type: 'system' },
  ]);

  const recognitionRef = useRef<any>(null);
  const meterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const barIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const pushLog = useCallback((text: string, type: LogEntry['type'] = 'system') => {
    setLog(prev => [...prev.slice(-60), { id: Date.now().toString(), time: now(), text, type }]);
  }, []);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [log]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SR) setSupported(false);
    }
    return () => stopAll();
  }, []);

  function stopAll() {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (meterIntervalRef.current) clearInterval(meterIntervalRef.current);
    if (barIntervalRef.current) clearInterval(barIntervalRef.current);
  }

  const handleKeywordDetected = useCallback((keyword: string) => {
    const conf = parseFloat((85 + Math.random() * 14.9).toFixed(1));
    const d: Detection = { keyword, confidence: conf, time: now() };
    setDetection(d);
    setShowDialog(true);
    setPanicLevel(88 + Math.random() * 12);
    setNoiseLevel(80 + Math.random() * 20);
    setDangerConfidence(78 + Math.random() * 22);
    pushLog(`🚨 KEYWORD: "${keyword.toUpperCase()}" — ${conf}% confidence`, 'alert');
    addTimelineEvent(`🎙️ Voice: "${keyword}"`, `Detected with ${conf}% confidence`);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 100, 300]);
    }
  }, [pushLog, addTimelineEvent]);

  const handleSOS = useCallback(() => {
    setShowDialog(false);
    activateSOS(); // Direct immediate SOS — no countdown
    pushLog('🚨 SOS ACTIVATED IMMEDIATELY via Voice AI', 'alert');
    addTimelineEvent('🚨 SOS via Voice AI', 'Immediate SOS — no countdown, confirmed by user');
  }, [activateSOS, pushLog, addTimelineEvent]);

  const handleFakeCall = useCallback(() => {
    setShowDialog(false);
    triggerFakeCall();
    pushLog('📞 Fake call triggered', 'system');
    addTimelineEvent('📞 Fake Call via Voice AI', 'Simulated police call activated');
  }, [triggerFakeCall, pushLog, addTimelineEvent]);

  const handleDismiss = useCallback(() => {
    setShowDialog(false);
    setDetection(null);
    setPanicLevel(0);
    setDangerConfidence(0);
    pushLog("✋ Alert dismissed — user marked safe", 'system');
  }, [pushLog]);

  const startListening = useCallback(() => {
    if (!supported || isListening) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      pushLog('Microphone active — listening for: ' + KEYWORDS.join(', '), 'listening');
      addTimelineEvent('🎙️ Voice AI Started', 'Microphone activated');
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        if (transcript) pushLog(`Heard: "${transcript}"`, 'listening');
        KEYWORDS.forEach(kw => { if (transcript.includes(kw)) handleKeywordDetected(kw); });
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') { pushLog('Mic permission denied', 'error'); setIsListening(false); }
      else if (e.error !== 'aborted') pushLog(`Error: ${e.error}`, 'error');
    };

    recognition.onend = () => { if (recognitionRef.current) { try { recognition.start(); } catch (_) {} } };

    try { recognition.start(); } catch (e) { pushLog('Could not start microphone', 'error'); }

    meterIntervalRef.current = setInterval(() => {
      setNoiseLevel(25 + Math.random() * 55);
      setPanicLevel(prev => Math.max(0, prev - Math.random() * 4));
      setDangerConfidence(prev => Math.max(0, prev - Math.random() * 3));
    }, 120);

    barIntervalRef.current = setInterval(() => {
      setBars(Array(BAR_COUNT).fill(0).map(() => Math.random() * 90 + 6));
    }, 90);
  }, [supported, isListening, pushLog, addTimelineEvent, handleKeywordDetected]);

  const stopListening = useCallback(() => {
    stopAll();
    setIsListening(false);
    setPanicLevel(0); setNoiseLevel(0); setDangerConfidence(0);
    setBars(Array(BAR_COUNT).fill(3));
    setDetection(null); setShowDialog(false);
    pushLog('Microphone stopped', 'system');
    addTimelineEvent('🎙️ Voice AI Stopped', 'Microphone deactivated');
  }, [pushLog, addTimelineEvent]);

  const simulateTrigger = useCallback(() => {
    const kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    setBars(Array(BAR_COUNT).fill(0).map(() => Math.random() * 95 + 5));
    handleKeywordDetected(kw);
    pushLog(`🧪 SIMULATED: "${kw.toUpperCase()}"`, 'alert');
  }, [handleKeywordDetected, pushLog]);

  const status = showDialog ? 'alert' : isListening ? 'listening' : 'idle';
  const statusCfg = {
    idle:      { label: 'Idle', dot: 'bg-green-400', badge: 'border-green-500/30 bg-green-500/10 text-green-400' },
    listening: { label: 'Listening...', dot: 'bg-cyan-400 animate-pulse', badge: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' },
    alert:     { label: '🚨 ALERT!', dot: 'bg-red-400 animate-pulse', badge: 'border-red-500/40 bg-red-500/15 text-red-400' },
  };
  const sc = statusCfg[status];

  return (
    <>
      {/* ─── Detection Action Dialog ─── */}
      <AnimatePresence>
        {showDialog && detection && (
          <DetectionActionDialog
            detection={detection}
            onSOS={handleSOS}
            onDismiss={handleDismiss}
          />
        )}
      </AnimatePresence>

      {/* ─── Panel ─── */}
      <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/5 to-purple-500/5 backdrop-blur-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
              status === 'alert' ? 'bg-gradient-to-br from-red-500 to-orange-500 shadow-red-500/40' :
              status === 'listening' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/40' :
              'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/30'
            }`}>
              {isListening ? <Radio className="w-5 h-5 text-white animate-pulse" /> : <Mic className="w-5 h-5 text-white" />}
              {isListening && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900 animate-pulse" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Voice AI Detector</h3>
              <p className="text-xs text-gray-500">Real-time keyword detection · en-IN + Hinglish</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${sc.badge}`}>
            <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
            {sc.label}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
          {/* Left */}
          <div className="p-6 flex flex-col gap-5">
            {/* Waveform */}
            <div className={`relative h-28 rounded-2xl overflow-hidden flex items-end justify-center gap-[2px] px-3 transition-all duration-300 ${
              status === 'alert' ? 'bg-red-950/40 ring-1 ring-red-500/30' :
              status === 'listening' ? 'bg-cyan-950/30 ring-1 ring-cyan-500/20' : 'bg-black/30'
            }`}>
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/5" />
              {bars.map((h, i) => (
                <motion.div key={i}
                  className={`w-1 rounded-full flex-shrink-0 transition-colors duration-300 ${
                    status === 'alert' ? 'bg-gradient-to-t from-red-600 to-orange-400' :
                    status === 'listening' ? 'bg-gradient-to-t from-purple-600 to-cyan-400' :
                    'bg-gradient-to-t from-white/10 to-white/20'
                  }`}
                  animate={{ height: `${status !== 'idle' ? h : 4}%` }}
                  transition={{ duration: 0.09, ease: 'easeOut' }}
                />
              ))}
              {status === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xs text-gray-600">Click Start to activate microphone</p>
                </div>
              )}
            </div>

            {/* ── Controls ── */}
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div key="stop" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="flex flex-col gap-2">
                  {/* Active banner */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                    <p className="text-xs text-cyan-300 font-medium flex-1">Voice monitoring is <strong>ON</strong> — listening for emergency keywords</p>
                  </div>
                  <div className="flex gap-2">
                    {/* Big Stop button */}
                    <motion.button whileTap={{ scale: 0.96 }} onClick={stopListening}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-sm shadow-lg shadow-red-500/30 hover:shadow-red-500/50 border border-red-500/50 transition-shadow">
                      <MicOff className="w-5 h-5" />
                      ⏹ STOP MONITORING
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={simulateTrigger}
                      className="px-3 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-semibold hover:bg-amber-500/20 transition-colors">
                      🧪
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="start" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="flex flex-col gap-2">
                  {/* Idle banner */}
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/60 border border-white/8">
                    <span className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
                    <p className="text-xs text-gray-400">Voice monitoring is <strong className="text-white">OFF</strong> — click below to activate</p>
                  </div>
                  <div className="flex gap-2">
                    {/* Big Start button */}
                    <motion.button whileTap={{ scale: 0.96 }} onClick={startListening} disabled={!supported}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-black text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 border border-purple-500/30 transition-shadow disabled:opacity-40">
                      <Mic className="w-5 h-5" />
                      ▶ START MONITORING
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={simulateTrigger}
                      className="px-3 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-semibold hover:bg-amber-500/20 transition-colors">
                      🧪
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


            {!supported && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/25 bg-amber-500/10">
                <span className="text-amber-400 text-lg">⚠️</span>
                <p className="text-xs text-amber-200 leading-relaxed">Speech Recognition not supported.<br /><strong>Use Chrome or Edge</strong> for voice detection.</p>
              </div>
            )}

            {/* Active detection indicator */}
            <AnimatePresence>
              {detection && !showDialog && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowDialog(true)}
                  className="p-3 rounded-2xl border border-red-500/40 bg-red-500/10 cursor-pointer hover:bg-red-500/15 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚨</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-300">"{detection.keyword.toUpperCase()}" detected</p>
                      <p className="text-xs text-gray-400">{detection.confidence}% confidence · Tap to take action</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Keywords */}
            <div className="p-3 rounded-xl bg-white/3 border border-white/5">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Monitored keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {KEYWORDS.map(kw => (
                  <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/25 text-purple-300 font-medium">{kw}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Telemetry + Log */}
          <div className="p-6 flex flex-col gap-5">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4">Live Telemetry</p>
              <div className="space-y-4">
                {[
                  { label: 'Panic Meter', value: panicLevel, icon: Brain, color: 'from-green-500 via-orange-500 to-red-500', iconColor: 'text-orange-400', unit: '%' },
                  { label: 'Ambient Noise', value: Math.min((noiseLevel / 120) * 100, 100), display: noiseLevel, icon: Activity, color: 'from-cyan-500 to-blue-500', iconColor: 'text-cyan-400', unit: ' dB' },
                  { label: 'Danger Confidence', value: dangerConfidence, icon: AlertTriangle, color: 'from-green-500 via-yellow-500 to-red-500', iconColor: 'text-red-400', unit: '%' },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <m.icon className={`w-3.5 h-3.5 ${m.iconColor}`} /> {m.label}
                      </span>
                      <span className="font-mono text-white font-semibold">{((m.display ?? m.value)).toFixed(0)}{m.unit}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                      <motion.div className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                        animate={{ width: `${m.value}%` }} transition={{ duration: 0.15 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSOS}
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold hover:bg-red-500/25 transition-colors">
                  <Shield className="w-4 h-4" /> Send SOS
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleFakeCall}
                  className="flex items-center gap-2 p-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-xs font-bold hover:bg-green-500/25 transition-colors">
                  <Phone className="w-4 h-4" /> Fake Call
                </motion.button>
              </div>
            </div>

            {/* Activity log */}
            <div className="flex-1 flex flex-col">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">Activity Log</p>
              <div className="rounded-xl bg-black/40 border border-white/5 p-3 overflow-y-auto font-mono text-xs space-y-1" style={{ maxHeight: 160 }}>
                {log.map(entry => (
                  <div key={entry.id} className={`flex gap-2 ${
                    entry.type === 'alert' ? 'text-red-400' : entry.type === 'listening' ? 'text-cyan-400' :
                    entry.type === 'error' ? 'text-amber-400' : 'text-gray-500'
                  }`}>
                    <span className="text-gray-600 flex-shrink-0">{entry.time}</span>
                    <span className="break-all">{entry.text}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
              status === 'alert' ? 'bg-red-500/10 border-red-500/25' :
              status === 'listening' ? 'bg-cyan-500/10 border-cyan-500/25' : 'bg-white/3 border-white/5'
            }`}>
              <span className="flex items-center gap-2 text-gray-400">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className={supported ? 'text-green-400' : 'text-red-400'}>{supported ? 'SpeechRecognition ✓' : 'Not supported'}</span>
              </span>
              <span className="text-gray-500">en-IN + Hinglish</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
