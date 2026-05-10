'use client';

import { useWebcam } from '@/hooks/useWebcam';
import { Camera, CameraOff, AlertCircle, Video, Square, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  enabled: boolean;
}

export default function WebcamMonitor({ enabled }: Props) {
  const {
    videoRef,
    canvasRef,
    overlayCanvasRef,
    isActive,
    emotion,
    fearDetected,
    modelsLoaded,
    isRecording,
    startRecording,
    stopRecording,
  } = useWebcam(enabled);

  const emotionColor: Record<string, string> = {
    neutral: 'text-gray-400',
    happy: 'text-green-400',
    sad: 'text-blue-400',
    angry: 'text-orange-400',
    fearful: 'text-red-400',
    surprised: 'text-yellow-400',
  };

  const currentColor = emotionColor[emotion] || 'text-gray-400';

  return (
    <div className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-safeher-primary/20' : 'bg-white/5'}`}>
            {isActive ? <Camera className="w-5 h-5 text-safeher-primary" /> : <CameraOff className="w-5 h-5 text-safeher-muted" />}
          </div>
          <div>
            <h3 className="text-white font-semibold">Webcam Monitor</h3>
            <p className="text-xs text-safeher-muted">
              {isActive ? (modelsLoaded ? 'AI models active' : 'Camera active - AI fallback') : 'Webcam inactive'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {modelsLoaded && (
            <span className="text-xs text-safeher-success flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>AI Ready</span>
            </span>
          )}
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-safeher-success animate-pulse' : 'bg-safeher-muted'}`} />
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <canvas ref={canvasRef} className="hidden" />

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <CameraOff className="w-12 h-12 text-safeher-muted/30" />
          </div>
        )}

        <AnimatePresence>
          {fearDetected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 border-4 border-safeher-danger animate-pulse"
            />
          )}
        </AnimatePresence>

        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 text-xs font-medium capitalize">
          <span className={currentColor}>{emotion}</span>
        </div>

        {isActive && (
          <div className="absolute bottom-2 right-2 flex items-center space-x-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-safeher-danger/80 text-white animate-pulse'
                  : 'bg-black/60 text-white hover:bg-black/80'
              }`}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {fearDetected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 p-3 bg-safeher-danger/20 border border-safeher-danger/30 rounded-lg flex items-center space-x-2"
          >
            <AlertCircle className="w-5 h-5 text-safeher-danger" />
            <span className="text-sm text-safeher-danger font-medium">Fear emotion detected!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
