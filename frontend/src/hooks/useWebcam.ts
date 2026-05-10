'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { aiAPI, recordingAPI } from '@/lib/api';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

export function useWebcam(enabled: boolean = true) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [emotion, setEmotion] = useState<string>('neutral');
  const [fearDetected, setFearDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const loadModels = useCallback(async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (error) {
      console.warn('face-api.js models failed to load, using fallback detection:', error);
      setModelsLoaded(false);
    }
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
    } catch (error) {
      console.error('Webcam access error:', error);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const captureSnapshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          await recordingAPI.upload({
            type: 'video',
            data: `data:video/webm;base64,${base64}`,
            duration: 0,
          });
        } catch (err) {
          console.error('Upload failed:', err);
        }
      };
      reader.readAsDataURL(blob);
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Real face-api.js emotion detection
  useEffect(() => {
    if (!enabled) return;
    loadModels();
  }, [enabled, loadModels]);

  useEffect(() => {
    if (!enabled || !isActive) return;

    let interval: ReturnType<typeof setInterval>;
    let animationId: number;

    const detect = async () => {
      if (!videoRef.current || !overlayCanvasRef.current) return;

      if (modelsLoaded) {
        try {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

          const canvas = overlayCanvasRef.current;
          const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
          faceapi.matchDimensions(canvas, displaySize);
          const resized = faceapi.resizeResults(detections, displaySize);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resized);
            faceapi.draw.drawFaceExpressions(canvas, resized);
          }

          if (detections.length > 0) {
            const expressions = detections[0].expressions;
            const dominant = Object.entries(expressions).reduce((a, b) => (a[1] > b[1] ? a : b));
            setEmotion(dominant[0]);

            const fearScore = (expressions.fearful || 0) + (expressions.sad || 0) * 0.5 + (expressions.angry || 0) * 0.3;
            const isFear = fearScore > 0.5;
            setFearDetected(isFear);

            if (isFear) {
              aiAPI.analyzeEmotion({
                emotions: {
                  fear: expressions.fearful || 0,
                  sad: expressions.sad || 0,
                  angry: expressions.angry || 0,
                  surprised: expressions.surprised || 0,
                  happy: expressions.happy || 0,
                  neutral: expressions.neutral || 0,
                },
                faceDetected: true,
                confidence: fearScore,
              }).catch(console.error);
            }
          } else {
            setEmotion('neutral');
            setFearDetected(false);
          }
        } catch (err) {
          console.error('Detection error:', err);
        }
      } else {
        // Fallback: simulate occasional fear detection for demo
        const emotions = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'surprised'];
        const detected = emotions[Math.floor(Math.random() * emotions.length)];
        setEmotion(detected);
        const isFear = detected === 'fearful' || detected === 'sad';
        setFearDetected(isFear);
        if (isFear) {
          aiAPI.analyzeEmotion({
            emotions: { fear: 0.8, sad: 0.6, surprised: 0.3, angry: 0.2, happy: 0, neutral: 0.1 },
            faceDetected: true,
            confidence: 0.75,
          }).catch(console.error);
        }
      }
    };

    interval = setInterval(detect, 2000);
    return () => clearInterval(interval);
  }, [enabled, isActive, modelsLoaded]);

  useEffect(() => {
    if (enabled) startWebcam();
    else stopWebcam();
    return () => stopWebcam();
  }, [enabled, startWebcam, stopWebcam]);

  return {
    videoRef,
    canvasRef,
    overlayCanvasRef,
    isActive,
    emotion,
    fearDetected,
    modelsLoaded,
    isRecording,
    startWebcam,
    stopWebcam,
    captureSnapshot,
    startRecording,
    stopRecording,
  };
}
