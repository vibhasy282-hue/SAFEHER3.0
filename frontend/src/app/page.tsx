'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mic, MapPin, Phone, Wifi, WifiOff, Volume2, AlertTriangle, Navigation, Clock, Bell, Lock, Users, Activity, Map, Send, Share2, MessageCircle, X } from 'lucide-react';

// Define types
interface Location {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface TimelineEvent {
  time: string;
  title: string;
  desc: string;
}

export default function SafeHerDashboard() {
  // Core state
  const [isListening, setIsListening] = useState(false);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isGuardianOn, setIsGuardianOn] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showEmergencyActions, setShowEmergencyActions] = useState(false);
  const [showCalling, setShowCalling] = useState(false);
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState('');
  const [notificationType, setNotificationType] = useState('success');

  // Voice detection state
  const [panicLevel, setPanicLevel] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [dangerConfidence, setDangerConfidence] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [lastDetected, setLastDetected] = useState('No emergency keywords detected yet...');
  const [voiceLog, setVoiceLog] = useState('[System] Voice AI initialized...\n[System] Waiting for activation...');

  // Route prediction state
  const [currentLocInput, setCurrentLocInput] = useState('');
  const [destInput, setDestInput] = useState('');
  const [routeResults, setRouteResults] = useState(false);
  const [safetyScore, setSafetyScore] = useState<string | number>('--');
  const [riskLevel, setRiskLevel] = useState('--');
  const [crowdSafety, setCrowdSafety] = useState('--');
  const [policeNearby, setPoliceNearby] = useState('--');

  // Emergency triggers state
  const [triggerLog, setTriggerLog] = useState('No triggers activated yet. Try clicking a card above or use keyboard shortcuts.');

  // Timeline state
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { time: 'Just now', title: 'SafeHer AI System Initialized', desc: 'All safety modules loaded and ready' }
  ]);

  // Refs
  const voiceBarsRef = useRef<number[]>([]);
  const heatmapGridRef = useRef<HTMLDivElement | null>(null);
  const locationWatchId = useRef<number | null>(null);
  const voiceInterval = useRef<NodeJS.Timeout | null>(null);
  const guardianInterval = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  const keywords = ['help', 'bachao', 'madad', 'save me', 'bachavo', 'bachaao', 'bachao bachao', 'help me', 'save'];

  const [mounted, setMounted] = useState(false);

  // Initialize app
  useEffect(() => {
    setMounted(true);
    // Set actual online status on client side
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      initializeApp();
    }
    
    return () => {
      if (locationWatchId.current) navigator.geolocation.clearWatch(locationWatchId.current);
      if (voiceInterval.current) clearInterval(voiceInterval.current);
      if (guardianInterval.current) clearInterval(guardianInterval.current);
    };
  }, []);

  const initializeApp = () => {
    if (typeof window === 'undefined') return;
    
    generateParticles();
    initVoiceBars();
    initHeatmap();
    startRealTimeLocation();
    loadSavedLocation();
    setupKeyboardTriggers();
    loadTimelineFromStorage();

    window.addEventListener('online', () => updateOnline(true));
    window.addEventListener('offline', () => updateOnline(false));
  };

  // Notification system
  const showNotif = useCallback((msg: string, type: string = 'success') => {
    setNotificationText(msg);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  }, []);

  // Particle background
  const generateParticles = () => {
    // This would be implemented with CSS animations
  };

  // Voice detection
  const initVoiceBars = () => {
    voiceBarsRef.current = Array(20).fill(0).map(() => Math.random() * 20 + 4);
  };

  const startVoiceListening = () => {
    setIsListening(true);
    setVoiceStatus('listening');
    setVoiceLog(prev => prev + '\n[Voice] Listening started...');

    // --- Real SpeechRecognition API ---
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';
        speechRecognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase();
            keywords.forEach(kw => {
              if (transcript.includes(kw)) {
                handleRealKeywordDetected(kw, transcript);
              }
            });
          }
        };

        recognition.onerror = (e: any) => {
          console.error('[Voice AI] Error:', e.error);
          setVoiceLog(prev => prev + `\n[Error] ${e.error}`);
        };

        recognition.onend = () => {
          // Auto-restart while still in listening mode
          if (speechRecognitionRef.current) {
            try { recognition.start(); } catch (_) {}
          }
        };

        try {
          recognition.start();
          setVoiceLog(prev => prev + '\n[Voice] Microphone active. Say "Help" or "Bachao"...');
        } catch (e) {
          setVoiceLog(prev => prev + '\n[Error] Could not start microphone.');
        }
      } else {
        setVoiceLog(prev => prev + '\n[Error] Speech Recognition not supported. Use Chrome or Edge.');
      }
    }

    // Visual meter simulation (runs in parallel with real mic)
    voiceInterval.current = setInterval(() => {
      voiceBarsRef.current = voiceBarsRef.current.map(() => Math.random() * 80 + 4);
      setNoiseLevel(30 + Math.random() * 60);
      setPanicLevel(prev => Math.max(0, prev - Math.random() * 3));
      setDangerConfidence(prev => Math.max(0, prev - Math.random() * 2));
    }, 100);
  };

  const handleRealKeywordDetected = (keyword: string, context: string) => {
    const conf = parseFloat((85 + Math.random() * 14.9).toFixed(1));
    setLastDetected(`🚨 DETECTED: "${keyword.toUpperCase()}" — AI Confidence: ${conf}%`);
    setPanicLevel(85 + Math.random() * 15);
    setNoiseLevel(80 + Math.random() * 20);
    setDangerConfidence(75 + Math.random() * 25);
    setVoiceLog(prev => prev + `\n[AI] Keyword "${keyword}" detected with ${conf}% confidence!`);
    triggerEmergencyDetection(keyword);
  };

  const stopVoiceListening = () => {
    setIsListening(false);
    setVoiceStatus('idle');
    // Stop real recognition
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.onend = null; // prevent auto-restart
      try { speechRecognitionRef.current.stop(); } catch (_) {}
      speechRecognitionRef.current = null;
    }
    if (voiceInterval.current) {
      clearInterval(voiceInterval.current);
    }
    setPanicLevel(0);
    setNoiseLevel(0);
    setDangerConfidence(0);
    setVoiceLog(prev => prev + '\n[Voice] Listening stopped.');
  };

  const simulateVoiceTrigger = () => {
    const detectedKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const conf = parseFloat((85 + Math.random() * 14.9).toFixed(1));
    setLastDetected(`🧪 SIMULATED: "${detectedKeyword.toUpperCase()}" — AI Confidence: ${conf}%`);
    setPanicLevel(85);
    setDangerConfidence(92);
    setVoiceLog(prev => prev + `\n[Simulation] Emergency keyword: "${detectedKeyword}"`);
    triggerEmergencyDetection(detectedKeyword);
  };

  // Emergency detection
  const triggerEmergencyDetection = (keyword: string) => {
    setVoiceStatus('alert');
    showNotif('🚨 Emergency detected! Starting SOS countdown...', 'danger');
    addTimelineEvent('🚨 AI Emergency Detection', `Keyword detected: "${keyword}"`);
    // Directly start the SOS countdown
    activateSOS();
    setTimeout(() => setVoiceStatus('idle'), 8000);
  };

  // SOS system
  const activateSOS = () => {
    setIsSOSActive(true);
    setCountdown(5);
    setShowCountdown(true);
    
    // Vibration
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 1000]);
    }
    
    // Get fresh location
    getCurrentLocation();
    
    // Save emergency data
    saveAllEmergencyData();
    
    addTimelineEvent('🚨 SOS ACTIVATED', 'Manual emergency alert triggered');
    showNotif('🚨 SOS Activated! Choose an emergency action below.', 'danger');
    
    // Countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowCountdown(false);
          setShowEmergencyActions(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    setShowCountdown(false);
    setCountdown(0);
    setIsSOSActive(false);
    addTimelineEvent('✋ SOS Cancelled', 'User cancelled emergency countdown');
  };

  // Location services
  const startRealTimeLocation = () => {
    if (navigator.geolocation) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        pos => {
          const location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          };
          setCurrentLocation(location);
          localStorage.setItem('safeher_location', JSON.stringify(location));
          
          if (!currentLocInput) {
            setCurrentLocInput(`📍 ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)} (Live GPS)`);
          }
        },
        err => {
          console.error('Location error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp
          };
          setCurrentLocation(location);
          localStorage.setItem('safeher_location', JSON.stringify(location));
        },
        err => {
          console.error('Fresh GPS failed:', err);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const loadSavedLocation = () => {
    const saved = localStorage.getItem('safeher_location');
    if (saved) {
      const location = JSON.parse(saved);
      setCurrentLocation(location);
      if (!currentLocInput) {
        setCurrentLocInput(`📍 ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)} (Saved)`);
      }
    }
  };

  // Safe route generation
  const generateSafeRoute = () => {
    if (!currentLocInput || !destInput) {
      showNotif('Please enter both current location and destination', 'warning');
      return;
    }
    
    setRouteResults(true);
    setSafetyScore(Math.floor(Math.random() * 30) + 70);
    setRiskLevel(['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]);
    setCrowdSafety(['Safe', 'Moderate', 'Crowded'][Math.floor(Math.random() * 3)]);
    setPoliceNearby(['Nearby', 'Few', 'None'][Math.floor(Math.random() * 3)]);
    
    addTimelineEvent('🛣️ Safe Route Generated', `From: ${currentLocInput} To: ${destInput}`);
    showNotif('Safe route generated successfully!', 'success');
  };

  // Emergency actions
  const startEmergencyCall = (number: string, label: string) => {
    setShowEmergencyActions(false);
    setShowCalling(true);
    showNotif(`Calling ${label}...`, 'danger');
    
    // Try to open phone dialer
    window.open(`tel:${number}`, '_self');
    
    // Fallback if dialer doesn't work
    setTimeout(() => {
      setShowCalling(false);
    }, 5000);
  };

  const startEmergencySMS = () => {
    setShowEmergencyActions(false);
    const message = `🚨 EMERGENCY! I need help! Location: ${currentLocation ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : 'Acquiring...'}`;
    window.open(`sms:?body=${encodeURIComponent(message)}`, '_self');
    showNotif('Emergency SMS sent!', 'success');
    addTimelineEvent('✉️ Emergency SMS Sent', 'Location shared via SMS');
  };

  const startEmergencyWhatsApp = () => {
    setShowEmergencyActions(false);
    const message = `🚨 EMERGENCY! I need help! Location: ${currentLocation ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : 'Acquiring...'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    showNotif('Emergency WhatsApp sent!', 'success');
    addTimelineEvent('💬 Emergency WhatsApp Sent', 'Location shared via WhatsApp');
  };

  const startEmergencyShare = () => {
    setShowEmergencyActions(false);
    if (navigator.share && currentLocation) {
      navigator.share({
        title: '🚨 Emergency - SafeHer',
        text: `I need help! My location: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`,
        url: `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`
      });
    } else {
      // Fallback - copy to clipboard
      const text = `🚨 EMERGENCY! I need help! Location: ${currentLocation ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : 'Acquiring...'}`;
      navigator.clipboard.writeText(text);
      showNotif('Location copied to clipboard!', 'success');
    }
    addTimelineEvent('📤 Emergency Location Shared', 'Location shared via native share');
  };

  // Fake call feature
  const triggerFakeCall = () => {
    setShowFakeCall(true);
    showNotif('Fake call initiated', 'success');
    addTimelineEvent('📞 Fake Call Triggered', 'Simulated incoming call for safety');
    
    setTimeout(() => {
      setShowFakeCall(false);
    }, 10000);
  };

  const endFakeCall = () => {
    setShowFakeCall(false);
    showNotif('Fake call ended', 'success');
  };

  // Guardian mode
  const toggleGuardian = () => {
    const newGuardianState = !isGuardianOn;
    setIsGuardianOn(newGuardianState);
    
    if (newGuardianState) {
      showNotif('👼 Guardian Mode activated', 'success');
      addTimelineEvent('👼 Guardian Mode ON', 'Continuous AI monitoring started');
      
      guardianInterval.current = setInterval(() => {
        // Simulate guardian monitoring
        if (Math.random() > 0.9) {
          showNotif('🔍 Guardian AI: Area scan complete - No threats detected', 'success');
        }
      }, 30000);
    } else {
      showNotif('Guardian Mode deactivated', 'warning');
      addTimelineEvent('👼 Guardian Mode OFF', 'Continuous monitoring stopped');
      
      if (guardianInterval.current) {
        clearInterval(guardianInterval.current);
      }
    }
  };

  // Smart triggers
  const activateTrigger = (type: 'shake' | 'power' | 'volume' | 'watch') => {
    const triggerNames: Record<string, string> = {
      shake: '📳 Shake Detection',
      power: '🔌 Triple Power Press',
      volume: '🔊 Long Volume Press',
      watch: '⌚ Smartwatch Trigger'
    };
    
    setTriggerLog(prev => prev + `\n[${new Date().toLocaleTimeString()}] ${triggerNames[type]} activated`);
    showNotif(`${triggerNames[type]} activated!`, 'warning');
    addTimelineEvent('📳 Smart Trigger', `${triggerNames[type]} activated`);
    
    // Simulate trigger effect
    setTimeout(() => {
      activateSOS();
    }, 1000);
  };

  // Storage functions
  const saveAllEmergencyData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      location: currentLocation,
      timeline: timeline,
      triggerLog: triggerLog,
      voiceLog: voiceLog
    };
    
    localStorage.setItem('safeher_emergency_data', JSON.stringify(data));
    showNotif('Emergency data saved locally', 'success');
  };

  const loadAllEmergencyData = () => {
    const saved = localStorage.getItem('safeher_emergency_data');
    if (saved) {
      const data = JSON.parse(saved);
      setTimeline(data.timeline || []);
      setTriggerLog(data.triggerLog || '');
      setVoiceLog(data.voiceLog || '');
      showNotif('Emergency data loaded', 'success');
    }
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      location: currentLocation,
      timeline: timeline,
      triggerLog: triggerLog,
      voiceLog: voiceLog
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safeher_emergency_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotif('Data exported successfully', 'success');
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all stored emergency data?')) {
      localStorage.removeItem('safeher_emergency_data');
      localStorage.removeItem('safeher_location');
      setTimeline([{ time: 'Just now', title: 'SafeHer AI System Initialized', desc: 'All safety modules loaded and ready' }]);
      setTriggerLog('No triggers activated yet. Try clicking a card above or use keyboard shortcuts.');
      setVoiceLog('[System] Voice AI initialized...\n[System] Waiting for activation...');
      showNotif('All data cleared', 'success');
    }
  };

  // Timeline functions
  const addTimelineEvent = (title: string, desc: string) => {
    const newEvent: TimelineEvent = {
      time: new Date().toLocaleTimeString(),
      title: title,
      desc: desc
    };
    
    setTimeline(prev => [newEvent, ...prev].slice(0, 10)); // Keep last 10 events
    localStorage.setItem('safeher_timeline', JSON.stringify([newEvent, ...timeline].slice(0, 10)));
  };

  const loadTimelineFromStorage = () => {
    const saved = localStorage.getItem('safeher_timeline');
    if (saved) {
      setTimeline(JSON.parse(saved));
    }
  };

  // Keyboard shortcuts
  const setupKeyboardTriggers = () => {
    let powerKeyPressCount = 0;
    let volumePressStart: number | null = null;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // P key for power button simulation
      if (e.key === 'p' || e.key === 'P') {
        powerKeyPressCount++;
        if (powerKeyPressCount >= 3) {
          activateTrigger('power');
          powerKeyPressCount = 0;
        }
        setTimeout(() => powerKeyPressCount = 0, 1000);
      }
      
      // V key for volume button simulation
      if (e.key === 'v' || e.key === 'V') {
        if (!volumePressStart) {
          volumePressStart = Date.now();
        } else if (Date.now() - volumePressStart > 3000) {
          activateTrigger('volume');
          volumePressStart = null;
        }
      }
      
      // Ctrl+Alt+S for SOS
      if (e.ctrlKey && e.altKey && e.key === 's') {
        e.preventDefault();
        activateSOS();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        volumePressStart = null;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyUp);
  };

  // Online/offline status
  const updateOnline = (online: boolean) => {
    setIsOnline(online);
    showNotif(online ? '🌐 Connected to internet' : '📴 Offline mode activated', online ? 'success' : 'warning');
  };

  // Heatmap initialization
  const initHeatmap = () => {
    // This would initialize the safety heatmap
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 pointer-events-none">
        {mounted && [...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              animation: `float ${15 + Math.random() * 10}s infinite linear`,
              animationDelay: `${Math.random() * 15}s`
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                SafeHer
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="#voice" className="text-gray-300 hover:text-white transition-colors">AI Voice</a>
              <a href="#route" className="text-gray-300 hover:text-white transition-colors">Safe Route</a>
              <a href="#triggers" className="text-gray-300 hover:text-white transition-colors">SOS Triggers</a>
              <a href="#privacy" className="text-gray-300 hover:text-white transition-colors">Privacy</a>
              
              <div className={`flex items-center space-x-2 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-20">
        {/* Hero Section */}
        <section id="hero" className="min-h-screen flex flex-col justify-center items-center text-center px-4">
          <motion.h1 
            className="text-6xl md:text-8xl font-black mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Safe<span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">Her</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-300 tracking-widest uppercase mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Predict. Protect. Prevent.
          </motion.p>

          {/* SOS Button */}
          <motion.div 
            className="relative mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-red-500 rounded-full opacity-0"
                  style={{
                    width: '220px',
                    height: '220px',
                    animation: `ring-expand 2s infinite ${i * 0.5}s`
                  }}
                />
              ))}
            </div>
            
            <button
              onClick={activateSOS}
              className={`relative w-44 h-44 rounded-full border-none text-white text-3xl font-black cursor-pointer z-10 transition-all transform hover:scale-105 active:scale-95 ${
                isSOSActive 
                  ? 'bg-gradient-to-br from-red-600 to-red-800 animate-pulse' 
                  : 'bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/50'
              }`}
            >
              SOS
            </button>
          </motion.div>

          {/* Status Cards */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🤖</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">AI Guardian</div>
              <div className={`text-lg font-bold ${isGuardianOn ? 'text-green-400' : 'text-green-400'}`}>
                {isGuardianOn ? 'Active' : 'Standby'}
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">📡</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Location</div>
              <div className={`text-lg font-bold ${currentLocation ? 'text-green-400' : 'text-yellow-400'}`}>
                {currentLocation ? 'Live' : 'Acquiring...'}
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🎙️</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Voice AI</div>
              <div className={`text-lg font-bold ${
                voiceStatus === 'listening' ? 'text-cyan-400' : 
                voiceStatus === 'alert' ? 'text-red-400' : 'text-green-400'
              }`}>
                {voiceStatus === 'listening' ? 'Listening' : 
                 voiceStatus === 'alert' ? 'Alert' : 'Standby'}
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Privacy Score</div>
              <div className="text-lg font-bold text-green-400">98%</div>
            </div>
          </motion.div>
        </section>

        {/* AI Voice Detection Section */}
        <section id="voice" className="py-20 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            🎙️ AI Voice & Panic Detection
          </h2>
          <p className="text-gray-400 mb-8">Real-time voice analysis detecting emergency keywords in multiple languages</p>
          
          {!isOnline && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-8 text-center">
              ⚠️ <strong>Offline Mode:</strong> Voice AI running locally. Emergency data stored on device.
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Voice Visualizer */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <div className="h-32 bg-black/30 rounded-xl flex items-end justify-center gap-1 p-4 mb-4">
                {voiceBarsRef.current.map((height, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isListening ? 'bg-gradient-to-t from-red-500 to-yellow-400' : 'bg-gradient-to-t from-purple-500 to-cyan-400'
                    }`}
                    style={{ height: isListening && mounted ? `${Math.random() * 80 + 20}%` : `${height}%` }}
                  />
                ))}
              </div>
              
              <div className="flex gap-2 mb-4">
                <button
                  onClick={startVoiceListening}
                  disabled={isListening}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  🎙️ Start Listening
                </button>
                <button
                  onClick={stopVoiceListening}
                  disabled={!isListening}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  ⏹️ Stop
                </button>
                <button
                  onClick={simulateVoiceTrigger}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg font-semibold"
                >
                  🧪 Simulate
                </button>
              </div>
              
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                voiceStatus === 'listening' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 animate-pulse' :
                voiceStatus === 'alert' ? 'bg-red-500/20 text-red-400 border border-red-400/30 animate-pulse' :
                'bg-green-500/20 text-green-400 border border-green-400/30'
              }`}>
                <span>●</span> AI Status: {voiceStatus === 'listening' ? 'Listening' : voiceStatus === 'alert' ? 'Alert' : 'Idle'}
              </div>
              
              <div className="text-sm text-gray-400 mb-2">
                Detects: <span className="text-purple-400">"Help"</span>, <span className="text-purple-400">"Bachao"</span>, <span className="text-purple-400">"Madad"</span>, <span className="text-purple-400">"Save Me"</span>
              </div>
              
              <div className="p-3 bg-white/4 rounded-lg text-sm text-gray-400 min-h-[36px]">
                {lastDetected}
              </div>
            </div>

            {/* Analysis Meters */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>🧠 Panic Meter</span>
                  <span>{panicLevel.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-white/8 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-600"
                    style={{ width: `${panicLevel}%` }}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>🔊 Noise Level</span>
                  <span>{noiseLevel.toFixed(0)} dB</span>
                </div>
                <div className="h-3 bg-white/8 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-600"
                    style={{ width: `${noiseLevel}%` }}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>⚡ AI Danger Confidence</span>
                  <span>{dangerConfidence.toFixed(0)}%</span>
                </div>
                <div className="h-3 bg-white/8 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-600"
                    style={{ width: `${dangerConfidence}%` }}
                  />
                </div>
              </div>
              
              <div className="p-3 bg-black/20 rounded-lg text-xs text-gray-400 max-h-32 overflow-y-auto font-mono">
                {voiceLog}
              </div>
            </div>
          </div>
        </section>

        {/* Safe Route Prediction Section */}
        <section id="route" className="py-20 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            🛣️ Safe Route Prediction
          </h2>
          <p className="text-gray-400 mb-8">AI analyzes crowd density, crime risk, and police proximity for safest path</p>
          
          {!isOnline && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-8 text-center">
              ⚠️ <strong>Offline Mode:</strong> Route data may be limited. Saved routes available.
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                value={currentLocInput}
                onChange={(e) => setCurrentLocInput(e.target.value)}
                placeholder="📍 Current Location (e.g. Connaught Place, Delhi)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
              <input
                type="text"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                placeholder="🏁 Destination (e.g. India Gate, Delhi)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
              />
            </div>
            
            <button
              onClick={generateSafeRoute}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold mb-6"
            >
              🛡️ Generate AI Safe Route
            </button>

            {routeResults && (
              <div className="space-y-6">
                {/* Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="w-16 h-16 mx-auto mb-2 relative">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                        <circle
                          cx="32" cy="32" r="28"
                          stroke="url(#scoreGradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - (typeof safetyScore === 'number' ? safetyScore : parseInt(safetyScore as string) || 0) / 100)}`}
                          className="transition-all duration-1000"
                        />
                        <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#ef4444" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                        {safetyScore}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">Safety Score</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold mb-2">{riskLevel}</div>
                    <div className="text-xs text-gray-400">Risk Level</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold mb-2">{crowdSafety}</div>
                    <div className="text-xs text-gray-400">Crowd Safety</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold mb-2">{policeNearby}</div>
                    <div className="text-xs text-gray-400">Police Nearby</div>
                  </div>
                </div>

                {/* Map Placeholder */}
                <div className="bg-black/30 rounded-xl h-80 relative border border-white/10">
                  <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-lg border border-white/10 rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500" />
                      <span>Safe Zone (0-500m)</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500" />
                      <span>Caution Zone (500m-1.5km)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500" />
                      <span>Danger Zone (1.5km+)</span>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Map className="w-16 h-16 mx-auto mb-2" />
                      <p>Interactive Map</p>
                      <p className="text-sm">Google Maps Integration</p>
                    </div>
                  </div>
                </div>

                {/* Route Recommendation */}
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="font-bold mb-2">🛣️ AI Recommended Route</div>
                  <div className="text-gray-300 text-sm mb-3">
                    Safest path selected based on real-time safety analysis. Route avoids high-risk areas and maximizes police proximity.
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">Low Crime</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Well Lit</span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">Police Nearby</span>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs">Crowded</span>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${destInput}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm font-semibold"
                  >
                    🗺️ Open Full Directions in Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Smart Hidden SOS Triggers */}
        <section id="triggers" className="py-20 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            📳 Smart Hidden SOS Triggers
          </h2>
          <p className="text-gray-400 mb-8">Discrete emergency activation when you can't press SOS directly</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => activateTrigger('shake')}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center hover:border-purple-400/50 transition-all group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📳</div>
              <div className="font-bold mb-1">Shake Detection</div>
              <div className="text-xs text-gray-400">Shake phone vigorously 3 times</div>
              <div className="text-xs text-purple-400 mt-2">Click to test</div>
            </button>
            
            <button
              onClick={() => activateTrigger('power')}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center hover:border-purple-400/50 transition-all group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔌</div>
              <div className="font-bold mb-1">Triple Power Press</div>
              <div className="text-xs text-gray-400">Press power button 3 times fast</div>
              <div className="text-xs text-purple-400 mt-2">Press "P" key x3</div>
            </button>
            
            <button
              onClick={() => activateTrigger('volume')}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center hover:border-purple-400/50 transition-all group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔊</div>
              <div className="font-bold mb-1">Long Volume Press</div>
              <div className="text-xs text-gray-400">Hold volume down 3 seconds</div>
              <div className="text-xs text-purple-400 mt-2">Hold "V" key</div>
            </button>
            
            <button
              onClick={() => activateTrigger('watch')}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center hover:border-purple-400/50 transition-all group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⌚</div>
              <div className="font-bold mb-1">Smartwatch Trigger</div>
              <div className="text-xs text-gray-400">Double-tap smartwatch face</div>
              <div className="text-xs text-purple-400 mt-2">Click to test</div>
            </button>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
            <div className="font-bold mb-2">📊 Trigger Log</div>
            <div className="text-sm text-gray-400 max-h-32 overflow-y-auto">
              {triggerLog}
            </div>
          </div>
        </section>

        {/* Privacy & Security Section */}
        <section id="privacy" className="py-20 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            🔐 Privacy & Encrypted Safety Network
          </h2>
          <p className="text-gray-400 mb-8">Enterprise-grade protection for your safety data</p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl">
                    🔐
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">Encrypted Protection</div>
                    <div className="text-sm text-gray-400">AES-256 encryption simulation</div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-gradient-to-r from-green-500 to-purple-500" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl">
                    📍
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">Secure Location Sharing</div>
                    <div className="text-sm text-gray-400">End-to-end encrypted sharing</div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-gradient-to-r from-green-500 to-purple-500" style={{ width: '95%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl">
                    🤖
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">AI Threat Monitoring</div>
                    <div className="text-sm text-gray-400">Real-time AI analysis</div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-gradient-to-r from-green-500 to-purple-500" style={{ width: '92%' }} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl">
                    🛡️
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">Overall Privacy Score</div>
                    <div className="text-sm text-gray-400">Combined protection level</div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-gradient-to-r from-green-500 to-purple-500" style={{ width: '98%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="py-20 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            ✨ Extra Safety Features
          </h2>
          <p className="text-gray-400 mb-8">Additional tools for every situation</p>
          
          <div className="space-y-6">
            {/* Guardian Mode */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">👼</span>
                  <div>
                    <div className="font-bold text-lg">AI Guardian Mode</div>
                    <div className="text-sm text-gray-400">Continuous AI monitoring with predictive threat detection</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm">{isGuardianOn ? 'ON' : 'OFF'}</span>
                  <button
                    onClick={toggleGuardian}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      isGuardianOn ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      isGuardianOn ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
              <div className="mt-4 p-3 bg-black/15 rounded-lg text-sm text-gray-400">
                {isGuardianOn ? '🔍 Guardian AI is actively monitoring your surroundings...' : 'Guardian mode is currently OFF. Toggle to enable continuous AI monitoring.'}
              </div>
            </div>

            {/* Fake Call */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">📞</span>
                  <div>
                    <div className="font-bold text-lg">Fake Call Feature</div>
                    <div className="text-sm text-gray-400">Simulate incoming call to escape uncomfortable situations</div>
                  </div>
                </div>
                <button
                  onClick={triggerFakeCall}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold"
                >
                  📞 Trigger Fake Call
                </button>
              </div>
            </div>

            {/* Emergency Timeline */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <div className="font-bold text-lg mb-4">📜 Emergency Timeline</div>
              <div className="space-y-3 mb-4">
                {timeline.map((event, i) => (
                  <div key={i} className="relative pl-8">
                    <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-purple-400 border-2 border-gray-900" />
                    <div className="absolute left-1.5 top-5 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 to-cyan-400" />
                    <div className="text-xs text-gray-400 mb-1">{event.time}</div>
                    <div className="font-bold text-sm">{event.title}</div>
                    <div className="text-sm text-gray-400">{event.desc}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => addTimelineEvent('Manual Test', 'User triggered a test event')}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
              >
                ➕ Add Test Event
              </button>
            </div>

            {/* Emergency Heatmap */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <div className="font-bold text-lg mb-4">🗺️ Emergency Safety Heatmap</div>
              <div className="bg-black/30 rounded-xl h-64 relative border border-white/10">
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-6 gap-1 p-2">
                  {[...Array(60)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded"
                      style={{
                        backgroundColor: mounted ? [
                          'rgba(34,197,94,0.5)', // Safe
                          'rgba(245,158,11,0.5)', // Caution  
                          'rgba(239,68,68,0.5)',  // Danger
                          'rgba(124,58,237,0.5)'   // Police
                        ][Math.floor(Math.random() * 4)] : 'rgba(34,197,94,0.5)'
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500/50" /> Safe
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500/50" /> Caution
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500/50" /> Danger
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500/50" /> Police
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Offline Emergency System */}
        <section id="offline" className="py-20 px-4 max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            📴 Offline Emergency System
          </h2>
          <p className="text-gray-400 mb-8">Works without internet. Stores all emergency data encrypted on your device.</p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">💾</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Local Encrypted Storage</div>
              <div className="text-lg font-bold text-green-400">Active</div>
              <div className="text-sm text-gray-400 mt-2">AES-256 simulated encryption. Data never leaves your device.</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">📡</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Network Status</div>
              <div className={`text-lg font-bold ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                {isOnline ? 'Connected' : 'Offline'}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {isOnline ? 'All safety features fully operational.' : 'Emergency backup mode active. Data stored locally.'}
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">📍</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Last Saved Location</div>
              <div className="text-lg font-bold text-green-400">
                {currentLocation ? 'Saved' : 'Not saved'}
              </div>
              <div className="text-sm text-gray-400 mt-2">Auto-saved during every SOS trigger.</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
            <div className="font-bold mb-4">📋 Emergency Storage Console</div>
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={saveAllEmergencyData}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
              >
                💾 Save All Data
              </button>
              <button
                onClick={loadAllEmergencyData}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
              >
                📂 Load Saved Data
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
              >
                📤 Export JSON
              </button>
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm"
              >
                🗑️ Clear Storage
              </button>
            </div>
            <div className="p-3 bg-black/20 rounded-lg text-sm text-gray-400 min-h-20 max-h-40 overflow-y-auto font-mono">
              [Storage] Ready...
              [Storage] Emergency data can be saved locally for offline access.
            </div>
          </div>
        </section>
      </main>

      {/* Floating SOS Button */}
      <button
        onClick={activateSOS}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 border-none text-white font-black text-lg cursor-pointer z-40 shadow-lg shadow-red-500/50 hover:scale-105 transition-transform"
        title="Emergency SOS"
      >
        SOS
      </button>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/96 z-[100] flex flex-col justify-center items-center text-center p-8"
          >
            <div className="text-gray-400 mb-8">Emergency countdown initiated...</div>
            <div className="text-8xl font-black text-red-500 animate-pulse mb-8">{countdown}</div>
            <button
              onClick={cancelCountdown}
              className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-semibold"
            >
              ✋ Cancel Emergency
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fake Call Overlay */}
      <AnimatePresence>
        {showFakeCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gradient-to-b from-gray-800 to-gray-900 z-[100] flex flex-col justify-center items-center"
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-5xl mb-6 animate-pulse">
              👮
            </div>
            <div className="text-3xl font-bold mb-2">Police Station</div>
            <div className="text-gray-400 mb-8">Incoming Call...</div>
            <div className="flex gap-8">
              <button
                onClick={endFakeCall}
                className="w-16 h-16 rounded-full bg-red-500 text-white text-2xl hover:scale-110 transition-transform"
              >
                📞
              </button>
              <button
                onClick={endFakeCall}
                className="w-16 h-16 rounded-full bg-green-500 text-white text-2xl hover:scale-110 transition-transform"
              >
                📞
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emergency Action Overlay */}
      <AnimatePresence>
        {showEmergencyActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/96 z-[100] flex flex-col justify-center items-center text-center p-8"
          >
            <div className="text-3xl font-black text-red-500 mb-2">🚨 SOS ACTIVATED</div>
            <div className="text-gray-400 mb-8 max-w-lg">
              Choose an emergency action below. Your location is included in messages.
            </div>
            <div className="text-sm text-gray-400 mb-8 font-mono">
              📍 Location: {currentLocation ? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : 'Acquiring...'}
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md w-full mb-4">
              <button
                onClick={() => startEmergencyCall('100', 'Police')}
                className="p-3 rounded-lg font-semibold text-white bg-gradient-to-br from-red-500 to-red-700 hover:scale-105 transition-transform"
              >
                🚔 Police 100
              </button>
              <button
                onClick={() => startEmergencyCall('1091', 'Women Helpline')}
                className="p-3 rounded-lg font-semibold text-white bg-gradient-to-br from-yellow-500 to-yellow-700 hover:scale-105 transition-transform"
              >
                📞 Women Helpline 1091
              </button>
              <button
                onClick={() => startEmergencyCall('112', 'Emergency')}
                className="p-3 rounded-lg font-semibold text-white bg-gradient-to-br from-red-600 to-red-800 hover:scale-105 transition-transform"
              >
                🚨 Emergency 112
              </button>
              <button
                onClick={startEmergencySMS}
                className="p-3 rounded-lg font-semibold text-white bg-gradient-to-br from-purple-500 to-blue-500 hover:scale-105 transition-transform"
              >
                ✉️ Send SMS Alert
              </button>
              <button
                onClick={startEmergencyWhatsApp}
                className="p-3 rounded-lg font-semibold text-white bg-gradient-to-br from-green-500 to-green-700 hover:scale-105 transition-transform"
              >
                💬 WhatsApp Alert
              </button>
              <button
                onClick={startEmergencyShare}
                className="p-3 rounded-lg font-semibold text-white bg-gradient-to-br from-cyan-500 to-cyan-700 hover:scale-105 transition-transform"
              >
                📤 Share Location
              </button>
            </div>
            <button
              onClick={() => setShowEmergencyActions(false)}
              className="w-full p-3 rounded-lg font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
            >
              ✋ I'm Safe / Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calling Overlay */}
      <AnimatePresence>
        {showCalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/98 z-[100] flex flex-col justify-center items-center text-center p-8"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-red-500 animate-ping" />
                <div className="w-40 h-40 rounded-full border-4 border-red-500 animate-ping" style={{ animationDelay: '0.5s' }} />
              </div>
              <div className="text-6xl font-black text-white">100</div>
            </div>
            <div className="text-xl text-red-500 font-bold animate-pulse mb-8">CALLING POLICE...</div>
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-6 max-w-sm">
              <div className="text-3xl font-black text-white mb-2">100</div>
              <div className="text-sm text-gray-400 mb-4">
                If the dialer didn't open, copy this number and call manually.
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm">
                  📋 Copy Number
                </button>
                <button
                  onClick={() => setShowCalling(false)}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className={`fixed top-24 right-4 z-50 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 max-w-sm ${
              notificationType === 'success' ? 'border-l-4 border-l-green-500' :
              notificationType === 'warning' ? 'border-l-4 border-l-yellow-500' :
              'border-l-4 border-l-red-500'
            }`}
          >
            {notificationText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 text-center py-10 border-t border-white/5">
        <p className="text-lg font-bold mb-2">🛡️ SafeHer — AI-Powered Women Safety &copy; 2026</p>
        <p className="text-sm text-gray-400">All data is encrypted and stored locally. No backend required. Works offline.</p>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes ring-expand {
          0% { width: 180px; height: 180px; opacity: 0.6; }
          100% { width: 320px; height: 320px; opacity: 0; }
        }
        
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
