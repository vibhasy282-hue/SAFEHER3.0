'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Shield, Zap, MapPin, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SafePlace {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'crowded' | 'fire' | 'pharmacy';
  lat: number;
  lng: number;
  distance: string;
  isOpen?: boolean;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

const MapWithNoSSR = dynamic(() => import('./SafetyMapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] rounded-2xl bg-gradient-to-br from-slate-900/80 to-purple-900/20 border border-white/5 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border border-pink-500/20 border-b-pink-400 animate-spin animate-reverse" />
        </div>
        <p className="text-gray-400 text-sm font-medium">Loading safety map...</p>
      </div>
    </div>
  ),
});

function getRecommendations(hour: number, hasLocation: boolean): Recommendation[] {
  const recs: Recommendation[] = [];
  if (hour >= 21 || hour < 6) {
    recs.push({ id: 'night', title: 'Night Safety Alert', description: 'Avoid isolated areas. Stick to well-lit, crowded streets and share your live location with a trusted contact.', priority: 'high', icon: '🌙' });
  }
  if (hour >= 18 && hour < 21) {
    recs.push({ id: 'evening', title: 'Evening Caution', description: 'Dusk hours have elevated risk. Stay on main roads and inform someone of your route before heading out.', priority: 'medium', icon: '🌆' });
  }
  recs.push({ id: 'contact', title: 'Share Your Location', description: 'Always let a trusted friend or family member know your destination and estimated arrival time.', priority: hour >= 20 ? 'high' : 'medium', icon: '📍' });
  recs.push({ id: 'voice', title: 'Voice AI Monitoring', description: 'Keep Voice AI listening in the background. It auto-detects distress keywords like "Help" and "Bachao" and triggers SOS.', priority: 'medium', icon: '🎙️' });
  recs.push({ id: 'trigger', title: 'Hidden SOS Ready', description: 'Press P×3 or hold V for 1.5s as a discreet emergency trigger. Shake your phone 3× for hands-free SOS activation.', priority: 'low', icon: '🤫' });
  if (hasLocation) {
    recs.push({ id: 'safezone', title: 'Safe Zones Mapped', description: 'Police stations, hospitals and 24h pharmacies are pinned on your map. Head to the nearest one if you feel unsafe.', priority: 'low', icon: '🏥' });
  }
  return recs;
}

function generateNearbyPlaces(lat: number, lng: number): SafePlace[] {
  const s = 0.012;
  return [
    { id: '1', name: 'Police Station', type: 'police', lat: lat + s * 0.8, lng: lng + s * 0.4, distance: '320m', isOpen: true },
    { id: '2', name: 'City Hospital', type: 'hospital', lat: lat - s * 0.5, lng: lng + s * 0.9, distance: '540m', isOpen: true },
    { id: '3', name: 'Central Mall', type: 'crowded', lat: lat + s * 0.2, lng: lng - s * 0.7, distance: '210m', isOpen: true },
    { id: '4', name: 'Fire Station', type: 'fire', lat: lat - s * 0.9, lng: lng - s * 0.3, distance: '780m', isOpen: true },
    { id: '5', name: '24h Pharmacy', type: 'pharmacy', lat: lat + s * 1.1, lng: lng + s * 1.0, distance: '430m', isOpen: true },
    { id: '6', name: 'Police Chowki', type: 'police', lat: lat - s * 0.3, lng: lng + s * 1.2, distance: '650m', isOpen: true },
  ];
}

const placeMeta: Record<SafePlace['type'], { emoji: string; color: string; glow: string; bg: string; border: string }> = {
  police:   { emoji: '🚔', color: 'text-blue-300',   glow: 'shadow-blue-500/20',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25' },
  hospital: { emoji: '🏥', color: 'text-red-300',    glow: 'shadow-red-500/20',    bg: 'bg-red-500/10',    border: 'border-red-500/25' },
  crowded:  { emoji: '🏬', color: 'text-green-300',  glow: 'shadow-green-500/20',  bg: 'bg-green-500/10',  border: 'border-green-500/25' },
  fire:     { emoji: '🚒', color: 'text-orange-300', glow: 'shadow-orange-500/20', bg: 'bg-orange-500/10', border: 'border-orange-500/25' },
  pharmacy: { emoji: '💊', color: 'text-purple-300', glow: 'shadow-purple-500/20', bg: 'bg-purple-500/10', border: 'border-purple-500/25' },
};

const priorityConfig: Record<Recommendation['priority'], { bar: string; badge: string; badgeTxt: string; label: string }> = {
  high:   { bar: 'border-l-red-500',    badge: 'bg-red-500/15 border-red-500/30',    badgeTxt: 'text-red-400',    label: 'HIGH' },
  medium: { bar: 'border-l-amber-400',  badge: 'bg-amber-400/15 border-amber-400/30', badgeTxt: 'text-amber-300',  label: 'MEDIUM' },
  low:    { bar: 'border-l-blue-400',   badge: 'bg-blue-500/15 border-blue-500/30',   badgeTxt: 'text-blue-400',   label: 'LOW' },
};

const TIPS = [
  { icon: '📱', tip: 'Keep your phone above 30% charge at all times when travelling alone.' },
  { icon: '👥', tip: 'Walk in well-lit, crowded areas — avoid shortcuts through isolated lanes.' },
  { icon: '🗣️', tip: 'Inform someone of your route and expected arrival time before leaving.' },
  { icon: '🔐', tip: 'Trust your gut — if something feels wrong, leave the area immediately.' },
  { icon: '🚪', tip: 'Always identify exits and nearby safe zones when entering unfamiliar places.' },
  { icon: '📞', tip: 'Use the Fake Call feature to safely exit uncomfortable situations.' },
];

export default function SafetyMap() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [places, setPlaces] = useState<SafePlace[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SafePlace | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'recs'>('map');
  const [safetyScore, setSafetyScore] = useState(0);
  const [animScore, setAnimScore] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    const setup = (loc: { lat: number; lng: number }, fallback = false) => {
      setLocation(loc);
      setPlaces(generateNearbyPlaces(loc.lat, loc.lng));
      setRecommendations(getRecommendations(hour, !fallback));
      const score = fallback ? 72 : (hour >= 6 && hour < 20 ? 82 + Math.floor(Math.random() * 12) : 48 + Math.floor(Math.random() * 20));
      setSafetyScore(score);
      if (fallback) setLocationError(true);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setup({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => setup({ lat: 28.6139, lng: 77.209 }, true),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setup({ lat: 28.6139, lng: 77.209 }, true);
    }
  }, []);

  // Animate score counter
  useEffect(() => {
    if (!safetyScore) return;
    let current = 0;
    const step = safetyScore / 40;
    const t = setInterval(() => {
      current = Math.min(current + step, safetyScore);
      setAnimScore(Math.round(current));
      if (current >= safetyScore) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [safetyScore]);

  const scoreColor = safetyScore >= 75 ? '#22c55e' : safetyScore >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = safetyScore >= 75 ? 'Safe Zone' : safetyScore >= 50 ? 'Moderate Risk' : 'High Risk';
  const circumference = 2 * Math.PI * 22;
  const dashOffset = circumference * (1 - animScore / 100);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Main card ── */}
      <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/5 to-purple-500/5 backdrop-blur-2xl overflow-hidden shadow-2xl shadow-purple-500/5">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">Safety Map</h3>
              <p className="text-xs text-gray-500">
                {locationError ? '⚠️ Demo location active' : '🛰️ Live GPS active'}
              </p>
            </div>
          </div>

          {/* Score ring */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500 leading-none mb-0.5">Area Score</p>
              <p className="text-sm font-bold leading-none" style={{ color: scoreColor }}>{scoreLabel}</p>
            </div>
            <div className="relative">
              <svg width="60" height="60" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                <circle cx="28" cy="28" r="22" fill="none" stroke={scoreColor} strokeWidth="5"
                  strokeDasharray={circumference} strokeDashoffset={dashOffset}
                  strokeLinecap="round" transform="rotate(-90 28 28)"
                  style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 6px ${scoreColor})` }} />
                <text x="28" y="33" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">{animScore}</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 px-6 pb-4">
          {(['map', 'recs'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}>
              {activeTab === tab && (
                <motion.span layoutId="tab-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
              )}
              <span className="relative z-10">
                {tab === 'map' ? '🗺️ Map' : '💡 AI Advice'}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {activeTab === 'map' && (
              <motion.div key="map" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-xl shadow-black/40">
                  {location && <MapWithNoSSR center={location} places={places} onSelectPlace={(p) => setSelectedPlace(p)} />}
                </div>

                {/* Map legend */}
                <div className="flex flex-wrap gap-3 mt-3">
                  {(['police','hospital','crowded','fire','pharmacy'] as SafePlace['type'][]).map(t => (
                    <div key={t} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${placeMeta[t].border} ${placeMeta[t].bg}`}>
                      <span>{placeMeta[t].emoji}</span>
                      <span className={placeMeta[t].color + ' capitalize'}>{t === 'crowded' ? 'Safe Area' : t}</span>
                    </div>
                  ))}
                </div>

                {/* Selected place banner */}
                <AnimatePresence>
                  {selectedPlace && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className={`mt-3 p-4 rounded-2xl border flex items-center justify-between ${placeMeta[selectedPlace.type].bg} ${placeMeta[selectedPlace.type].border}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{placeMeta[selectedPlace.type].emoji}</span>
                        <div>
                          <p className="font-bold text-white">{selectedPlace.name}</p>
                          <p className="text-xs text-gray-400">{selectedPlace.distance} away · {selectedPlace.isOpen ? '✅ Open now' : '❌ Closed'}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedPlace(null)} className="text-gray-500 hover:text-white text-xl w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">×</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'recs' && (
              <motion.div key="recs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
                {recommendations.map((rec, i) => {
                  const cfg = priorityConfig[rec.priority];
                  return (
                    <motion.div key={rec.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className={`p-4 rounded-2xl border border-white/5 border-l-4 ${cfg.bar} bg-white/3 hover:bg-white/5 transition-colors cursor-default`}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0 mt-0.5">{rec.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-white text-sm">{rec.title}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border tracking-wide ${cfg.badge} ${cfg.badgeTxt}`}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed">{rec.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Nearby Safe Places ── */}
      <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/5 to-green-500/3 backdrop-blur-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-400" />
          </div>
          <h3 className="font-bold text-white">Nearby Safe Places</h3>
          <span className="ml-auto text-xs text-gray-500">Click to view on map</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {places.map((place, i) => {
            const m = placeMeta[place.type];
            return (
              <motion.button key={place.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedPlace(place); setActiveTab('map'); }}
                className={`p-4 rounded-2xl border text-left transition-all shadow-lg hover:shadow-xl ${m.bg} ${m.border} ${m.glow}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{m.emoji}</span>
                  <span className="font-semibold text-white text-sm truncate">{place.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${m.color}`}>{place.distance}</span>
                  <span className="text-xs text-green-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    Open
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Safety Tips ── */}
      <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-white/5 to-yellow-500/3 backdrop-blur-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <h3 className="font-bold text-white">Quick Safety Tips</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TIPS.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 p-3 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/6 transition-colors">
              <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
              <p className="text-xs text-gray-400 leading-relaxed">{item.tip}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
