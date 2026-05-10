const logger = require('../utils/logger');

class GestureRecognizer {
  constructor() {
    this.gestureBuffer = [];
    this.bufferSize = 30;
    this.sosGestureThreshold = 3;
  }

  detectOpenPalm(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;

    // Check if fingers are extended (tip y < pip y for each finger)
    const fingerTips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
    const fingerPIPs = [6, 10, 14, 18]; // Corresponding PIP joints

    let extendedCount = 0;
    for (let i = 0; i < fingerTips.length; i++) {
      if (landmarks[fingerTips[i]].y < landmarks[fingerPIPs[i]].y) {
        extendedCount++;
      }
    }

    return extendedCount >= 3;
  }

  detectWavingMotion(landmarksHistory) {
    if (!landmarksHistory || landmarksHistory.length < 10) return { isWaving: false, repetitions: 0 };

    const wristPositions = landmarksHistory.map(l => l[0].x);
    let directionChanges = 0;
    let lastDirection = 0;

    for (let i = 1; i < wristPositions.length; i++) {
      const diff = wristPositions[i] - wristPositions[i - 1];
      if (Math.abs(diff) > 0.05) {
        const direction = diff > 0 ? 1 : -1;
        if (direction !== lastDirection && lastDirection !== 0) {
          directionChanges++;
        }
        lastDirection = direction;
      }
    }

    const repetitions = Math.floor(directionChanges / 2);
    return { isWaving: repetitions >= 1, repetitions };
  }

  processLandmarks(landmarks) {
    try {
      this.gestureBuffer.push(landmarks);
      if (this.gestureBuffer.length > this.bufferSize) {
        this.gestureBuffer.shift();
      }

      const isOpenPalm = this.detectOpenPalm(landmarks);
      const waveResult = this.detectWavingMotion(this.gestureBuffer);

      const isSOSGesture = isOpenPalm && waveResult.isWaving && waveResult.repetitions >= this.sosGestureThreshold;

      return {
        isSOSGesture,
        confidence: isSOSGesture ? 0.85 : waveResult.repetitions > 0 ? 0.5 : 0.2,
        gesture: isSOSGesture ? 'open_palm_wave_sos' : isOpenPalm ? 'open_palm' : 'none',
        repetitions: waveResult.repetitions,
        isOpenPalm,
        recommendation: isSOSGesture ? 'trigger_sos' : 'monitor',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Gesture recognition error:', error);
      return { isSOSGesture: false, confidence: 0, error: error.message };
    }
  }

  reset() {
    this.gestureBuffer = [];
  }
}

module.exports = new GestureRecognizer();
