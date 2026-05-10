'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { aiAPI } from '@/lib/api';

const DISTRESS_KEYWORDS = ['help', 'save me', 'emergency', 'danger', 'stop', 'please no', 'help me', 'screaming'];

export function useVoiceDetection(enabled: boolean = true) {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [threatDetected, setThreatDetected] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Audio context for tone analysis
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;

    const initializeAudioAnalysis = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 2048;
      } catch (error) {
        console.warn('Audio analysis not available:', error);
      }
    };

    const analyzeTone = (): { isPanic: boolean; confidence: number } => {
      if (!analyser) return { isPanic: false, confidence: 0 };

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Calculate average frequency and volume
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const highFreq = dataArray.slice(bufferLength * 0.7).reduce((a, b) => a + b) / (bufferLength * 0.3);
      
      // Panic indicators: high pitch, high volume
      const isHighPitch = highFreq > average * 1.5;
      const isHighVolume = average > 100;
      
      const panicScore = (isHighPitch ? 0.5 : 0) + (isHighVolume ? 0.5 : 0);
      
      return {
        isPanic: panicScore > 0.7,
        confidence: panicScore
      };
    };

    recognition.onresult = async (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ');

      setLastTranscript(transcript);

      const lowerTranscript = transcript.toLowerCase();
      const hasKeyword = DISTRESS_KEYWORDS.some(k => lowerTranscript.includes(k));
      const toneAnalysis = analyzeTone();

      const isEmergency = hasKeyword || toneAnalysis.isPanic;

      if (isEmergency) {
        setThreatDetected(true);
        try {
          await aiAPI.analyzeVoice({
            transcript,
            audioFeatures: {
              pitch: toneAnalysis.confidence * 300,
              volume: toneAnalysis.confidence,
              speed: 1.2,
              tremor: toneAnalysis.confidence * 0.6
            },
            confidence: Math.max(0.85, toneAnalysis.confidence),
            keywords: DISTRESS_KEYWORDS.filter(k => lowerTranscript.includes(k)),
            emotion: toneAnalysis.isPanic ? 'panic' : 'fear',
            isPanic: toneAnalysis.isPanic
          });
        } catch (e) {
          console.error('Voice analysis API error:', e);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
    };

    initializeAudioAnalysis();
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [enabled, startListening, stopListening]);

  return { isListening, lastTranscript, threatDetected, startListening, stopListening };
}
