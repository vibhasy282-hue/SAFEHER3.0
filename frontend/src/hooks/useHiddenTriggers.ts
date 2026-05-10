'use client';

import { useEffect, useRef } from 'react';
import { useEmergency } from '@/context/EmergencyContext';

export function useHiddenTriggers() {
  const { triggerCountdown } = useEmergency();
  
  // Power trigger state (Triple 'p' press)
  const powerPresses = useRef(0);
  const powerTimer = useRef<NodeJS.Timeout | null>(null);

  // Volume trigger state (Long 'v' hold)
  const volumeHeld = useRef(false);
  const volumeTimer = useRef<NodeJS.Timeout | null>(null);

  // Shake trigger state
  const shakeCount = useRef(0);
  const lastShake = useRef(0);

  useEffect(() => {
    // === KEYBOARD SHORTCUTS (Mocks for hardware buttons) ===
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // 1. Triple Power Press (Mocked with 'P' key)
      if (e.key === 'p' || e.key === 'P') {
        powerPresses.current += 1;
        
        if (powerTimer.current) clearTimeout(powerTimer.current);
        
        powerTimer.current = setTimeout(() => {
          powerPresses.current = 0;
        }, 800);

        if (powerPresses.current >= 3) {
          powerPresses.current = 0;
          triggerCountdown('Triple Power Press');
        }
      }

      // 2. Long Volume Press (Mocked with 'V' key hold)
      if (e.key === 'v' || e.key === 'V') {
        if (!volumeHeld.current) {
          volumeHeld.current = true;
          volumeTimer.current = setTimeout(() => {
            volumeHeld.current = false;
            triggerCountdown('Long Volume Press');
          }, 1500); // 1.5 seconds hold
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'v' || e.key === 'V') {
        volumeHeld.current = false;
        if (volumeTimer.current) clearTimeout(volumeTimer.current);
      }
    };

    // === SHAKE DETECTION ===
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      
      const total = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);
      
      if (total > 20) {
        const now = Date.now();
        // Reset shake count if more than 400ms between shakes
        if (now - lastShake.current > 400) {
          shakeCount.current = 0;
        }
        
        shakeCount.current += 1;
        lastShake.current = now;
        
        if (shakeCount.current >= 3) {
          shakeCount.current = 0;
          triggerCountdown('Shake Detection');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Only add devicemotion if running on a device that supports it (e.g. mobile)
    if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion);
      }
      if (powerTimer.current) clearTimeout(powerTimer.current);
      if (volumeTimer.current) clearTimeout(volumeTimer.current);
    };
  }, [triggerCountdown]);
}
