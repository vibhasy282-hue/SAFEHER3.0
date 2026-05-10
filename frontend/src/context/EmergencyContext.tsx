'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  desc: string;
}

interface EmergencyContextType {
  countdown: { active: boolean; timeLeft: number; triggerName: string };
  sosActive: boolean;
  fakeCallActive: boolean;
  timeline: TimelineEvent[];
  triggerCountdown: (triggerName: string) => void;
  cancelCountdown: () => void;
  activateSOS: () => void;
  cancelSOS: () => void;
  triggerFakeCall: () => void;
  endFakeCall: () => void;
  addTimelineEvent: (title: string, desc: string) => void;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export function EmergencyProvider({ children }: { children: ReactNode }) {
  const [countdown, setCountdown] = useState({ active: false, timeLeft: 5, triggerName: '' });
  const [sosActive, setSosActive] = useState(false);
  const [fakeCallActive, setFakeCallActive] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  // Load timeline from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('safeher_timeline');
      if (saved) {
        try {
          setTimeline(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse timeline', e);
        }
      }
    }
  }, []);

  const addTimelineEvent = (title: string, desc: string) => {
    const newEvent: TimelineEvent = {
      id: Math.random().toString(36).substring(7),
      time: new Date().toISOString(),
      title,
      desc,
    };
    setTimeline((prev) => {
      const updated = [newEvent, ...prev].slice(0, 50); // Keep last 50
      if (typeof window !== 'undefined') {
        localStorage.setItem('safeher_timeline', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const triggerCountdown = (triggerName: string) => {
    if (countdown.active || sosActive) return; // Prevent multiple triggers
    setCountdown({ active: true, timeLeft: 5, triggerName });
    addTimelineEvent(triggerName, 'Hidden SOS trigger activated. Countdown started.');
  };

  const cancelCountdown = () => {
    setCountdown({ active: false, timeLeft: 5, triggerName: '' });
    addTimelineEvent('⚠️ Countdown Cancelled', 'User manually cancelled emergency countdown.');
  };

  const activateSOS = () => {
    setCountdown({ active: false, timeLeft: 5, triggerName: '' });
    setSosActive(true);
    addTimelineEvent('🚨 SOS ACTIVATED', 'Emergency alert triggered!');
    
    // Attempt to vibrate if supported
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 1000]);
    }
  };

  const cancelSOS = () => {
    setSosActive(false);
    addTimelineEvent('✋ SOS Closed', 'User dismissed the emergency action screen.');
  };

  const triggerFakeCall = () => {
    setFakeCallActive(true);
    addTimelineEvent('📞 Fake Call Triggered', 'Simulated incoming police call');
    // Auto-end fake call after 60 seconds if not answered/declined
    setTimeout(() => {
      setFakeCallActive(false);
    }, 60000);
  };

  const endFakeCall = () => {
    setFakeCallActive(false);
  };

  // Handle countdown timer tick
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown.active && countdown.timeLeft > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (countdown.active && countdown.timeLeft === 0) {
      activateSOS();
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <EmergencyContext.Provider
      value={{
        countdown,
        sosActive,
        fakeCallActive,
        timeline,
        triggerCountdown,
        cancelCountdown,
        activateSOS,
        cancelSOS,
        triggerFakeCall,
        endFakeCall,
        addTimelineEvent,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  const context = useContext(EmergencyContext);
  if (context === undefined) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
}
