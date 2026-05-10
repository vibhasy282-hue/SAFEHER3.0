'use client';

import { useState, useRef, useCallback } from 'react';
import { recordingAPI } from '@/lib/api';
import { Video, Mic, Camera, StopCircle, Upload, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Props {
  emergencyActive?: boolean;
  location?: { latitude: number; longitude: number };
}

export default function EvidenceRecorder({ emergencyActive, location }: Props) {
  const [mode, setMode] = useState<'idle' | 'video' | 'audio'>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);

  const startRecording = useCallback(async (recMode: 'video' | 'audio') => {
    try {
      const constraints: MediaStreamConstraints = recMode === 'video'
        ? { video: { facingMode: 'user', width: 1280, height: 720 }, audio: true }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (recMode === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        await videoPreviewRef.current.play();
      }

      const mimeType = recMode === 'video'
        ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm')
        : (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm');

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType.split(';')[0] });
        await uploadEvidence(blob, recMode);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setMode(recMode);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error('Could not access media devices');
      console.error(error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  }, []);

  const uploadEvidence = async (blob: Blob, type: 'video' | 'audio') => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string);
        await recordingAPI.upload({
          type,
          data: base64,
          duration: recordingTime,
          location,
          isEvidence: emergencyActive || false,
        });
        toast.success(`${type === 'video' ? 'Video' : 'Audio'} evidence uploaded securely`);
        setMode('idle');
        setRecordingTime(0);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      toast.error('Upload failed');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-safeher-primary/20">
            <Upload className="w-5 h-5 text-safeher-primary" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Evidence Recorder</h3>
            <p className="text-xs text-safeher-muted">
              {emergencyActive ? 'Auto-recording enabled' : 'Record evidence manually'}
            </p>
          </div>
        </div>
        {emergencyActive && (
          <div className="flex items-center space-x-1 px-2 py-1 rounded bg-safeher-danger/20 border border-safeher-danger/30">
            <AlertCircle className="w-3 h-3 text-safeher-danger" />
            <span className="text-xs text-safeher-danger font-medium">Emergency</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            <button
              onClick={() => startRecording('video')}
              className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-safeher-primary/10 hover:border-safeher-primary/30 transition-all flex flex-col items-center space-y-2"
            >
              <Video className="w-8 h-8 text-safeher-primary" />
              <span className="text-sm text-white font-medium">Record Video</span>
            </button>
            <button
              onClick={() => startRecording('audio')}
              className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-safeher-primary/10 hover:border-safeher-primary/30 transition-all flex flex-col items-center space-y-2"
            >
              <Mic className="w-8 h-8 text-safeher-primary" />
              <span className="text-sm text-white font-medium">Record Audio</span>
            </button>
          </motion.div>
        )}

        {(mode === 'video' || mode === 'audio') && (
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {mode === 'video' && (
              <div className="relative rounded-xl overflow-hidden bg-black/50 aspect-video">
                <video ref={videoPreviewRef} className="w-full h-full object-cover" muted playsInline />
                {isRecording && (
                  <div className="absolute top-2 left-2 flex items-center space-x-2 px-2 py-1 rounded bg-safeher-danger/80 text-white text-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>REC {formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>
            )}

            {mode === 'audio' && (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-black/30">
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full bg-safeher-primary/20 flex items-center justify-center">
                    <Mic className="w-8 h-8 text-safeher-primary" />
                  </div>
                  {isRecording && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-safeher-primary/20 animate-ping" />
                      <span className="absolute -inset-2 rounded-full bg-safeher-primary/10 animate-pulse" />
                    </>
                  )}
                </div>
                <p className="text-2xl font-bold text-white">{formatTime(recordingTime)}</p>
                <p className="text-sm text-safeher-muted">{isRecording ? 'Recording...' : 'Processing...'}</p>
              </div>
            )}

            <div className="flex items-center justify-center">
              <button
                onClick={stopRecording}
                disabled={!isRecording || uploading}
                className="flex items-center space-x-2 px-6 py-3 bg-safeher-danger text-white rounded-xl font-medium hover:bg-safeher-danger/90 transition-colors disabled:opacity-50"
              >
                <StopCircle className="w-5 h-5" />
                <span>{uploading ? 'Uploading...' : 'Stop & Upload'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
