const logger = require('../utils/logger');

// Emotion thresholds
const FEAR_THRESHOLD = 0.6;
const SADNESS_THRESHOLD = 0.7;
const SURPRISE_THRESHOLD = 0.8;

class EmotionDetector {
  constructor() {
    this.isMonitoring = false;
    this.frameBuffer = [];
    this.bufferSize = 10;
  }

  analyzeEmotions(faceData) {
    if (!faceData || !faceData.expressions) {
      return { isFearDetected: false, confidence: 0, emotions: {} };
    }

    const emotions = faceData.expressions;
    const fearLevel = emotions.fear || 0;
    const sadLevel = emotions.sad || 0;
    const surprisedLevel = emotions.surprised || 0;
    const angryLevel = emotions.angry || 0;

    // Weighted scoring
    let dangerScore = 0;
    if (fearLevel > FEAR_THRESHOLD) dangerScore += fearLevel * 0.5;
    if (sadLevel > SADNESS_THRESHOLD) dangerScore += sadLevel * 0.3;
    if (surprisedLevel > SURPRISE_THRESHOLD) dangerScore += surprisedLevel * 0.1;
    if (angryLevel > 0.6) dangerScore += angryLevel * 0.1;

    const isFearDetected = dangerScore > 0.5;

    return {
      isFearDetected,
      confidence: Math.min(dangerScore, 0.95),
      emotions: {
        fear: fearLevel,
        sad: sadLevel,
        surprised: surprisedLevel,
        angry: angryLevel,
        happy: emotions.happy || 0,
        neutral: emotions.neutral || 0
      },
      threatLevel: dangerScore > 0.8 ? 'critical' : dangerScore > 0.6 ? 'high' : 'medium'
    };
  }

  detectSuddenMovement(currentFrame, previousFrame) {
    if (!currentFrame || !previousFrame) return { hasSuddenMovement: false, magnitude: 0 };

    const dx = (currentFrame.x || 0) - (previousFrame.x || 0);
    const dy = (currentFrame.y || 0) - (previousFrame.y || 0);
    const magnitude = Math.sqrt(dx * dx + dy * dy);

    return {
      hasSuddenMovement: magnitude > 50,
      magnitude,
      direction: { x: dx, y: dy }
    };
  }

  processFrame(frameData) {
    try {
      this.frameBuffer.push(frameData);
      if (this.frameBuffer.length > this.bufferSize) {
        this.frameBuffer.shift();
      }

      const emotionResult = this.analyzeEmotions(frameData);

      let movementResult = { hasSuddenMovement: false, magnitude: 0 };
      if (this.frameBuffer.length >= 2) {
        movementResult = this.detectSuddenMovement(
          this.frameBuffer[this.frameBuffer.length - 1],
          this.frameBuffer[this.frameBuffer.length - 2]
        );
      }

      const isEmergency = emotionResult.isFearDetected || movementResult.hasSuddenMovement;

      return {
        isEmergency,
        confidence: emotionResult.confidence,
        emotionResult,
        movementResult,
        recommendation: isEmergency ? 'trigger_sos' : 'monitor',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Emotion detection error:', error);
      return { isEmergency: false, confidence: 0, error: error.message };
    }
  }
}

module.exports = new EmotionDetector();
