const logger = require('../utils/logger');

// Distress keywords database
const DISTRESS_KEYWORDS = [
  'help', 'save me', 'emergency', 'danger', 'stop', 'please no',
  'leave me alone', 'get away', 'dont touch me', 'im scared',
  'someone help', 'call police', '911', 'help me', 'screaming',
  'crying', 'panicking', 'afraid', 'terrified', 'threatening'
];

const PANIC_TONE_INDICATORS = [
  'high_pitch', 'rapid_speech', 'shouting', 'screaming',
  'trembling_voice', 'breathless', 'stuttering'
];

class VoiceAnalyzer {
  constructor() {
    this.isListening = false;
    this.confidenceThreshold = 0.7;
  }

  analyzeTranscript(transcript) {
    if (!transcript) return { isDistress: false, confidence: 0, keywords: [] };

    const lowerTranscript = transcript.toLowerCase();
    const detectedKeywords = DISTRESS_KEYWORDS.filter(keyword =>
      lowerTranscript.includes(keyword.toLowerCase())
    );

    const isDistress = detectedKeywords.length > 0;
    const confidence = Math.min(detectedKeywords.length * 0.3 + 0.2, 0.95);

    return {
      isDistress,
      confidence,
      keywords: detectedKeywords,
      threatLevel: confidence > 0.8 ? 'critical' : confidence > 0.5 ? 'high' : 'medium'
    };
  }

  analyzeTone(audioFeatures) {
    if (!audioFeatures) return { isPanic: false, confidence: 0 };

    const { pitch, volume, speed, tremor } = audioFeatures;
    let panicScore = 0;

    if (pitch > 300) panicScore += 0.3;
    if (volume > 0.8) panicScore += 0.2;
    if (speed > 1.5) panicScore += 0.2;
    if (tremor > 0.5) panicScore += 0.3;

    return {
      isPanic: panicScore > this.confidenceThreshold,
      confidence: panicScore,
      indicators: PANIC_TONE_INDICATORS.filter((_, i) => panicScore > 0.3 + i * 0.1)
    };
  }

  analyze(audioData) {
    try {
      const transcriptAnalysis = this.analyzeTranscript(audioData.transcript);
      const toneAnalysis = this.analyzeTone(audioData.audioFeatures);

      const combinedConfidence = (transcriptAnalysis.confidence + toneAnalysis.confidence) / 2;
      const isEmergency = transcriptAnalysis.isDistress || toneAnalysis.isPanic;

      return {
        isEmergency,
        confidence: Math.min(combinedConfidence, 0.95),
        transcriptAnalysis,
        toneAnalysis,
        recommendation: isEmergency ? 'trigger_sos' : 'monitor',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Voice analysis error:', error);
      return { isEmergency: false, confidence: 0, error: error.message };
    }
  }
}

module.exports = new VoiceAnalyzer();
