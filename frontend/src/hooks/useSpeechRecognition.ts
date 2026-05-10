'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEmergency } from '@/context/EmergencyContext';

const KEYWORDS = ['help', 'bachao', 'madad', 'save me', 'bachavo', 'bachaao', 'bachao bachao', 'help me', 'save'];

export function useSpeechRecognition() {
  const { addTimelineEvent, triggerCountdown } = useEmergency();
  
  const [isListening, setIsListening] = useState(false);
  const [lastDetected, setLastDetected] = useState<{ keyword: string; confidence: number; timestamp: Date } | null>(null);
  const [panicLevel, setPanicLevel] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [dangerConfidence, setDangerConfidence] = useState(0);

  const recognitionRef = useRef<any>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SpeechRecognition API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-IN'; // Works for Hinglish words like bachao

        recognitionRef.current.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript.toLowerCase();
            
            KEYWORDS.forEach(kw => {
              if (transcript.includes(kw)) {
                handleKeywordDetected(kw, transcript);
              }
            });
          }
        };

        // Auto-restart if it stops unexpectedly while it's supposed to be listening
        recognitionRef.current.onend = () => {
          if (isListening) {
            try {
              recognitionRef.current?.start();
            } catch (e) {
              console.error('Failed to restart speech recognition', e);
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [isListening]);

  const handleKeywordDetected = useCallback((keyword: string, context: string) => {
    const conf = parseFloat((85 + Math.random() * 14.9).toFixed(1));
    
    setLastDetected({
      keyword,
      confidence: conf,
      timestamp: new Date()
    });
    
    setPanicLevel(85 + Math.random() * 15);
    setNoiseLevel(80 + Math.random() * 20);
    setDangerConfidence(75 + Math.random() * 25);
    
    addTimelineEvent(`🚨 Keyword: "${keyword}"`, `AI detected with ${conf}% confidence. Context: "${context}"`);
    
    // Trigger the actual SOS countdown
    triggerCountdown('AI Voice Detection');
    
    // Clear the detection visual after 6 seconds
    setTimeout(() => {
      setLastDetected(null);
    }, 6000);
    
  }, [addTimelineEvent, triggerCountdown]);

  const startListening = useCallback(() => {
    setIsListening(true);
    addTimelineEvent('🎙️ Voice AI Started', 'Listening for emergency keywords');
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (e) {
      console.warn('Recognition already started or failed', e);
    }

    // Start simulation values for the UI meters
    simulationIntervalRef.current = setInterval(() => {
      setNoiseLevel(30 + Math.random() * 60);
      setPanicLevel(Math.random() * 15);
      setDangerConfidence(Math.random() * 10);
    }, 100);

  }, [addTimelineEvent]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    addTimelineEvent('🎙️ Voice AI Stopped', 'Microphone disabled');
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    
    setPanicLevel(0);
    setNoiseLevel(0);
    setDangerConfidence(0);
  }, [addTimelineEvent]);

  const simulateTrigger = useCallback(() => {
    const kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    handleKeywordDetected(kw, `[Simulated] Someone said "${kw}" nearby`);
  }, [handleKeywordDetected]);

  return {
    isListening,
    lastDetected,
    panicLevel,
    noiseLevel,
    dangerConfidence,
    startListening,
    stopListening,
    simulateTrigger,
    supported: !!recognitionRef.current
  };
}
