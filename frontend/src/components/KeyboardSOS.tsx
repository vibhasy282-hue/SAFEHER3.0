'use client';

import { useEffect, useRef } from 'react';
import { emergencyAPI } from '@/lib/api';
import toast from 'react-hot-toast';

let shiftCount = 0;
let shiftTimer: any = null;

export default function KeyboardSOS() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret shortcut: Ctrl + Alt + S
      if (e.ctrlKey && e.altKey && e.key === 's') {
        e.preventDefault();
        triggerSilentSOS();
        return;
      }

      // Secret shortcut: Shift 5 times rapidly
      if (e.key === 'Shift') {
        shiftCount++;
        if (!shiftTimer) {
          shiftTimer = setTimeout(() => {
            shiftCount = 0;
            shiftTimer = null;
          }, 1000);
        }
        if (shiftCount >= 5) {
          shiftCount = 0;
          clearTimeout(shiftTimer);
          shiftTimer = null;
          triggerSilentSOS();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerSilentSOS = async () => {
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await emergencyAPI.triggerSOS({
          type: 'keyboard_sos',
          location: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          },
          triggeredBy: 'user',
        });
        toast.success('Silent SOS activated', { icon: '\u{1F6A8}' });
      });
    } catch (error) {
      console.error('Silent SOS failed:', error);
    }
  };

  return null;
}
