'use client';

import { useState } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import CountdownOverlay from './CountdownOverlay';
import ActionOverlay from './ActionOverlay';
import CallingOverlay from './CallingOverlay';
import FakeCallOverlay from './FakeCallOverlay';

interface CallingState {
  active: boolean;
  type: string;
  number: string;
  label: string;
  fallbackHint: string;
  fallbackData: string;
}

export default function EmergencyOverlays() {
  const { addTimelineEvent } = useEmergency();
  
  const [callState, setCallState] = useState<CallingState>({
    active: false,
    type: '',
    number: '',
    label: '',
    fallbackHint: '',
    fallbackData: '',
  });

  const handleActionSelect = (type: string, data: any) => {
    if (type === 'call') {
      setCallState({
        active: true,
        type: 'call',
        number: data.number,
        label: data.label,
        fallbackHint: 'If the dialer didn\'t open, copy this number and call manually.',
        fallbackData: data.number,
      });
      addTimelineEvent(`📞 Calling ${data.label}`, `Dialing ${data.number} via native call`);
      
      // Native trigger
      setTimeout(() => {
        window.location.href = `tel:${data.number}`;
      }, 300);
    } 
    else if (type === 'sms') {
      setCallState({
        active: true,
        type: 'sms',
        number: 'SMS',
        label: 'OPENING SMS APP',
        fallbackHint: 'If SMS app did not open, copy the numbers and message and send manually.',
        fallbackData: `To: ${data.number}\n\nMessage: ${decodeURIComponent(data.message)}`,
      });
      addTimelineEvent('✉️ SMS Alert', 'Opening SMS app with emergency message');
      
      // Native trigger
      setTimeout(() => {
        window.location.href = `sms:${data.number}?body=${data.message}`;
      }, 300);
    }
    else if (type === 'whatsapp') {
      setCallState({
        active: true,
        type: 'whatsapp',
        number: 'WA',
        label: 'OPENING WHATSAPP',
        fallbackHint: 'If WhatsApp did not open, copy the message from Share Location instead.',
        fallbackData: decodeURIComponent(data.message),
      });
      addTimelineEvent('💬 WhatsApp Alert', 'Opening WhatsApp with emergency message');
      
      // Native trigger
      setTimeout(() => {
        window.open(`https://wa.me/?text=${data.message}`, '_blank');
      }, 300);
    }
    else if (type === 'share') {
      setCallState({
        active: true,
        type: 'share',
        number: 'SHARE',
        label: 'SHARING LOCATION',
        fallbackHint: 'Native share not available. Copy the emergency message and paste anywhere.',
        fallbackData: decodeURIComponent(data.message),
      });
      addTimelineEvent('📤 Share Location', 'Attempting to share emergency location');
      
      if (navigator.share) {
        navigator.share({
          title: '🚨 SafeHer Emergency Alert',
          text: decodeURIComponent(data.message),
          url: data.locationUrl !== 'unavailable' ? data.locationUrl : undefined
        }).then(() => {
          setCallState(prev => ({ ...prev, active: false }));
        }).catch(() => {
          // Fallback UI will show
        });
      }
    }
  };

  return (
    <>
      <CountdownOverlay />
      <ActionOverlay onActionSelect={handleActionSelect} />
      <CallingOverlay callState={callState} onClose={() => setCallState(prev => ({ ...prev, active: false }))} />
      <FakeCallOverlay />
    </>
  );
}
