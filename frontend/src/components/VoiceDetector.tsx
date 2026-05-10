'use client';

import { useVoiceDetection } from '@/hooks/useVoiceDetection';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  enabled: boolean;
}

export default function VoiceDetector({ enabled }: Props) {
  const { isListening, lastTranscript, threatDetected } = useVoiceDetection(enabled);

  return (
    <div className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isListening ? 'bg-safeher-primary/20' : 'bg-white/5'}`}>
            {isListening ? <Mic className="w-5 h-5 text-safeher-primary" /> : <MicOff className="w-5 h-5 text-safeher-muted" />}
          </div>
          <div>
            <h3 className="text-white font-semibold">Voice Monitor</h3>
            <p className="text-xs text-safeher-muted">
              {isListening ? 'Listening for distress...' : 'Voice detection paused'}
            </p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-safeher-success animate-pulse' : 'bg-safeher-muted'}`} />
      </div>

      <AnimatePresence>
        {threatDetected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-safeher-danger/20 border border-safeher-danger/30 rounded-lg flex items-center space-x-2"
          >
            <AlertCircle className="w-5 h-5 text-safeher-danger" />
            <span className="text-sm text-safeher-danger font-medium">Distress detected in voice!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-black/30 rounded-lg p-3 min-h-[60px]">
        <p className="text-sm text-safeher-muted italic">
          {lastTranscript || 'Say something...'}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {['Help', 'Save me', 'Emergency', 'Danger', 'Stop'].map((word) => (
          <span key={word} className="text-xs px-2 py-1 rounded-full bg-white/5 text-safeher-muted border border-white/5">
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
